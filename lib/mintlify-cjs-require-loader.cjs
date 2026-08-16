"use strict";

/**
 * Vite writes CJS interop into @mintlify/components as:
 *   import { __require as o } from "...";
 *   var t = o();
 * Turbopack treats `__require` as a Node createRequire helper instead of the
 * named export Vite emitted. Rewrite to a namespace import and call that
 * export when it exists.
 */
module.exports = function mintlifyCjsRequireLoader(source) {
  const code = Buffer.isBuffer(source) ? source.toString("utf8") : source;
  if (typeof code !== "string" || !code.includes("__require")) return code;
  return code.replace(
    /import\s+\{\s*__require\s+as\s+(\w+)\s*\}\s+from\s+["']([^"']+)["'];/g,
    (
      _,
      alias,
      spec,
    ) => `import * as __cjs_${alias} from "${spec}";
const ${alias} = typeof __cjs_${alias}.__require === "function" ? __cjs_${alias}.__require : () => ("default" in __cjs_${alias} && __cjs_${alias}.default !== undefined ? __cjs_${alias}.default : __cjs_${alias});`,
  );
};
