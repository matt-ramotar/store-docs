import assert from "node:assert/strict";
import test from "node:test";

import { load } from "cheerio";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { loadFixtureModule } from "./mintlify-test-utils.mjs";

const entry = "components/docs/mintlify/status/index.tsx";

async function loadStatus() {
  return loadFixtureModule(entry);
}

function render(Component, props) {
  return load(renderToStaticMarkup(React.createElement(Component, props)));
}

test("status facade exposes every assigned component", async () => {
  const status = await loadStatus();
  const names = [
    "Badge",
    "Callout",
    "Check",
    "Danger",
    "DeprecatedPill",
    "Info",
    "InfoPill",
    "Note",
    "ParamHead",
    "Property",
    "RequiredPill",
    "Tip",
    "Warning",
  ];

  assert.deepEqual(
    names.filter((name) => typeof status[name] !== "function"),
    [],
  );
});

test("Badge renders every public color, variant, size, and shape as an inspectable state", async () => {
  const { Badge } = await loadStatus();
  const colors = new Map([
    ["gray", "default"],
    ["blue", "accent"],
    ["green", "success"],
    ["orange", "warning"],
    ["yellow", "warning"],
    ["red", "danger"],
    ["purple", "accent"],
    ["white", "default"],
    ["surface", "default"],
    ["white-destructive", "danger"],
    ["surface-destructive", "danger"],
  ]);
  const variants = new Map([
    ["solid", "primary"],
    ["outline", "secondary"],
  ]);
  const sizes = new Map([
    ["xs", "sm"],
    ["sm", "sm"],
    ["md", "md"],
    ["lg", "lg"],
  ]);
  const shapes = ["rounded", "pill"];

  for (const [color, semanticColor] of colors) {
    const $ = render(Badge, { children: color, color });
    assert.equal($("[data-badge-color]").attr("data-badge-color"), color);
    assert.equal($("[data-badge-color]").hasClass(`chip--${semanticColor}`), true);
  }
  for (const [variant, semanticVariant] of variants) {
    const $ = render(Badge, { children: variant, variant });
    assert.equal($("[data-badge-variant]").attr("data-badge-variant"), variant);
    assert.equal($("[data-badge-variant]").hasClass(`chip--${semanticVariant}`), true);
  }
  for (const [size, semanticSize] of sizes) {
    const $ = render(Badge, { children: size, size });
    assert.equal($("[data-badge-size]").attr("data-badge-size"), size);
    assert.equal($("[data-badge-size]").hasClass(`chip--${semanticSize}`), true);
  }
  for (const shape of shapes) {
    const $ = render(Badge, { children: shape, shape });
    assert.equal($("[data-badge-shape]").attr("data-badge-shape"), shape);
  }
});

test("Badge retains link, button, disabled, icon, and deprecated stroke behavior", async () => {
  const { Badge } = await loadStatus();
  const callback = () => {};
  const link = render(Badge, { children: "Guide", href: "/guide", leadIcon: "book" });
  assert.equal(link("a.store-status-badge").attr("href"), "/guide");
  assert.equal(link('[data-component-part="lead-icon"]').attr("data-icon-type"), "string");

  const button = render(Badge, { children: "Run", onClick: callback, tailIcon: React.createElement("i") });
  assert.equal(button("button.store-status-badge").attr("type"), "button");
  assert.equal(button('[data-component-part="tail-icon"] i').length, 1);
  assert.equal(Badge({ children: "Run", onClick: callback }).props.onClick, callback);

  const disabled = render(Badge, {
    children: "Unavailable",
    disabled: true,
    href: "/unavailable",
    onClick() {},
  });
  assert.equal(disabled("span.store-status-badge").attr("data-disabled"), "true");
  assert.equal(disabled("a, button").length, 0);

  const stroke = render(Badge, { children: "Legacy", stroke: true });
  assert.equal(stroke("[data-badge-variant]").attr("data-badge-variant"), "outline");

  for (const iconType of [
    "brands",
    "duotone",
    "light",
    "regular",
    "sharp-duotone-solid",
    "sharp-light",
    "sharp-regular",
    "sharp-solid",
    "sharp-thin",
    "solid",
    "thin",
  ]) {
    const $ = render(Badge, { children: iconType, iconType, leadIcon: "circle-info" });
    assert.equal($("[data-component-part=lead-icon] svg").attr("data-icon-library"), "hugeicons");
    assert.ok($("[data-component-part=lead-icon] svg path").length > 0);
    assert.doesNotMatch($("[data-component-part=lead-icon] svg").attr("style") ?? "", /(?:width|height):/);
  }
  for (const iconLibrary of ["fontawesome", "lucide"]) {
    const $ = render(Badge, { children: iconLibrary, iconLibrary, leadIcon: "circle-info" });
    assert.equal($("[data-component-part=lead-icon] svg").attr("data-icon-library"), "hugeicons");
  }
});

