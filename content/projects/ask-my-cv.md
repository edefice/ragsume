---
title: "Project: Ask My CV"
docId: project-ask-my-cv
---

# Ask My CV

The project you're using right now. A Next.js/TypeScript RAG (retrieval-augmented generation) app
that answers questions about Tomasz by retrieving relevant chunks from his CV and project
write-ups, then generating a grounded, structured answer with the Anthropic API. A self-referential
demo: the AI engineer portfolio piece that talks about the AI engineer.

## Why it exists

Tomasz's second AI-engineering portfolio project (after [Job Search MCP
Server](job-search-mcp.md)), built to demonstrate the specific skills most often listed in AI
Engineer job postings: RAG, structured outputs, and hands-on LLM SDK experience — built end-to-end
in Claude Code, deployed on Vercel.

## How it works

- **Retrieval:** documents in `content/` (CV, project write-ups) are chunked and embedded offline
  via `scripts/ingest.ts`, producing `data/embeddings.json`. At query time, the question is
  embedded with Voyage AI and the top-k most similar chunks are retrieved via cosine similarity —
  a hand-rolled retriever with no external vector database, since the doc set is small and static.
- **Generation:** retrieved chunks are placed in a prompt sent to Claude via the Anthropic SDK
  directly (no LangChain in the core path, to keep the underlying mechanics visible). Claude is
  forced to respond through a single tool with a JSON-schema input matching a `RagAnswer` type
  (`answer`, `sources[]`, `confidence`), validated with Zod before it reaches the client — the
  concrete answer to "tell me about structured outputs" in an interview.
- **UI:** a chat interface renders the answer alongside cited source chunks, linking back to the
  originating document.

## Stack

Next.js (App Router), TypeScript, React, Tailwind CSS, `@anthropic-ai/sdk`, Voyage AI embeddings,
Zod for schema validation, Vitest for tests.
