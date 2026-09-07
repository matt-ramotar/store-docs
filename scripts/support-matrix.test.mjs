import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { load } from "cheerio";
import { loadFixtureModule } from "./mintlify-test-utils.mjs";
const { SupportMatrix } = await loadFixtureModule("components/overview/SupportMatrix.tsx");
const $ = load(renderToStaticMarkup(React.createElement(SupportMatrix)));
test("responsive module list preserves every module, tier and release", () => {
  const rows = $('ul[aria-label="Modules"] > li');
  assert.deepEqual(rows.map((_,e)=>$(e).attr('id')).get(), ['store6-core','store6-testing','store6-mutations','store6-compose','store6-sqldelight','store6-room','store6-devtools','store6-devtools-inspector']);
  assert.deepEqual(rows.map((_,e)=>$(e).find('dd').first().text()).get(), ['alpha01','alpha01','alpha01','alpha01, may slip one alpha','alpha01, may slip one alpha','alpha01, may slip one alpha','alpha02 (target)','alpha02 (target)']);
  assert.equal(rows.filter((_,e)=>$(e).text().includes('Stable track')).length,1);
  assert.equal(rows.filter((_,e)=>$(e).text().includes('Experimental')).length,7);
  assert.match($('#store6-core').text(), /not frozen until the beta01 freeze candidate/);
});
test("target groups remain associated while storage exceptions stay in their rows", () => {
  assert.equal($('#canonical-targets').length,1);
  assert.equal($('#inspector-targets').length,1);
  assert.match($('#canonical-targets').text(), /iosX64.*watchosArm64.*mingwX64/);
  assert.match($('#inspector-targets').text(), /Inspector 8:.*macosArm64, JS, and WasmJS/);
  assert.match($('#store6-sqldelight').text(), /Drivers run on Android, JVM, Apple, Linux, and Windows\. JS and Wasm are compile-only/);
  assert.equal($('#store6-room dd').last().text(),'Android, JVM, iosArm64, iosSimulatorArm64, macosArm64, watchosArm64, tvosArm64, and linuxX64.');
  $('dd[aria-describedby],li[aria-describedby]').each((_,e)=>assert.equal($('#'+$(e).attr('aria-describedby')).length,1));
  assert.deepEqual($('a').map((_,e)=>$(e).attr('href')).get(),['/docs/store6/stability','/docs/store6/concepts/api-tiers','/reference/store6-core/index.html']);
  assert.equal($('table,[class*="760px"]').length,0);
});
