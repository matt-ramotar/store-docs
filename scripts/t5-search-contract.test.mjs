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

test("search label normalization uses the pinned Markdown and GFM AST parser", () => {
  const packageJson = JSON.parse(source("package.json"));
  const normalizer = source("lib/search-results.ts");

  assert.equal(packageJson.dependencies["mdast-util-from-markdown"], "2.0.3");
  assert.equal(packageJson.dependencies["mdast-util-gfm"], "3.1.0");
  assert.equal(packageJson.dependencies["micromark-extension-gfm"], "3.0.0");
  assert.match(normalizer, /from ["']mdast-util-from-markdown["']/);
  assert.match(normalizer, /from ["']mdast-util-gfm["']/);
  assert.match(normalizer, /from ["']micromark-extension-gfm["']/);
  assert.match(normalizer, /fromMarkdown\(/);
});

test("search labels normalize Markdown to readable plain text", async (t) => {
  const { hasSearchMarkdownArtifacts, normalizeSearchLabel, stripSearchMarkup } = await import(
    "../lib/search-results.ts"
  );
  const fixtures = [
    {
      markdown: "<mark>**Fetcher**</mark> and *emphasis* with `Store`",
      expected: "Fetcher and emphasis with Store",
      consumedKinds: ["code", "emphasis", "html"],
    },
    {
      markdown: "[Quickstart](/docs/quickstart) and ![Store diagram](/store.svg)",
      expected: "Quickstart and Store diagram",
      consumedKinds: ["image", "link"],
    },
    {
      markdown: "[label](https://example.test/a_(b)) and [outer [inner]](/docs/store6)",
      expected: "label and outer [inner]",
      consumedKinds: ["link"],
    },
    {
      markdown: "# Heading\n- first item\n1. second item\n> quoted note",
      expected: "Heading first item second item quoted note",
      consumedKinds: ["blockquote", "heading", "list"],
    },
    {
      markdown: "__Strong__ and _emphasis_ with ~~obsolete~~ text",
      expected: "Strong and emphasis with obsolete text",
      consumedKinds: ["emphasis", "strikethrough"],
    },
    {
      markdown: "*single asterisk* and _single underscore_",
      expected: "single asterisk and single underscore",
      consumedKinds: ["emphasis"],
    },
    {
      markdown: "```kotlin\nstore.stream()\n```",
      expected: "store.stream()",
      consumedKinds: ["code"],
    },
    {
      markdown: "<mark>Use</mark> <strong>safe text</strong> &amp; entities",
      expected: "Use safe text & entities",
      consumedKinds: ["entity", "html"],
    },
    {
      markdown: '<span title="a > b">quoted attribute</span>',
      expected: "quoted attribute",
      consumedKinds: ["html"],
    },
    {
      markdown: "[Quickstart][guide]\n\n[guide]: /docs/store6 \"Store 6\"",
      expected: "Quickstart",
      consumedKinds: ["link", "reference-definition"],
    },
    {
      markdown: "[guide]: /docs/store6",
      expected: "",
      consumedKinds: ["reference-definition"],
    },
    {
      markdown: "![Store diagram][image]\n\n[image]: /store.svg",
      expected: "Store diagram",
      consumedKinds: ["image", "reference-definition"],
    },
    {
      markdown: "&#x2A;*hex** and &#42;*decimal** and &ast;*named**",
      expected: "hex and decimal and named",
      consumedKinds: ["emphasis", "entity"],
    },
    {
      markdown: "&#96;numeric code&#96; and &grave;named code&grave;",
      expected: "numeric code and named code",
      consumedKinds: ["code", "entity"],
    },
    {
      markdown: "&#xE000;0&#xE001;",
      expected: "\uE0000\uE001",
      consumedKinds: ["entity"],
    },
    {
      markdown: "***[Use `Store`][guide]***\n\n[guide]: /docs/store6",
      expected: "Use Store",
      consumedKinds: ["code", "emphasis", "link", "reference-definition"],
    },
  ];

  for (const { consumedKinds, expected, markdown } of fixtures) {
    await t.test(JSON.stringify(markdown), () => {
      assert.equal(hasSearchMarkdownArtifacts(markdown), true, markdown);
      assert.deepEqual(normalizeSearchLabel(markdown), {
        text: expected,
        consumedKinds,
        residualKinds: [],
      });
      assert.equal(stripSearchMarkup(markdown), expected, markdown);
    });
  }

  await t.test("escaped literal markers remain literal", () => {
    const escapedLiterals = String.raw`\*literal\* \_underscores\_ \[brackets\] and \# hash`;
    assert.deepEqual(normalizeSearchLabel(escapedLiterals), {
      text: "*literal* _underscores_ [brackets] and # hash",
      consumedKinds: [],
      residualKinds: [],
    });
    assert.equal(hasSearchMarkdownArtifacts(escapedLiterals), false);
    const plainControls = "2 * 3 and snake_case";
    assert.deepEqual(normalizeSearchLabel(plainControls), {
      text: plainControls,
      consumedKinds: [],
      residualKinds: [],
    });
    assert.equal(hasSearchMarkdownArtifacts(plainControls), false);
  });

  await t.test("code spans keep nested escapes opaque without leaking sentinels", () => {
    const nested = "`\\*code literal\\*`";
    const normalized = normalizeSearchLabel(nested);
    assert.deepEqual(normalized, {
      text: String.raw`\*code literal\*`,
      consumedKinds: ["code"],
      residualKinds: [],
    });
    assert.doesNotMatch(normalized.text, /[\uD800-\uDFFF]/u);
  });
});

test("search label normalization fails closed without overflowing on resource limits", async () => {
  const {
    normalizeSearchLabel,
    normalizeSearchResult,
    normalizeSearchResults,
    SearchResultTracker,
  } = await import("../lib/search-results.ts");
  const excessiveDepth = `${"> ".repeat(2000)}visible`;
  const badResult = {
    id: "too-deep",
    type: "text",
    url: "/docs/store6/too-deep",
    content: excessiveDepth,
  };
  const goodResult = {
    id: "safe-result",
    type: "page",
    url: "/docs/store6/safe",
    content: "Safe result",
  };

  const invalidLabels = [
    ["depth", excessiveDepth],
    ["nodes", "x\n\n".repeat(5000)],
    ["size", "x".repeat(40_000)],
  ];
  for (const [name, label] of invalidLabels) {
    let diagnostic;
    assert.doesNotThrow(() => {
      diagnostic = normalizeSearchLabel(label);
    }, name);
    assert.equal(diagnostic.text, "", name);
    assert.ok(diagnostic.residualKinds.includes("invalid"), name);
    assert.equal(
      normalizeSearchResult({
        id: `invalid-${name}`,
        type: "text",
        url: `/docs/store6/invalid-${name}`,
        content: label,
      }),
      null,
      name,
    );
  }
  assert.deepEqual(normalizeSearchResults([badResult, goodResult]), [
    {
      id: "search-result-safe-result",
      url: "/docs/store6/safe",
      title: "Safe result",
      context: "",
      version: "store6",
    },
  ]);

  const tracker = new SearchResultTracker();
  tracker.updateInput("safe");
  const generation = tracker.beginRequest("safe");
  assert.doesNotThrow(() => tracker.recordResults([badResult, goodResult], generation));
  assert.deepEqual(tracker.resolve({ data: [badResult, goodResult], isLoading: false }), {
    results: [],
    state: "pending",
  });

  const trackedResults = [badResult, goodResult];
  tracker.recordResults(trackedResults, generation);
  const ready = tracker.resolve({ data: trackedResults, isLoading: false });
  assert.equal(ready.state, "ready");
  assert.deepEqual(ready.results.map((result) => result.title), ["Safe result"]);
});

test("block HTML and MDX preserve safe body text while excluding unsafe raw text", async () => {
  const { normalizeSearchLabel } = await import("../lib/search-results.ts");
  const fixtures = [
    {
      source: "<div>\nVisible **text**\n</div>",
      text: "Visible text",
      consumedKinds: ["emphasis", "html"],
    },
    {
      source: '<Callout title="a > b">\nVisible `code`\n</Callout>',
      text: "Visible code",
      consumedKinds: ["code", "html"],
    },
    {
      source: "<Callout title='a > b'>Single quote</Callout>",
      text: "Single quote",
      consumedKinds: ["html"],
    },
    {
      source: "<Callout title={`a } > b`}>Visible</Callout>",
      text: "Visible",
      consumedKinds: ["html"],
    },
    {
      source: '<div title="a > b"><span>Nested **text**</span></div>',
      text: "Nested text",
      consumedKinds: ["emphasis", "html"],
    },
    {
      source:
        "<div>Safe<script>hidden **script**</script><style>.hidden { display: block; }</style>body</div>",
      text: "Safe body",
      consumedKinds: ["html"],
    },
    {
      source: "Before<!-- hidden **comment** -->After",
      text: "Before After",
      consumedKinds: ["html"],
    },
    {
      source: "`<span>code</span>`",
      text: "<span>code</span>",
      consumedKinds: ["code"],
    },
    {
      source: "```html\n<script>literal</script>\n```",
      text: "<script>literal</script>",
      consumedKinds: ["code"],
    },
    {
      source: "`<!-- code comment -->`",
      text: "<!-- code comment -->",
      consumedKinds: ["code"],
    },
    {
      source: String.raw`\<span>literal\</span>`,
      text: "<span>literal</span>",
      consumedKinds: [],
    },
    {
      source: String.raw`\<!--literal-->`,
      text: "<!--literal-->",
      consumedKinds: [],
    },
    {
      source: "<https://example.test>",
      text: "https://example.test",
      consumedKinds: ["link"],
    },
    {
      source: "<urn:isbn:0451450523>",
      text: "urn:isbn:0451450523",
      consumedKinds: ["link"],
    },
    {
      source: "<>Fragment **text**</>",
      text: "Fragment text",
      consumedKinds: ["emphasis", "html"],
    },
    {
      source: "Before {/* hidden **comment** */} after",
      text: "Before after",
      consumedKinds: ["html"],
    },
    {
      source: "&lt;div&gt;safe **body**&lt;/div&gt;",
      text: "safe body",
      consumedKinds: ["emphasis", "entity", "html"],
    },
    {
      source: "before &lt;script&gt;bad **bold**&lt;/script&gt; after",
      text: "before after",
      consumedKinds: ["emphasis", "entity", "html"],
    },
  ];

  for (const fixture of fixtures) {
    assert.deepEqual(normalizeSearchLabel(fixture.source), {
      text: fixture.text,
      consumedKinds: fixture.consumedKinds,
      residualKinds: [],
    });
  }
});

test("normalization reports pass exhaustion and rejects non-convergent labels", async () => {
  const { normalizeSearchLabel, normalizeSearchResult, stripSearchMarkup } = await import(
    "../lib/search-results.ts"
  );
  const nestEntity = (depth) => {
    let value = "&#x2A;*visible**";
    for (let index = 0; index < depth; index += 1) value = value.replaceAll("&", "&amp;");
    return value;
  };

  for (const depth of [32, 33]) {
    const source = nestEntity(depth);
    const diagnostic = normalizeSearchLabel(source);
    assert.ok(diagnostic.residualKinds.includes("non-convergent"), `depth ${depth}`);
    assert.equal(stripSearchMarkup(source), "", `depth ${depth} must fail closed`);
    assert.equal(
      normalizeSearchResult({
        id: `nested-${depth}`,
        type: "text",
        url: `/docs/store6/nested-${depth}`,
        content: source,
      }),
      null,
    );
  }

  assert.equal(
    normalizeSearchResult({
      id: "nested-breadcrumb",
      type: "page",
      url: "/docs/store6/nested-breadcrumb",
      content: "Safe title",
      breadcrumbs: [nestEntity(32)],
    }),
    null,
  );
});

test("the tracker caches normalized arrays by raw result identity and generation", async () => {
  const { SearchResultTracker } = await import("../lib/search-results.ts");
  let contentReads = 0;
  const makeRawResults = (id, title) => [
    {
      id,
      type: "page",
      url: `/docs/store6/${id}`,
      get content() {
        contentReads += 1;
        return title;
      },
    },
  ];
  const tracker = new SearchResultTracker();
  tracker.updateInput("fetcher");
  const firstGeneration = tracker.beginRequest("fetcher");
  const firstRaw = makeRawResults("first", "First");
  tracker.recordResults(firstRaw, firstGeneration);
  const firstView = tracker.resolve({ data: firstRaw, isLoading: false });
  const repeatedView = tracker.resolve({ data: firstRaw, isLoading: false });
  const action = tracker.getActionableResult(
    { data: firstRaw, isLoading: false },
    firstView.results[0]?.id ?? "",
  );

  assert.deepEqual(
    {
      actionUsesCachedObject: action === firstView.results[0],
      contentReads,
      sameArray: firstView.results === repeatedView.results,
    },
    { actionUsesCachedObject: true, contentReads: 1, sameArray: true },
  );

  const replacementRaw = makeRawResults("replacement", "Replacement");
  tracker.recordResults(replacementRaw, firstGeneration);
  const replacementView = tracker.resolve({ data: replacementRaw, isLoading: false });
  assert.notStrictEqual(replacementView.results, firstView.results);
  assert.equal(contentReads, 2, "each new raw array is normalized exactly once");

  tracker.updateInput("adapter");
  assert.equal(
    tracker.resolve({ data: firstRaw, isLoading: false }).state,
    "pending",
    "a prior generation must not reuse its cached results",
  );
  const secondGeneration = tracker.beginRequest("adapter");
  const secondRaw = makeRawResults("second", "Second");
  tracker.recordResults(secondRaw, secondGeneration);
  const secondView = tracker.resolve({ data: secondRaw, isLoading: false });
  assert.notStrictEqual(secondView.results, firstView.results);
  assert.equal(contentReads, 3);

  tracker.updateInput("third");
  const thirdGeneration = tracker.beginRequest("third");
  secondRaw[0] = makeRawResults("third", "Third")[0];
  tracker.recordResults(secondRaw, thirdGeneration);
  const thirdView = tracker.resolve({ data: secondRaw, isLoading: false });
  assert.notStrictEqual(thirdView.results, secondView.results);
  assert.deepEqual(thirdView.results.map((result) => result.title), ["Third"]);
  assert.equal(contentReads, 4, "a reused raw array is refreshed for a new generation");
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
  assert.match(verifier, /normalizeSearchLabel/);
  assert.match(verifier, /rawResults\.flatMap/);
  assert.match(verifier, /residualKinds/);
  assert.match(verifier, /rawResults\.length, 54/);
  assert.match(verifier, /quickstart\.html/);
  assert.match(verifier, /aria-controls/);
  assert.doesNotMatch(verifier, /hasSearchMarkdownArtifacts\(result\.(?:title|context)\)/);
  assert.doesNotMatch(verifier, /@orama\/orama/);
  assert.doesNotMatch(verifier, /https?:\/\//);
});

test("T5 does not introduce a cloud search client or browser secret", () => {
  const combined = targets.map(source).join("\n");
  assert.doesNotMatch(combined, /OramaCloud|oramaCloudClient|collectionID|apiKey|HEROUI_AUTH_TOKEN/);
  assert.doesNotMatch(combined, /from ["']@orama\/core["']/);
  assert.doesNotMatch(combined, /from ["']@orama\/orama["']/);
});
