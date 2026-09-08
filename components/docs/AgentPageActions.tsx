"use client";

import { Description, Dropdown, Label } from "@heroui/react";
import {
  ArrowDown01Icon,
  Copy01Icon,
  LinkSquare01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useState } from "react";

import { AgentBrandLogo } from "@/components/icons/AgentBrandLogo";
import { MarkdownLogo } from "@/components/icons/MarkdownLogo";
import { createAgentChatUrl, createAgentSetupPrompt } from "@/lib/agent-page-prompt";
import { copyAgentPage } from "@/lib/copy-agent-page";

type CopyAction = "prompt" | "markdown";

export function AgentPageActions({
  markdownUrl,
  ...page
}: {
  markdownUrl: string;
  title: string;
  canonicalUrl: string;
}) {
  const markdownPath = new URL(markdownUrl).pathname;
  const [busy, setBusy] = useState<CopyAction | null>(null);
  const [copied, setCopied] = useState<CopyAction | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(null), 2500);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  async function copy(action: CopyAction) {
    setBusy(action);
    setCopied(null);
    setError("");

    try {
      if (action === "prompt") {
        await navigator.clipboard.writeText(createAgentSetupPrompt(page));
      } else {
        await copyAgentPage(markdownPath, {
          fetchPage: fetch,
          writeText: (markdown) => navigator.clipboard.writeText(markdown),
        });
      }
      setCopied(action);
    } catch {
      setError(action === "prompt"
        ? "Could not copy. Open the agent setup guide from the menu."
        : "Could not copy. Open View as Markdown from the menu to copy manually.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex max-w-full flex-wrap items-center gap-2 text-sm font-medium">
      <button
        aria-busy={busy === "prompt"}
        aria-label="Copy Prompt"
        className="bg-default text-foreground hover:bg-surface-tertiary inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-3.5 py-2 transition-colors disabled:cursor-wait disabled:opacity-60"
        disabled={busy !== null}
        onClick={() => copy("prompt")}
        type="button"
      >
        <span aria-hidden="true" className="flex -space-x-2">
          <span className="ring-default relative z-20 flex size-6 items-center justify-center rounded-full bg-[#14120b] ring-2">
            <AgentBrandLogo brand="cursor" onDark size={16} />
          </span>
          <span className="ring-default relative z-10 flex size-6 items-center justify-center rounded-full bg-[#d97757] ring-2">
            <AgentBrandLogo brand="claude" onDark size={20} />
          </span>
          <span className="ring-default flex size-6 items-center justify-center rounded-full bg-white ring-2">
            <AgentBrandLogo brand="openai" size={18} />
          </span>
        </span>
        <span className="min-w-[5.25rem] text-center">
          {busy === "prompt" ? "Copying…" : copied === "prompt" ? "Copied!" : "Copy Prompt"}
        </span>
      </button>
      <div role="group" aria-label="Markdown actions" className="bg-default inline-flex items-center rounded-full">
        <button
          aria-busy={busy === "markdown"}
          aria-label="Copy Markdown"
          className="text-foreground hover:bg-surface-tertiary inline-flex min-h-11 items-center justify-center gap-2 rounded-l-full py-2 pl-3.5 pr-3 transition-colors disabled:cursor-wait disabled:opacity-60"
          disabled={busy !== null}
          onClick={() => copy("markdown")}
          type="button"
        >
          <HugeiconsIcon aria-hidden icon={Copy01Icon} size={18} strokeWidth={1.5} />
          <span className="min-w-[6.75rem] text-center">
            {busy === "markdown" ? "Copying…" : copied === "markdown" ? "Copied!" : "Copy Markdown"}
          </span>
        </button>
        <span aria-hidden="true" className="bg-separator h-4 w-px" />
        <Dropdown>
          <Dropdown.Trigger
            aria-label="More Markdown actions"
            className="text-muted hover:bg-surface-tertiary hover:text-foreground aria-expanded:bg-surface-tertiary group flex min-h-11 min-w-11 items-center justify-center rounded-r-full transition-colors"
          >
            <HugeiconsIcon aria-hidden className="transition-transform group-aria-expanded:rotate-180 motion-reduce:transition-none" icon={ArrowDown01Icon} size={16} strokeWidth={1.5} />
          </Dropdown.Trigger>
          <Dropdown.Popover
            className="bg-surface w-[22rem] max-w-[calc(100vw-2rem)] rounded-[1.75rem] p-2 shadow-xl"
            offset={8}
            placement="bottom end"
          >
            <Dropdown.Menu aria-label="Page and agent actions" className="gap-1 p-1">
              <Dropdown.Item aria-label="View as Markdown" className="min-h-16 gap-3 rounded-2xl px-3 py-2.5" id="view-markdown" textValue="View as Markdown" href={markdownPath}>
                <MarkdownLogo />
                <div className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
                  <Label className="text-base font-medium">View as Markdown</Label>
                  <Description className="text-foreground-secondary text-sm leading-5">View this page in Markdown format</Description>
                </div>
              </Dropdown.Item>
              <Dropdown.Item aria-label="Set up in Cursor" className="min-h-16 gap-3 rounded-2xl px-3 py-2.5" id="cursor-setup" textValue="Set up in Cursor" href="/docs/store6/agents/agent-skills#cursor">
                <AgentBrandLogo brand="cursor" />
                <div className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
                  <Label className="text-base font-medium">Set up in Cursor</Label>
                  <Description className="text-foreground-secondary text-sm leading-5">Store6 skill setup guide</Description>
                </div>
              </Dropdown.Item>
              <Dropdown.Item aria-label="Set up in VS Code" className="min-h-16 gap-3 rounded-2xl px-3 py-2.5" id="vscode-setup" textValue="Set up in VS Code" href="/docs/store6/agents/agent-skills#vs-code">
                <AgentBrandLogo brand="vscode" />
                <div className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
                  <Label className="text-base font-medium">Set up in VS Code</Label>
                  <Description className="text-foreground-secondary text-sm leading-5">Store6 skill setup for Copilot</Description>
                </div>
              </Dropdown.Item>
              <Dropdown.Item aria-label="Open in ChatGPT" className="min-h-16 gap-3 rounded-2xl px-3 py-2.5" id="open-chatgpt" textValue="Open in ChatGPT" href={createAgentChatUrl("chatgpt", markdownUrl)} target="_blank" rel="noopener noreferrer">
                <AgentBrandLogo brand="openai" />
                <div className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
                  <Label className="text-base font-medium">Open in ChatGPT</Label>
                  <Description className="text-foreground-secondary text-sm leading-5">Ask questions about this page</Description>
                </div>
                <HugeiconsIcon aria-hidden className="text-muted shrink-0" icon={LinkSquare01Icon} size={16} strokeWidth={1.5} />
              </Dropdown.Item>
              <Dropdown.Item aria-label="Open in Claude" className="min-h-16 gap-3 rounded-2xl px-3 py-2.5" id="open-claude" textValue="Open in Claude" href={createAgentChatUrl("claude", markdownUrl)} target="_blank" rel="noopener noreferrer">
                <AgentBrandLogo brand="claude" />
                <div className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
                  <Label className="text-base font-medium">Open in Claude</Label>
                  <Description className="text-foreground-secondary text-sm leading-5">Ask questions about this page</Description>
                </div>
                <HugeiconsIcon aria-hidden className="text-muted shrink-0" icon={LinkSquare01Icon} size={16} strokeWidth={1.5} />
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>
      </div>
      <span className="sr-only" role="status" aria-live="polite">
        {error || (copied === "prompt" ? "Prompt copied." : copied === "markdown" ? "Markdown copied." : "")}
      </span>
      {error ? <p className="text-foreground-secondary basis-full text-xs font-normal">{error}</p> : null}
    </div>
  );
}
