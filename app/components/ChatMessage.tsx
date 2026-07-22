import type { RagAnswer } from "@/lib/anthropic";
import { SourceCard } from "./SourceCard";

export type ChatEntry =
  | { role: "user"; content: string }
  | { role: "assistant"; content: RagAnswer };

const CONFIDENCE_STYLES: Record<RagAnswer["confidence"], string> = {
  high: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  low: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

export function ChatMessage({ entry }: { entry: ChatEntry }) {
  if (entry.role === "user") {
    return (
      <div className="self-end max-w-xl rounded-2xl bg-zinc-900 px-4 py-2 text-white dark:bg-zinc-100 dark:text-zinc-900">
        {entry.content}
      </div>
    );
  }

  const { answer, confidence, sources } = entry.content;

  return (
    <div className="flex w-full max-w-2xl flex-col gap-3 self-start">
      <div className="rounded-2xl bg-zinc-100 px-4 py-3 dark:bg-zinc-900">
        <p className="whitespace-pre-wrap text-zinc-900 dark:text-zinc-100">{answer}</p>
        <span
          className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${CONFIDENCE_STYLES[confidence]}`}
        >
          {confidence} confidence
        </span>
      </div>
      {sources.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          {sources.map((source) => (
            <SourceCard key={source.chunkId} source={source} />
          ))}
        </div>
      )}
    </div>
  );
}
