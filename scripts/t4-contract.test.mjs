import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import test from "node:test";

import * as cheerio from "cheerio";

const ROOT = resolve(import.meta.dirname, "..");
const INVENTORY_PATH = resolve(ROOT, "evidence/live-url-inventory.txt");
const MANIFEST_PATH = resolve(ROOT, "evidence/T4-manifest.md");
const SNAPSHOT_PATH = resolve(ROOT, "evidence/T4-live-snapshot.json");
const STORE6_LOCK_PATH = resolve(ROOT, "evidence/T4-store6-source-lock.json");
const OWNED_TARGETS_PATH = resolve(ROOT, "evidence/T4-owned-targets.json");
const BANNED_INTERNAL_TOKENS_PATH = resolve(ROOT, "evidence/banned-internal-tokens.txt");
const DOCS_HOME_PATH = resolve(ROOT, "content/docs/index.mdx");
const DOCS_ROOT_META_PATH = resolve(ROOT, "content/docs/meta.json");
const STORE6_OVERVIEW_PATH = resolve(ROOT, "content/docs/store6/overview.mdx");
const START_HERE_LIST_PATH = resolve(ROOT, "components/overview/StartHereList.tsx");
const READ_RESOLUTION_TABLE_PATH = resolve(ROOT, "components/overview/ReadResolutionTable.tsx");
const SUPPORT_MATRIX_PATH = resolve(ROOT, "components/overview/SupportMatrix.tsx");
const NAV_PATH = resolve(ROOT, "lib/nav.ts");
const LIVE_ORIGIN = "https://store.mobilenativefoundation.org";
const SITEMAP_URL = `${LIVE_ORIGIN}/sitemap.xml`;
const EXCLUDED_URL = `${LIVE_ORIGIN}/api/openapi.json`;
const EXPECTED_OUTSIDE_ROUTES = new Map([
  [`${LIVE_ORIGIN}/developer-newsletter/overview`, "app/developer-newsletter/overview/page.tsx"],
  [`${LIVE_ORIGIN}/release-notes/overview`, "app/release-notes/overview/page.tsx"],
]);
const STORE6_TARGETS = [
  "content/docs/store6/quickstart.mdx",
  "content/docs/store6/important-defaults.mdx",
  "content/docs/store6/invalidate-vs-clear.mdx",
  "content/docs/store6/key-design.mdx",
  "content/docs/store6/stability.mdx",
  "content/docs/store6/roadmap.mdx",
  "content/docs/store6/contributing.mdx",
  "content/docs/store6/compose.mdx",
  "content/docs/store6/sqldelight.mdx",
  "content/docs/store6/room.mdx",
];
const T3_OVERVIEW_SHA256 = "7d5c9bd85b530431b0c4d1ce808be0a5a3da67e7260a20550520c851a32cbfe6";

const inventory = readLines(INVENTORY_PATH);
const docsInventory = inventory.filter((url) => new URL(url).pathname.startsWith("/docs/"));
const outsideInventory = inventory.filter((url) => !new URL(url).pathname.startsWith("/docs/"));
const expectedInventoryTargets = new Map(
  docsInventory.map((url) => {
    const pathname = new URL(url).pathname;
    return [url, `content${pathname}.mdx`];
  }),
);

test("inventory defines direct docs targets and two exact outside routes", () => {
  assert.ok(inventory.length > EXPECTED_OUTSIDE_ROUTES.size);
  assert.equal(new Set(inventory).size, inventory.length);
  assert.equal(docsInventory.length + outsideInventory.length, inventory.length);
  assert.deepEqual(outsideInventory, [...EXPECTED_OUTSIDE_ROUTES.keys()]);
  for (const [url, target] of expectedInventoryTargets) {
    assert.equal(target, `content${new URL(url).pathname}.mdx`);
  }
});

