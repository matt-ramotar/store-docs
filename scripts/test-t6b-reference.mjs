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

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function ruleValue(css, selector, property, fallback) {
  const rule = css.match(new RegExp(`(?:^|})\\s*${escapeRegExp(selector)}\\s*\\{([^}]*)}`, "m"));
  if (!rule) {
    if (fallback !== undefined) return fallback;
    assert.fail(`missing CSS rule: ${selector}`);
  }

  const declaration = rule[1].match(
    new RegExp(`(?:^|;)\\s*${escapeRegExp(property)}\\s*:\\s*([^;]+)`, "m"),
  );
  if (!declaration) {
    if (fallback !== undefined) return fallback;
    assert.fail(`missing ${property} declaration in ${selector}`);
  }

  return declaration[1].trim();
}

function resolveColor(value, variables) {
  const variable = value.match(/^var\((--[a-z0-9-]+)\)$/i)?.[1];
  const resolved = variable ? variables.get(variable) : value;
  assert.match(resolved ?? "", /^#[0-9a-f]{6}$/i, `unsupported CSS color: ${value}`);
  return resolved;
}

function relativeLuminance(color) {
  const channels = color
    .slice(1)
    .match(/.{2}/g)
    .map((channel) => Number.parseInt(channel, 16) / 255)
    .map((channel) =>
      channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
    );

  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(foreground, background) {
  const lighter = Math.max(relativeLuminance(foreground), relativeLuminance(background));
  const darker = Math.min(relativeLuminance(foreground), relativeLuminance(background));
  return (lighter + 0.05) / (darker + 0.05);
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
  const css = $("style").text();

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

  const variables = new Map(
    [...css.matchAll(/(--[a-z0-9-]+)\s*:\s*(#[0-9a-f]{6})\s*;/gi)].map(
      ([, name, value]) => [name, value],
    ),
  );
  const colors = {
    brand: resolveColor(ruleValue(css, ".brand", "color"), variables),
    current: resolveColor(ruleValue(css, '[aria-current="page"]', "color"), variables),
    hover: resolveColor(ruleValue(css, "a:hover", "color"), variables),
    link: resolveColor(ruleValue(css, "a", "color"), variables),
    paper: resolveColor("var(--paper)", variables),
    skip: resolveColor(ruleValue(css, ".skip-link", "color"), variables),
    skipBackground: resolveColor(ruleValue(css, ".skip-link", "background"), variables),
    surface: resolveColor("var(--surface)", variables),
  };
  const skipHover = resolveColor(ruleValue(css, ".skip-link:hover", "color", colors.hover), variables);
  const skipFocus = resolveColor(
    ruleValue(css, ".skip-link:focus-visible", "color", colors.skip),
    variables,
  );
  const contrastCases = [
    ["header link default", colors.link, colors.surface],
    ["header link hover", colors.hover, colors.surface],
    ["header link focus", colors.link, colors.surface],
    ["header brand default", colors.brand, colors.surface],
    ["header brand hover", colors.hover, colors.surface],
    ["header brand focus", colors.brand, colors.surface],
    ["main link default", colors.link, colors.paper],
    ["main link hover", colors.hover, colors.paper],
    ["main link focus", colors.link, colors.paper],
    ["current module default", colors.current, colors.paper],
    ["current module hover", colors.hover, colors.paper],
    ["current module focus", colors.current, colors.paper],
    ["skip link default", colors.skip, colors.skipBackground],
    ["skip link hover", skipHover, colors.skipBackground],
    ["skip link focus", skipFocus, colors.skipBackground],
  ].map(([state, foreground, background]) => ({
    background,
    foreground,
    ratio: contrastRatio(foreground, background),
    state,
  }));
  const contrastFailures = contrastCases.filter(({ ratio }) => ratio < 4.5);
  assert.deepEqual(
    contrastFailures,
    [],
    `normal-size link contrast failures: ${contrastFailures
      .map(
        ({ background, foreground, ratio, state }) =>
          `${state} ${foreground} on ${background} = ${ratio.toFixed(3)}:1`,
      )
      .join(", ")}`,
  );

  assert.match(bodyText, /This page is not generated API documentation\./);
  assert.match(bodyText, /Generated API documentation is currently unavailable\./);
  assert.match(bodyText, /Android SDK location/);
  assert.match(bodyText, new RegExp(escapeRegExp(page.task)));
  assert.match(bodyText, new RegExp(escapeRegExp(page.output)));
  assert.match(bodyText, new RegExp(escapeRegExp(page.destination)));

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
