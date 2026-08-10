import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const ROOT = resolve(import.meta.dirname, "..");

const targets = [
  "app/api/search/route.ts",
  "components/shell/CommandSearch.tsx",
  "lib/search-index.ts",
  "lib/search-results.ts",
  "scripts/verify-search-index.mjs",
];

function source(path) {
  return existsSync(resolve(ROOT, path)) ? readFileSync(resolve(ROOT, path), "utf8") : "";
}

test("T5 owns the complete local-search surface", () => {
  for (const target of targets) assert.equal(existsSync(resolve(ROOT, target)), true, target);
});

test("the static route exports a Fumadocs source index", () => {
  const index = source("lib/search-index.ts");
  const route = source("app/api/search/route.ts");

  assert.match(index, /createFromSource\(source\)/);
  assert.match(index, /fumadocs-core\/search\/server/);
  assert.match(route, /export const dynamic = ["']force-static["']/);
  assert.match(route, /export const GET = searchIndex\.staticGET/);
});

test("TopNav renders the command-search client island", () => {
  const topNav = source("components/shell/TopNav.tsx");
  assert.match(topNav, /import \{ CommandSearch \}/);
  assert.match(topNav, /<CommandSearch\s*\/>/);
});

test("the palette follows the verified Command compound and accessibility contract", () => {
  const palette = source("components/shell/CommandSearch.tsx");

  for (const pattern of [
    /["']use client["']/,
    /from ["']@heroui-pro\/react["']/,
    /<Command>/,
    /<Command\.Backdrop/,
    /<Command\.Container/,
    /<Command\.Dialog/,
    /<Command\.InputGroup\s+autoFocus/,
    /<Command\.List/,
    /<Command\.Group/,
    /<Command\.Item/,
    /filter=\{\(\) => true\}/,
    /onPress=/,
    /aria-label=["']Search documentation["']/,
    /getSearchTriggerAria\(isOpen, SEARCH_DIALOG_ID\)/,
    /aria-keyshortcuts=["']Meta\+K Control\+K["']/,
    /setAttribute\(["']aria-keyshortcuts["'], ["']Meta\+K Control\+K["']\)/,
    /ref=\{exposeKeyboardShortcut\}/,
    /addEventListener\(["']keydown["']/,
    /removeEventListener\(["']keydown["']/,
    /isEditableTarget/,
    /searchView\.results/,
    /getActionableResult\(query, String\(key\)\)/,
    /No results found/,
    /Chip\.Label>\{result\.version\}<\/Chip\.Label>/,
  ]) {
    assert.match(palette, pattern);
  }

  assert.doesNotMatch(palette, /onClick\s*=/);
  assert.doesNotMatch(palette, /dangerouslySetInnerHTML/);
  assert.doesNotMatch(palette, /https?:\/\//);
});

test("result normalization uses stable source identity and rejects non-docs URLs", async () => {
  const { normalizeSearchResult } = await import("../lib/search-results.ts");
  const valid = normalizeSearchResult(
    {
      id: "page-1",
      type: "page",
      url: "/docs/store6/quickstart#fetcher",
      content: "<mark>Fetcher</mark> setup",
      breadcrumbs: ["Store 6", "<mark>Quickstart</mark>"],
    },
  );

  assert.deepEqual(valid && { ...valid, id: undefined }, {
    id: undefined,
    url: "/docs/store6/quickstart#fetcher",
    title: "Fetcher setup",
    context: "Store 6 / Quickstart",
    version: "store6",
  });
  assert.match(valid.id, /^search-result-/);
  assert.notEqual(valid.id, valid.url);

  const reordered = normalizeSearchResult({
    id: "page-1",
    type: "page",
    url: "/docs/store6/quickstart#fetcher",
    content: "Fetcher setup",
  });
  const differentSource = normalizeSearchResult({
    id: "page-2",
    type: "page",
    url: "/docs/store6/quickstart#fetcher",
    content: "Fetcher setup",
  });
  assert.equal(reordered.id, valid.id);
  assert.notEqual(differentSource.id, valid.id);

  for (const id of ["", " leading-space", "control\u0000id"]) {
    assert.equal(
      normalizeSearchResult({ id, type: "page", url: "/docs/intro", content: "Unsafe" }),
      null,
      JSON.stringify(id),
    );
  }

  for (const url of [
    "https://store.mobilenativefoundation.org/docs/intro",
    "//example.com/docs/intro",
    "/reference/store6-core/index.html",
    "/developer-newsletter/overview",
    "/docs/../../outside",
    "/docs/%2e%2e/outside",
    "javascript:alert(1)",
  ]) {
    assert.equal(
      normalizeSearchResult({ id: `result:${url}`, type: "page", url, content: "Unsafe" }),
      null,
      url,
    );
  }
});

test("version classification uses the parsed normalized pathname", async () => {
  const { normalizeSearchResult } = await import("../lib/search-results.ts");

  for (const url of ["/docs/store6?source=palette", "/docs/store6#overview"]) {
    assert.equal(
      normalizeSearchResult({ id: `id:${url}`, type: "page", url, content: "Store 6" })
        ?.version,
      "store6",
      url,
    );
  }

  assert.equal(
    normalizeSearchResult({
      id: "store60",
      type: "page",
      url: "/docs/store60?source=palette#overview",
      content: "Store 5",
    })?.version,
    "store5",
  );
});

test("search labels normalize Markdown to readable plain text", async () => {
  const { hasSearchMarkdownArtifacts, stripSearchMarkup } = await import(
    "../lib/search-results.ts"
  );
  const fixtures = [
    ["<mark>**Fetcher**</mark> and *emphasis* with `Store`", "Fetcher and emphasis with Store"],
    ["[Quickstart](/docs/quickstart) and ![Store diagram](/store.svg)", "Quickstart and Store diagram"],
    [String.raw`\*literal\* \[brackets\] and \# hash`, "*literal* [brackets] and # hash"],
    ["# Heading\n- first item\n1. second item\n> quoted note", "Heading first item second item quoted note"],
    ["__Strong__ and _emphasis_ with ~~obsolete~~ text", "Strong and emphasis with obsolete text"],
    ["```kotlin\nstore.stream()\n```", "store.stream()"],
    ["<mark>Use</mark> <strong>safe text</strong> &amp; entities", "Use safe text & entities"],
  ];

  for (const [markdown, expected] of fixtures) {
    const plainText = stripSearchMarkup(markdown);
    assert.equal(plainText, expected, markdown);
    assert.equal(hasSearchMarkdownArtifacts(plainText), false, plainText);
  }
});

test("canonical destinations dedupe deterministically with reorder-stable identities", async () => {
  const { normalizeSearchResults } = await import("../lib/search-results.ts");
  const rows = [
    {
      id: "text-result",
      type: "text",
      url: "/docs/store6/guide#topic",
      content: "A longer **topic** explanation.",
    },
    {
      id: "heading-result",
      type: "heading",
      url: "/docs/store6/section/../guide#topic",
      content: "`Topic`",
    },
    {
      id: "other-result",
      type: "heading",
      url: "/docs/quickstart#topic",
      content: "Topic",
    },
  ];

  const forward = normalizeSearchResults(rows);
  const reversed = normalizeSearchResults([...rows].reverse());
  const byUrl = (results) =>
    Object.fromEntries(
      results
        .map((result) => [result.url, result])
        .sort(([left], [right]) => left.localeCompare(right)),
    );

  assert.deepEqual(byUrl(forward), byUrl(reversed));
  assert.equal(forward.length, 2);
  assert.equal(new Set(forward.map((result) => result.url)).size, forward.length);
  assert.equal(new Set(forward.map((result) => result.id)).size, forward.length);
  assert.equal(byUrl(forward)["/docs/store6/guide#topic"].title, "Topic");
  assert.match(byUrl(forward)["/docs/store6/guide#topic"].id, /^search-result-/);
  assert.notEqual(
    byUrl(forward)["/docs/store6/guide#topic"].id,
    "/docs/store6/guide#topic",
  );
});

test("search generations hide and disarm blank, changed, pending, failed, and late data", async () => {
  const stateModule = await import("../lib/search-results.ts").catch(() => ({}));
  assert.equal(typeof stateModule.SearchResultTracker, "function");
  assert.equal(typeof stateModule.createTrackedSearchClient, "function");

  const { SearchResultTracker, createTrackedSearchClient } = stateModule;
  const requests = [];
  const tracker = new SearchResultTracker();
  const client = createTrackedSearchClient(
    {
      deps: ["fixture"],
      search(query) {
        return new Promise((resolveRequest, rejectRequest) => {
          requests.push({ query, reject: rejectRequest, resolve: resolveRequest });
        });
      },
    },
    tracker,
  );
  const result = {
    id: "fetcher-heading",
    type: "heading",
    url: "/docs/store6/quickstart#fetcher",
    content: "<mark>Fetcher</mark>",
  };

  tracker.updateInput("fetcher");
  const oldRequest = client.search("fetcher");
  tracker.updateInput("adapter");
  assert.deepEqual(tracker.resolve({ data: undefined, error: undefined, isLoading: false }), {
    results: [],
    state: "pending",
  });

  tracker.updateInput("");
  assert.deepEqual(tracker.resolve({ data: [result], error: undefined, isLoading: false }), {
    results: [],
    state: "idle",
  });

  tracker.updateInput("fetcher");
  requests[0].resolve([result]);
  const lateResults = await oldRequest;
  assert.deepEqual(tracker.resolve({ data: lateResults, error: undefined, isLoading: false }), {
    results: [],
    state: "pending",
  });
  assert.equal(
    tracker.getActionableResult(
      { data: lateResults, error: undefined, isLoading: false },
      "search-result-fetcher-heading",
    ),
    null,
  );

  const currentRequest = client.search("fetcher");
  requests[1].resolve([result]);
  const currentResults = await currentRequest;
  const ready = tracker.resolve({ data: currentResults, error: undefined, isLoading: false });
  assert.equal(ready.state, "ready");
  assert.equal(ready.results.length, 1);
  assert.equal(
    tracker.getActionableResult(
      { data: currentResults, error: undefined, isLoading: false },
      ready.results[0].id,
    )?.url,
    "/docs/store6/quickstart#fetcher",
  );
  assert.deepEqual(
    tracker.resolve({ data: currentResults, error: undefined, isLoading: true }),
    { results: [], state: "pending" },
  );

  tracker.updateInput("broken");
  const failure = new Error("fixture failure");
  const failedRequest = client.search("broken");
  requests[2].reject(failure);
  await assert.rejects(failedRequest, failure);
  assert.deepEqual(tracker.resolve({ data: currentResults, error: failure, isLoading: false }), {
    results: [],
    state: "error",
  });

  tracker.updateInput("new query");
  assert.deepEqual(tracker.resolve({ data: currentResults, error: failure, isLoading: false }), {
    results: [],
    state: "pending",
  });
});

test("search trigger relationship exists only while its dialog target is open", async () => {
  const stateModule = await import("../lib/search-results.ts").catch(() => ({}));
  assert.equal(typeof stateModule.getSearchTriggerAria, "function");

  assert.deepEqual(stateModule.getSearchTriggerAria(false, "search-dialog"), {
    "aria-expanded": false,
    "aria-haspopup": "dialog",
  });
  assert.deepEqual(stateModule.getSearchTriggerAria(true, "search-dialog"), {
    "aria-controls": "search-dialog",
    "aria-expanded": true,
    "aria-haspopup": "dialog",
  });
});

test("the built-index verifier uses the public local static client", () => {
  const verifier = source("scripts/verify-search-index.mjs");
  assert.match(verifier, /fumadocs-core\/search\/client\/orama-static/);
  assert.match(verifier, /client\.search\(["']fetcher["']\)/);
  assert.match(verifier, /api\/search\.body/);
  assert.match(verifier, /normalizeSearchResults/);
  assert.match(verifier, /rawResults\.length, 54/);
  assert.match(verifier, /quickstart\.html/);
  assert.match(verifier, /aria-controls/);
  assert.doesNotMatch(verifier, /@orama\/orama/);
  assert.doesNotMatch(verifier, /https?:\/\//);
});

test("T5 does not introduce a cloud search client or browser secret", () => {
  const combined = targets.map(source).join("\n");
  assert.doesNotMatch(combined, /OramaCloud|oramaCloudClient|collectionID|apiKey|HEROUI_AUTH_TOKEN/);
  assert.doesNotMatch(combined, /from ["']@orama\/core["']/);
  assert.doesNotMatch(combined, /from ["']@orama\/orama["']/);
});
