import assert from "node:assert/strict";
import { existsSync, lstatSync, readFileSync, readdirSync } from "node:fs";
import { relative, resolve } from "node:path";
import test from "node:test";

import * as cheerio from "cheerio";

const ROOT = resolve(import.meta.dirname, "..");
const INVENTORY_PATH = resolve(ROOT, "evidence/live-url-inventory.txt");
const MANIFEST_PATH = resolve(ROOT, "evidence/T4-manifest.md");
const LIVE_ORIGIN = "https://store.mobilenativefoundation.org";
const EXCLUDED_URL = `${LIVE_ORIGIN}/api/openapi.json`;
const EXPECTED_OUTSIDE_ROUTES = new Map([
  [`${LIVE_ORIGIN}/developer-newsletter/overview`, "app/developer-newsletter/overview/page.tsx"],
  [`${LIVE_ORIGIN}/release-notes/overview`, "app/release-notes/overview/page.tsx"],
]);
const STORE6_SOURCE_ROOT = "/Users/matt/.codex/worktrees/3cd0/Store6";
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

test("inventory defines 35 direct docs targets and two exact outside routes", () => {
  assert.equal(inventory.length, 37);
  assert.equal(new Set(inventory).size, 37);
  assert.equal(docsInventory.length, 35);
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

test("manifest has 37 ordered inventory rows and one separate OpenAPI exclusion", () => {
  const rows = readManifestRows();
  assert.equal(rows.length, 38);
  assert.deepEqual(
    rows.slice(0, 37).map((row) => row.url),
    inventory,
  );
  assert.equal(rows[37].url, EXCLUDED_URL);
  assert.equal(rows[37].status, "excluded by design");
  assert.equal(rows[37].target, "—");
});

test("manifest generation does not depend on the wall clock", () => {
  const source = readFileSync(resolve(ROOT, "scripts/port-page.mjs"), "utf8");
  assert.match(source, /const MIGRATION_DATE = "2026-08-09";/);
  assert.doesNotMatch(source, /new Intl\.DateTimeFormat\([^\n]+new Date\(\)/);
});

test("manifest fidelity values match ported bodies and warrant every status", () => {
  const rows = readManifestRows().slice(0, 37);

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
  const rows = readManifestRows().slice(0, 37);
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

test("llms copy preserves the current seven-link source inventory and maps every target on-site", () => {
  const source = readFileSync(resolve(STORE6_SOURCE_ROOT, "llms.txt"), "utf8");
  const target = readFileSync(resolve(ROOT, "public/llms.txt"), "utf8");
  const sourceLinks = markdownAndHtmlTargets(source);
  const targetLinks = markdownAndHtmlTargets(target);
  assert.equal(sourceLinks.length, 7);
  assert.equal(targetLinks.length, sourceLinks.length);
  assert.equal(targetLinks.every((link) => link.startsWith("/docs/store6/")), true);
  for (const link of targetLinks) assertLocalTargetExists(link, "public/llms.txt");
});

test("public source contains no internal tracker shorthand or symlinks", () => {
  const roots = [resolve(ROOT, "content/docs"), resolve(ROOT, "public")];
  const files = roots.flatMap((root) => walkFiles(root));
  const forbidden = /\bSTORE-\d+\b|\b(?:Issue|Plan|PR)[- #]?\d+\b|Awaiting Matt|RULINGS? ADDENDUM|\bLinear\b/;
  for (const file of files) {
    assert.equal(lstatSync(file).isSymbolicLink(), false, relative(ROOT, file));
    assert.doesNotMatch(readFileSync(file, "utf8"), forbidden, relative(ROOT, file));
  }
});

test("T3 Store6 overview remains byte-identical", async () => {
  const { createHash } = await import("node:crypto");
  const bytes = readFileSync(resolve(ROOT, "content/docs/store6/overview.mdx"));
  assert.equal(createHash("sha256").update(bytes).digest("hex"), T3_OVERVIEW_SHA256);
});

test(
  "live selectors, titles, characters, and ordered headings match the manifest",
  { skip: process.env.T4_VERIFY_LIVE !== "1" },
  async () => {
    const rows = readManifestRows().slice(0, 37);
    for (let index = 0; index < rows.length; index += 1) {
      if (index > 0) await sleep(1000);
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
        const portedText = normalizeText(readFrontmatterDocument(resolve(ROOT, targetPath)).body);
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
  return {
    body: source.slice(match[0].length),
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
    if (/^\s*(`{3,}|~{3,})/.test(line)) {
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
    if (/^\s*(`{3,}|~{3,})/.test(line)) {
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
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
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

async function fetchWith5xxRetry(url) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(url);
    if (response.status >= 500 && response.status <= 599 && attempt < 2) {
      await sleep(1000);
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
