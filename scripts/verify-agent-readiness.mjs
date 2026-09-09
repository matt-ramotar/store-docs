import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { load } from "cheerio";

const root = resolve(import.meta.dirname, "..");
const origin = process.argv[2] ?? "http://127.0.0.1:3222";
const routes = JSON.parse(await readFile(resolve(root, "lib/agent-routes.generated.json"), "utf8"));
let requests = 0;
async function get(path, options = {}) {
  requests++;
  return fetch(new URL(path, origin), { redirect: "manual", signal: AbortSignal.timeout(30000), ...options });
}
function vary(response) {
  const names = new Set(response.headers.get("vary")?.toLowerCase().split(/,\s*/) ?? []);
  for (const name of ["accept", "accept-encoding", "rsc"]) assert.ok(names.has(name), `${response.url}: missing Vary ${name}`);
}
async function batch(items, fn) {
  for (let i = 0; i < items.length; i += 8) await Promise.all(items.slice(i, i + 8).map(fn));
}

await batch(routes.pages, async (path) => {
  const response = await get(path, { headers: { Accept: "text/html" } });
  assert.equal(response.status, 200, path);
  assert.match(response.headers.get("content-type"), /text\/html/, path);
  const body = await response.text();
  if (path === "/") {
    const $ = load(body);
    $("script,style,template,pre,code,svg,[hidden],[aria-hidden=true]").remove();
    assert.ok($("main").text().replace(/\s+/g, " ").trim().length >= 500);
    assert.equal($("main h1").length, 1);
    let previous = 0;
    $("main").find("h1,h2,h3,h4,h5,h6").each((_, node) => {
      const level = Number(node.tagName.slice(1));
      assert.ok(level <= previous + 1, "Homepage headings must not skip levels");
      previous = level;
    });
  }
  if (routes.markdown.includes(path)) vary(response);
});

await batch(routes.markdown, async (path) => {
  const response = await get(path, { headers: { Accept: "text/markdown" } });
  assert.equal(response.status, 200, path);
  assert.match(response.headers.get("content-type"), /^text\/markdown(?:;|$)/, path);
  vary(response);
  const body = await response.text();
  const file = resolve(root, "public/agent-markdown", `${path === "/" ? "index" : path.slice(1)}.md`);
  assert.equal(body, await readFile(file, "utf8"), `${path}: served Markdown must match the generated page`);
  const direct = await get(`/agent-markdown/${path === "/" ? "index" : path.slice(1)}.md`);
  assert.equal(direct.status, 200, path);
  assert.match(direct.headers.get("content-type"), /^text\/markdown/);
  assert.equal(await direct.text(), body, `${path}: direct Markdown file`);
  assert.match(body, /^# /m, path);
  assert.doesNotMatch(body, /<script\b|<style\b|self\.__next_f/, path);
  const head = await get(path, { method: "HEAD", headers: { Accept: "text/markdown" } });
  assert.equal(head.status, 200, path);
  assert.match(head.headers.get("content-type"), /^text\/markdown/, path);
  vary(head);
  assert.equal(await head.text(), "");
});

await batch(routes.publicFiles, async (path) => {
  const response = await get(path);
  assert.equal(response.status, 200, path);
  const body = await response.text();
  if (path.endsWith(".json")) JSON.parse(body);
  if (path === "/llms.txt") {
    assert.match(body, /^# Store 6/);
    const links = [...body.matchAll(/\]\(([^)\s]+)\)/g)]
      .map((match) => new URL(match[1], origin).pathname);
    assert.ok(links.length > 0);
    for (const link of links) assert.ok(routes.pages.includes(link) || routes.publicFiles.includes(link), `llms.txt links to missing ${link}`);
  }
  if (path === "/sitemap.xml") {
    assert.match(response.headers.get("content-type"), /xml/);
    const $ = load(body, { xml: true });
    assert.equal($("urlset").attr("xmlns"), "http://www.sitemaps.org/schemas/sitemap/0.9");
    assert.deepEqual($("loc").toArray().map((node) => $(node).text()), routes.markdown.map((page) => `https://store.mattramotar.dev${page}`));
  }
  if (path === "/robots.txt") assert.match(body, /Sitemap: https:\/\/store\.mattramotar\.dev\/sitemap\.xml/);
  if (path === "/openapi.json") {
    assert.match(response.headers.get("content-type"), /application\/json/);
    assert.equal(JSON.parse(body).openapi, "3.1.1");
  }
});

