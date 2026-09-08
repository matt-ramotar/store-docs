"use client";

import { useState } from "react";

import { copyAgentPage } from "@/lib/copy-agent-page";

export function AgentPageActions({ markdownUrl }: { markdownUrl: string }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function copy() {
    setBusy(true);
    setMessage("");

    try {
      await copyAgentPage(markdownUrl, {
        fetchPage: fetch,
        writeText: (text) => navigator.clipboard.writeText(text),
      });
      setMessage("Page copied.");
    } catch {
      setMessage("Could not copy the page. Use View Markdown to open it.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 text-sm">
      <button
        aria-busy={busy}
        className="border-border bg-surface text-foreground hover:bg-default min-h-11 rounded-lg border px-3 py-2 font-medium transition-colors disabled:cursor-wait disabled:opacity-60"
        disabled={busy}
        onClick={copy}
        type="button"
      >
        {busy ? "Copying…" : "Copy page"}
      </button>
      <a
        className="text-accent-strong inline-flex min-h-11 items-center rounded-lg px-1 font-medium underline decoration-separator underline-offset-4"
        href={markdownUrl}
      >
        View Markdown
      </a>
      <span className="text-foreground-secondary" role="status" aria-live="polite">
        {message}
      </span>
    </div>
  );
}
