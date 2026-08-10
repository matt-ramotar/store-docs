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
const expectedStylesheetManifest = [
  ':root{color-scheme:light;--paper:#f7f4ef;--surface:#ffffff;--slate:#1a1f26;--muted:#4a5361;--border:#d9d2c7;--accent:#0d8577;--accent-strong:#0a6259;--code-surface:#0d141c;--code-foreground:#d7dee8}',
  "*{box-sizing:border-box}",
  'html{background:var(--paper);color:var(--slate);font-family:Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;line-height:1.6}',
  "body{margin:0}",
  "a{color:var(--accent-strong);font-weight:650;text-underline-offset:0.2em}",
  "a:hover{color:var(--accent-strong)}",
  "a:focus-visible{border-radius:0.2rem;outline:3px solid var(--accent);outline-offset:3px}",
  ".skip-link{background:var(--slate);color:var(--surface);left:1rem;padding:0.65rem 0.9rem;position:fixed;top:1rem;transform:translateY(-200%);z-index:2}",
  ".skip-link:hover{color:var(--surface)}",
  ".skip-link:focus-visible{color:var(--surface)}",
  ".skip-link:focus{transform:translateY(0)}",
  "header{background:var(--surface);border-bottom:1px solid var(--border)}",
  "header > div,main,footer > div{margin:0 auto;max-width:68rem;padding-left:clamp(1.25rem, 4vw, 3rem);padding-right:clamp(1.25rem, 4vw, 3rem)}",
  "header > div{align-items:center;display:flex;flex-wrap:wrap;gap:1rem 2rem;justify-content:space-between;min-height:4.5rem;padding-bottom:0.75rem;padding-top:0.75rem}",
  ".brand{color:var(--slate);font-weight:800;letter-spacing:-0.015em;text-decoration:none}",
  "nav ul{display:flex;flex-wrap:wrap;gap:0.6rem 1.25rem;list-style:none;margin:0;padding:0}",
  "main{padding-bottom:5rem;padding-top:clamp(3.5rem, 8vw, 6.5rem)}",
  ".eyebrow{color:var(--accent-strong);font-size:0.75rem;font-weight:800;letter-spacing:0.14em;text-transform:uppercase}",
  "h1,h2{letter-spacing:-0.035em;line-height:1.1;text-wrap:balance}",
  "h1{font-size:clamp(2.5rem, 7vw, 5rem);margin:0.75rem 0 1.5rem;max-width:14ch}",
  "h2{font-size:clamp(1.5rem, 3vw, 2rem);margin:0}",
  ".lede{color:var(--muted);font-size:clamp(1.05rem, 2vw, 1.25rem);max-width:46rem}",
  ".notice,.contracts{background:var(--surface);border:1px solid var(--border);margin-top:2.5rem;padding:clamp(1.25rem, 4vw, 2rem)}",
  ".notice{border-left:0.3rem solid var(--accent)}",
  ".notice p:last-child,.contracts p:last-child{margin-bottom:0}",
  ".contract-grid{display:grid;gap:1rem;grid-template-columns:repeat(auto-fit, minmax(min(100%, 19rem), 1fr));margin-top:1.5rem}",
  "dl{border-top:1px solid var(--border);margin:0;padding-top:1rem}",
  "dt{color:var(--muted);font-size:0.75rem;font-weight:800;letter-spacing:0.08em;margin-top:0.85rem;text-transform:uppercase}",
  "dd{margin:0.2rem 0 0}",
  "code{background:var(--code-surface);border-radius:0.25rem;color:var(--code-foreground);display:inline-block;font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;font-size:0.84em;max-width:100%;overflow-wrap:anywhere;padding:0.15rem 0.35rem}",
  ".module-links{border-top:1px solid var(--border);margin-top:2.5rem;padding-top:1.5rem}",
  '[aria-current="page"]{color:var(--slate);text-decoration-thickness:0.2rem}',
  "footer{border-top:1px solid var(--border);color:var(--muted)}",
  "footer > div{padding-bottom:2rem;padding-top:2rem}",
];
const anchorPaths = {
  brand:
    "html:nth-of-type(1) > body:nth-of-type(1) > header:nth-of-type(1) > div:nth-of-type(1) > a:nth-of-type(1)",
  core:
    "html:nth-of-type(1) > body:nth-of-type(1) > main:nth-of-type(1) > nav:nth-of-type(1) > ul:nth-of-type(1) > li:nth-of-type(1) > a:nth-of-type(1)",
  docsHome:
    "html:nth-of-type(1) > body:nth-of-type(1) > header:nth-of-type(1) > div:nth-of-type(1) > nav:nth-of-type(1) > ul:nth-of-type(1) > li:nth-of-type(1) > a:nth-of-type(1)",
  mutations:
    "html:nth-of-type(1) > body:nth-of-type(1) > main:nth-of-type(1) > nav:nth-of-type(1) > ul:nth-of-type(1) > li:nth-of-type(2) > a:nth-of-type(1)",
  overview:
    "html:nth-of-type(1) > body:nth-of-type(1) > header:nth-of-type(1) > div:nth-of-type(1) > nav:nth-of-type(1) > ul:nth-of-type(1) > li:nth-of-type(2) > a:nth-of-type(1)",
  skip: "html:nth-of-type(1) > body:nth-of-type(1) > a:nth-of-type(1)",
};

