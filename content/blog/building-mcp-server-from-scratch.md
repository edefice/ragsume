---
title: "Building an MCP Server From Scratch: What I Learned"
docId: building-mcp-server-from-scratch
date: 2026-07-18
source: https://tecode.pl/blog/building-mcp-server-from-scratch
---

# Building an MCP Server From Scratch: What I Learned

Notes from building `job-search-mcp`, a small MCP server — what the protocol actually asks of you
once you're the one exposing tools instead of consuming them.

## Why build a server instead of just using one

As a daily Claude Code user, I'd already used MCP servers built by others. As a client, the
protocol stays invisible — which is intentional. To really understand it, you need to be the one
providing tools rather than just calling them. `job-search-mcp` came out of that motivation: a
focused MCP server exposing job-search-related tools to compatible clients.

## What MCP actually standardizes

Three things, from a server author's point of view:

1. **Tool definitions** — names, descriptions, and argument schemas written for models to
   interpret. The description is doing real work: it's the only thing the model sees when
   deciding whether and how to call your tool.
2. **Transport** — communication methods vary (stdio for local tools, HTTP for remote ones).
   Transport failures often produce silent hangs rather than explicit errors.
3. **Structured responses** — results must be formatted consistently so models can reliably parse
   and reason about them.

## The part that surprised me: description quality is the interface

Coming from front-end design work, tool descriptions turn out to function as the primary
interface. A vague description leads to a model either never calling the tool or calling it with
the wrong arguments. Effective descriptions read more like well-crafted function signatures and
docstrings than marketing copy.

## Error handling looks different

Unlike REST APIs returning 400 status codes for human developers, MCP errors reach models during
autonomous execution. That demands clearer messaging about what failed and what a valid input
actually looks like.

## What's still rough

The project is personally useful but not production-ready. Stronger schema-level validation and
more sophisticated pagination for large result sets are still on the list.

## Where the code lives

The repository is publicly available at
[github.com/edefice/job-search-mcp](https://github.com/edefice/job-search-mcp).
