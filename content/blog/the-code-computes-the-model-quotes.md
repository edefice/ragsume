---
title: "The Code Computes, the Model Quotes: Keeping an LLM Honest About Numbers in Production"
docId: the-code-computes-the-model-quotes
date: 2026-10-18
source: https://tecode.pl/blog/the-code-computes-the-model-quotes
---

# The Code Computes, the Model Quotes: Keeping an LLM Honest About Numbers in Production

In Splitshape, a deterministic engine computes every pace and time, and Claude only quotes them. How I check that after every generation, what structured output doesn't enforce, and how I picked the model by measuring instead of guessing.

## One wrong number is enough

Splitshape builds pacing and fueling plans for marathons and half marathons. A plan is mostly numbers: a target pace for every kilometer, a running clock at each split, the temperature you'll be running in. Next to the table there are coach-style race notes written by Claude: where to hold back, and why.

The notes quote numbers from the table, and that's where the risk is. If the note for KM 28-34 says "hold 4:31/km" and the table says something else, the runner has to decide which one to believe. Whichever they pick, they now trust neither. One wrong number in the prose costs the credibility of the whole plan.

This isn't hypothetical. Two bugs I caught during development: a segment near the finish of a hot-weather Frankfurt plan cited the 29°C race-start temperature, while the reading for that stretch was 33-34°C. And after I switched the table to weather-adjusted paces, a note quoted 1:03:08, a time that matched no column the runner could see (the visible one said 1:03:14). That's the real problem: an LLM's wrong number doesn't look wrong.

So the rule in the project instructions is short: the code computes, the model only quotes.

## The engine computes, the model gets strings

Every number in a plan comes from a deterministic pacing engine: grade adjusted pace, a late-race fade model, weather correction.

The model gets a per-kilometer data table in which every value it may write is already formatted: the pace is "4:08/km", the running clock is "2:06:46", the temperature is "11°C". The raw seconds never go into the prompt; they stay on the server, for validation only. The prompt rule is blunt: quote a pace only as the exact display string of a row inside that segment, character for character, and never calculate, round, average or convert anything.

"Convert" includes kilometers to miles. One call generates the notes in both units, and each variant gets its own table that's already in its unit ("6:39/mi" in the imperial one). I learned that the hard way: a refactor dropped a formatted reference line, which left the imperial table with seconds per kilometer only, so the model had to do the arithmetic in its head. It mostly got it right, and "mostly" is exactly what you can't ship on a pace band. If a number isn't in the table, it can't be in the text.

## Check everything after generation

A prompt rule is a request, not a guarantee. So after every generation, deterministic validators read the text again.

**Paces and clock times.** A regex finds every clock-shaped token in the notes, in English, German and Polish notations ("4:08/km", "4:08 min na km", "pro Kilometer"), and checks it against the rows the segment covers, with one row of margin on each side. The tolerance is ±2 s: the model copies prepared strings, so a correct citation matches exactly, and the two seconds only absorb rounding between a raw value and its display string. The unit has to match too. A "/km" pace inside the imperial notes fails even if the digits are right.

**Temperatures.** Every "°C" or "°F" number in a segment has to fall within that segment's own interpolated temperature or dew point range, give or take one degree. That's the check that catches the Frankfurt bug. It had a bug of its own: a range like "31-34°C" was read as "-34°C" until I added a lookbehind to the regex. Validators are code, and code needs tests.

**One targeted repair, then strip.** A segment that fails gets one small repair call with only that segment, its own rows and the list of wrong values, not a resend of the whole narrative. Then the validators run again, and whatever is still wrong gets cut out: a sentence without a concrete value beats one with a wrong value. Titles and summaries skip the repair and go straight to stripping: a round trip costs more than the number is worth.

Simplified:

```ts
// Simplified from Splitshape's narrative layer
async function groundNarrative(narrative, ctx) {
  const mismatches = findMismatches(narrative, ctx); // paces/times (±2 s, right unit), temperatures
  if (mismatches.length === 0) return narrative;

  // One targeted repair call per flagged segment text, in parallel
  const repaired = await repairSegments(narrative, mismatches, ctx);

  // Anything still wrong is removed, never shown
  const remaining = findMismatches(repaired, ctx);
  return remaining.length === 0 ? repaired : stripMismatches(repaired, remaining);
}
```

**A fallback that never takes the plan away.** If generation fails outright (a timeout, a provider error, a response too broken to parse), the plan is still saved with real splits, real weather and a pace band. Only the notes are replaced with a short, pre-translated message, and when a refresh fails, the old notes stay. The AI layer can degrade, but it can't break the product.

