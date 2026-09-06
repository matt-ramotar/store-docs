import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loadFixtureModule } from "./mintlify-test-utils.mjs";

const family = await loadFixtureModule("components/docs/mintlify/disclosure/index.tsx");
const { Accordion, AccordionGroup, Expandable, Steps, Step, Tabs, Tab, Tree, TreeFile, TreeFolder } = family;
const render = (component, props, ...children) => renderToStaticMarkup(h(component, props, ...children));

test("compound members and standalone MDX aliases are identical", () => {
  assert.equal(Accordion.Group, AccordionGroup);
  assert.equal(Steps.Item, Step);
  assert.equal(Tabs.Item, Tab);
  assert.equal(Tree.File, TreeFile);
  assert.equal(Tree.Folder, TreeFolder);
});

test("accordion preserves legacy boolean/string initial states and URL ancestry", () => {
  for (const [value, open] of [[true, true], ["true", true], [false, false], ["false", false], [undefined, false]]) {
    const html = render(Accordion, { title: "Initial", defaultOpen: value }, "Panel");
    assert.equal(/<details[^>]* open=""/.test(html), open);
  }
  const calls = [];
  const html = render(Accordion, { title: "Parent", defaultOpen: true }, h(Accordion, {
    title: "Child", getInitialOpenFromUrl: (id, parents) => { calls.push([id, parents]); return true; },
  }, "Nested panel"));
  assert.deepEqual(calls, [["child", ["parent"]]]);
  assert.equal((html.match(/<details[^>]* open=""/g) ?? []).length, 2);
  const unicodeCalls = [];
  render(Accordion, { title: "Crème: brûlée & APIs", getInitialOpenFromUrl: (id) => { unicodeCalls.push(id); return false; } }, "Unicode title");
  assert.deepEqual(unicodeCalls, ["creme-brulee-and-apis"]);
});

test("expandable lazy rendering and unique summary-panel relationships", () => {
  assert.doesNotMatch(render(Expandable, { title: "Fields", lazy: true }, "Lazy body"), /Lazy body/);
  assert.match(render(Expandable, { title: "Fields", lazy: true, defaultOpen: true, openedText: "Collapse" }, "Lazy body"), /Collapse.*Fields/);
  const html = render("div", {}, h(Expandable, { title: "Same" }, "A"), h(Expandable, { title: "Same" }, "B"));
  const controls = [...html.matchAll(/aria-controls="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(controls).size, 2);
  for (const id of controls) assert.ok(html.includes(`id="${id}"`));
});

test("accordion repeated titles have unique IDs in server HTML and disabled semantics", () => {
  const html = render(AccordionGroup, {}, h(Accordion, { title: "Repeated", _disabled: true }, "First"), h(Accordion, { title: "Repeated" }, "Second"));
  const ids = [...html.matchAll(/(?:^|\s)id="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(ids.length, 4);
  assert.equal(new Set(ids).size, ids.length);
  for (const match of html.matchAll(/aria-(?:controls|labelledby)="([^"]+)"/g)) assert.ok(ids.includes(match[1]));
  assert.match(html, /aria-disabled="true" tabindex="-1"/);
});

test("tabs preserve initial selection, duplicate-label IDs, panel ref surface and all content", () => {
  const html = render(Tabs, { ariaLabel: "Backends", defaultTabIndex: 9 },
    h(Tab, { title: "Same" }, "First panel"), h(Tab, { title: "Same" }, "Second panel"));
  assert.match(html, /aria-label="Backends"/);
  assert.equal((html.match(/aria-selected="true"/g) ?? []).length, 1);
  assert.match(html, /aria-hidden="true"[^>]*>First panel/);
  assert.match(html, /aria-hidden="false"[^>]*>Second panel/);
  const ids = [...html.matchAll(/(?:^|\s)id="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length);
  assert.doesNotThrow(() => render(Tabs, {}, []));
});

test("steps keep heading sizes, explicit numbering, and nested list semantics", () => {
  const html = render(Steps, { titleSize: "h2" },
    h(Step, { title: "Outer", stepNumber: 7 }, h(Steps, { titleSize: "h3" }, h(Step, { title: "Nested" }, "Body"))),
    h(Step, { title: "End", titleSize: "h4" }, "Done"));
  assert.equal((html.match(/role="list"/g) ?? []).length, 2);
  assert.equal((html.match(/role="listitem"/g) ?? []).length, 3);
  assert.match(html, /<h2[^>]*>Outer<\/h2>/);
  assert.match(html, /<h3[^>]*>Nested<\/h3>/);
  assert.match(html, /<h4[^>]*>End<\/h4>/);
  assert.match(html, />7<\/div>/);
});

test("tree exposes open group ownership and omits closed or non-openable children", () => {
  const html = render(Tree, {},
    h(TreeFolder, { name: "Open", defaultOpen: true }, h(TreeFile, { name: "Visible.kt" })),
    h(TreeFolder, { name: "Closed" }, h(TreeFile, { name: "Hidden.kt" })),
    h(TreeFolder, { name: "Unavailable", openable: false, defaultOpen: true }, h(TreeFile, { name: "Unavailable.kt" })));
  assert.match(html, /role="tree"/);
  assert.match(html, /aria-expanded="true"[^>]*aria-owns="tree-group-/);
  assert.match(html, /aria-level="2"/);
  assert.match(html, /Visible.kt/);
  assert.doesNotMatch(html, /Hidden.kt|Unavailable.kt/);
  assert.equal((html.match(/aria-expanded=/g) ?? []).length, 2);
});

test("every disclosure fixture is stable, documented, and executable", async () => {
  const { fixtures } = await loadFixtureModule("components/docs/mintlify/disclosure/fixtures.tsx");
  assert.equal(fixtures.length, 5);
  assert.equal(new Set(fixtures.map((fixture) => fixture.id)).size, fixtures.length);
  for (const fixture of fixtures) {
    assert.ok(fixture.name && fixture.description && fixture.assertions.length >= 3);
    assert.ok(renderToStaticMarkup(fixture.render()).length > 0, fixture.id);
  }

  const byId = Object.fromEntries(fixtures.map((fixture) => [fixture.id, renderToStaticMarkup(fixture.render())]));
  assert.match(byId["c2-expandable"], /data-fixture-events="expandable-session"/);
  assert.match(byId["c2-expandable"], /Stored session state:.*unread/s);
  assert.match(byId["c2-expandable"], /Reset session fixture and reload/);
  assert.match(byId["c2-expandable"], /Reload session fixture/);
  assert.match(byId["c2-steps"], /id="c2-step-callbacks"/);
  assert.match(byId["c2-steps"], /Unmount callback step/);
  assert.match(byId["c2-steps"], /data-fixture-events="steps"/);
  assert.match(byId["c2-tabs"], /Selected index:.*1.*Panels ref:.*pending/s);
  assert.match(byId["c2-tree"], /data-fixture-events="tree"/);
  assert.match(byId["c2-tree"], /Focused:.*none.*Open folders:.*src, commonMain/s);
});
