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
    /aria-haspopup=["']dialog["']/,
    /aria-expanded=\{isOpen\}/,
    /aria-controls=\{SEARCH_DIALOG_ID\}/,
    /aria-keyshortcuts=["']Meta\+K Control\+K["']/,
    /setAttribute\(["']aria-keyshortcuts["'], ["']Meta\+K Control\+K["']\)/,
    /ref=\{exposeKeyboardShortcut\}/,
    /addEventListener\(["']keydown["']/,
    /removeEventListener\(["']keydown["']/,
    /isEditableTarget/,
    /query\.isLoading/,
    /query\.error/,
    /No results found/,
    /Chip\.Label>\{result\.version\}<\/Chip\.Label>/,
  ]) {
    assert.match(palette, pattern);
  }

  assert.doesNotMatch(palette, /onClick\s*=/);
  assert.doesNotMatch(palette, /dangerouslySetInnerHTML/);
  assert.doesNotMatch(palette, /https?:\/\//);
});

test("result normalization strips highlights and rejects non-docs URLs", async () => {
  const { normalizeSearchResult } = await import("../lib/search-results.ts");
  const valid = normalizeSearchResult(
    {
      id: "page-1",
      type: "page",
      url: "/docs/store6/quickstart#fetcher",
      content: "<mark>Fetcher</mark> setup",
      breadcrumbs: ["Store 6", "<mark>Quickstart</mark>"],
    },
    4,
  );

  assert.deepEqual(valid, {
    id: "search-result-4",
    url: "/docs/store6/quickstart#fetcher",
    title: "Fetcher setup",
    context: "Store 6 / Quickstart",
    version: "store6",
  });

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
      normalizeSearchResult({ id: url, type: "page", url, content: "Unsafe" }, 0),
      null,
      url,
    );
  }
});

test("the built-index verifier uses the public local static client", () => {
  const verifier = source("scripts/verify-search-index.mjs");
  assert.match(verifier, /fumadocs-core\/search\/client\/orama-static/);
  assert.match(verifier, /client\.search\(["']fetcher["']\)/);
  assert.match(verifier, /api\/search\.body/);
  assert.doesNotMatch(verifier, /@orama\/orama/);
  assert.doesNotMatch(verifier, /https?:\/\//);
});

test("T5 does not introduce a cloud search client or browser secret", () => {
  const combined = targets.map(source).join("\n");
  assert.doesNotMatch(combined, /OramaCloud|oramaCloudClient|collectionID|apiKey|HEROUI_AUTH_TOKEN/);
  assert.doesNotMatch(combined, /from ["']@orama\/core["']/);
  assert.doesNotMatch(combined, /from ["']@orama\/orama["']/);
});
