import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { loadFixtureModule } from "./mintlify-test-utils.mjs";

const overlays = await loadFixtureModule("components/docs/mintlify/overlays/index.tsx");
const fixtureModule = await loadFixtureModule("components/docs/mintlify/overlays/fixtures.tsx");
const render = (node) => renderToStaticMarkup(node);

function tooltipElement(props) {
  let element;
  function Probe() { element = overlays.Tooltip(props); return null; }
  render(React.createElement(Probe));
  return element;
}

test("overlay family exports the complete runtime and type-compatible ref adapters", () => {
  for (const name of ["Tooltip", "SearchProvider", "useSearch"]) {
    assert.equal(typeof overlays[name], "function", `${name} is exported`);
  }
  assert.equal(overlays.Search.$$typeof, Symbol.for("react.forward_ref"));
  assert.equal(overlays.SearchButton.$$typeof, Symbol.for("react.forward_ref"));
});

test("Tooltip forwards every declared prop and marks its trigger for scoped theming", () => {
  const child = React.createElement("button", { type: "button" }, "Inspect retry policy");
  const element = tooltipElement({
    align: "end",
    children: child,
    className: "author-tooltip",
    cta: "Read retries",
    description: "Retries preserve the latest cached value.",
    href: "/docs/store6/retries",
    side: "bottom",
    title: "Retry policy",
  });

  assert.equal(element.props.align, "end");
  assert.equal(element.props.children, child);
  assert.equal(element.props.cta, "Read retries");
  assert.equal(element.props.description, "Retries preserve the latest cached value.");
  assert.equal(element.props.href, "/docs/store6/retries");
  assert.equal(element.props.side, "bottom");
  assert.equal(element.props.title, "Retry policy");
  assert.match(element.props.className, /store-mintlify-overlays/);
  assert.match(element.props.className, /store-mintlify-tooltip-trigger/);
  assert.match(element.props.className, /author-tooltip/);
  assert.equal(tooltipElement({ children: null }), null);

  for (const side of ["top", "bottom", "left", "right", "inline-start", "inline-end"]) {
    assert.equal(tooltipElement({ children: "Trigger", side }).props.side, side);
  }
  for (const align of ["start", "center", "end"]) {
    assert.equal(tooltipElement({ align, children: "Trigger" }).props.align, align);
  }
});

test("Search forwards all state, callback, placement, custom-state, and input-ref props", () => {
  const onSearch = () => {};
  const onClose = () => {};
  const onSelectResult = () => {};
  const ref = React.createRef();
  const results = [{
    id: "store-response",
    header: "StoreResponse.Data",
    content: "Fresh data emitted by the Store pipeline.",
    link: "/docs/store6/store-response",
    metadata: { breadcrumbs: ["Store 6", "Responses"], version: "6" },
  }];
  const recentSearches = [{ ...results[0], id: "recent-response" }];
  const props = {
    className: "author-search",
    emptyState: React.createElement("p", null, "Nothing matched."),
    isLoading: true,
    isOpen: true,
    loadingState: React.createElement("p", null, "Loading supplied results."),
    onClose,
    onSearch,
    onSelectResult,
    paddingTop: "5rem",
    placeholder: "Search both Store versions",
    position: "center",
    recentSearches,
    results,
  };
  const element = overlays.Search.render(props, ref);

  assert.equal(element.props.forwardedRef, ref);
  for (const name of ["emptyState", "isLoading", "isOpen", "loadingState", "onClose", "onSearch", "onSelectResult", "paddingTop", "placeholder", "position", "recentSearches", "results"]) {
    assert.equal(element.props[name], props[name], `${name} is preserved`);
  }
  assert.match(element.props.className, /author-search/);
});

