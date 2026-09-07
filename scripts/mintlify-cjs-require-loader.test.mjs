import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const loader = require("../lib/mintlify-cjs-require-loader.cjs");

test("mintlify CJS loader rewrites Vite __require imports to the named namespace export", () => {
  const input = `import { getDefaultExportFromCjs as r } from "./_commonjsHelpers.js";
import { __require as o } from "../node_modules/.pnpm/lodash@4.18.1/node_modules/lodash/isEqual.js";
var t = o();
`;
  const output = loader(input);
  assert.match(output, /import \* as __cjs_o from "\.\.\/node_modules\/\.pnpm\/lodash@4\.18\.1\/node_modules\/lodash\/isEqual\.js";/);
  assert.match(output, /typeof Reflect\.get\(__cjs_o, "__require"\) === "function"/);
  assert.doesNotMatch(output, /import \{ __require as o \}/);
  assert.match(output, /var t = o\(\);/);
});

test("mintlify CJS loader leaves files without __require unchanged", () => {
  const input = 'export const ok = true;\n';
  assert.equal(loader(input), input);
});

// Real CommonJS packages do not all expose Vite's synthetic named export.
test("loader resolves Vite, default CommonJS, and named CommonJS namespaces", () => {
  const output = loader('import { __require as r } from "fixture";\nreturn r();');
  const run = new Function("__cjs_r", output.replace(/import \* as __cjs_r from "fixture";/, ""));
  assert.equal(run({__require: () => "vite"}), "vite");
  const callable = () => "dayjs";
  assert.equal(run({default: callable}), callable);
  const namespace = {sanitizeUrl: value => value};
  assert.equal(run(namespace), namespace);
});
