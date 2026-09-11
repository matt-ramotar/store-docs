import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const ROOT = resolve(import.meta.dirname, "..");
const read = (path) => readFileSync(resolve(ROOT, path), "utf8");

async function api() {
  assert.ok(existsSync(resolve(ROOT, "lib/api-problem.ts")), "API problem responses must exist");
  return import("../lib/api-problem.ts");
}

test("unknown API paths return RFC 9457 JSON with recovery links", async () => {
  const { apiNotFound } = await api();
  for (const method of ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]) {
    const response = apiNotFound(new Request("https://store.mattramotar.dev/api/missing?token=private", { method }));
    assert.equal(response.status, 404);
    assert.equal(response.headers.get("content-type"), "application/problem+json");
    assert.equal(response.headers.get("cache-control"), "no-store");
    const body = await response.json();
    assert.deepEqual(body, {
      type: "about:blank",
      title: "Not Found",
      status: 404,
      detail: "This API endpoint does not exist.",
      instance: "/api/missing",
      code: "API_NOT_FOUND",
      resolution: "Read /openapi.json for the available API, or use /llms.txt and /docs to find documentation.",
    });
    assert.doesNotMatch(JSON.stringify(body), /private|token/);
  }
});

test("HEAD on an unknown API path preserves error status and headers without a body", async () => {
  const { apiNotFound } = await api();
  const response = apiNotFound(new Request("https://store.mattramotar.dev/api", { method: "HEAD" }));
  assert.equal(response.status, 404);
  assert.equal(response.headers.get("content-type"), "application/problem+json");
  assert.equal(await response.text(), "");
});

test("unsupported API search methods return 405 with an accurate Allow header", async () => {
  const { apiMethodNotAllowed } = await api();
  for (const method of ["POST", "PUT", "PATCH", "DELETE"]) {
    const response = apiMethodNotAllowed(new Request("https://store.mattramotar.dev/api/search", { method }));
    assert.equal(response.status, 405);
    assert.equal(response.headers.get("allow"), "GET, HEAD, OPTIONS");
    assert.equal(response.headers.get("content-type"), "application/problem+json");
    const body = await response.json();
    assert.equal(body.code, "METHOD_NOT_ALLOWED");
    assert.equal(body.title, "Method Not Allowed");
    assert.equal(body.status, response.status);
    assert.equal(body.instance, "/api/search");
    assert.match(body.resolution, /GET.*\/api\/search.*\/openapi\.json/);
  }
});

test("OPTIONS on the search API returns 204 and the supported methods without a body", async () => {
  const { apiOptions } = await api();
  assert.equal(typeof apiOptions, "function", "The static search endpoint needs an explicit OPTIONS response");
  const response = apiOptions();
  assert.equal(response.status, 204);
  assert.equal(response.headers.get("allow"), "GET, HEAD, OPTIONS");
  assert.equal(response.headers.get("content-type"), null);
  assert.equal(await response.text(), "");
});

test("search success returns the original static index response untouched", async () => {
  const { withSearchApiErrors } = await api();
  const original = Response.json({ type: "advanced", docs: { count: 1 } }, {
    headers: { "x-index-version": "unchanged" },
  });
  let calls = 0;
  const get = withSearchApiErrors(async () => { calls += 1; return original; });
  assert.equal(await get(), original);
  assert.equal(calls, 1);
  assert.equal(original.headers.get("x-index-version"), "unchanged");
  assert.deepEqual(await original.json(), { type: "advanced", docs: { count: 1 } });
});

test("search generation failures return a structured 500 without implementation details", async () => {
  const { withSearchApiErrors } = await api();
  for (const handler of [
    () => { throw new Error("private filesystem path and token"); },
    async () => { throw new Error("private database credentials"); },
  ]) {
    const response = await withSearchApiErrors(handler)();
    assert.equal(response.status, 500);
    assert.equal(response.headers.get("content-type"), "application/problem+json");
    assert.equal(response.headers.get("cache-control"), "no-store");
    const body = await response.json();
    assert.equal(body.type, "about:blank");
    assert.equal(body.title, "Internal Server Error");
    assert.equal(body.status, response.status);
    assert.equal(body.code, "SEARCH_INDEX_UNAVAILABLE");
    assert.equal(body.instance, "/api/search");
    assert.match(body.resolution, /Retry.*\/llms\.txt.*\/docs/);
    assert.doesNotMatch(JSON.stringify(body), /private|credentials|token|stack/);
  }
});