## Structured output: length limits are only hints

I use structured output with Zod schemas, and I assumed a `.max(220)` on a string field would be enforced. It isn't. Structured outputs in the Messages API don't support string length or array size constraints, so the SDK strips them from the schema and mentions them in the field description, where they work as a strong hint and nothing more.

I found out the expensive way. The post-generation parse used the same strict schema, so one 230-character summary against a 220-character cap failed the entire narrative, both units, into the fallback note. In the model comparison, that happened in 2 of 18 runs on Claude Sonnet 5.

The fix was two schemas instead of one. The request schema keeps the caps as hints. The parse schema is lenient: an over-long string is clamped back under its cap at the last sentence boundary that fits (skipping abbreviations like the Polish "np." or the German "z.B."), surplus list items are dropped, and only missing fields or wrong types still fail. A slightly shorter sentence beats no race notes at all.

Again simplified:

```ts
// Request schema: the caps are only a hint to the model
const SegmentSchema = z.object({
  text: z.string().max(600),
  summary: z.string().max(220).describe("Exactly one sentence"),
});

// Parse schema: clamps at a sentence (or word) boundary instead of failing
const clamped = (max: number) => z.string().transform((v) => clampText(v, max));
const SegmentParseSchema = z.object({
  text: clamped(600),
  summary: clamped(220),
});
```

## Choosing the model by measuring

Splitshape runs on Claude Sonnet, not Opus. This is production text generation over data that's already computed, not complex reasoning, and a person is waiting for their plan. I didn't benchmark Opus: that call was based on the nature of the task. The choice between two Sonnet versions I did measure.

The comparison script runs the exact production path (generation, validation, repair, telemetry) on reference courses in all three languages, with fixed weather scenarios, and writes every narrative to a file next to a summary of latency, cost, schema failures and repairs. Changing the model means running the script first.

In two comparison runs on October 1, with nine generations per model each on the same inputs, Claude Sonnet 5.5 had a median of about 22 s against about 37 s for Sonnet 5, no schema failures (against those 2 of 18) and no repairs. It was also cheaper per plan in both runs. Both models are priced the same per token in my cost table, so that gap is purely token counts. A little adaptive thinking didn't measurably help, so thinking stayed off.

The best model isn't immune, though. On October 9 I re-ran the comparison on Sonnet 5.5 alone: in 1 of 9 runs the validator flagged an ungrounded number and sent a repair call. That's the point of validating every generation, not only the ones from the model you trust less.

Production, as of 17 October 2026, over the last 60 days on Sonnet 5.5 and the current prompt version: 40 generations, an average of USD 0.0495 per narrative, a median of 18.4 s and a p95 of 24.2 s, with no repairs and no fallbacks. The separate fueling note, a much shorter generation, costs about USD 0.0074 to 0.008 with a median of 3.7 to 4.1 s. These numbers tell me nothing is on fire, not that the problem is solved.

## Limitations, and what I'd do differently

**Validators only see what they can parse.** Clock-shaped paces and times and "°C/°F" temperatures are covered; a number in a form the regexes don't recognize passes unchecked. Matching on notation keeps the checks language-independent, and it's also their blind spot.

**Stripping is blunt.** Removing a wrong value leaves a correct but vaguer sentence, tidied up, not rewritten. I'd rather have vague than wrong, but it's not elegant.

**The samples are small.** There are 91 plans in the database and 126 logged LLM calls in 60 days. Nine runs per model in a comparison and 40 production generations are enough to catch a regression, not to prove a rate.

What I'd do differently: treat the data table as the API contract from day one, with formatted strings in every unit, instead of arriving there through regressions. Split the request and parse schemas from the start. Build the comparison script before picking the first model. What I'd keep: the rules live in tests, not only in the prompt. The codebase has 1,578 tests (Vitest), and every validator has its own test file.

## A checklist for numbers in LLM output

- Let code compute every number. Give the model formatted strings, in every unit you display.
- Keep raw values out of the prompt and on the server, for validation.
- Validate after generation, deterministically, with a tolerance that only absorbs rounding. Check the unit, not just the digits.
- Repair narrowly and once, then strip. Never show a number you couldn't verify.
- Have a fallback that keeps the product working without the model.
- Don't rely on length limits in structured output schemas. Parse leniently and clamp.
- Pick models with a script on fixed inputs, and log cost, latency, repairs and the prompt version for every production call.

## Try it

Splitshape is free at splitshape.run. If you have a race coming up, tell me whether the notes hold up on your course.

I'm looking for a full-stack or front-end leaning TypeScript role where AI is part of the product or the workflow, and my CV is available on request.
