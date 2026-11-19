import { z } from "zod";

const requestSchema = z.object({
  hostelId: z.string().trim().min(1).optional(),
  messages: z.array(z.object({
    role: z.enum(["user", "assistant", "model"]),
    content: z.string().max(4000),
  })).min(1).max(20),
});

const aiResponseSchema = z.object({
  success: z.literal(true),
  answer: z.string().trim().min(1).max(5000),
  summary: z.string().trim().min(1).max(1000),
  keyInsights: z.array(z.string().trim().min(1).max(500)).max(8),
  recommendations: z.array(z.string().trim().min(1).max(500)).max(8),
  error: z.null(),
}).strict();

const responseSchema = z.object({
  success: z.boolean(),
  answer: z.string(),
  summary: z.string(),
  keyInsights: z.array(z.string()),
  recommendations: z.array(z.string()),
  error: z.object({
    code: z.string(),
    message: z.string(),
  }).nullable(),
  dataStatus: z.enum(["available", "empty"]).nullable(),
}).strict();

const objectIdPattern = /^[a-f\d]{24}$/i;
const openRouterModels = [
  "google/gemma-4-31b-it:free",
  "inclusionai/ling-3.2-flash:free",
  "baidu/ernie-5.5-flash-preview:free",
];

function getTextContent(content) {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return null;

  const text = content
    .map((part) => typeof part === "string" ? part : part?.text)
    .filter((part) => typeof part === "string")
    .join("");

  return text || null;
}

function getProviderContent(providerData) {
  const message = providerData?.choices?.[0]?.message;
  return getTextContent(message?.content ?? providerData?.choices?.[0]?.text);
}

