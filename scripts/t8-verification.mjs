import { lstat, readFile, readdir } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import * as cheerio from "cheerio";

const LIVE_ORIGIN = "https://store.mobilenativefoundation.org";
const LOCAL_ORIGIN = "http://127.0.0.1:3222";
const OPENAPI_EXCLUSION = `${LIVE_ORIGIN}/api/openapi.json`;
const DEFAULT_ROOT = resolve(import.meta.dirname, "..");
const MINIMUM_REQUEST_START_GAP_MS = 1_000;
const MAXIMUM_5XX_RETRIES = 2;
const DEFAULT_REQUEST_TIMEOUT_MS = 30_000;
const CONFIGURED_APPLICATION_PAGE_PATTERN = /\/page\.(?:mdx?|jsx?|tsx?)$/;

const CONTRACT_SOURCES = Object.freeze({
  inventory: "evidence/live-url-inventory.txt",
  manifest: "evidence/T4-manifest.md",
  ownedTargets: "evidence/T4-owned-targets.json",
  store6SourceLock: "evidence/T4-store6-source-lock.json",
  extras: "evidence/T8-extras.txt",
});

const FIXED_EXTRA_SOURCES = Object.freeze([
  { path: "/", source: "app/page.tsx" },
  { path: "/docs", source: "content/docs/index.mdx" },
  { path: "/docs/store6/overview", source: "content/docs/store6/overview.mdx" },
  {
    path: "/docs/store6/concepts/api-tiers",
    source: "content/docs/store6/concepts/api-tiers.mdx",
  },
  {
    path: "/docs/store6/concepts/errors",
    source: "content/docs/store6/concepts/errors.mdx",
  },
  {
    path: "/docs/store6/concepts/freshness",
    source: "content/docs/store6/concepts/freshness.mdx",
  },
  {
    path: "/docs/store6/concepts/memory-and-lifecycle",
    source: "content/docs/store6/concepts/memory-and-lifecycle.mdx",
  },
  {
    path: "/docs/store6/concepts/read-contract",
    source: "content/docs/store6/concepts/read-contract.mdx",
  },
  {
    path: "/docs/store6/guides/devtools",
    source: "content/docs/store6/guides/devtools.mdx",
  },
  {
    path: "/docs/store6/guides/extending",
    source: "content/docs/store6/guides/extending.mdx",
  },
  {
    path: "/docs/store6/guides/fetchers",
    source: "content/docs/store6/guides/fetchers.mdx",
  },
  {
    path: "/docs/store6/guides/performance",
    source: "content/docs/store6/guides/performance.mdx",
  },
  {
    path: "/docs/store6/guides/persistence",
    source: "content/docs/store6/guides/persistence.mdx",
  },
  {
    path: "/docs/store6/guides/swift",
    source: "content/docs/store6/guides/swift.mdx",
  },
  {
    path: "/docs/store6/guides/testing",
    source: "content/docs/store6/guides/testing.mdx",
  },
  {
    path: "/docs/store6/migration/component-map",
    source: "content/docs/store6/migration/component-map.mdx",
  },
  {
    path: "/docs/store6/migration/from-store4",
    source: "content/docs/store6/migration/from-store4.mdx",
  },
  {
    path: "/docs/store6/migration/from-store5",
    source: "content/docs/store6/migration/from-store5.mdx",
  },
  {
    path: "/docs/store6/mutations",
    source: "content/docs/store6/mutations/index.mdx",
  },
  {
    path: "/docs/store6/mutations/aliases",
    source: "content/docs/store6/mutations/aliases.mdx",
  },
  {
    path: "/docs/store6/mutations/conflicts",
    source: "content/docs/store6/mutations/conflicts.mdx",
  },
  {
    path: "/docs/store6/mutations/drain-and-restart",
    source: "content/docs/store6/mutations/drain-and-restart.mdx",
  },
  {
    path: "/docs/store6/mutations/inspection",
    source: "content/docs/store6/mutations/inspection.mdx",
  },
  {
    path: "/docs/store6/mutations/journal-storage",
    source: "content/docs/store6/mutations/journal-storage.mdx",
  },
  {
    path: "/docs/store6/mutations/mutators",
    source: "content/docs/store6/mutations/mutators.mdx",
  },
  {
    path: "/docs/store6/mutations/pending-write-ui",
    source: "content/docs/store6/mutations/pending-write-ui.mdx",
  },
  {
    path: "/docs/store6/mutations/quickstart",
    source: "content/docs/store6/mutations/quickstart.mdx",
  },
  {
    path: "/docs/store6/mutations/server",
    source: "content/docs/store6/mutations/server.mdx",
  },
  {
    path: "/docs/store6/mutations/testing",
    source: "content/docs/store6/mutations/testing.mdx",
  },
  {
    path: "/reference/store6-core/index.html",
    source: "public/reference/store6-core/index.html",
  },
  {
    path: "/reference/store6-mutations/index.html",
    source: "public/reference/store6-mutations/index.html",
  },
  { path: "/tokens-demo", source: "app/tokens-demo/page.tsx" },
]);

