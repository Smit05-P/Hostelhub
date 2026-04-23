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

    // --- PROVIDER 2: OPENROUTER NATIVE FALLBACK (Streaming Enabled) ---
    if (!finalContent) {
      try {
        const FREE_MODELS = [
          "inclusionai/ling-2.6-flash:free",
          "deepseek/deepseek-r1:free",
          "meta-llama/llama-3.3-70b-instruct:free",
        ];

        console.log(`[Intel] Attempting Streaming via ${FREE_MODELS[0]}...`);
        
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "HTTP-Referer": "https://hostelhub.vercel.app",
            "X-Title": "HostelHub Intel",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: FREE_MODELS[0],
            messages: formattedMessages,
            stream: true,
            models: FREE_MODELS,
            route: "fallback"
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || "OpenRouter streaming failed");
        }

        // Return a streaming response to the client
        const stream = new ReadableStream({
          async start(controller) {
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split("\n");
                
                for (const line of lines) {
                  if (line.startsWith("data: ")) {
                    const dataStr = line.slice(6).trim();
                    if (dataStr === "[DONE]") continue;
                    
                    try {
                      const data = JSON.parse(dataStr);
                      const content = data.choices?.[0]?.delta?.content || "";
                      if (content) {
                        controller.enqueue(new TextEncoder().encode(content));
                      }
                    } catch (e) {
                      // Skip invalid JSON lines
                    }
                  }
                }
              }
            } catch (err) {
              controller.error(err);
            } finally {
              controller.close();
            }
          }
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
          },
        });

      } catch (err) {
        console.warn(`[Intel] OpenRouter streaming failed: ${err?.message}`);
        lastError = err;
      }
    }

    if (!finalContent) {
      const hint = lastError?.message || "All AI providers are currently overloaded.";
      return NextResponse.json(
        { error: `Intel is busy. ${hint}` },
        { status: 503 }
      );
    }

    return NextResponse.json({ content: finalContent });
  } catch (error) {
    console.error("AI Intel Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json({ error: `AI Engine Error: ${errorMessage}` }, { status: 500 });
  }
}

