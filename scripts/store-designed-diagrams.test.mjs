import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { load } from "cheerio";
import { renderToStaticMarkup } from "react-dom/server";
import { loadFixtureModule } from "./mintlify-test-utils.mjs";

const ROOT = resolve(import.meta.dirname, "..");
const ROUTES = {
  "/docs/best-practices/store5/single-or-multiple-stores": ["single-or-multiple-stores", "independent-stores"],
  "/docs/store6/guides/extending": ["extension-lifecycle", "extension-lifecycle-rollback"],
  "/docs/store6/guides/persistence": ["persistence-read-path"],
  "/docs/store6/migration/from-store5": ["store5-migration"],
  "/docs/store6/mutations/aliases": ["alias-activation"],
  "/docs/store6/mutations/drain-and-restart": ["namespace-ownership"],
  "/docs/store6/mutations/server": ["server-outcomes", "server-recovery"],
};
const IDS = Object.values(ROUTES).flat().sort();
const [{ storeDiagramIds, loadStoreDiagram }, { StoreDiagram }] = await Promise.all([
  loadFixtureModule("lib/store-diagrams.ts"),
  loadFixtureModule("components/docs/diagrams/StoreDiagram.tsx"),
]);
const read = (path) => readFileSync(resolve(ROOT, path), "utf8");
const artifact = (id) => load(read(`public/diagrams/${id}.html`));
const words = ($, selector) => $(selector).map((_, element) => $(element).text()).get().join(" ").replace(/\s+/g, " ");

