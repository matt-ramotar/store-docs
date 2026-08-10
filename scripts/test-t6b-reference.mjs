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
const allowedSelectors = new Set([
  ":root",
  "*",
  "html",
  "body",
  "a",
  "a:hover",
  "a:focus-visible",
  ".skip-link",
  ".skip-link:hover",
  ".skip-link:focus-visible",
  ".skip-link:focus",
  "header",
  "header > div",
  "main",
  "footer > div",
  ".brand",
  "nav ul",
  ".eyebrow",
  "h1",
  "h2",
  ".lede",
  ".notice",
  ".contracts",
  ".notice p:last-child",
  ".contracts p:last-child",
  ".contract-grid",
  "dl",
  "dt",
  "dd",
  "code",
  ".module-links",
  '[aria-current="page"]',
  "footer",
]);
const allowedVisualDeclarations = new Set([
  "html|background",
  "html|color",
  "a|color",
  "a:hover|color",
  ".skip-link|background",
  ".skip-link|color",
  ".skip-link:hover|color",
  ".skip-link:focus-visible|color",
  "header|background",
  ".brand|color",
  ".eyebrow|color",
  ".lede|color",
  ".notice|background",
  ".contracts|background",
  "dt|color",
  "code|background",
  "code|color",
  '[aria-current="page"]|color',
  "footer|color",
]);
const linkSelectors = new Set([
  "a",
  "a:hover",
  "a:focus-visible",
  ".skip-link",
  ".skip-link:hover",
  ".skip-link:focus-visible",
  ".skip-link:focus",
  ".brand",
  '[aria-current="page"]',
]);
const allowedLinkDeclarations = new Set([
  "a|color",
  "a|font-weight",
  "a|text-underline-offset",
  "a:hover|color",
  "a:focus-visible|border-radius",
  "a:focus-visible|outline",
  "a:focus-visible|outline-offset",
  ".skip-link|background",
  ".skip-link|color",
  ".skip-link|left",
  ".skip-link|padding",
  ".skip-link|position",
  ".skip-link|top",
  ".skip-link|transform",
  ".skip-link|z-index",
  ".skip-link:hover|color",
  ".skip-link:focus-visible|color",
  ".skip-link:focus|transform",
  ".brand|color",
  ".brand|font-weight",
  ".brand|letter-spacing",
  ".brand|text-decoration",
  '[aria-current="page"]|color',
  '[aria-current="page"]|text-decoration-thickness',
]);
const visualProperties = new Set(["background", "background-color", "background-image", "color"]);

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

function parseStyleRules(css) {
  const rules = [];
  const pattern = /([^{}]+)\{([^{}]*)\}/g;
  let cursor = 0;

  for (const match of css.matchAll(pattern)) {
    assert.equal(css.slice(cursor, match.index).trim(), "", "unparsed CSS before rule");
    const selectors = match[1]
      .split(",")
      .map((selector) => selector.trim())
      .filter(Boolean);
    assert.notEqual(selectors.length, 0, "CSS rule must have a selector");

    const declarations = new Map();
    for (const source of match[2].split(";").map((part) => part.trim()).filter(Boolean)) {
      const colon = source.indexOf(":");
      assert.notEqual(colon, -1, `unparsed CSS declaration: ${source}`);
      const property = source.slice(0, colon).trim().toLowerCase();
      const value = source.slice(colon + 1).trim();
      assert.notEqual(property, "", `missing CSS property: ${source}`);
      assert.notEqual(value, "", `missing CSS value: ${source}`);
      assert.equal(declarations.has(property), false, `duplicate ${property} in one CSS rule`);
      declarations.set(property, value);
    }

    rules.push({ declarations, order: rules.length, selectors });
    cursor = match.index + match[0].length;
  }

  assert.equal(css.slice(cursor).trim(), "", "unparsed CSS after final rule");
  return rules;
}

function assertBoundedStylesheet(rules) {
  const linkDeclarations = new Map();
  const visualDeclarations = new Map();

  for (const rule of rules) {
    for (const selector of rule.selectors) {
      assert.equal(allowedSelectors.has(selector), true, `unmodeled CSS selector: ${selector}`);

      for (const property of rule.declarations.keys()) {
        if (property.startsWith("--")) {
          assert.equal(selector, ":root", `custom property outside :root: ${selector}|${property}`);
          continue;
        }
        if (linkSelectors.has(selector)) {
          const key = `${selector}|${property}`;
          assert.equal(allowedLinkDeclarations.has(key), true, `unmodeled link declaration: ${key}`);
          assert.equal(
            linkDeclarations.has(key),
            false,
            `conflicting link declaration: ${key} at source orders ${linkDeclarations.get(key)} and ${rule.order}`,
          );
          linkDeclarations.set(key, rule.order);
        }
        if (!visualProperties.has(property)) continue;

        const key = `${selector}|${property}`;
        assert.equal(allowedVisualDeclarations.has(key), true, `unmodeled visual declaration: ${key}`);
        assert.equal(
          visualDeclarations.has(key),
          false,
          `conflicting visual declaration: ${key} at source orders ${visualDeclarations.get(key)} and ${rule.order}`,
        );
        visualDeclarations.set(key, rule.order);
      }
    }
  }

  assert.deepEqual(
    new Set(linkDeclarations.keys()),
    allowedLinkDeclarations,
    "modeled link declaration set changed",
  );
  assert.deepEqual(
    new Set(visualDeclarations.keys()),
    allowedVisualDeclarations,
    "modeled visual declaration set changed",
  );
}

