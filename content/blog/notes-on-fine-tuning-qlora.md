---
title: "Notes on Fine-Tuning with QLoRA"
docId: notes-on-fine-tuning-qlora
date: 2026-06-29
source: https://tecode.pl/blog/notes-on-fine-tuning-qlora
---

# Notes on Fine-Tuning with QLoRA

Working notes on QLoRA fundamentals from the AI Engineer Core Track — what problem it solves, how
it differs from full fine-tuning, and why it's the practical entry point for fine-tuning on
consumer hardware.

## Why fine-tuning is usually the wrong first move

Before QLoRA specifics, the more important lesson from the course was about sequencing:
fine-tuning is the last tool to reach for, not the first. Prompt engineering, structured outputs,
and RAG solve a large share of "the model doesn't do what I want" problems without touching model
weights at all, and they're cheaper to iterate on. Fine-tuning is for when the model needs to
reliably behave in a way that retrieval and prompting genuinely can't produce — a narrower case
than it might seem.

## What full fine-tuning costs

Full fine-tuning updates every parameter in a model. For any model large enough to be useful, that
means storing optimizer state and gradients for billions of parameters — memory requirements that
put it out of reach of a single consumer GPU, which is the practical wall most people hit
immediately.

## What LoRA changes

Low-Rank Adaptation (LoRA) doesn't update the original model weights at all. Instead, it freezes
them and injects small, trainable low-rank matrices alongside the existing weight matrices in
specific layers (commonly attention layers). During training, only those small added matrices get
updated. The core insight is that the update needed to adapt a model to a new task can often be
approximated by a much lower-rank matrix than the full weight matrix itself — so you train a tiny
fraction of the parameters full fine-tuning would require, while the frozen base model still does
the heavy lifting.

## What the "Q" adds

QLoRA adds quantization on top of LoRA: the frozen base model is loaded in a reduced-precision
format (4-bit, in the standard QLoRA approach) instead of the usual 16- or 32-bit floats, which
cuts the memory needed to even hold the base model in memory. The LoRA adapter matrices themselves
are still trained in higher precision, so the part of the model actually learning isn't degraded
by quantization — only the frozen, unchanged base model is compressed. That combination is
specifically what makes fine-tuning a meaningful-sized model feasible on a single consumer GPU
rather than a multi-GPU cluster.

## The practical shape of a QLoRA run

At a conceptual level, the pieces are:

1. **A base model**, loaded quantized and frozen.
2. **LoRA adapters** attached to target layers, which are the only trainable parameters.
3. **A task-specific dataset**, formatted as the input/output pairs you want the model to learn
   from.
4. **A training loop** that updates only the adapter weights against that dataset.
5. **The output**: a small adapter file, not a new copy of the full model — which can be loaded
   alongside the original base model at inference time.

That last point matters practically: the artifact you produce is small and portable, not a
multi-gigabyte full model checkpoint per task.

## Where I've actually applied this

This reflects course-level understanding of QLoRA's mechanics, not a production fine-tuning
project I've shipped. It's foundational knowledge before applying fine-tuning to real problems —
and so far, RAG and prompt engineering have covered what my projects actually needed.
