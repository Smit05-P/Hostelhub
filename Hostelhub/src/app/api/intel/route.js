import { GoogleGenerativeAI } from "@google/generative-ai";
import { 
  getDashboardStats, 
  getAllStudents, 
  getAllComplaints, 
  getAllFees, 
  getAllNotices 
} from "@/lib/firestore";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "");
const model = genAI.getGenerativeModel({ 
  model: "gemini-2.0-flash",
  systemInstruction: `You are HostelHub Intel, a premium AI management assistant for the HostelHub SaaS platform.
  Your goal is to help admins and students manage their hostel experience efficiently.
  
  CONTEXT:
  - You have access to real-time data about students, rooms, fees, complaints, and notices via tools.
  - For Admins: Provide deep analysis, financial summaries, and operational insights.
  - For Students: Help them understand rules, status of their complaints, and summaries of notices.
  
  TONE: Professional, insightful, concise, and helpful. Use markdown for tables and lists.
  
  SAFETY: Keep data analysis high-level. Do not expose sensitive raw data unless specifically relevant to the query.`
});

// Tool Definitions for Gemini
const tools = [
  {
    functionDeclarations: [
      {
        name: "getDashboardStats",
        description: "Get high-level statistics for a specific hostel, including revenue, occupancy, and pending tasks.",
        parameters: {
          type: "object",
          properties: {
            hostelId: { type: "string", description: "The unique ID of the hostel." }
          },
          required: ["hostelId"]
        }
      },
      {
        name: "getAllStudents",
        description: "Fetch all students registered in a hostel.",
        parameters: {
          type: "object",
          properties: {
            hostelId: { type: "string", description: "The unique ID of the hostel." }
          },
          required: ["hostelId"]
        }
      },
      {
        name: "getAllComplaints",
        description: "Retrieve all maintenance or service complaints filed in the hostel.",
        parameters: {
          type: "object",
          properties: {
            hostelId: { type: "string", description: "The unique ID of the hostel." }
          },
          required: ["hostelId"]
        }
      },
      {
        name: "getAllFees",
        description: "Retrieve fee records and payment statuses.",
        parameters: {
          type: "object",
          properties: {
            hostelId: { type: "string", description: "The unique ID of the hostel." }
          },
          required: ["hostelId"]
        }
      }
    ]
  }
];

export async function POST(req) {
  try {
    const { messages, hostelId, role } = await req.json();

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return NextResponse.json({ 
        error: "AI Engine not configured. Please add GOOGLE_GENERATIVE_AI_API_KEY to your environment." 
      }, { status: 500 });
    }

    const chat = model.startChat({
      history: messages.slice(0, -1).map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      })),
      tools
    });

    const lastMessage = messages[messages.length - 1].content;
    const result = await chat.sendMessage(lastMessage);
    const response = await result.response;
    
    // Handle Tool Calls (Multi-turn)
    let finalContent = "";
    const call = response.candidates[0].content.parts.find(p => p.functionCall);
    
    if (call) {
      const { name, args } = call.functionCall;
      let toolData;
      
      // Map Gemini tool calls to Firestore service functions
      switch (name) {
        case "getDashboardStats": toolData = await getDashboardStats(args.hostelId); break;
        case "getAllStudents": toolData = await getAllStudents({ hostelId: args.hostelId }); break;
        case "getAllComplaints": toolData = await getAllComplaints({ hostelId: args.hostelId }); break;
        case "getAllFees": toolData = await getAllFees({ hostelId: args.hostelId }); break;
        default: toolData = { error: "Unknown tool call" };
      }

      // Send tool outputs back to model
      const toolResult = await chat.sendMessage([{
        functionResponse: {
          name,
          response: { content: toolData }
        }
      }]);
      finalContent = toolResult.response.text();
    } else {
      finalContent = response.text();
    }

    return NextResponse.json({ content: finalContent });
  } catch (error) {
    console.error("AI Intel Error:", error);
    return NextResponse.json({ error: "Intelligence node encountered an error. Please try again." }, { status: 500 });
  }
}
