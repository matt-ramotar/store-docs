import { execFile } from "node:child_process";
import { readFile, readdir, realpath } from "node:fs/promises";
import { isAbsolute, posix, relative, resolve, sep } from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const ROOT = resolve(import.meta.dirname, "..");
const USAGE = "usage: check-snippets.mjs --source-root <checkout>";
const execFileAsync = promisify(execFile);
const SNIPPET_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  try {
    const result = await checkSnippets(parseArguments(process.argv.slice(2)));
    console.log(
      `checked ${result.snippetCount} snippets (${result.pageReferenceCount} page references) at ${result.revision}`,
    );
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

export function parseArguments(argumentsList) {
  let sourceRoot;
  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    if (argument === "--source-root") {
      if (sourceRoot !== undefined) throw new Error("--source-root may be specified only once");
      sourceRoot = argumentsList[index + 1];
      if (!sourceRoot || sourceRoot.startsWith("--")) throw new Error(USAGE);
      index += 1;
    } else {
      throw new Error(`unknown argument: ${argument}`);
    }
  }
  if (!sourceRoot) throw new Error(USAGE);
  return { sourceRoot };
}

export async function checkSnippets({ revision, root = ROOT, sourceRoot }) {
  if (!sourceRoot) throw new Error(USAGE);
  const manifest = JSON.parse(await readFile(resolve(root, "evidence/store6-snippets.json"), "utf8"));
  const lock = JSON.parse(await readFile(resolve(root, "evidence/T4-store6-source-lock.json"), "utf8"));
  validateManifest(manifest);

  const manifestByName = new Map();
  for (const snippet of manifest.snippets) {
    if (manifestByName.has(snippet.name)) throw new Error(`duplicate snippet name: ${snippet.name}`);
    manifestByName.set(snippet.name, snippet);
    const seenPages = new Set();
    for (const page of snippet.pages) {
      if (seenPages.has(page)) throw new Error(`snippet ${snippet.name} has duplicate page: ${page}`);
      seenPages.add(page);
    }
  }

  const checkedRevision = revision ?? (await readRevision(sourceRoot));
  const resolvedSourceRoot = await realpath(sourceRoot);
  const lockedTargets = new Set(lock.sources.map((source) => source.target));
  const pageRecords = await readClassHPages(root, lockedTargets);

  for (const [route, page] of pageRecords) {
    for (const name of page.markers.keys()) {
      const snippet = manifestByName.get(name);
      if (!snippet) {
        throw new Error(`snippet ${name} on ${route} has no entry in store6-snippets.json`);
      }
      if (!snippet.pages.includes(route)) {
        throw new Error(`snippet ${name} on ${route} is not listed in store6-snippets.json`);
      }
    }
  }

  const sourceRegionsByPath = new Map();
  let pageReferenceCount = 0;
  for (const snippet of manifest.snippets) {
    let regions = sourceRegionsByPath.get(snippet.path);
    if (!regions) {
      const sourcePath = resolve(sourceRoot, snippet.path);
      let source;
      try {
        const resolvedSourcePath = await realpath(sourcePath);
        const sourceRelativePath = relative(resolvedSourceRoot, resolvedSourcePath);
        if (
          sourceRelativePath === ".." ||
          sourceRelativePath.startsWith(`..${sep}`) ||
          isAbsolute(sourceRelativePath)
        ) {
          throw new Error(`snippet ${snippet.name} has unsafe source path: ${snippet.path}`);
        }
        source = await readFile(resolvedSourcePath, "utf8");
      } catch (error) {
        if (error?.code === "ENOENT") {
          throw new Error(`snippet ${snippet.name} source path is missing: ${snippet.path}`);
        }
        throw error;
      }
      regions = extractSourceRegions(source, snippet.path);
      sourceRegionsByPath.set(snippet.path, regions);
    }
    if (!regions.has(snippet.name)) {
      throw new Error(`snippet ${snippet.name} is missing from ${snippet.path}`);
    }
    const expected = regions.get(snippet.name);

    for (const route of snippet.pages) {
      const target = await resolvePageTarget(root, route);
      if (!target) throw new Error(`snippet ${snippet.name} page is missing: ${route}`);
      if (lockedTargets.has(target.relativePath)) {
        throw new Error(`snippet ${snippet.name} page ${route} is sync-owned and must not be listed`);
      }
      const page = pageRecords.get(route);
      if (!page?.markers.has(snippet.name)) {
        throw new Error(`snippet ${snippet.name} marker is missing on ${route}`);
      }
      const actual = page.markers.get(snippet.name).body;
      pageReferenceCount += 1;
      if (actual !== expected) {
        throw new Error(
          [
            `snippet ${snippet.name} on ${route} differs from ${snippet.path} at ${checkedRevision}`,
            createDiff(expected, actual, `${snippet.path}:${snippet.name}`, target.relativePath),
          ].join("\n"),
        );
      }
    }
  }

  return {
    pageReferenceCount,
    revision: checkedRevision,
    snippetCount: manifest.snippets.length,
  };
}