test("B5 docs home is the two-track Store 6 and Store 5 router", () => {
  const document = readFrontmatterDocument(DOCS_HOME_PATH);
  const expectedIntro = [
    "Store reads and writes data that lives in more than one place: a network, a local database, and",
    "memory. Store 6 is the next major line; Store 5 continues under its own coordinates for the whole",
    "6.x major.",
  ].join("\n");
  const expectedLinks = [
    "/docs/store6/overview",
    "/docs/store6/quickstart",
    "/docs/store6/important-defaults",
    "/docs/store6/migration/from-store5",
    "/docs/meet-store",
    "/docs/intro",
    "/docs/quickstart",
    "/docs/concepts/store5/overview",
    "/docs/store6/overview",
    "/docs/store6/migration/from-store5",
    "/docs/store6/stability",
    "/docs/store6/roadmap",
    "/docs/community/overview",
  ];

  assert.equal(document.title, "Introduction");
  assert.equal(
    document.description,
    "Store is a Kotlin Multiplatform library for reading and writing data that lives in more than one place.",
  );
  assert.equal(document.body.trimStart().startsWith(expectedIntro), true);
  assert.doesNotMatch(document.body, /^#\s+/m, "docs home must not contain a body H1");
  assert.deepEqual(markdownHeadings(document.body), [
    { depth: 2, title: "Why Store?" },
    { depth: 2, title: "Store 6 — start here" },
    { depth: 2, title: "Store 5 — maintained legacy" },
    { depth: 3, title: "Which track am I on?" },
    { depth: 2, title: "Project" },
  ]);
  assert.equal([...document.body.matchAll(/<Callout\b/g)].length, 1);
  assert.match(
    document.body,
    /<Callout type="(?:Info|Note|Tip)">\s*Store 6 is in development targeting 6\.0\.0-alpha01; nothing is published yet\. The `store6-core` API is not frozen until the beta01 freeze candidate\.\s*<\/Callout>/,
  );
  assert.deepEqual(markdownAndHtmlTargets(document.body), expectedLinks);
  for (const target of expectedLinks) assertLocalTargetExists(target, "content/docs/index.mdx");
  assert.match(document.body, /^## Store 5 — maintained legacy$/m);
  assert.match(document.body, /Store 5 documentation remains available\./);
  assert.match(
    document.body,
    /Store 5 continues under its own coordinates for the whole\s+6\.x major\./,
  );
  assert.doesNotMatch(document.body, /(?:snippet:|\bSTORE-\d+\b|\bLinear\b|\borchestrator\b|\bbatch B5\b)/i);
});

test("B5 docs root metadata presents Store 6 before the maintained legacy shelf", () => {
  assert.ok(existsSync(DOCS_ROOT_META_PATH), "missing content/docs/meta.json");
  const meta = JSON.parse(readFileSync(DOCS_ROOT_META_PATH, "utf8"));
  assert.deepEqual(meta, {
    pages: [
      "store6",
      "index",
      "---Getting Started---",
      "meet-store",
      "intro",
      "quickstart",
      "concepts/store5",
      "use-cases/store5",
      "best-practices/store5",
      "---Resources---",
      "community/overview",
      "[Migrate to Store 6](/docs/store6/migration/from-store5)",
    ],
  });
  for (const entry of meta.pages.filter(
    (page) => !page.startsWith("---") && !page.startsWith("["),
  )) {
    assert.equal(
      existsSync(resolve(ROOT, `content/docs/${entry}.mdx`)) ||
        existsSync(resolve(ROOT, `content/docs/${entry}/index.mdx`)) ||
        existsSync(resolve(ROOT, `content/docs/${entry}`)),
      true,
      `content/docs/meta.json: missing ${entry}`,
    );
  }
});

test("B5 legacy shelves render with distinct page-tree names", async () => {
  const { loader } = await import("fumadocs-core/source");
  const rootMeta = JSON.parse(readFileSync(DOCS_ROOT_META_PATH, "utf8"));
  const expectedFolders = [
    {
      folder: "concepts/store5",
      name: "Concepts",
      overviewTitle: "Store5",
    },
    {
      folder: "use-cases/store5",
      name: "Use Cases",
      overviewTitle: "Store5",
    },
    {
      folder: "best-practices/store5",
      name: "Best Practices",
      overviewTitle: "Store5",
    },
  ];
  const files = [
    { type: "meta", path: "meta.json", data: rootMeta },
    ...expectedFolders.flatMap(({ folder, overviewTitle }) => [
      {
        type: "meta",
        path: `${folder}/meta.json`,
        data: JSON.parse(readFileSync(resolve(ROOT, `content/docs/${folder}/meta.json`), "utf8")),
      },
      {
        type: "page",
        path: `${folder}/overview.mdx`,
        data: { title: overviewTitle },
      },
    ]),
  ];
  const tree = loader({ baseUrl: "/docs", source: { files } }).pageTree;
  const legacyFolders = tree.children.filter((node) => node.type === "folder");

  assert.deepEqual(
    legacyFolders.map((folder) => ({
      name: folder.name,
      url: folder.children.find((node) => node.type === "page")?.url,
    })),
    expectedFolders.map(({ folder, name }) => ({
      name,
      url: `/docs/${folder}/overview`,
    })),
  );
});

test("B5 Store6 overview preserves the entry contract and exposes the complete adoption path", () => {
  const document = readFrontmatterDocument(STORE6_OVERVIEW_PATH);
  const startHere = readFileSync(START_HERE_LIST_PATH, "utf8");
  const readResolution = readFileSync(READ_RESOLUTION_TABLE_PATH, "utf8");
  const supportMatrix = readFileSync(SUPPORT_MATRIX_PATH, "utf8");

  assert.equal(document.title, "Introduction");
  assert.equal(
    document.description,
    "Typed Kotlin Multiplatform reads with explicit origins, freshness, and failure states.",
  );
  assert.doesNotMatch(document.body, /^#\s+/m, "overview must not contain a body H1");
  assert.match(
    document.body,
    /Store 6 coordinates network, persistence, and memory through one read contract\. Start with a fetcher, then add only the persistence and projection seams your application needs\./,
  );
  assert.deepEqual(markdownHeadings(document.body), [
    { depth: 2, title: "Why Store 6?" },
    { depth: 2, title: "Start here" },
    { depth: 2, title: "Modules and targets" },
    { depth: 2, title: "Community" },
    { depth: 2, title: "llms.txt" },
  ]);
  assert.deepEqual(markdownAndHtmlTargets(document.body), [
    "/docs/store6/concepts/read-contract",
    "/docs/store6/mutations",
    "/docs/store6/room",
    "/docs/store6/sqldelight",
    "/docs/store6/compose",
    "/docs/store6/migration/from-store5",
    "/docs/community/overview",
    "https://github.com/MobileNativeFoundation/Store",
    "/llms.txt",
    "/docs/store6/quickstart",
    "/docs/store6/important-defaults",
  ]);
  assert.equal([...document.body.matchAll(/<Callout\b/g)].length, 1);
  assert.match(
    document.body,
    /<Callout type="(?:Info|Note|Tip)">\s*Store 6 is in development targeting 6\.0\.0-alpha01; nothing is published yet\. The `store6-core`\s+API is not frozen until the beta01 freeze candidate\.\s*<\/Callout>/,
  );
  assert.match(
    document.body,
    /code=\{`val users = store<UserKey, User> \{\n    fetcher \{ key -> FakeApi\.getUser\(key\.id\) \}\n\}`\}/,
  );
  assert.match(
    document.body,
    /\n---\n\n\*Last verified: 2026-08-12 · `main` @ `c67a94ed`, pre-6\.0\.0-alpha01\*\n$/,
  );

  const startHereBlock = startHere.match(/const startHereItems = \[([\s\S]*?)\] as const;/)?.[1];
  assert.ok(startHereBlock, "StartHereList must keep a static server-rendered item model");
  assert.deepEqual(
    [...startHereBlock.matchAll(/\bid: "([^"]+)"/g)].map((match) => match[1]),
    ["quickstart", "important-defaults", "read-contract", "data-seams", "mutations", "migration"],
  );
  assert.deepEqual(
    [...startHereBlock.matchAll(/\bhref: "([^"]+)"/g)].map((match) => match[1]),
    [
      "/docs/store6/quickstart",
      "/docs/store6/important-defaults",
      "/docs/store6/concepts/read-contract",
      "/docs/store6/guides/fetchers",
      "/docs/store6/guides/persistence",
      "/docs/store6/mutations",
      "/docs/store6/migration/from-store5",
    ],
  );
  const experimentalChip = startHere.match(/<Chip\b[\s\S]*?<Chip\.Label>Experimental<\/Chip\.Label>[\s\S]*?<\/Chip>/)?.[0];
  assert.ok(experimentalChip, "mutations must carry an Experimental chip");
  assert.doesNotMatch(experimentalChip, /\b(?:href|onClick|onPress)=/, "tier chip must not be interactive");

  assert.deepEqual(
    [...readResolution.matchAll(/\blabel: "(Origin\.[A-Z]+)"/g)].map((match) => match[1]),
    ["Origin.MEMORY", "Origin.SOT", "Origin.FETCHER", "Origin.OVERLAY"],
  );
  assert.match(readResolution, /wall-clock age alone never makes/);
  assert.match(readResolution, /Data\(origin=Origin\.SOT, isStale=true, refreshing=true\)/);
  assert.deepEqual(
    [...readResolution.matchAll(/\bhref="([^"]+)"/g)].map((match) => match[1]),
    ["/docs/store6/concepts/read-contract", "/docs/store6/concepts/freshness"],
  );

  assert.deepEqual(
    [...supportMatrix.matchAll(/\bmodule: "([^"]+)"/g)].map((match) => match[1]),
    [
      "store6-core",
      "store6-testing",
      "store6-mutations",
      "store6-compose",
      "store6-sqldelight",
      "store6-room",
      "store6-devtools",
      "store6-devtools-inspector",
    ],
  );
  assert.match(
    supportMatrix,
    /Canonical 12: Android, JVM, iosArm64, iosSimulatorArm64, iosX64, macosArm64, watchosArm64, tvosArm64, JS, WasmJS, linuxX64, and mingwX64\./,
  );
  assert.match(
    supportMatrix,
    /Inspector 8: Android, JVM, iosArm64, iosSimulatorArm64, iosX64, macosArm64, JS, and WasmJS\./,
  );
  assert.deepEqual(
    [...supportMatrix.matchAll(/\{\s*module: "([^"]+)",\s*tier: "([^"]+)",\s*release: "([^"]+)",/g)].map(
      ([, module, tier, release]) => ({ module, tier, release }),
    ),
    [
      { module: "store6-core", tier: "Stable track", release: "alpha01" },
      { module: "store6-testing", tier: "Experimental", release: "alpha01" },
      { module: "store6-mutations", tier: "Experimental", release: "alpha01" },
      {
        module: "store6-compose",
        tier: "Experimental",
        release: "alpha01, may slip one alpha",
      },
      {
        module: "store6-sqldelight",
        tier: "Experimental",
        release: "alpha01, may slip one alpha",
      },
      {
        module: "store6-room",
        tier: "Experimental",
        release: "alpha01, may slip one alpha",
      },
      {
        module: "store6-devtools",
        tier: "Experimental",
        release: "alpha02 (target)",
      },
      {
        module: "store6-devtools-inspector",
        tier: "Experimental",
        release: "alpha02 (target)",
      },
    ],
  );
  assert.match(supportMatrix, /not frozen until the beta01 freeze candidate/);
  const tierCell = supportMatrix.match(
    /<Table\.Cell>\s*<div\b[^>]*data-tier-guidance=\{entry\.module\}[^>]*>[\s\S]*?<\/Table\.Cell>/,
  )?.[0];
  assert.ok(tierCell, "every mapped tier cell must expose row-level guidance");
  assert.match(tierCell, /<TierChip tier=\{entry\.tier\} \/>/);
  assert.deepEqual(
    [...tierCell.matchAll(/\bhref="([^"]+)"/g)].map((match) => match[1]),
    ["/docs/store6/stability", "/docs/store6/concepts/api-tiers"],
  );
  assertNoNestedInteractiveLinks(tierCell, "components/overview/SupportMatrix.tsx tier cell");
  assert.deepEqual(
    [...supportMatrix.matchAll(/\bhref="([^"]+)"/g)].map((match) => match[1]),
    [
      "/docs/store6/stability",
      "/docs/store6/concepts/api-tiers",
      "/reference/store6-core/index.html",
    ],
  );

  for (const [path, source] of [
    ["components/overview/StartHereList.tsx", startHere],
    ["components/overview/ReadResolutionTable.tsx", readResolution],
    ["components/overview/SupportMatrix.tsx", supportMatrix],
  ]) {
    assert.doesNotMatch(source, /^["']use client["'];?$/m, `${path} must remain a Server Component`);
    assertNoNestedInteractiveLinks(source, path);
    assert.doesNotMatch(source, /(?:snippet:|\bSTORE-\d+\b|\bLinear\b|\borchestrator\b|\bbatch B5\b)/i, path);
  }
  assert.doesNotMatch(document.body, /(?:snippet:|\bSTORE-\d+\b|\bLinear\b|\borchestrator\b|\bbatch B5\b)/i);
});

test("B5 primary navigation points at Store6 while version navigation remains stable", () => {
  const source = readFileSync(NAV_PATH, "utf8");
  const primaryBlock = source.match(/export const primaryNavItems:[^=]+?= \[([\s\S]*?)\n\];/)?.[1];
  assert.ok(primaryBlock, "primaryNavItems declaration missing");
  assert.deepEqual(
    [...primaryBlock.matchAll(/\{\s*href: "([^"]+)",\s*label: "([^"]+)",?\s*\}/g)].map(
      ([, href, label]) => ({ href, label }),
    ),
    [
      { href: "/docs/store6/overview", label: "Docs" },
      { href: "/reference/store6-core/index.html", label: "Reference" },
      { href: "/docs/community/overview", label: "Community" },
    ],
  );

  const versionBlock = source.match(/export const docsVersions:[^=]+?= \[([\s\S]*?)\n\];/)?.[1];
  assert.ok(versionBlock, "docsVersions declaration missing");
  assert.deepEqual(
    [...versionBlock.matchAll(/\{\s*href: "([^"]+)",\s*id: "([^"]+)",\s*label: "([^"]+)"\s*\}/g)].map(
      ([, href, id, label]) => ({ href, id, label }),
    ),
    [
      { href: "/docs", id: "store5", label: "Store5" },
      { href: "/docs/store6/overview", id: "store6", label: "Store6" },
    ],
  );
  for (const target of [...primaryBlock.matchAll(/\bhref: "([^"]+)"/g)].map((match) => match[1])) {
    assertLocalTargetExists(target, "lib/nav.ts");
  }
});

test("every T4 source, inventory target, outside route, and Store6 copy exists", () => {
  const required = [
    "scripts/port-page.mjs",
    "scripts/sync-store6-docs.mjs",
    "public/llms.txt",
    "evidence/T4-manifest.md",
    "evidence/T4.md",
    ...expectedInventoryTargets.values(),
    ...EXPECTED_OUTSIDE_ROUTES.values(),
    ...STORE6_TARGETS,
  ];
  const missing = required.filter((path) => !existsSync(resolve(ROOT, path)));
  assert.deepEqual(missing, [], `missing T4 paths:\n${missing.join("\n")}`);
});

test("manifest has every ordered inventory row and one separate OpenAPI exclusion", () => {
  const rows = readManifestRows();
  assert.equal(rows.length, inventory.length + 1);
  assert.deepEqual(
    rows.slice(0, inventory.length).map((row) => row.url),
    inventory,
  );
  const exclusion = rows.find((row) => row.url === EXCLUDED_URL);
  assert.ok(exclusion);
  assert.equal(exclusion.status, "excluded by design");
  assert.equal(exclusion.target, "—");
});

test("manifest generation does not depend on the wall clock", () => {
  const source = readFileSync(resolve(ROOT, "scripts/port-page.mjs"), "utf8");
  assert.match(source, /const MIGRATION_DATE = "2026-08-09";/);
  assert.doesNotMatch(source, /new Intl\.DateTimeFormat\([^\n]+new Date\(\)/);
});

test("API migration removes empty permalink artifacts and preserves linked heading content", () => {
  const apiTargets = [...expectedInventoryTargets.values()].filter((target) =>
    target.startsWith("content/docs/concepts/store5/"),
  );
  for (const target of apiTargets) {
    const source = readFileSync(resolve(ROOT, target), "utf8");
    assert.doesNotMatch(source, /\]\(#param-[^)]+\)/, target);
    const pathname = target.slice("content".length, -".mdx".length);
    const html = readFileSync(resolve(ROOT, `.next/server/app${pathname}.html`), "utf8");
    assert.doesNotMatch(cheerio.load(html)("#content").text(), /\]\(#param-/i, target);
  }

  const sourceOfTruth = readFileSync(
    resolve(ROOT, "content/docs/concepts/store5/source-of-truth.mdx"),
    "utf8",
  );
  assert.match(
    sourceOfTruth,
    /^### Writing Data from \[Fetcher\]\(\/docs\/concepts\/store5\/fetcher\) to Source of Truth$/m,
  );
});

test("MDX article renderer maps the complete semantic surface and preserves T3 overrides", () => {
  const components = readFileSync(resolve(ROOT, "mdx-components.tsx"), "utf8");
  for (const element of [
    "a",
    "p",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "ul",
    "ol",
    "li",
    "code",
    "pre",
    "blockquote",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
    "img",
    "hr",
  ]) {
    assert.match(components, new RegExp(`\\n\\s*${element}:`), `missing ${element} mapping`);
  }
  for (const component of ["CodeSlab", "ReadResolutionTable", "StartHereList", "SupportMatrix"]) {
    assert.match(components, new RegExp(`\\b${component},`));
  }
  assert.match(components, /\.\.\.components,\s*\n\s*};/);

  const route = readFileSync(resolve(ROOT, "app/(docs)/docs/[[...slug]]/page.tsx"), "utf8");
  assert.match(route, /<div id="content" className="[^"]*min-w-0[^"]*">/);
});

test("component-aware migration preserves cards, steps, callouts, descriptions, and light media", () => {
  assert.ok(existsSync(SNAPSHOT_PATH), "missing pinned live snapshot");

  const expectedCardCounts = new Map([
    ["content/docs/concepts/store5/overview.mdx", { linked: 8, unavailable: 0 }],
    ["content/docs/use-cases/store5/overview.mdx", { linked: 17, unavailable: 1 }],
    ["content/docs/community/overview.mdx", { linked: 5, unavailable: 0 }],
    ["content/docs/meet-store.mdx", { linked: 5, unavailable: 0 }],
  ]);
  for (const [target, expected] of expectedCardCounts) {
    const source = readFileSync(resolve(ROOT, target), "utf8");
    const linkedHeadings = [...source.matchAll(/^## \[[^\]]+\]\(([^)]+)\)$/gm)];
    assert.equal(linkedHeadings.length, expected.linked, target);
    assert.equal([...source.matchAll(/<UnavailableDestination\b/g)].length, expected.unavailable, target);
  }

  const fetcher = readFileSync(resolve(ROOT, "content/docs/concepts/store5/fetcher.mdx"), "utf8");
  assert.match(fetcher, /Client-Side Checks Conditional On Request Type/);
  assert.match(fetcher, /Cache Check/);
  assert.match(fetcher, /Validation/);

  const snapshot = JSON.parse(readFileSync(SNAPSHOT_PATH, "utf8"));
  const sourceCallouts = snapshot.pages.reduce(
    (total, page) => total + [...page.sourceMarkdown.matchAll(/<(?:Info|Note|Tip)>/g)].length,
    0,
  );
  const inventorySources = [...expectedInventoryTargets.values()]
    .map((target) => readFileSync(resolve(ROOT, target), "utf8"))
    .join("\n");
  assert.equal(
    [...inventorySources.matchAll(/<Callout\b/g)].length,
    sourceCallouts,
  );

  const meet = readFileSync(resolve(ROOT, "content/docs/meet-store.mdx"), "utf8");
  const decision = readFileSync(
    resolve(ROOT, "content/docs/best-practices/store5/single-or-multiple-stores.mdx"),
    "utf8",
  );
  assert.equal(markdownImageTargets(meet).length, 3);
  assert.equal(markdownImageTargets(decision).length, 1);
  assert.match(readFrontmatterDocument(resolve(ROOT, "content/docs/meet-store.mdx")).description, /Store/);
});

test("migrated widgets retain grouped steps, code panels, callouts, and parameter definitions", () => {
  const snapshot = JSON.parse(readFileSync(SNAPSHOT_PATH, "utf8"));
  const expected = sourceWidgetContract(snapshot);
  const actual = {
    callouts: [],
    paramListSizes: [],
    params: [],
    stepGroups: [],
    tabGroups: [],
  };

  for (const page of snapshot.pages.filter((entry) => new URL(entry.url).pathname.startsWith("/docs/"))) {
    const pathname = new URL(page.url).pathname;
    const $ = cheerio.load(readStaticHtml(pathname));
    assert.doesNotMatch($("#content").text(), /\bNaN\b/, pathname);
    assert.doesNotMatch(
      $("#content").html() ?? "",
      /<(?:callout|paramfield|paramlist|stepitem|stepsgroup|tabgroup|tabpanel)\b/i,
      `${pathname}: literal generated component syntax`,
    );

    $("#content [data-step-group]").each((_, group) => {
      const parentItem = $(group).parent().closest("[data-step-item]");
      assert.equal(group.tagName, "ol", `${pathname}: step group element`);
      assert.equal(
        $(group).children().length,
        $(group).children("li[data-step-item]").length,
        `${pathname}: step group direct children`,
      );
      if (parentItem.length > 0) {
        assert.equal($(group).parent().is("[data-step-body]"), true, `${pathname}: nested step body containment`);
        assert.equal(
          $(group).parent().parent().is("li[data-step-item]"),
          true,
          `${pathname}: nested step item containment`,
        );
      }
      actual.stepGroups.push({
        nested: parentItem.length > 0,
        page: pathname,
        items: $(group)
          .children("[data-step-item]")
          .map((__, item) => ({
            body: compiledDirectWidgetBody($, item),
            label: $(item).attr("data-step-label"),
            title: normalizeText($(item).children("[data-step-title]").find("strong").text()),
          }))
          .get(),
      });
      $(group).children("[data-step-item]").each((__, item) => {
        assert.equal(item.tagName, "li", `${pathname}: step item element`);
        assert.equal($(item).children("[data-step-title]").length, 1, `${pathname}: step title containment`);
        assert.equal($(item).children("[data-step-body]").length, 1, `${pathname}: step body containment`);
      });
    });
    $("#content [data-tab-group]").each((_, group) => {
      const panels = $(group).find("[data-tab-panel]");
      assert.equal(group.tagName, "section", `${pathname}: tab group element`);
      assert.equal($(group).attr("role"), "group", `${pathname}: tab group role`);
      panels.each((__, panel) => {
        assert.equal(panel.tagName, "section", `${pathname}: tab panel element`);
        const labelledBy = $(panel).attr("aria-labelledby");
        assert.ok(labelledBy, `${pathname}: tab panel accessible name`);
        assert.equal($(`[id="${labelledBy}"]`).length, 1, `${pathname}: tab panel label resolution`);
      });
      actual.tabGroups.push({
        label: $(group).attr("aria-label"),
        page: pathname,
        panels: panels
          .map((__, panel) => ({
            labelledBy: $(panel).attr("aria-labelledby"),
            label: normalizeText($(panel).children("[data-tab-panel-label]").first().text()),
            labelId: $(panel).children("[data-tab-panel-label]").first().attr("id"),
            labelTag: $(panel).children("[data-tab-panel-label]").first().prop("tagName")?.toLowerCase(),
            code: normalizeCode($(panel).find("pre").first().text()),
            language: $(panel).attr("data-language"),
          }))
          .get(),
      });
    });
    $("#content aside[role=note][data-callout-type]").each((_, callout) => {
      assert.equal(callout.tagName, "aside", `${pathname}: callout element`);
      actual.callouts.push({
        body: normalizeWidgetBody($(callout).children("[data-callout-body]").text()),
        page: pathname,
        type: $(callout).attr("data-callout-type"),
      });
    });
    $("#content dl[data-param-list]").each((_, list) => {
      assert.equal(list.tagName, "dl", `${pathname}: parameter list element`);
      const fields = $(list).children("[data-param-field]");
      actual.paramListSizes.push({ page: pathname, size: fields.length });
      fields.each((__, field) => {
        assert.equal(field.tagName, "div", `${pathname}: parameter field group element`);
        assert.deepEqual(
          $(field).children().map((___, child) => child.tagName).get(),
          ["dt", "dd", "dt", "dd", "dt", "dd", "dt", "dd"],
          `${pathname}: parameter definition shape`,
        );
        $(field).children("dt,dd").each((___, definition) => {
          assert.ok(normalizeText($(definition).text()).length > 0, `${pathname}: empty parameter definition`);
        });
        const definitions = new Map();
        $(field).children("dt").each((___, term) => {
          definitions.set(normalizeText($(term).text()), normalizeText($(term).next("dd").text()));
        });
        actual.params.push({
          description: definitions.get("Description"),
          name: definitions.get("Parameter"),
          page: pathname,
          required: definitions.get("Required"),
          type: definitions.get("Type"),
        });
      });
    });
  }

  for (const group of actual.tabGroups) {
    assert.ok(group.label);
    for (const panel of group.panels) {
      assert.equal(panel.labelledBy, panel.labelId);
      assert.equal(panel.labelTag, "p");
      delete panel.labelTag;
    }
  }
  const tabLabelIds = actual.tabGroups.flatMap((group) => group.panels.map((panel) => panel.labelId));
  assert.equal(new Set(tabLabelIds).size, tabLabelIds.length);

  assert.deepEqual(actual.stepGroups, expected.stepGroups);
  assert.deepEqual(actual.tabGroups, expected.tabGroups);
  assert.deepEqual(actual.callouts, expected.callouts);
  assert.deepEqual(actual.paramListSizes, expected.paramListSizes);
  assert.deepEqual(actual.params, expected.params);
  assert.equal(actual.stepGroups.length, 19);
  assert.equal(actual.stepGroups.reduce((sum, group) => sum + group.items.length, 0), 70);
  assert.equal(actual.tabGroups.length, 4);
  assert.equal(actual.tabGroups.reduce((sum, group) => sum + group.panels.length, 0), 11);
  assert.equal(actual.callouts.length, 51);
  assert.equal(actual.paramListSizes.length, 23);
  assert.equal(actual.params.length, 45);
  assert.equal(actual.params.filter((field) => field.required === "Required").length, 36);
  const generatedSources = [...expectedInventoryTargets.values()]
    .map((target) => readFileSync(resolve(ROOT, target), "utf8"))
    .join("\n");
  assert.doesNotMatch(generatedSources, /<(?:Steps?|CodeGroup|Info|Note|Tip)\b/);
  assert.equal([...generatedSources.matchAll(/<ParamField\b/g)].length, 45);
});

test("the token replacement fence remains exact", () => {
  const styles = readFileSync(resolve(ROOT, "app/globals.css"), "utf8");
  assert.equal([...styles.matchAll(/^\/\* STORE TOKENS START \*\/$/gm)].length, 1);
  assert.equal([...styles.matchAll(/^\/\* STORE TOKENS END \*\/$/gm)].length, 1);
});

test("same-origin migration links are healthy or rendered as unavailable", () => {
  const snapshot = JSON.parse(readFileSync(SNAPSHOT_PATH, "utf8"));
  const linkHealth = new Map(snapshot.linkHealth.map((entry) => [entry.url, entry.status]));
  assert.equal(Array.isArray(snapshot.linkHealth), true);
  assert.ok(snapshot.linkHealth.length > 0);
  for (const entry of snapshot.linkHealth) {
    assert.match(entry.url, /^https:\/\/store\.mobilenativefoundation\.org\//);
    assert.match(String(entry.status), /^\d{3}$/);
  }

  const quickstart = readFileSync(resolve(ROOT, "content/docs/quickstart.mdx"), "utf8");
  assert.match(quickstart, /\/docs\/challenges-at-scale/);
  assert.doesNotMatch(quickstart, /\/docs\/docs\/challenges-at-scale/);

  const useCases = cheerio.load(readStaticHtml("/docs/use-cases/store5/overview"));
  const unavailable = useCases('#content [data-unavailable-destination="/docs/use-cases/store5/multiplatform-integration"]');
  assert.equal(unavailable.length, 1);
  assert.equal(normalizeText(unavailable.prevAll("h2").first().text()), "Multiplatform Implementation");
  assert.match(normalizeText(unavailable.text()), /unavailable/i);
  assert.equal(useCases('#content a[href="/docs/use-cases/store5/multiplatform-integration"]').length, 0);

  const cookbook = cheerio.load(readStaticHtml("/docs/meet-store"));
  assert.equal(
    cookbook('#content a[href="https://store.mobilenativefoundation.org/cookbook/overview"]').length,
    1,
  );

  for (const page of snapshot.pages.filter((entry) => new URL(entry.url).pathname.startsWith("/docs/"))) {
    const pathname = new URL(page.url).pathname;
    const compiled = cheerio.load(readStaticHtml(pathname));
    compiled("#content a[href]").each((_, anchor) => {
      const href = compiled(anchor).attr("href");
      assert.ok(href, `${pathname}: empty href`);
      if (href.startsWith("#") || /^(?:mailto|tel):/i.test(href)) return;
      if (href.startsWith("/")) {
        assertLocalTargetExists(href, pathname);
        return;
      }
      const destination = new URL(href);
      if (destination.origin !== LIVE_ORIGIN) return;
      destination.hash = "";
      const status = linkHealth.get(destination.href);
      assert.ok(status, `${pathname}: missing link-health record for ${destination.href}`);
      assert.ok(status < 400, `${pathname}: unhealthy same-origin href ${destination.href} (${status})`);
    });
  }

  const row = readManifestRows().find((entry) => entry.url.endsWith("/docs/use-cases/store5/overview"));
  assert.equal(row?.status, "ported with noted loss");
  assert.match(row?.loss ?? "", /multiplatform-integration/i);
  assert.match(row?.loss ?? "", /unavailable/i);

  assert.ok(existsSync(OWNED_TARGETS_PATH), "missing committed output ledger");
});

test("publishable tracked text excludes local paths and private publication vocabulary", () => {
  const files = collectPublishableTrackedTextFiles(ROOT);
  const forbiddenWordHashes = new Set([
    "d0a0f664ab8bb431ddf2759d9431cb2c46dec139298569ecca525a82d4fdbde5",
    "132a0519893f35d86aafbf5cd9863a34867ef0c6595f32fb2e1d8c1e1951fdc5",
    "33ecf0cd36997c870fbc768ca1dc6795fcde1fed7d83b83c6caded0d56efc2ac",
    "01614af71f87a2c5e1f3084427fd7aeb8c60fb6cf82df0510a997a8f25b7db08",
    "78ee12c65d407ba0694df910c6b815938bf6119f7288bd720a48c98e11af57bc",
    "7f2fe580edb35154041fa3d4b41dd6d3adaef0c85d2ff6309f1d4b520eeecda3",
  ]);
  const forbiddenPhraseHashes = new Set([
    "ce7e7c3d821bd7713ed08b24aefa28fba8c85ecd33967bcd14d30d7ae0530674",
    "1dc7a87ceab1cfa8a3b44c52d4ed727c5df1f1e83729436329fc7f5e91386b6f",
    "c4ee5ed1669af9b7691d2e84b859215c151907d0d954fd76b875d26fd3123429",
  ]);

  for (const file of files) {
    const source = readFileSync(file, "utf8");
    assert.doesNotMatch(source, /\/(?:Users|private|tmp)\//, relative(ROOT, file));
    assert.doesNotMatch(source, new RegExp(`\\b${["ST", "ORE"].join("")}-\\d+\\b`), relative(ROOT, file));
    for (const word of source.toLowerCase().match(/[a-z]+/g) ?? []) {
      assert.equal(forbiddenWordHashes.has(sha256(word)), false, `${relative(ROOT, file)}: forbidden word`);
    }
    const words = (source.toLowerCase().match(/[a-z0-9]+/g) ?? []);
    for (let index = 0; index < words.length - 1; index += 1) {
      assert.equal(
        forbiddenPhraseHashes.has(sha256(`${words[index]} ${words[index + 1]}`)),
        false,
        `${relative(ROOT, file)}: forbidden phrase`,
      );
    }
  }
});

test("publishable text census excludes only generated reference module artifacts", () => {
  const fixtureRoot = mkdtempSync(join(tmpdir(), "store-docs-publishable-census-"));
  const included = [
    "app/page.tsx",
    "components/Fixture.tsx",
    "content/docs/fixture.mdx",
    "lib/nav.ts",
    "public/reference/store6-core-adjacent/index.html",
    "public/reference/unexpected/index.html",
    "public/robots.txt",
    "scripts/fixture.mjs",
  ];
  const generated = [
    "public/reference/store6-core/index.html",
    "public/reference/store6-mutations/scripts/main.js",
  ];
  try {
    for (const sourcePath of [...included, ...generated]) {
      const target = resolve(fixtureRoot, sourcePath);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, "fixture\n");
    }

    assert.deepEqual(
      collectPublishableTrackedTextFiles(fixtureRoot)
        .map((file) => relative(fixtureRoot, file).split(sep).join("/"))
        .sort(),
      included.sort(),
    );
  } finally {
    rmSync(fixtureRoot, { force: true, recursive: true });
  }
});

test("published-surface scan reports the exact file, line, and curated pattern", () => {
  const fixtureRoot = mkdtempSync(join(tmpdir(), "store-docs-published-surface-"));
  const target = resolve(fixtureRoot, "content/docs/store6/fixture.mdx");
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, `Durable introduction.\n${["ST", "ORE-123"].join("")} must not ship.\n`);
  try {
    assert.deepEqual(findPublishedSurfaceViolations(fixtureRoot, [String.raw`\bSTORE-\d+\b`]), [
      "internal process vocabulary found on a published surface: content/docs/store6/fixture.mdx:2 matched \\bSTORE-\\d+\\b; state the technical fact with durable attribution instead (AGENTS.md).",
    ]);
  } finally {
    rmSync(fixtureRoot, { force: true, recursive: true });
  }
});

test("published surfaces exclude curated internal process vocabulary", () => {
  const patterns = readLines(BANNED_INTERNAL_TOKENS_PATH);
  const violations = findPublishedSurfaceViolations(ROOT, patterns);
  if (violations.length > 0) assert.fail(violations.join("\n"));
});

test("Store6 sync is portable and locked to exact revision and source hashes", () => {
  assert.ok(existsSync(STORE6_LOCK_PATH), "missing Store6 source lock");
  const script = readFileSync(resolve(ROOT, "scripts/sync-store6-docs.mjs"), "utf8");
  assert.doesNotMatch(script, /\/(?:Users|private|tmp)\//);
  assert.match(script, /--source-root/);
  assert.match(script, /--check/);

  const lock = JSON.parse(readFileSync(STORE6_LOCK_PATH, "utf8"));
  assert.match(lock.revision, /^[a-f0-9]{40}$/);
  assert.equal(lock.sources.length, STORE6_TARGETS.length + 1);
  for (const source of lock.sources) {
    assert.match(source.sha256, /^[a-f0-9]{64}$/);
  }
});

test("inventory partitions and manifest access contain no fixed cardinality literals", () => {
  const sources = [
    readFileSync(new URL(import.meta.url), "utf8"),
    readFileSync(resolve(ROOT, "scripts/port-page.mjs"), "utf8"),
  ];
  for (const fixedInventoryCount of [["3", "5"].join(""), ["3", "7"].join("")]) {
    for (const source of sources) {
      assert.doesNotMatch(
        source,
        new RegExp(`\\.slice\\(0,\\s*${fixedInventoryCount}\\)|\\.length,\\s*${fixedInventoryCount}\\b`),
      );
    }
  }
});

test("live generation is snapshot-backed, source-locked, guarded, and transactional", async () => {
  assert.ok(existsSync(SNAPSHOT_PATH), "missing pinned live snapshot");
  const script = readFileSync(resolve(ROOT, "scripts/port-page.mjs"), "utf8");
  assert.match(script, /--acquire/);
  assert.match(script, /--generate/);
  assert.match(script, /assertOwnedOutputSet/);
  assert.match(script, /writeLiveOutputTransaction/);
  assert.match(script, /T4-owned-targets\.json/);

  const snapshot = JSON.parse(readFileSync(SNAPSHOT_PATH, "utf8"));
  assert.equal(snapshot.schemaVersion, 2);
  assert.equal(snapshot.migrationDate, "2026-08-09");
  assert.equal(sha256(JSON.stringify(snapshot.linkHealth)), snapshot.linkHealthSha256);
  assert.equal(snapshot.pages.length, inventory.length);
  assert.deepEqual(snapshot.pages.map((page) => page.url), inventory);
  assert.equal(new Set(snapshot.pages.map((page) => page.url)).size, inventory.length);
  for (const page of snapshot.pages) {
    assert.match(page.bodySha256, /^[a-f0-9]{64}$/);
    assert.equal(sha256(page.bodyHtml), page.bodySha256, page.url);
    if (new URL(page.url).pathname.startsWith("/docs/")) {
      assert.match(page.markdownSha256, /^[a-f0-9]{64}$/);
      assert.equal(sha256(page.sourceMarkdown), page.markdownSha256, page.url);
    }
  }
  const { assertOwnedOutputSet } = await import("./port-page.mjs");
  assert.throws(() => assertOwnedOutputSet(new Map()), /owned inventory targets/);
});

test("snapshot validation rejects a missing derived link-health entry", async () => {
  const { validateSnapshot } = await import("./port-page.mjs");
  assert.equal(typeof validateSnapshot, "function");
  const snapshot = JSON.parse(readFileSync(SNAPSHOT_PATH, "utf8"));
  snapshot.linkHealth = snapshot.linkHealth.slice(0, -1);
  snapshot.linkHealthSha256 = sha256(JSON.stringify(snapshot.linkHealth));
  assert.throws(() => validateSnapshot(snapshot), /link-health set differs/);
});

test("snapshot validation and card conversion reject empty link health", async () => {
  const { convertBodyToMdx, validateSnapshot } = await import("./port-page.mjs");
  assert.equal(typeof validateSnapshot, "function");
  const snapshot = JSON.parse(readFileSync(SNAPSHOT_PATH, "utf8"));
  const cardPage = snapshot.pages.find((page) => /\/docs\/concepts\/store5\/overview$/.test(page.url));
  assert.ok(cardPage);
  snapshot.linkHealth = [];
  snapshot.linkHealthSha256 = sha256(JSON.stringify(snapshot.linkHealth));
  assert.throws(() => validateSnapshot(snapshot), /link-health set differs/);
  assert.throws(
    () => convertBodyToMdx(cardPage.bodyHtml, cardPage.url, cardPage.sourceMarkdown, new Map()),
    /missing link-health status/,
  );
});

test("URL rewriting fails closed for unsafe anchor and image schemes", async () => {
  const script = readFileSync(resolve(ROOT, "scripts/port-page.mjs"), "utf8");
  assert.doesNotMatch(script, /\(\?:mailto\|tel\|data\|javascript\)/);
  assert.match(script, /UNSAFE_ANCHOR_SCHEME/);
  assert.match(script, /UNSAFE_IMAGE_SCHEME/);
  const { rewriteLiveUrl } = await import("./port-page.mjs");
  assert.throws(
    () => rewriteLiveUrl("javascript:alert(1)", `${LIVE_ORIGIN}/docs/intro`, false),
    /UNSAFE_ANCHOR_SCHEME/,
  );
  assert.throws(
    () => rewriteLiveUrl("data:image/png;base64,AA==", `${LIVE_ORIGIN}/docs/intro`, true),
    /UNSAFE_IMAGE_SCHEME/,
  );
  assert.equal(
    rewriteLiveUrl(`${LIVE_ORIGIN}/docs/intro`, `${LIVE_ORIGIN}/docs/quickstart`, false),
    "/docs/intro",
  );
});

test("manifest fidelity values match ported bodies and warrant every status", () => {
  const rows = readManifestRows().slice(0, inventory.length);

  for (const row of rows) {
    assert.ok(["ported clean", "ported with noted loss", "blocked"].includes(row.status));
    if (row.status === "blocked") {
      assert.notEqual(row.loss, "none");
      continue;
    }

    const liveChars = parseNonNegativeInteger(row.liveChars, row.url);
    const portedChars = parseNonNegativeInteger(row.portedChars, row.url);
    const liveHeadings = parseHeadingCell(row.liveHeadings, row.url);
    const portedHeadings = parseHeadingCell(row.portedHeadings, row.url);
    const targetPath = expectedInventoryTargets.get(row.url);
    const isOutside = EXPECTED_OUTSIDE_ROUTES.has(row.url);
    assert.ok(targetPath || isOutside, `unexpected manifest target for ${row.url}`);

    if (targetPath) {
      assert.equal(row.target, targetPath);
      const document = readFrontmatterDocument(resolve(ROOT, targetPath));
      assert.equal(document.title, row.liveTitle);
      assert.equal(normalizedMarkdownChars(document.body), portedChars, row.url);
      assert.deepEqual(
        markdownHeadings(document.body).map((heading) => heading.title),
        portedHeadings,
        row.url,
      );
    } else {
      assert.equal(row.target, EXPECTED_OUTSIDE_ROUTES.get(row.url));
      assert.equal(row.liveTitle, "Coming soon");
      assert.equal(portedChars, 0);
      assert.deepEqual(portedHeadings, []);
    }

    const headingsMatch = JSON.stringify(liveHeadings) === JSON.stringify(portedHeadings);
    const meetsRatio = liveChars === 0 ? portedChars === 0 : portedChars / liveChars >= 0.6;
    const warrantedClean = headingsMatch && meetsRatio;
    const unavailableDestination = row.url.endsWith("/docs/use-cases/store5/overview");
    assert.equal(
      row.status,
      unavailableDestination ? "ported with noted loss" : warrantedClean ? "ported clean" : "ported with noted loss",
      row.url,
    );
    assert.equal(row.loss === "none", warrantedClean && !unavailableDestination, row.url);
    if (unavailableDestination) assert.match(row.loss, /multiplatform-integration.*unavailable/i);

    if (liveChars === 0) {
      assert.equal(portedChars, 0);
      assert.deepEqual(liveHeadings, []);
      assert.deepEqual(portedHeadings, []);
    }
  }
});

test("ported pages do not lose headings that are present in the live content tree", () => {
  const rows = readManifestRows().slice(0, inventory.length);
  const headingLosses = rows
    .filter((row) => row.status !== "blocked")
    .filter((row) => row.liveHeadings !== row.portedHeadings)
    .map((row) => row.url);
  assert.deepEqual(headingLosses, [], `heading losses:\n${headingLosses.join("\n")}`);
});

test("all generated MDX has one frontmatter block, no body H1, and static output", () => {
  const contentTargets = [
    ...expectedInventoryTargets.values(),
    ...STORE6_TARGETS,
    "content/docs/store6/overview.mdx",
  ];

  for (const target of contentTargets) {
    const absolute = resolve(ROOT, target);
    const document = readFrontmatterDocument(absolute);
    assert.ok(document.title.length > 0, `${target}: missing title`);
    assert.equal(markdownHeadings(document.body).some((heading) => heading.depth === 1), false, target);
    assert.equal(lstatSync(absolute).isSymbolicLink(), false, target);
  }

  for (const url of docsInventory) {
    const pathname = new URL(url).pathname;
    assert.ok(existsSync(resolve(ROOT, `.next/server/app${pathname}.html`)), `${pathname}: no static HTML`);
  }
});

test("compiled migrated articles preserve renderer semantics, meaningful links, and visible media", () => {
  const snapshot = JSON.parse(readFileSync(SNAPSHOT_PATH, "utf8"));
  for (const page of snapshot.pages.filter((entry) => new URL(entry.url).pathname.startsWith("/docs/"))) {
    const pathname = new URL(page.url).pathname;
    const htmlPath = resolve(ROOT, `.next/server/app${pathname}.html`);
    assert.ok(existsSync(htmlPath), `${pathname}: no static HTML`);
    const $ = cheerio.load(readFileSync(htmlPath, "utf8"));
    const content = $("#content");
    assert.equal(content.length, 1, pathname);
    assert.doesNotMatch(content.text(), /\]\(#param-/, pathname);
    assert.deepEqual(
      content
        .find("h2,h3,h4,h5,h6")
        .map((_, heading) => normalizeHeading($(heading).text()))
        .get(),
      page.liveHeadings,
      `${pathname}: compiled heading parity`,
    );

    content.find("h2,h3,h4,h5,h6").each((_, heading) => {
      const depth = heading.tagName.slice(1);
      assert.ok($(heading).attr("id"), `${pathname}: heading lacks id`);
      assert.ok($(heading).hasClass(`typography--h${depth}`), `${pathname}: heading lacks typography class`);
    });
    content.find("a[href]").each((_, anchor) => {
      assert.ok($(anchor).hasClass("text-accent-strong"), `${pathname}: prose link lacks renderer class`);
      assert.equal($(anchor).attr("data-slot"), undefined, `${pathname}: prose link is not native`);
    });
    content.find("img").each((_, image) => {
      assert.ok($(image).attr("src"), `${pathname}: image lacks src`);
      assert.notEqual($(image).attr("alt"), undefined, `${pathname}: image lacks alt`);
      assert.ok($(image).hasClass("max-w-full") && $(image).hasClass("h-auto"), `${pathname}: image sizing`);
    });

    const expected = semanticContract(
      page.bodyHtml,
      page.sourceMarkdown,
      page.url,
      new Map(snapshot.linkHealth.map((entry) => [entry.url, entry.status])),
    );
    const actualLinks = content
      .find("a[href]")
      .toArray()
      .filter((anchor) => normalizeText($(anchor).text()).length > 0)
      .map((anchor) => $(anchor).attr("href"))
      .sort();
    const actualMedia = content
      .find("img[src]")
      .toArray()
      .map((image) => `${$(image).attr("src")}\u0000${$(image).attr("alt") ?? ""}`)
      .sort();
    assert.deepEqual(actualLinks, expected.links, `${pathname}: meaningful link destinations differ`);
    assert.deepEqual(actualMedia, expected.media, `${pathname}: visible media differ`);
  }

  const quickstart = cheerio.load(readStaticHtml("/docs/store6/quickstart"));
  quickstart("#content blockquote").each((_, blockquote) => {
    assert.ok(quickstart(blockquote).children("p").length > 0, "quickstart blockquote lacks paragraphs");
  });
  quickstart("#content pre").each((_, pre) => {
    assert.ok(quickstart(pre).hasClass("shiki"));
    assert.ok(quickstart(pre).hasClass("overflow-x-auto"));
    assert.ok(quickstart(pre).hasClass("bg-store-code-surface"));
    assert.ok(quickstart(pre).attr("style"));
    assert.equal(quickstart(pre).attr("tabindex"), "0");
    assert.equal(quickstart(pre).children("code").length, 1);
  });

  const stability = cheerio.load(readStaticHtml("/docs/store6/stability"));
  stability('#content [role="region"][aria-label="Scrollable table"][tabindex="0"]').each((_, region) => {
    assert.ok(stability(region).hasClass("overflow-x-auto"));
    const table = stability(region).children("table");
    assert.equal(table.length, 1);
    assert.ok(table.hasClass("min-w-[40rem]"));
    assert.ok(table.find("thead,tbody,tr,th,td").length > 0);
  });
  assert.ok(stability('#content [role="region"][aria-label="Scrollable table"]').length > 0);

  const fetcher = cheerio.load(readStaticHtml("/docs/concepts/store5/fetcher"));
  const outer = fetcher('#content [data-step-group][data-step-nested="false"]');
  assert.equal(outer.length, 1);
  const stepSequence = outer
    .children("[data-step-item]")
    .map((_, item) => ({
      number: Number(fetcher(item).attr("data-step-label")),
      title: normalizeText(fetcher(item).children("[data-step-title]").text()).replace(/^\w+\.\s*/, ""),
    }))
    .get();
  assert.deepEqual(stepSequence, [
    { number: 1, title: "Data Request" },
    { number: 2, title: "Client-Side Checks Conditional On Request Type" },
    { number: 3, title: "Data Fetching" },
    { number: 4, title: "Error Handling" },
    { number: 5, title: "Data Storage" },
    { number: 6, title: "Data Delivery" },
  ]);
  const branches = outer
    .children('[data-step-item][data-step-label="2"]')
    .find('[data-step-group][data-step-nested="true"]')
    .children("[data-step-item]")
    .map((_, item) => ({
      label: fetcher(item).attr("data-step-label"),
      title: normalizeText(fetcher(item).children("[data-step-title]").text()).replace(/^\w+\.\s*/, ""),
    }))
    .get();
  assert.deepEqual(branches, [
    { label: "A", title: "Cache Check" },
    { label: "B", title: "Validation" },
  ]);
});

test("copied indented source examples are fenced before MDX compilation", () => {
  const compose = readFileSync(resolve(ROOT, "content/docs/store6/compose.mdx"), "utf8");
  assert.match(
    compose,
    /```kotlin\ncomposeCompiler \{\n[\s\S]*?\n\}\n```/,
  );
  assert.match(
    compose,
    /```text\n\/\/ store6-stability\.conf  \(mirror of the shipped file\)\norg\.mobilenativefoundation\.store6\.core\.\*\norg\.mobilenativefoundation\.store6\.core\.seam\.\*\n```/,
  );
  assert.doesNotMatch(compose, /^ {4}composeCompiler \{/m);
});

test("copy sanitation states the changing Swift bridge boundary directly", () => {
  const stability = readFileSync(resolve(ROOT, "content/docs/store6/stability.mdx"), "utf8");
  assert.match(stability, /The supported bridge set\s+may change/);
  assert.doesNotMatch(stability, /disposition recorded|follows the supported export bridges/);
});

test("outside routes are static, use the shell, and preserve an empty live body", () => {
  for (const [url, target] of EXPECTED_OUTSIDE_ROUTES) {
    const pathname = new URL(url).pathname;
    const source = readFileSync(resolve(ROOT, target), "utf8");
    assert.match(source, /<AppShell\b/);
    const htmlPath = resolve(ROOT, `.next/server/app${pathname}.html`);
    assert.ok(existsSync(htmlPath), `${pathname}: no static HTML`);
    const $ = cheerio.load(readFileSync(htmlPath, "utf8"));
    assert.equal($("h1#page-title").length, 1);
    assert.equal($("h1#page-title").text().replace(/\s+/g, " ").trim(), "Coming soon");
    assert.equal($("#content").length, 1);
    assert.equal($("#content").text().replace(/\s+/g, " ").trim(), "");
  }
});

test("public links resolve locally or use explicit external destinations", () => {
  const publicSources = [
    ...expectedInventoryTargets.values(),
    ...STORE6_TARGETS,
    "content/docs/store6/overview.mdx",
    "public/llms.txt",
  ];

  for (const sourcePath of publicSources) {
    const source = readFileSync(resolve(ROOT, sourcePath), "utf8");
    for (const target of markdownAndHtmlTargets(source)) {
      assert.doesNotMatch(target, /^(?:\.\.?\/|[^/#?:]+\.md(?:x)?(?:[#?]|$))/i, `${sourcePath}: ${target}`);
      if (target.startsWith("/")) assertLocalTargetExists(target, sourcePath);
    }
  }
});

test("rewritten Store6-relative links use the current public source repository", () => {
  const expectedDestinations = new Map([
    [
      "content/docs/store6/quickstart.mdx",
      "https://github.com/matt-ramotar/Store6/blob/main/.github/workflows/store6.yml",
    ],
    [
      "content/docs/store6/important-defaults.mdx",
      "https://github.com/matt-ramotar/Store6/tree/main/store6-core/src/commonTest/kotlin/org/mobilenativefoundation/store6/core",
    ],
    [
      "content/docs/store6/roadmap.mdx",
      "https://github.com/matt-ramotar/Store6/tree/main/store6-core/src/commonTest/kotlin/org/mobilenativefoundation/store6/core",
    ],
    [
      "content/docs/store6/stability.mdx",
      "https://github.com/matt-ramotar/Store6/tree/main/store6-core/src/commonTest/kotlin/org/mobilenativefoundation/store6/core",
    ],
  ]);

  for (const [sourcePath, destination] of expectedDestinations) {
    const source = readFileSync(resolve(ROOT, sourcePath), "utf8");
    assert.equal(markdownAndHtmlTargets(source).includes(destination), true, sourcePath);
  }
});

test("llms copy preserves its locked link inventory and maps every target on-site", () => {
  const lock = JSON.parse(readFileSync(STORE6_LOCK_PATH, "utf8"));
  const sourceEntry = lock.sources.find((entry) => entry.path === "llms.txt");
  assert.ok(sourceEntry);
  const target = readFileSync(resolve(ROOT, "public/llms.txt"), "utf8");
  const targetLinks = markdownAndHtmlTargets(target);
  assert.equal(targetLinks.length, sourceEntry.markdownLinkCount);
  assert.equal(targetLinks.every((link) => link.startsWith("/docs/store6/")), true);
  for (const link of targetLinks) assertLocalTargetExists(link, "public/llms.txt");
});

test("public source contains no symlinks", () => {
  const roots = [resolve(ROOT, "content/docs"), resolve(ROOT, "public")];
  const files = roots.flatMap((root) => walkFiles(root));
  for (const file of files) {
    assert.equal(lstatSync(file).isSymbolicLink(), false, relative(ROOT, file));
  }
});

test("T3 Store6 overview remains byte-identical", async () => {
  const { createHash } = await import("node:crypto");
  const bytes = readFileSync(resolve(ROOT, "content/docs/store6/overview.mdx"));
  assert.equal(createHash("sha256").update(bytes).digest("hex"), T3_OVERVIEW_SHA256);
});

test(
  "live inventory, selectors, source semantics, and hidden code match the pinned migration",
  { skip: process.env.T4_VERIFY_LIVE !== "1" },
  async () => {
    const rows = readManifestRows().slice(0, inventory.length);
    const snapshot = JSON.parse(readFileSync(SNAPSHOT_PATH, "utf8"));
    const snapshotByUrl = new Map(snapshot.pages.map((page) => [page.url, page]));
    const sitemap = await fetchWith5xxRetry(SITEMAP_URL);
    assert.deepEqual(
      [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]),
      inventory,
    );
    for (const entry of snapshot.linkHealth) {
      assert.equal(
        await fetchStatusWith5xxRetry(entry.url),
        entry.status,
        `${entry.url}: link-health status changed`,
      );
    }
    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      const html = await fetchWith5xxRetry(row.url);
      const $ = cheerio.load(html);
      assert.equal($("main#content-container").length, 1, row.url);
      assert.equal($("#page-title").length, 1, row.url);
      assert.equal($("#content").length, 1, row.url);
      const title = normalizeText($("#page-title").text());
      const body = $("#content");
      const liveChars = normalizeText(body.text()).length;
      const liveHeadings = body
        .find("h1,h2,h3,h4,h5,h6")
        .map((_, element) => normalizeHeading($(element).text()))
        .get();
      assert.equal(row.liveTitle, title, row.url);
      assert.equal(Number(row.liveChars), liveChars, row.url);
      assert.deepEqual(parseHeadingCell(row.liveHeadings, row.url), liveHeadings, row.url);

      const targetPath = expectedInventoryTargets.get(row.url);
      if (targetPath) {
        const sourceMarkdown = await fetchWith5xxRetry(`${row.url}.md`);
        const pinned = snapshotByUrl.get(row.url);
        assert.ok(pinned, `${row.url}: missing pinned page`);
        assert.equal(sha256(sourceMarkdown), pinned.markdownSha256, `${row.url}: source Markdown changed`);

        const document = readFrontmatterDocument(resolve(ROOT, targetPath));
        const liveDescription = normalizeText($("header#header > div.prose").first().text());
        assert.equal(document.description, liveDescription, `${row.url}: description differs`);
        const portedText = normalizeText(document.body);
        const hiddenCodeBlocks = body
          .find("[hidden], [aria-hidden=true], [data-state=inactive]")
          .find("pre")
          .toArray();
        for (const block of hiddenCodeBlocks) {
          const code = normalizeText($(block).text());
          if (code.length > 0) {
            assert.equal(portedText.includes(code), true, `${row.url}: hidden code panel lost`);
          }
        }

        const expected = semanticContract(
          body.html() ?? "",
          sourceMarkdown,
          row.url,
          new Map(snapshot.linkHealth.map((entry) => [entry.url, entry.status])),
        );
        const compiled = cheerio.load(readStaticHtml(new URL(row.url).pathname));
        const actualLinks = compiled("#content a[href]")
          .toArray()
          .filter((anchor) => normalizeText(compiled(anchor).text()).length > 0)
          .map((anchor) => compiled(anchor).attr("href"))
          .sort();
        const actualMedia = compiled("#content img[src]")
          .toArray()
          .map((image) => `${compiled(image).attr("src")}\u0000${compiled(image).attr("alt") ?? ""}`)
          .sort();
        assert.deepEqual(actualLinks, expected.links, `${row.url}: meaningful links differ`);
        assert.deepEqual(actualMedia, expected.media, `${row.url}: visible light media differ`);

        assert.equal(
          compiled("#content aside[role=note][data-callout-type]").length,
          [...sourceMarkdown.matchAll(/<(?:Info|Note|Tip)>/g)].length,
          `${row.url}: callout count differs`,
        );
      }
    }
  },
);

function sourceWidgetContract(snapshot) {
  const contract = {
    callouts: [],
    paramListSizes: [],
    params: [],
    stepGroups: [],
    tabGroups: [],
  };
  for (const page of snapshot.pages.filter((entry) => new URL(entry.url).pathname.startsWith("/docs/"))) {
    const pathname = new URL(page.url).pathname;
    const tree = parseWidgetSource(page.sourceMarkdown, page.url);

    for (const group of topLevelWidgetStepGroups(tree)) {
      appendSourceStepGroup(contract.stepGroups, group, pathname, false, page.url);
    }

    for (const node of collectWidgetComponents(tree, new Set(["Info", "Note", "Tip"]))) {
      contract.callouts.push({
        body: normalizeWidgetBody(sourceVisibleText(node.children)),
        page: pathname,
        type: node.name.toLowerCase(),
      });
    }

    for (const run of sourceParamRuns(tree)) {
      contract.paramListSizes.push({ page: pathname, size: run.length });
      for (const node of run) {
        const attributes = parseWidgetAttributes(node.attributes);
        const name = attributes.path ?? attributes.query;
        assert.ok(name, `${page.url}: ParamField name`);
        assert.ok(attributes.type, `${page.url}: ParamField type`);
        contract.params.push({
          description: sourceVisibleText(node.children),
          name,
          page: pathname,
          required: attributes.required === true ? "Required" : "Optional",
          type: attributes.type,
        });
      }
    }

    for (const node of collectWidgetComponents(tree, new Set(["CodeGroup"]))) {
      contract.tabGroups.push({
        label: "Code examples",
        page: pathname,
        panels: parseSourceCodePanels(node, page.url).map((panel, index) => {
          const groupNumber = contract.tabGroups.filter((group) => group.page === pathname).length + 1;
          const panelId = `${pathname.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "")}-code-${groupNumber}-panel-${index + 1}`;
          return {
            code: normalizeCode(panel.code),
            label: panel.label,
            labelledBy: `${panelId}-label`,
            labelId: `${panelId}-label`,
            language: panel.language,
          };
        }),
      });
    }
  }
  return contract;
}

function appendSourceStepGroup(result, group, pathname, nested, pageUrl) {
  const items = widgetStepItems(group);
  result.push({
    items: items.map((item, index) => {
      const attributes = parseWidgetAttributes(item.attributes);
      const parsed = widgetStepTitleAndChildren(item, attributes, pageUrl);
      return {
        body: sourceDirectWidgetBody(parsed.children),
        label: attributes.stepNumber ?? String(index + 1),
        title: parsed.title,
      };
    }),
    nested,
    page: pathname,
  });
  for (const item of items) {
    const attributes = parseWidgetAttributes(item.attributes);
    const parsed = widgetStepTitleAndChildren(item, attributes, pageUrl);
    if (item.name === "Steps") {
      const branches = parsed.children.filter((child) => child.type === "component" && child.name === "Step");
      if (branches.length > 0) appendSourceStepGroup(result, { children: branches }, pathname, true, pageUrl);
      continue;
    }
    for (const child of parsed.children) {
      if (child.type === "component" && child.name === "Steps") {
        appendSourceStepGroup(result, child, pathname, true, pageUrl);
      }
    }
  }
}

function compiledDirectWidgetBody($, item) {
  const body = $(item).children("[data-step-body]").clone();
  body.find("[data-step-group]").remove();
  body.find("[data-callout-label]").remove();
  body.find("[data-tab-panel-label]").remove();
  body.find("[data-component-part='step-title']").remove();
  body.find("[data-component-part='step-number']").remove();
  body.find("[data-component-part='step-line']").remove();
  return normalizeWidgetBody(body.text());
}

function sourceDirectWidgetBody(children) {
  return normalizeWidgetBody(
    children
      .map((child) => {
        if (child.type === "text") return sourceMarkdownText(child.value);
        if (child.name === "Steps" || child.name === "Step") return "";
        if (["Info", "Note", "Tip"].includes(child.name)) return sourceVisibleText(child.children);
        if (child.name === "CodeGroup") {
          return parseSourceCodePanels(child, "source CodeGroup").map((panel) => panel.code).join(" ");
        }
        return "";
      })
      .join(" "),
  );
}

function normalizeWidgetBody(value) {
  return normalizeText(value)
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\s/gu, "");
}

function sourceVisibleText(children) {
  return normalizeText(
    children
      .map((child) => {
        if (child.type === "text") return sourceMarkdownText(child.value);
        return sourceVisibleText(child.children);
      })
      .join(" "),
  );
}

function sourceMarkdownText(source) {
  const protectedCode = [];
  let fence;
  const withProtectedCode = source
    .split(/(\r?\n)/)
    .map((part) => {
      if (/^\r?\n$/.test(part)) return part;
      const fenceMarker = part.match(/^\s*(`{3,}|~{3,})/);
      if (!fence && fenceMarker) {
        fence = { character: fenceMarker[1][0], length: fenceMarker[1].length };
        return "";
      }
      if (fence) {
        const closing = part.match(/^\s*(`{3,}|~{3,})\s*$/);
        if (closing && closing[1][0] === fence.character && closing[1].length >= fence.length) {
          fence = undefined;
          return "";
        }
        return protectWidgetCode(part, protectedCode);
      }
      return part.replace(/`([^`]+)`/g, (_, code) => protectWidgetCode(code, protectedCode));
    })
    .join("");
  const visible = withProtectedCode
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^\s{0,3}(?:#{1,6}|>|[-+*]|\d+[.)])\s*/gm, "")
    .replace(/[\*_~]/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
  return visible.replace(/\uE000(\d+)\uE001/g, (_, index) => protectedCode[Number(index)]);
}

function protectWidgetCode(code, protectedCode) {
  const index = protectedCode.push(code) - 1;
  return `\uE000${index}\uE001`;
}

const TEST_WIDGET_NAMES = new Set(["CodeGroup", "Info", "Note", "ParamField", "Step", "Steps", "Tip"]);

function parseWidgetSource(source, pageUrl) {
  const masked = maskWidgetFences(source);
  const root = { children: [], name: "Root", type: "component" };
  const stack = [root];
  let cursor = 0;
  let searchIndex = 0;
  while (searchIndex < masked.length) {
    const start = masked.indexOf("<", searchIndex);
    if (start === -1) break;
    const prefix = masked.slice(start).match(/^<\/?([A-Z][A-Za-z0-9]*)\b/);
    if (!prefix || !TEST_WIDGET_NAMES.has(prefix[1])) {
      searchIndex = start + 1;
      continue;
    }
    const end = widgetTagEnd(source, start, pageUrl);
    const raw = source.slice(start, end + 1);
    const closing = /^<\//.test(raw);
    const selfClosing = /\/\s*>$/.test(raw);
    const name = prefix[1];
    if (start > cursor) stack.at(-1).children.push({ type: "text", value: source.slice(cursor, start) });
    if (closing) {
      assert.equal(stack.at(-1).name, name, `${pageUrl}: widget closing tag`);
      stack.pop();
    } else {
      const nameStart = raw.indexOf(name) + name.length;
      const node = {
        attributes: raw.slice(nameStart, raw.length - (selfClosing ? 2 : 1)),
        children: [],
        name,
        type: "component",
      };
      stack.at(-1).children.push(node);
      if (!selfClosing) stack.push(node);
    }
    cursor = end + 1;
    searchIndex = end + 1;
  }
  if (cursor < source.length) stack.at(-1).children.push({ type: "text", value: source.slice(cursor) });
  assert.equal(stack.length, 1, `${pageUrl}: unclosed widget`);
  return root;
}

function maskWidgetFences(source) {
  let fence;
  return (source.match(/.*(?:\n|$)/g) ?? [])
    .map((line) => {
      const opening = line.match(/^\s*(`{3,}|~{3,})/);
      const masked = line.replace(/[^\n\r]/g, " ");
      if (!fence && opening) {
        fence = { character: opening[1][0], length: opening[1].length };
        return masked;
      }
      if (fence) {
        const closing = line.match(/^\s*(`{3,}|~{3,})\s*(?:\r?\n)?$/);
        if (closing && closing[1][0] === fence.character && closing[1].length >= fence.length) fence = undefined;
        return masked;
      }
      return line;
    })
    .join("");
}

function widgetTagEnd(source, start, pageUrl) {
  let quote;
  for (let index = start + 1; index < source.length; index += 1) {
    const character = source[index];
    if (quote) {
      if (character === quote && source[index - 1] !== "\\") quote = undefined;
    } else if (character === '"' || character === "'") quote = character;
    else if (character === ">") return index;
  }
  assert.fail(`${pageUrl}: unterminated widget tag`);
}

function collectWidgetComponents(root, names) {
  const result = [];
  function visit(node) {
    if (node.type !== "component") return;
    if (names.has(node.name)) result.push(node);
    for (const child of node.children) visit(child);
  }
  visit(root);
  return result;
}

function topLevelWidgetStepGroups(root) {
  const groups = [];
  function visit(node, insideStep) {
    if (node.type !== "component") return;
    if (node.name === "Steps" && !insideStep) groups.push(node);
    const nested = insideStep || node.name === "Steps" || node.name === "Step";
    for (const child of node.children) visit(child, nested);
  }
  visit(root, false);
  return groups;
}

function widgetStepItems(group) {
  return group.children.filter((child) => {
    if (child.type !== "component") return false;
    if (child.name === "Step") return true;
    if (child.name !== "Steps") return false;
    const attributes = parseWidgetAttributes(child.attributes);
    return Boolean(attributes.title || attributes.stepNumber);
  });
}

function widgetStepTitleAndChildren(node, attributes, pageUrl) {
  if (attributes.title) return { children: node.children, title: attributes.title };
  const children = node.children.map((child) => ({ ...child }));
  for (const child of children) {
    if (child.type !== "text") continue;
    const match = child.value.match(/^\s*\*\*([^*\n]+)\*\*\s*(?:\r?\n|$)/);
    if (!match) {
      if (child.value.trim().length === 0) continue;
      break;
    }
    child.value = child.value.slice(match[0].length);
    return { children, title: normalizeText(match[1]) };
  }
  assert.fail(`${pageUrl}: Step title missing`);
}

function sourceParamRuns(tree) {
  const runs = [];
  let current = [];
  for (const child of tree.children) {
    if (child.type === "component" && child.name === "ParamField") {
      current.push(child);
    } else if (!(child.type === "text" && child.value.trim().length === 0)) {
      if (current.length > 0) runs.push(current);
      current = [];
    }
  }
  if (current.length > 0) runs.push(current);
  return runs;
}

function parseWidgetAttributes(source) {
  const attributes = {};
  let index = 0;
  while (index < source.length) {
    while (/\s/.test(source[index] ?? "")) index += 1;
    if (index >= source.length) break;
    const name = source.slice(index).match(/^([A-Za-z][A-Za-z0-9_-]*)/)?.[1];
    assert.ok(name, `invalid widget attribute in ${source}`);
    index += name.length;
    while (/\s/.test(source[index] ?? "")) index += 1;
    if (source[index] !== "=") {
      attributes[name] = true;
      continue;
    }
    index += 1;
    while (/\s/.test(source[index] ?? "")) index += 1;
    const quote = source[index];
    assert.ok(quote === '"' || quote === "'", `non-literal widget attribute ${name}`);
    const start = index + 1;
    index = start;
    while (source[index] !== quote) index += 1;
    attributes[name] = source.slice(start, index);
    index += 1;
  }
  return attributes;
}

function parseSourceCodePanels(node, pageUrl) {
  const source = node.children.map((child) => child.value ?? "").join("").replace(/\r\n/g, "\n");
  const lines = source.split("\n");
  const panels = [];
  for (let index = 0; index < lines.length; index += 1) {
    const opening = lines[index].match(/^\s*(`{3,}|~{3,})([^\s]+)\s+(.+?)\s+theme=\{["']system["']\}\s*$/);
    if (!opening) continue;
    const code = [];
    let closed = false;
    for (index += 1; index < lines.length; index += 1) {
      const closing = lines[index].match(/^\s*(`{3,}|~{3,})\s*$/);
      if (closing && closing[1][0] === opening[1][0] && closing[1].length >= opening[1].length) {
        closed = true;
        break;
      }
      code.push(lines[index]);
    }
    assert.equal(closed, true, `${pageUrl}: CodeGroup fence`);
    panels.push({ code: dedentForTest(code.join("\n")), label: normalizeText(opening[3]), language: opening[2] });
  }
  return panels;
}

function dedentForTest(source) {
  const lines = source.replace(/^\n|\n$/g, "").split("\n");
  const indents = lines.filter((line) => line.trim()).map((line) => line.match(/^\s*/)[0].length);
  const minimum = indents.length > 0 ? Math.min(...indents) : 0;
  return lines.map((line) => line.slice(minimum)).join("\n").trim();
}

function normalizeCode(value) {
  return value.replace(/\r\n/g, "\n").replace(/^\n+|\n+$/g, "");
}

function readLines(path) {
  return readFileSync(path, "utf8").trim().split(/\r?\n/).filter(Boolean);
}

function readManifestRows() {
  assert.ok(existsSync(MANIFEST_PATH), "missing evidence/T4-manifest.md");
  const lines = readFileSync(MANIFEST_PATH, "utf8").split(/\r?\n/);
  const headerIndex = lines.findIndex((line) => line === "| URL | Target | Live title | Live chars | Ported chars | Live headings | Ported headings | Status | Loss |");
  assert.notEqual(headerIndex, -1, "manifest table header missing");
  const rows = [];
  for (const line of lines.slice(headerIndex + 2)) {
    if (!line.startsWith("| ")) break;
    const cells = line.slice(2, -2).split(" | ").map(decodeCell);
    assert.equal(cells.length, 9, `invalid manifest row: ${line}`);
    rows.push({
      url: cells[0],
      target: cells[1],
      liveTitle: cells[2],
      liveChars: cells[3],
      portedChars: cells[4],
      liveHeadings: cells[5],
      portedHeadings: cells[6],
      status: cells[7],
      loss: cells[8],
    });
  }
  return rows;
}

function decodeCell(cell) {
  return cell.replace(/^`|`$/g, "").replaceAll("&#124;", "|").replaceAll("&#96;", "`");
}

function readFrontmatterDocument(path) {
  const source = readFileSync(path, "utf8");
  assert.match(source, /^---\r?\n/, `${relative(ROOT, path)}: frontmatter must start at byte zero`);
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  assert.ok(match, `${relative(ROOT, path)}: invalid frontmatter`);
  const titleMatch = match[1].match(/^title:\s*(.+)$/m);
  assert.ok(titleMatch, `${relative(ROOT, path)}: title missing from frontmatter`);
  const descriptionMatch = match[1].match(/^description:\s*(.+)$/m);
  return {
    body: source.slice(match[0].length),
    description: descriptionMatch ? unquoteYaml(descriptionMatch[1].trim()) : "",
    title: unquoteYaml(titleMatch[1].trim()),
  };
}

function unquoteYaml(value) {
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1).replace(/\\([\\"'])/g, "$1");
  }
  return value;
}

function normalizedMarkdownChars(body) {
  let inFence = false;
  const kept = [];
  for (const line of body.split(/\r?\n/)) {
    if (/^\s*>?\s*(`{3,}|~{3,})/.test(line)) {
      inFence = !inFence;
      continue;
    }
    kept.push(inFence ? line : line
      .replace(/^\s{0,3}#{1,6}\s+/, "")
      .replace(/^\s*(?:[-+*]|\d+[.)])\s+/, "")
      .replace(/^\s*>\s?/, ""));
  }
  return normalizeText(kept.join("\n")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/[*_~]/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&"))
    .length;
}

function markdownHeadings(body) {
  let inFence = false;
  const headings = [];
  for (const line of body.split(/\r?\n/)) {
    if (/^\s*>?\s*(`{3,}|~{3,})/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const match = line.match(/^\s{0,3}(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (match) headings.push({ depth: match[1].length, title: normalizeHeading(match[2]) });
  }
  return headings;
}

function parseHeadingCell(value, url) {
  try {
    const parsed = JSON.parse(value);
    assert.equal(Array.isArray(parsed), true);
    return parsed;
  } catch (error) {
    assert.fail(`${url}: invalid heading JSON ${value}: ${error.message}`);
  }
}

function parseNonNegativeInteger(value, url) {
  assert.match(value, /^\d+$/, `${url}: expected non-negative integer, got ${value}`);
  return Number(value);
}

function normalizeHeading(value) {
  return normalizeText(value)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s+#+$/, "")
    .replace(/[*_`]/g, "")
    .trim();
}

function normalizeText(value) {
  return value.replace(/[\u200B-\u200D\uFEFF]/g, "").replace(/\s+/g, " ").trim();
}

function markdownAndHtmlTargets(source) {
  const withoutFences = source.replace(/^\s*(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\s*\1\s*$/gm, "");
  return [
    ...withoutFences.matchAll(/!?\[[^\]]*\]\(([^\s)]+)(?:\s+["'][^"']*["'])?\)/g),
    ...withoutFences.matchAll(/\b(?:href|src)=["']([^"']+)["']/g),
  ].map((match) => match[1]);
}

function markdownImageTargets(source) {
  const withoutFences = source.replace(/^\s*(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\s*\1\s*$/gm, "");
  return [
    ...withoutFences.matchAll(/!\[[^\]]*\]\(([^\s)]+)(?:\s+["'][^"']*["'])?\)/g),
    ...withoutFences.matchAll(/<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/g),
  ].map((match) => match[1]);
}

function semanticContract(bodyHtml, sourceMarkdown, pageUrl, linkHealth = new Map()) {
  const $ = cheerio.load(`<div id="contract-root">${bodyHtml}</div>`, null, false);
  const root = $("#contract-root");
  root.find("[class]").each((_, element) => {
    const tokens = new Set(($(element).attr("class") ?? "").split(/\s+/).filter(Boolean));
    if (tokens.has("hidden") && tokens.has("dark:block") && ($(element).is("img") || $(element).find("img").length > 0)) {
      $(element).remove();
    }
  });

  const links = root
    .find("a[href]")
    .toArray()
    .filter((anchor) => normalizeText($(anchor).text()).length > 0)
    .map((anchor) => rewriteExpectedLiveUrl($(anchor).attr("href"), pageUrl, false));
  for (const match of sourceMarkdown.matchAll(/<Card\b([^>]*)>/g)) {
    const href = match[1].match(/(?:^|\s)href="([^"]+)"/)?.[1];
    if (href) {
      const healthUrl = expectedSameOriginHealthUrl(href, pageUrl);
      if (!healthUrl || (linkHealth.get(healthUrl) ?? 200) < 400) {
        links.push(rewriteExpectedLiveUrl(href, pageUrl, false));
      }
    }
  }
  const sourceOnlyStep = sourceMarkdown.match(/<Steps\b[^>]*stepNumber="2"[^>]*>([\s\S]*?)<\/Steps>/)?.[1] ?? "";
  for (const match of sourceOnlyStep.matchAll(/(?<!!)\[[^\]]+\]\(([^)\s]+)(?:\s+[^)]*)?\)/g)) {
    links.push(rewriteExpectedLiveUrl(match[1], pageUrl, false));
  }

  const media = root
    .find("img[src]")
    .toArray()
    .map((image) =>
      `${rewriteExpectedLiveUrl($(image).attr("src"), pageUrl, true)}\u0000${$(image).attr("alt") ?? ""}`,
    );
  return { links: links.sort(), media: media.sort() };
}

function rewriteExpectedLiveUrl(rawTarget, pageUrl, asset) {
  const target = rawTarget.trim();
  if (!asset && (target.startsWith("#") || /^(?:mailto|tel):/i.test(target))) return target;
  const resolved = new URL(target, pageUrl);
  if (!asset && resolved.origin === LIVE_ORIGIN && resolved.pathname.startsWith("/docs/docs/")) {
    const candidate = `/docs/${resolved.pathname.slice("/docs/docs/".length)}`;
    if (inventory.includes(`${LIVE_ORIGIN}${candidate}`)) resolved.pathname = candidate;
  }
  if (resolved.origin === LIVE_ORIGIN && !asset && inventory.includes(`${resolved.origin}${resolved.pathname}`)) {
    return `${resolved.pathname}${resolved.search}${resolved.hash}`;
  }
  return resolved.href;
}

function expectedSameOriginHealthUrl(rawTarget, pageUrl) {
  const resolved = new URL(rawTarget, pageUrl);
  if (resolved.origin !== LIVE_ORIGIN) return undefined;
  if (resolved.pathname.startsWith("/docs/docs/")) {
    const candidate = `/docs/${resolved.pathname.slice("/docs/docs/".length)}`;
    if (inventory.includes(`${LIVE_ORIGIN}${candidate}`)) resolved.pathname = candidate;
  }
  resolved.hash = "";
  return resolved.href;
}

function readStaticHtml(pathname) {
  return readFileSync(resolve(ROOT, `.next/server/app${pathname}.html`), "utf8");
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function assertLocalTargetExists(target, sourcePath) {
  const pathname = target.split(/[?#]/, 1)[0];
  if (pathname === "/docs") {
    assert.ok(existsSync(resolve(ROOT, "content/docs/index.mdx")), `${sourcePath}: ${target}`);
    return;
  }
  if (pathname.startsWith("/docs/")) {
    assert.ok(
      existsSync(resolve(ROOT, `content${pathname}.mdx`)) ||
        existsSync(resolve(ROOT, `content${pathname}/index.mdx`)),
      `${sourcePath}: ${target}`,
    );
    return;
  }
  if (EXPECTED_OUTSIDE_ROUTES.has(`${LIVE_ORIGIN}${pathname}`)) {
    assert.ok(existsSync(resolve(ROOT, EXPECTED_OUTSIDE_ROUTES.get(`${LIVE_ORIGIN}${pathname}`))), `${sourcePath}: ${target}`);
    return;
  }
  assert.ok(existsSync(resolve(ROOT, `public${pathname}`)), `${sourcePath}: ${target}`);
}

function assertNoNestedInteractiveLinks(source, sourcePath) {
  const stack = [];
  for (const match of source.matchAll(/<\/?(?:Link(?!\.)|a)\b[^>]*>/g)) {
    const markup = match[0];
    const closing = markup.startsWith("</");
    const selfClosing = /\/\s*>$/.test(markup);
    const tag = /^<\/?Link\b/.test(markup) ? "Link" : "a";

    if (closing) {
      assert.equal(stack.at(-1), tag, `${sourcePath}: unmatched ${markup}`);
      stack.pop();
      continue;
    }

    assert.equal(
      stack.length,
      0,
      `${sourcePath}: ${markup} is nested inside <${stack.at(-1)}>`,
    );
    if (!selfClosing) stack.push(tag);
  }
  assert.deepEqual(stack, [], `${sourcePath}: unclosed interactive link markup`);
}

function walkFiles(root) {
  if (!existsSync(root)) return [];
  const files = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = resolve(root, entry.name);
    if (entry.isSymbolicLink()) files.push(path);
    else if (entry.isDirectory()) files.push(...walkFiles(path));
    else files.push(path);
  }
  return files;
}

function collectPublishableTrackedTextFiles(root) {
  return ["app", "components", "content", "lib", "public", "scripts"]
    .flatMap((directory) => walkFiles(resolve(root, directory)))
    .filter((file) => !file.endsWith(".DS_Store"))
    .filter((file) => !isGeneratedReferenceArtifact(root, file));
}

function isGeneratedReferenceArtifact(root, file) {
  return ["store6-core", "store6-mutations"].some((moduleName) => {
    const moduleRoot = resolve(root, "public", "reference", moduleName);
    const moduleRelative = relative(moduleRoot, file);
    return (
      moduleRelative === "" ||
      (!isAbsolute(moduleRelative) &&
        moduleRelative !== ".." &&
        !moduleRelative.startsWith(`..${sep}`))
    );
  });
}

function findPublishedSurfaceViolations(root, patterns) {
  const files = [
    ...walkFiles(resolve(root, "content/docs")).filter((file) => file.endsWith(".mdx")),
    resolve(root, "public/llms.txt"),
    ...walkFiles(resolve(root, "app")).filter((file) => file.endsWith(".tsx")),
  ]
    .filter((file) => existsSync(file))
    .sort();
  const violations = [];
  for (const file of files) {
    const source = readFileSync(file, "utf8");
    const sourcePath = relative(root, file).split(sep).join("/");
    for (const pattern of patterns) {
      const expression = new RegExp(pattern, "g");
      for (const match of source.matchAll(expression)) {
        const line = source.slice(0, match.index).split("\n").length;
        violations.push(
          `internal process vocabulary found on a published surface: ${sourcePath}:${line} matched ${pattern}; state the technical fact with durable attribution instead (AGENTS.md).`,
        );
      }
    }
  }
  return violations;
}

let lastLiveRequestStartedAt = 0;

async function fetchWith5xxRetry(url) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const remaining = 1000 - (Date.now() - lastLiveRequestStartedAt);
    if (remaining > 0) await sleep(remaining);
    lastLiveRequestStartedAt = Date.now();
    const response = await fetch(url);
    if (response.status >= 500 && response.status <= 599 && attempt < 2) {
      continue;
    }
    if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
    return response.text();
  }
  throw new Error(`${url}: exhausted retries`);
}

async function fetchStatusWith5xxRetry(url) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const remaining = 1000 - (Date.now() - lastLiveRequestStartedAt);
    if (remaining > 0) await sleep(remaining);
    lastLiveRequestStartedAt = Date.now();
    const response = await fetch(url);
    if (response.status >= 500 && response.status <= 599 && attempt < 2) continue;
    return response.status;
  }
  throw new Error(`${url}: exhausted retries`);
}

function sleep(milliseconds) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds));
}
