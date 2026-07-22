import { readFileSync } from "fs";
import { join } from "path";
import { embedQuery } from "./embeddings";
import type { Chunk } from "./chunk";

export interface EmbeddedChunk extends Chunk {
  embedding: number[];
}

export interface RetrievedChunk extends EmbeddedChunk {
  score: number;
}

export interface Retriever {
  search(query: string, k: number): Promise<RetrievedChunk[]>;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function topKByEmbedding(
  queryEmbedding: number[],
  chunks: EmbeddedChunk[],
  k: number,
): RetrievedChunk[] {
  return chunks
    .map((chunk) => ({ ...chunk, score: cosineSimilarity(queryEmbedding, chunk.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

const DEFAULT_EMBEDDINGS_PATH = join(process.cwd(), "data", "embeddings.json");

let cachedChunks: EmbeddedChunk[] | null = null;

function loadChunks(path: string): EmbeddedChunk[] {
  if (!cachedChunks) {
    const raw = readFileSync(path, "utf-8");
    const parsed = JSON.parse(raw) as { chunks: EmbeddedChunk[] };
    cachedChunks = parsed.chunks;
  }
  return cachedChunks;
}

export function createRetriever(embeddingsPath: string = DEFAULT_EMBEDDINGS_PATH): Retriever {
  return {
    async search(query: string, k: number): Promise<RetrievedChunk[]> {
      const chunks = loadChunks(embeddingsPath);
      const queryEmbedding = await embedQuery(query);
      return topKByEmbedding(queryEmbedding, chunks, k);
    },
  };
}