test("search index generation failures fail the production build", async () => {
  const { withSearchApiErrors } = await api();
  const previousPhase = process.env.NEXT_PHASE;
  const failure = new Error("The static search index could not be generated");
  process.env.NEXT_PHASE = "phase-production-build";
  try {
    await assert.rejects(withSearchApiErrors(async () => { throw failure; }), (error) => error === failure);
  } finally {
    if (previousPhase === undefined) delete process.env.NEXT_PHASE;
    else process.env.NEXT_PHASE = previousPhase;
  }
});

test("API routes preserve static search generation and route every unknown API method to JSON", () => {
  const search = read("app/api/search/route.ts");
  assert.match(search, /export const dynamic = ["']force-static["']/);
  assert.match(search, /export const GET = withSearchApiErrors\(searchIndex\.staticGET\)/);
  assert.doesNotMatch(search, /export (?:const|function|async function) (?:POST|PUT|PATCH|DELETE|OPTIONS)\b/);
  assert.ok(existsSync(resolve(ROOT, "app/api/[[...path]]/route.ts")), "catch-all must include /api itself");
  const fallback = read("app/api/[[...path]]/route.ts");
  for (const method of ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]) {
    assert.match(fallback, new RegExp(`export const ${method} = apiNotFound`));
  }
});

test("OpenAPI 3.1 describes the existing static search API and problem responses", () => {
  assert.ok(existsSync(resolve(ROOT, "public/openapi.json")), "OpenAPI document must be published");
  const spec = JSON.parse(read("public/openapi.json"));
  assert.equal(spec.openapi, "3.1.1");
  assert.equal(typeof spec.info.title, "string");
  assert.equal(typeof spec.info.version, "string");
  assert.deepEqual(spec.servers, [{ url: "https://store.mattramotar.dev" }]);
  assert.deepEqual(spec.security, []);
  assert.deepEqual(Object.keys(spec.paths), ["/api/search"]);
  const search = spec.paths["/api/search"];
  assert.deepEqual(Object.keys(search), ["get", "head", "options"]);
  assert.match(search.get.description, /complete.*index/i);
  assert.match(search.get.description, /query parameters.*ignored/i);
  assert.equal(search.get.parameters, undefined);
  assert.ok(search.get.responses["200"].content["application/json"]);
  assert.equal(search.head.responses["200"].content, undefined);
  assert.equal(search.options.responses["204"].content, undefined);
  assert.ok(search.options.responses["204"].headers.Allow);
  for (const status of ["404", "405", "500"]) {
    const response = spec.components.responses[`Error${status}`];
    assert.ok(response.description);
    assert.equal(response.content["application/problem+json"].schema.$ref, "#/components/schemas/Problem");
    assert.equal(response.content["application/problem+json"].example.status, Number(status));
  }
  const schema = spec.components.schemas.SearchIndex;
  assert.equal(schema.type, "object");
  assert.equal(schema.properties.type.const, "advanced");
  assert.equal(schema.additionalProperties, true);
  for (const name of ["type", "title", "status", "detail", "instance", "code", "resolution"]) {
    assert.ok(spec.components.schemas.Problem.required.includes(name));
  }
  function checkRefs(value) {
    if (!value || typeof value !== "object") return;
    if (value.$ref) {
      assert.ok(value.$ref.startsWith("#/"), "OpenAPI references must resolve within the published file");
      assert.ok(value.$ref.slice(2).split("/").reduce((node, key) => node?.[key], spec), value.$ref);
    }
    for (const child of Object.values(value)) checkRefs(child);
  }
  checkRefs(spec);
});
