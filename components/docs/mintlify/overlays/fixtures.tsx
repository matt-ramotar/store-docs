"use client";

import { useCallback, useRef, useState } from "react";
import type { ComponentFixture } from "../fixture-contract";
import {
  Search,
  SearchButton,
  SearchProvider,
  Tooltip,
  useSearch,
  type SearchProps,
  type SearchResult,
} from "./index";

export const searchResults: SearchResult[] = [
  {
    id: "store-response",
    header: "StoreResponse.Data",
    content: "Fresh data emitted by the Store pipeline.",
    link: "/docs/store6/concepts/read-contract",
    metadata: { breadcrumbs: ["Store 6", "Responses"], version: "6" },
  },
  {
    id: "network-fallback",
    header: "Network fallback",
    content: "Continue showing cached data while a remote refresh is unavailable.",
    icon: <span aria-hidden="true">↻</span>,
    link: "/docs/store6/concepts/freshness",
    metadata: { breadcrumbs: ["Store 6", "Fetching"], version: "6" },
  },
  {
    id: "long-result",
    header: "A deliberately long search result heading that verifies narrow viewport wrapping without hiding the destination",
    content: "A deliberately long description preserves readable wrapping for nested Store response, converter, validator, and updater guidance.",
    link: "/docs/store6/concepts/errors",
    metadata: { breadcrumbs: ["Store 6", "Reference", "Long content"], version: "6" },
  },
];

const recentSearches: SearchResult[] = [searchResults[0]];

function ControlledSearch({
  initialOpen,
  isLoading = false,
  results,
  position = "top",
}: {
  initialOpen: boolean;
  isLoading?: boolean;
  results: SearchResult[];
  position?: SearchProps["position"];
}) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [query, setQuery] = useState("");
  const [selection, setSelection] = useState("None");
  const [inputAttached, setInputAttached] = useState(false);
  const inputRef = useCallback((input: HTMLInputElement | null) => {
    setInputAttached(input !== null);
  }, []);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const close = () => {
    setIsOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  };

  return (
    <section
      className="store-overlays-fixture"
      data-search-position={position}
      data-search-input-ref={inputAttached ? "attached" : "detached"}
      data-search-state={isOpen ? "open" : "closed"}
    >
      <SearchButton
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        onClick={() => setIsOpen(true)}
        ref={triggerRef}
        shortcutText="⌘K"
      >
        Search supplied documentation data
      </SearchButton>
      <Search
        className="c5-controlled-search"
        emptyState={<p data-search-state="empty">No supplied results match this query.</p>}
        isLoading={isLoading}
        isOpen={isOpen}
        loadingState={<p data-search-state="loading">Loading supplied results…</p>}
        onClose={close}
        onSearch={(value) => setQuery(value)}
        onSelectResult={(result, selectedQuery) => setSelection(`${result.id}:${selectedQuery}`)}
        paddingTop="5rem"
        placeholder="Search Store 5 and Store 6"
        position={position}
        recentSearches={recentSearches}
        ref={inputRef}
        results={results}
      />
      <output aria-live="polite" data-fixture-events="search">
        query:{query || "empty"} | selected:{selection}
      </output>
    </section>
  );
}

function ProviderControls() {
  const search = useSearch();
  const [buttonClicks, setButtonClicks] = useState(0);
  const [hiddenShortcutClicks, setHiddenShortcutClicks] = useState(0);
  const [hiddenShortcutRef, setHiddenShortcutRef] = useState("detached");
  const inspectHiddenShortcutRef = useCallback((button: HTMLButtonElement | null) => {
    setHiddenShortcutRef(button ? "attached" : "detached");
  }, []);
  if (!search) return <output data-fixture-events="provider">Provider unavailable</output>;
  return (
    <div>
      <SearchButton aria-expanded={search.isOpen} onClick={() => { setButtonClicks(value => value + 1); search.open(); }} showShortcut shortcutText="/">
        Search fixture data
      </SearchButton>
      <button type="button" onClick={search.toggle}>Toggle search</button>
      <button type="button" onClick={search.close}>Close search</button>
      <SearchButton
        aria-label="Search without a shortcut hint"
        data-search-button-case="shortcut-hidden"
        onClick={() => setHiddenShortcutClicks((value) => value + 1)}
        ref={inspectHiddenShortcutRef}
        shortcutText="⌘K"
        showShortcut={false}
      >
        Inspect hidden shortcut
      </SearchButton>
      <label>Shortcut suppression probe <input aria-label="Provider shortcut suppression probe" /></label>
      <output data-fixture-events="provider">{search.isOpen ? "open" : "closed"} | button-clicks:{buttonClicks}</output>
      <output aria-live="polite" data-fixture-events="search-button-shortcut-hidden">
        ref:{hiddenShortcutRef} | clicks:{hiddenShortcutClicks}
      </output>
    </div>
  );
}

