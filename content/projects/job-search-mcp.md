---
title: "Project: Job Search MCP Server"
docId: project-job-search-mcp
---

# Job Search MCP Server

GitHub: https://github.com/edefice/job-search-mcp

Tomasz's first shipped AI-engineering portfolio project — an MCP (Model Context Protocol) server
that lets Claude search [justjoin.it](https://justjoin.it) job postings and track application
status, so Claude Desktop or Claude Code can be asked things like "find me new AI Engineer roles
in Warsaw" or "what's the status of the application I sent last week." Built as a real tool for his
own AI Engineer job search, not a toy demo.

## What it does

Four MCP tools, all backed by a stdio server (`dist/index.js`):

- `search_jobs(keyword, location?)` — searches justjoin.it listings, returning title, company,
  URL, salary, tags, and location. `location` accepts a city name or `"remote"`.
- `get_job_details(url)` — fetches a single job offer page and returns a cleaned-up description
  plus tech stack tags.
- `track_application(url, status)` — saves/updates an application's status locally
  (`saved`/`applied`/`interviewing`/`rejected`/`offer`).
- `list_applications()` — lists tracked applications, most recently updated first.

Application data is stored locally in a JSON file, no database or external service required.

## Stack

Node.js 18+, TypeScript, MCP SDK. Tests run on Node's built-in test runner (`node:test`) rather
than pulling in a separate framework.

## Engineering notes worth citing

- **justjoin.it has no public API.** It's a Next.js app with build-hashed CSS classes that
  change on every deploy, so scraping anchors on stable landmarks instead — a specific link
  class, Lucide icon classes, and a structural heuristic (a `<div>` whose children are all
  plain-text, childless `<div>`s) to reliably find the tag pills.
- **Job detail pages embed `schema.org/JobPosting` JSON-LD**, used for structured fields
  (title/company/location/salary/employment type), while the visible HTML is still used for the
  description and tech stack since the JSON-LD description has no paragraph breaks.
- **City slugs are Polish-only** (`warszawa`, not `warsaw`). Writing the diacritic-normalization
  test caught a real bug: Polish `ł` isn't a combining-mark diacritic, so `String.normalize("NFD")`
  doesn't strip it the way it does `ó` or `ź` — it needed an explicit `ł`/`Ł` → `l`/`L` replacement.
- **Scraping is inherently brittle** — if justjoin.it changes its markup enough to break the
  heuristics, the tools return an explicit error rather than silently returning garbage.

## Roadmap (not yet built)

- `match_score(job_url)` — score a job description against a CV/skills profile via the Anthropic
  API, with a rationale.
- A second job board as a data source, so results aren't tied to justjoin.it alone.
