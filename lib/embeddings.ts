import { VoyageAIClient } from "voyageai";

const MODEL = "voyage-3-lite";
const BATCH_SIZE = 128;
// Voyage's no-billing tier also caps tokens per minute (10K TPM), so a single request with the whole
// corpus can be rejected outright. ~12K characters is roughly 3K tokens per request.
const MAX_BATCH_CHARS = 12_000;

let client: VoyageAIClient | null = null;

function getClient(): VoyageAIClient {
  if (!client) {
    const apiKey = process.env.VOYAGE_API_KEY;
    if (!apiKey) {
      throw new Error("VOYAGE_API_KEY is not set");
    }
    // Voyage throttles accounts with no billing on file to 3 requests/minute; the SDK
    // already backs off on 429 (respecting Retry-After), it just needs more attempts
    // than its default of 2 to ride out that window.
    client = new VoyageAIClient({ apiKey, maxRetries: 6 });
  }
  return client;
}

function toBatches(texts: string[]): string[][] {
  const batches: string[][] = [];
  let current: string[] = [];
  let currentChars = 0;
  for (const text of texts) {
    if (current.length > 0 && (current.length >= BATCH_SIZE || currentChars + text.length > MAX_BATCH_CHARS)) {
      batches.push(current);
      current = [];
      currentChars = 0;
    }
    current.push(text);
    currentChars += text.length;
  }
  if (current.length > 0) batches.push(current);
  return batches;
}

async function embed(texts: string[], inputType: "query" | "document"): Promise<number[][]> {
  const voyage = getClient();
  const results: number[][] = [];

  for (const batch of toBatches(texts)) {
    const response = await voyage.embed({ input: batch, model: MODEL, inputType });
    for (const item of response.data ?? []) {
      if (!item.embedding) {
        throw new Error("Voyage AI response missing embedding");
      }
      results.push(item.embedding);
    }
  }

  return results;
}

export function embedDocuments(texts: string[]): Promise<number[][]> {
  return embed(texts, "document");
}

export async function embedQuery(text: string): Promise<number[]> {
  const [embedding] = await embed([text], "query");
  return embedding;
}
