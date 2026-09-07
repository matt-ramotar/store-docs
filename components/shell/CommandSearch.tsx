"use client";

import { Button, Chip, Kbd } from "@heroui/react";
import { Command } from "@heroui-pro/react";
import { Icon } from "@iconify/react";
import { useDocsSearch } from "fumadocs-core/search/client";
import { oramaStaticClient } from "fumadocs-core/search/client/orama-static";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { DocsVersion } from "@/lib/nav";
import {
  createTrackedSearchClient,
  getSearchTriggerAria,
  SearchResultTracker,
  type SearchView,
  type SearchScope,
} from "@/lib/search-results";

const SEARCH_DIALOG_ID = "documentation-command-search";

export function CommandSearch({ version }: { version: DocsVersion }) {
  const [selection, setSelection] = useState<{ version: DocsVersion; scope: SearchScope }>({
    version,
    scope: version,
  });
  const scope = selection.version === version ? selection.scope : version;
  if (selection.version !== version) setSelection({ version, scope: version });
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [resultTracker] = useState(() => new SearchResultTracker());
  resultTracker.updateScope(scope);
  const trackedSearchClient = useMemo(
    () =>
      createTrackedSearchClient(
        oramaStaticClient({ from: "/api/search", tag: scope === "both" ? undefined : scope }),
        resultTracker,
        scope,
      ),
    [resultTracker, scope],
  );
  const { search, setSearch, query } = useDocsSearch({
    client: trackedSearchClient,
    delayMs: 0,
  });
  const updateSearch = useCallback(
    (nextSearch: string) => {
      resultTracker.updateInput(nextSearch);
      setSearch(nextSearch);
    },
    [resultTracker, setSearch],
  );
  const searchView = resultTracker.resolve(query);

  const setOpen = useCallback(
    (nextOpen: boolean) => {
      setIsOpen(nextOpen);
      if (!nextOpen) {
        updateSearch("");
        requestAnimationFrame(() => triggerRef.current?.focus());
      }
    },
    [updateSearch],
  );
  const exposeKeyboardShortcut = useCallback((node: HTMLButtonElement | null) => {
    // Installed Button source omits this global ARIA attribute from its forwarded props.
    triggerRef.current = node;
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

  const status = getSearchStatus(searchView.state, searchView.results.length);

  function openResult(key: React.Key) {
    const result = resultTracker.getActionableResult(query, String(key));
    if (!result) return;

    setOpen(false);
    window.location.assign(result.url);
  }

  return (
    <>
      <Button
        {...getSearchTriggerAria(isOpen, SEARCH_DIALOG_ID)}
        aria-keyshortcuts="Meta+K Control+K"
        aria-label="Search documentation"
        className="text-muted size-11 min-w-11 justify-center gap-2 font-normal sm:h-11 sm:w-full sm:justify-start"
        onPress={() => setOpen(true)}
        ref={exposeKeyboardShortcut}
        variant="outline"
      >
        <Icon aria-hidden className="size-4 shrink-0" icon="gravity-ui:magnifier" />
        <span className="hidden flex-1 text-start sm:inline">Search...</span>
        <Kbd className="hidden text-xs sm:inline-flex">
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
              onInputChange={updateSearch}
            >
              <Command.InputGroup autoFocus>
                <Command.InputGroup.Input
                  aria-label="Search Store documentation"
                  onKeyDown={(event) => {
                    if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); setOpen(false); }
                  }}
                  placeholder={
                    scope === "both"
                      ? "Search both documentation versions"
                      : `Search Store ${scope === "store6" ? "6" : "5"} documentation`
                  }
                />
                <Command.InputGroup.ClearButton
                  aria-label="Clear search"
                  onPress={() => updateSearch("")}
                />
                <Command.InputGroup.Suffix>
                  <Kbd className="text-xs">
                    <Kbd.Content>Esc</Kbd.Content>
                  </Kbd>
                </Command.InputGroup.Suffix>
              </Command.InputGroup>

              <div className="flex items-center gap-3 border-b border-default px-3 py-2 text-sm">
                <label htmlFor="documentation-search-scope">Search in</label>
                <select
                  className="min-h-11 rounded-lg border border-default bg-surface px-3 text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  id="documentation-search-scope"
                  onKeyDown={(event) => event.stopPropagation()}
                  onChange={(event) => {
                    const nextScope = event.target.value as SearchScope;
                    resultTracker.updateScope(nextScope);
                    setSelection({ version, scope: nextScope });
                  }}
                  value={scope}
                >
                  <option value="store6">Store 6</option>
                  <option value="store5">Store 5</option>
                  <option value="both">Both versions</option>
                </select>
              </div>

              <SearchStatus message={status} state={searchView.state} />

              <Command.List aria-label="Documentation search results" onAction={openResult}>
                {searchView.results.length > 0 ? (
                  <Command.Group heading="Documentation">
                    {searchView.results.map((result) => (
                      <Command.Item
                        id={result.id}
                        key={result.id}
                        textValue={`${result.pageTitle} ${result.sectionTitle} ${result.title} ${result.context} ${result.version}`}
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">{result.title}</span>
                          {result.pageTitle || result.context ? (
                            <span className="text-muted block truncate text-xs">
                              {[
                                result.context,
                                result.type !== "page" ? result.pageTitle : "",
                                result.type === "text" ? result.sectionTitle : "",
                              ].filter(Boolean).join(" / ")}
                            </span>
                          ) : null}
                        </span>
                        <span className="text-muted text-xs">{result.type === "page" ? "Page" : result.type === "heading" ? "Section" : "Text"}</span>
                        <Chip size="sm" variant="soft">
                          <Chip.Label>{result.version}</Chip.Label>
                        </Chip>
                      </Command.Item>
                    ))}
                  </Command.Group>
                ) : null}
              </Command.List>

              <Command.Footer className="text-muted justify-between text-xs">
                <span>{scope === "both" ? "Both versions" : scope === "store6" ? "Store 6" : "Store 5"}</span>
                <span>Enter to open</span>
              </Command.Footer>
            </Command.Dialog>
          </Command.Container>
        </Command.Backdrop>
      </Command>
    </>
  );
}

function SearchStatus({ message, state }: { message: string; state: SearchView["state"] }) {
  const isError = state === "error";

  return (
    <div
      className={`px-3 py-2 text-xs ${isError ? "text-danger" : "text-muted"}`}
      role={isError ? "alert" : "status"}
    >
      {message}
    </div>
  );
}

function getSearchStatus(
  state: SearchView["state"],
  resultCount: number,
): string {
  switch (state) {
    case "idle":
      return "Type a term to search the selected documentation.";
    case "pending":
      return "Searching documentation…";
    case "error":
      return "Search is unavailable.";
    case "empty":
      return "No results found.";
    case "ready":
      return `${resultCount} ${resultCount === 1 ? "result" : "results"}.`;
  }
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target.closest("input, textarea, select, [contenteditable='true']") !== null
  );
}
