"use client";

import { useState, type FormEvent } from "react";
import { ChatMessage, type ChatEntry } from "./components/ChatMessage";
import type { RagAnswer } from "@/lib/anthropic";

export default function Home() {
  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const question = input.trim();
    if (!question || loading) return;

    setEntries((prev) => [...prev, { role: "user", content: question }]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      if (!res.ok) {
        throw new Error("Something went wrong. Please try again.");
      }

      const answer: RagAnswer = await res.json();
      setEntries((prev) => [...prev, { role: "assistant", content: answer }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 dark:bg-black">
      <main className="flex w-full max-w-3xl flex-1 flex-col px-4 py-8 sm:px-8">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Ask My CV
          </h1>
          <p className="mt-1 text-zinc-500 dark:text-zinc-400">
            Ask anything about Tomasz&apos;s experience, skills, or projects —
            answered from his CV and project write-ups, with sources cited.
          </p>
        </header>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto pb-4">
          {entries.length === 0 && !loading && (
            <p className="text-sm text-zinc-400 dark:text-zinc-600">
              Try: &quot;What&apos;s Tomasz&apos;s front-end experience?&quot; or
              &quot;What AI projects has he built?&quot;
            </p>
          )}
          {entries.map((entry, i) => (
            <ChatMessage key={i} entry={entry} />
          ))}
          {loading && (
            <p className="text-sm text-zinc-400 dark:text-zinc-600">Thinking…</p>
          )}
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-800"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about Tomasz's CV..."
            className="flex-1 rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            Ask
          </button>
        </form>
      </main>
    </div>
  );
}
