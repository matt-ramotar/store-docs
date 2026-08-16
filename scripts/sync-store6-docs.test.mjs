import assert from "node:assert/strict";
import test from "node:test";

import { applyLockedPublicationTransforms } from "./sync-store6-docs.mjs";

const exactText = (...parts) => parts.join("");

test("quickstart publication transform publishes the mutations block as a Warning callout", () => {
  const experimentalPrefix = [
    "> **Experimental.** `store6-mutations` is a separate artifact and every public symbol is",
    "> `@ExperimentalStoreApi`. It ships **with** 6.0.0-alpha01 — nothing here is published yet.",
    ">",
  ].join("\n");
  const legacySpelling = [
    `> **The spelling below is the ${exactText("rati", "fied")} surface.** The mutations API review ran and ${exactText("ru", "led")} the`,
    `> factory signature, presence algebra, and drain spelling (twenty ${exactText("rul", "ings")}, 2026-08-01). The`,
    "> module is still experimental — shapes can change in any release — but the snippet below now",
    `> matches the ${exactText("land", "ed")} artifact.`,
  ].join("\n");
  const currentSpelling = [
    "> **The spelling below is the current API surface.** The module is still experimental — shapes",
    "> can change in any release — but the snippet below matches the implementation.",
  ].join("\n");
  const callout = [
    '<Callout type="Warning">',
    "",
    "**Experimental.** `store6-mutations` is a separate artifact and every public symbol is",
    "`@ExperimentalStoreApi`. It ships **with** 6.0.0-alpha01 — nothing here is published yet.",
    "",
    "**The spelling below is the current API surface.** The module is still experimental — shapes",
    "can change in any release — but the snippet below matches the implementation.",
    "",
    "</Callout>",
  ].join("\n");
  const wrap = (block) => ["before", block, "after"].join("\n");
  const published = wrap(callout);

  assert.equal(
    applyLockedPublicationTransforms(wrap(`${experimentalPrefix}\n${legacySpelling}`), "docs/store6/quickstart.md"),
    published,
  );
  assert.equal(
    applyLockedPublicationTransforms(wrap(`${experimentalPrefix}\n${currentSpelling}`), "docs/store6/quickstart.md"),
    published,
  );
  assert.equal(applyLockedPublicationTransforms(published, "docs/store6/quickstart.md"), published);
  assert.throws(
    () => applyLockedPublicationTransforms("before\n> an unreviewed third shape\nafter", "docs/store6/quickstart.md"),
    /docs\/store6\/quickstart\.md: publication transform boundary drift/,
  );
});

test("quickstart publication transform drops the in-page status quote", () => {
  const statusQuote = [
    "> Store 6 is in development and **nothing is published yet**. This page is the shape of the API as",
    "> it stands on `main`; the install coordinates land with 6.0.0-alpha01.",
  ].join("\n");
  const experimental = [
    "> **Experimental.** `store6-mutations` is a separate artifact and every public symbol is",
    "> `@ExperimentalStoreApi`. It ships **with** 6.0.0-alpha01 — nothing here is published yet.",
    ">",
    "> **The spelling below is the current API surface.** The module is still experimental — shapes",
    "> can change in any release — but the snippet below matches the implementation.",
  ].join("\n");
  const input = ["# Quickstart", "", statusQuote, "", "intro", "", experimental, ""].join("\n");
  const output = applyLockedPublicationTransforms(input, "docs/store6/quickstart.md");

  assert.doesNotMatch(output, /nothing is published yet\. This page is the shape of the API/);
  assert.match(output, /<Callout type="Warning">/);
  assert.match(output, /^# Quickstart\n\nintro\n/m);
});

test("important-defaults publication transform wraps the zero-config quote as an Info callout", () => {
  const quote = [
    "> **Zero configuration and explicit expert configuration are byte-identical in behavior.** Setting",
    "> the defaults by hand changes nothing observable: both sides produce the same trace and the same",
    "> fetch count (`zeroConfig_and_expertConfig_observeIdenticalDefaults`). One honest limit on that",
    "> guarantee: the equivalence is asserted over persistence, bookkeeper, freshness validator, and idle",
    "> cap. It does not cover telemetry or overlay, which are unset on both sides.",
  ].join("\n");
  const callout = [
    '<Callout type="Info">',
    "",
    "**Zero configuration and explicit expert configuration are byte-identical in behavior.** Setting",
    "the defaults by hand changes nothing observable: both sides produce the same trace and the same",
    "fetch count (`zeroConfig_and_expertConfig_observeIdenticalDefaults`). One honest limit on that",
    "guarantee: the equivalence is asserted over persistence, bookkeeper, freshness validator, and idle",
    "cap. It does not cover telemetry or overlay, which are unset on both sides.",
    "",
    "</Callout>",
  ].join("\n");
  const wrap = (block) => ["# Important defaults", "", "intro", "", block, "", "## Freshness", ""].join("\n");

  assert.equal(
    applyLockedPublicationTransforms(wrap(quote), "docs/store6/important-defaults.md"),
    wrap(callout),
  );
  assert.equal(
    applyLockedPublicationTransforms(wrap(callout), "docs/store6/important-defaults.md"),
    wrap(callout),
  );
  assert.throws(
    () => applyLockedPublicationTransforms("# Important defaults\n\n> unreviewed\n", "docs/store6/important-defaults.md"),
    /docs\/store6\/important-defaults\.md: publication transform boundary drift/,
  );
});

test("stability crash-window transform accepts only the legacy or current safe block", () => {
  const legacy = [
    `This is the same conservative crash-window stance already ${exactText("rati", "fied")} for reads: prefer doing work`,
    "twice over losing it.",
  ].join("\n");
  const safe = [
    "This is the same conservative crash-window stance used for reads: prefer doing work twice over",
    "losing it.",
  ].join("\n");

  const legacyOutput = applyLockedPublicationTransforms(stabilityFixture(legacy), "STABILITY.md");
  const safeOutput = applyLockedPublicationTransforms(stabilityFixture(safe), "STABILITY.md");
  assert.equal(legacyOutput, safeOutput);
  assert.match(safeOutput, /crash-window stance used for reads/);
  assert.doesNotMatch(safeOutput, new RegExp(exactText("already ", "rati", "fied")));
  assert.throws(
    () => applyLockedPublicationTransforms(stabilityFixture("an unreviewed third shape\nlosing it."), "STABILITY.md"),
    /STABILITY\.md: publication transform boundary drift/,
  );
});

function stabilityFixture(crashWindowBlock) {
  const lines = Array.from({ length: 210 }, (_, index) => `line ${index + 1}`);
  lines.splice(161, 2, ...crashWindowBlock.split("\n"));
  return lines.join("\n");
}
