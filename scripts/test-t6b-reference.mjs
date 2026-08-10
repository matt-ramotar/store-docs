import assert from "node:assert/strict";
import { lstat, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { load } from "cheerio";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const referenceRoot = path.join(repoRoot, "public", "reference");
const pages = [
  {
    file: path.join(referenceRoot, "store6-core", "index.html"),
    moduleName: "Store 6 Core",
    task: ":store6-core:dokkaHtml",
    output: "store6-core/build/dokka/html/",
    destination: "public/reference/store6-core/",
    currentHref: "/reference/store6-core/index.html",
  },
  {
    file: path.join(referenceRoot, "store6-mutations", "index.html"),
    moduleName: "Store 6 Mutations",
    task: ":store6-mutations:dokkaHtml",
    output: "store6-mutations/build/dokka/html/",
    destination: "public/reference/store6-mutations/",
    currentHref: "/reference/store6-mutations/index.html",
  },
];

const expectedFiles = pages.map(({ file }) => path.relative(referenceRoot, file)).sort();
const foundFiles = [];

async function isDirectory(target) {
  try {
    return (await lstat(target)).isDirectory();
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

async function walk(directory, relative = "") {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const entryRelative = path.join(relative, entry.name);
    const entryPath = path.join(directory, entry.name);
    const metadata = await lstat(entryPath);

    assert.equal(metadata.isSymbolicLink(), false, `${entryRelative} must not be a symlink`);
    if (metadata.isDirectory()) {
      await walk(entryPath, entryRelative);
    } else {
      assert.equal(metadata.isFile(), true, `${entryRelative} must be a regular file`);
      foundFiles.push(entryRelative);
    }
  }
}

assert.equal(await isDirectory(referenceRoot), true, "public/reference must exist");
await walk(referenceRoot);
assert.deepEqual(foundFiles.sort(), expectedFiles, "reference output must contain exactly two module pages");

const requiredModuleHrefs = pages.map(({ currentHref }) => currentHref).sort();

for (const page of pages) {
  const metadata = await lstat(page.file);
  assert.equal(metadata.isFile(), true, `${page.file} must be a regular file`);
  assert.equal(metadata.isSymbolicLink(), false, `${page.file} must not be a symlink`);

  const html = await readFile(page.file, "utf8");
  const $ = load(html);
  const bodyText = $("body").text().replace(/\s+/g, " ").trim();

  assert.match(html, /^<!doctype html>/i, `${page.moduleName} must be standalone HTML`);
  assert.equal($("html").attr("lang"), "en");
  assert.equal($("meta[charset]").length, 1);
  assert.equal($("meta[name='viewport']").length, 1);
  assert.match($("title").text(), new RegExp(page.moduleName));
  assert.equal($("main#main-content").length, 1);
  assert.equal($("h1").length, 1);
  assert.match($("h1").text(), new RegExp(page.moduleName));
  assert.equal($("nav[aria-label]").length >= 1, true);
  assert.equal($("a[href='#main-content']").length, 1);
  assert.equal($("script").length, 0, "placeholder pages must not execute scripts");

  assert.match(bodyText, /This page is not generated API documentation\./);
  assert.match(bodyText, /Generated API documentation is currently unavailable\./);
  assert.match(bodyText, /Android SDK location/);
  assert.match(bodyText, new RegExp(page.task.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(bodyText, new RegExp(page.output.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(bodyText, new RegExp(page.destination.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));

  const hrefs = $("a[href]")
    .map((_index, element) => $(element).attr("href"))
    .get();
  const moduleHrefs = hrefs.filter((href) => href.startsWith("/reference/")).sort();
  assert.deepEqual(moduleHrefs, requiredModuleHrefs);
  assert.equal(hrefs.includes("/docs/store6/overview"), true);
  assert.equal(hrefs.includes("/docs"), true);
  assert.equal($("a[aria-current='page']").attr("href"), page.currentHref);

  for (const href of hrefs) {
    assert.equal(/^\/(?:docs(?:\/|$)|reference\/store6-(?:core|mutations)\/index\.html$)|^#main-content$/.test(href), true, `unsafe or unexpected href: ${href}`);
  }

  assert.equal(/STORE-\d+|T6[ab]?|Linear/i.test(html), false, `${page.moduleName} must not expose tracker context`);
  assert.equal(/data-unresolved-link/i.test(html), false);
  assert.equal(/\bon(?:click|load|error|focus|mouseover)\s*=/i.test(html), false);
}

const navSource = await readFile(path.join(repoRoot, "lib", "nav.ts"), "utf8");
assert.match(navSource, /href:\s*"\/reference\/store6-core\/index\.html",\s*label:\s*"Reference"/);

for (const forbiddenPath of [
  path.join(repoRoot, "public", "reference", "index.html"),
  path.join(repoRoot, "app", "reference"),
  path.join(repoRoot, "app", "reference-note"),
]) {
  await assert.rejects(lstat(forbiddenPath), { code: "ENOENT" });
}

const nextConfig = await readFile(path.join(repoRoot, "next.config.mjs"), "utf8");
assert.equal(/redirects\s*\(/.test(nextConfig), false, "reference integration must not add a redirect");

console.log(JSON.stringify({ referenceFiles: foundFiles.length, pagesChecked: pages.length }));
