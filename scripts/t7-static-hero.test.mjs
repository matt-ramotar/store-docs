import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import { load } from "cheerio";

const ROOT = resolve(import.meta.dirname, "..");
const PUBLIC_FILES = [
  "app/page.tsx",
  "components/hero/HeroThesis.tsx",
  "components/hero/KeyEngineTrace.tsx",
];
const EXACT_DATA = "Data(origin=Origin.SOT, isStale=true, refreshing=true)";
const EXACT_ERROR = "Error(StoreError.Fetch, servedStale=true)";

function source(path) {
  return existsSync(resolve(ROOT, path)) ? readFileSync(resolve(ROOT, path), "utf8") : "";
}

function extractHexComment(css, variable) {
  const match = css.match(
    new RegExp(`--${variable}:\\s*[^;]+;\\s*/\\*\\s*(#[0-9A-F]{6})\\s*\\*/`, "i"),
  );
  assert.ok(match, `missing exact hex comment for --${variable}`);
  return match[1];
}

function luminance(hex) {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)
    .map((channel) => Number.parseInt(channel, 16) / 255)
    .map((channel) =>
      channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
    );
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(foreground, background) {
  const lighter = Math.max(luminance(foreground), luminance(background));
  const darker = Math.min(luminance(foreground), luminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

test("T7 owns the static root and both hero components", () => {
  for (const path of PUBLIC_FILES) {
    assert.equal(existsSync(resolve(ROOT, path)), true, path);
  }
});

test("the public source states the bounded invalidated-row contract", () => {
  const publicSource = PUBLIC_FILES.map(source).join("\n");
  const publicText = publicSource.replace(/\s+/g, " ");

  for (const exact of [
    "Offline is just another origin.",
    "Origin.SOT",
    EXACT_DATA,
    EXACT_ERROR,
    "Bookkeeper.recordFailure",
    "etag=null",
  ]) {
    assert.match(publicSource, new RegExp(exact.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), exact);
  }

  for (const qualification of [
    /durably invalidated persisted row/i,
    /default freshness validator/i,
    /Freshness\.CachedOrFetch/,
    /wall-clock age alone does not trigger this fetch/i,
    /custom FreshnessValidator (?:can|may) plan differently/i,
    /queued stale Data replay (?:is permitted|may occur)/i,
    /without an intervening Loading/i,
    /stream remains live/i,
    /recordFailure[^.]*completes before[^.]*public error/i,
    /resident fetch metadata[^.]*etag=null/i,
    /durable record may still retain its stored ETag/i,
    /after hydration populates memory[^.]*Origin\.MEMORY/i,
  ]) {
    assert.match(publicText, qualification);
  }
});

test("the hero stays static, semantic, and free of later-stage surfaces", () => {
  const publicSource = PUBLIC_FILES.map(source).join("\n");

  assert.equal((publicSource.match(/href=["']\/docs\/store6\/overview["']/g) ?? []).length, 1);
  assert.match(publicSource, /<svg\b/);
  assert.match(publicSource, /role=["']img["']/);
  assert.match(publicSource, /aria-labelledby=/);
  assert.match(publicSource, /<title id=/);
  assert.match(publicSource, /<desc id=/);
  assert.match(publicSource, /bg-store-code-surface/);
  assert.match(publicSource, /(?:fill|text)-store-origin-sot-on-dark/);
  assert.match(publicSource, /(?:fill|text)-store-origin-fetcher-on-dark/);

  for (const forbidden of [
    /["']use client["']/,
    /\bmotion\b/i,
    /\banimate(?:d|s|ing|ion)?\b/i,
    /\bscroll(?:ing|ed|s)?\b/i,
    /<Image\b/,
    /<img\b/,
    /onClick\s*=/,
    /onPress\s*=/,
    /HeroUIProvider/,
    /\bDivider\b/,
    /\bCard(?:\.|\b)/,
    /(?:default|primary|secondary|success|warning|danger)-\d+/,
    /SourceOfTruth/,
    /STORE-\d+/,
    /KeyEngine\.kt/,
    /hydrateFromSot/,
  ]) {
    assert.doesNotMatch(publicSource, forbidden);
  }
});

test("the bookkeeping trace visibly reaches the public error", () => {
  const diagram = source("components/hero/KeyEngineTrace.tsx");
  assert.match(diagram, /d="M590 390H647V428"/);
  assert.match(diagram, /d="m642 428 5 10 5-10Z"/);
});

test("the trace launches the refreshing fetch before presenting its Data result", () => {
  const diagram = source("components/hero/KeyEngineTrace.tsx");
  const fetch = diagram.indexOf('aria-label="Fetcher request with etag null"');
  const data = diagram.indexOf("aria-label={DATA_EMISSION}");
  assert.notEqual(fetch, -1);
  assert.notEqual(data, -1);
  assert.ok(fetch < data, "the fetch reservation must precede the refreshing Data node");
  assert.match(
    diagram.replace(/\s+/g, " "),
    /hydrates a durably invalidated persisted row, requests an unconditional fetch with etag null, emits stale refreshing data from Origin\.SOT/,
  );
});

test("the public error is neutral while the fetch request keeps its origin color", () => {
  const diagram = source("components/hero/KeyEngineTrace.tsx");
  const errorStart = diagram.indexOf('<g aria-label={ERROR_EMISSION}');
  const fetchStart = diagram.indexOf('aria-label="Fetcher request with etag null"');
  assert.notEqual(errorStart, -1);
  assert.notEqual(fetchStart, -1);
  const errorGroup = diagram.slice(errorStart, diagram.indexOf("</g>", errorStart));
  const fetchGroup = diagram.slice(fetchStart, diagram.indexOf("</g>", fetchStart));

  assert.doesNotMatch(errorGroup, /store-origin-/);
  assert.match(errorGroup, /stroke-store-code-foreground/);
  assert.equal((errorGroup.match(/fill-store-code-foreground/g) ?? []).length, 3);
  assert.match(fetchGroup, /stroke-store-origin-fetcher-on-dark/);
  assert.match(fetchGroup, /fill-store-origin-fetcher-on-dark/);
});

test("the trace has a labelled keyboard-focusable horizontal overflow region", () => {
  const diagram = source("components/hero/KeyEngineTrace.tsx");

  assert.match(diagram, /aria-label="KeyEngine trace"/);
  assert.match(diagram, /role="region"/);
  assert.match(diagram, /tabIndex={0}/);
  assert.match(diagram, /overflow-x-auto/);
  assert.match(diagram, /focus-visible:outline-store-code-foreground/);
  assert.match(diagram, /<svg[\s\S]*?className="[^"]*min-w-\[42rem\][^"]*"/);
});

test("the wide trace is contained by a shrinkable figure and overflow region", () => {
  const diagram = source("components/hero/KeyEngineTrace.tsx");
  const figureClass = diagram.match(/<figure className="([^"]+)"/)?.[1];
  const regionClass = diagram.match(
    /<div\s+aria-label="KeyEngine trace"\s+className="([^"]+)"/,
  )?.[1];

  assert.ok(figureClass);
  assert.ok(regionClass);
  assert.match(figureClass, /(?:^|\s)min-w-0(?:\s|$)/);
  for (const token of ["min-w-0", "w-full", "max-w-full", "overflow-x-auto"]) {
    assert.match(regionClass, new RegExp(`(?:^|\\s)${token}(?:\\s|$)`), token);
  }
});

test("the trace releases its minimum width at the xl desktop breakpoint", () => {
  const diagram = source("components/hero/KeyEngineTrace.tsx");
  const svgClass = diagram.match(/<svg[\s\S]*?className="([^"]+)"/)?.[1];

  assert.ok(svgClass);
  for (const token of ["min-w-[42rem]", "w-full", "xl:min-w-0"]) {
    const escapedToken = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    assert.match(svgClass, new RegExp(`(?:^|\\s)${escapedToken}(?:\\s|$)`), token);
  }
  assert.doesNotMatch(svgClass, /(?:^|\s)lg:min-w-0(?:\s|$)/);
});

test("the labelled SVG description contains both exact public results", () => {
  const diagram = source("components/hero/KeyEngineTrace.tsx");
  const description = diagram.match(
    /<desc id="key-engine-trace-description">([\s\S]*?)<\/desc>/,
  )?.[1];

  assert.ok(description);
  assert.match(description, /{DATA_EMISSION}/);
  assert.match(description, /{ERROR_EMISSION}/);
});

test("the internal docs CTA has no external-link affordance", () => {
  const thesis = source("components/hero/HeroThesis.tsx");
  assert.doesNotMatch(thesis, /<Link\.Icon\b/);
});

test("every Store code-surface text token clears 4.5:1", () => {
  const css = source("app/globals.css");
  const background = extractHexComment(css, "color-store-code-surface");
  const foregroundTokens = [
    "color-store-code-foreground",
    "color-store-origin-memory-on-dark",
    "color-store-origin-sot-on-dark",
    "color-store-origin-fetcher-on-dark",
    "color-store-origin-overlay-on-dark",
  ];

  for (const token of foregroundTokens) {
    const foreground = extractHexComment(css, token);
    assert.ok(
      contrastRatio(foreground, background) >= 4.5,
      `${token} must clear 4.5:1 on the Store code surface`,
    );
  }
});

test("the generated root preserves native semantics and the traced labels", () => {
  const artifact = resolve(ROOT, ".next/server/app/index.html");
  assert.equal(existsSync(artifact), true, artifact);
  const $ = load(readFileSync(artifact, "utf8"));
  const main = $("main");
  const figure = main.find("figure");
  const diagram = main.find('svg[role="img"]');
  const traceRegion = main.find(
    'div[role="region"][aria-label="KeyEngine trace"][tabindex="0"]',
  );
  const docsLink = main.find('a[href="/docs/store6/overview"]');

  assert.equal(main.length, 1);
  assert.equal(main.find("h1").text().trim(), "Offline is just another origin.");
  assert.equal(docsLink.length, 1);
  assert.equal(main.find("a").length, 1);
  assert.equal(docsLink.find("svg").length, 0);
  assert.match(figure.attr("class") ?? "", /(?:^|\s)min-w-0(?:\s|$)/);
  assert.equal(traceRegion.length, 1);
  for (const token of ["min-w-0", "w-full", "max-w-full", "overflow-x-auto"]) {
    assert.match(
      traceRegion.attr("class") ?? "",
      new RegExp(`(?:^|\\s)${token}(?:\\s|$)`),
      token,
    );
  }
  assert.match(
    traceRegion.attr("class") ?? "",
    /(?:^|\s)focus-visible:outline-store-code-foreground(?:\s|$)/,
  );
  assert.equal(traceRegion.children('svg[role="img"]').length, 1);
  assert.equal(diagram.length, 1);
  assert.match(diagram.attr("class") ?? "", /(?:^|\s)min-w-\[42rem\](?:\s|$)/);
  assert.match(diagram.attr("class") ?? "", /(?:^|\s)xl:min-w-0(?:\s|$)/);
  assert.doesNotMatch(diagram.attr("class") ?? "", /(?:^|\s)lg:min-w-0(?:\s|$)/);
  assert.equal(diagram.find("title").length, 1);
  assert.equal(diagram.find("desc").length, 1);
  const labelledBy = diagram.attr("aria-labelledby")?.split(/\s+/) ?? [];
  assert.equal(labelledBy.length, 2);
  for (const id of labelledBy) assert.equal(diagram.find(`[id="${id}"]`).length, 1, id);
  const labelledDescriptions = labelledBy
    .map((id) => diagram.find(`[id="${id}"]`))
    .filter((element) => element.is("desc"));
  assert.equal(labelledDescriptions.length, 1);
  const descriptionText = labelledDescriptions[0].text().replace(/\s+/g, " ").trim();
  assert.ok(descriptionText.includes(EXACT_DATA));
  assert.ok(descriptionText.includes(EXACT_ERROR));
  const dataNode = diagram.find(`[aria-label="${EXACT_DATA}"]`);
  const errorNode = diagram.find(`[aria-label="${EXACT_ERROR}"]`);
  const fetchNode = diagram.find('[aria-label="Fetcher request with etag null"]');
  assert.equal(dataNode.length, 1);
  assert.equal(errorNode.length, 1);
  assert.equal(fetchNode.length, 1);
  assert.equal(errorNode.find("[class*='store-origin-']").length, 0);
  assert.ok(errorNode.find("[class*='store-code-foreground']").length >= 4);
  assert.ok(fetchNode.find("[class*='store-origin-fetcher-on-dark']").length >= 3);
  assert.equal(main.find("img, picture, video, canvas").length, 0);
  assert.equal(main.find("[data-motion], [data-animate]").length, 0);
  assert.equal(main.find("[class*='card']").length, 0);
});
