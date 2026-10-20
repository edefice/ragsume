// @vitest-environment node
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { RetrievedChunk } from "../lib/retriever";

const createMock = vi.fn();

class MockAnthropic {
  messages = { create: createMock };
}

vi.mock("@anthropic-ai/sdk", () => ({
  default: MockAnthropic,
}));

const { generateAnswer, ragAnswerSchema } = await import("../lib/anthropic");

const chunks: RetrievedChunk[] = [
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

describe("generateAnswer", () => {
  beforeEach(() => {
    createMock.mockReset();
  });

  it("parses a valid tool_use response into a RagAnswer", async () => {
    const toolInput = {
      answer: "Tomasz is a front-end/full-stack developer.",
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
    createMock.mockResolvedValue({
      content: [{ type: "tool_use", id: "toolu_1", name: "provide_answer", input: toolInput }],
    });

    const result = await generateAnswer("What does Tomasz do?", chunks);

    expect(result).toEqual(toolInput);
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        tool_choice: { type: "tool", name: "provide_answer" },
      }),
    );
  });

  it("throws if Claude does not return a tool_use block", async () => {
    createMock.mockResolvedValue({ content: [{ type: "text", text: "no tool used" }] });

    await expect(generateAnswer("question", chunks)).rejects.toThrow(
      "did not return a tool_use block",
    );
  });

  it("throws after one retry if the tool input keeps failing schema validation", async () => {
    createMock.mockResolvedValue({
      content: [{ type: "tool_use", id: "toolu_1", name: "provide_answer", input: { answer: "x" } }],
    });

    await expect(generateAnswer("question", chunks)).rejects.toThrow();
    expect(createMock).toHaveBeenCalledTimes(2);
  });

  it("retries once when the first response fails validation", async () => {
    const good = { answer: "ok", sources: [], confidence: "low" };
    createMock
      .mockResolvedValueOnce({
        content: [{ type: "tool_use", id: "toolu_1", name: "provide_answer", input: { answer: "x" } }],
      })
      .mockResolvedValueOnce({
        content: [{ type: "tool_use", id: "toolu_2", name: "provide_answer", input: good }],
      });

    await expect(generateAnswer("question", chunks)).resolves.toEqual(good);
    expect(createMock).toHaveBeenCalledTimes(2);
  });

  it("normalizes an invalid confidence value instead of failing", async () => {
    createMock.mockResolvedValue({
      content: [
        {
          type: "tool_use",
          id: "toolu_1",
          name: "provide_answer",
          input: { answer: "ok", sources: [], confidence: "Very High" },
        },
      ],
    });

    const result = await generateAnswer("question", chunks);
    expect(result.confidence).toBe("medium");
    expect(createMock).toHaveBeenCalledTimes(1);
  });
});

describe("ragAnswerSchema", () => {
  it("accepts a well-formed RagAnswer", () => {
    expect(() =>
      ragAnswerSchema.parse({ answer: "...", sources: [], confidence: "medium" }),
    ).not.toThrow();
  });

  it("lowercases and trims confidence", () => {
    expect(
      ragAnswerSchema.parse({ answer: "...", sources: [], confidence: " HIGH " }).confidence,
    ).toBe("high");
  });

  it("falls back to medium for an unknown or missing confidence", () => {
    expect(
      ragAnswerSchema.parse({ answer: "...", sources: [], confidence: "certain" }).confidence,
    ).toBe("medium");
    expect(ragAnswerSchema.parse({ answer: "...", sources: [] }).confidence).toBe("medium");
  });

  it("rejects a source missing required fields", () => {
    expect(() =>
      ragAnswerSchema.parse({
        answer: "...",
        sources: [{ docId: "cv", chunkId: "cv#0" }],
        confidence: "low",
      }),
    ).toThrow();
  });
});