function expectedAnchorManifest(currentHref) {
  const attributesFor = (href) =>
    href === currentHref ? { "aria-current": "page", href } : { href };

  return [
    {
      attributes: { class: "skip-link", href: "#main-content" },
      path: anchorPaths.skip,
      text: "Skip to main content",
    },
    {
      attributes: { class: "brand", href: "/docs" },
      path: anchorPaths.brand,
      text: "Store Documentation",
    },
    {
      attributes: { href: "/docs" },
      path: anchorPaths.docsHome,
      text: "Docs home",
    },
    {
      attributes: { href: "/docs/store6/overview" },
      path: anchorPaths.overview,
      text: "Store 6 overview",
    },
    {
      attributes: attributesFor("/reference/store6-core/index.html"),
      path: anchorPaths.core,
      text: "Core module",
    },
    {
      attributes: attributesFor("/reference/store6-mutations/index.html"),
      path: anchorPaths.mutations,
      text: "Mutations module",
    },
  ];
}

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

function elementPath(element) {
  const segments = [];
  let current = element;

  while (current && current.type !== "root") {
    if (current.type === "tag") {
      const siblings = (current.parent?.children ?? []).filter(
        (candidate) => candidate.type === "tag" && candidate.name === current.name,
      );
      segments.push(`${current.name}:nth-of-type(${siblings.indexOf(current) + 1})`);
    }
    current = current.parent;
  }

  return segments.reverse().join(" > ");
}

function anchorManifest($) {
  return $("a")
    .toArray()
    .map((element) => ({
      attributes: Object.fromEntries(
        Object.entries(element.attribs).sort(([left], [right]) =>
          left < right ? -1 : left > right ? 1 : 0,
        ),
      ),
      path: elementPath(element),
      text: $(element).text().replace(/\s+/g, " ").trim(),
    }));
}

function stylesheetManifest(rules) {
  return rules.map(
    ({ declarations, selectors }) =>
      `${selectors.join(",")}{${[...declarations]
        .map(([property, value]) => `${property}:${value}`)
        .join(";")}}`,
  );
}

function assertFrozenStylesheet(rules) {
  assert.deepEqual(
    stylesheetManifest(rules),
    expectedStylesheetManifest,
    "stylesheet manifest changed; re-audit the complete contrast contract",
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

function assertLinkContrast(html, currentHref) {
  const $ = load(html);
  assert.equal($("style").length, 1, "reference page must have exactly one bounded stylesheet");
  assert.deepEqual(
    Object.entries($("style").get(0).attribs),
    [],
    "embedded style element attributes changed",
  );
  assert.equal($("style[media], style[disabled]").length, 0, "conditional stylesheets are not modeled");
  assert.equal($("link[rel~='stylesheet']").length, 0, "external stylesheets are not modeled");
  assert.equal($("[style], [color], [bgcolor]").length, 0, "inline presentation is not modeled");
  assert.deepEqual(
    anchorManifest($),
    expectedAnchorManifest(currentHref),
    "anchor manifest changed; re-audit the complete contrast contract",
  );

  const rules = parseStyleRules($("style").text());
  assertFrozenStylesheet(rules);
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

function replaceFixture(html, from, to) {
  const fixture = html.replace(from, to);
  assert.notEqual(fixture, html, "HTML fixture replacement must succeed");
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
      pages[0].currentHref,
    ),
  /stylesheet manifest changed/,
  "a later, more-specific link rule must be rejected",
);
assert.throws(
  () =>
    assertLinkContrast(
      injectStyleRule(cascadeFixtureSource, "main a:hover, a:hover { color: var(--accent); }"),
      pages[0].currentHref,
    ),
  /stylesheet manifest changed/,
  "an unmodeled selector in a grouped rule must be rejected",
);
assert.throws(
  () =>
    assertLinkContrast(
      injectStyleRule(cascadeFixtureSource, "a:hover { color: var(--accent); }"),
      pages[0].currentHref,
    ),
  /stylesheet manifest changed/,
  "a later duplicate link rule must be rejected",
);
assert.throws(
  () =>
    assertLinkContrast(
      injectStyleRule(cascadeFixtureSource, "main { background: var(--surface); }"),
      pages[0].currentHref,
    ),
  /stylesheet manifest changed/,
  "an unmodeled link-background override must be rejected",
);
assert.throws(
  () =>
    assertLinkContrast(
      replaceFixture(cascadeFixtureSource, 'class="skip-link"', 'class="skip-link contracts"'),
      pages[0].currentHref,
    ),
  /anchor manifest changed/,
  "a skip link with an additional contracts class must be rejected",
);
assert.throws(
  () =>
    assertLinkContrast(
      replaceFixture(cascadeFixtureSource, 'class="skip-link"', 'class="skip-link brand"'),
      pages[0].currentHref,
    ),
  /anchor manifest changed/,
  "a skip link with an additional brand class must be rejected",
);
assert.throws(
  () =>
    assertLinkContrast(
      injectStyleRule(cascadeFixtureSource, "header { opacity: .05; }"),
      pages[0].currentHref,
    ),
  /stylesheet manifest changed/,
  "an unmodeled opacity declaration must be rejected",
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
  assertLinkContrast(html, page.currentHref);

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

  const trackerContextPattern = new RegExp(
    `${["ST", "ORE"].join("")}-\\d+|${["T", "6"].join("")}[ab]?|${["Lin", "ear"].join("")}`,
    "i",
  );
  assert.equal(trackerContextPattern.test(html), false, `${page.moduleName} must not expose tracker context`);
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

console.log(
  JSON.stringify({
    adversarialFixtures: 7,
    pagesChecked: pages.length,
    referenceFiles: foundFiles.length,
  }),
);
