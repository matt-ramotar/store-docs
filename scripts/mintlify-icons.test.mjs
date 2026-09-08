import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import test from "node:test";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { load } from "cheerio";
import { loadFixtureModule } from "./mintlify-test-utils.mjs";

const fixture = await loadFixtureModule("scripts/fixtures/mintlify-icons.tsx");
const require = createRequire(import.meta.url);
const transform = require("../lib/mintlify-hugeicons-loader.cjs");
const mintlifyRoot = dirname(require.resolve("@mintlify/components"));
const render = (component, props, ...children) => renderToStaticMarkup(h(component, props, ...children));

function assertLocalIcons(markup, minimum = 1) {
  const $ = load(markup);
  const icons = $("svg");
  assert.ok(icons.length >= minimum, `Expected at least ${minimum} rendered icons`);
  for (const icon of icons) {
    assert.equal($(icon).attr("data-icon-library"), "hugeicons");
    assert.ok($(icon).children("path, circle, ellipse, rect, polyline, line").length > 0);
  }
  assert.doesNotMatch(markup, /mask-image|cloudfront\.net|mintlify\.b-cdn\.net|lucide-react/);
  return $;
}

test("real Mintlify cards retain links and render local content and action icons", () => {
  const local = assertLocalIcons(render(fixture.Card, {
    title: "Database", href: "/docs", icon: "database", cta: "Read", arrow: true,
  }, "Card contents"), 2);
  assert.equal(local("a").attr("href"), "/docs");
  assert.equal(local('[data-icon-name="database"]').length, 1);
  const external = assertLocalIcons(render(fixture.Card, { title: "External", href: "https://example.com", arrow: true }), 1);
  assert.equal(external('[data-icon-name="arrow-up-right"]').length, 1);
});

test("real disclosure controls retain their expanded states and local chevrons", () => {
  const accordion = assertLocalIcons(render(fixture.Accordion, {
    title: "Storage", defaultOpen: true, icon: "database",
  }, "Persistent state"), 2);
  assert.equal(accordion("details[open]").length, 1);
  assert.equal(accordion("summary").attr("aria-expanded"), "true");
  assert.equal(accordion('[data-icon-name="caret-right"]').length, 1);
  const expandable = assertLocalIcons(render(fixture.Expandable, { title: "Details", defaultOpen: false }, "Hidden details"));
  assert.equal(expandable('[data-icon-name="angle-right"]').length, 1);
});

test("real tree rows preserve tree semantics and replace both folder states and files", () => {
  const tree = assertLocalIcons(render(fixture.Tree, null,
    h(fixture.Tree.Folder, { name: "src", defaultOpen: true }, h(fixture.Tree.File, { name: "Store.kt" })),
    h(fixture.Tree.Folder, { name: "docs" }, h(fixture.Tree.File, { name: "Readme.md" })),
  ), 3);
  assert.equal(tree('[role="tree"]').length, 1);
  assert.equal(tree('[data-icon-name="folder-open"]').length, 1);
  assert.equal(tree('[data-icon-name="folder"]').length, 1);
  assert.equal(tree('[data-icon-name="file"]').length, 1);
  assert.equal(tree('[role="treeitem"][aria-expanded="true"]').length, 1);
});

test("real Frame title uses a local pointing hand while media and descriptions remain native", () => {
  const framed = assertLocalIcons(render(fixture.Frame, {
    as: "figure", title: "Annotated trace", description: "Source trace", style: { borderColor: "purple" },
    renderDescription: description => h("strong", null, description),
  }, h("video", { src: "/trace.mp4" })));
  assert.equal(framed('[data-icon-name="hand-point-right"]').length, 1);
  assert.equal(framed('[data-icon-name="hand-point-right"]').attr("aria-hidden"), "true");
  assert.match(framed('[data-icon-name="hand-point-right"]').attr("class"), /text-stone-400 dark:text-stone-300/);
  assert.equal(framed('figure[data-component-part="frame"]').length, 1);
  assert.equal(framed("video").attr("src"), "/trace.mp4");
  assert.equal(framed('[data-component-part="frame-description"] strong').text(), "Source trace");
  assert.equal(framed('[data-component-part="frame-background-pattern"]').length, 1);
  assert.equal(load(render(fixture.Frame, {}, "Untitled frame"))("svg").length, 0);
});

test("real copy and code-footer buttons retain labels and replace copy and ellipsis SVGs", () => {
  const copy = assertLocalIcons(render(fixture.CopyToClipboardButton, { textToCopy: "val store = Store()" }));
  assert.equal(copy("button").attr("aria-label"), "Copy the contents from the code block");
  assert.equal(copy('[data-icon-name="copy"]').attr("aria-label"), "Copy");
  const footer = assertLocalIcons(render(fixture.CodeFooter, { numberOfLines: 23, isExpanded: false, toggleExpanded() {} }));
  assert.match(footer("button").text(), /See all 23 lines/);
  assert.equal(footer('[data-icon-name="ellipsis"]').length, 1);
});

test("all thirteen built-in exports render Hugeicons and retain accessible status labels", () => {
  assert.equal(Object.keys(fixture.builtinIcons).length, 13);
  for (const [name, Icon] of Object.entries(fixture.builtinIcons)) {
    const $ = assertLocalIcons(render(Icon));
    if (["Info", "Warning", "Danger", "Tip", "Note", "Check"].some(label => name === `${label}Icon`)) {
      assert.equal($("svg").attr("role"), "img", name);
      assert.equal($("svg").attr("aria-label"), name.replace(/Icon$/, ""), name);
    }
  }
  const copied = assertLocalIcons(render(fixture.builtinIcons.ActiveCopyButtonIcon, { codeBlockTheme: "dark" }));
  assert.equal(copied("svg").attr("aria-label"), "Copied");
  assert.match(copied("svg").attr("class"), /text-primary-light/);
});

