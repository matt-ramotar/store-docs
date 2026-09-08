import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { lstat, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  AlertCircleIcon, ArrowDown01Icon, ArrowUpToLineIcon, AtIcon, Cancel01Icon,
  CheckmarkCircle02Icon, CheckmarkSquare01Icon, ConnectIcon, Copy01Icon, CubeIcon,
  FilterHorizontalIcon, FunctionIcon, HierarchySquare01Icon, Home01Icon, Link01Icon,
  ListViewIcon, Loading03Icon, Menu01Icon, Moon02Icon, Remove01Icon, Square01Icon,
  Tick02Icon, VariableIcon,
  Search01Icon,
} from "@hugeicons/core-free-icons";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const contract = JSON.parse(await readFile(new URL("./fixtures/reference-theme/dokka-icon-contract.json", import.meta.url), "utf8"));
const icons = {
  AlertCircleIcon, ArrowDown01Icon, ArrowUpToLineIcon, AtIcon, Cancel01Icon,
  CheckmarkCircle02Icon, CheckmarkSquare01Icon, ConnectIcon, Copy01Icon, CubeIcon,
  FilterHorizontalIcon, FunctionIcon, HierarchySquare01Icon, Home01Icon, Link01Icon,
  ListViewIcon, Loading03Icon, Menu01Icon, Moon02Icon, Remove01Icon, Search01Icon,
  Square01Icon, Tick02Icon, VariableIcon,
};

// Keep Dokka's asset paths, dimensions, semantic colors, and CSS state handling.
// Branding (logo-icon.svg) is intentionally outside this UI-icon mapping.
export const referenceIconAssets = Object.freeze({
  "abstract-class.svg": ["HierarchySquare01Icon", 16, "#9AA7B0"],
  "abstract-class-kotlin.svg": ["HierarchySquare01Icon", 16, "#9AA7B0"],
  "annotation.svg": ["AtIcon", 16, "#62B543"],
  "annotation-kotlin.svg": ["AtIcon", 16, "#62B543"],
  "anchor-copy-icon.svg": ["Link01Icon", 24, "currentColor"],
  "arrow-down.svg": ["ArrowDown01Icon", 24, "rgba(255, 255, 255, 0.96)"],
  "burger.svg": ["Menu01Icon", 24, "rgba(255, 255, 255, 0.96)"],
  "check.svg": ["Tick02Icon", 24, "rgba(255, 255, 255, 0.96)"],
  "checkbox-off.svg": ["Square01Icon", 24, "rgba(255, 255, 255, 0.16)"],
  "checkbox-on.svg": ["CheckmarkSquare01Icon", 24, "rgba(255, 255, 255, 0.96)"],
  "class.svg": ["CubeIcon", 16, "#40B6E0"],
  "class-kotlin.svg": ["CubeIcon", 16, "#40B6E0"],
  "copy-icon.svg": ["Copy01Icon", 24, "black"],
  "cross.svg": ["Cancel01Icon", 24, "rgba(255, 255, 255, 0.96)"],
  "enum.svg": ["ListViewIcon", 16, "#40B6E0"],
  "enum-kotlin.svg": ["ListViewIcon", 16, "#40B6E0"],
  "exception-class.svg": ["AlertCircleIcon", 16, "#40B6E0"],
  "field-value.svg": ["VariableIcon", 16, "#B99BF8"],
  "field-variable.svg": ["VariableIcon", 16, "#B99BF8"],
  "filter.svg": ["FilterHorizontalIcon", 24, "rgba(255, 255, 255, 0.96)"],
  "function.svg": ["FunctionIcon", 16, "#F98B9E"],
  "go-to-top-icon.svg": ["ArrowUpToLineIcon", 24, "rgba(255, 255, 255, 0.96)"],
  "homepage.svg": ["Home01Icon", 24, "rgba(255, 255, 255, 0.96)"],
  "interface.svg": ["ConnectIcon", 16, "#62B543"],
  "interface-kotlin.svg": ["ConnectIcon", 16, "#62B543"],
  "object.svg": ["CubeIcon", 16, "#F4AF3D"],
  "placeholder.svg": ["Square01Icon", 24, "rgba(255, 255, 255, 0.96)"],
  "success-icon.svg": ["CheckmarkCircle02Icon", 24, "#4DBB5F"],
  "theme-toggle.svg": ["Moon02Icon", 24, "rgba(255, 255, 255, 0.96)"],
  "typealias-kotlin.svg": ["Link01Icon", 16, "#B99BF8"],
});

const runtimeIcons = {
  1817: ["Tick02Icon", 14],
  4811: ["ArrowDown01Icon", 10],
  5742: ["ArrowDown01Icon", 16],
  7112: ["Cancel01Icon", 12],
  8420: ["Remove01Icon", 14],
  7004: ["Search01Icon", 16],
};

function escapeXml(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll("'", "&apos;");
}

