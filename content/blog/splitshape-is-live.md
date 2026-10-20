---
title: "Splitshape Is Live: Pacing Plans for Real Race Courses"
docId: splitshape-is-live
date: 2026-09-26
source: https://tecode.pl/blog/splitshape-is-live
---

# Splitshape Is Live: Pacing Plans for Real Race Courses

Last week I officially launched Splitshape, a free web app that turns a race course, a goal time and race-day weather into a km-by-km pacing plan. Why I built it, how it works, and where AI does and doesn't belong in it.

## Why I built it

Last week I officially launched Splitshape, and it started with a very personal problem. My marathon PB is 3:02 from Warsaw, and my next goal is going under three hours. When I sat down to plan my race, every pacing tool I tried gave me some version of the same answer: run even splits, maybe adjusted for hills.

Even splits fail on real courses. A marathon has climbs and descents that change the effort at a given pace, race-day weather that can cost you seconds per kilometer, wind that helps on one stretch and hurts on the next depending on the course heading, and a late-race fade that almost everyone experiences whether they plan for it or not. I wanted a plan that accounted for all of that, so I built one. I'm user #1.

## What it does

You pick a course (one of a growing list of major races with verified elevation profiles, or upload any GPX), set a goal time and optionally add a recent result. Splitshape gives you back a km-by-km (or mile-by-mile) pacing plan with:

- a target pace for every kilometer, adjusted for grade, weather and the modeled fade,
- a realistic finish time in race-day conditions next to your goal, with a breakdown of where the difference comes from,
- coach-style notes for each segment of the course,
- a printable pace band, a Garmin course export and guides for COROS and Apple Watch.

The forecast matters a lot, so there's one free forecast refresh before race day that re-solves the splits and the notes together. It works in English, German and Polish, and it's free.

## Numbers from an engine, words from Claude

The most important design decision was deciding where AI belongs, and where it doesn't.

The numbers come from a deterministic pacing engine. It parses the GPX, splits the course into segments, applies Grade Adjusted Pace and a late-race fade model, and corrects for weather, including wind relative to the course heading. It's tested against reference fixtures from courses I've actually raced. An LLM should never invent a split: if a runner trusts a number on their pace band at kilometer 35, that number has to be reproducible and testable.

Claude writes the narrative. Once the engine has produced structured output, Claude turns it into segment-by-segment race notes, the kind of thing a coach would tell you: where to hold back, where the headwind arrives, why the last kilometers are supposed to be the slowest on the sheet. The notes are generated in the user's language as a prompt parameter, not through a separate localization pipeline.

I use Claude Sonnet rather than Opus. This is production text generation on structured data, not complex reasoning, and latency matters when someone is waiting for their plan.

The generated text doesn't go straight to the user. There are hard rules in the prompt, deterministic post-processing of the output, and tests that enforce copy rules. That layer caught real problems during the build: German notes with anglicisms slipping in, Polish notes that needed proper running terms for uphill and downhill (podbieg, zbieg), and a style rule I care about across the whole product, no em dashes, which is now enforced both in the prompt and in post-processing.

## From first commit to launch

I planned it as a 14-day MVP build, but a lot of the real work turned out to be in the details. A few examples from the history:

- raw GPX elevation noise was inflating total ascent and descent, so the engine now filters it,
- some GPX files have no elevation at all, so missing values are filled from a terrain model,
- forecast data from the weather API is validated before the plan uses it.

As I write this, the repository has 87 merged pull requests.

## How I built it

I built Splitshape solo, end to end: product, UX, code and infrastructure. The stack is Next.js 15 with the App Router, TypeScript and Tailwind CSS on Vercel, Supabase for Postgres and magic-link auth, Open-Meteo for forecasts, Resend for transactional e-mail and self-hosted, cookieless analytics with Umami.

Claude Code was part of the process from day one, with guardrails around it:

- a project CLAUDE.md with the domain rules, conventions and a definition of done,
- custom slash commands, including a feature workflow (explore, plan, approval, branch, code, verify, preview, PR) and a UX audit command,
- a code-reviewer subagent that checks every diff against the project rules: units, migrations, i18n, LLM model choice and the payment flag,
- a post-edit hook running ESLint on changed files,
- a Vercel preview deployment for every branch, checked on my phone before merging.

The pattern that mattered most was the same one I'd use with any collaborator: write the rules down once, review every change, and never merge something I haven't seen working.

## Free, for now

Splitshape is free. Stripe one-time checkout is implemented and kept behind a feature flag, so right now nobody is asked to pay for anything.

## What's next

More races will keep being added. And the real test is still ahead of me: running a sub-3 marathon attempt with a Splitshape pace band on my wrist.

If you have a race coming up, try it at splitshape.run or open the example plan for the Frankfurt Marathon. I'd love to hear how it works on your course. You can read more about the architecture in the Splitshape case study.
