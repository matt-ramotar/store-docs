import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { loadFixtureModule } from "./mintlify-test-utils.mjs";

const layout = await loadFixtureModule("components/docs/mintlify/layout/index.tsx");
const fixtureModule = await loadFixtureModule("components/docs/mintlify/layout/fixtures.tsx");
const tooltipAccessibility = await loadFixtureModule("components/docs/mintlify/tooltip-accessibility.ts");
const render = (node) => renderToStaticMarkup(node);

test("layout family exports every compatibility component and compound member", () => {
  for (const name of ["Card", "CardGroup", "Columns", "Frame", "Panel", "Tile", "Color", "ColorRow", "ColorItem", "Icon"]) {
    assert.equal(typeof layout[name], "function", `${name} is exported`);
  }
  assert.equal(layout.Update.$$typeof, Symbol.for("react.forward_ref"));
  assert.equal(layout.View.$$typeof, Symbol.for("react.forward_ref"));
  assert.equal(layout.Color.Row, layout.ColorRow);
  assert.equal(layout.Color.Item, layout.ColorItem);
});

test("Card preserves navigation semantics, explicit as, and disabled state", () => {
  const internal = render(React.createElement(layout.Card, { href: "/docs/store6", title: "Internal" }, "Read"));
  assert.match(internal, /^<a /);
  assert.match(internal, /href="\/docs\/store6"/);
  assert.doesNotMatch(internal, /target="_blank"/);
  const fragment = render(React.createElement(layout.Card, { href: "#retry", title: "Anchor" }, "Jump"));
  assert.match(fragment, /^<a /);
  assert.match(fragment, /href="#retry"/);
  const external = render(React.createElement(layout.Card, { href: "https://example.com", title: "External" }, "Visit"));
  assert.match(external, /target="_blank"/);
  assert.match(external, /rel="noreferrer"/);
  const protocolRelative = render(React.createElement(layout.Card, { href: "//example.com/reference", title: "CDN" }, "Visit"));
  assert.match(protocolRelative, /^<a /);
  assert.match(protocolRelative, /target="_blank"/);
  assert.match(protocolRelative, /rel="noreferrer"/);
  const explicit = render(React.createElement(layout.Card, { as: "article", href: "/docs/store6", title: "Explicit" }, "Keep the element"));
  assert.match(explicit, /^<article /);
  assert.match(explicit, /href="\/docs\/store6"/);
  const disabled = render(React.createElement(layout.Card, { disabled: true, href: "/docs/store6", title: "Disabled" }, "Unavailable"));
  assert.match(disabled, /^<div /);
  assert.doesNotMatch(disabled, /href=/);
});

test("Columns and CardGroup preserve every column count and local defaults", () => {
  for (const cols of [1, 2, 3, 4, "1", "2", "3", "4"]) {
    const html = render(React.createElement(layout.Columns, { cols }, React.createElement("span", null, String(cols))));
    assert.match(html, new RegExp(`--cols:${Number(cols)}`));
    assert.match(html, /store-mintlify-columns/);
  }
  const group = render(React.createElement(layout.CardGroup, null, React.createElement("span", null, "Default group")));
  assert.match(group, /--cols:2/);
});

test("Frame preserves media, author style, description rendering, and optional defaults", () => {
  const html = render(React.createElement(layout.Frame, {
    title: "Trace", description: "A wide trace",
    renderDescription: (description) => React.createElement("strong", null, description),
    style: { borderColor: "rgb(109, 40, 217)" },
  }, React.createElement("img", { alt: "Wide trace", src: "/trace.png", width: 1600, height: 600 })));
  assert.match(html, /store-mintlify-frame/);
  assert.match(html, /border-color:rgb\(109, 40, 217\)/);
  assert.match(html, /<img[^>]+src="\/trace.png"/);
  assert.match(html, /<strong>A wide trace<\/strong>/);
});

test("Panel and Tile retain caller HTML props and link states", () => {
  const panel = render(React.createElement(layout.Panel, { id: "mobile-panel", "aria-label": "Contents" }, "Panel"));
  assert.match(panel, /id="mobile-panel"/);
  assert.match(panel, /aria-label="Contents"/);
  assert.match(panel, /store-mintlify-panel/);
  const local = render(React.createElement(layout.Tile, { href: "/docs", title: "Local", description: "Browse" }, React.createElement("svg", { "aria-label": "Diagram" })));
  assert.match(local, /^<a /);
  assert.doesNotMatch(local, /target="_blank"/);
  assert.match(local, /store-mintlify-tile/);
  const remote = render(React.createElement(layout.Tile, { href: "https://example.com", title: "Remote" }, "Preview"));
  assert.match(remote, /target="_blank"/);
});