function ProviderFixture() {
  const [query, setQuery] = useState("");
  const [selection, setSelection] = useState("None");
  return (
    <SearchProvider
      requireModifier={false}
      shortcutKey="/"
      searchProps={{
        onSearch: setQuery,
        onSelectResult: (result, selectedQuery) => setSelection(`${result.id}:${selectedQuery}`),
        placeholder: "Search deterministic fixture data",
        position: "center",
        results: searchResults,
      }}
    >
      <ProviderControls />
      <output aria-live="polite" data-fixture-events="provider-callbacks">
        query:{query || "empty"} | selected:{selection}
      </output>
    </SearchProvider>
  );
}

export const fixtures: ComponentFixture[] = [
  {
    id: "overlays-tooltip",
    name: "Tooltip",
    description: "Keyboard, hover, and touch triggers with long text, placement, CTA, and closed-to-open portal behavior.",
    assertions: [
      "Keyboard focus opens the tooltip and Escape closes it",
      "The trigger receives aria-describedby while the tooltip is open",
      "Touch click toggles the tooltip without requiring hover",
      "Escape closes without moving keyboard focus away from the trigger",
      "Long title and description text wrap inside the body-mounted portal",
      "Placement covers top, bottom, left, right, inline-start, and inline-end sides plus start, center, and end alignment",
    ],
    render: () => <div className="store-overlays-fixture-row">
      <Tooltip title="Cached response" description="The latest StoreResponse remains readable while a refresh is in flight." side="top" align="start">
        <button type="button" data-tooltip-case="keyboard-top-start">Focus for details</button>
      </Tooltip>
      <Tooltip
        title="A deliberately long tooltip title that must remain readable on narrow touch screens"
        description="This deliberately long description checks wrapping in a body-mounted portal without clipping the call to action or obscuring focus rings."
        cta="Read the retry policy"
        href="/docs/store6/concepts/errors"
        side="bottom"
        align="end"
      >
        <button type="button" data-tooltip-case="touch-bottom-end">Touch for details</button>
      </Tooltip>
      {(["left", "right", "inline-start", "inline-end"] as const).map((side, index) => (
        <Tooltip
          key={side}
          title={`${side} placement`}
          description="Placement fixture"
          cta={side === "left" ? "Open external API reference" : side === "right" ? "Incomplete CTA" : undefined}
          href={side === "left" ? "https://example.com/store-api" : undefined}
          side={side}
          align={(["start", "center", "end"] as const)[index % 3]}
        >
          <button type="button" data-tooltip-case={`placement-${side}`}>{side}</button>
        </Tooltip>
      ))}
    </div>,
  },
  {
    id: "overlays-search-closed",
    name: "Search closed",
    description: "Closed top-position search with a real trigger, input ref, recent searches, and focus restoration target.",
    assertions: ["The dialog is initially closed", "The trigger opens search, retains the displayed ⌘K shortcut and moves focus to the search input", "The external input ref attaches to that focused portal input while open and clears on close", "Escape closes the dialog and restores focus to the trigger"],
    render: () => <ControlledSearch initialOpen={false} results={[]} />,
  },
  {
    id: "overlays-search-loading",
    name: "Search loading",
    description: "Top-position search opened from its trigger with custom loading content and a real supplied onSearch callback.",
    assertions: ["Typing loading invokes the supplied onSearch callback and reports query:loading", "The supplied Loading supplied results… state replaces results while isLoading is true", "Escape closes, clears the input ref and restores trigger focus"],
    render: () => <ControlledSearch initialOpen={false} isLoading results={[]} />,
  },
  {
    id: "overlays-search-empty",
    name: "Search empty",
    description: "Centered search opened from its trigger with custom empty content after a query returns no supplied data.",
    assertions: ["Typing absent invokes the supplied onSearch callback and reports query:absent", "The supplied No supplied results match this query. state appears only for a non-empty query", "Center position preserves the dialog input focus ring"],
    render: () => <ControlledSearch initialOpen={false} position="center" results={[]} />,
  },
  {
    id: "overlays-search-results",
    name: "Search results",
    description: "Results search opened from its trigger with deterministic breadcrumbs, long text, and a real supplied selection callback.",
    assertions: ["Results render only after a query", "ArrowDown and Enter select the focused result; Control+Enter or Meta+Enter selects the first result", "The supplied onSelectResult callback reports the selected result ID and current query", "Tab retains input focus and moves the caret to the query end when results exist", "Long result text stays readable"],
    render: () => <ControlledSearch initialOpen={false} results={searchResults} />,
  },
  {
    id: "overlays-search-provider",
    name: "SearchProvider and useSearch",
    description: "Standalone fixture-only provider with compatible hook controls, custom no-modifier shortcut, and supplied search data.",
    assertions: ["The / shortcut opens search outside editable fields and is ignored inside the suppression-probe input", "useSearch open, close, and toggle update the same provider", "SearchButton click opens the provider and increments button-clicks once", "The Search without a shortcut hint button renders no shortcut text and reports ref:attached", "Activating Inspect hidden shortcut increments its independent clicks count", "Provider onSearch and onSelectResult callbacks receive live values"],
    render: () => <ProviderFixture />,
  },
];
