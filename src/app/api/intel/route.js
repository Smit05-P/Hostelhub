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

    let finalContent = "";
    let lastError = null;

    // --- PROVIDER 1: DIRECT GOOGLE GEMINI (Most Reliable Free Tier) ---
    if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      try {
        console.log("[Intel] Attempting Direct Google Gemini API...");
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GOOGLE_GENERATIVE_AI_API_KEY}`;
        
        const response = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              role: "user",
              parts: [{ text: `${SYSTEM_PROMPT}\n\nUser: ${messages[messages.length - 1].content}` }]
            }],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 2048,
            }
          })
        });

        const data = await response.json();
        if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
          finalContent = data.candidates[0].content.parts[0].text;
          console.log("[Intel] Success with Direct Gemini API");
        } else if (data.error) {
          console.warn("[Intel] Gemini API Error:", data.error.message);
          lastError = new Error(data.error.message);
        }
      } catch (err) {
        console.warn("[Intel] Gemini API failed to connect:", err.message);
        lastError = err;
      }
    }

    // --- PROVIDER 2: OPENROUTER FALLBACK (Multi-Model Rotation) ---
    if (!finalContent) {
      const openrouter = new OpenRouter({
        apiKey: process.env.OPENROUTER_API_KEY
      });

      const FREE_MODELS = [
        "google/gemini-2.0-flash-exp:free",
        "deepseek/deepseek-r1:free",
        "meta-llama/llama-3.3-70b-instruct:free",
        "qwen/qwen3-coder:free",
        "google/gemma-3-27b-it:free",
      ];

      for (const model of FREE_MODELS) {
        try {
          console.log(`[Intel] Attempting OpenRouter auto-switch: ${model}`);
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
            console.log(`[Intel] Success with OpenRouter model: ${model}`);
            break;
          }
        } catch (err) {
          const msg = err?.message || String(err);
          console.warn(`[Intel] OpenRouter ${model} failed: ${msg}`);
          lastError = err;
          
          if (msg.includes("429") || msg.includes("limit") || msg.includes("Provider") || msg.includes("overloaded") || msg.includes("temporarily")) {
            continue;
          }
          break; // Stop if it's a fatal key error
        }
      }
    }

    if (!finalContent) {
      const hint = lastError?.message || "All AI providers (Google & OpenRouter) are at capacity.";
      return NextResponse.json(
        { error: `Intel is busy. All free AI systems are currently overloaded. Please add a GOOGLE_GENERATIVE_AI_API_KEY for higher limits, or try again later. (${hint})` },
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