const NON_PAGE_SURFACES = Object.freeze([
  { path: "/api/search", surface: "static search API" },
  { path: "/llms.txt", surface: "public text file" },
]);

export async function deriveRouteContract({ root = DEFAULT_ROOT } = {}) {
  const absoluteRoot = resolve(root);
  const sourceTexts = Object.fromEntries(
    await Promise.all(
      Object.entries(CONTRACT_SOURCES).map(async ([name, path]) => [
        name,
        await readRequiredRegularFile(absoluteRoot, path),
      ]),
    ),
  );

  const inventoryUrls = parseInventory(sourceTexts.inventory);
  const inventoryPaths = inventoryUrls.map((url) => new URL(url).pathname);
  const excludedUrls = parseExcludedUrls(sourceTexts.manifest);
  if (excludedUrls.length !== 1 || excludedUrls[0] !== OPENAPI_EXCLUSION) {
    throw new Error(
      `expected the separate OpenAPI exclusion ${OPENAPI_EXCLUSION}; got ${JSON.stringify(excludedUrls)}`,
    );
  }

  const inventorySet = new Set(inventoryUrls);
  const exclusionsWithinInventory = excludedUrls.filter((url) => inventorySet.has(url));
  if (exclusionsWithinInventory.length > 0) {
    throw new Error("OpenAPI exclusion must remain outside the inventory");
  }

  const outsideDocs = inventoryPaths.filter((path) => !path.startsWith("/docs/"));
  const requiredOutsideDocs = [
    "/developer-newsletter/overview",
    "/release-notes/overview",
  ];
  if (!sameOrderedValues([...outsideDocs].sort(), requiredOutsideDocs)) {
    throw new Error(
      `inventory paths outside /docs/** differ from the required routes: ${JSON.stringify(outsideDocs)}`,
    );
  }

  const sourceLock = parseJson(sourceTexts.store6SourceLock, CONTRACT_SOURCES.store6SourceLock);
  const ownedTargets = parseJson(sourceTexts.ownedTargets, CONTRACT_SOURCES.ownedTargets);
  const lockTargets = collectTargetPaths(sourceLock?.sources, "Store6 source lock", "target");
  const ledgerTargets = collectTargetPaths(
    ownedTargets?.owners?.["sync-store6-docs"],
    "Store6 owned-target ledger",
    "path",
  );
  if (!sameOrderedValues(lockTargets, ledgerTargets)) {
    throw new Error("Store6 source lock and owned-target ledger differ");
  }
  if (lockTargets.includes("content/docs/store6/overview.mdx")) {
    throw new Error("hand-authored Store6 overview must remain outside the sync lock");
  }
  if (!lockTargets.includes("public/llms.txt")) {
    throw new Error("Store6 source lock must own public/llms.txt");
  }
  const unsupportedLockTargets = lockTargets.filter(
    (target) => target !== "public/llms.txt" && !isSynchronizedStore6Doc(target),
  );
  if (unsupportedLockTargets.length > 0) {
    throw new Error(
      `Store6 source lock has unsupported targets: ${JSON.stringify(unsupportedLockTargets)}`,
    );
  }

  const lockedTargets = lockTargets.filter(isSynchronizedStore6Doc);
  if (lockedTargets.length === 0) throw new Error("Store6 source lock has no synchronized docs");

  const expectedPortTargets = [
    ...inventoryPaths.map(inventoryTarget),
    CONTRACT_SOURCES.manifest,
  ].sort();
  const portLedgerTargets = collectTargetPaths(
    ownedTargets?.owners?.["port-page:generate"],
    "inventory owned-target ledger",
    "path",
  );
  if (!sameOrderedValues(expectedPortTargets, portLedgerTargets)) {
    throw new Error("inventory targets and port ledger differ");
  }

  const store6SyncedRoutes = lockedTargets.map(docsRoute).sort();
  const computedExtraSources = [
    ...FIXED_EXTRA_SOURCES,
    ...lockedTargets.map((source) => ({ path: docsRoute(source), source })),
  ].sort((left, right) => compareStrings(left.path, right.path));
  const extras = computedExtraSources.map(({ path }) => path);
  assertUnique(extras, "computed page extras");
  const recordedExtras = parsePathLines(sourceTexts.extras, CONTRACT_SOURCES.extras);
  if (!sameOrderedValues(recordedExtras, extras)) {
    throw new Error("T8 extras file differs from computed page extras");
  }

  const inventoryPathSet = new Set(inventoryPaths);
  const extraInventoryOverlap = extras.filter((path) => inventoryPathSet.has(path));
  if (extraInventoryOverlap.length > 0) {
    throw new Error(
      `page extras overlap the live inventory: ${JSON.stringify(extraInventoryOverlap)}`,
    );
  }

  await Promise.all(
    [
      ...new Set([
        ...computedExtraSources.map(({ source }) => source),
        ...lockTargets,
        ...expectedPortTargets,
      ]),
    ]
      .filter((source) => source !== CONTRACT_SOURCES.manifest)
      .map((source) => readRequiredRegularFile(absoluteRoot, source)),
  );

  const pageRoutes = [...new Set([...inventoryPaths, ...extras])].sort();
  const expectedDocsRoutes = pageRoutes.filter(
    (path) => path === "/docs" || path.startsWith("/docs/"),
  );
  const contentDocsRoutes = (await collectMdxTargets(absoluteRoot, "content/docs"))
    .map(docsRoute)
    .sort();
  if (!sameOrderedValues(contentDocsRoutes, expectedDocsRoutes)) {
    throw new Error("content documentation routes differ from the derived page census");
  }

  const applicationPages = await collectMatchingTargets(
    absoluteRoot,
    "app",
    (target) => CONFIGURED_APPLICATION_PAGE_PATTERN.test(target),
  );
  const expectedApplicationPages = [
    "app/(docs)/docs/[[...slug]]/page.tsx",
    ...FIXED_EXTRA_SOURCES.map(({ source }) => source).filter((source) => source.startsWith("app/")),
    ...expectedPortTargets.filter((target) => target.startsWith("app/")),
  ].sort();
  assertUnique(expectedApplicationPages, "expected application page entrypoints");
  if (!sameOrderedValues(applicationPages, expectedApplicationPages)) {
    throw new Error("application page entrypoints differ from the derived page census");
  }

  const publicReferencePages = await collectMatchingTargets(
    absoluteRoot,
    "public/reference",
    (target) => target.endsWith(".html"),
  );
  const expectedPublicReferencePages = FIXED_EXTRA_SOURCES.map(({ source }) => source)
    .filter((source) => source.startsWith("public/reference/") && source.endsWith(".html"))
    .sort();
  if (!sameOrderedValues(publicReferencePages, expectedPublicReferencePages)) {
    throw new Error("public reference entrypoints differ from the derived page census");
  }

  return {
    excludedUrls,
    exclusionsWithinInventory,
    extras,
    inventoryPaths,
    inventoryUrls,
    nonPageSurfaces: NON_PAGE_SURFACES.map((entry) => ({ ...entry })),
    pageRoutes,
    routeSources: {
      applicationPages,
      contentDocs: contentDocsRoutes,
      publicReferencePages,
    },
    sources: { ...CONTRACT_SOURCES },
    store6SyncedRoutes,
  };
}

