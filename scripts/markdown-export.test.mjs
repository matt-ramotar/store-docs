import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import test from "node:test";
import { load } from "cheerio";
import { fromMarkdown } from "mdast-util-from-markdown";
import { gfmFromMarkdown } from "mdast-util-gfm";
import { gfm } from "micromark-extension-gfm";

import { htmlToMarkdown } from "../lib/html-to-markdown.mjs";
import { assertExportableSource, exportAgentPages } from "./export-agent-pages.mjs";

const ROOT = resolve(import.meta.dirname, "..");
const normalize = (value) => value.replace(/\s+/g, " ").trim();
const tree = (markdown) => fromMarkdown(markdown, { extensions: [gfm()], mdastExtensions: [gfmFromMarkdown()] });
function nodes(node, type) { return [...(node.type === type ? [node] : []), ...(node.children ?? []).flatMap((child) => nodes(child, type))]; }
function text(node) { return node.value ?? (node.children ?? []).map(text).join(""); }
function files(directory, suffix) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? files(path, suffix) : path.endsWith(suffix) ? [path] : [];
  }).sort();
}

test("Markdown retains hidden examples, raw source, callout severity, tables and semantic navigation", () => {
  const code = 'val value = "a|b"\n\n    println(```)\n';
  const $ = load(`<article><header><nav>Breadcrumb chrome</nav><h1 id="page-title">A contract</h1><p>Keep every qualification.</p><aside>On this page chrome</aside></header><div id="content">
    <nav aria-label="Start here"><a href="/docs/start#first">Start here</a><p>A useful introduction.</p></nav>
    <div role="tablist"><button>Visible</button><button>Hidden</button></div>
    <section data-tab-panel aria-hidden="true"><p data-tab-panel-label><strong>Inactive example</strong></p><pre data-language="kotlin"><code>Corrupted highlighting</code></pre></section>
    <aside data-callout-type="danger"><span data-callout-label>Danger</span><div data-component-part="callout-title">Data loss</div><div data-component-part="callout-content"><p>Never discard <code>pending</code> writes.</p></div></aside>
    <table><thead><tr><th>Policy</th><th>Effect</th></tr></thead><tbody><tr><td><code>A|B</code></td><td>Keep the first value.<br>Then refresh.</td></tr></tbody></table>
    <dl><dt>Required</dt><dd>Optional</dd><dt>Type</dt><dd><code>String</code></dd></dl>
    <div class="flex"><code>store6-mutations</code><span>Experimental</span></div>
    <ol data-step-group><li data-step-item data-step-label="A"><div data-step-title><span aria-hidden="true">A.</span><strong>First branch</strong></div><div data-step-body><h3 data-component-part="step-title">First branch</h3><p>Keep this branch.</p></div></li></ol>
    <figure data-diagram="flow"><svg><title>Write flow</title><desc>Journal before acknowledgement.</desc><text>Geometry chrome</text></svg><figcaption>Journal before acknowledgement. <a href="/diagrams/flow.html">Open full size</a></figcaption></figure>
  </div><footer>Previous and next chrome</footer></article><script>Secret script chrome</script>`);
  $("pre").attr("data-raw-code", code);
  const markdown = htmlToMarkdown($.html(), { pathname: "/docs/contract" });
  const ast = tree(markdown);
  assert.deepEqual(nodes(ast, "code").map(({ lang, value }) => ({ lang, value })), [{ lang: "kotlin", value: code.slice(0, -1) }]);
  assert.match(markdown, /Inactive example/);
  assert.match(markdown, /> \*\*Danger: Data loss\*\*/);
  assert.match(markdown, /Never discard `pending` writes\./);
  assert.match(markdown, /\[Start here\]\(\/docs\/start#first\)/);
  assert.match(markdown, /A useful introduction\./);
  assert.match(markdown, /\*\*Required\*\*[\s\S]*Optional[\s\S]*\*\*Type\*\*[\s\S]*`String`/);
  assert.match(markdown, /`store6-mutations` Experimental/);
  assert.match(markdown, /\*\*A\. First branch\*\*/);
  assert.equal(markdown.match(/First branch/g)?.length, 1);
  assert.deepEqual(nodes(ast, "table").map((table) => table.children.map((row) => row.children.map(text))), [[
    ["Policy", "Effect"], ["A|B", "Keep the first value.<br>Then refresh."],
  ]]);
  assert.match(markdown, /Write flow/);
  assert.equal(markdown.match(/Journal before acknowledgement\./g)?.length, 1);
  assert.match(markdown, /\[Open full size\]\(\/diagrams\/flow\.html\)/);
  assert.match(markdown, /id="page-title"/);
  assert.doesNotMatch(markdown, /chrome|Corrupted highlighting|<svg|<script|<button/i);
});

test("unsupported table structures and incomplete documents fail instead of silently losing content", () => {
  assert.throws(() => htmlToMarkdown("<main><p>No heading</p></main>"), /one H1/);
  assert.throws(() => htmlToMarkdown('<main><h1>Table</h1><table><tr><td colspan="2">Merged cells</td></tr></table></main>'), /spanning table cells/);
});

test("nested documentation titles survive without agent action chrome", () => {
  const markdown = htmlToMarkdown(`<article><header>
    <nav>Breadcrumb chrome</nav>
    <div><h1 id="page-title">Nested page title</h1>
      <div><button>Copy Prompt</button><div role="group" aria-label="Markdown actions"><button>Copy Markdown</button><a href="/llms/store6/example.md">View as Markdown</a></div><span role="status">Copied chrome</span><p>Action error chrome</p></div>
    </div><p>The page description.</p><aside>Table of contents chrome</aside>
    </header><div id="content"><h2>First section</h2><p>Keep authored content.</p></div></article>`, { pathname: "/docs/store6/example" });
  assert.match(markdown, /# Nested page title/);
  assert.match(markdown, /The page description\./);
  assert.match(markdown, /## First section/);
  assert.match(markdown, /Keep authored content\./);
  assert.doesNotMatch(markdown, /chrome|Copy Prompt|Copy Markdown|View as Markdown|llms\/store6/);
});

test("future interactive MDX fails publication while code samples remain literal", () => {
  assert.throws(() => assertExportableSource("# Examples\n\n<CodeGroup>\n\nHidden code\n\n</CodeGroup>", "example.mdx"), /CodeGroup requires a complete semantic/);
  assert.throws(() => assertExportableSource("# Files\n\n<Tree.Folder name=\"Hidden\" />", "example.mdx"), /Tree.Folder requires/);
  assert.throws(() => assertExportableSource("# Future\n\n<NewInteractiveWidget />", "example.mdx"), /NewInteractiveWidget requires/);
  assert.doesNotThrow(() => assertExportableSource("# Examples\n\n```mdx\n<CodeGroup>Example</CodeGroup>\n```\n\nUse `<CodeGroup>` in a code sample.", "example.mdx"));
});

test("a failed export preserves the previous corpus; a successful export removes stale pages", async () => {
  const root = await mkdtemp(join(tmpdir(), "store-agent-export-"));
  try {
    async function put(path, value) { await mkdir(dirname(join(root, path)), { recursive: true }); await writeFile(join(root, path), value); }
    await put("content/docs/index.mdx", "# Documentation\n\nAn introduction.");
    await put("public/agent-markdown/stale.md", "Previous successful corpus.");
    await assert.rejects(exportAgentPages({ root }), /prerendered HTML is required/);
    assert.equal(await readFile(join(root, "public/agent-markdown/stale.md"), "utf8"), "Previous successful corpus.");
    for (const path of ["index", "docs", "diagrams"]) await put(`.next/server/app/${path}.html`, `<main><h1>${path}</h1><p>Published ${path} content.</p></main>`);
    const result = await exportAgentPages({ root });
    assert.equal(result.pages, 3);
    assert.deepEqual(files(join(root, "public/agent-markdown"), ".md").map((path) => relative(join(root, "public/agent-markdown"), path)), ["diagrams.md", "docs.md", "index.md"]);
    assert.match(await readFile(join(root, "public/agent-markdown/docs.md"), "utf8"), /Published docs content\./);
  } finally { await rm(root, { recursive: true, force: true }); }
});

async function authoritativeFixture(t) {
  const root = await mkdtemp(join(tmpdir(), "store-agent-owned-export-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  async function put(path, value) { await mkdir(dirname(join(root, path)), { recursive: true }); await writeFile(join(root, path), value); }
  const bytes = Buffer.from("# Source-owned page\r\n\r\nKeep café and exact line endings.\r\n");
  const origin = "https://store-docs.example";
  const page = { canonicalUrl: `${origin}/docs/store6/example`, markdownUrl: `${origin}/llms/store6/example.md`, sha256: createHash("sha256").update(bytes).digest("hex") };
  const manifest = { origin, pages: [page] };
  await put("content/docs/store6/example.mdx", "# Example\n\n<OwnerOnlyWidget />");
  await put("public/llms/store6-manifest.json", JSON.stringify(manifest));
  await put("public/llms/store6/example.md", bytes);
  await put("public/agent-markdown/stale.md", "Previous successful corpus.");
  for (const stem of ["index", "diagrams", "docs/store6/example"]) {
    await put(`.next/server/app/${stem}.html`, `<main><h1>${stem}</h1><p>HTML text differs from source-owned bytes.</p></main>`);
  }
  return { root, bytes, manifest, put };
}

test("source-owned Markdown supplies exact negotiated bytes instead of a second HTML conversion", async (t) => {
  const { root, bytes } = await authoritativeFixture(t);
  const result = await exportAgentPages({ root });
  assert.equal(result.pages, 3);
  assert.deepEqual(await readFile(join(root, "public/agent-markdown/docs/store6/example.md")), bytes);
  assert.deepEqual(await readFile(join(root, "public/llms/store6/example.md")), bytes);
  assert.match(await readFile(join(root, "public/agent-markdown/index.md"), "utf8"), /HTML text differs/);
  assert.equal(existsSync(join(root, "public/agent-markdown/stale.md")), false);
});

for (const [label, change, expected] of [
  ["missing Markdown", async ({ root }) => rm(join(root, "public/llms/store6/example.md")), /source-owned Markdown is missing/],
  ["hash mismatch", async ({ put }) => put("public/llms/store6/example.md", "Changed source-owned output."), /hash does not match/],
  ["unsafe public path", async ({ manifest }) => { manifest.pages[0].markdownUrl = `${manifest.origin}/llms/store6/%2e%2e%2fprivate.md`; }, /unsafe page mapping/],
  ["foreign origin", async ({ manifest }) => { manifest.pages[0].markdownUrl = "https://other.example/llms/store6/example.md"; }, /unsafe page mapping/],
  ["duplicate canonical page", async ({ manifest }) => { manifest.pages.push({ ...manifest.pages[0] }); }, /Duplicate agent documentation page/],
]) {
  test(`source-owned ${label} fails without replacing the previous corpus`, async (t) => {
    const fixture = await authoritativeFixture(t);
    await change(fixture);
    await fixture.put("public/llms/store6-manifest.json", JSON.stringify(fixture.manifest));
    await assert.rejects(exportAgentPages({ root: fixture.root }), expected);
    assert.equal(await readFile(join(fixture.root, "public/agent-markdown/stale.md"), "utf8"), "Previous successful corpus.");
  });
}

test("built corpus covers every docs route with source-owned byte parity and complete HTML exports", () => {
  assert.ok(existsSync(join(ROOT, ".next/server/app/index.html")), "Run pnpm build before verifying the published Markdown corpus.");
  assert.ok(existsSync(join(ROOT, "public/agent-markdown/index.md")), "Run the agent exporter after next build.");
  const sourceDirectory = join(ROOT, "content/docs");
  const expected = ["index.md", "diagrams.md", ...files(sourceDirectory, ".mdx").map((path) => {
    const segments = relative(sourceDirectory, path).replace(/\.mdx$/, "").split("/");
    if (segments.at(-1) === "index") segments.pop();
    return `${["docs", ...segments].join("/")}.md`;
  })].sort();
  assert.deepEqual(files(join(ROOT, "public/agent-markdown"), ".md").map((path) => relative(join(ROOT, "public/agent-markdown"), path)), expected);
  const manifest = JSON.parse(readFileSync(join(ROOT, "public/llms/store6-manifest.json"), "utf8"));
  const authoritative = new Map(manifest.pages.map((page) => [`${new URL(page.canonicalUrl).pathname.slice(1)}.md`, page]));
  for (const file of authoritative.keys()) assert.ok(expected.includes(file), `${file}: source-owned page must be negotiated`);
  let tabPanels = 0;
  for (const file of expected) {
    const owned = authoritative.get(file);
    if (owned) {
      const bytes = readFileSync(join(ROOT, "public/agent-markdown", file));
      assert.deepEqual(bytes, readFileSync(join(ROOT, "public", new URL(owned.markdownUrl).pathname.slice(1))), `${file}: preserve source-owned Markdown bytes`);
      assert.equal(createHash("sha256").update(bytes).digest("hex"), owned.sha256, `${file}: source-owned manifest hash`);
      // agent-docs semantic tests own MDX fidelity for these canonical pages.
      continue;
    }
    const $ = load(readFileSync(join(ROOT, ".next/server/app", file.replace(/\.md$/, ".html")), "utf8"));
    const content = $("article #content").length ? $("article #content") : $("main").first();
    const markdown = readFileSync(join(ROOT, "public/agent-markdown", file), "utf8");
    const ast = tree(markdown);
    const code = nodes(ast, "code").map(({ value }) => value);
    const publishedCode = content.find("pre").map((_, element) => $(element).attr("data-raw-code") ?? $(element).find("code").text()).get();
    assert.deepEqual(code, publishedCode.map((value) => value.replace(/\n$/, "")), `${file}: exact code text, including inactive examples`);
    content.find("[data-tab-panel]").each((_, element) => {
      tabPanels++;
      assert.ok(markdown.includes(normalize($(element).find("[data-tab-panel-label]").text())), `${file}: inactive tab label`);
    });
    const markdownTables = nodes(ast, "table");
    const htmlTables = content.find("table").toArray();
    assert.equal(markdownTables.length, htmlTables.length, `${file}: table count`);
    for (let index = 0; index < htmlTables.length; index++) {
      const original = $(htmlTables[index]).find("tr").toArray().map((row) => $(row).children("th, td").toArray().map((cell) => normalize($(cell).text())));
      const exported = markdownTables[index].children.map((row) => row.children.map((cell) => normalize(text(cell).replace(/<br\s*\/?\s*>/gi, " "))));
      assert.deepEqual(exported, original, `${file}: table cells`);
    }
    content.find("figure[data-diagram]").each((_, element) => {
      for (const tag of ["title", "desc"]) assert.ok(markdown.includes(normalize($(element).find(`svg ${tag}`).first().text())), `${file}: diagram ${tag}`);
    });
  }
  assert.equal(tabPanels, 11, "The Store 5 quickstart exports all 11 authored code panels.");
  const fetchers = readFileSync(join(ROOT, "public/agent-markdown/docs/concepts/store5/fetcher.md"), "utf8");
  assert.match(fetchers, /\*\*A\. /);
  assert.match(fetchers, /\*\*B\. /);
});
