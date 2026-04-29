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

    console.log("[Intel] Attempting Direct OpenRouter AI (3-Model Fallback)...");
    let aiResponse = null;
    let apiError = null;

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://hostelhub.vercel.app",
          "X-Title": "HostelHub Intel",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          models: [
            "google/gemini-2.0-flash-exp:free",
            "meta-llama/llama-3.3-70b-instruct:free",
            "deepseek/deepseek-chat:free"
          ],
          messages: formattedMessages,
          provider: {
            order: ["Fireworks", "Together", "Mistral", "Anthropic"],
            ignore: ["Intel"],
            allow_fallbacks: true
          },
          retry: { max_retries: 3 }
        })
      });

      const data = await response.json();
      if (data.choices?.[0]?.message?.content) {
        aiResponse = data.choices[0].message.content;
      } else if (data.error) {
        apiError = data.error.message;
      }
    } catch (err) {
      apiError = err.message;
    }

    if (aiResponse) {
      console.log("[Intel] Success with OpenRouter AI");
      return new Response(aiResponse, {
        headers: { "Content-Type": "text/plain; charset=utf-8" }
      });
    }

    // --- LOCAL FALLBACK LOGIC (Safety Net) ---
    console.warn("[Intel] AI failed, falling back to Local Data. Error:", apiError);
    
    const lastMessage = messages[messages.length - 1].content.toLowerCase();
    let localContent = "";

    const formatDate = (dateStr) => {
      if (!dateStr) return 'N/A';
      return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    if (lastMessage.includes("complaint")) {
      localContent = "### 📋 Recent Complaints Report\n\n";
      if (complaints.length === 0) {
        localContent += "✅ *There are currently no recent complaints recorded.*";
      } else {
        localContent += "| 📝 Subject | 🚨 Category | 📌 Status | 📅 Date |\n| :--- | :--- | :--- | :--- |\n";
        complaints.slice(0, 15).forEach(c => {
          const statusIcon = c.status === 'resolved' ? '✅' : c.status === 'in_progress' ? '⏳' : '🔴';
          localContent += `| **${c.subject || 'N/A'}** | ${c.category || 'N/A'} | ${statusIcon} ${c.status || 'N/A'} | ${formatDate(c.createdAt)} |\n`;
        });
        localContent += `\n\n> 💡 *Note: Using local data fallback while AI is syncing.*`;
      }
    } else if (lastMessage.includes("student") || lastMessage.includes("resident")) {
      localContent = "### 🎓 Resident Students Directory\n\n";
      if (students.length === 0) {
        localContent += "ℹ️ *No student records found for this hostel.*";
      } else {
        localContent += "| 👤 Name | 🚪 Room | 📞 Contact | 🏷️ Status |\n| :--- | :--- | :--- | :--- |\n";
        students.slice(0, 15).forEach(s => {
          const room = s.roomNumber || s.roomId?.roomNumber || 'N/A';
          const statusIcon = s.status === 'active' ? '🟢' : '⚪';
          localContent += `| **${s.name || 'N/A'}** | ${room} | ${s.contactNumber || s.phone || 'N/A'} | ${statusIcon} ${s.status || 'N/A'} |\n`;
        });
        localContent += `\n\n> 💡 *Note: Using local data fallback while AI is syncing.*`;
      }
    } else if (lastMessage.includes("fee") || lastMessage.includes("payment") || lastMessage.includes("money") || lastMessage.includes("debt")) {
      localContent = "### 💰 Recent Fee & Payment Records\n\n";
      if (fees.length === 0) {
        localContent += "ℹ️ *No fee or payment records found.*";
      } else {
        localContent += "| 👤 Student | 💵 Amount | 📌 Status | 📅 Date |\n| :--- | :--- | :--- | :--- |\n";
        fees.slice(0, 15).forEach(f => {
          const studentName = f.studentId?.name || 'Unknown Student';
          const statusIcon = f.status === 'paid' ? '✅' : f.status === 'pending' ? '⏳' : '🔴';
          localContent += `| **${studentName}** | ₹${f.amount || 0} | ${statusIcon} ${f.status || 'N/A'} | ${formatDate(f.createdAt || f.paymentDate)} |\n`;
        });
        localContent += `\n\n> 💡 *Note: Using local data fallback while AI is syncing.*`;
      }
    } else {
      localContent = `### 📊 Hostel Dashboard Intelligence Summary

Here is a summary of your hostel's current operational status:

| Metric | Current Status |
| :--- | :--- |
| **👥 Total Active Students** | ${stats?.totalStudents || 0} Residents |
| **🛏️ Room Availability** | ${stats?.availableRooms || 0} Vacant |
| **🚨 Open Complaints** | ${stats?.pendingComplaints || 0} Pending |
| **💰 Total Revenue** | ₹${stats?.totalRevenue || 0.00} |

---
> 💡 *AI Engine is currently busy. Showing real-time local system summary.*`;
    }

    return new Response(localContent, {
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });

  } catch (error) {
    console.error("AI Intel Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(`Critical Error: ${errorMessage}`, {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  }
}