export function extractRenderedPage(html, url, { requireMain = true } = {}) {
  if (typeof html !== "string") {
    throw new TypeError(`${url}: rendered HTML must be a string`);
  }

  const $ = cheerio.load(html);
  const mainCount = $("main#content-container").length;
  const titleCount = $("#page-title").length;
  const contentCount = $("#content").length;
  if (requireMain && (mainCount !== 1 || titleCount !== 1 || contentCount !== 1)) {
    throw new Error(
      `${url}: expected exactly one main#content-container, #page-title, and #content; got ${mainCount}/${titleCount}/${contentCount}`,
    );
  }
  if (!requireMain && (titleCount !== 1 || contentCount !== 1)) {
    throw new Error(
      `${url}: expected exactly one #page-title and #content; got ${titleCount}/${contentCount}`,
    );
  }

  const title = normalizeText($("#page-title").text());
  if (!title) {
    throw new Error(`${url}: #page-title is empty`);
  }

  const content = $("#content");
  const normalizedText = normalizeText(content.text());
  const headings = content
    .find("h1,h2,h3,h4,h5,h6")
    .toArray()
    .map((heading) => normalizeHeading($(heading).text()));

  return {
    chars: normalizedText.length,
    headings,
    normalizedText,
    title,
  };
}

export function assessPageFidelity(live, local) {
  const titleMatch = live.title === local.title;
  const headingsMatch = sameOrderedValues(live.headings, local.headings);
  const ratio = live.chars === 0 ? null : local.chars / live.chars;
  const bodyMatch = live.chars === 0 ? local.chars === 0 : ratio >= 0.6;
  const reasons = [];

  if (!titleMatch) reasons.push("title differs");
  if (!bodyMatch) {
    reasons.push(
      live.chars === 0
        ? "title-only live page has nonempty local content"
        : "normalized character ratio is below 60%",
    );
  }
  if (!headingsMatch) reasons.push("ordered headings differ");

  return {
    headingsMatch,
    passed: titleMatch && bodyMatch && headingsMatch,
    ratio,
    reasons,
    titleMatch,
  };
}