function assertAccessibleSvg($, svg, prefix) {
  assert.equal(svg.attr("role"), "img", prefix);
  assert.equal(svg.children().first().prop("tagName").toLowerCase(), "title", prefix);
  assert.ok(svg.children("title").text().trim(), prefix);
  assert.ok(svg.children("desc").text().trim(), prefix);
  const identities = svg.find("[id]").addBack("[id]").map((_, element) => $(element).attr("id")).get();
  assert.equal(new Set(identities).size, identities.length, `${prefix}: duplicate SVG IDs`);
  for (const id of identities) assert.ok(id.startsWith(`${prefix}-`), `${prefix}: unprefixed ${id}`);
  const labelledBy = svg.attr("aria-labelledby")?.split(/\s+/) ?? [];
  assert.deepEqual(labelledBy, [svg.children("title").attr("id"), svg.children("desc").attr("id")]);
  svg.find("*").addBack().each((_, element) => {
    for (const [name, value] of Object.entries(element.attribs ?? {})) {
      assert.doesNotMatch(name, /^on/i, `${prefix}: event handler`);
      const refs = [...value.matchAll(/url\(["']?#([^)'"\s]+)["']?\)/g)].map((match) => match[1]);
      if (/^aria-(?:labelledby|describedby)$/.test(name)) refs.push(...value.split(/\s+/));
      if (/^(?:xlink:)?href$/.test(name) && value.startsWith("#")) refs.push(value.slice(1));
      for (const ref of refs) assert.ok(identities.includes(ref), `${prefix}: unresolved ${ref}`);
    }
  });
}

test("all seven authored diagram routes use the ten reviewed standalone figures", () => {
  assert.deepEqual([...storeDiagramIds].sort(), IDS);
  assert.deepEqual(readdirSync(resolve(ROOT, "public/diagrams")).filter((name) => name.endsWith(".html")).sort(), IDS.map((id) => `${id}.html`).sort());
  const authored = {};
  for (const file of readdirSync(resolve(ROOT, "content/docs"), { recursive: true }).filter((name) => name.endsWith(".mdx"))) {
    const source = read(`content/docs/${file}`);
    assert.doesNotMatch(source, /^\s*```mermaid\b|<Mermaid\b/m, file);
    assert.doesNotMatch(source, /single-or-multiple-stores-light\.svg|memory\s*-->\s*SourceOfTruth\.reader|success:\s*transaction open\s*→/, file);
    const ids = [...source.matchAll(/<StoreDiagram\s+id="([^"]+)"\s*\/>/g)].map((match) => match[1]);
    if (ids.length) authored[`/docs/${file.replace(/\.mdx$/, "")}`] = ids;
  }
  assert.deepEqual(authored, ROUTES);
});

test("every standalone diagram is accessible, static, and self-contained", () => {
  for (const id of IDS) {
    const $ = artifact(id);
    assert.equal($("svg").length, 1, id);
    assertAccessibleSvg($, $("svg"), id);
    assert.equal($("script, img, image, iframe, object, embed, foreignObject, link[rel=stylesheet]").length, 0, id);
    assert.doesNotMatch($("style").text(), /@import|url\(\s*["']?(?:https?:|\/\/)/i, id);
    $("[href], [src]").each((_, element) => {
      const ref = $(element).attr("href") ?? $(element).attr("src");
      assert.match(ref, /^(?:#|\/diagrams\/[^/]+\.html$)/, `${id}: external dependency ${ref}`);
    });
  }
});

test("the loader rejects unknown names and traversal before reading any file", async () => {
  for (const id of ["unknown", "../package", "../../package.json", "/etc/passwd", ""]) {
    await assert.rejects(loadStoreDiagram(id), /Unknown Store diagram:/);
  }
  const known = await loadStoreDiagram("persistence-read-path");
  assert.match(known.svg, /^<svg\b/);
  assert.ok(known.title && known.description);
});

test("server-rendered figures expose their SVG, scroll region, caption, and full-size link", async () => {
  for (const id of IDS) {
    const $ = load(renderToStaticMarkup(await StoreDiagram({ id })));
    const figure = $(`figure[data-diagram="${id}"]`);
    assert.equal(figure.length, 1, id);
    assertAccessibleSvg($, figure.find("svg"), id);
    assert.equal(figure.find('[role="region"][tabindex="0"][aria-label]').length, 1, id);
    assert.ok(figure.find("figcaption").text().trim(), id);
    assert.equal(figure.find(`a[href="/diagrams/${id}.html"][aria-label]`).length, 1, id);
    assert.equal(figure.find('[role="status"], [aria-busy="true"]').length, 0, id);
  }
});

// Read authored connector endpoints rather than pinning coordinates. This catches
// swapped Yes/No branches even when every question and outcome label is retained.
function pathPoints(path) {
  const tokens = path.match(/[MHVLQ]|-?\d+(?:\.\d+)?/g) ?? [];
  const points = [];
  let current = [0, 0];
  for (let index = 0; index < tokens.length;) {
    const command = tokens[index++];
    if (command === "M" || command === "L") current = [+tokens[index++], +tokens[index++]];
    else if (command === "H") current = [+tokens[index++], current[1]];
    else if (command === "V") current = [current[0], +tokens[index++]];
    else if (command === "Q") {
      points.push([+tokens[index++], +tokens[index++]]);
      current = [+tokens[index++], +tokens[index++]];
    } else assert.fail(`Unsupported connector command: ${command}`);
    points.push(current);
  }
  return points;
}

function nodeBounds($, element) {
  const polygon = $(element).find("polygon").first();
  if (polygon.length) {
    const coordinates = polygon.attr("points").match(/-?\d+(?:\.\d+)?/g).map(Number);
    const xs = coordinates.filter((_, index) => index % 2 === 0);
    const ys = coordinates.filter((_, index) => index % 2 === 1);
    return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
  }
  const rect = $(element).find("rect").first();
  const x = +rect.attr("x"), y = +rect.attr("y");
  return [x, y, x + +rect.attr("width"), y + +rect.attr("height")];
}

function distanceToPath(point, points) {
  return Math.min(...points.slice(1).map((end, index) => {
    const start = points[index], dx = end[0] - start[0], dy = end[1] - start[1];
    const fraction = Math.max(0, Math.min(1, ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / (dx * dx + dy * dy || 1)));
    return Math.hypot(point[0] - start[0] - fraction * dx, point[1] - start[1] - fraction * dy);
  }));
}

function decisionBranches(id) {
  const $ = artifact(id);
  const names = [
    ["coupling", /Are your data sources.*tightly coupled/i], ["atomic", /require atomic updates/i],
    ["complexity", /single store less complex/i], ["caching", /caching strategies/i],
    ["errors", /error handling important/i], ["future", /more data sources.*future/i],
    ["repository", /repository layer feasible/i], ["single", /^Use a single store$/i],
    ["multiple", /^Use multiple stores$/i], ["independent", /^Independent sources/i],
  ];
  const nodes = $("[data-node]").toArray().map((element) => {
    const label = $(element).attr("data-node");
    const name = names.find(([, pattern]) => pattern.test(label))?.[0];
    assert.ok(name, `${id}: unclassified node ${label}`);
    return { name, bounds: nodeBounds($, element) };
  });
  const endpoint = ([x, y]) => {
    const matching = nodes.filter(({ bounds: [left, top, right, bottom] }) => x >= left && x <= right && y >= top && y <= bottom);
    assert.equal(matching.length, 1, `${id}: connector endpoint ${x},${y}`);
    return matching[0].name;
  };
  const edges = $(".dd-edge[marker-end]").toArray().map((element) => {
    const points = pathPoints($(element).attr("d"));
    return { points, from: endpoint(points[0]), to: endpoint(points.at(-1)), labels: [] };
  });
  $("[data-label]").each((_, element) => {
    const label = $(element).attr("data-label");
    assert.match(label, /^(YES|NO)$/);
    const text = $(element).find("text").first();
    const point = [+text.attr("x"), +text.attr("y")];
    [...edges].sort((a, b) => distanceToPath(point, a.points) - distanceToPath(point, b.points))[0].labels.push(label);
  });
  return edges.map(({ from, to, labels }) => {
    assert.equal(labels.length, 1, `${id}: ${from} → ${to} needs one branch label`);
    return `${from}:${labels[0]}->${to}`;
  });
}

test("the split Store 5 decision diagrams preserve every Yes/No outcome", () => {
  assert.deepEqual([...decisionBranches("single-or-multiple-stores"), ...decisionBranches("independent-stores")].sort(), [
    "coupling:YES->atomic", "coupling:NO->independent", "atomic:YES->single", "atomic:NO->complexity",
    "complexity:YES->single", "complexity:NO->multiple", "caching:YES->multiple", "caching:NO->errors",
    "errors:YES->multiple", "errors:NO->future", "future:YES->multiple", "future:NO->repository",
    "repository:YES->multiple", "repository:NO->single",
  ].sort());
  const source = read("content/docs/best-practices/store5/single-or-multiple-stores.mdx");
  assert.doesNotMatch(source, /Green paths represent|Red paths represent/);
});

test("mutation diagrams retain durable boundaries, same-generation replay, and sanctioned conflict", () => {
  const alias = artifact("alias-activation");
  const messages = ($) => $('[data-message="true"]').toArray().map((element) => words($, $(element).find("text")));
  const expectedAlias = [/mutate\(/, /push\(provisional/, /PresentAck/, /ACKED receipt.*PENDING alias/, /adopt authoritative.*echo/, /finish declared.*invalidation effects/, /retire intent.*alias ACTIVE/, /existing stream.*canonical delegate/];
  assert.equal(messages(alias).length, expectedAlias.length);
  messages(alias).forEach((label, index) => assert.match(label, expectedAlias[index]));
  const outcomes = artifact("server-outcomes");
  assert.match(words(outcomes, "text"), /backend accepts.*precondition conflict/);
  assert.match(words(outcomes, "text"), /Present or Absent acknowledgement/);
  assert.match(words(outcomes, "text"), /sanctioned throw: StoreResults\.conflict/);
  const recovery = artifact("server-recovery");
  assert.match(words(recovery, "text"), /Recovery may repeat local work, never push g/);
  assert.match(words(recovery, "text"), /Last durable phase remains INFLIGHT/);
  const recovered = messages(recovery);
  assert.equal(messages(outcomes).length + recovered.length, 14);
  [/persist complete receipt.*ACKED/, /adopt echo, apply effects,.*retire intent/, /later drain replays.*generation g and key k/, /duplicate request.*g and k/, /same authoritative result/, /same acknowledgement/, /persist complete receipt.*ACKED/, /resume adoption, effects,.*retirement/].forEach((pattern, index) => assert.match(recovered[index], pattern));
  const engine = recovery('[data-node="Mutation engine"]').first();
  const [left, , right] = nodeBounds(recovery, engine);
  recovery('[data-message="true"]').slice(0, 2).each((_, element) => {
    const points = pathPoints(recovery(element).find(".dd-edge").first().attr("d"));
    assert.equal(points[0][0], (left + right) / 2);
    assert.equal(points.at(-1)[0], (left + right) / 2, "ACKED recovery must remain local work");
  });
});

test("built documentation includes all ten diagrams before client JavaScript", () => {
  for (const [route, ids] of Object.entries(ROUTES)) {
    const $ = load(read(`.next/server/app${route}.html`));
    assert.deepEqual($("#content figure[data-diagram]").map((_, element) => $(element).attr("data-diagram")).get(), ids, route);
    for (const id of ids) assertAccessibleSvg($, $(`figure[data-diagram="${id}"] svg`), id);
    const identities = $("#content svg [id]").map((_, element) => $(element).attr("id")).get();
    assert.equal(new Set(identities).size, identities.length, `${route}: duplicate inline SVG IDs`);
    assert.equal($('#content [data-language="mermaid"], #content [data-component-part="mermaid"]').length, 0, route);
  }
});
