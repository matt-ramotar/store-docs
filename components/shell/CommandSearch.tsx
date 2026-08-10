"use client";

import { Button, Chip, Kbd } from "@heroui/react";
import { Command } from "@heroui-pro/react";
import { useDocsSearch } from "fumadocs-core/search/client";
import { oramaStaticClient } from "fumadocs-core/search/client/orama-static";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  normalizeSearchResult,
  type NormalizedSearchResult,
} from "@/lib/search-results";

const SEARCH_DIALOG_ID = "documentation-command-search";
const localSearchClient = oramaStaticClient({ from: "/api/search" });

export function CommandSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const { search, setSearch, query } = useDocsSearch({
    client: localSearchClient,
    delayMs: 100,
  });
  const results = useMemo(
    () =>
      Array.isArray(query.data)
        ? query.data
            .map(normalizeSearchResult)
            .filter((result): result is NormalizedSearchResult => result !== null)
        : [],
    [query.data],
  );

  const setOpen = useCallback(
    (nextOpen: boolean) => {
      setIsOpen(nextOpen);
      if (!nextOpen) setSearch("");
    },
    [setSearch],
  );
  const exposeKeyboardShortcut = useCallback((node: HTMLButtonElement | null) => {
    // The Button primitive filters this global ARIA attribute before it reaches the DOM.
    node?.setAttribute("aria-keyshortcuts", "Meta+K Control+K");
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (
        event.defaultPrevented ||
        event.repeat ||
        event.altKey ||
        event.shiftKey ||
        event.key.toLowerCase() !== "k" ||
        (!event.metaKey && !event.ctrlKey) ||
        isEditableTarget(event.target)
      ) {
        return;
      }

      event.preventDefault();
      setOpen(true);
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [setOpen]);

  const status = getSearchStatus(search, query.isLoading, query.error, results.length);

  function openResult(key: React.Key) {
    const result = results.find((candidate) => candidate.id === String(key));
    if (!result) return;

    setOpen(false);
    window.location.assign(result.url);
  }

  return (
    <>
      <Button
        aria-controls={SEARCH_DIALOG_ID}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-keyshortcuts="Meta+K Control+K"
        aria-label="Search documentation"
        onPress={() => setOpen(true)}
        ref={exposeKeyboardShortcut}
        variant="outline"
      >
        <span className="hidden sm:inline">Search</span>
        <Kbd className="text-xs">
          <Kbd.Abbr keyValue="command" />
          <Kbd.Content>K</Kbd.Content>
        </Kbd>
      </Button>

      <Command>
        <Command.Backdrop isOpen={isOpen} onOpenChange={setOpen}>
          <Command.Container size="lg">
            <Command.Dialog
              aria-label="Search documentation"
              filter={() => true}
              id={SEARCH_DIALOG_ID}
              inputValue={search}
              onInputChange={setSearch}
            >
              <Command.InputGroup autoFocus>
                <Command.InputGroup.Input
                  aria-label="Search Store documentation"
                  placeholder="Search Store 5 and Store 6 documentation"
                />
                <Command.InputGroup.ClearButton aria-label="Clear search" />
                <Command.InputGroup.Suffix>
                  <Kbd className="text-xs">
                    <Kbd.Content>Esc</Kbd.Content>
                  </Kbd>
                </Command.InputGroup.Suffix>
              </Command.InputGroup>

              <SearchStatus error={query.error} message={status} />

              <Command.List aria-label="Documentation search results" onAction={openResult}>
                {results.length > 0 ? (
                  <Command.Group heading="Documentation">
                    {results.map((result) => (
                      <Command.Item
                        id={result.id}
                        key={result.id}
                        textValue={`${result.title} ${result.context} ${result.version}`}
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">{result.title}</span>
                          {result.context ? (
                            <span className="text-muted block truncate text-xs">
                              {result.context}
                            </span>
                          ) : null}
                        </span>
                        <Chip size="sm" variant="soft">
                          <Chip.Label>{result.version}</Chip.Label>
                        </Chip>
                      </Command.Item>
                    ))}
                  </Command.Group>
                ) : null}
              </Command.List>

              <Command.Footer className="text-muted justify-between text-xs">
                <span>Store 5 and Store 6</span>
                <span>Enter to open</span>
              </Command.Footer>
            </Command.Dialog>
          </Command.Container>
        </Command.Backdrop>
      </Command>
    </>
  );
}

function SearchStatus({ error, message }: { error?: Error; message: string }) {
  return (
    <div
      className={`px-3 py-2 text-xs ${error ? "text-danger" : "text-muted"}`}
      role={error ? "alert" : "status"}
    >
      {message}
    </div>
  );
}

function getSearchStatus(
  search: string,
  isLoading: boolean,
  error: Error | undefined,
  resultCount: number,
): string {
  if (error) return "Search is unavailable.";
  if (isLoading) return "Searching documentation…";
  if (!search.trim()) return "Type a term to search both documentation trees.";
  if (resultCount === 0) return "No results found.";
  return `${resultCount} ${resultCount === 1 ? "result" : "results"}.`;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target.closest("input, textarea, select, [contenteditable='true']") !== null
  );
}