test("Update defaults visible and honors hidden state", () => {
  const visible = render(React.createElement(layout.Update, { id: "release-1", label: "1.0", tags: [" stable ", "stable", ""] }, "Released"));
  assert.match(visible, /id="release-1"/);
  assert.equal((visible.match(/data-component-part="update-tag"/g) ?? []).length, 1);
  assert.match(visible, /store-mintlify-update/);
  assert.equal(render(React.createElement(layout.Update, { id: "draft", label: "Draft", isVisible: false }, "Hidden")), "");
});

test("View requires an explicit registry and stays empty until client mount", () => {
  const activeItems = [{ title: "Kotlin", content: "kotlin", active: true }];
  assert.equal(render(React.createElement(layout.View, { title: "Kotlin", items: activeItems }, "Mounted content")), "");
  assert.equal(render(React.createElement(layout.View, { title: "Swift", items: activeItems }, "Inactive content")), "");
  assert.equal(render(React.createElement(layout.View, { title: "Empty", items: [] }, "No registry match")), "");
});

test("Color keeps compact/table variants and author supplied current and legacy swatches", () => {
  const compact = render(React.createElement(layout.Color, { variant: "compact" },
    React.createElement(layout.ColorItem, { name: "Accent", value: "#13766D" }),
    React.createElement(layout.Color.Item, { name: "Origin", value: { light: "#6D28D9", dark: "#C4A7FF" } }),
  ));
  assert.match(compact, /data-variant="compact"/);
  assert.match(compact, /background-color:#13766D/);
  assert.match(compact, /background-color:#6D28D9/);
  const table = render(React.createElement(layout.Color, { variant: "table" },
    React.createElement(layout.ColorRow, { title: "Store" }, React.createElement(layout.Color.Item, { value: "#172C2A" })),
  ));
  assert.match(table, /data-variant="table"/);
  assert.match(table, /data-component-part="color-row-title"/);
  assert.match(table, /background-color:#172C2A/);
  assert.match(table, /aria-label="Color #172C2A"/);
  assert.match(table, /aria-pressed="false"/);
  assert.match(table, /aria-roledescription="Copy"/);
});

test("native Color tooltips gain and release an accessible trigger association", () => {
  const originalDocument = globalThis.document;
  const originalMutationObserver = globalThis.MutationObserver;
  let observer;

  class FakeElement {
    constructor({ attributes = {}, style = {}, title } = {}) {
      this.attributes = new Map(Object.entries(attributes));
      this.style = style;
      this.title = title;
    }
    getAttribute(name) { return this.attributes.get(name) ?? null; }
    hasAttribute(name) { return this.attributes.has(name); }
    removeAttribute(name) { this.attributes.delete(name); }
    setAttribute(name, value) { this.attributes.set(name, String(value)); }
    querySelector(selector) {
      return selector === '[data-component-part="tooltip-title"]' && this.title !== undefined
        ? { textContent: this.title }
        : null;
    }
  }

  const trigger = new FakeElement({
    attributes: { "aria-describedby": "author-help" },
    style: { backgroundColor: "#172C2A" },
  });
  const popup = new FakeElement({ title: "#172C2A" });
  const scope = { querySelectorAll: () => [trigger] };
  class FakeMutationObserver {
    constructor(callback) { this.callback = callback; observer = this; }
    disconnect() { this.disconnected = true; }
    observe(target, options) { this.target = target; this.options = options; }
  }

  try {
    globalThis.document = {
      body: { id: "body" },
      createElement: () => ({ style: { color: "" } }),
      getElementsByClassName: (className) => className === "color-scope" ? [scope] : [],
      querySelectorAll: (selector) => selector === '[data-component-part="tooltip-content"]' ? [popup] : [],
    };
    globalThis.MutationObserver = FakeMutationObserver;

    const cleanup = tooltipAccessibility.observeNativeColorTooltips("color-scope", "color-description");
    assert.deepEqual(observer.options, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-popup-open"],
    });
    assert.equal(trigger.getAttribute("aria-describedby"), "author-help");
    assert.equal(popup.getAttribute("role"), null);

    trigger.setAttribute("data-popup-open", "");
    observer.callback([]);
    assert.equal(popup.getAttribute("id"), "color-description-1");
    assert.equal(popup.getAttribute("role"), "tooltip");
    assert.equal(trigger.getAttribute("aria-describedby"), "author-help color-description-1");

    trigger.removeAttribute("data-popup-open");
    observer.callback([]);
    assert.equal(trigger.getAttribute("aria-describedby"), "author-help");
    assert.equal(popup.getAttribute("id"), null);
    assert.equal(popup.getAttribute("role"), null);

    trigger.setAttribute("data-popup-open", "");
    observer.callback([]);
    cleanup();
    assert.equal(observer.disconnected, true);
    assert.equal(trigger.getAttribute("aria-describedby"), "author-help");
    assert.equal(popup.getAttribute("id"), null);
    assert.equal(popup.getAttribute("role"), null);
  } finally {
    if (originalDocument === undefined) delete globalThis.document;
    else globalThis.document = originalDocument;
    if (originalMutationObserver === undefined) delete globalThis.MutationObserver;
    else globalThis.MutationObserver = originalMutationObserver;
  }
});

test("Icon renders Hugeicons while preserving legacy input, color, size, and overrides", () => {
  const colored = render(React.createElement(layout.Icon, { icon: "database", iconLibrary: "lucide", color: "#6D28D9", size: 28 }));
  assert.match(colored, /store-mintlify-icon/);
  assert.match(colored, /color:#6D28D9/);
  assert.match(colored, /width:28px/);
  assert.match(colored, /data-icon-library="hugeicons"/);
  assert.match(colored, /data-icon-name="database"/);
  assert.match(colored, /<path /);
  assert.doesNotMatch(colored, /mask-image|cloudfront\.net|lucide\/v0/);
  const overridden = render(React.createElement(layout.Icon, { icon: "database", overrideColor: true, overrideSize: true }));
  assert.doesNotMatch(overridden, /width:/);
  assert.doesNotMatch(overridden, /height:/);
});

test("fixtures are executable, uniquely identified, and cover enums and required states", () => {
  const { fixtures } = fixtureModule;
  assert.ok(Array.isArray(fixtures));
  assert.equal(new Set(fixtures.map(({ id }) => id)).size, fixtures.length);
  for (const fixture of fixtures) {
    assert.equal(typeof fixture.render, "function");
    assert.ok(fixture.assertions.length > 0, `${fixture.id} has assertions`);
    assert.doesNotThrow(() => render(fixture.render()), fixture.id);
  }
  const corpus = JSON.stringify(fixtures.map(({ id, description, assertions }) => ({ id, description, assertions })));
  for (const required of ["active", "inactive", "mount", "empty", "nested", "long", "compact", "table", "protocol-relative", "overrideSize", "overrideColor"]) {
    assert.match(corpus, new RegExp(required, "i"), required);
  }
  for (const value of ["brands", "duotone", "light", "regular", "sharp-duotone-solid", "sharp-light", "sharp-regular", "sharp-solid", "sharp-thin", "solid", "thin", "fontawesome", "lucide", "default", "pdf", "minimal"]) {
    assert.match(corpus, new RegExp(value), value);
  }

  const byId = Object.fromEntries(fixtures.map((fixture) => [fixture.id, render(fixture.render())]));
  assert.match(byId["layout-update-visibility-callbacks"], /Unmount callback update/);
  assert.match(byId["layout-update-visibility-callbacks"], /data-fixture-events="update"/);
  assert.match(byId["layout-update-visibility-callbacks"], /Ref:.*pending.*No callback yet/s);
  assert.match(byId["layout-view-registry"], /data-fixture-events="view"/);
  assert.match(byId["layout-view-registry"], /Active ref:.*pending/s);
  assert.match(byId["layout-color-variants"], /aria-label="Ink"/);
  assert.match(byId["layout-color-variants"], /aria-roledescription="Copy"/);
});

test("family CSS is fully scoped and uses shared semantic tokens without overriding swatches", async () => {
  const css = await readFile(new URL("../components/docs/mintlify/layout/styles.css", import.meta.url), "utf8");
  assert.match(css, /\.store-docs \.store-mintlify-layout/);
  assert.match(css, /var\(--surface\)/);
  assert.match(css, /var\(--foreground\)/);
  assert.match(css, /var\(--border\)/);
  assert.match(css, /var\(--accent\)/);
  assert.match(css, /overflow-x:\s*auto/);
  assert.doesNotMatch(css, /color-item-button[^}]*background(?:-color)?\s*:/s);
  const selectorLines = css.split("\n").map((line) => line.trim()).filter((line) =>
    (line.endsWith("{") && !line.startsWith("@")) || line.endsWith(","),
  );
  for (const selector of selectorLines) assert.match(selector, /^\.store-docs\s/, `unscoped selector: ${selector}`);
});