test("real diagram controls use Hugeicons for zoom, reset and all pan directions", () => {
  const noop = () => {};
  const zoom = assertLocalIcons(render(fixture.ZoomControls, {
    onZoomIn: noop, onZoomOut: noop, onReset: noop, onPan: noop, panStep: 20,
  }), 7);
  assert.equal(zoom("button").length, 7);
  for (const name of ["zoom-in", "zoom-out", "rotate-ccw", "chevron-up", "chevron-down", "chevron-left", "chevron-right"]) {
    assert.equal(zoom(`[data-icon-name="${name}"]`).length, 1, name);
  }
});

test("named icons preserve legacy type, color and sizing inputs with an explicit unknown fallback", () => {
  for (const name of ["database", "wave-square", "sparkles", "circle-info", "github"]) {
    const $ = assertLocalIcons(render(fixture.Icon, { icon: name, iconLibrary: "lucide", iconType: "regular", color: "#123456", size: 28 }));
    assert.equal($("svg").attr("data-icon-name"), name);
    assert.equal($("svg").attr("data-icon-type"), "regular");
    assert.equal($("svg").attr("data-icon-fallback"), undefined);
    assert.match($("svg").attr("style"), /color:#123456/);
    assert.match($("svg").attr("style"), /width:28px;height:28px/);
  }
  const override = assertLocalIcons(render(fixture.Icon, { icon: "database", overrideSize: true, overrideColor: true }));
  assert.equal(override("svg").attr("width"), undefined);
  assert.equal(override("svg").attr("height"), undefined);
  assert.doesNotMatch(override("svg").attr("style"), /(?:^|;)color:|width:|height:/);
  const themed = assertLocalIcons(render(fixture.Icon, { icon: "database", colorLight: "#123456", colorDark: "#abcdef" }));
  assert.equal(themed("svg").attr("data-icon-dual-color"), "true");
  assert.match(themed("svg").attr("style"), /--color-light:#123456;--color-dark:#abcdef/);
  for (const icon of ["unregistered-author-icon", "constructor", "__proto__"]) {
    const fallback = assertLocalIcons(render(fixture.Icon, { icon }));
    assert.equal(fallback("svg").attr("data-icon-fallback"), "true");
  }
});

test("custom image assets retain their URLs while legacy library URLs and language icons stay local", () => {
  for (const icon of ["https://example.com/brand.svg", "//example.com/brand.svg", "data:image/svg+xml,asset", "/brand.svg"]) {
    const $ = load(render(fixture.Icon, { icon, basePath: "/docs/" }));
    assert.equal($("img").attr("src"), icon === "/brand.svg" ? "/docs/brand.svg" : icon);
    assert.equal($("img").attr("alt"), icon);
  }
  const legacy = assertLocalIcons(render(fixture.Icon, { icon: "https://d3gk2c5xim1je2.cloudfront.net/v7.1.0/regular/database.svg" }));
  assert.equal(legacy('[data-icon-name="database"]').length, 1);
  for (const language of ["kotlin", "typescript", "python", "bash", "unknown"]) {
    assertLocalIcons(render(fixture.LanguageIcon, { language }));
  }
});

test("the durable loader covers every installed bundled Lucide icon and leaves behavior modules intact", async () => {
  const iconPaths = (await readdir(mintlifyRoot, { recursive: true }))
    .filter(file => /lucide-react\/dist\/esm\/icons\/[^/]+\.js$/.test(file));
  assert.equal(iconPaths.length, 14);
  for (const file of iconPaths) {
    const resourcePath = join(mintlifyRoot, file);
    assert.match(transform.call({ resourcePath }, await readFile(resourcePath, "utf8")), /export \{ \w+ as default \} from .+MintlifyIcons\.tsx/);
  }
  const resourcePath = join(mintlifyRoot, "components/card/card.js");
  const original = await readFile(resourcePath, "utf8");
  assert.equal(transform.call({ resourcePath }, original), original);
  assert.equal(transform.call({ resourcePath: "/app/node_modules/lucide-react/dist/esm/icons/check.js" }, "unrelated"), "unrelated");
});

test("Frame's narrow embedded-glyph transform rejects missing or duplicate matches", async () => {
  const resourcePath = join(mintlifyRoot, "components/frame/frame.js");
  const original = await readFile(resourcePath, "utf8");
  const transformed = transform.call({ resourcePath }, original);
  assert.doesNotMatch(transformed, /M224 320/);
  assert.match(transformed, /const t = p\(c\)/);
  assert.match(transformed, /children: s\(n\)/);
  assert.throws(() => transform.call({ resourcePath }, original.replace("M224 320", "changed")), /Expected exactly one Mintlify Frame title icon, found 0/);
  assert.throws(() => transform.call({ resourcePath }, `${original}\n${original}`), /Expected exactly one Mintlify Frame title icon, found 2/);
});

test("installed component SVG producers are fully inventoried, including Tile's decorative background", async () => {
  const componentRoot = join(mintlifyRoot, "components");
  const files = (await readdir(componentRoot, { recursive: true })).filter(file => file.endsWith(".js"));
  const svgFiles = [];
  for (const file of files) {
    const source = await readFile(join(componentRoot, file), "utf8");
    if (/["']svg["']|<svg\b|image\/svg|maskImage|viewBox/i.test(source)) svgFiles.push(file);
  }
  assert.deepEqual(svgFiles.sort(), ["code-group/language-icon.js", "frame/frame.js", "icon/icon.js", "tile/tile.js"]);
  const resourcePath = join(componentRoot, "tile/tile.js");
  const tile = await readFile(resourcePath, "utf8");
  assert.equal(transform.call({ resourcePath }, tile), tile);
});