test("badge image decorations do not add an asset path to the accessible name", async () => {
  const { Badge } = await loadStatus();
  const $ = render(Badge, { children: "Version", leadIcon: "/store-logo.png" });
  const image = $('[data-component-part="lead-icon"] img');
  assert.equal(image.attr("src"), "/store-logo.png");
  assert.equal(image.closest('[aria-hidden="true"]').length, 1);
});

test("Callout covers all variants and lets explicit variant override a legacy type", async () => {
  const { Callout } = await loadStatus();
  const variants = ["info", "warning", "note", "tip", "check", "danger", "custom"];

  for (const variant of variants) {
    const $ = render(Callout, { children: "Body", variant });
    const root = $("aside.store-status-callout");
    assert.equal(root.attr("data-callout-type"), variant);
    assert.equal(root.attr("aria-label"), `${variant === "custom" ? "Callout" : `${variant[0].toUpperCase()}${variant.slice(1)}`} callout`);
    assert.equal(root.find("[data-callout-label]").text(), variant === "custom" ? "Callout" : `${variant[0].toUpperCase()}${variant.slice(1)}`);
    assert.equal(root.find("[data-callout-body]").text().includes("Body"), true);
    const glyph = root.find('[data-component-part="callout-icon"] svg[data-icon-library="hugeicons"]');
    assert.equal(glyph.length, variant === "custom" ? 0 : 1);
    if (variant !== "custom") {
      assert.equal(glyph.attr("aria-hidden"), "true");
      assert.ok(glyph.children().length > 0);
    }
  }

  const override = render(Callout, {
    children: "Stop",
    title: "Conflict",
    type: "Info",
    variant: "danger",
  });
  assert.equal(override("aside").attr("data-callout-type"), "danger");
  assert.equal(override("aside").attr("aria-label"), "Danger callout");
  assert.equal(override("[data-callout-label]").text(), "Danger");
  assert.equal(override("[data-component-part=callout-title]").text(), "Conflict");

  for (const [type, expected] of [
    ["Info", "info"],
    ["Warning", "warning"],
    ["Note", "note"],
    ["Tip", "tip"],
    ["Check", "check"],
    ["Danger", "danger"],
  ]) {
    assert.equal(render(Callout, { children: type, type })("aside").attr("data-callout-type"), expected);
  }
});

test("Callout supports named aliases plus custom icon, color, class, and accessible label", async () => {
  const status = await loadStatus();
  for (const [name, variant] of [
    ["Info", "info"],
    ["Warning", "warning"],
    ["Note", "note"],
    ["Tip", "tip"],
    ["Check", "check"],
    ["Danger", "danger"],
  ]) {
    const $ = render(status[name], { children: name });
    assert.equal($("aside").attr("data-callout-type"), variant);
  }

  const custom = render(status.Callout, {
    ariaLabel: "Migration notice",
    children: "Custom body",
    className: "author-class",
    color: "#6D28D9",
    icon: "sparkles",
    iconLibrary: "lucide",
    iconType: "solid",
    variant: "custom",
  });
  assert.equal(custom("aside").attr("aria-label"), "Migration notice");
  assert.equal(custom("aside").hasClass("author-class"), true);
  assert.equal(custom("aside").attr("style")?.includes("#6D28D9"), true);
  assert.equal(custom('[data-component-part="callout-icon"] [data-icon-library="hugeicons"]').length, 1);
});