test("Search portal observer names its own dialog and attaches and clears the actual input ref", () => {
  const originalDocument = globalThis.document;
  const originalMutationObserver = globalThis.MutationObserver;
  let portal = null;
  let observer;
  const events = [];
  const externalRef = { current: null };
  const input = { id: "portal-search-input" };
  const dialog = {
    getAttribute: (name) => name === "role" ? "dialog" : null,
    querySelector: (selector) => selector === 'input[type="search"]' ? input : null,
    setAttribute: (name, value) => events.push(`${name}:${value}`),
  };
  class FakeMutationObserver {
    constructor(callback) {
      this.callback = callback;
      this.disconnected = false;
      observer = this;
    }
    observe(target, options) {
      this.target = target;
      this.options = options;
    }
    disconnect() {
      this.disconnected = true;
    }
  }

  try {
    globalThis.document = {
      body: { id: "body" },
      getElementsByClassName: (className) => ({
        [Symbol.iterator]: function* () {
          assert.equal(className, "store-mintlify-search-portal-test");
          if (portal) yield portal;
        },
      }),
    };
    globalThis.MutationObserver = FakeMutationObserver;
    const cleanup = overlays.observeSearchPortal(
      "store-mintlify-search-portal-test",
      (value) => {
        externalRef.current = value;
        events.push(value);
      },
    );

    assert.deepEqual(observer.options, { childList: true, subtree: true });
    assert.equal(externalRef.current, null);
    portal = dialog;
    observer.callback([]);
    assert.equal(events[0], "aria-label:Search documentation");
    assert.equal(events[1], input);
    assert.equal(externalRef.current, input);

    portal = null;
    observer.callback([]);
    assert.equal(externalRef.current, null);
    portal = dialog;
    observer.callback([]);
    assert.equal(externalRef.current, input);
    cleanup();
    assert.equal(observer.disconnected, true);
    assert.equal(externalRef.current, null);
  } finally {
    if (originalDocument === undefined) delete globalThis.document;
    else globalThis.document = originalDocument;
    if (originalMutationObserver === undefined) delete globalThis.MutationObserver;
    else globalThis.MutationObserver = originalMutationObserver;
  }
});

test("SearchButton preserves native button props, shortcuts, callbacks, children, and ref", () => {
  const onClick = () => {};
  const ref = React.createRef();
  const element = overlays.SearchButton.render({
    "aria-label": "Open documentation search",
    children: "Find an API",
    className: "author-button",
    disabled: true,
    onClick,
    shortcutText: "Ctrl+/",
    showShortcut: false,
  }, ref);

  assert.equal(element.props.ref, ref);
  assert.equal(element.props["aria-label"], "Open documentation search");
  assert.equal(element.props.children, "Find an API");
  assert.equal(element.props.disabled, true);
  assert.equal(element.props.onClick, onClick);
  assert.equal(element.props.shortcutText, "Ctrl+/");
  assert.equal(element.props.showShortcut, false);
  assert.match(element.props.className, /store-mintlify-search-button/);
  assert.match(element.props.className, /author-button/);
});

test("SearchProvider keeps package context compatibility and every provider prop", () => {
  const onSearch = () => {};
  const searchProps = { onSearch, results: [], placeholder: "Search supplied data" };
  const child = React.createElement("span", null, "Provider child");
  const element = overlays.SearchProvider({
    children: child,
    requireModifier: false,
    searchProps,
    shortcutKey: "/",
  });

  assert.equal(element.props.children, child);
  assert.equal(element.props.requireModifier, false);
  assert.equal(element.props.searchProps.onSearch, onSearch);
  assert.equal(element.props.searchProps.results, searchProps.results);
  assert.equal(element.props.searchProps.placeholder, "Search supplied data");
  assert.equal(element.props.shortcutKey, "/");
  assert.doesNotThrow(() => render(React.createElement(overlays.SearchProvider, {
    children: child,
    requireModifier: false,
    searchProps,
    shortcutKey: "/",
  })));
});

test("serializable MDX excludes callback-required Search and SearchProvider", async () => {
  const mdx = await readFile(new URL("../components/docs/mintlify/overlays/serializable.mdx", import.meta.url), "utf8");
  assert.match(mdx, /<Tooltip\b/);
  assert.match(mdx, /<SearchButton\b/);
  assert.doesNotMatch(mdx, /<Search(?:Provider)?\b/);
  assert.match(mdx, /supplied data/i);
});

