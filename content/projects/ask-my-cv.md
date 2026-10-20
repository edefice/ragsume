---
title: "Project: Ask My CV"
docId: project-ask-my-cv
---

# Ask My CV

GitHub: https://github.com/edefice/ragsume · Live: https://ragsume.vercel.app

The app you are using right now. A Next.js/TypeScript RAG (retrieval-augmented generation) app
that answers questions about Tomasz by retrieving relevant chunks from his CV, project
descriptions and blog posts (tecode.pl/blog), then generating a grounded, structured answer with
the Anthropic API. It was built end-to-end in Claude Code and is deployed on Vercel.

## How it works

- **Corpus:** Markdown files in `content/`: the CV, project descriptions (Splitshape, Ask My CV,
  job-search-mcp) and blog posts.
- **Ingestion:** an offline script (`scripts/ingest.ts`) chunks each document by heading and
  paragraph with overlap, embeds every chunk with Voyage AI (`voyage-3-lite`) and writes
  `data/embeddings.json`. The running app only loads that file.
- **Retrieval:** at query time the question is embedded with Voyage AI and the top-k most similar
  chunks are retrieved by cosine similarity, in memory. There is no external vector database,
  because the document set is small and static. The retriever sits behind a small `search(query,
  k)` interface so a real vector store could replace it.
- **Generation:** the retrieved chunks go into a prompt sent to Claude Sonnet 5
  (`claude-sonnet-5`) through the Anthropic SDK directly, with no LangChain. Claude is forced to
  respond through a single tool whose input schema matches a `RagAnswer` type (`answer`,
  `sources[]`, `confidence`), and the result is validated with Zod before it reaches the client.
- **UI:** a chat interface renders the answer together with the cited source chunks.
- **Evaluation:** `scripts/eval.ts` runs a hand-written set of questions and checks that the
  expected document appears in the top-5 retrieved chunks.

## Stack

Next.js (App Router), TypeScript, React, Tailwind CSS, `@anthropic-ai/sdk`, Voyage AI embeddings,
Zod for schema validation, Vitest for tests.
