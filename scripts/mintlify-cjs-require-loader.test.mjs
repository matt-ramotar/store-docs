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
  assert.match(output, /typeof __cjs_o\.__require === "function"/);
  assert.doesNotMatch(output, /import \{ __require as o \}/);
  assert.match(output, /var t = o\(\);/);
});

test("mintlify CJS loader leaves files without __require unchanged", () => {
  const input = 'export const ok = true;\n';
  assert.equal(loader(input), input);
});