function validateManifest(manifest) {
  if (!manifest || manifest.schemaVersion !== 1 || !Array.isArray(manifest.snippets)) {
    throw new Error("store6-snippets.json must have schemaVersion 1 and a snippets array");
  }
  for (const snippet of manifest.snippets) {
    if (!snippet || typeof snippet !== "object") {
      throw new Error("store6-snippets.json entries must be objects");
    }
    if (typeof snippet.name !== "string" || !SNIPPET_NAME.test(snippet.name)) {
      throw new Error(`invalid snippet name: ${String(snippet.name)}`);
    }
    if (!isSafeSourcePath(snippet.path)) {
      throw new Error(`snippet ${snippet.name} has unsafe source path: ${String(snippet.path)}`);
    }
    if (!Array.isArray(snippet.pages) || snippet.pages.length === 0) {
      throw new Error(`snippet ${snippet.name} must list at least one page`);
    }
    for (const page of snippet.pages) {
      if (!isSafePageRoute(page)) {
        throw new Error(`snippet ${snippet.name} has unsafe page route: ${String(page)}`);
      }
    }
  }
}

function isSafeSourcePath(path) {
  if (typeof path !== "string" || path.length === 0 || path.includes("\\") || path.includes("\0")) return false;
  if (posix.isAbsolute(path) || posix.normalize(path) !== path) return false;
  return path.split("/").every((segment) => segment !== "" && segment !== "." && segment !== "..");
}

function isSafePageRoute(route) {
  if (typeof route !== "string" || !route.startsWith("/docs/store6/")) return false;
  if (route.includes("\\") || route.includes("\0") || route.includes("?") || route.includes("#") || route.endsWith("/")) return false;
  const suffix = route.slice(1);
  return posix.normalize(suffix) === suffix && suffix.split("/").every((segment) => segment !== "." && segment !== "..");
}

async function readRevision(sourceRoot) {
  try {
    const { stdout } = await execFileAsync("git", ["-C", sourceRoot, "rev-parse", "HEAD"], {
      encoding: "utf8",
    });
    const revision = stdout.trim();
    if (!/^[a-f0-9]{40}$/.test(revision)) throw new Error("unexpected revision");
    return revision;
  } catch {
    throw new Error(`unable to resolve Store6 revision from source root: ${sourceRoot}`);
  }
}

async function readClassHPages(root, lockedTargets) {
  const pages = new Map();
  for (const path of await listMdxFiles(resolve(root, "content/docs/store6"))) {
    const relativePath = toRepositoryPath(relative(root, path));
    if (lockedTargets.has(relativePath)) continue;
    const route = routeFromTarget(relativePath);
    const source = await readFile(path, "utf8");
    pages.set(route, { markers: extractPageMarkers(source, route), relativePath });
  }
  return pages;
}

function extractSourceRegions(source, path) {
  const lines = source.split("\n");
  const regions = new Map();
  let open;
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (/^[ \t]*\/\/[ \t]+docs:snippet:end[ \t]*\r?$/.test(line)) {
      if (!open) throw new Error(`source region end without a start in ${path} at line ${index + 1}`);
      const body = dedent(lines.slice(open.startLine, index));
      if (regions.has(open.name)) throw new Error(`duplicate source region ${open.name} in ${path}`);
      regions.set(open.name, body);
      open = undefined;
      continue;
    }
    const match = line.match(/^[ \t]*\/\/[ \t]+docs:snippet:([^\r]*)[ \t]*\r?$/);
    if (!match) continue;
    const name = match[1].trim();
    if (!SNIPPET_NAME.test(name)) throw new Error(`invalid source region name in ${path} at line ${index + 1}`);
    if (open) throw new Error(`unterminated source region ${open.name} in ${path}`);
    open = { name, startLine: index + 1 };
  }
  if (open) throw new Error(`unterminated source region ${open.name} in ${path}`);
  return regions;
}

function dedent(lines) {
  const contentLines = lines.map((line) => (line.endsWith("\r") ? line.slice(0, -1) : line));
  const newlineSuffixes = lines.map((line) => (line.endsWith("\r") ? "\r" : ""));
  const nonblankPrefixes = contentLines
    .filter((line) => !/^[ \t]*$/.test(line))
    .map((line) => line.match(/^[ \t]*/)[0]);
  const prefix = commonPrefix(nonblankPrefixes);
  return contentLines
    .map((line, index) => {
      if (/^[ \t]*$/.test(line)) return newlineSuffixes[index];
      return `${line.slice(prefix.length)}${newlineSuffixes[index]}`;
    })
    .join("\n");
}

