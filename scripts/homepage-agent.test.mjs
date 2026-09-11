import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import { load } from "cheerio";

import { HOMEPAGE_GUIDANCE, HOMEPAGE_INTRO, HOMEPAGE_TITLE } from "../lib/homepage-content.ts";

const ROOT = resolve(import.meta.dirname, "..");

test("raw homepage HTML provides meaningful prose without JavaScript or example code", () => {
  const $ = load(readFileSync(resolve(ROOT, ".next/server/app/index.html"), "utf8"));
  const main = $("main").clone();
  main.find("script, style, template, noscript, pre, code, [hidden], [aria-hidden='true'], .sr-only").remove();
  const text = main.text().replace(/\s+/g, " ").trim();

  assert.ok(text.length >= 500, `expected at least 500 visible prose characters, received ${text.length}`);
  assert.ok(text.includes(HOMEPAGE_INTRO));
  assert.ok(text.includes(HOMEPAGE_GUIDANCE));
  assert.equal(main.find("h1").length, 1);
  assert.equal(main.find("h1").text(), HOMEPAGE_TITLE);

  let previousLevel = 0;
  for (const heading of main.find("h1, h2, h3, h4, h5, h6")) {
    const level = Number(heading.tagName.slice(1));
    assert.ok(level <= previousLevel + 1, `heading sequence skips from h${previousLevel} to h${level}`);
    previousLevel = level;
  }
});
