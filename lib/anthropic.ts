import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import type { RetrievedChunk } from "./retriever";

const MODEL = "claude-sonnet-5";

export const ragAnswerSchema = z.object({
  answer: z.string(),
  sources: z.array(
    z.object({
      docId: z.string(),
      chunkId: z.string(),
      title: z.string(),
      excerpt: z.string(),
    }),
  ),
  confidence: z.enum(["high", "medium", "low"]),
});

export type RagAnswer = z.infer<typeof ragAnswerSchema>;

const RAG_ANSWER_TOOL_NAME = "provide_answer";

const RAG_ANSWER_TOOL: Anthropic.Tool = {
  name: RAG_ANSWER_TOOL_NAME,
  description:
    "Provide a grounded answer to the user's question about Tomasz, citing the retrieved source chunks used to construct the answer.",
  input_schema: {
    type: "object",
    properties: {
      answer: {
        type: "string",
        description: "The answer to the user's question, grounded only in the provided context.",
      },
      sources: {
        type: "array",
        description: "The source chunks used to construct the answer.",
        items: {
          type: "object",
          properties: {
            docId: { type: "string" },
            chunkId: { type: "string" },
            title: { type: "string" },
            excerpt: {
              type: "string",
              description: "A short excerpt from the source chunk supporting the answer.",
            },
          },
          required: ["docId", "chunkId", "title", "excerpt"],
        },
      },
      confidence: {
        type: "string",
        enum: ["high", "medium", "low"],
        description: "Confidence that the retrieved context fully answers the question.",
      },
    },
    required: ["answer", "sources", "confidence"],
  },
};

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic();
  }
  return client;
}

const SYSTEM_PROMPT = [
  'You are the assistant behind "Ask My CV", answering questions about Tomasz',
  "based only on the retrieved context chunks provided in the user message.",
  "Ground every claim in the provided context. If the context doesn't contain the",
  'answer, say so plainly in `answer` and set confidence to "low" rather than guessing.',
  `Always respond by calling the ${RAG_ANSWER_TOOL_NAME} tool.`,
].join(" ");

function buildUserMessage(question: string, chunks: RetrievedChunk[]): string {
  const context = chunks
    .map(
      (c, i) =>
        `[${i + 1}] (docId: ${c.docId}, chunkId: ${c.chunkId}, title: "${c.docTitle}")\n${c.text}`,
    )
    .join("\n\n---\n\n");

  return `Context:\n${context}\n\nQuestion: ${question}`;
}

export async function generateAnswer(
  question: string,
  chunks: RetrievedChunk[],
): Promise<RagAnswer> {
  const anthropic = getClient();

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    tools: [RAG_ANSWER_TOOL],
    tool_choice: { type: "tool", name: RAG_ANSWER_TOOL_NAME },
    messages: [{ role: "user", content: buildUserMessage(question, chunks) }],
  });

  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
  );
  if (!toolUse) {
    throw new Error("Claude did not return a tool_use block");
  }

  return ragAnswerSchema.parse(toolUse.input);
}
