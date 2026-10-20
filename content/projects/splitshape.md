---
title: "Project: Splitshape"
docId: project-splitshape
source: https://tecode.pl/projects/splitshape
---

# Splitshape

Live app: https://splitshape.run · Case study: https://tecode.pl/projects/splitshape ·
Launch post: https://tecode.pl/blog/splitshape-is-live

Splitshape is a free web app for marathons and half marathons that turns a race course, a goal
time and a recent result into a km-by-km (or mile-by-mile) pacing and fueling plan with
coach-style notes. Tomasz built it solo, end to end: product, UX, code and infrastructure. It is
his own production product (Jul 2026–present), launched in Aug 2026.

## Problem

Even splits fail on real courses. Generic pacing tools adjust for elevation at best and ignore
race-day weather, wind relative to the course heading, and the late-race fade.

## What it does

- Takes a course (a growing list of major races with verified elevation profiles, or any GPX),
  plus a goal time and a recent result.
- Returns a km-by-km (or mile) pacing and fueling plan, with coach-style notes for every segment,
  a printable pace band, a Garmin course export and guides for COROS and Apple Watch.
- Shows a realistic finish time in race-day conditions next to the goal, with a breakdown of where
  the difference comes from.
- Offers one free forecast refresh before race day that re-solves splits and notes together.
- Works in English, German and Polish, and is free.
- Built for Tomasz's own sub-3 marathon attempt (current PB 3:02, Warsaw). He is user #1.

## Results

- 680+ unique visitors and 90+ generated plans since going live in Aug 2026.
- A plan narrative costs about USD 0.05, with a median generation time of 18 s.
- 1,500+ automated tests.

## Architecture

- **App:** Next.js 15 (App Router), TypeScript and Tailwind CSS, deployed on Vercel with a
  preview deployment per branch.
- **Data & auth:** Supabase (Postgres plus magic-link auth).
- **Pacing engine:** deterministic: GPX parsing, segmentation, Grade Adjusted Pace and a
  late-race fade model. Metric internally, unit conversion only in the presentation layer.
- **Weather:** Open-Meteo forecasts, including wind by course heading.
- **i18n:** full EN / DE / PL with next-intl.
- **E-mail & analytics:** transactional e-mail via Resend; cookieless, self-hosted analytics
  (Umami).
- **Payments:** Stripe one-time checkout is implemented and kept behind a feature flag. The
  product is currently free.
- **Production:** generation rate limits, per-call LLM cost telemetry and 1,500+ automated tests.

## Where AI is used, and where it isn't

**The numbers are deterministic.** They come from the engine, tested against reference fixtures
from courses Tomasz has raced (e.g. Warsaw). An LLM should never invent a split.

**The narrative is the LLM.** Claude (Sonnet) writes the segment-by-segment race narrative from
the engine's numbers, in the user's language. It explains the numbers and never computes them.

- Structured output with Zod, validators that check every pace and time in the text, one targeted
  repair call and a fallback on failure.
- Model choice: Claude Sonnet, picked after measuring latency, cost and rejected outputs.
- Race calendar: Claude Haiku reads race dates from official race sites, and only dates
  confirmed by a verbatim quote from the source are saved.

## How it was built: AI-native workflow with Claude Code

- A project CLAUDE.md with domain rules, conventions and a definition of done.
- Custom slash commands: a feature workflow (explore, plan, approval, branch, code, verify,
  preview, PR) and a UX audit command.
- A code-reviewer subagent that checks every diff against project rules: units, migrations, i18n,
  LLM model choice, payment flag.
- A post-edit hook that runs ESLint on changed files.
- A Vercel preview for every branch, checked on mobile before merge.
