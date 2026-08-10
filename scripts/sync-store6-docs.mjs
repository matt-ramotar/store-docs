import { existsSync, lstatSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, relative, resolve, sep } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const STORE6_ROOT = "/Users/matt/.codex/worktrees/3cd0/Store6";
const GITHUB_ROOT = "https://github.com/matt-ramotar/Store6";

const copies = [
  ["docs/store6/quickstart.md", "content/docs/store6/quickstart.mdx"],
  ["docs/store6/important-defaults.md", "content/docs/store6/important-defaults.mdx"],
  ["docs/store6/invalidate-vs-clear.md", "content/docs/store6/invalidate-vs-clear.mdx"],
  ["docs/store6/key-design.md", "content/docs/store6/key-design.mdx"],
  ["STABILITY.md", "content/docs/store6/stability.mdx"],
  ["ROADMAP.md", "content/docs/store6/roadmap.mdx"],
  ["CONTRIBUTING.md", "content/docs/store6/contributing.mdx"],
  ["store6-compose/README.md", "content/docs/store6/compose.mdx"],
  ["store6-sqldelight/README.md", "content/docs/store6/sqldelight.mdx"],
];

const routeBySource = new Map(
  copies.map(([source, target]) => [resolve(STORE6_ROOT, source), `/${target.slice("content/".length, -".mdx".length)}`]),
);

for (const [sourceRelative, targetRelative] of copies) {
  const sourcePath = resolve(STORE6_ROOT, sourceRelative);
  const targetPath = resolve(ROOT, targetRelative);
  const source = await readFile(sourcePath, "utf8");
  const transformed = transformMarkdownSource(source, sourcePath);
  await writeText(targetPath, transformed.output);
  console.log(
    `${sourceRelative} -> ${targetRelative} (title=${JSON.stringify(transformed.title)}, comments removed=${transformed.removedComments})`,
  );
}

const llmsSourcePath = resolve(STORE6_ROOT, "llms.txt");
const llmsSource = await readFile(llmsSourcePath, "utf8");
const llmsOutput = rewriteMarkdownLinks(llmsSource.replace(/\r\n/g, "\n"), llmsSourcePath);
await writeText(resolve(ROOT, "public/llms.txt"), ensureFinalNewline(llmsOutput));
console.log(`llms.txt -> public/llms.txt (${countMarkdownLinks(llmsSource)} targets)`);

export function transformMarkdownSource(source, sourcePath) {
  const normalized = source.replace(/\r\n/g, "\n");
  const h1 = normalized.match(/^#\s+([^\n]+)\n+/);
  if (!h1) throw new Error(`${sourcePath}: expected one leading H1`);

  const title = h1[1].trim();
  let body = normalized.slice(h1[0].length);
  const comments = [...body.matchAll(/<!--[\s\S]*?-->/g)];
  body = body.replace(/<!--[\s\S]*?-->\s*/g, "");
  body = sanitizePublicationContext(body, sourcePath);
  body = rewriteMarkdownLinks(body, sourcePath);

  if (/^#\s+/m.test(removeFencedCode(body))) {
    throw new Error(`${sourcePath}: body still contains an H1`);
  }
  if (/\bSTORE-\d+\b|Awaiting Matt|RULINGS? ADDENDUM|\/private\/tmp\//.test(body)) {
    throw new Error(`${sourcePath}: internal publication shorthand remains`);
  }

  return {
    output: `---\ntitle: ${JSON.stringify(title)}\n---\n\n${body.trim()}\n`,
    removedComments: comments.length,
    title,
  };
}

export function rewriteMarkdownLinks(source, sourcePath) {
  return source.replace(/(!?\[[^\]]*\]\()([^)]+)(\))/g, (match, prefix, rawTarget, suffix) => {
    const target = rawTarget.trim();
    const titleSuffix = target.match(/\s+(?:"[^"]*"|'[^']*')$/)?.[0] ?? "";
    const destination = titleSuffix ? target.slice(0, -titleSuffix.length) : target;
    return `${prefix}${rewriteRepoUrl(destination, sourcePath)}${titleSuffix}${suffix}`;
  });
}

