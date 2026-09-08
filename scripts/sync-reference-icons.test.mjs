import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";
import { Script } from "node:vm";
import { load } from "cheerio";
import { Search01Icon } from "@hugeicons/core-free-icons";
import {
  dokkaRuntimeReplacements, patchDokkaRuntime, referenceIconAssets,
  renderReferenceIcon, syncReferenceIcons,
} from "./sync-reference-icons.mjs";

const root = resolve(import.meta.dirname, "..");
const contract = JSON.parse(await readFile(join(root, "scripts/fixtures/reference-theme/dokka-icon-contract.json"), "utf8"));
const generatedRuntime = await readFile(join(root, "public/reference/store6-core/scripts/main.js"), "utf8");

function stockRuntime() {
  let source = generatedRuntime;
  for (const [before, after] of dokkaRuntimeReplacements()) source = source.replace(after, before);
  assert.equal(createHash("sha256").update(source).digest("hex"), contract.stockRuntimeSha256);
  return source;
}

async function withFixture(run) {
  const fixture = await mkdtemp(join(tmpdir(), "store-reference-icons-"));
  try {
    for (const slug of ["store6-core", "store6-mutations"]) {
      const moduleRoot = join(fixture, "public/reference", slug);
      await mkdir(join(moduleRoot, "images"), { recursive: true });
      await mkdir(join(moduleRoot, "scripts"), { recursive: true });
      for (const name of Object.keys(referenceIconAssets)) {
        await writeFile(join(moduleRoot, "images", name), '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0"/></svg>');
      }
      await writeFile(join(moduleRoot, "images/logo-icon.svg"), '<svg data-brand="Store"><path d="M1 1"/></svg>');
      await writeFile(join(moduleRoot, "diagram.html"), '<svg data-diagram="sequence"><path d="M2 2"/></svg>');
      await writeFile(join(moduleRoot, "scripts/main.js"), stockRuntime());
    }
    await run(fixture);
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
}

test("checked-in reference assets and runtime are fully regenerated", async () => {
  assert.deepEqual(await syncReferenceIcons({ root, check: true }), {
    modules: 2, svgAssets: 60, runtimeIcons: 16, filesChanged: 0,
  });
});

test("SVG serialization uses Hugeicons geometry and preserves external-image color and dimensions", () => {
  const $ = load(renderReferenceIcon("Search01Icon", 16, "white"), { xmlMode: true });
  assert.equal($("svg").attr("viewBox"), "0 0 24 24");
  assert.equal($("svg").attr("width"), "16");
  assert.equal($("svg").attr("height"), "16");
  assert.equal($("svg").attr("fill"), "none");
  assert.deepEqual($("path").map((_, element) => $(element).attr("d")).get(), Search01Icon.map(([, props]) => props.d));
  assert.ok($("path").toArray().every(element => $(element).attr("stroke") === "white"));
  assert.ok($("path").toArray().every(element => $(element).attr("stroke-width") === "1.5"));
  assert.equal($("[key], [strokeWidth], [strokeLinecap]").length, 0);
});

test("runtime patch changes only reviewed icon sources, includes all search/loading icons, and stays valid JavaScript", () => {
  const source = stockRuntime();
  const patched = patchDokkaRuntime(source);
  assert.equal(patched, generatedRuntime);
  assert.equal(patchDokkaRuntime(patched), patched);
  assert.doesNotThrow(() => new Script(patched));
  for (const [before, after] of dokkaRuntimeReplacements()) {
    assert.equal(patched.split(after).length - 1, 1);
    assert.equal(patched.includes(before), false);
  }
  const svgExports = [...patched.matchAll(/\d+:e=>\{e.exports='(<svg[\s\S]*?<\/svg>)'\}/g)];
  assert.equal(svgExports.length, 6);
  for (const [, svg] of svgExports) assert.match(svg, /data-hugeicon="/);
  assert.match(patched, /"data-hugeicon":"Search01Icon"/);
  assert.match(patched, /data-hugeicon%3D%22Loading03Icon%22/);
  assert.throws(() => patchDokkaRuntime(`${source}\nalert('unexpected runtime');`), /Dokka runtime changed/);
  assert.throws(() => patchDokkaRuntime(patched.replace('"data-hugeicon":"Search01Icon"', '"data-hugeicon":"OtherIcon"')), /Dokka runtime changed/);
});

test("fresh Dokka output migrates deterministically and leaves logos and diagrams byte-identical", async () => {
  await withFixture(async fixture => {
    const brand = join(fixture, "public/reference/store6-core/images/logo-icon.svg");
    const diagram = join(fixture, "public/reference/store6-core/diagram.html");
    const originalBrand = await readFile(brand, "utf8");
    const originalDiagram = await readFile(diagram, "utf8");
    await assert.rejects(syncReferenceIcons({ root: fixture, check: true }), /need regeneration/);
    assert.equal((await syncReferenceIcons({ root: fixture })).filesChanged, 62);
    assert.equal((await syncReferenceIcons({ root: fixture })).filesChanged, 0);
    assert.equal((await syncReferenceIcons({ root: fixture, check: true })).filesChanged, 0);
    assert.equal(await readFile(brand, "utf8"), originalBrand);
    assert.equal(await readFile(diagram, "utf8"), originalDiagram);
  });
});

test("unfamiliar Dokka icons or vendor changes stop regeneration before writing either module", async () => {
  for (const change of ["icon", "runtime"]) {
    await withFixture(async fixture => {
      const untouched = join(fixture, "public/reference/store6-core/images/copy-icon.svg");
      const original = await readFile(untouched, "utf8");
      const changedModule = join(fixture, "public/reference/store6-mutations");
      if (change === "icon") await writeFile(join(changedModule, "images/new-icon.svg"), "<svg/>");
      else await writeFile(join(changedModule, "scripts/main.js"), `${stockRuntime()}\n/* changed vendor */`);
      await assert.rejects(syncReferenceIcons({ root: fixture }), /Dokka (icon inventory|runtime) changed/);
      assert.equal(await readFile(untouched, "utf8"), original);
    });
  }
});
