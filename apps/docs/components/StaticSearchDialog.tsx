'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { SharedProps } from 'fumadocs-ui/components/dialog/search';

interface SearchEntry {
  title: string;
  description: string;
  url: string;
  content: string;
}

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export default function StaticSearchDialog({ open, onOpenChange }: SharedProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState('');
  const [entries, setEntries] = useState<SearchEntry[]>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open || entries || error) return;

    fetch(`${basePath}/search-index.json`)
      .then((response) => {
        if (!response.ok) throw new Error(`Search index request failed (${response.status}).`);
        return response.json() as Promise<SearchEntry[]>;
      })
      .then(setEntries)
      .catch((cause: unknown) => {
        setError(cause instanceof Error ? cause.message : 'The search index could not be loaded.');
      });
  }, [open, entries, error]);

  const results = useMemo(() => {
    const terms = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
    if (!entries || terms.length === 0) return [];

    return entries
      .map((entry) => {
        const searchable = `${entry.title} ${entry.description} ${entry.content}`.toLocaleLowerCase();
        const matches = terms.every((term) => searchable.includes(term));
        const score = terms.reduce(
          (total, term) => total + (entry.title.toLocaleLowerCase().includes(term) ? 3 : 0)
            + (entry.description.toLocaleLowerCase().includes(term) ? 2 : 0),
          0,
        );
        return { entry, matches, score };
      })
      .filter((result) => result.matches)
      .sort((left, right) => right.score - left.score)
      .slice(0, 8)
      .map(({ entry }) => entry);
  }, [entries, query]);

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      className="ss-search-dialog"
      aria-label="Search documentation"
      onClose={() => onOpenChange(false)}
      onClick={(event) => {
        if (event.target === dialogRef.current) onOpenChange(false);
      }}
    >
      <form className="ss-search-dialog__form" onSubmit={(event) => event.preventDefault()}>
        <input
          autoFocus
          className="ss-search-dialog__input"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search documentation..."
          aria-label="Search documentation"
        />
        <button
          className="ss-search-dialog__close"
          type="button"
          onClick={() => onOpenChange(false)}
        >
          Close
        </button>
      </form>

      <div className="ss-search-dialog__results" aria-live="polite">
        {error ? (
          <p className="ss-search-dialog__message" role="alert">{error}</p>
        ) : !entries ? (
          <p className="ss-search-dialog__message">Loading search index...</p>
        ) : !query.trim() ? (
          <p className="ss-search-dialog__message">Type to search the documentation.</p>
        ) : results.length === 0 ? (
          <p className="ss-search-dialog__message">No matching pages found.</p>
        ) : (
          results.map((entry) => (
            <a
              className="ss-search-dialog__result"
              href={`${basePath}${entry.url}/`}
              key={entry.url}
              onClick={() => onOpenChange(false)}
            >
              <span className="ss-search-dialog__result-title">{entry.title}</span>
              <span className="ss-search-dialog__result-description">{entry.description}</span>
            </a>
          ))
        )}
      </div>
    </dialog>
  );
}
