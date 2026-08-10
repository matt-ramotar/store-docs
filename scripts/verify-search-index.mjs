import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { oramaStaticClient } from "fumadocs-core/search/client/orama-static";

const artifactPath = resolve(import.meta.dirname, "../.next/server/app/api/search.body");
const artifact = await readFile(artifactPath);
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
  const results = await client.search("fetcher");
  const hasStore6 = results.some(
    (result) => result.url === "/docs/store6" || result.url.startsWith("/docs/store6/"),
  );
  const hasStore5 = results.some(
    (result) =>
      (result.url === "/docs" || result.url.startsWith("/docs/")) &&
      result.url !== "/docs/store6" &&
      !result.url.startsWith("/docs/store6/"),
  );

  assert.equal(hasStore5, true, "fetcher must return at least one Store 5 result");
  assert.equal(hasStore6, true, "fetcher must return at least one Store 6 result");
  process.stdout.write(
    `${JSON.stringify({ artifact: ".next/server/app/api/search.body", query: "fetcher", results: results.length, store5: hasStore5, store6: hasStore6 })}\n`,
  );
} finally {
  globalThis.fetch = originalFetch;
}
