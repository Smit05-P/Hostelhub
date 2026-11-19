import { createHmac } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/mongodb";
import BetaAccessRateLimit from "@/models/BetaAccessRateLimit";
import BetaAccessRequest from "@/models/BetaAccessRequest";

const WINDOW_MS = 60 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 5;
const MAX_BODY_BYTES = 16 * 1024;
let indexesPromise;

const betaAccessSchema = z
  .object({
    fullName: z.string().trim().min(2).max(100),
    businessName: z.string().trim().min(2).max(160),
    businessEmail: z
      .string()
      .trim()
      .max(254)
      .email()
      .transform((email) => email.toLowerCase()),
    phoneNumber: z
      .string()
      .trim()
      .min(7)
      .max(24)
      .regex(/^\+?[0-9\s().-]+$/)
      .refine((phone) => {
        const digitCount = phone.replace(/\D/g, "").length;
        return digitCount >= 7 && digitCount <= 15;
      }),
    numberOfProperties: z.number().int().min(1).max(10000),
    message: z.string().trim().max(2000).optional().default(""),
    companyWebsite: z.string().max(200).optional().default(""),
  })
  .strict();

function jsonResponse(body, status) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function getClientAddress(request) {
  const realIp = request.headers.get("x-real-ip")?.trim();
  const forwardedIp = request.headers
    .get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim();

  return realIp || forwardedIp || "unknown";
}

function getRateLimitBucket(request) {
  const now = Date.now();
  const window = Math.floor(now / WINDOW_MS);
  const address = getClientAddress(request);
  const hmacKey = process.env.JWT_SECRET || process.env.MONGODB_URI;

  if (!hmacKey) {
    throw new Error("Missing required server configuration");
  }

  const addressHash = createHmac("sha256", hmacKey).update(address).digest("hex");

  return {
    id: `${addressHash}:${window}`,
    expiresAt: new Date((window + 2) * WINDOW_MS),
    retryAfter: Math.max(1, Math.ceil(((window + 1) * WINDOW_MS - now) / 1000)),
  };
}

async function incrementRequestCount(id, expiresAt) {
  try {
    return await BetaAccessRateLimit.findByIdAndUpdate(
      id,
      { $inc: { count: 1 }, $setOnInsert: { expiresAt } },
      {
        returnDocument: "after",
        upsert: true,
        setDefaultsOnInsert: true,
      },
    )
      .select("count")
      .lean();
  } catch (error) {
    if (error.code !== 11000) throw error;

    return BetaAccessRateLimit.findByIdAndUpdate(
      id,
      { $inc: { count: 1 } },
      { returnDocument: "after" },
    )
      .select("count")
      .lean();
  }
}

async function ensureIndexes() {
  if (!indexesPromise) {
    indexesPromise = Promise.all([
      BetaAccessRequest.createIndexes(),
      BetaAccessRateLimit.createIndexes(),
    ]);
  }

  try {
    await indexesPromise;
  } catch (error) {
    indexesPromise = undefined;
    throw error;
  }
}

export async function POST(request) {
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return jsonResponse(
      { success: false, error: "The request is too large." },
      413,
    );
  }

  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host) {
    try {
      if (new URL(origin).host !== host) {
        return jsonResponse(
          { success: false, error: "This request could not be verified." },
          403,
        );
      }
    } catch {
      return jsonResponse(
        { success: false, error: "This request could not be verified." },
        403,
      );
    }
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse(
      { success: false, error: "Please submit a valid request." },
      400,
    );
  }

  try {
    await dbConnect();
    await ensureIndexes();

    const bucket = getRateLimitBucket(request);
    const rateLimit = await incrementRequestCount(bucket.id, bucket.expiresAt);

    if (rateLimit.count > MAX_REQUESTS_PER_WINDOW) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many requests. Please try again later.",
        },
        {
          status: 429,
          headers: {
            "Cache-Control": "no-store",
            "Retry-After": String(bucket.retryAfter),
            "X-Content-Type-Options": "nosniff",
          },
        },
      );
    }

    const parsed = betaAccessSchema.safeParse(body);
    if (!parsed.success) {
      return jsonResponse(
        {
          success: false,
          error: "Please review the highlighted fields and try again.",
          fieldErrors: parsed.error.flatten().fieldErrors,
        },
        400,
      );
    }

    if (parsed.data.companyWebsite) {
      return jsonResponse(
        { success: false, error: "This request could not be verified." },
        400,
      );
    }

    const requestData = { ...parsed.data };
    delete requestData.companyWebsite;
    const savedRequest = await BetaAccessRequest.create(requestData);

    return jsonResponse(
      {
        success: true,
        requestId: savedRequest._id.toString(),
        message: "Your beta access request has been saved.",
      },
      201,
    );
  } catch (error) {
    if (error.code === 11000) {
      return jsonResponse(
        {
          success: false,
          error: "A request has already been received for this business email.",
        },
        409,
      );
    }

    console.error(
      "POST /api/beta-access failed:",
      error?.name || "Unknown error",
    );
    return jsonResponse(
      {
        success: false,
        error: "We couldn't save your request right now. Please try again later.",
      },
      503,
    );
  }
}