export async function verifyLocalRoutes(
  contract,
  {
    baseUrl = LOCAL_ORIGIN,
    fetchImpl = globalThis.fetch,
    requestTimeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
  } = {},
) {
  assertExactLocalBase(baseUrl);
  if (typeof fetchImpl !== "function") throw new TypeError("fetch implementation is required");

  const inventoryPathSet = new Set(contract.inventoryPaths);
  const localPages = new Map();
  const pageResults = [];
  for (const path of contract.pageRoutes) {
    const url = `${baseUrl}${path}`;
    const response = await fetchResponse(url, fetchImpl, requestTimeoutMs);
    if (response.status !== 200) {
      await discardResponse(response);
      throw new Error(`${url}: expected HTTP 200, got ${response.status}`);
    }
    const text = await response.text();
    pageResults.push({ path, status: response.status });
    if (inventoryPathSet.has(path)) {
      localPages.set(path, extractRenderedPage(text, url, { requireMain: false }));
    }
  }

  const nonPageResults = [];
  for (const entry of contract.nonPageSurfaces) {
    const url = `${baseUrl}${entry.path}`;
    const response = await fetchResponse(url, fetchImpl, requestTimeoutMs);
    if (response.status !== 200) {
      await discardResponse(response);
      throw new Error(`${url}: expected HTTP 200, got ${response.status}`);
    }
    await discardResponse(response);
    nonPageResults.push({ ...entry, status: response.status });
  }

  return { localPages, nonPageResults, pageResults };
}

