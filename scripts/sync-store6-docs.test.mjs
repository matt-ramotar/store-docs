import assert from "node:assert/strict";
import test from "node:test";

import { applyLockedPublicationTransforms } from "./sync-store6-docs.mjs";

test("quickstart publication transform accepts only the legacy or current safe block", () => {
  const legacy = [
    "before",
    "> **The spelling below is the ratified surface.** The mutations API review ran and ruled the",
    "> factory signature, presence algebra, and drain spelling (twenty rulings, 2026-08-01). The",
    "> module is still experimental — shapes can change in any release — but the snippet below now",
    "> matches the landed artifact.",
    "after",
  ].join("\n");
  const safe = [
    "before",
    "> **The spelling below is the current API surface.** The module is still experimental — shapes",
    "> can change in any release — but the snippet below matches the implementation.",
    "after",
  ].join("\n");

  assert.equal(applyLockedPublicationTransforms(legacy, "docs/store6/quickstart.md"), safe);
  assert.equal(applyLockedPublicationTransforms(safe, "docs/store6/quickstart.md"), safe);
  assert.throws(
    () => applyLockedPublicationTransforms("before\n> an unreviewed third shape\nafter", "docs/store6/quickstart.md"),
    /docs\/store6\/quickstart\.md: publication transform boundary drift/,
  );
});

test("stability crash-window transform accepts only the legacy or current safe block", () => {
  const legacy = [
    "This is the same conservative crash-window stance already ratified for reads: prefer doing work",
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
  assert.doesNotMatch(safeOutput, /already ratified/);
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
