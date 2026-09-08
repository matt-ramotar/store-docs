"use strict";

const path = require("node:path");

const bundledLucideIcons = Object.freeze({
  "arrow-up-right": "ArrowUpRightIcon",
  check: "CheckmarkIcon",
  "chevron-down": "ChevronDownIcon",
  "chevron-left": "ChevronLeftIcon",
  "chevron-right": "ChevronRightIcon",
  "chevron-up": "ChevronUpIcon",
  "chevrons-up-down": "ChevronsUpDownIcon",
  ellipsis: "EllipsisIcon",
  "loader-circle": "LoaderCircleIcon",
  "rotate-ccw": "RotateCcwIcon",
  search: "SearchIcon",
  "search-x": "SearchXIcon",
  "zoom-in": "ZoomInIcon",
  "zoom-out": "ZoomOutIcon",
});

// Replace icon leaves and Frame's embedded title glyph, preserving behavior.
// Shared by both Next bundlers and the real-component esbuild test harness.
module.exports = function mintlifyHugeiconsLoader(source) {
  const resource = this.resourcePath.replace(/\\/g, "/");
  if (!resource.includes("/@mintlify/components/dist/")) return source;
  const relativeImport = file => {
    const relative = path.relative(path.dirname(this.resourcePath), path.join(__dirname, "../components/icons", file)).replace(/\\/g, "/");
    return JSON.stringify(relative.startsWith(".") ? relative : `./${relative}`);
  };
  if (resource.endsWith("/@mintlify/components/dist/components/icon/icon.js")) {
    return `export { DocumentationIcon as Icon } from ${relativeImport("DocumentationIcon.tsx")};`;
  }
  if (resource.endsWith("/@mintlify/components/dist/components/code-group/language-icon.js")) {
    return `export { LanguageIcon } from ${relativeImport("DocumentationIcon.tsx")};`;
  }
  if (resource.endsWith("/@mintlify/components/dist/icons/index.js")) {
    return `export { ActiveCopyButtonIcon, ArrowRightIcon, CheckIcon, CopyButtonIcon, DangerIcon, FileIcon, Folder2Icon, Folder2OpenIcon, InfoIcon, LinkIcon, NoteIcon, TipIcon, WarningIcon } from ${relativeImport("MintlifyIcons.tsx")};`;
  }
  if (resource.endsWith("/@mintlify/components/dist/components/frame/frame.js")) {
    const code = Buffer.isBuffer(source) ? source.toString("utf8") : source;
    const titleIcon = /\/\* @__PURE__ \*\/ (\w+)\(\s*"svg",\s*\{\s*"aria-hidden": "true",\s*className: "size-4 flex-none fill-stone-400 dark:fill-stone-300",\s*viewBox: "0 0 512 512",\s*xmlns: "http:\/\/www\.w3\.org\/2000\/svg",\s*children: \/\* @__PURE__ \*\/ \1\("path", \{ d: "M224 320[^"\n]+" \}\)\s*\}\s*\)/g;
    const matches = [...code.matchAll(titleIcon)];
    if (matches.length !== 1) {
      throw new Error(`Expected exactly one Mintlify Frame title icon, found ${matches.length}; review the installed Frame before updating the icon transform.`);
    }
    return `import { FrameTitleIcon as __storeFrameTitleIcon } from ${relativeImport("MintlifyIcons.tsx")};\n${code.replace(titleIcon, (_, jsx) => `/* @__PURE__ */ ${jsx}(__storeFrameTitleIcon, {})`)}`;
  }
  const lucide = resource.match(/\/lucide-react\/dist\/esm\/icons\/([^/]+)\.js$/);
  if (lucide) {
    const exported = bundledLucideIcons[lucide[1]];
    if (!exported) throw new Error(`Unmapped bundled Mintlify icon: ${lucide[1]}`);
    return `export { ${exported} as default } from ${relativeImport("MintlifyIcons.tsx")};`;
  }
  return source;
};
