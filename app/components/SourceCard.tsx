type Source = { docId: string; chunkId: string; title: string; excerpt: string };

export function SourceCard({ source }: { source: Source }) {
  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 text-sm">
      <div className="font-medium text-zinc-900 dark:text-zinc-100">{source.title}</div>
      <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
        {source.docId} · {source.chunkId}
      </div>
      <p className="mt-2 text-zinc-600 dark:text-zinc-300 line-clamp-3">{source.excerpt}</p>
    </div>
  );
}