for (const [accept, status, type] of [
  ["*/*", 200, "text/html"],
  ["text/markdown;q=0.9,text/html;q=0.5", 200, "text/markdown"],
  ["text/markdown;q=0.1,text/html;q=0.9", 200, "text/html"],
  ["text/markdown,text/html", 200, "text/markdown"],
  ["text/html,text/markdown", 200, "text/html"],
  ["text/markdown;q=0,*/*;q=1", 200, "text/html"],
  ["text/html;q=0,text/*;q=1", 200, "text/markdown"],
  ["application/json", 406, "text/plain"],
  ["text/markdown;charset=utf-8;q=0,text/markdown;q=1", 406, "text/plain"],
  ["text/markdown;charset=utf-8;q=0.2,text/markdown;q=0.8,text/html;q=0.5", 200, "text/html"],
  ["text/html;q=0,text/markdown;q=0,*/*;q=1", 406, "text/plain"],
]) {
  const response = await get("/", { headers: { Accept: accept } });
  assert.equal(response.status, status, accept);
  assert.ok(response.headers.get("content-type").startsWith(type), accept);
  vary(response);
  await response.arrayBuffer();
}

for (const path of ["/does-not-exist-agent-check", "/docs/does-not-exist-agent-check", "/docs/store6/does-not-exist-agent-check"]) {
  for (const accept of ["*/*", "text/markdown", "text/html", "TEXT/HTML"]) {
    const response = await get(path, { headers: { Accept: accept } });
    assert.equal(response.status, 404, `${path} ${accept}`);
    const body = await response.text();
    for (const link of ["/docs", "/llms.txt", "/sitemap.xml", "/openapi.json"]) assert.ok(body.includes(link), `${path}: ${link}`);
    assert.match(response.headers.get("content-type"), accept.toLowerCase() === "text/html" ? /^text\/html/ : /^text\/markdown/);
  }
  const head = await get(path, { method: "HEAD", headers: { Accept: "text/markdown" } });
  assert.equal(head.status, 404);
  assert.equal(await head.text(), "");
}

const search = await get("/api/search");
assert.equal(search.status, 200);
assert.equal(await search.text(), await readFile(resolve(root, ".next/server/app/api/search.body"), "utf8"));
const query = await get("/api/search?query=store&tag=store6");
assert.equal(await query.text(), await readFile(resolve(root, ".next/server/app/api/search.body"), "utf8"));
for (const method of ["GET", "HEAD", "OPTIONS", "POST", "PUT", "PATCH", "DELETE"]) {
  const missing = await get("/api/does-not-exist-agent-check", { method });
  assert.equal(missing.status, 404, method);
  assert.match(missing.headers.get("content-type"), /application\/problem\+json/);
  if (method === "HEAD") assert.equal(await missing.text(), "");
  else {
    const problem = await missing.json();
    assert.equal(problem.code, "API_NOT_FOUND");
    assert.equal(problem.status, 404);
    assert.ok(problem.resolution.includes("/openapi.json"));
  }
  const response = await get("/api/search", { method });
  assert.equal(response.status, method === "OPTIONS" ? 204 : ["GET", "HEAD"].includes(method) ? 200 : 405, method);
  if (!["GET", "HEAD"].includes(method)) assert.deepEqual(response.headers.get("allow").split(/,\s*/).sort(), ["GET", "HEAD", "OPTIONS"]);
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    assert.match(response.headers.get("content-type"), /application\/problem\+json/);
    assert.equal((await response.json()).code, "METHOD_NOT_ALLOWED");
  } else if (method !== "GET") assert.equal(await response.text(), "");
  else await response.arrayBuffer();
}
const apiRoot = await get("/api");
assert.equal(apiRoot.status, 404);
assert.equal((await apiRoot.json()).code, "API_NOT_FOUND");

const missingMarkdown = await get("/agent-markdown/does-not-exist-agent-check.md");
assert.equal(missingMarkdown.status, 404);
assert.match(missingMarkdown.headers.get("content-type"), /^text\/markdown/);
assert.ok((await missingMarkdown.text()).includes("/llms.txt"));

// Next redirects an arbitrary RSC cache key to the key derived from its headers.
await batch(routes.markdown, async (path) => {
  const flight = await get(`${path}?_rsc=agent-readiness`, { redirect: "follow", headers: { RSC: "1", Accept: "*/*" } });
  assert.equal(flight.status, 200, `${path}: RSC navigation`);
  assert.equal(new URL(flight.url).pathname, path);
  assert.match(flight.headers.get("content-type"), /^text\/x-component/, path);
  await flight.arrayBuffer();
});
const missingFlight = await get("/docs/does-not-exist-agent-check?_rsc=agent-readiness", { redirect: "follow", headers: { RSC: "1", Accept: "*/*" } });
assert.equal(missingFlight.status, 404);
assert.match(missingFlight.headers.get("content-type"), /^text\/x-component/);
await missingFlight.arrayBuffer();

console.log(`Agent readiness HTTP checks passed: ${routes.pages.length} HTML pages, ${routes.markdown.length} Markdown pages (GET + HEAD), ${routes.publicFiles.length} public files, negotiation, 404s, API methods, and RSC navigation; ${requests} requests.`);