function commonPrefix(values) {
  if (values.length === 0) return "";
  let prefix = values[0];
  for (const value of values.slice(1)) {
    let length = 0;
    while (length < prefix.length && length < value.length && prefix[length] === value[length]) length += 1;
    prefix = prefix.slice(0, length);
  }
  return prefix;
}

function extractPageMarkers(source, route) {
  const lines = source.split("\n");
  const markers = new Map();
  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(/^[ \t]*\{\/\*[ \t]*snippet:[ \t]*([^*]*?)[ \t]*\*\/\}[ \t]*\r?$/);
    if (!match) continue;
    const name = match[1].trim();
    if (!SNIPPET_NAME.test(name)) throw new Error(`invalid snippet marker on ${route} at line ${index + 1}`);
    if (markers.has(name)) throw new Error(`duplicate snippet marker ${name} on ${route}`);
    const fenceLine = lines[index + 1];
    if (fenceLine === undefined || !/^[ \t]*```kotlin(?:[ \t]+[^\r]*)?[ \t]*\r?$/.test(fenceLine)) {
      throw new Error(`snippet ${name} marker on ${route} must be immediately above a Kotlin fence`);
    }
    let closingIndex = index + 2;
    while (closingIndex < lines.length && !/^[ \t]*```[ \t]*\r?$/.test(lines[closingIndex])) {
      closingIndex += 1;
    }
    if (closingIndex === lines.length) {
      throw new Error(`snippet ${name} Kotlin fence on ${route} is unterminated`);
    }
    markers.set(name, { body: lines.slice(index + 2, closingIndex).join("\n"), line: index + 1 });
    index = closingIndex;
  }
  return markers;
}

async function resolvePageTarget(root, route) {
  const suffix = route.slice("/docs/store6/".length);
  const candidates = [
    `content/docs/store6/${suffix}.mdx`,
    `content/docs/store6/${suffix}/index.mdx`,
  ];
  const matches = [];
  for (const relativePath of candidates) {
    try {
      await readFile(resolve(root, relativePath));
      matches.push(relativePath);
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }
  if (matches.length > 1) throw new Error(`page route resolves to multiple MDX files: ${route}`);
  return matches.length === 1 ? { relativePath: matches[0] } : undefined;
}

function routeFromTarget(relativePath) {
  return `/${relativePath.slice("content/".length, -".mdx".length)}`.replace(/\/index$/, "");
}

async function listMdxFiles(directory) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
  const files = [];
  for (const entry of entries) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await listMdxFiles(path)));
    else if (entry.isFile() && entry.name.endsWith(".mdx")) files.push(path);
  }
  return files.sort();
}

function toRepositoryPath(path) {
  return path.split(sep).join("/");
}

function createDiff(expected, actual, expectedLabel, actualLabel) {
  const expectedLines = expected.split("\n");
  const actualLines = actual.split("\n");
  const matrix = Array.from({ length: expectedLines.length + 1 }, () =>
    Array(actualLines.length + 1).fill(0),
  );
  for (let expectedIndex = expectedLines.length - 1; expectedIndex >= 0; expectedIndex -= 1) {
    for (let actualIndex = actualLines.length - 1; actualIndex >= 0; actualIndex -= 1) {
      matrix[expectedIndex][actualIndex] =
        expectedLines[expectedIndex] === actualLines[actualIndex]
          ? matrix[expectedIndex + 1][actualIndex + 1] + 1
          : Math.max(matrix[expectedIndex + 1][actualIndex], matrix[expectedIndex][actualIndex + 1]);
    }
  }

  const output = [`--- ${expectedLabel}`, `+++ ${actualLabel}`];
  let expectedIndex = 0;
  let actualIndex = 0;
  while (expectedIndex < expectedLines.length || actualIndex < actualLines.length) {
    if (
      expectedIndex < expectedLines.length &&
      actualIndex < actualLines.length &&
      expectedLines[expectedIndex] === actualLines[actualIndex]
    ) {
      output.push(` ${expectedLines[expectedIndex]}`);
      expectedIndex += 1;
      actualIndex += 1;
    } else if (
      actualIndex < actualLines.length &&
      (expectedIndex === expectedLines.length ||
        matrix[expectedIndex][actualIndex + 1] > matrix[expectedIndex + 1][actualIndex])
    ) {
      output.push(`+${actualLines[actualIndex]}`);
      actualIndex += 1;
    } else {
      output.push(`-${expectedLines[expectedIndex]}`);
      expectedIndex += 1;
    }
  }
  return output.join("\n");
}
