import { describe, expect, it } from "vitest";
import { chunkDocument } from "../lib/chunk";

describe("chunkDocument", () => {
  it("reads docId/title from frontmatter and splits sections by heading", () => {
    const markdown = `---
title: "Test Doc"
docId: test-doc
---

# Intro

First paragraph.

## Details

Second paragraph.
`;
    const chunks = chunkDocument(markdown, "content/test.md");

    expect(chunks.every((c) => c.docId === "test-doc")).toBe(true);
    expect(chunks.every((c) => c.docTitle === "Test Doc")).toBe(true);
    expect(chunks.map((c) => c.heading)).toEqual(["Intro", "Details"]);
    expect(chunks[0].text).toContain("First paragraph.");
    expect(chunks[1].text).toContain("Second paragraph.");
  });

  it("assigns unique, stable chunkIds within a document", () => {
    const markdown = `---
docId: doc
---

# H

Para one.

Para two.
`;
    const chunks = chunkDocument(markdown, "content/doc.md");
    const ids = chunks.map((c) => c.chunkId);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids[0]).toBe("doc#0");
  });

  it("falls back to the source path when docId/title are missing", () => {
    const chunks = chunkDocument("# Heading\n\nBody text.", "content/no-frontmatter.md");
    expect(chunks[0].docId).toBe("content/no-frontmatter.md");
    expect(chunks[0].docTitle).toBe("content/no-frontmatter.md");
  });
});