test("fixtures are executable, deterministic, and cover every required overlay state", () => {
  const { fixtures, searchResults } = fixtureModule;
  assert.deepEqual(fixtures.map(({ id }) => id), [
    "overlays-tooltip",
    "overlays-search-closed",
    "overlays-search-loading",
    "overlays-search-empty",
    "overlays-search-results",
    "overlays-search-provider",
  ]);
  assert.equal(new Set(fixtures.map(({ id }) => id)).size, fixtures.length);
  assert.deepEqual(searchResults.map(({ id }) => id), ["store-response", "network-fallback", "long-result"]);
  for (const fixture of fixtures) {
    assert.equal(typeof fixture.render, "function");
    assert.ok(fixture.assertions.length > 0, `${fixture.id} has assertions`);
    assert.doesNotThrow(() => render(fixture.render()), fixture.id);
  }
  const corpus = JSON.stringify(fixtures.map(({ description, assertions }) => ({ description, assertions })));
  for (const required of ["open", "closed", "loading", "empty", "results", "long", "Escape", "focus", "keyboard", "touch", "aria-describedby", "onSearch", "onSelectResult", "shortcut", "top", "center"]) {
    assert.match(corpus, new RegExp(required, "i"), required);
  }
});

test("Tooltip acceptance fixture exposes stable touch, placement, and CTA targets", () => {
  const fixture = fixtureModule.fixtures.find(({ id }) => id === "overlays-tooltip");
  const markup = render(fixture.render());
  for (const target of ["keyboard-top-start", "touch-bottom-end", "placement-left", "placement-right", "placement-inline-start", "placement-inline-end"]) {
    assert.match(markup, new RegExp(`data-tooltip-case="${target}"`));
  }
  assert.match(fixture.description, /touch/);
  assert.match(fixture.description, /placement/);
  assert.match(fixture.description, /CTA/);
  assert.match(fixture.assertions.join("\n"), /Touch click toggles/);
  assert.match(fixture.assertions.join("\n"), /top, bottom, left, right, inline-start, and inline-end/);
});

test("Search acceptance fixtures bind each remaining keyboard, focus, ref, and supplied-state transition", () => {
  const byId = Object.fromEntries(fixtureModule.fixtures.map(fixture => [fixture.id, fixture]));
  assert.match(byId["overlays-search-closed"].assertions.join("\n"), /focused portal input/);
  assert.match(byId["overlays-search-closed"].assertions.join("\n"), /clears on close/);
  assert.match(byId["overlays-search-loading"].assertions.join("\n"), /supplied onSearch callback/);
  assert.match(byId["overlays-search-loading"].assertions.join("\n"), /Loading supplied results/);
  assert.match(byId["overlays-search-empty"].assertions.join("\n"), /No supplied results match/);
  assert.match(byId["overlays-search-results"].assertions.join("\n"), /Control\+Enter or Meta\+Enter/);
  assert.match(byId["overlays-search-results"].assertions.join("\n"), /Tab retains input focus/);
  assert.match(byId["overlays-search-provider"].assertions.join("\n"), /ignored inside the suppression-probe input/);
  const providerMarkup = render(byId["overlays-search-provider"].render());
  assert.match(providerMarkup, /aria-label="Provider shortcut suppression probe"/);
  assert.match(providerMarkup, /button-clicks:0/);
});

test("family CSS scopes body-mounted search and tooltip portals to Store docs", async () => {
  const css = await readFile(new URL("../components/docs/mintlify/overlays/styles.css", import.meta.url), "utf8");
  assert.match(css, /\.store-docs \.store-mintlify-search/);
  assert.match(css, /\.store-docs \.store-mintlify-search\[role="dialog"\]/);
  assert.match(css, /\.store-docs \.store-mintlify-search > div:last-child > div/);
  assert.match(css, /\.store-docs \[data-component-part="tooltip-content"\]/);
  assert.match(css, /var\(--overlay\)/);
  assert.match(css, /var\(--overlay-foreground\)/);
  assert.match(css, /var\(--field-background\)/);
  assert.match(css, /var\(--field-placeholder\)/);
  assert.match(css, /var\(--accent\)/);
  assert.match(css, /var\(--focus\)/);
  assert.match(css, /overflow-wrap:\s*anywhere/);
  assert.match(css, /white-space:\s*normal/);
  assert.match(css, /@media\s*\(pointer:\s*coarse\)/);
  const selectorLines = css.split("\n").map((line) => line.trim()).filter((line) =>
    (line.endsWith("{") && !line.startsWith("@")) || line.endsWith(","),
  );
  for (const selector of selectorLines) assert.match(selector, /^\.store-docs\s/, `unscoped selector: ${selector}`);
});
