import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { readdirSync, statSync } from "fs";
import { join, relative } from "path";
import { config } from "dotenv";
import { chunkDocument, type Chunk } from "../lib/chunk";
import { embedDocuments } from "../lib/embeddings";
import type { EmbeddedChunk } from "../lib/retriever";

config({ path: join(__dirname, "..", ".env.local") });

const CONTENT_DIR = join(__dirname, "..", "content");
const OUTPUT_FILE = join(__dirname, "..", "data", "embeddings.json");
const EMBEDDING_MODEL = "voyage-3-lite";

interface EmbeddingsFile {
  model: string;
  createdAt: string;
  chunks: EmbeddedChunk[];
}

function findMarkdownFiles(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      files.push(...findMarkdownFiles(fullPath));
    } else if (entry.endsWith(".md")) {
      files.push(fullPath);
    }
  }

  return files;
}

async function main() {
  const files = findMarkdownFiles(CONTENT_DIR);
  if (files.length === 0) {
    throw new Error(`No markdown files found in ${CONTENT_DIR}`);
  }

  const chunks: Chunk[] = [];
  for (const file of files) {
    const raw = readFileSync(file, "utf-8");
    const source = relative(join(CONTENT_DIR, ".."), file);
    chunks.push(...chunkDocument(raw, source));
  }

  console.log(`Chunked ${files.length} document(s) into ${chunks.length} chunk(s).`);

  const embeddings = await embedDocuments(chunks.map((c) => c.text));

  const embeddedChunks: EmbeddedChunk[] = chunks.map((chunk, i) => ({
    ...chunk,
    embedding: embeddings[i],
  }));

  const output: EmbeddingsFile = {
    model: EMBEDDING_MODEL,
    createdAt: new Date().toISOString(),
    chunks: embeddedChunks,
  };

  const dataDir = join(__dirname, "..", "data");
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }

  writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
  console.log(`Wrote ${embeddedChunks.length} embedded chunks to ${OUTPUT_FILE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
