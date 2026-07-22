import { NextResponse } from "next/server";
import { z } from "zod";
import { createRetriever } from "@/lib/retriever";
import { generateAnswer } from "@/lib/anthropic";

const chatRequestSchema = z.object({
  question: z.string().min(1).max(2000),
});

const TOP_K = 5;

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = chatRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { question } = parsed.data;

  const retriever = createRetriever();
  const chunks = await retriever.search(question, TOP_K);
  const answer = await generateAnswer(question, chunks);

  return NextResponse.json(answer);
}
