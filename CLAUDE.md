# CLAUDE.md

This file guides Claude Code when working in this repository.

## Project

**"Ask My CV"** — a small Next.js/TypeScript RAG (Retrieval-Augmented Generation) app that answers
questions about Tomasz by retrieving relevant chunks from his own CV, blog posts (tecode.pl),
and project READMEs, then generating a grounded answer with the Anthropic API. Self-referential demo:
the AI engineer portfolio piece that talks about the AI engineer.

This is portfolio project #2 (after a first app already shipped to GitHub). Goal: demonstrate RAG,
LLM API integration, and structured outputs — the exact skills listed in target job posts (AI Engineer
roles requiring RAG, structured outputs, tool/function calling, TypeScript/Next.js/Node, and hands-on
LLM SDK experience). Built end-to-end in Claude Code, pushed to GitHub, deployed on Vercel.

## Tech stack

- **Framework:** Next.js 15 (App Router), TypeScript, React 19
- **Styling:** Tailwind CSS
- **LLM:** Anthropic SDK (`@anthropic-ai/sdk`) directly — Claude for generation, using tool use /
  forced JSON schema for structured output. No LangChain for the core path; keeping it SDK-direct
  shows a clearer understanding of the underlying mechanics for interviews. (LangChain is a fine
  stretch goal later — see Non-goals.)
- **Embeddings:** Voyage AI (`voyage-3-lite` or `voyage-3`) — Anthropic's recommended embeddings
  partner. OpenAI `text-embedding-3-small` is an acceptable swap-in if a Voyage key isn't available.
- **Vector store:** in-memory cosine similarity over a precomputed JSON embeddings file. No external
  vector DB — this is a small, static doc set (CV + a handful of blog posts), and a hand-rolled
  retriever demonstrates the fundamentals instead of hiding them behind Pinecone/Chroma. Structure the
  retriever behind an interface so swapping in a real vector DB later is a small diff, not a rewrite.
- **Deployment:** Vercel
- **Testing:** Vitest or Jest + React Testing Library for components; a small script-based eval for
  retrieval quality (see Milestones)
- **Package manager:** npm

## Architecture

```
User question (chat UI)
  → POST /api/chat
    → embed query (Voyage)
    → retrieve top-k chunks (cosine similarity over precomputed embeddings)
    → build prompt with retrieved context
    → call Claude with a tool/JSON-schema forcing structured output
    → stream/return { answer, sources[], confidence }
  → UI renders answer + cited source chunks (with links back to the source doc/section)
```

Ingestion is a **build-time/offline script**, not a runtime step: `scripts/ingest.ts` reads
`content/`, chunks it, embeds each chunk, and writes `data/embeddings.json`. The app loads that file
at runtime. Keeps the demo fast, cheap, and free of a database.

## Structured output contract

The whole point of the "structured outputs" requirement: don't just stream prose back. Force Claude
to return something like:

```ts
type RagAnswer = {
  answer: string;
  sources: { docId: string; chunkId: string; title: string; excerpt: string }[];
  confidence: "high" | "medium" | "low";
};
```

Use Anthropic tool use (a single tool with an input schema matching `RagAnswer`, `tool_choice` forcing
that tool) rather than asking the model to emit JSON in prose. Validate the result with Zod before
returning it to the client. This is the piece most worth polishing — it's the concrete, demoable answer
to "tell me about structured outputs" in an interview.

## Data / doc set

`content/` holds the source documents as Markdown, one file per doc:

- `content/cv.md` — Tomasz's CV (front-end/full-stack background, React/Next.js/TypeScript/Node,
  transitioning into AI engineering; see below for source material)
- `content/blog/*.md` — posts pulled from tecode.pl
- `content/projects/*.md` — README/summary of the first shipped app, and this one once it exists

CV source content to seed `content/cv.md` from (already on hand, condense into clean prose/markdown
rather than pasting the resume layout verbatim):

- Tomasz, Gdynia, Poland — tecode.pl, info@tecode.pl
- Founder/Freelance (TECODE), Feb 2019–present — independent front-end contracting
- Full-Stack Developer, Be truly LOCAL, Jan 2023–Jan 2026 — React/TypeScript UI, Node.js REST APIs,
  performance optimization, testing
