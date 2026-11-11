// User Message ───► 1. RAG Search ─────────────► Relevant JSON Entries (Top 3) ┐
//                  │                                                           │
//                  ├──► 2. Transcript Search ──► theo.txt (if "theo" present)  ┼──► Consolidated SYSTEM_PROMPT ──► Gemini API
//                  │                                                           │
//                  └──► 3. Known Advisors ─────► List of Advisor Names ────────┘

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { searchKnowledgeBase } from "@/lib/rag";
import knowledgeBase from "@/data/knowledge-base.json" with { type: "json" };
import fs from "fs";
import path from "path";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

// Helper to read external transcript files if a specific advisor is mentioned
function getTranscriptForMessage(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("james")) {
    const p = path.join(process.cwd(), "data/transcripts/james.txt");
    if (fs.existsSync(p)) {
      return fs.readFileSync(p, "utf-8");
    }
  }
  if (m.includes("luke")) {
    const p = path.join(process.cwd(), "data/transcripts/luke.txt");
    if (fs.existsSync(p)) {
      return fs.readFileSync(p, "utf-8");
    }
  }
  if (m.includes("kevin")) {
    const p = path.join(process.cwd(), "data/transcripts/kevin.txt");
    if (fs.existsSync(p)) {
      return fs.readFileSync(p, "utf-8");
    }
  }
  return "";
}

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message string is required." },
        { status: 400 }
      );
    }

    // 1. Retrieve dynamic context from RAG
    const relevantEntries = searchKnowledgeBase(message, 3);

    // 2. Retrieve dynamic file transcripts (if applicable)
    const transcript = getTranscriptForMessage(message);

    // Extract list of all known advisors for baseline validation
    const advisorsList = Array.from(
      new Set(knowledgeBase.map((item: any) => item.advisor))
    ).join(", ");

    // 3. Assemble System Prompt with dynamic context + operational rules
    const SYSTEM_PROMPT = `
You are an gardening mentor specializing in backyard gardening, vegetable cultivation, soil health, garden design, and plant care.
You have access to a knowledge base of gardening experts: ${advisorsList}.
Here are relevant knowledge base entries based on the advisors:
${
  relevantEntries.length > 0
    ? `RELEVANT KNOWLEDGE BASE ENTRIES:\n${JSON.stringify(
        relevantEntries,
        null,
        2
      )}\n`
    : ""
}
and matching gardening transcripts if applicable:
${
  transcript
    ? `RELEVANT EXPERT TRANSCRIPT:\n${transcript}\n`
    : ""
}.

OPERATIONAL RULES:
1. SCOPE LIMITATION: Answer ONLY questions directly related to gardening, including vegetable gardening, plant care, soil, composting, garden planning, seeds, propagation, pests, watering, and garden maintenance.
2. STRICT INTENT FILTER: Refuse requests where the primary intent is unrelated to gardening, even if framed with gardening terms, plant names, garden scenarios, or hypothetical examples.
3. UNKNOWN ADVISORS / OFF-TOPIC: If the user asks about an advisor NOT in the knowledge base, or asks a non-gardening question, respond strictly with: "I'm not sure."
4. CONTEXT FOCUS: Use the provided RAG knowledge entries and expert gardening transcripts below to inform your response.
5. EXPERT GUIDANCE: Prioritize practical, beginner-friendly gardening advice. Explain concepts clearly, including the reasoning behind recommendations when possible.
6. PLANT SAFETY: Avoid recommending harmful practices that could damage plants, soil ecosystems, or the surrounding environment.
`;

    // 4. Generate content from Gemini API
    const userResponse = await model.generateContent(
      `${SYSTEM_PROMPT}\n\nUser message: ${message}`
    );
    console.log(JSON.stringify(userResponse.response, null, 2));

    const responseResult = userResponse.response.text();

    return NextResponse.json({
      response: responseResult,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}
