---
title: "RAG Pipeline Design: Chunking, Embeddings, and Retrieval Trade-offs"
docId: rag-pipeline-design
date: 2026-07-22
source: https://tecode.pl/blog/rag-pipeline-design
---

# RAG Pipeline Design: Chunking, Embeddings, and Retrieval Trade-offs

## The Problem RAG Actually Solves

Retrieval-augmented generation addresses a fundamental limitation: LLMs have finite context
windows and knowledge cutoffs. RAG grounds model responses in current, specific corpora by
retrieving relevant text passages at query time. This post explores that through `ragsume`, a
personal project using blog posts as test data.

## Chunking: The Foundation

Chunking strategy has the most significant downstream impact on system performance. Three
approaches stand out:

- **Fixed-size chunks** offer simplicity but risk fragmenting meaningful units across boundaries.
- **Semantic/structural chunking** preserves context by splitting on markdown headings or
  paragraph breaks — found superior for technical prose.
- **Overlap between chunks** mitigates boundary-loss issues while introducing retrieval
  redundancy.

The key insight: a bad chunking strategy can't be fixed by a better embedding model later.

## Embeddings: Beyond Keywords

Embedding models map text to a vector space where semantically similar content clusters
together. Rather than pursuing specialized models universally, the embedding choice should match
corpus characteristics — general-purpose embeddings suffice for small, diverse corpora.

## Retrieval: Vector Search Limitations

Pure vector similarity search has blind spots; semantically similar text differs from relevant
text. Two improvements are worth considering:

- **Hybrid search** merges vector and keyword-based approaches to capture both semantic nuance
  and exact terminology.
- **Re-ranking** applies more expensive relevance scoring to top candidates before final
  selection.

## Practical Takeaway

Treat pipeline stages — chunking, embedding, retrieval, and generation — as independently
testable, so failures can be diagnosed at the right stage instead of always being blamed on the
LLM output.