- Front-End Developer, T-Create, Feb 2019–Dec 2022 — Figma-to-pixel-perfect UI, JS/TS interactivity,
  Bitbucket CI/CD
- Front-End Developer/UX Designer, News Hub Media, Nov 2015–Jan 2019 — React/TypeScript, accessibility,
  mentoring
- Graphic/Web Designer, P4T, May 2014–Nov 2015 — PHP/MySQL sites
- Education: Engineer's + Master's in Computer Science, Lublin University of Technology
- Core skills: JavaScript (ES6+), TypeScript, React, Next.js, Node.js, Express, REST APIs, Jest/RTL
- Recent AI upskilling (relevant for this project's "about me" framing): Complete AI Engineer Training
  (Python, NLP, Transformers, LLMs, LangChain, Hugging Face, APIs); AI Engineer Agentic Track
  (Agents & MCP); AI Engineer Core Track (LLM Engineering, RAG, QLoRA, Agents)
- Languages: Polish (native), English (C1), German (A2)

Pull the actual blog posts from https://tecode.pl during setup rather than inventing content.

## Project structure

```
/app
  /api/chat/route.ts       # RAG endpoint: embed → retrieve → generate → structured response
  /page.tsx                 # chat UI
  /components/ChatMessage.tsx
  /components/SourceCard.tsx
/lib
  /anthropic.ts              # Anthropic client + tool schema for structured output
  /embeddings.ts             # Voyage client wrapper
  /retriever.ts              # cosine similarity search over data/embeddings.json
  /chunk.ts                  # markdown chunking logic
/content
  cv.md
  /blog/*.md
  /projects/*.md
/data
  embeddings.json             # generated by scripts/ingest.ts, gitignored or committed (small, cheap to regen)
/scripts
  ingest.ts                   # offline embedding pipeline
/tests
  retriever.test.ts
  chat-api.test.ts
CLAUDE.md
README.md
.env.example
```

## Environment variables

```
ANTHROPIC_API_KEY=
VOYAGE_API_KEY=
```

Never commit real keys. `.env.local` is gitignored; `.env.example` documents the required vars with
placeholder values.

## Commands

- `npm run dev` — local dev server
- `npm run ingest` — regenerate `data/embeddings.json` from `content/`
- `npm run build` — production build
- `npm test` — run tests
- `npm run lint` — ESLint

## Milestones (suggested build order)

1. Scaffold Next.js + TypeScript + Tailwind app, commit skeleton.
2. Write `content/cv.md`, pull 2–4 posts from tecode.pl into `content/blog/`.
3. `lib/chunk.ts` — simple heading/paragraph-based chunker with overlap.
4. `scripts/ingest.ts` — chunk → embed (Voyage) → write `data/embeddings.json`. Run it, commit output.
5. `lib/retriever.ts` — cosine similarity top-k search, unit tested against known chunks.
6. `lib/anthropic.ts` — Claude call with forced tool-use output matching `RagAnswer`, Zod-validated.
7. `/api/chat/route.ts` — wire retrieval + generation together.
8. Chat UI: input, streaming/optimistic message list, source citations rendered per answer.
9. Small retrieval eval script (10–15 hand-written Q&A pairs, check expected doc shows up in top-k) —
   good talking point even if informal (nod to RAGAS-style evaluation without the dependency).
10. README with architecture diagram/description, deploy to Vercel, link from tecode.pl and this
    project's GitHub repo.

## Code conventions

- Strict TypeScript, no `any` in `/lib` or `/app/api`.
- Server-side only for API keys — never call Anthropic/Voyage from client components.
- Keep the retriever behind a small interface (`search(query: string, k: number): Chunk[]`) so it's
  obvious in code review how a real vector DB would slot in.
- Prefer explicit types for the RAG response contract (`RagAnswer`) over `any`/loose JSON.
- Small, focused commits; conventional commit messages.

## Non-goals (for this iteration)

- No auth, no persistence/database, no multi-user chat history.
- No external vector DB (Pinecone/Chroma/pgvector) — intentional, see Architecture.
- No LangChain/LangGraph in the core path — direct SDK usage is the point. A `feat/langchain-variant`
  branch reimplementing the same pipeline with LangChain is a reasonable follow-up if useful for a
  specific job app, not part of the main build.
