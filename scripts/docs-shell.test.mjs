import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { load } from "cheerio";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loadFixtureModule } from "./mintlify-test-utils.mjs";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const render = (component, props) => load(renderToStaticMarkup(React.createElement(component, props)));

test("floating TOCs preserve nested headings and render accessible closed triggers", async () => {
  const { OnThisPage, getTocEntries } = await loadFixtureModule("components/shell/OnThisPage.tsx");
  const items = [
    { depth: 2, title: "Run the example", url: "#run" },
    { depth: 3, title: React.createElement("a", { href: "/other" }, "Reading the output"), url: "#reading-the-output" },
    { depth: 5, title: "Details", url: "#details" },
    { depth: 2, title: "Next", url: "#next" },
  ];
  assert.deepEqual(getTocEntries(items), [
    { level: 1, title: "Run the example", url: "#run" },
    { level: 2, title: "Reading the output", url: "#reading-the-output" },
    { level: 3, title: "Details", url: "#details" },
    { level: 1, title: "Next", url: "#next" },
  ]);
  const $ = load(renderToStaticMarkup(React.createElement(React.Fragment, null,
    React.createElement(OnThisPage, { items, compact: true }),
    React.createElement(OnThisPage, { items }),
  )));
  assert.equal($("details, summary").length, 0);
  const triggers = $('[data-slot="floating-toc-trigger"]');
  assert.equal(triggers.length, 2);
  triggers.each((_, trigger) => {
    const scope = $(trigger);
    assert.equal(scope.attr("role"), "button");
    assert.equal(scope.attr("tabindex"), "0");
    assert.equal(scope.attr("aria-label"), "On this page");
    assert.equal(scope.attr("aria-expanded"), "false");
    assert.equal(scope.find('[data-slot="floating-toc-bar"]').length, items.length);
  });
});

test("short-page fallback remains a real page-title destination", async () => {
  const { OnThisPage, getTocEntries } = await loadFixtureModule("components/shell/OnThisPage.tsx");
  assert.equal(render(OnThisPage, { items: [] })("[data-slot=\"floating-toc-trigger\"]").length, 0);
  const $ = render(OnThisPage, { compact: true, items: [{ depth: 2, title: "Overview", url: "#page-title" }] });
  assert.equal($('[data-slot="floating-toc-bar"]').length, 1);
  assert.equal(getTocEntries([{ depth: 2, title: "Overview", url: "#page-title" }])[0].url, "#page-title");
  const page = await read("app/(docs)/docs/[[...slug]]/page.tsx");
  assert.match(page, /url: "#page-title"/);
  assert.match(page, /<h1 id="page-title"/);
  assert.ok(page.indexOf("<OnThisPage items={toc} compact />") < page.indexOf('<div id="content"'));
});

test("source attribution uses only known fork revisions and retains exact metadata", async () => {
  const { EmWithVerifiedCommit } = await loadFixtureModule("components/docs/LastVerified.tsx");
  const revisions = {
    c67a94ed: "c67a94ed30460a35161c2cbc3e725f127caf055e",
    a6a156e9: "a6a156e99db29cebf7da238263b007802bff2bfb",
    "539614c0": "539614c06be1a8f20dead562585e47394551ebae",
    be470620: "be47062070eba8f8a327279e9c5a68caa0ef06ca",
    c4fbaf4: "c4fbaf442f61a59c57f3d8dd98650b4066508d66",
    "5a8c956b": "5a8c956bc1dbd6ad838ea9da3b34c7d76c703a71",
  };
  for (const [short, full] of Object.entries(revisions)) {
    for (const hash of [short, full]) {
      const $ = render(EmWithVerifiedCommit, { children: `Last verified: 2026-08-16 · main @ ${hash}, pre-6.0.0-alpha01` });
      assert.equal($("a").attr("href"), `https://github.com/matt-ramotar/Store6/commit/${full}`);
      assert.ok($.text().includes(`Source recorded 2026-08-16 ·main@${hash}· pre-6.0.0-alpha01`));
      assert.ok(!$.text().includes("verified"));
    }
  }
  const unknown = render(EmWithVerifiedCommit, { children: "Last verified: 2026-08-16 · main @ deadbee, pre-6.0.0-alpha01" });
  assert.equal(unknown("a").length, 0);
  assert.ok(unknown.text().includes("main@deadbee"));
  const normal = render(EmWithVerifiedCommit, { children: "Ordinary emphasis", className: "example" });
  assert.equal(normal("em.example").text(), "Ordinary emphasis");
});

test("shell version destinations are preserved without implied release taxonomy", async () => {
  const { versionSwitcherItems } = await loadFixtureModule("lib/nav.ts");
  assert.deepEqual(versionSwitcherItems.map(({ id, href, name }) => ({ id, href, name })), [
    { id: "store6", href: "/docs/store6/overview", name: "Store 6" },
    { id: "store5", href: "/docs", name: "Store 5" },
  ]);
  assert.ok(versionSwitcherItems.every(item => !("badge" in item)));
  const { RightRail } = await loadFixtureModule("components/shell/RightRail.tsx");
  assert.equal(render(RightRail, { items: [] }).text(), "");
  const { Store6Banner } = await loadFixtureModule("components/shell/Store6Banner.tsx");
  assert.equal(render(Store6Banner, {})("[role=note]").text().trim(), "In development. Nothing in Store 6 is published yet.");
});

test("reading shell exposes one mobile search entry, a main skip target, and drawer dismissal", async () => {
  const nav = await read("components/shell/TopNav.tsx");
  assert.equal((nav.match(/<CommandSearch\b/g) ?? []).length, 1);
  assert.match(nav, /<CommandSearch version=\{version\} \/>/);
  assert.match(nav, /className="min-w-0 flex-1 sm:ms-3 sm:max-w-sm"/);
  const shell = await read("components/shell/AppShell.tsx");
  assert.match(shell, /href="#main-content"/);
  assert.match(shell, /<main id="main-content" tabIndex=\{-1\}/);
  const drawer = await read("components/shell/MobileNav.tsx");
  assert.match(drawer, /Sheet.CloseTrigger aria-label="Close documentation navigation"/);
  assert.match(drawer, /shouldAutoFocus/);
  assert.match(drawer, /motion-reduce:transition-none/);
});
