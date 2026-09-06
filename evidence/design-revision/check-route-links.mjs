import { lstat, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, relative, resolve, sep } from "node:path";

import * as cheerio from "cheerio";

const ROOT = resolve(import.meta.dirname, "../..");
const ROUTE_COVERAGE = resolve(import.meta.dirname, "route-coverage.json");
const REPORT = resolve(import.meta.dirname, "route-link-report.json");
const T4_SNAPSHOT = resolve(ROOT, "evidence/T4-live-snapshot.json");
const PUBLIC_ORIGIN = "https://store.mobilenativefoundation.org";
const EXPECTED_ROUTE_COUNT = 82;
const COOKBOOK_URL = `${PUBLIC_ORIGIN}/cookbook/overview`;
const COOKBOOK_SOURCE_ROUTES = new Set(["/docs/meet-store", "/docs/quickstart"]);

async function main() {
  const coverage = JSON.parse(await readFile(ROUTE_COVERAGE, "utf8"));
  if (coverage.publicPageCount !== EXPECTED_ROUTE_COUNT || coverage.routes.length !== EXPECTED_ROUTE_COUNT) {
    throw new Error(`route coverage must contain exactly ${EXPECTED_ROUTE_COUNT} public pages`);
  }

  const routeNames = coverage.routes.map(({ route }) => route);
  assertUnique(routeNames, "route coverage paths");
  const productionLiveOnly = await loadProductionLiveOnlyContracts();

  const declaredReferenceFiles = [...coverage.referenceFiles].sort(compareStrings);
  assertUnique(declaredReferenceFiles, "declared reference files");
  const actualReferenceFiles = (await collectRegularFiles(resolve(ROOT, "public/reference")))
    .map((file) => relative(ROOT, file).split(sep).join("/"))
    .filter((file) => file.endsWith(".html"))
    .sort(compareStrings);
  if (!sameValues(declaredReferenceFiles, actualReferenceFiles)) {
    throw new Error("route coverage referenceFiles differ from the frozen public/reference HTML outputs");
  }

  const pageTargets = new Map();
  for (const file of declaredReferenceFiles) {
    pageTargets.set(`/${file.slice("public/".length)}`, resolve(ROOT, file));
  }

  const sourcePages = [];
  for (const entry of coverage.routes) {
    const file = entry.route.startsWith("/reference/")
      ? resolve(ROOT, entry.source)
      : builtHtmlPath(entry.route);
    await requireRegularFile(file, `${entry.route}: rendered source page`);
    sourcePages.push({ route: entry.route, file });
    const prior = pageTargets.get(entry.route);
    if (prior && prior !== file) throw new Error(`${entry.route}: target resolves to two files`);
    pageTargets.set(entry.route, file);
  }

  const nonPageSurfaces = new Map(coverage.nonPageSurfaces.map((entry) => [entry.path, entry.surface]));
  const htmlCache = new Map();
  const exclusions = new Map();
  const failures = [];
  const counts = {
    sourcePages: sourcePages.length,
    hrefOccurrences: 0,
    sameOriginPageLinks: 0,
    sameOriginFragmentLinks: 0,
    verifiedPageLinks: 0,
    verifiedFragments: 0,
    exclusions: 0,
    failures: 0,
  };

  for (const source of sourcePages) {
    const document = await loadHtml(source.file, htmlCache);
    const hrefs = document.$("a[href]").toArray().map((anchor) => document.$(anchor).attr("href"));
    for (const href of hrefs) {
      counts.hrefOccurrences += 1;
      const finding = await assessHref({
        href,
        source,
        pageTargets,
        nonPageSurfaces,
        htmlCache,
        productionLiveOnly,
      });
      if (finding.kind === "excluded") {
        counts.exclusions += 1;
        recordExclusion(exclusions, finding, source.route);
        continue;
      }
      counts.sameOriginPageLinks += 1;
      if (finding.fragment !== null) counts.sameOriginFragmentLinks += 1;
      if (finding.kind === "failure") {
        failures.push({ sourcePage: source.route, href, ...finding.detail });
        continue;
      }
      counts.verifiedPageLinks += 1;
      if (finding.fragment !== null) counts.verifiedFragments += 1;
    }
  }

  counts.failures = failures.length;
  const exclusionRows = [...exclusions.values()]
    .map((entry) => ({ ...entry, sourcePages: [...entry.sourcePages].sort(compareStrings) }))
    .sort((left, right) => compareStrings(`${left.reason}\u0000${left.href}`, `${right.reason}\u0000${right.href}`));
  const exclusionsByReason = Object.fromEntries(
    [...new Set(exclusionRows.map(({ reason }) => reason))].sort(compareStrings).map((reason) => [
      reason,
      exclusionRows.filter((entry) => entry.reason === reason).reduce((sum, entry) => sum + entry.occurrences, 0),
    ]),
  );
  const failuresByReason = Object.fromEntries(
    [...new Set(failures.map(({ reason }) => reason))].sort(compareStrings).map((reason) => [
      reason,
      failures.filter((entry) => entry.reason === reason).length,
    ]),
  );

  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    status: failures.length === 0 ? "pass" : "fail",
    buildId: (await readFile(resolve(ROOT, ".next/BUILD_ID"), "utf8")).trim(),
    inputs: {
      routeCoverage: relative(ROOT, ROUTE_COVERAGE),
      nextHtmlRoot: ".next/server/app",
      publicReferenceRoot: "public/reference",
      publicOrigin: PUBLIC_ORIGIN,
    },
    boundaries: {
      sourcePages: "All 82 route-coverage entries. The gated design-review gallery is outside this census.",
      verified: "Rendered same-origin page targets, backing files, and non-empty URL fragments against id or legacy anchor name in the target HTML.",
      excluded: "External origins, protocol-relative destinations, non-HTTP schemes, declared API/llms surfaces, verified public or Next static files, and text fragments are counted without remote fetching.",
      productionLiveOnly: "The absolute Cookbook URL is excluded only on /docs/meet-store and /docs/quickstart. T4 documents it as outside the local inventory and intentionally retained as a live-site destination; its HTTP 200 status is pinned snapshot evidence from 2026-08-09, not current live verification.",
    },
    counts,
    exclusionsByReason,
    failuresByReason,
    exclusions: exclusionRows,
    failures,
  };
  await writeFile(REPORT, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ status: report.status, buildId: report.buildId, counts, exclusionsByReason, failuresByReason }, null, 2));
  if (failures.length > 0) process.exitCode = 1;
}

