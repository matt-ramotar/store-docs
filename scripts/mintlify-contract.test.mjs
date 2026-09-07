import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { loadFixtureModule } from "./mintlify-test-utils.mjs";

const entry = readFileSync(new URL("../node_modules/@mintlify/components/dist/index.js", import.meta.url), "utf8");
const runtimeNames = [...entry.split("export {")[1].matchAll(/\bas (\w+)\s*[,\n]/g)].map(match => match[1]);
const componentNames = runtimeNames.filter(name => /^[A-Z][a-z]/.test(name));
const compoundNames = ["Accordion.Group", "Steps.Item", "Tabs.Item", "Tree.File", "Tree.Folder", "Color.Row", "Color.Item"];

test("installed package runtime census remains 42 components and 12 utilities", () => {
  assert.equal(componentNames.length, 42);
  assert.equal(runtimeNames.length - componentNames.length, 12);
});

test("compatibility runtime preserves every package runtime import and compound member", async () => {
  const runtime = await loadFixtureModule("components/docs/mintlify-runtime.tsx");
  for (const name of runtimeNames) assert.ok(runtime[name], `missing runtime export ${name}`);
  for (const path of compoundNames) {
    const [name, member] = path.split(".");
    assert.ok(runtime[name][member], `missing compound member ${path}`);
  }
});

test("production MDX map exposes every component and compound while caller overrides win", async () => {
  const { getMDXComponents } = await loadFixtureModule("mdx-components.tsx");
  const map = getMDXComponents();
  for (const name of componentNames) assert.ok(map[name], `missing MDX component ${name}`);
  for (const path of compoundNames) {
    const [name, member] = path.split(".");
    assert.ok(map[name][member], `missing MDX compound member ${path}`);
  }
  for (const name of ["AccordionGroup", "CardGroup", "Step", "Tab", "StepsGroup", "StepItem", "TabGroup", "TabPanel", "ParamList", "ParamField"]) assert.ok(map[name], `missing local alias ${name}`);
  const override = () => null;
  const overridden = getMDXComponents({ Card: override, pre: override });
  assert.equal(overridden.Card, override);
  assert.equal(overridden.pre, override);
});
