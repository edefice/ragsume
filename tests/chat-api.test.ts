// @vitest-environment node
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { RetrievedChunk } from "../lib/retriever";
import type { RagAnswer } from "../lib/anthropic";

const searchMock = vi.fn();
const generateAnswerMock = vi.fn();

vi.mock("@/lib/retriever", () => ({
  createRetriever: () => ({ search: searchMock }),
}));

vi.mock("@/lib/anthropic", () => ({
  generateAnswer: generateAnswerMock,
}));

const { POST } = await import("../app/api/chat/route");

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const sampleChunks: RetrievedChunk[] = [
  {
    chunkId: "cv#0",
    docId: "cv",
    docTitle: "Tomasz — CV",
    heading: "Summary",
    text: "Front-end/full-stack developer transitioning into AI engineering.",
    source: "content/cv.md",
    embedding: [0.1, 0.2, 0.3],
    score: 0.95,
  },
];

const sampleAnswer: RagAnswer = {
  answer: "Tomasz is a front-end/full-stack developer transitioning into AI engineering.",
  sources: [
    {
      docId: "cv",
      chunkId: "cv#0",
      title: "Tomasz — CV",
      excerpt: "Front-end/full-stack developer transitioning into AI engineering.",
    },
  ],
  confidence: "high",
};

describe("POST /api/chat", () => {
  beforeEach(() => {
    searchMock.mockReset();
    generateAnswerMock.mockReset();
  });

  it("retrieves context, generates an answer, and returns it as JSON", async () => {
    searchMock.mockResolvedValue(sampleChunks);
    generateAnswerMock.mockResolvedValue(sampleAnswer);

    const response = await POST(makeRequest({ question: "What does Tomasz do?" }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(sampleAnswer);
    expect(searchMock).toHaveBeenCalledWith("What does Tomasz do?", 5);
    expect(generateAnswerMock).toHaveBeenCalledWith("What does Tomasz do?", sampleChunks);
  });

  it("returns a friendly low-confidence answer instead of a 500 when generation fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    searchMock.mockResolvedValue(sampleChunks);
    generateAnswerMock.mockRejectedValue(new Error("validation failed twice"));

    const response = await POST(makeRequest({ question: "What does Tomasz do?" }));

    expect(response.status).toBe(200);
    const body = (await response.json()) as RagAnswer;
    expect(body.confidence).toBe("low");
    expect(body.sources).toEqual([]);
    expect(body.answer).toMatch(/try again/i);
  });

  it("returns a friendly answer when retrieval fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    searchMock.mockRejectedValue(new Error("voyage down"));

    const response = await POST(makeRequest({ question: "What does Tomasz do?" }));

    expect(response.status).toBe(200);
    expect(generateAnswerMock).not.toHaveBeenCalled();
  });

  it("returns 400 for a non-JSON body", async () => {
    const response = await POST(
      new Request("http://localhost/api/chat", { method: "POST", body: "not json" }),
    );
    expect(response.status).toBe(400);
  });

  it("returns 400 for an empty question and never calls retrieval or generation", async () => {
    const response = await POST(makeRequest({ question: "" }));

    expect(response.status).toBe(400);
    expect(searchMock).not.toHaveBeenCalled();
    expect(generateAnswerMock).not.toHaveBeenCalled();
  });

  it("returns 400 when the question field is missing", async () => {
    const response = await POST(makeRequest({}));
    expect(response.status).toBe(400);
  });

  it("returns 400 when the question exceeds the length limit", async () => {
    const response = await POST(makeRequest({ question: "a".repeat(2001) }));
    expect(response.status).toBe(400);
  });
});