function jsonResponse(payload, status) {
  return Response.json(responseSchema.parse(payload), {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function errorResponse(code, message, status, dataStatus = null) {
  return jsonResponse({
    success: false,
    answer: "",
    summary: "",
    keyInsights: [],
    recommendations: [],
    error: { code, message },
    dataStatus,
  }, status);
}

function hasUsefulData(context) {
  const hasRecords = [
    context.students,
    context.complaints,
    context.fees,
  ].some((records) => records.length > 0);
  const hasPositiveStats = Object.values(context.stats || {}).some(
    (value) => typeof value === "number" && value > 0
  );
  const hasComplaintCounts = Object.values(context.complaintStats || {}).some(
    (value) => typeof value === "number" && value > 0
  );
  return hasRecords || hasPositiveStats || hasComplaintCounts;
}

function createSystemPrompt(role, context) {
  return `You are HostelHub Intel, a helpful conversational assistant for hostel operations.
Answer greetings, explanations, general questions, and operational how-to questions naturally and directly. General guidance may use your general knowledge, but label it as general guidance and do not present it as a fact about this hostel.
For questions about this user's hostel, account, records, or business metrics, use only the authorized supplied context. Never invent or estimate business data, counts, dates, or money. If the context does not contain enough information, say so plainly. Keep recommendations clearly identified as suggestions.
For data, report, comparison, or list requests, use a concise heading, a short summary, and a Markdown table when multiple records or metrics make a table clearer. Keep table columns readable and include only fields present in the context. State when the supplied context is limited; never imply that a partial list is complete.
For PDF or Word requests, return the complete report content in a well-structured format. Do not claim a file was created; the user can download the answer using the export controls.
Return only one valid JSON object, with exactly these fields:
{"success":true,"answer":"A direct answer","summary":"A concise summary","keyInsights":["Fact supported by context"],"recommendations":["Actionable suggestion"],"error":null}
Use Markdown inside the answer string where it improves readability. Use empty arrays when there are no supported insights or recommendations. Do not wrap the JSON object in markdown fences.
The authenticated user's role is ${role}.

HOSTEL CONTEXT:
${JSON.stringify(context)}`;
}

export function createIntelPostHandler(dependencies) {
  const logError = (message, error) => {
    dependencies.logger?.error(message, error);
  };

  return async function POST(request) {
    let session;
    try {
      session = await dependencies.protect(request);
    } catch (error) {
      logError("[Intel] Authentication check failed:", error);
      return errorResponse("AUTHENTICATION_FAILED", "Unable to verify your session.", 500);
    }

    if (!session) {
      return errorResponse("UNAUTHORIZED", "Please sign in to use HostelHub Intel.", 401);
    }

    if (!["admin", "super_admin", "student"].includes(session.role)) {
      return errorResponse("FORBIDDEN", "Your account cannot access HostelHub Intel.", 403);
    }

    if (typeof session.userId !== "string" || !objectIdPattern.test(session.userId)) {
      return errorResponse("INVALID_SESSION", "Your session is invalid. Please sign in again.", 401);
    }

    let body;
    try {
      body = requestSchema.parse(await request.json());
    } catch {
      return errorResponse("INVALID_REQUEST", "Provide a valid hostel and a non-empty conversation.", 400);
    }

    if (body.messages[body.messages.length - 1].role !== "user") {
      return errorResponse("INVALID_REQUEST", "The latest conversation message must be from the user.", 400);
    }

    const hostelId = session.role === "student"
      ? String(session.hostelId || "")
      : body.hostelId || String(session.hostelId || "");

    if (!objectIdPattern.test(hostelId)) {
      return errorResponse("INVALID_HOSTEL", "A valid hostel context is required.", 400);
    }

    const apiKey = dependencies.getApiKey();
    if (!apiKey) {
      return errorResponse("AI_NOT_CONFIGURED", "HostelHub Intel is not configured. Contact your administrator.", 503);
    }

    let context;
    try {
      await dependencies.dbConnect();
      const hasAccess = await dependencies.authorizeHostel(session, hostelId);
      if (!hasAccess) {
        return errorResponse("FORBIDDEN", "You do not have access to this hostel's data.", 403);
      }

      context = session.role === "student"
        ? await dependencies.loadStudentContext(session.userId, hostelId)
        : await dependencies.loadAdminContext(hostelId);
    } catch (error) {
      logError("[Intel] Hostel data retrieval failed:", error);
      return errorResponse(
        "DATA_RETRIEVAL_FAILED",
        "Hostel data could not be retrieved. No AI answer was generated.",
        503
      );
    }

    if (!context) {
      return errorResponse("FORBIDDEN", "Your student record does not belong to this hostel.", 403);
    }

    const dataStatus = hasUsefulData(context) ? "available" : "empty";
    const formattedMessages = [
      { role: "system", content: createSystemPrompt(session.role, context) },
      ...body.messages.map((message) => ({
        role: message.role === "user" ? "user" : "assistant",
        content: message.content,
      })),
    ];

    let providerResponse;
    let providerData;
    try {
      providerResponse = await dependencies.fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "HTTP-Referer": "https://hostelhub.vercel.app",
            "X-Title": "HostelHub Intel",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            models: openRouterModels,
            messages: formattedMessages,
            response_format: { type: "json_object" },
            temperature: 0.2,
            max_tokens: 1200,
          }),
          signal: AbortSignal.timeout(30000),
        }
      );
    } catch (error) {
      logError("[Intel] AI provider request failed:", error);
      return errorResponse("AI_PROVIDER_ERROR", "HostelHub Intel is temporarily unavailable. Please try again later.", 502, dataStatus);
    }

    if ([402, 429].includes(providerResponse.status)) {
      logError("[Intel] OpenRouter usage limit reached:", providerResponse.status);
      return errorResponse(
        "AI_RATE_LIMITED",
        "HostelHub Intel is temporarily busy. Please try again later.",
        503,
        dataStatus
      );
    }

    if (!providerResponse.ok) {
      logError("[Intel] AI provider returned an error:", providerResponse.status);
      if (providerResponse.status === 404) {
        return errorResponse(
          "AI_MODEL_UNAVAILABLE",
          "HostelHub Intel is temporarily unavailable. Please try again later.",
          502,
          dataStatus
        );
      }

      return errorResponse(
        "AI_PROVIDER_ERROR",
        "HostelHub Intel couldn't complete your request. Please try again later.",
        502,
        dataStatus
      );
    }

    try {
      providerData = await providerResponse.json();
    } catch (error) {
      logError("[Intel] OpenRouter returned unreadable JSON:", error);
      return errorResponse(
        "AI_INVALID_RESPONSE",
        "HostelHub Intel couldn't prepare an answer right now. Please try again.",
        502,
        dataStatus
      );
    }

    const content = getProviderContent(providerData);
    if (typeof content !== "string") {
      if (providerData?.error) {
        logError("[Intel] OpenRouter returned an error payload.");
        return errorResponse(
          "AI_PROVIDER_ERROR",
          "HostelHub Intel couldn't generate an answer right now. Please try again.",
          502,
          dataStatus
        );
      }

      logError("[Intel] OpenRouter returned no text content.");
      return errorResponse(
        "AI_EMPTY_RESPONSE",
        "HostelHub Intel couldn't prepare an answer right now. Please try again.",
        502,
        dataStatus
      );
    }

    let parsedContent;
    try {
      parsedContent = aiResponseSchema.safeParse(JSON.parse(content));
    } catch {
      parsedContent = { success: false };
    }

    if (!parsedContent.success) {
      logError("[Intel] AI provider response did not match the required schema.");
      return errorResponse("AI_INVALID_RESPONSE", "HostelHub Intel couldn't prepare an answer right now. Please try again.", 502, dataStatus);
    }

    return jsonResponse({
      ...parsedContent.data,
      dataStatus,
    }, 200);
  };
}
