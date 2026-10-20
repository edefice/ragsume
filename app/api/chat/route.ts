import { NextResponse } from "next/server";
import { z } from "zod";
import { createRetriever } from "@/lib/retriever";
import { generateAnswer, type RagAnswer } from "@/lib/anthropic";

const chatRequestSchema = z.object({
  question: z.string().min(1).max(2000),
});

const TOP_K = 5;

const FALLBACK_ANSWER: RagAnswer = {
  answer:
    "Sorry, I couldn't put together an answer this time. Please try again or rephrase the question.",
  sources: [],
  confidence: "low",
};

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const parsed = chatRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { question } = parsed.data;

  // Never surface a 500 to the chat UI: log the failure and return a friendly low-confidence answer.
  try {
    const retriever = createRetriever();
    const chunks = await retriever.search(question, TOP_K);
    const answer = await generateAnswer(question, chunks);
    return NextResponse.json(answer);
  } catch (err) {
    console.error("POST /api/chat failed:", err);
    return NextResponse.json(FALLBACK_ANSWER);
  }
}
