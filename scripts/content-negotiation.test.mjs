import assert from "node:assert/strict";
import test from "node:test";
import { negotiateContent, markdownNotFound } from "../lib/content-negotiation.ts";

const cases = [
  [null, "html"], ["", "html"], ["*/*", "html"], ["text/*", "html"],
  ["text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8", "html"],
  ["text/markdown", "markdown"], ["TEXT/MARKDOWN; CHARSET=\"UTF-8\"", "markdown"],
  ["text/markdown;q=0.9,text/html;q=0.5", "markdown"],
  ["text/markdown;q=0.2,text/html;q=0.9", "html"],
  ["text/markdown;q=0, text/html", "html"],
  ["text/html;q=0, text/*;q=1", "markdown"],
  ["text/markdown;q=0,*/*;q=1", "html"],
  ["text/markdown,*/*", "markdown"],
  ["text/markdown,text/html", "markdown"],
  ["text/html,text/markdown", "html"],
  ["application/json", null], ["*/*;q=0", null],
  ["text/html;q=0,text/markdown;q=0,*/*;q=1", null],
  ["text/markdown;variant=unknown", null],
  ["text/markdown;charset=iso-8859-1", null],
  ["text/markdown;charset=utf-8;q=0,text/markdown;q=1", null],
  ["text/markdown;charset=utf-8;q=0.2,text/markdown;q=0.8,text/html;q=0.5", "html"],
  ["text/markdown;q=invalid", null], ["text/markdown;q=1.1", null],
  ["text/markdown;q=0.1234", null], ["text/markdown;q=0.123", "markdown"],
];

for (const [accept, expected] of cases) {
  test(`Accept ${JSON.stringify(accept)} selects ${expected}`, () => {
    assert.equal(negotiateContent(accept), expected);
  });
}

test("missing pages return a real Markdown 404 with actionable discovery links", async () => {
  const response = markdownNotFound();
  assert.equal(response.status, 404);
  assert.equal(response.headers.get("content-type"), "text/markdown; charset=utf-8");
  assert.match(response.headers.get("vary"), /Accept/);
  assert.equal(response.headers.get("cache-control"), "no-store");
  const body = await response.text();
  for (const path of ["/docs", "/docs/store6", "/llms.txt", "/sitemap.xml", "/openapi.json"]) assert.ok(body.includes(`](${path})`));
  assert.equal(await markdownNotFound("HEAD").text(), "");
});
