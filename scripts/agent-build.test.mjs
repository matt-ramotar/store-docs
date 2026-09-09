import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { withContentVary } from "./finalize-agent-headers.mjs";

const root = resolve(import.meta.dirname, "..");
const json = (path) => JSON.parse(readFileSync(resolve(root, path), "utf8"));

test("cache variation merges case-insensitively and retains unrelated prerender metadata", () => {
  const metadata = { headers: { Vary: "accept, Next-Url", "x-custom": "keep" }, segmentPaths: ["/_tree"], status: 200 };
  const result = withContentVary(metadata);
  assert.equal(result.headers["x-custom"], "keep");
  assert.deepEqual(result.segmentPaths, ["/_tree"]);
  assert.equal(result.status, 200);
  assert.equal(result.headers.Vary, undefined);
  const vary = result.headers.vary.toLowerCase().split(/,\s*/);
  for (const key of ["accept", "accept-encoding", "rsc", "next-url"]) assert.ok(vary.includes(key));
  assert.equal(vary.filter((key) => key === "accept").length, 1);
  assert.deepEqual(withContentVary(result), result);
  assert.equal(metadata.headers.Vary, "accept, Next-Url");
  assert.equal(withContentVary({ headers: { vary: "*" } }).headers.vary, "*");
});

test("every negotiated page is prerendered with cache-safe HTML headers and a Markdown variant", () => {
  const routes = json("lib/agent-routes.generated.json");
  const prerender = json(".next/prerender-manifest.json");
  for (const pathname of routes.markdown) {
    assert.ok(prerender.routes[pathname], `${pathname}: must be prerendered`);
    const stem = pathname === "/" ? "index" : pathname.slice(1);
    const meta = json(`.next/server/app/${stem}.meta`);
    const vary = meta.headers.vary.toLowerCase().split(/,\s*/);
    for (const key of ["accept", "accept-encoding", "rsc"]) assert.ok(vary.includes(key), `${pathname}: ${key}`);
    assert.match(readFileSync(resolve(root, `public/agent-markdown/${stem}.md`), "utf8"), /^# /m);
  }
  const publicPages = Object.keys(prerender.routes).filter((path) => path === "/" || (path.startsWith("/docs") && !path.endsWith(".xml")));
  for (const path of publicPages) assert.ok(routes.markdown.includes(path), `${path}: missing negotiated variant`);
  assert.equal(json(".next/server/app/api/search.body").type, "advanced");
});