export function createSerialLiveFetcher({
  fetchImpl = globalThis.fetch,
  max5xxRetries = MAXIMUM_5XX_RETRIES,
  minimumStartGapMs = MINIMUM_REQUEST_START_GAP_MS,
  now = () => Date.now(),
  requestTimeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
  sleep = (milliseconds) => new Promise((resolveSleep) => setTimeout(resolveSleep, milliseconds)),
} = {}) {
  if (typeof fetchImpl !== "function") throw new TypeError("fetch implementation is required");
  if (!Number.isInteger(max5xxRetries) || max5xxRetries < 0) {
    throw new TypeError("max5xxRetries must be a nonnegative integer");
  }
  if (!Number.isFinite(minimumStartGapMs) || minimumStartGapMs < MINIMUM_REQUEST_START_GAP_MS) {
    throw new TypeError(
      `minimumStartGapMs must be at least ${MINIMUM_REQUEST_START_GAP_MS} milliseconds`,
    );
  }

  let lastRequestStart;
  let queue = Promise.resolve();

  async function fetchLiveSerial(url) {
    assertLiveInventoryUrl(url);

    for (let attempt = 1; attempt <= max5xxRetries + 1; attempt += 1) {
      while (lastRequestStart !== undefined) {
        const elapsed = now() - lastRequestStart;
        if (elapsed >= minimumStartGapMs) break;
        await sleep(minimumStartGapMs - elapsed);
      }
      lastRequestStart = now();

      const response = await fetchResponse(url, fetchImpl, requestTimeoutMs);
      const is5xx = response.status >= 500 && response.status <= 599;
      if (is5xx) {
        await discardResponse(response);
        if (attempt <= max5xxRetries) continue;
        throw new Error(`${url}: HTTP ${response.status}`);
      }
      if (response.status !== 200) {
        await discardResponse(response);
        throw new Error(`${url}: HTTP ${response.status}`);
      }
      const text = await response.text();
      return { attempts: attempt, status: response.status, text };
    }

    throw new Error(`${url}: live fetch exhausted unexpectedly`);
  }

  return function fetchLive(url) {
    const pending = queue.then(() => fetchLiveSerial(url));
    queue = pending.catch(() => undefined);
    return pending;
  };
}

export async function verifyLiveFidelity(contract, localPages, { liveFetch } = {}) {
  if (typeof liveFetch !== "function") throw new TypeError("liveFetch is required");
  const results = [];

  for (const url of contract.inventoryUrls) {
    const path = new URL(url).pathname;
    const local = localPages.get(path);
    if (!local) throw new Error(`${path}: served local page was not captured`);

    const fetched = await liveFetch(url);
    const live = extractRenderedPage(fetched.text, url);
    const assessment = assessPageFidelity(live, local);
    results.push({
      attempts: fetched.attempts,
      headingsMatch: assessment.headingsMatch,
      liveChars: live.chars,
      liveHeadings: live.headings,
      liveTitle: live.title,
      localChars: local.chars,
      localHeadings: local.headings,
      localTitle: local.title,
      passed: assessment.passed,
      path,
      ratio: assessment.ratio,
      reasons: assessment.reasons,
      status: fetched.status,
      titleMatch: assessment.titleMatch,
      url,
    });
  }

  return results;
}

export async function verifyLiveInventory(contract, { liveFetch } = {}) {
  if (typeof liveFetch !== "function") throw new TypeError("liveFetch is required");
  const url = `${LIVE_ORIGIN}/sitemap.xml`;
  const fetched = await liveFetch(url);
  const sitemapUrls = [...fetched.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    (match) => match[1],
  );
  if (sitemapUrls.length === 0) throw new Error(`${url}: live sitemap contains zero URLs`);
  if (!sameOrderedValues(sitemapUrls, contract.inventoryUrls)) {
    throw new Error(`live sitemap differs from ${CONTRACT_SOURCES.inventory}`);
  }
  return {
    attempts: fetched.attempts,
    status: fetched.status,
    url,
    urlCount: sitemapUrls.length,
  };
}

export function parseMode(args) {
  if (args.length === 1 && (args[0] === "--local" || args[0] === "--live")) {
    return args[0].slice(2);
  }
  throw new Error("usage: t8-verification.mjs --local | --live");
}

export function createFailureEnvelope(error, mode) {
  const normalized = error instanceof Error ? error : new Error(String(error));
  return {
    schemaVersion: 1,
    mode,
    passed: false,
    error: {
      message: normalized.message,
      name: normalized.name,
    },
  };
}

