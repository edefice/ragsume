---
title: "Tomasz Bisek — CV"
docId: cv
---

# Tomasz Bisek

Full-Stack Developer (React / Next.js / TypeScript / Node.js) · AI-assisted development

Based in Gdynia, Poland · Remote.

Contact: info@tecode.pl · tecode.pl · linkedin.com/in/tomasz-bisek · github.com/edefice

## Profile

Full-stack developer with 10+ years building production web applications (React, TypeScript,
Node.js), front-end leaning: from Figma designs and component architecture to APIs, testing and
deployment. Tomasz started in design, so he cares about how a product looks and feels. In 2026 he
built and launched Splitshape solo: a deterministic engine computes the pacing plan, and Claude
(Anthropic API) explains it to the runner. He works daily in Claude Code with a configured
workflow (CLAUDE.md, custom commands, a code-review subagent, hooks).

## Professional experience

### Creator & Full-Stack Developer — Splitshape (own product), splitshape.run (Jul 2026–present)

- Designed, built and launched a free pacing and fueling plan app for marathons and half
  marathons, solo: from market research and UX to code, infrastructure and launch. Since going
  live in Aug 2026: 680+ unique visitors and 90+ generated plans.
- Built a deterministic pacing engine in TypeScript: GPX parsing, Grade Adjusted Pace, a late-race
  fade model and race-day weather adjustment, with wind relative to course heading (Open-Meteo),
  validated against reference courses. Plans print as a pace band and export as a Garmin course.
- Integrated Claude (Anthropic API) so the model only explains the engine's numbers and never
  computes them: structured output with Zod, validators that check every pace and time in the
  text, one targeted repair call and a fallback on failure. Chose the model after measuring
  latency, cost and rejected outputs. A plan narrative costs about USD 0.05, with a median
  generation time of 18 s.
- Runs it as a production system: Next.js 15, Supabase (Postgres, magic-link auth), Vercel with
  per-branch preview deployments, EN/DE/PL, generation rate limits, per-call LLM cost telemetry
  and 1,500+ automated tests. The race calendar updates itself: Claude Haiku reads dates from
  official race sites, and only dates confirmed by a verbatim quote from the source are saved.

See the separate Splitshape project write-up for more detail.

### Freelance Full-Stack Developer — TECODE (B2B) (Oct 2026–present)

- Building, solo and full-stack, a web service for a primary care clinic. Patients register online
  and submit a doctor and nurse selection declaration signed with Profil Zaufany (Polish e-ID),
  and staff handle submissions in an admin panel.
- Next.js (App Router) and TypeScript (strict) in a single monolith, Zod schemas shared between
  front-end and back-end, React Hook Form, PostgreSQL with Prisma. Declarations go into PDF
  templates (pdf-lib) and reach the clinic over SFTP. Deployed with Docker Compose on a Hetzner
  server (Caddy, ClamAV, CrowdSec). Tests in Vitest and Playwright (e2e).

### AI engineering: learning and own projects (Mar 2026–Jul 2026)

- Courses (Udemy): Complete AI Engineer Training (Python, NLP, Transformers, LLMs, LangChain,
  Hugging Face); AI Engineer Agentic Track: The Complete Agent & MCP Course; AI Engineer Core
  Track: LLM Engineering, RAG, QLoRA, Agents.
- job-search-mcp (github.com/edefice/job-search-mcp): an MCP server in TypeScript that lets Claude
  search justjoin.it job listings, fetch posting details and track application status.
- Ask My CV (ragsume.vercel.app, github.com/edefice/ragsume): a Next.js RAG app that answers
  questions about Tomasz's experience from his CV, project write-ups and blog posts. It uses
  Voyage AI embeddings and similarity search, Claude answers with sources in structured output,
  and retrieval is evaluated on a set of test questions.
- Technical blog (tecode.pl/blog): RAG, building an MCP server, agentic workflows, QLoRA, working
  in Claude Code.

### Full-Stack Developer — Be truly LOCAL (B2B contract) (Jan 2023–Jan 2026)

US startup, remote. An app that lets local businesses compete with big retailers through
location-based promotions and a rewards program.

- Moved the internal business platform (the tool merchants use to create and publish promotions)
  from a legacy WordPress setup to a React, Vite and TypeScript app, making most front-end
  architecture decisions himself.
- Built a reusable component library, improved responsiveness, and optimized rendering and bundle
  size. The new UI was noticeably faster.
- Also wrote back-end code (Node.js, MongoDB, AWS S3), including work on generating promotion copy
  with the OpenAI API from what merchants entered.
- In a 9-person team, implemented designs straight from the designer, agreed REST API contracts
  with the back-end developer and handed features to QA himself. Took part in planning,
  estimation and code review, and wrote unit and integration tests.

### Front-End Developer — T-Create, Lublin (B2B contract) (Feb 2019–Dec 2022)

Gamified sales-engagement tools for FMCG, including a multi-year project for an international
manufacturer: sales reps compete in a mobile app on real sales targets.

- Developed the admin panel the business team uses to configure the whole game (content, rules,
  rewards, player data). Worked in React, Vue and TypeScript from Figma designs, in an 8-person
  team (2 front-end, 2 back-end, 2 POs, 2 QA).
- Under a fixed production deadline, built a drag-and-drop editor for assembling pages from
  predefined blocks. A schema-driven architecture (a contract, lifecycle and validation for each
  block) meant new block types needed no changes to the core.
- Focused Jest and React Testing Library tests on the highest-risk areas (block serialization,
  publishing). Owned the Bitbucket CI/CD pipeline from build to production.

### Front-End Developer / UX Designer — News Hub Media (Nov 2015–Jan 2019)

- Turned UX flows into interactive prototypes and production components (React, Vue,
  TypeScript), worked with QA and back-end engineers on content publishing, and mentored junior
  developers (component architecture, CSS).

### Graphic / Web Designer — P4T – play for trade (May 2014–Nov 2015)

Websites and print design.

## Technical skills

- **Front-end:** TypeScript, JavaScript (ES6+), React, Next.js (App Router), Vite, Tailwind CSS,
  React Hook Form, Vue, HTML5, CSS3, i18n (next-intl)
- **Back-end & data:** Node.js, Express, REST APIs, Zod, PostgreSQL, Prisma, Supabase, MongoDB,
  Stripe
- **Testing & quality:** Vitest, Jest, React Testing Library, Playwright, ESLint, Prettier
- **Cloud & DevOps:** Vercel, Docker / Docker Compose, Hetzner, AWS S3, CI/CD (Bitbucket, GitHub
  Actions)
- **Tools & process:** Git, GitHub, GitLab, Jira, Figma, Agile/Scrum

## AI & LLM

- **LLMs in production:** Anthropic API (Claude Sonnet, Haiku), OpenAI API, structured outputs
  (Zod), model output validation, model choice based on measured latency and cost, cost
  telemetry
- **Agents & tools:** MCP (building servers), tool / function calling, agentic workflows
- **RAG:** chunking, embeddings, vector search, retrieval evaluation
- **AI-assisted dev:** Claude Code (CLAUDE.md, custom slash commands, subagents, hooks)
- **From coursework:** Python, LangChain, Hugging Face Transformers, fine-tuning (QLoRA)

## Education & languages

- **Master's degree, Computer Science** — Lublin University of Technology (2012–2014)
- **Engineer's degree, Computer Science** — Lublin University of Technology (2007–2012)
- **Languages:** Polish (native) · English (C1) · German (A2)
