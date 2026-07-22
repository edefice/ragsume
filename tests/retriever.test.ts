import { describe, expect, it } from "vitest";
import { cosineSimilarity, topKByEmbedding, type EmbeddedChunk } from "../lib/retriever";

function makeChunk(id: string, embedding: number[]): EmbeddedChunk {
  return {
    chunkId: id,
    docId: "doc",
    docTitle: "Doc",
    heading: null,
    text: `text for ${id}`,
    source: "content/doc.md",
    embedding,
  };
}

describe("cosineSimilarity", () => {
  it("returns 1 for identical vectors", () => {
    expect(cosineSimilarity([1, 0, 0], [1, 0, 0])).toBeCloseTo(1);
  });

  it("returns 0 for orthogonal vectors", () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0);
  });

  it("returns -1 for opposite vectors", () => {
    expect(cosineSimilarity([1, 0], [-1, 0])).toBeCloseTo(-1);
  });
});

describe("topKByEmbedding", () => {
  const chunks: EmbeddedChunk[] = [
    makeChunk("a", [1, 0, 0]),
    makeChunk("b", [0, 1, 0]),
    makeChunk("c", [0.9, 0.1, 0]),
  ];

  it("ranks chunks by similarity to the query embedding, most similar first", () => {
    const results = topKByEmbedding([1, 0, 0], chunks, 3);
    expect(results.map((r) => r.chunkId)).toEqual(["a", "c", "b"]);
  });

  it("respects the k limit", () => {
    const results = topKByEmbedding([1, 0, 0], chunks, 2);
    expect(results).toHaveLength(2);
    expect(results.map((r) => r.chunkId)).toEqual(["a", "c"]);
  });

  it("attaches a score to each result", () => {
    const results = topKByEmbedding([1, 0, 0], chunks, 1);
    expect(results[0].score).toBeCloseTo(1);
  });
});