async function run(mode) {
  const contract = await deriveRouteContract();
  const local = await verifyLocalRoutes(contract);
  const report = {
    schemaVersion: 1,
    mode,
    passed: true,
    localBaseUrl: LOCAL_ORIGIN,
    liveOrigin: LIVE_ORIGIN,
    sources: contract.sources,
    counts: {
      inventoryPages: contract.inventoryUrls.length,
      inventoryExclusions: contract.exclusionsWithinInventory.length,
      pageExtras: contract.extras.length,
      expectedUniquePages: contract.pageRoutes.length,
      nonPageSurfaces: contract.nonPageSurfaces.length,
    },
    excludedUrls: contract.excludedUrls,
    extras: contract.extras,
    inventoryUrls: contract.inventoryUrls,
    pageRoutes: contract.pageRoutes,
    routeSources: contract.routeSources,
    store6SyncedRoutes: contract.store6SyncedRoutes,
    local: {
      nonPageSurfaces: local.nonPageResults,
      pages: local.pageResults,
    },
  };

  if (mode === "live") {
    const liveFetch = createSerialLiveFetcher();
    const sitemap = await verifyLiveInventory(contract, { liveFetch });
    const pages = await verifyLiveFidelity(contract, local.localPages, { liveFetch });
    report.live = {
      max5xxRetries: MAXIMUM_5XX_RETRIES,
      minimumRequestStartGapMs: MINIMUM_REQUEST_START_GAP_MS,
      pages,
      sitemap,
    };
    report.passed = pages.every((page) => page.passed);
  }

  return report;
}

function parseInventory(text) {
  const urls = parseLineList(text, CONTRACT_SOURCES.inventory);
  assertUnique(urls, "live inventory URLs");
  for (const value of urls) {
    const url = new URL(value);
    if (
      url.origin !== LIVE_ORIGIN ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      `${url.origin}${url.pathname}` !== value
    ) {
      throw new Error(`${CONTRACT_SOURCES.inventory}: invalid canonical live URL ${value}`);
    }
  }
  return urls;
}

function parseExcludedUrls(markdown) {
  const lines = markdown.split(/\r?\n/);
  const headerIndex = lines.findIndex((line) => {
    const cells = markdownCells(line);
    return cells.includes("URL") && cells.includes("Status");
  });
  if (headerIndex < 0) throw new Error(`${CONTRACT_SOURCES.manifest}: manifest table is missing`);

  const headers = markdownCells(lines[headerIndex]);
  const urlIndex = headers.indexOf("URL");
  const statusIndex = headers.indexOf("Status");
  const excluded = [];
  for (const line of lines.slice(headerIndex + 1)) {
    const cells = markdownCells(line);
    if (cells.length === 0) continue;
    if (cells.every((cell) => /^:?-+:?$/.test(cell))) continue;
    if (cells.length <= Math.max(urlIndex, statusIndex)) break;
    if (cells[statusIndex] === "excluded by design") excluded.push(stripCodeTicks(cells[urlIndex]));
  }
  return excluded;
}

function markdownCells(line) {
  const trimmed = line.trim();
  if (!trimmed.startsWith("|") || !trimmed.endsWith("|")) return [];
  return trimmed
    .slice(1, -1)
    .split("|")
    .map((cell) => cell.trim());
}

function stripCodeTicks(value) {
  return value.startsWith("`") && value.endsWith("`") ? value.slice(1, -1) : value;
}

function collectTargetPaths(entries, label, property) {
  if (!Array.isArray(entries)) throw new Error(`${label} entries are missing`);
  const targets = entries
    .map((entry, index) => {
      const target = entry?.[property];
      if (typeof target !== "string" || target.length === 0 || target.startsWith("/")) {
        throw new Error(`${label} entry ${index} has an invalid ${property}`);
      }
      return target;
    })
    .sort();
  assertUnique(targets, `${label} targets`);
  return targets;
}

function isSynchronizedStore6Doc(target) {
  return (
    target.startsWith("content/docs/store6/") &&
    target.endsWith(".mdx") &&
    target !== "content/docs/store6/overview.mdx"
  );
}

function inventoryTarget(path) {
  return path.startsWith("/docs/") ? `content${path}.mdx` : `app${path}/page.tsx`;
}

function docsRoute(target) {
  const relative = target.slice("content/docs/".length, -".mdx".length);
  const route = relative === "index" ? "" : relative.replace(/\/index$/, "");
  return route ? `/docs/${route}` : "/docs";
}

function parsePathLines(text, label) {
  const paths = parseLineList(text, label);
  assertUnique(paths, `${label} paths`);
  for (const path of paths) {
    if (!path.startsWith("/") || path.includes("?") || path.includes("#")) {
      throw new Error(`${label}: invalid page path ${path}`);
    }
  }
  return paths;
}