test("Property and ParamHead retain metadata, labels, content, ids, and hidden state", async () => {
  const { ParamHead, Property } = await loadStatus();
  const $ = render(Property, {
    children: React.createElement("p", null, "Accepts arbitrary JSX."),
    className: "author-property",
    default: false,
    defaultLabel: "initial",
    deprecated: true,
    deprecatedLabel: "retired",
    id: "fetch-policy",
    location: "query",
    name: "fetchPolicy",
    post: ["post-a"],
    pre: ["pre-a"],
    required: true,
    requiredLabel: "mandatory",
    type: "NetworkPolicy | null",
  });
  assert.equal($(".store-status-property").hasClass("author-property"), true);
  assert.equal($("#fetch-policy [data-component-part=field-name]").text(), "fetchPolicy");
  assert.deepEqual(
    $("[data-component-part=field-info-pill]").map((_, item) => $(item).text()).get(),
    ["NetworkPolicy | null", "query", "initialfalse"],
  );
  assert.equal($("[data-component-part=field-required-pill]").text(), "mandatory");
  assert.equal($("[data-component-part=field-deprecated-pill]").text(), "retired");
  assert.equal($("[data-component-part=field-meta-pre]").text(), "pre-a");
  assert.equal($("[data-component-part=field-meta-post]").text(), "post-a");
  assert.equal($("[data-component-part=field-content]").text(), "Accepts arbitrary JSX.");

  assert.equal(render(Property, { children: "Secret", hidden: true, name: "secret", type: "string" })("body").children().length, 0);
  assert.equal(render(ParamHead, { hidden: true, name: "secret", type: "string" })("body").children().length, 0);
});

test("Pills preserve arbitrary content and optional label absence", async () => {
  const { DeprecatedPill, InfoPill, RequiredPill } = await loadStatus();
  const info = render(InfoPill, {
    children: React.createElement("code", null, "List<String>"),
    className: "author-pill",
    prefix: "type",
  });
  assert.equal(info("[data-component-part=field-info-pill]").hasClass("author-pill"), true);
  assert.equal(info("[data-component-part=field-info-pill]").text(), "typeList<String>");
  assert.equal(render(RequiredPill, {})("body").children().length, 0);
  assert.equal(render(DeprecatedPill, {})("body").children().length, 0);
});

test("client fixtures have stable metadata and execute with the real adapters", async () => {
  const { fixtures } = await loadFixtureModule("components/docs/mintlify/status/fixtures.tsx");
  assert.deepEqual(fixtures.map((fixture) => fixture.id), [
    "status-badge-enums",
    "status-callout-variants",
    "status-property-states",
    "status-client-callbacks",
  ]);
  assert.equal(new Set(fixtures.map((fixture) => fixture.id)).size, fixtures.length);

  for (const fixture of fixtures) {
    assert.equal(typeof fixture.name, "string");
    assert.equal(typeof fixture.description, "string");
    assert.equal(fixture.assertions.length > 0, true);
    assert.equal(renderToStaticMarkup(fixture.render()).length > 0, true);
  }

  const callbacks = fixtures.find(({ id }) => id === "status-client-callbacks");
  const html = renderToStaticMarkup(callbacks.render());
  assert.match(html, /<button[^>]*>.*Run Badge callback/s);
  assert.match(html, /<a[^>]*href="#c1-badge-linked-target"[^>]*>.*Run linked Badge callback/s);
  assert.match(html, /id="c1-paramhead-clipboard-denial"/);
  assert.match(html, /Enable ParamHead clipboard denial/);
  assert.match(html, /data-fixture-events="status-callbacks"/);
  assert.match(html, /Button callbacks:.*0.*Link callbacks:.*0.*Clipboard mode:.*native.*Unhandled rejections:.*0/s);
});

 test("ParamHead preserves the installed international fragment spelling", async () => {
  const { ParamHead } = await loadStatus();
  for (const [name, id] of [["Straße", "strasse"], ["Привет", "privet"], ["fetchPolicy", "fetch-policy"]]) {
    const $ = render(ParamHead, { name });
    assert.equal($('[id]').first().attr('id'), id);
    assert.equal($('[data-component-part="field-name"]').attr('href'), `#${id}`);
  }
});