async function assessHref({ href, source, pageTargets, nonPageSurfaces, htmlCache, productionLiveOnly }) {
  if (typeof href !== "string") {
    return failure("invalid-href", { targetPath: null, fragment: null, detail: "href is not a string" });
  }
  if (href.startsWith("//")) return excluded("protocol-relative", href);

  let destination;
  try {
    destination = new URL(href, new URL(source.route, PUBLIC_ORIGIN));
  } catch (error) {
    return failure("invalid-href", { targetPath: null, fragment: null, detail: error.message });
  }

  if (!/^https?:$/.test(destination.protocol)) return excluded("non-http-scheme", href);
  if (destination.origin !== PUBLIC_ORIGIN) return excluded("external-origin", href);

  const productionContract = productionLiveOnly.get(href);
  if (productionContract?.sourcePages.has(source.route)) {
    return excluded("production-live-only", href, productionContract.evidence);
  }

  const targetPath = canonicalPagePath(destination.pathname, pageTargets);
  const rawFragment = destination.hash.slice(1);
  const fragment = rawFragment ? decodeFragment(rawFragment) : null;
  if (rawFragment && fragment === null) {
    return failure("invalid-fragment-encoding", { targetPath: destination.pathname, fragment: rawFragment });
  }
  if (fragment?.startsWith(":~:text=")) return excluded("text-fragment", href);

  if (nonPageSurfaces.has(destination.pathname)) {
    const backingFile = await nonPageBackingFile(destination.pathname);
    if (backingFile) await requireRegularFile(backingFile, `${source.route}: ${destination.pathname}`);
    return excluded(`declared-non-page:${nonPageSurfaces.get(destination.pathname)}`, href);
  }

  if (!targetPath) {
    const staticResult = await classifyStaticTarget(destination.pathname);
    if (staticResult === "verified-public-static") return excluded(staticResult, href);
    if (staticResult === "verified-next-static") return excluded(staticResult, href);
    const reason = looksLikeAsset(destination.pathname) ? "missing-static-asset" : "missing-page";
    return failure(reason, { targetPath: destination.pathname, fragment, detail: "no frozen local target" });
  }

  const targetFile = pageTargets.get(targetPath);
  await requireRegularFile(targetFile, `${source.route}: ${href}`);
  if (fragment !== null) {
    const target = await loadHtml(targetFile, htmlCache);
    if (!target.fragments.has(fragment)) {
      return failure("missing-fragment", {
        targetPath,
        targetFile: relative(ROOT, targetFile),
        fragment,
        detail: "target HTML has no matching id or anchor name",
      });
    }
  }
  return { kind: "verified", targetPath, fragment };
}

function builtHtmlPath(route) {
  return route === "/"
    ? resolve(ROOT, ".next/server/app/index.html")
    : resolve(ROOT, `.next/server/app${route}.html`);
}