function ruleValue(rules, selector, property, fallback) {
  const matches = rules.filter(
    (rule) => rule.selectors.includes(selector) && rule.declarations.has(property),
  );
  if (matches.length === 0) {
    if (fallback !== undefined) return fallback;
    assert.fail(`missing ${property} declaration in ${selector}`);
  }
  assert.equal(
    matches.length,
    1,
    `conflicting ${property} declarations in ${selector} at source orders ${matches
      .map(({ order }) => order)
      .join(", ")}`,
  );

  return matches[0].declarations.get(property);
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

function assertLinkContrast(html) {
  const $ = load(html);
  assert.equal($("style").length, 1, "reference page must have exactly one bounded stylesheet");
  assert.equal($("style[media], style[disabled]").length, 0, "conditional stylesheets are not modeled");
  assert.equal($("link[rel~='stylesheet']").length, 0, "external stylesheets are not modeled");
  assert.equal($("[style], [color], [bgcolor]").length, 0, "inline presentation is not modeled");
  assert.equal($("a").length, 6, "reference page anchor set changed");
  assert.equal($("a.skip-link").length, 1, "reference page must have one skip link");
  assert.equal($("header a.brand").length, 1, "reference page must have one brand link");
  assert.equal($("header nav a").length, 2, "header documentation link set changed");
  assert.equal($("main nav.module-links a").length, 2, "module link set changed");
  assert.equal($("header nav a[class], header nav a[aria-current]").length, 0);
  assert.equal($("main nav.module-links a[class]").length, 0);
  assert.equal($("main nav.module-links a[aria-current='page']").length, 1);

  const anchorLocations = ["a.skip-link", "header a.brand", "header nav a", "main nav.module-links a"];
  for (const anchor of $("a").toArray()) {
    const matches = anchorLocations.filter((selector) => $(anchor).is(selector));
    assert.equal(
      matches.length,
      1,
      `unmodeled anchor location: ${$.html(anchor).replace(/\s+/g, " ")}`,
    );
  }

  const rules = parseStyleRules($("style").text());
  assertBoundedStylesheet(rules);
  const rootRules = rules.filter((rule) => rule.selectors.includes(":root"));
  assert.equal(rootRules.length, 1, "reference page must have exactly one :root rule");
  const variables = new Map(
    [...rootRules[0].declarations].filter(([property]) => property.startsWith("--")),
  );
  const colors = {
    brand: resolveColor(ruleValue(rules, ".brand", "color"), variables),
    current: resolveColor(ruleValue(rules, '[aria-current="page"]', "color"), variables),
    headerBackground: resolveColor(ruleValue(rules, "header", "background"), variables),
    hover: resolveColor(ruleValue(rules, "a:hover", "color"), variables),
    link: resolveColor(ruleValue(rules, "a", "color"), variables),
    pageBackground: resolveColor(ruleValue(rules, "html", "background"), variables),
    skip: resolveColor(ruleValue(rules, ".skip-link", "color"), variables),
    skipBackground: resolveColor(ruleValue(rules, ".skip-link", "background"), variables),
  };
  const skipHover = resolveColor(
    ruleValue(rules, ".skip-link:hover", "color", colors.hover),
    variables,
  );
  const skipFocus = resolveColor(
    ruleValue(rules, ".skip-link:focus-visible", "color", colors.skip),
    variables,
  );
  const contrastCases = [
    ["header link default", colors.link, colors.headerBackground],
    ["header link hover", colors.hover, colors.headerBackground],
    ["header link focus", colors.link, colors.headerBackground],
    ["header brand default", colors.brand, colors.headerBackground],
    ["header brand hover", colors.hover, colors.headerBackground],
    ["header brand focus", colors.brand, colors.headerBackground],
    ["main link default", colors.link, colors.pageBackground],
    ["main link hover", colors.hover, colors.pageBackground],
    ["main link focus", colors.link, colors.pageBackground],
    ["current module default", colors.current, colors.pageBackground],
    ["current module hover", colors.hover, colors.pageBackground],
    ["current module focus", colors.current, colors.pageBackground],
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
}

function injectStyleRule(html, rule) {
  const fixture = html.replace("</style>", `${rule}</style>`);
  assert.notEqual(fixture, html, "cascade fixture injection must succeed");
  return fixture;
}

assert.equal(await isDirectory(referenceRoot), true, "public/reference must exist");
await walk(referenceRoot);
assert.deepEqual(foundFiles.sort(), expectedFiles, "reference output must contain exactly two module pages");

const requiredModuleHrefs = pages.map(({ currentHref }) => currentHref).sort();
const cascadeFixtureSource = await readFile(pages[0].file, "utf8");
assert.throws(
  () =>
    assertLinkContrast(
      injectStyleRule(cascadeFixtureSource, "main a:hover { color: var(--accent); }"),
    ),
  /unmodeled CSS selector: main a:hover/,
  "a later, more-specific link rule must be rejected",
);
assert.throws(
  () =>
    assertLinkContrast(
      injectStyleRule(cascadeFixtureSource, "main a:hover, a:hover { color: var(--accent); }"),
    ),
  /unmodeled CSS selector: main a:hover/,
  "an unmodeled selector in a grouped rule must be rejected",
);
assert.throws(
  () =>
    assertLinkContrast(injectStyleRule(cascadeFixtureSource, "a:hover { color: var(--accent); }")),
  /conflicting link declaration: a:hover\|color at source orders/,
  "a later duplicate link rule must be rejected",
);
assert.throws(
  () =>
    assertLinkContrast(injectStyleRule(cascadeFixtureSource, "main { background: var(--surface); }")),
  /unmodeled visual declaration: main\|background/,
  "an unmodeled link-background override must be rejected",
);

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
  assertLinkContrast(html);

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
