import { config } from "dotenv";
import { join } from "path";

config({ path: join(__dirname, "..", ".env.local") });

import { createRetriever } from "../lib/retriever";

interface EvalCase {
  question: string;
  expectedDocId: string;
}

const K = 5;

const EVAL_CASES: EvalCase[] = [
  { question: "Where did Tomasz work most recently?", expectedDocId: "cv" },
  { question: "What was Tomasz's role at T-Create?", expectedDocId: "cv" },
  { question: "What programming languages and frameworks does Tomasz know?", expectedDocId: "cv" },
  { question: "What AI engineering training has Tomasz completed?", expectedDocId: "cv" },
  { question: "What language does Tomasz speak natively, and what's his English level?", expectedDocId: "cv" },
  { question: "What's Tomasz's educational background?", expectedDocId: "cv" },
  { question: "What did Tomasz do at News Hub Media?", expectedDocId: "cv" },
  { question: "What does the Job Search MCP Server do?", expectedDocId: "project-job-search-mcp" },
  { question: "How does the job search tool handle Polish city names like Łódź?", expectedDocId: "project-job-search-mcp" },
  { question: "What tech stack is the job search MCP project built with?", expectedDocId: "project-job-search-mcp" },
  { question: "Where is the Job Search MCP Server's code hosted on GitHub?", expectedDocId: "project-job-search-mcp" },
  { question: "What is the Ask My CV project and how does its retrieval work?", expectedDocId: "project-ask-my-cv" },
  { question: "What does Ask My CV use for generating structured answers?", expectedDocId: "project-ask-my-cv" },
];

// A small courtesy delay between queries; lib/embeddings.ts's retry-with-backoff
// handles the Voyage free-tier 3 RPM cap if this isn't enough on its own.
const REQUEST_DELAY_MS = process.env.VOYAGE_EVAL_DELAY_MS
  ? Number(process.env.VOYAGE_EVAL_DELAY_MS)
  : 3_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const retriever = createRetriever();
  let passed = 0;

  for (let i = 0; i < EVAL_CASES.length; i++) {
    if (i > 0 && REQUEST_DELAY_MS > 0) {
      await sleep(REQUEST_DELAY_MS);
    }

    const { question, expectedDocId } = EVAL_CASES[i];
    const results = await retriever.search(question, K);
    const hit = results.some((r) => r.docId === expectedDocId);
    const status = hit ? "PASS" : "FAIL";
    const detail = hit ? "" : ` (got: ${results.map((r) => r.docId).join(", ")})`;
    console.log(`${status}  "${question}" -> expected "${expectedDocId}"${detail}`);
    if (hit) passed += 1;
  }

  console.log(`\n${passed}/${EVAL_CASES.length} passed (top-${K})`);
  if (passed < EVAL_CASES.length) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
