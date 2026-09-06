import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement as h, Children, isValidElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loadFixtureModule } from "./mintlify-test-utils.mjs";

const { Mermaid, ZoomControls } = await loadFixtureModule("components/docs/mintlify/diagrams/index.tsx");
const { diagramConfig, hasAuthoredTheme, namespaceSvgIds, createRenderQueue } = await loadFixtureModule("components/docs/mintlify/diagrams/rendering.ts");

test("default Mermaid theme resolves Tidal tokens while authored configuration keeps authority", () => {
  const config = diagramConfig("flowchart LR\nA --> B");
  assert.equal(config.theme, "base");
  assert.equal(config.themeVariables.primaryColor, "#E3F0E9");
  assert.equal(config.themeVariables.textColor, "#172C2A");
  assert.equal(config.themeVariables.lineColor, "#596A65");
  assert.equal(config.startOnLoad, false);
  for (const chart of ['%%{init: {"theme": "dark"}}%%\nflowchart LR\nA-->B', "---\nconfig:\n  theme: forest\n---\nflowchart LR\nA-->B"]) {
    assert.ok(hasAuthoredTheme(chart));
    assert.equal(diagramConfig(chart).themeVariables, undefined);
  }
  assert.equal(hasAuthoredTheme('flowchart LR\n A["theme: dark"]'), false);
  assert.equal(hasAuthoredTheme('%%{init: {"themeVariables": {"primaryColor": "#F00"}}}%%\nflowchart LR\nA-->B'), false);
});

test("SVG identities and references are isolated without rewriting authored colors or data IDs", () => {
  const svg = '<svg id="chart" aria-labelledby="title description"><style>#chart .node{fill:#fff}#fff{stroke:#ABCDEF}.edge{marker-end:url(#arrow)}</style><title id="title">Chart</title><desc id="description">Desc</desc><marker id="arrow"/><g id="fff" data-id="author-node" fill="#fff"><path marker-end="url(#arrow)"/><a href="#fff">Node</a><use xlink:href="#fff"/></g></svg>';
  const first = namespaceSvgIds(svg, "first");
  const second = namespaceSvgIds(svg, "second");
  assert.match(first, /id="first-chart" aria-labelledby="first-title first-description"/);
  assert.match(first, /#first-chart \.node\{fill:#fff\}#first-fff\{stroke:#ABCDEF\}/);
  assert.match(first, /url\(#first-arrow\)/);
  assert.match(first, /href="#first-fff"/);
  assert.match(first, /data-id="author-node" fill="#fff"/);
  const ids = [...`${first}${second}`.matchAll(/(?:^|\s)id="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length);
});

test("render queue prevents overlapping singleton config transactions and recovers after failure", async () => {
  const queue = createRenderQueue();
  const events = [];
  let release;
  const pending = new Promise((resolve) => { release = resolve; });
  const first = queue(async () => { events.push("initialize:first"); await pending; events.push("render:first"); });
  const second = queue(async () => { events.push("initialize:second"); throw new Error("Invalid chart"); });
  const third = queue(async () => { events.push("initialize:third"); return "valid"; });
  const rejected = assert.rejects(second, /Invalid chart/);
  await Promise.resolve();
  assert.deepEqual(events, ["initialize:first"]);
  release();
  await first;
  await rejected;
  assert.equal(await third, "valid");
  assert.deepEqual(events, ["initialize:first", "render:first", "initialize:second", "initialize:third"]);
});

test("Mermaid SSR exposes names/loading and declared explicit versus automatic action states", () => {
  const disabled = renderToStaticMarkup(h(Mermaid, { chart: "flowchart LR\nA-->B", actions: false, ariaLabel: "Read path" }));
  assert.match(disabled, /aria-label="Read path" aria-busy="true"/);
  assert.match(disabled, /role="status">Rendering diagram/);
  assert.doesNotMatch(disabled, /data-component-part="zoom-controls"/);
  const automatic = renderToStaticMarkup(h(Mermaid, { chart: "flowchart LR\nA-->B" }));
  assert.doesNotMatch(automatic, /data-component-part="zoom-controls"/);
  for (const placement of ["top-left", "top-right", "bottom-left", "bottom-right"]) {
    const html = renderToStaticMarkup(h(Mermaid, { chart: "flowchart LR\nA-->B", actions: true, placement }));
    assert.ok(html.includes(`data-placement="${placement}"`));
    assert.equal((html.match(/<button /g) ?? []).length, 7);
  }
});

test("public zoom controls retain all seven accessible actions and callback direction values", () => {
  const calls = [];
  const props = {
    onZoomIn: () => calls.push("in"), onZoomOut: () => calls.push("out"), onReset: () => calls.push("reset"),
    onPan: (x, y) => calls.push([x, y]), panStep: 50, placement: "bottom-right",
  };
  // Invoke only this stateless control tree; browser keyboard dispatch remains a separate check.
  const actions = [];
  function visit(element) {
    if (!isValidElement(element)) return;
    if (typeof element.type === "function") return visit(element.type(element.props));
    if (element.type === "button") actions.push(element.props);
    Children.forEach(element.props.children, visit);
  }
  visit(h(ZoomControls, props));
  assert.deepEqual(actions.map((action) => action["aria-label"]), ["Pan up", "Zoom in", "Pan left", "Reset view", "Pan right", "Pan down", "Zoom out"]);
  actions.forEach((action) => { assert.equal(action.type, "button"); action.onClick(); });
  assert.deepEqual(calls, [[0, 50], "in", [50, 0], "reset", [-50, 0], [0, -50], "out"]);
});

test("all diagram fixtures have stable metadata and render actual client boundaries", async () => {
  const { fixtures } = await loadFixtureModule("components/docs/mintlify/diagrams/fixtures.tsx");
  assert.equal(fixtures.length, 5);
  assert.equal(new Set(fixtures.map((fixture) => fixture.id)).size, 5);
  for (const fixture of fixtures) {
    assert.ok(fixture.name && fixture.description && fixture.assertions.length >= 4);
    const html = renderToStaticMarkup(fixture.render());
    assert.ok(html.includes("store-diagrams"), fixture.id);
  }
  const panZoom = renderToStaticMarkup(fixtures.at(-1).render());
  assert.match(panZoom, /data-pan-step="50"/);
  assert.match(panZoom, /data-fixture-transform="">translate\(0px, 0px\) scale\(1\)/);
  assert.match(panZoom, /data-fixture-transition="">transform 0.15s ease-out/);
});

test("C6 interaction fixture binds all keyboard actions, both zoom limits, and live motion changes", async () => {
  const { fixtures } = await loadFixtureModule("components/docs/mintlify/diagrams/fixtures.tsx");
  const fixture = fixtures.find(({ id }) => id === "c6-pan-zoom");
  const contract = fixture.assertions.join("\n");
  for (const action of ["Pan up", "Zoom in", "Pan left", "Reset view", "Pan right", "Pan down", "Zoom out"]) {
    assert.match(contract, new RegExp(action));
  }
  assert.match(contract, /clamps at 4/);
  assert.match(contract, /clamps at 0\.25/);
  assert.match(contract, /prefers-reduced-motion to reduce/);
  assert.match(contract, /changing it back restores transform 0\.15s ease-out/);
  assert.match(contract, /Enter and Space/);
});