export function rewriteRepoUrl(rawTarget, sourcePath) {
  if (
    rawTarget.startsWith("#") ||
    rawTarget.startsWith("/") ||
    /^(?:https?|mailto|tel):/i.test(rawTarget)
  ) {
    return rawTarget;
  }

  const boundary = rawTarget.search(/[?#]/);
  const pathPart = boundary === -1 ? rawTarget : rawTarget.slice(0, boundary);
  const suffix = boundary === -1 ? "" : rawTarget.slice(boundary);
  const resolved = resolve(dirname(sourcePath), pathPart);
  const route = routeBySource.get(resolved);
  if (route) return `${route}${suffix}`;

  if (!isWithinStore6(resolved) || !existsSync(resolved)) {
    throw new Error(`${sourcePath}: unresolved relative link ${rawTarget}`);
  }

  const repositoryPath = relative(STORE6_ROOT, resolved).split(sep).join("/");
  const kind = lstatSync(resolved).isDirectory() ? "tree" : "blob";
  return `${GITHUB_ROOT}/${kind}/main/${repositoryPath}${suffix}`;
}

function sanitizePublicationContext(body, sourcePath) {
  const sourceRelative = relative(STORE6_ROOT, sourcePath).split(sep).join("/");
  if (sourceRelative === "docs/store6/quickstart.md") {
    body = replaceRequired(
      body,
      "> **The spelling below is the ratified surface.** The mutations API review ran and ruled the\n> factory signature, presence algebra, and drain spelling (twenty rulings, 2026-08-01). The\n> module is still experimental — shapes can change in any release — but the snippet below now\n> matches the landed artifact.",
      "> **The spelling below is the current API surface.** The module is still experimental — shapes\n> can change in any release — but the snippet below matches the implementation.",
      sourcePath,
    );
  }

  if (sourceRelative === "STABILITY.md") {
    body = replaceRequired(
      body,
      "- **Generated-Swift dumps diffed on every pull request** across the supported bridges — Obj-C export\n  and SKIE today (`store6-core/api/swift/objc`, `store6-core/api/swift/skie`). The bridge set follows\n  the Swift Export disposition recorded at the alpha01 cut, so read this as a commitment to the\n  mechanism rather than to a fixed list of lanes.",
      "- **Generated-Swift dumps diffed on every pull request** across the supported bridges — Obj-C export\n  and SKIE today (`store6-core/api/swift/objc`, `store6-core/api/swift/skie`). The supported bridge set\n  may change, so read this as a commitment to the mechanism rather than to a fixed list of lanes.",
      sourcePath,
    );
    body = replaceRequired(
      body,
      "This is the same conservative crash-window stance already ratified for reads: prefer doing work\ntwice over losing it.",
      "This is the same conservative crash-window stance used for reads: prefer doing work twice over\nlosing it.",
      sourcePath,
    );
    body = replaceRequired(
      body,
      "### (c) The surface has been reviewed — and stays experimental\n\nThe mutations API review ran and ruled the surface (twenty rulings, 2026-08-01): the entry point\nis the required-input `mutationStore` factory with an overlay-free builder, restart-safe key\nrecovery is a compile-time-required resolver, the value state is an explicit presence algebra,\nand the persistence a caller installs is retained for the transactional ack-path decorator.\nThe module remains experimental — shapes can change in any release, and this document still\ndeliberately freezes no mutations signature into policy prose.",
      "### (c) The current surface stays experimental\n\nThe entry point is the required-input `mutationStore` factory with an overlay-free builder,\nrestart-safe key recovery is a compile-time-required resolver, the value state is an explicit\npresence algebra, and the persistence a caller installs is retained for the transactional ack-path\ndecorator. The module remains experimental — shapes can change in any release, and this document\nstill deliberately freezes no mutations signature into policy prose.",
      sourcePath,
    );
    body = replaceRequired(
      body,
      "compatibility pin that would lower it. Room 3 is what drove the toolchain here.",
      "compatibility pin that would lower it.",
      sourcePath,
    );
  }

  if (sourceRelative === "store6-sqldelight/README.md") {
    body = replaceRequired(
      body,
      "The walkthrough was measured on July 22, 2026 from a nonexistent consumer directory at `/private/tmp/store6-sqldelight-consumer-20260722-t7`. The consumer referenced only Maven Local coordinates, not repository projects.",
      "The walkthrough was measured on July 22, 2026 from a clean external consumer. The consumer referenced only Maven Local coordinates, not repository projects.",
      sourcePath,
    );
  }

  if (sourceRelative === "store6-compose/README.md") {
    body = replaceRequired(
      body,
      "    composeCompiler {\n        stabilityConfigurationFiles.add(\n            layout.projectDirectory.file(\"store6-stability.conf\"),\n        )\n    }\n\n    // store6-stability.conf  (mirror of the shipped file)\n    org.mobilenativefoundation.store6.core.*\n    org.mobilenativefoundation.store6.core.seam.*",
      "```kotlin\ncomposeCompiler {\n    stabilityConfigurationFiles.add(\n        layout.projectDirectory.file(\"store6-stability.conf\"),\n    )\n}\n```\n\n```text\n// store6-stability.conf  (mirror of the shipped file)\norg.mobilenativefoundation.store6.core.*\norg.mobilenativefoundation.store6.core.seam.*\n```",
      sourcePath,
    );
  }

  return body;
}

function replaceRequired(source, expected, replacement, sourcePath) {
  const first = source.indexOf(expected);
  if (first === -1) throw new Error(`${sourcePath}: required sanitation source text not found`);
  if (source.indexOf(expected, first + expected.length) !== -1) {
    throw new Error(`${sourcePath}: required sanitation source text occurs more than once`);
  }
  return source.replace(expected, replacement);
}

function removeFencedCode(source) {
  return source.replace(/^\s*(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\s*\1\s*$/gm, "");
}

function countMarkdownLinks(source) {
  return [...source.matchAll(/!?\[[^\]]*\]\([^)]+\)/g)].length;
}

function isWithinStore6(path) {
  const relativePath = relative(STORE6_ROOT, path);
  return relativePath !== "" && !relativePath.startsWith(`..${sep}`) && relativePath !== "..";
}

function ensureFinalNewline(source) {
  return `${source.trimEnd()}\n`;
}

async function writeText(path, content) {
  await mkdir(dirname(path), { recursive: true });
  let current;
  try {
    current = await readFile(path, "utf8");
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  if (current !== content) await writeFile(path, content, "utf8");
}
