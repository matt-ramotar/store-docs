"use strict";

/**
 * Vite writes CJS interop into @mintlify/components as:
 *   import { __require as o } from "lodash/isEqual.js";
 *   var t = o();
 * Turbopack treats `__require` as a named ESM export, which those packages
 * do not provide. Rewrite it to a default/namespace import.
 */
module.exports = function mintlifyCjsRequireLoader(source) {
  const code = Buffer.isBuffer(source) ? source.toString("utf8") : source;
  if (typeof code !== "string" || !code.includes("__require")) return code;
  return code.replace(
    /import\s+\{\s*__require\s+as\s+(\w+)\s*\}\s+from\s+["']([^"']+)["'];/g,
    'import * as __cjs_$1 from "$2";\nconst $1 = () => ("default" in __cjs_$1 && __cjs_$1.default !== undefined ? __cjs_$1.default : __cjs_$1);',
  );
};
