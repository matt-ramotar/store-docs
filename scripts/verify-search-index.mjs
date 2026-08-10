import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { oramaStaticClient } from "fumadocs-core/search/client/orama-static";

import {
  normalizeSearchLabel,
  normalizeSearchResults,
  stripSearchMarkup,
} from "../lib/search-results.ts";

const artifactPath = resolve(import.meta.dirname, "../.next/server/app/api/search.body");
const generatedPagePath = resolve(import.meta.dirname, "../.next/server/app/docs/quickstart.html");
const [artifact, generatedPage] = await Promise.all([
  readFile(artifactPath),
  readFile(generatedPagePath, "utf8"),
]);
const originalFetch = globalThis.fetch;

globalThis.fetch = async (input) => {
  assert.equal(String(input), "/api/search");
  return new Response(artifact, {
    headers: { "content-type": "application/json" },
    status: 200,
  });
};

try {
  const client = oramaStaticClient({ from: "/api/search" });
  const rawResults = await client.search("fetcher");
  const normalizedResults = normalizeSearchResults(rawResults);
  const rawLabelDiagnostics = rawResults.flatMap((result) =>
    [result.content, ...(result.breadcrumbs ?? [])].map((rawLabel) => ({
      rawLabel,
      diagnostic: normalizeSearchLabel(rawLabel),
    })),
  );
  const hasStore6 = normalizedResults.some((result) => result.version === "store6");
  const hasStore5 = normalizedResults.some((result) => result.version === "store5");

  assert.equal(rawResults.length, 60, "the built fetcher query result count changed");
  assert.ok(normalizedResults.length > 0, "the built fetcher query must normalize results");
  assert.equal(
    new Set(normalizedResults.map((result) => result.url)).size,
    normalizedResults.length,
    "canonical result destinations must be unique",
  );
  assert.equal(
    new Set(normalizedResults.map((result) => result.id)).size,
    normalizedResults.length,
    "command item IDs must be unique",
  );

  for (const { diagnostic, rawLabel } of rawLabelDiagnostics) {
    assert.deepEqual(
      diagnostic.residualKinds,
      [],
      `raw search label retained markup: ${JSON.stringify(rawLabel)}`,
    );
    assert.equal(diagnostic.text, stripSearchMarkup(rawLabel));
    assert.doesNotMatch(
      diagnostic.text,
      /[\uD800-\uDFFF]/u,
      "opaque literal registry sentinel leaked",
    );
  }

  assert.equal(hasStore5, true, "fetcher must return at least one Store 5 result");
  assert.equal(hasStore6, true, "fetcher must return at least one Store 6 result");

  const searchTrigger = generatedPage.match(
    /<button\b(?=[^>]*aria-label="Search documentation")[^>]*>/u,
  )?.[0];
  assert.ok(searchTrigger, "the generated page must contain the search trigger");
  assert.match(searchTrigger, /aria-expanded="false"/u);
  assert.doesNotMatch(
    searchTrigger,
    /aria-controls/u,
    "the closed generated trigger must not reference an absent dialog",
  );

  const verification = {
    artifact: ".next/server/app/api/search.body",
    query: "fetcher",
    rawResults: rawResults.length,
    rawLabels: rawLabelDiagnostics.length,
    labelsWithConsumedMarkup: rawLabelDiagnostics.filter(
      ({ diagnostic }) => diagnostic.consumedKinds.length > 0,
    ).length,
    referenceDefinitionLabels: rawLabelDiagnostics.filter(({ diagnostic }) =>
      diagnostic.consumedKinds.includes("reference-definition"),
    ).length,
    residualMarkupLabels: rawLabelDiagnostics.filter(
      ({ diagnostic }) => diagnostic.residualKinds.length > 0,
    ).length,
    destinations: normalizedResults.length,
    store5: hasStore5,
    store6: hasStore6,
    markdownPlainText: true,
    closedTriggerHasControls: false,
  };
  process.stdout.write(
    `${JSON.stringify(verification)}\n`,
  );
} finally {
  globalThis.fetch = originalFetch;
}
