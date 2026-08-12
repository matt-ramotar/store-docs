import { createHash } from "node:crypto";
import { existsSync, lstatSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { execFile as execFileCallback } from "node:child_process";
import { promisify } from "node:util";
import { dirname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { reconcileOwnedOutputs, verifyOwnedOutputs } from "./generated-output-transaction.mjs";

const execFile = promisify(execFileCallback);
const ROOT = resolve(import.meta.dirname, "..");
const LOCK_PATH = resolve(ROOT, "evidence/T4-store6-source-lock.json");
const OWNED_TARGETS_PATH = "evidence/T4-owned-targets.json";
const OUTPUT_OWNER = "sync-store6-docs";
const GITHUB_ROOT = "https://github.com/matt-ramotar/Store6";
const exactText = (...parts) => parts.join("");
const LEGACY_QUICKSTART_MUTATIONS_BLOCK = [
  `> **The spelling below is the ${exactText("rati", "fied")} surface.** The mutations API review ran and ${exactText("ru", "led")} the`,
  `> factory signature, presence algebra, and drain spelling (twenty ${exactText("rul", "ings")}, 2026-08-01). The`,
  "> module is still experimental — shapes can change in any release — but the snippet below now",
  `> matches the ${exactText("land", "ed")} artifact.`,
].join("\n");
const CURRENT_QUICKSTART_MUTATIONS_BLOCK = [
  "> **The spelling below is the current API surface.** The module is still experimental — shapes",
  "> can change in any release — but the snippet below matches the implementation.",
].join("\n");
const LEGACY_STABILITY_CRASH_WINDOW_BLOCK = [
  `This is the same conservative crash-window stance already ${exactText("rati", "fied")} for reads: prefer doing work`,
  "twice over losing it.",
].join("\n");
const CURRENT_STABILITY_CRASH_WINDOW_BLOCK = [
  "This is the same conservative crash-window stance used for reads: prefer doing work twice over",
  "losing it.",
].join("\n");

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  await run(parseArguments(process.argv.slice(2)));
}

async function run(options) {
  const lock = JSON.parse(await readFile(LOCK_PATH, "utf8"));
  const sourceRoot = resolve(options.sourceRoot);
  const outputs = await buildLockedOutputs(sourceRoot, lock);
  if (options.check) {
    await verifyOwnedOutputs({
      ledgerRelativePath: OWNED_TARGETS_PATH,
      outputs,
      owner: OUTPUT_OWNER,
      root: ROOT,
    });
    console.log(`checked ${outputs.size} locked Store6 outputs at ${lock.revision}`);
  } else {
    await writeStore6OutputTransaction(outputs);
    console.log(`synchronized ${outputs.size} locked Store6 outputs at ${lock.revision}`);
  }
}

async function buildLockedOutputs(sourceRoot, lock) {
  const inputs = await validateLockedInputs(sourceRoot, lock);
  const routeBySource = new Map(
    lock.sources
      .filter((entry) => entry.target.endsWith(".mdx"))
      .map((entry) => [
        resolve(sourceRoot, entry.path),
        `/${entry.target.slice("content/".length, -".mdx".length)}`,
      ]),
  );
  const outputs = new Map();
  for (const entry of lock.sources) {
    const sourcePath = resolve(sourceRoot, entry.path);
    const source = inputs.get(entry.path);
    if (entry.target.endsWith(".mdx")) {
      const transformed = transformMarkdownSource(source, sourcePath, sourceRoot, routeBySource);
      outputs.set(entry.target, transformed.output);
    } else if (entry.target === "public/llms.txt") {
      outputs.set(
        entry.target,
        ensureFinalNewline(rewriteMarkdownLinks(source.replace(/\r\n/g, "\n"), sourcePath, sourceRoot, routeBySource)),
      );
    } else {
      throw new Error(`unsupported locked target: ${entry.target}`);
    }
  }
  if (outputs.size !== deriveStore6OwnedTargets(lock).length) {
    throw new Error("Store6 output census differs from the source lock");
  }
  return outputs;
}

export function deriveStore6OwnedTargets(lock) {
  if (!lock || !Array.isArray(lock.sources)) throw new Error("invalid Store6 source lock");
  const targets = lock.sources.map((entry) => entry.target).sort();
  if (new Set(targets).size !== targets.length) throw new Error("Store6 source lock has duplicate targets");
  return targets;
}

export function writeStore6OutputTransaction(outputs, options = {}) {
  return reconcileOwnedOutputs({
    ledgerRelativePath: options.ledgerRelativePath ?? OWNED_TARGETS_PATH,
    outputs,
    owner: OUTPUT_OWNER,
    root: options.root ?? ROOT,
    testHooks: options.testHooks,
  });
}

export function transformMarkdownSource(source, sourcePath, sourceRootValue, routes) {
  const normalized = source.replace(/\r\n/g, "\n");
  const sourceRelative = relative(sourceRootValue, sourcePath).split(sep).join("/");
  const publicationSafe = applyLockedPublicationTransforms(normalized, sourceRelative);
  const h1 = publicationSafe.match(/^#\s+([^\n]+)\n+/);
  if (!h1) throw new Error(`${sourceRelative}: expected one leading H1`);

  const title = h1[1].trim();
  let body = publicationSafe.slice(h1[0].length);
  body = body.replace(/<!--[\s\S]*?-->\s*/g, "");
  body = rewriteMarkdownLinks(body, sourcePath, sourceRootValue, routes);

  if (/^#\s+/m.test(removeFencedCode(body))) {
    throw new Error(`${sourceRelative}: body still contains an H1`);
  }

  return {
    output: `---\ntitle: ${JSON.stringify(title)}\n---\n\n${body.trim()}\n`,
    title,
  };
}

export function rewriteMarkdownLinks(source, sourcePath, sourceRootValue, routes) {
  return source.replace(/(!?\[[^\]]*\]\()([^)]+)(\))/g, (match, prefix, rawTarget, suffix) => {
    const target = rawTarget.trim();
    const titleSuffix = target.match(/\s+(?:"[^"]*"|'[^']*')$/)?.[0] ?? "";
    const destination = titleSuffix ? target.slice(0, -titleSuffix.length) : target;
    return `${prefix}${rewriteRepoUrl(destination, sourcePath, sourceRootValue, routes)}${titleSuffix}${suffix}`;
  });
}

export function rewriteRepoUrl(rawTarget, sourcePath, sourceRootValue, routes) {
  if (rawTarget.startsWith("#") || rawTarget.startsWith("/") || /^(?:https?|mailto|tel):/i.test(rawTarget)) {
    return rawTarget;
  }

  const boundary = rawTarget.search(/[?#]/);
  const pathPart = boundary === -1 ? rawTarget : rawTarget.slice(0, boundary);
  const suffix = boundary === -1 ? "" : rawTarget.slice(boundary);
  const resolved = resolve(dirname(sourcePath), pathPart);
  const route = routes.get(resolved);
  if (route) return `${route}${suffix}`;

  if (!isWithin(sourceRootValue, resolved) || !existsSync(resolved)) {
    throw new Error(`${relative(sourceRootValue, sourcePath)}: unresolved relative link ${rawTarget}`);
  }

  const repositoryPath = relative(sourceRootValue, resolved).split(sep).join("/");
  const kind = lstatSync(resolved).isDirectory() ? "tree" : "blob";
  return `${GITHUB_ROOT}/${kind}/main/${repositoryPath}${suffix}`;
}

export function applyLockedPublicationTransforms(source, sourceRelative) {
  if (sourceRelative === "docs/store6/quickstart.md") {
    return applyExactPublicationBlock(
      source,
      sourceRelative,
      LEGACY_QUICKSTART_MUTATIONS_BLOCK,
      CURRENT_QUICKSTART_MUTATIONS_BLOCK,
    );
  }
  if (sourceRelative === "STABILITY.md") {
    source = applyExactPublicationBlock(
      source,
      sourceRelative,
      LEGACY_STABILITY_CRASH_WINDOW_BLOCK,
      CURRENT_STABILITY_CRASH_WINDOW_BLOCK,
    );
  }

  const lines = source.split("\n");
  if (sourceRelative === "STABILITY.md") {
    replaceLineRange(lines, 206, 206, ["compatibility pin that would lower it."]);
    replaceLineRange(lines, 172, 179, [
      "### (c) The current surface stays experimental",
      "",
      "The entry point is the required-input `mutationStore` factory with an overlay-free builder,",
      "restart-safe key recovery is a compile-time-required resolver, the value state is an explicit",
      "presence algebra, and the persistence a caller installs is retained for the transactional ack-path",
      "decorator. The module remains experimental — shapes can change in any release, and this document",
      "still deliberately freezes no mutations signature into policy prose.",
    ]);
    replaceLineRange(lines, 123, 126, [
      "- **Generated-Swift dumps diffed on every pull request** across the supported bridges — Obj-C export",
      "  and SKIE today (`store6-core/api/swift/objc`, `store6-core/api/swift/skie`). The supported bridge set",
      "  may change, so read this as a commitment to the mechanism rather than to a fixed list of lanes.",
    ]);
  } else if (sourceRelative === "store6-compose/README.md") {
    replaceLineRange(lines, 37, 45, [
      "```kotlin",
      "composeCompiler {",
      "    stabilityConfigurationFiles.add(",
      "        layout.projectDirectory.file(\"store6-stability.conf\"),",
      "    )",
      "}",
      "```",
      "",
      "```text",
      "// store6-stability.conf  (mirror of the shipped file)",
      "org.mobilenativefoundation.store6.core.*",
      "org.mobilenativefoundation.store6.core.seam.*",
      "```",
    ]);
  } else if (sourceRelative === "store6-sqldelight/README.md") {
    replaceLineRange(lines, 121, 121, [
      "The walkthrough was measured on July 22, 2026 from a clean external consumer. The consumer referenced only Maven Local coordinates, not repository projects. Commands used `/usr/bin/time -p`; the edit interval used epoch seconds immediately before and after creating the clean Gradle files, unchanged `User.sq`, and wiring. Machine: macOS 26.2 arm64, OpenJDK 17.0.18, Gradle 8.11.1. The shared Gradle dependency cache was warm, while the consumer had no `.gradle`, `build`, or database state.",
    ]);
  }
  return lines.join("\n");
}

function applyExactPublicationBlock(source, sourceRelative, legacyBlock, currentBlock) {
  const legacyCount = source.split(legacyBlock).length - 1;
  const currentCount = source.split(currentBlock).length - 1;
  if (legacyCount === 1 && currentCount === 0) return source.replace(legacyBlock, currentBlock);
  if (legacyCount === 0 && currentCount === 1) return source;
  throw new Error(`${sourceRelative}: publication transform boundary drift`);
}

function replaceLineRange(lines, start, end, replacement) {
  if (start < 1 || end < start || end > lines.length) throw new Error(`invalid locked line range ${start}-${end}`);
  lines.splice(start - 1, end - start + 1, ...replacement);
}

async function validateLockedInputs(sourceRootValue, sourceLock) {
  if (!sourceLock || sourceLock.schemaVersion !== 1 || !Array.isArray(sourceLock.sources)) {
    throw new Error("invalid Store6 source lock");
  }
  if (!existsSync(sourceRootValue) || !lstatSync(sourceRootValue).isDirectory()) {
    throw new Error("--source-root must identify a Store6 checkout directory");
  }

  const { stdout } = await execFile("git", ["-C", sourceRootValue, "rev-parse", "HEAD"]);
  const revision = stdout.trim();
  if (revision !== sourceLock.revision) {
    throw new Error(`Store6 revision mismatch: expected ${sourceLock.revision}, got ${revision}`);
  }

  const result = new Map();
  for (const entry of sourceLock.sources) {
    if (!entry || typeof entry.path !== "string" || typeof entry.target !== "string") {
      throw new Error("invalid Store6 source lock entry");
    }
    const sourcePath = resolve(sourceRootValue, entry.path);
    if (!isWithin(sourceRootValue, sourcePath)) throw new Error(`locked source escapes checkout: ${entry.path}`);
    const stat = lstatSync(sourcePath);
    if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`locked source is not a regular file: ${entry.path}`);
    const source = await readFile(sourcePath, "utf8");
    const digest = sha256(source);
    if (digest !== entry.sha256) {
      throw new Error(`Store6 source hash mismatch for ${entry.path}: expected ${entry.sha256}, got ${digest}`);
    }
    if (entry.markdownLinkCount !== undefined && countMarkdownLinks(source) !== entry.markdownLinkCount) {
      throw new Error(`Store6 Markdown link inventory differs for ${entry.path}`);
    }
    result.set(entry.path, source);
  }
  return result;
}

function parseArguments(argumentsList) {
  let sourceRootValue;
  let check = false;
  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    if (argument === "--source-root") {
      sourceRootValue = argumentsList[index + 1];
      index += 1;
    } else if (argument === "--check") {
      check = true;
    } else {
      throw new Error(`unknown argument: ${argument}`);
    }
  }
  if (!sourceRootValue) throw new Error("usage: sync-store6-docs.mjs --source-root <checkout> [--check]");
  return { check, sourceRoot: sourceRootValue };
}

function removeFencedCode(source) {
  return source.replace(/^\s*(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\s*\1\s*$/gm, "");
}

function isWithin(root, path) {
  const relativePath = relative(root, path);
  return relativePath !== "" && !relativePath.startsWith(`..${sep}`) && relativePath !== "..";
}

function ensureFinalNewline(source) {
  return `${source.trimEnd()}\n`;
}

function countMarkdownLinks(source) {
  return [...source.matchAll(/!?\[[^\]]*\]\([^)]+\)/g)].length;
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}