function parseLineList(text, label) {
  const values = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (values.length === 0) throw new Error(`${label}: list is empty`);
  return values;
}

function parseJson(text, label) {
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`${label}: invalid JSON: ${error.message}`);
  }
}

async function readRequiredRegularFile(root, relativePath) {
  const target = resolve(root, relativePath);
  if (target !== root && !target.startsWith(`${root}/`)) {
    throw new Error(`${relativePath}: path escapes the repository root`);
  }
  const stat = await lstat(target);
  if (stat.isSymbolicLink() || !stat.isFile()) {
    throw new Error(`${relativePath}: expected a regular non-symlink file`);
  }
  return readFile(target, "utf8");
}

async function collectMdxTargets(root, relativeDirectory) {
  return collectMatchingTargets(root, relativeDirectory, (target) => target.endsWith(".mdx"));
}

async function collectMatchingTargets(root, relativeDirectory, matches) {
  const directory = resolve(root, relativeDirectory);
  const stat = await lstat(directory);
  if (stat.isSymbolicLink() || !stat.isDirectory()) {
    throw new Error(`${relativeDirectory}: expected a non-symlink directory`);
  }

  const targets = [];
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries.sort((left, right) => compareStrings(left.name, right.name))) {
    const child = resolve(directory, entry.name);
    const childRelative = relative(root, child).replaceAll("\\", "/");
    const childStat = await lstat(child);
    if (childStat.isSymbolicLink()) {
      throw new Error(`${childRelative}: content documentation cannot be a symlink`);
    }
    if (childStat.isDirectory()) {
      targets.push(...(await collectMatchingTargets(root, childRelative, matches)));
    } else if (childStat.isFile() && matches(childRelative)) {
      targets.push(childRelative);
    }
  }
  return targets;
}

function assertUnique(values, label) {
  if (new Set(values).size !== values.length) throw new Error(`${label} contain duplicates`);
}

function sameOrderedValues(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function compareStrings(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function normalizeText(value) {
  return value.replace(/[\u200B-\u200D\uFEFF]/g, "").replace(/\s+/g, " ").trim();
}

function normalizeHeading(value) {
  return normalizeText(value)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s+#+$/, "")
    .replace(/[*_`]/g, "")
    .trim();
}

function assertLiveInventoryUrl(value) {
  const url = new URL(value);
  if (url.origin !== LIVE_ORIGIN || url.search || url.hash) {
    throw new Error(`${value}: expected a canonical ${LIVE_ORIGIN} page URL`);
  }
}

function assertExactLocalBase(baseUrl) {
  if (baseUrl !== LOCAL_ORIGIN) {
    throw new Error(`local base must be exactly ${LOCAL_ORIGIN}`);
  }
}

function requestOptions(requestTimeoutMs) {
  if (!Number.isFinite(requestTimeoutMs) || requestTimeoutMs <= 0) {
    throw new TypeError("requestTimeoutMs must be positive");
  }
  return {
    redirect: "manual",
    signal: AbortSignal.timeout(requestTimeoutMs),
  };
}

async function fetchResponse(url, fetchImpl, requestTimeoutMs) {
  try {
    return await fetchImpl(url, requestOptions(requestTimeoutMs));
  } catch (error) {
    throw new Error(`${url}: request failed: ${error.message}`, { cause: error });
  }
}

async function discardResponse(response) {
  try {
    await response.arrayBuffer();
  } catch {
    // The status remains the verification result even when a response body cannot be consumed.
  }
}

function assertPinnedNode() {
  const major = Number.parseInt(process.versions.node.split(".")[0], 10);
  if (major !== 22) {
    throw new Error(`Node 22 is required; current runtime is ${process.versions.node}`);
  }
}

async function main() {
  assertPinnedNode();
  const mode = parseMode(process.argv.slice(2));
  const report = await run(mode);
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (!report.passed) process.exitCode = 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    const args = process.argv.slice(2);
    const mode = args.length === 1 && ["--local", "--live"].includes(args[0])
      ? args[0].slice(2)
      : null;
    process.stderr.write(`${JSON.stringify(createFailureEnvelope(error, mode), null, 2)}\n`);
    process.exitCode = 1;
  });
}
