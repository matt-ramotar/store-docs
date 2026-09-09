import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import { load } from "cheerio";

const ROOT = resolve(import.meta.dirname, "..");
const HERO_FILES = [
  "app/page.tsx",
  "components/hero/HeroThesis.tsx",
  "components/hero/KeyEngineTrace.tsx",
];
const READ_CONTRACT = "content/docs/store6/concepts/read-contract.mdx";
const EXACT_DATA = "Data(origin=Origin.SOT, isStale=true, refreshing=true)";
const EXACT_ERROR = "Error(StoreError.Fetch, servedStale=true)";

function source(path) {
  return existsSync(resolve(ROOT, path)) ? readFileSync(resolve(ROOT, path), "utf8") : "";
}

function staticHtml(pathname) {
  const path = resolve(ROOT, `.next/server/app${pathname}.html`);
  assert.equal(existsSync(path), true, path);
  return readFileSync(path, "utf8");
}

function assertFailureTrace(text) {
  for (const exact of ["Origin.SOT", EXACT_DATA, EXACT_ERROR, "Bookkeeper.recordFailure", "etag=null"]) {
    assert.match(text, new RegExp(exact.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), exact);
  }
  for (const qualification of [
    /first cold subscription after restart/i,
    /durably invalidated persisted row/i,
    /default freshness validator/i,
    /Freshness\.CachedOrFetch/,
    /wall-clock age alone does not trigger this fetch/i,
    /custom FreshnessValidator (?:can|may) plan differently/i,
    /queued stale Data replay (?:is permitted|may occur)/i,
    /without an intervening Loading/i,
    /stream remains live/i,
    /recordFailure[^.]*completes before[^.]*public error/i,
    /resident state[^.]*etag=null/i,
    /durable record may still retain its stored ETag/i,
    /after hydration populates memory[^.]*Origin\.MEMORY/i,
  ]) {
    assert.match(text, qualification);
  }
}

function extractHex(css, variable) {
  const match = css.match(new RegExp(`--${variable}:\\s*(#[0-9A-F]{6})`, "i"));
  assert.ok(match, `missing exact hex value for --${variable}`);
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

test("T7 owns the static root, hero components, and relocated read-contract trace", () => {
  for (const path of [...HERO_FILES, READ_CONTRACT]) {
    assert.equal(existsSync(resolve(ROOT, path)), true, path);
  }
});

test("the hero leads with purpose, the first action, and the source-backed example", () => {
  const thesis = source("components/hero/HeroThesis.tsx");
  const copy = source("lib/homepage-content.ts");
  const example = source("components/hero/KeyEngineTrace.tsx");
  const hero = HERO_FILES.map(source).join("\n");

  assert.match(copy, /One read contract for every copy of your data\./);
  assert.match(copy, /Store coordinates network, persistence, and memory/);
  assert.ok(thesis.indexOf('href="/docs/store6/quickstart"') < thesis.indexOf('href="/docs/store6/overview"'));
  assert.match(thesis, />\s*Build your first store\s*<\/Link>/);
  assert.match(thesis, /href="\/docs\/store6\/concepts\/read-contract#failure-trace-invalidated-persisted-data"/);
  assert.match(example, /Illustrative shape/);
  assert.match(example, /verbatim from the executable Quickstart module/);
  assert.match(example, /store<UserKey, User>/);
  assert.match(example, /fetcher \{ key -> FakeApi\.getUser\(key\.id\) \}/);
  assert.match(example, /users\.stream\(UserKey\("1"\)\)/);
  assert.match(example, /users\.get\(UserKey\("2"\)\)/);
  assert.match(example, /<figure\b/);
  assert.match(example, /<pre[\s\S]*aria-label="Fetcher-only Store example"/);

  for (const forbidden of [
    /\bmotion\b/i,
    /\banimate(?:d|s|ing|ion)?\b/i,
    /<Image\b/,
    /<img\b/,
    /onClick\s*=/,
    /onPress\s*=/,
    /HeroUIProvider/,
    /SourceOfTruth/,
    /STORE-\d+/,
    /KeyEngine\.kt/,
    /hydrateFromSot/,
  ]) {
    assert.doesNotMatch(hero, forbidden);
  }
});

test("the detailed failure trace and every qualification live in the read contract", () => {
  const readContract = source(READ_CONTRACT).replace(/[`*_]/g, "").replace(/\s+/g, " ");
  assertFailureTrace(readContract);
  assert.doesNotMatch(HERO_FILES.map(source).join("\n"), new RegExp(EXACT_ERROR.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});

test("every Store code-surface text token clears 4.5:1", () => {
  const css = source("app/globals.css");
  const background = extractHex(css, "color-store-code-surface");
  for (const token of [
    "color-store-code-foreground",
    "color-store-code-keyword",
    "color-store-code-string",
    "color-store-code-function",
    "color-store-code-type",
    "color-store-code-comment",
  ]) {
    assert.ok(contrastRatio(extractHex(css, token), background) >= 4.5, token);
  }
});

test("the built root preserves the purpose-first action and example semantics", () => {
  const $ = load(staticHtml("/index"));
  const main = $("main");
  assert.equal(main.length, 1);
  assert.equal(main.find("h1").text().trim(), "One read contract for every copy of your data.");
  const links = main.find("a");
  assert.equal(links.first().attr("href"), "/docs/store6/quickstart");
  assert.equal(links.first().text().trim(), "Build your first store");
  assert.equal(main.find('a[href="/docs/store6/overview"]').length, 1);
  assert.equal(
    main.find('a[href="/docs/store6/concepts/read-contract#failure-trace-invalidated-persisted-data"]').length,
    1,
  );
  assert.equal(main.find('pre[aria-label="Fetcher-only Store example"][tabindex="0"]').length, 1);
  assert.equal(main.find("figure figcaption").length, 1);
  assert.equal(main.find("img, picture, video, canvas").length, 0);
});

test("the built read-contract page preserves the relocated semantic trace", () => {
  const $ = load(staticHtml("/docs/store6/concepts/read-contract"));
  const heading = $("h2").filter((_, element) =>
    $(element).text().includes("Failure trace: invalidated persisted data"),
  );
  assert.equal(heading.length, 1);
  assert.equal(heading.attr("id"), "failure-trace-invalidated-persisted-data");
  assertFailureTrace($.root().text().replace(/\s+/g, " "));
});

test("the built hero highlights Kotlin without changing the example text", () => {
  const $ = load(staticHtml("/index"));
  const code = $('pre[aria-label="Fetcher-only Store example"] > code');
  assert.equal(code.text(), `val users = store<UserKey, User> {
    fetcher { key -> FakeApi.getUser(key.id) }
}

users.stream(UserKey("1")).collect { result -> render(result) }
val user = users.get(UserKey("2"))`);

  const highlighted = (token) => code
    .find(`span[style*="var(--color-store-code-${token})"]`)
    .map((_, element) => $(element).text())
    .get()
    .join("");
  assert.match(highlighted("keyword"), /val/);
  assert.match(highlighted("string"), /"1"/);
  assert.match(highlighted("string"), /"2"/);
});
