import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createIntelPostHandler } from "./intel-handler.js";

const validModelOutput = {
  success: true,
  answer: "There are no pending complaints in the supplied data.",
  summary: "No pending complaints are recorded.",
  keyInsights: ["The pending complaint count is zero."],
  recommendations: ["Continue monitoring incoming complaints."],
  error: null,
};

const emptyContext = {
  stats: {},
  complaintStats: {},
  students: [],
  complaints: [],
  fees: [],
};

function createRequest(messages = [{ role: "user", content: "Summarize complaints." }]) {
  return new Request("http://localhost/api/intel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ hostelId: "507f1f77bcf86cd799439011", messages }),
  });
}

function makeHandler(overrides = {}) {
  const dependencies = {
    protect: async () => ({ userId: "507f191e810c19729de860ea", role: "admin" }),
    dbConnect: async () => {},
    authorizeHostel: async () => true,
    loadAdminContext: async () => emptyContext,
    loadStudentContext: async () => emptyContext,
    getApiKey: () => "test-api-key",
    fetch: async () => Response.json({
      choices: [{ message: { content: JSON.stringify(validModelOutput) } }],
    }),
    logger: { error() {} },
    ...overrides,
  };

  return createIntelPostHandler(dependencies);
}

async function call(handler) {
  const response = await handler(createRequest());
  return { status: response.status, body: await response.json() };
}

describe("HostelHub Intel handler", () => {
  it("reports database failures instead of treating failed queries as empty data", async () => {
    const handler = makeHandler({
      loadAdminContext: async () => {
        throw new Error("database unavailable");
      },
    });

    const { status, body } = await call(handler);
    assert.equal(status, 503);
    assert.equal(body.success, false);
    assert.equal(body.error.code, "DATA_RETRIEVAL_FAILED");
    assert.equal(body.dataStatus, null);
  });

  it("marks successfully retrieved empty datasets as empty", async () => {
    const { status, body } = await call(makeHandler());

    assert.equal(status, 200);
    assert.equal(body.success, true);
    assert.equal(body.dataStatus, "empty");
    assert.equal(body.error, null);
  });

  it("returns validated structured AI output", async () => {
    const context = { ...emptyContext, stats: { totalStudents: 12 } };
    const { status, body } = await call(makeHandler({
      loadAdminContext: async () => context,
    }));

    assert.equal(status, 200);
    assert.deepEqual(body, { ...validModelOutput, dataStatus: "available" });
  });

  it("accepts text-block provider content and preserves Markdown report tables", async () => {
    const tableAnswer = "## Complaint report\n\n| Status | Count |\n| --- | ---: |\n| Pending | 2 |";
    const output = { ...validModelOutput, answer: tableAnswer };
    const { status, body } = await call(makeHandler({
      fetch: async () => Response.json({
        choices: [{ message: { content: [{ type: "text", text: JSON.stringify(output) }] } }],
      }),
    }));

    assert.equal(status, 200);
    assert.equal(body.answer, tableAnswer);
  });

  it("returns a clear error when the AI provider fails", async () => {
    let requestCount = 0;
    const { status, body } = await call(makeHandler({
      fetch: async (url) => {
        requestCount += 1;
        assert.equal(url, "https://openrouter.ai/api/v1/chat/completions");
        return new Response("rate limited", { status: 429 });
      },
    }));

    assert.equal(requestCount, 1);
    assert.equal(status, 503);
    assert.equal(body.success, false);
    assert.equal(body.error.code, "AI_RATE_LIMITED");
    assert.match(body.error.message, /HostelHub Intel/i);
    assert.doesNotMatch(body.error.message, /OpenRouter|provider/i);
  });

  it("identifies unavailable OpenRouter model endpoints", async () => {
    const { status, body } = await call(makeHandler({
      fetch: async () => new Response("not found", { status: 404 }),
    }));

    assert.equal(status, 502);
    assert.equal(body.success, false);
    assert.equal(body.error.code, "AI_MODEL_UNAVAILABLE");
    assert.match(body.error.message, /HostelHub Intel/i);
    assert.doesNotMatch(body.error.message, /OpenRouter|provider/i);
  });

  it("rejects malformed or schema-invalid AI output", async () => {
    const { status, body } = await call(makeHandler({
      fetch: async () => Response.json({
        choices: [{ message: { content: '{"success":true,"answer":"partial"}' } }],
      }),
    }));

    assert.equal(status, 502);
    assert.equal(body.success, false);
    assert.equal(body.error.code, "AI_INVALID_RESPONSE");
  });

  it("reports an empty AI answer without inventing a response", async () => {
    const { status, body } = await call(makeHandler({
      fetch: async () => Response.json(null),
    }));

    assert.equal(status, 502);
    assert.equal(body.error.code, "AI_EMPTY_RESPONSE");
    assert.match(body.error.message, /HostelHub Intel/i);
    assert.doesNotMatch(body.error.message, /OpenRouter|provider/i);
  });

  it("reports provider error payloads without exposing upstream details", async () => {
    const { status, body } = await call(makeHandler({
      fetch: async () => Response.json({ error: { message: "provider internal details" } }),
    }));

    assert.equal(status, 502);
    assert.equal(body.error.code, "AI_PROVIDER_ERROR");
    assert.doesNotMatch(body.error.message, /provider internal details/i);
  });

  it("reports unreadable AI output without exposing provider details", async () => {
    let requestCount = 0;
    const handler = makeHandler({
      fetch: async () => {
        requestCount += 1;
        return new Response("<html>upstream error</html>", {
          headers: { "Content-Type": "application/json" },
        });
      },
    });

    const { status, body } = await call(handler);
    assert.equal(requestCount, 1);
    assert.equal(status, 502);
    assert.equal(body.error.code, "AI_INVALID_RESPONSE");
    assert.match(body.error.message, /HostelHub Intel/i);
    assert.doesNotMatch(body.error.message, /OpenRouter|provider/i);
  });

  it("rejects unauthenticated requests before loading data", async () => {
    let dataLoaded = false;
    const { status, body } = await call(makeHandler({
      protect: async () => null,
      loadAdminContext: async () => {
        dataLoaded = true;
        return emptyContext;
      },
    }));

    assert.equal(status, 401);
    assert.equal(body.error.code, "UNAUTHORIZED");
    assert.equal(dataLoaded, false);
  });

  it("rejects invalid session identities before loading data", async () => {
    let dataLoaded = false;
    const { status, body } = await call(makeHandler({
      protect: async () => ({ userId: "not-an-object-id", role: "admin" }),
      loadAdminContext: async () => {
        dataLoaded = true;
        return emptyContext;
      },
    }));

    assert.equal(status, 401);
    assert.equal(body.error.code, "INVALID_SESSION");
    assert.equal(dataLoaded, false);
  });
});
