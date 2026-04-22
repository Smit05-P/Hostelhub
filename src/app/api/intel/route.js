import { OpenRouter } from "@openrouter/sdk";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { hostelService } from "@/services/server/hostelService";
import { studentService } from "@/services/server/studentService";
import Complaint from "@/models/Complaint";
import Fee from "@/models/Fee";

export async function POST(req) {
  try {
    const { messages, hostelId, role } = await req.json();

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json({ 
        error: "AI Engine not configured. Please add OPENROUTER_API_KEY to your environment." 
      }, { status: 500 });
    }

    await dbConnect();

    // Pre-fetch all necessary context data to inject into the prompt
    // This avoids relying on tool-calling which often fails on free/OSS models.
    const stats = await hostelService.getDashboardStats(hostelId).catch(() => ({}));
    const { students } = await studentService.getStudents({ hostelId, limit: 100 }).catch(() => ({ students: [] }));
    const complaints = await Complaint.find({ hostelId }).sort({ createdAt: -1 }).limit(20).lean().catch(() => []);
    const fees = await Fee.find({ hostelId }).sort({ createdAt: -1 }).limit(20).lean().catch(() => []);

    const SYSTEM_PROMPT = `You are HostelHub Intel, a premium AI management assistant for the HostelHub SaaS platform.
Your goal is to help admins and students manage their hostel experience efficiently.

TONE: Professional, insightful, concise, and helpful. Use markdown for tables and lists.
SAFETY: Keep data analysis high-level. Do not expose sensitive raw data unless specifically relevant to the query.

REAL-TIME CONTEXT DATA (Use this to answer the user's queries):
---
DASHBOARD STATS:
${JSON.stringify(stats)}

RECENT STUDENTS (Up to 100):
${JSON.stringify(students.map(s => ({ name: s.name, status: s.status, room: s.roomNumber || s.roomId?.roomNumber })))}

RECENT COMPLAINTS (Up to 20):
${JSON.stringify(complaints.map(c => ({ title: c.title, status: c.status, type: c.type })))}

RECENT FEES (Up to 20):
${JSON.stringify(fees.map(f => ({ student: f.studentId?.name, amount: f.amount, status: f.status })))}
---`;

    const formattedMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content
      }))
    ];

    const openrouter = new OpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY
    });

    // Fallback chain: if one model is rate-limited (429), try the next
    const FREE_MODELS = [
      "meta-llama/llama-3.3-70b-instruct:free",
      "google/gemma-3-27b-it:free",
      "qwen/qwen3-coder:free",
      "nousresearch/hermes-3-llama-3.1-405b:free",
      "openai/gpt-oss-20b:free",
    ];

    let finalContent = "";
    let lastError = null;

    for (const model of FREE_MODELS) {
      try {
        console.log(`[Intel] Trying model: ${model}`);
        const stream = await openrouter.chat.send({
          chatRequest: {
            model,
            messages: formattedMessages,
            stream: true
          }
        });

        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) finalContent += content;
        }

        if (finalContent) {
          console.log(`[Intel] Success with model: ${model}`);
          break; // Got a valid response, stop trying
        }
      } catch (err) {
        const msg = err?.message || String(err);
        console.warn(`[Intel] Model ${model} failed: ${msg}`);
        lastError = err;
        // If rate-limited, provider error, or model unavailable, try next model
        if (msg.includes("429") || msg.includes("Provider returned error") || msg.includes("rate-limit") || msg.includes("No endpoints found") || msg.includes("temporarily")) {
          continue;
        }
        throw err; // Non-rate-limit errors should bubble up immediately
      }
    }

    if (!finalContent) {
      const hint = lastError?.message || "All free model providers are currently rate-limited.";
      return NextResponse.json(
        { error: `Intel is temporarily unavailable. All free AI providers are overloaded. Please try again in a few minutes. (${hint})` },
        { status: 503 }
      );
    }

    return NextResponse.json({ content: finalContent });
  } catch (error) {
    console.error("AI Intel Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json({ error: `AI Engine Error: ${errorMessage}. Please check server logs.` }, { status: 500 });
  }
}