function canonicalPagePath(pathname, pageTargets) {
  const candidates = [pathname];
  try {
    const decoded = decodeURI(pathname);
    if (!candidates.includes(decoded)) candidates.push(decoded);
  } catch {}
  for (const path of [...candidates]) {
    if (path.length > 1 && path.endsWith("/")) candidates.push(path.slice(0, -1));
    if (path.endsWith("/")) candidates.push(`${path}index.html`);
  }
  return candidates.find((candidate) => pageTargets.has(candidate)) ?? null;
}

function decodeFragment(fragment) {
  try {
    return decodeURIComponent(fragment);
  } catch {
    return null;
  }
}

async function classifyStaticTarget(pathname) {
  if (pathname.startsWith("/_next/")) {
    const file = resolve(ROOT, `.next/${pathname.slice("/_next/".length)}`);
    return await isRegularFileWithin(file, resolve(ROOT, ".next")) ? "verified-next-static" : null;
  }
  const file = resolve(ROOT, `public${pathname}`);
  return await isRegularFileWithin(file, resolve(ROOT, "public")) ? "verified-public-static" : null;
}

async function nonPageBackingFile(pathname) {
  if (pathname === "/llms.txt") return resolve(ROOT, "public/llms.txt");
  if (pathname.startsWith("/api/")) return resolve(ROOT, `.next/server/app${pathname}/route.js`);
  return null;
}

function looksLikeAsset(pathname) {
  return /\.[a-z0-9]{1,12}$/i.test(pathname) && !pathname.endsWith(".html");
}

async function loadProductionLiveOnlyContracts() {
  const snapshot = JSON.parse(await readFile(T4_SNAPSHOT, "utf8"));
  const pinnedHealth = snapshot.linkHealth?.find((entry) => entry.url === COOKBOOK_URL);
  if (snapshot.migrationDate !== "2026-08-09" || pinnedHealth?.status !== 200) {
    throw new Error("Cookbook production-live-only contract differs from the dated T4 snapshot");
  }
  return new Map([
    [
      COOKBOOK_URL,
      {
        sourcePages: COOKBOOK_SOURCE_ROUTES,
        evidence: {
          contract: "evidence/T4.md",
          pinnedHealthSnapshot: "evidence/T4-live-snapshot.json",
          snapshotDate: snapshot.migrationDate,
          pinnedStatus: pinnedHealth.status,
          currentLiveVerification: "not-performed",
          localTarget: "excluded-by-documented-contract",
        },
      },
    ],
  ]);
}

async function loadHtml(file, cache) {
  if (cache.has(file)) return cache.get(file);
  const html = await readFile(file, "utf8");
  const $ = cheerio.load(html);
  const fragments = new Set();
  $("[id]").each((_, node) => fragments.add($(node).attr("id")));
  $("a[name]").each((_, node) => fragments.add($(node).attr("name")));
  const loaded = { $, fragments };
  cache.set(file, loaded);
  return loaded;
}

async function collectRegularFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((left, right) => compareStrings(left.name, right.name))) {
    const child = resolve(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`${relative(ROOT, child)}: symlink is outside the frozen-output contract`);
    if (entry.isDirectory()) files.push(...(await collectRegularFiles(child)));
    else if (entry.isFile()) files.push(child);
  }
  return files;
}

async function requireRegularFile(file, label) {
  const stat = await lstat(file);
  if (stat.isSymbolicLink() || !stat.isFile()) throw new Error(`${label}: expected a regular non-symlink file at ${relative(ROOT, file)}`);
}

async function isRegularFileWithin(file, root) {
  if (file !== root && !file.startsWith(`${root}${sep}`)) return false;
  try {
    const stat = await lstat(file);
    return stat.isFile() && !stat.isSymbolicLink();
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

function failure(reason, detail) {
  return { kind: "failure", reason, fragment: detail.fragment, detail: { reason, ...detail } };
}

function excluded(reason, href, evidence) {
  return { kind: "excluded", reason, href, ...(evidence ? { evidence } : {}) };
}

function recordExclusion(exclusions, finding, sourcePage) {
  const key = `${finding.reason}\u0000${finding.href}`;
  const prior = exclusions.get(key) ?? {
    reason: finding.reason,
    href: finding.href,
    ...(finding.evidence ? { evidence: finding.evidence } : {}),
    occurrences: 0,
    sourcePages: new Set(),
  };
  prior.occurrences += 1;
  prior.sourcePages.add(sourcePage);
  exclusions.set(key, prior);
}

function assertUnique(values, label) {
  if (new Set(values).size !== values.length) throw new Error(`${label} contain duplicates`);
}

function sameValues(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function compareStrings(left, right) {
  return left.localeCompare(right, "en");
}

await main().catch(async (error) => {
  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    status: "error",
    error: error instanceof Error ? error.message : String(error),
    failures: [],
  };
  await writeFile(REPORT, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.error(report.error);
  process.exitCode = 2;
});
