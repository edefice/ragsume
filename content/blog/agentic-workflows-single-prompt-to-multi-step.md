---
title: "Agentic Workflows: From a Single Prompt to Multi-Step Tool Use"
docId: agentic-workflows-single-prompt-to-multi-step
date: 2026-06-08
source: https://tecode.pl/blog/agentic-workflows-single-prompt-to-multi-step
---

# Agentic Workflows: From a Single Prompt to Multi-Step Tool Use

## Overview

A single LLM call that answers a question is not an agent, no matter how good the prompt is. What
actually constitutes an agent is a continuous cycle: the model decides on an action, a tool
executes it, the result returns to context, and the process repeats until the task is done.

## Core Components

Three essential building blocks: tools (functions with defined schemas), state management
(tracking results and context across steps), and a control loop (the orchestration mechanism).
Each needs deliberate design rather than ad-hoc implementation.

## Challenge Areas

The real difficulty shows up when plans hit unexpected outcomes — failed tool calls, malformed
arguments, infinite loops. These mirror distributed-systems challenges like retries, validation,
and timeouts, which is part of why backend engineering experience translates well into agent
development.

## Design Philosophy

Rather than giving models maximum flexibility, effective agents constrain choices within
structured boundaries. A smaller, well-described tool set beats a large, loosely-described one —
focused tool design strengthens reliability more than sophisticated prompting alone.

Evaluating and measuring agent performance remains an open area to explore further.