export function renderReferenceIcon(name, size = 24, color = "currentColor") {
  assert.ok(icons[name], `unknown Hugeicons icon: ${name}`);
  const shapes = icons[name].map(([tag, attributes]) => {
    const serialized = Object.entries(attributes)
      .filter(([key]) => key !== "key")
      .map(([key, value]) => `${key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}="${escapeXml(value === "currentColor" ? color : value)}"`)
      .join(" ");
    return `<${tag} ${serialized}/>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" data-hugeicon="${name}">${shapes}</svg>`;
}

export function dokkaRuntimeReplacements() {
  const replacements = Object.entries(runtimeIcons).map(([moduleId, [name, size]]) => [
    `${moduleId}:e=>{e.exports='${contract.svgModules[moduleId]}'}`,
    `${moduleId}:e=>{e.exports='${renderReferenceIcon(name, size)}'}`,
  ]);
  const searchShapes = Search01Icon.map(([tag, attributes]) =>
    `n.createElement(${JSON.stringify(tag)},${JSON.stringify({ ...attributes, stroke: "#fff" })})`,
  ).join(",");
  replacements.push([
    contract.reactSearch,
    `const Ws=({styles:e={},...t})=>n.createElement("svg",Us({width:"24",height:"24",viewBox:"0 0 24 24",fill:"none",xmlns:"http://www.w3.org/2000/svg","data-hugeicon":"Search01Icon"},t),${searchShapes})`,
  ]);
  const loadingMask = `url("data:image/svg+xml,${encodeURIComponent(renderReferenceIcon("Loading03Icon"))}")`;
  replacements.push([
    contract.loaderAppearance,
    `    animation: none;\\n    background: currentColor;\\n    -webkit-mask: ${loadingMask} center / contain no-repeat;\\n    mask: ${loadingMask} center / contain no-repeat;`,
  ]);
  return replacements;
}

// Normalize the icon substitutions back to the reviewed upstream script before
// hashing. This makes regeneration idempotent while rejecting any runtime drift.
export function patchDokkaRuntime(source) {
  const replacements = dokkaRuntimeReplacements();
  let original = source;
  for (const [before, after] of replacements) original = original.replace(after, before);
  assert.equal(createHash("sha256").update(original).digest("hex"), contract.stockRuntimeSha256,
    "Dokka runtime changed; review its icon sources before updating dokka-icon-contract.json");
  for (const [before, after] of replacements) {
    assert.equal(original.split(before).length - 1, 1, "expected exactly one Dokka icon source");
    original = original.replace(before, after);
  }
  return original;
}

export async function syncReferenceIcons({ root = repoRoot, check = false } = {}) {
  const pending = [];
  for (const slug of ["store6-core", "store6-mutations"]) {
    const moduleRoot = join(root, "public/reference", slug);
    for (const directory of [join(root, "public"), join(root, "public/reference"), moduleRoot, join(moduleRoot, "images"), join(moduleRoot, "scripts")]) {
      const metadata = await lstat(directory);
      assert.ok(metadata.isDirectory() && !metadata.isSymbolicLink(), `expected real directory: ${directory}`);
    }
    const svgNames = (await readdir(join(moduleRoot, "images"))).filter(name => name.endsWith(".svg") && name !== "logo-icon.svg").sort();
    assert.deepEqual(svgNames, Object.keys(referenceIconAssets).sort(), `Dokka icon inventory changed in ${slug}`);
    const outputs = Object.entries(referenceIconAssets).map(([name, args]) => [join(moduleRoot, "images", name), `${renderReferenceIcon(...args)}\n`]);
    const runtimePath = join(moduleRoot, "scripts/main.js");
    const runtimeMetadata = await lstat(runtimePath);
    assert.ok(runtimeMetadata.isFile() && !runtimeMetadata.isSymbolicLink(), `expected regular file: ${runtimePath}`);
    outputs.push([runtimePath, patchDokkaRuntime(await readFile(runtimePath, "utf8"))]);
    for (const [target, content] of outputs) {
      const metadata = await lstat(target);
      assert.ok(metadata.isFile() && !metadata.isSymbolicLink(), `expected regular file: ${target}`);
      if (await readFile(target, "utf8") !== content) pending.push([target, content]);
    }
  }
  if (check) assert.equal(pending.length, 0, `reference icons need regeneration: ${pending.map(([target]) => target).join(", ")}`);
  else for (const [target, content] of pending) await writeFile(target, content);
  return { modules: 2, svgAssets: Object.keys(referenceIconAssets).length * 2, runtimeIcons: 16, filesChanged: pending.length };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    assert.ok(process.argv.slice(2).every(argument => argument === "--check"), "usage: sync-reference-icons.mjs [--check]");
    process.stdout.write(`${JSON.stringify(await syncReferenceIcons({ check: process.argv.includes("--check") }))}\n`);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
