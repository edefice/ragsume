import matter from "gray-matter";

export interface Chunk {
  chunkId: string;
  docId: string;
  docTitle: string;
  heading: string | null;
  text: string;
  source: string;
}

interface Section {
  heading: string | null;
  body: string;
}

const MAX_CHUNK_CHARS = 800;
const OVERLAP_CHARS = 150;

/**
 * Splits markdown into sections at ATX headings (#, ##, ...), keeping the
 * heading text as section context and everything below it (until the next
 * heading of any level) as the section body.
 */
function splitByHeadings(markdown: string): Section[] {
  const lines = markdown.split("\n");
  const sections: Section[] = [];
  let currentHeading: string | null = null;
  let currentLines: string[] = [];

  const flush = () => {
    const body = currentLines.join("\n").trim();
    if (body.length > 0) {
      sections.push({ heading: currentHeading, body });
    }
    currentLines = [];
  };

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      flush();
      currentHeading = headingMatch[2].trim();
    } else {
      currentLines.push(line);
    }
  }
  flush();

  return sections;
}

/**
 * Greedily packs paragraphs into chunks up to MAX_CHUNK_CHARS, carrying the
 * tail of one chunk into the start of the next so retrieval doesn't lose
 * context at a chunk boundary.
 */
function chunkSectionBody(body: string): string[] {
  const paragraphs = body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  if (paragraphs.length === 0) return [];

  const chunks: string[] = [];
  let current = "";

  for (const paragraph of paragraphs) {
    const candidate = current ? `${current}\n\n${paragraph}` : paragraph;

    if (candidate.length <= MAX_CHUNK_CHARS || current === "") {
      current = candidate;
      continue;
    }

    chunks.push(current);
    const tail = current.slice(-OVERLAP_CHARS);
    current = `${tail}\n\n${paragraph}`;
  }

  if (current) chunks.push(current);

  return chunks;
}

/**
 * Chunks a single markdown document (with optional frontmatter) into
 * retrieval-sized pieces, one per section/paragraph-group, prefixed with
 * their heading for context.
 */
export function chunkDocument(raw: string, source: string): Chunk[] {
  const { data, content } = matter(raw);
  const docId: string = data.docId ?? source;
  const docTitle: string = data.title ?? docId;

  const sections = splitByHeadings(content);
  const chunks: Chunk[] = [];
  let index = 0;

  for (const section of sections) {
    const pieces = chunkSectionBody(section.body);
    for (const text of pieces) {
      const prefixed = section.heading ? `${section.heading}\n\n${text}` : text;
      chunks.push({
        chunkId: `${docId}#${index}`,
        docId,
        docTitle,
        heading: section.heading,
        text: prefixed,
        source,
      });
      index += 1;
    }
  }

  return chunks;
}
