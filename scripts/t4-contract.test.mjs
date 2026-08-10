import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, lstatSync, readFileSync, readdirSync } from "node:fs";
import { relative, resolve } from "node:path";
import test from "node:test";

import * as cheerio from "cheerio";

const ROOT = resolve(import.meta.dirname, "..");
const INVENTORY_PATH = resolve(ROOT, "evidence/live-url-inventory.txt");
const MANIFEST_PATH = resolve(ROOT, "evidence/T4-manifest.md");
const SNAPSHOT_PATH = resolve(ROOT, "evidence/T4-live-snapshot.json");
const STORE6_LOCK_PATH = resolve(ROOT, "evidence/T4-store6-source-lock.json");
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
];
const T3_OVERVIEW_SHA256 = "d308649827de60465915b9b1b1f6fde48c25cb4c2bb660554e4ada577e7c77b3";

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
    ["content/docs/concepts/store5/overview.mdx", 8],
    ["content/docs/use-cases/store5/overview.mdx", 18],
    ["content/docs/community/overview.mdx", 5],
    ["content/docs/meet-store.mdx", 5],
  ]);
  for (const [target, expected] of expectedCardCounts) {
    const source = readFileSync(resolve(ROOT, target), "utf8");
    const linkedHeadings = [...source.matchAll(/^## \[[^\]]+\]\(([^)]+)\)$/gm)];
    assert.equal(linkedHeadings.length, expected, target);
  }

  const fetcher = readFileSync(resolve(ROOT, "content/docs/concepts/store5/fetcher.mdx"), "utf8");
  assert.match(fetcher, /Client-Side Checks Conditional On Request Type/);
  assert.match(fetcher, /Cache Check/);
  assert.match(fetcher, /Validation/);

  const snapshot = JSON.parse(readFileSync(SNAPSHOT_PATH, "utf8"));
  const liveCallouts = snapshot.pages.reduce((total, page) => {
    const $ = cheerio.load(page.bodyHtml);
    return total + $('[role="note"][data-callout-type]').length;
  }, 0);
  const sourceOnlyCallouts = snapshot.pages.filter((page) =>
    /<Steps\b[^>]*stepNumber="2"[^>]*>[\s\S]*?<Note>/.test(page.sourceMarkdown),
  ).length;
  const inventorySources = [...expectedInventoryTargets.values()]
    .map((target) => readFileSync(resolve(ROOT, target), "utf8"))
    .join("\n");
  assert.equal(
    [...inventorySources.matchAll(/^> \*\*(?:Info|Note|Tip)\*\*$/gm)].length,
    liveCallouts + sourceOnlyCallouts,
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

test("publishable tracked text excludes local paths and private publication vocabulary", () => {
  const roots = ["app", "components", "content", "lib", "public", "scripts"]
    .map((path) => resolve(ROOT, path));
  const files = roots.flatMap((root) => walkFiles(root)).filter((file) => !file.endsWith(".DS_Store"));
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
  assert.match(script, /writeOutputTransaction/);

  const snapshot = JSON.parse(readFileSync(SNAPSHOT_PATH, "utf8"));
  assert.equal(snapshot.migrationDate, "2026-08-09");
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
    assert.equal(row.status, warrantedClean ? "ported clean" : "ported with noted loss", row.url);
    assert.equal(row.loss === "none", warrantedClean, row.url);

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

    const expected = semanticContract(page.bodyHtml, page.sourceMarkdown, page.url);
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
  const stepSequence = fetcher("#content ol")
    .toArray()
    .map((list, index) => ({
      number: Number(fetcher(list).attr("start") ?? index + 1),
      title: normalizeText(fetcher(list).children("li").first().find("strong").first().text()),
    }));
  assert.deepEqual(stepSequence, [
    { number: 1, title: "Data Request" },
    { number: 2, title: "Client-Side Checks Conditional On Request Type" },
    { number: 3, title: "Data Fetching" },
    { number: 4, title: "Error Handling" },
    { number: 5, title: "Data Storage" },
    { number: 6, title: "Data Delivery" },
  ]);
  assert.match(fetcher("#content").text(), /A\. Cache Check[\s\S]*B\. Validation/);
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

        const expected = semanticContract(body.html() ?? "", sourceMarkdown, row.url);
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

        const renderedCallouts = body.find('[role="note"][data-callout-type]').length;
        const sourceOnlyCallouts = /<Steps\b[^>]*stepNumber="2"[^>]*>[\s\S]*?<Note>/.test(sourceMarkdown) ? 1 : 0;
        assert.equal(
          [...document.body.matchAll(/^> \*\*(?:Info|Note|Tip)\*\*$/gm)].length,
          renderedCallouts + sourceOnlyCallouts,
          `${row.url}: callout count differs`,
        );
      }
    }
  },
);

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

function semanticContract(bodyHtml, sourceMarkdown, pageUrl) {
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
    if (href) links.push(rewriteExpectedLiveUrl(href, pageUrl, false));
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
  if (resolved.origin === LIVE_ORIGIN && !asset && inventory.includes(`${resolved.origin}${resolved.pathname}`)) {
    return `${resolved.pathname}${resolved.search}${resolved.hash}`;
  }
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
    assert.ok(existsSync(resolve(ROOT, `content${pathname}.mdx`)), `${sourcePath}: ${target}`);
    return;
  }
  if (EXPECTED_OUTSIDE_ROUTES.has(`${LIVE_ORIGIN}${pathname}`)) {
    assert.ok(existsSync(resolve(ROOT, EXPECTED_OUTSIDE_ROUTES.get(`${LIVE_ORIGIN}${pathname}`))), `${sourcePath}: ${target}`);
    return;
  }
  assert.ok(existsSync(resolve(ROOT, `public${pathname}`)), `${sourcePath}: ${target}`);
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

function sleep(milliseconds) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds));
}
