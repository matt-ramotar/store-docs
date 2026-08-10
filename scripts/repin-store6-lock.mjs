import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { execFile as execFileCallback } from "node:child_process";
import { lstat, mkdir, mkdtemp, readFile, readdir, realpath, rename, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFile = promisify(execFileCallback);
const ROOT = resolve(import.meta.dirname, "..");
const LOCK_RELATIVE_PATH = "evidence/T4-store6-source-lock.json";
const LOCK_PATH = resolve(ROOT, LOCK_RELATIVE_PATH);
const CLAIMS_PATH = resolve(ROOT, "evidence/store6-claims.json");
const OWNED_TARGETS_PATH = resolve(ROOT, "evidence/T4-owned-targets.json");
const SYNC_SCRIPT = resolve(ROOT, "scripts/sync-store6-docs.mjs");
const REVERIFICATION_SCRIPTS = ["scripts/check-claims.mjs", "scripts/check-snippets.mjs"];

const TRANSFORM_BOUNDARIES = [
  {
    end: 136,
    expected: ["blockquote-blank", "blockquote", "blockquote", "blank"],
    path: "docs/store6/quickstart.md",
    start: 133,
  },
  {
    end: 126,
    expected: ["paragraph", "list", "paragraph", "list"],
    path: "STABILITY.md",
    start: 123,
  },
  {
    end: 163,
    expected: ["blank", "paragraph", "paragraph", "blank"],
    path: "STABILITY.md",
    start: 162,
  },
  {
    end: 179,
    expected: ["blank", "heading", "paragraph", "blank"],
    path: "STABILITY.md",
    start: 172,
  },
  {
    end: 206,
    expected: ["paragraph", "paragraph", "paragraph", "blank"],
    path: "STABILITY.md",
    start: 206,
  },
  {
    end: 45,
    expected: ["blank", "indented-code", "indented-code", "blank"],
    path: "store6-compose/README.md",
    start: 37,
  },
  {
    end: 121,
    expected: ["blank", "paragraph", "paragraph", "blank"],
    path: "store6-sqldelight/README.md",
    start: 121,
  },
];

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  if (process.argv.length === 3 && process.argv[2] === "--self-test") {
    await runSelfTests();
  } else if (process.argv[2] === "--classify-reverification") {
    await classifyReverificationCli(process.argv.slice(3));
  } else {
    await run(parseArguments(process.argv.slice(2)));
  }
}

export async function run({ sourceRoot }) {
  const checkout = resolve(sourceRoot);
  await assertDirectory(checkout, "--source-root must identify a Store6 checkout directory");

  const lock = JSON.parse(await readFile(LOCK_PATH, "utf8"));
  validateSourceLock(lock);
  const revision = (await execFile("git", ["-C", checkout, "rev-parse", "HEAD"])).stdout.trim();
  const nextLock = await recomputeSourceLock(lock, checkout, revision);
  await assertLockedTransformBoundaries(checkout, nextLock);
  const claims = JSON.parse(await readFile(CLAIMS_PATH, "utf8"));
  const nextClaims = advanceClaimsRevision(claims, lock.revision, nextLock.revision);

  const priorOutputs = await readCurrentOutputs(nextLock);
  const rollbackPaths = [
    LOCK_PATH,
    CLAIMS_PATH,
    OWNED_TARGETS_PATH,
    ...nextLock.sources.map(({ target }) => resolveRepositoryPath(target)),
  ];
  const failures = await withCoordinatedFileRollback(rollbackPaths, async () => {
    await writeJsonAtomically(LOCK_PATH, nextLock);
    await writeJsonAtomically(CLAIMS_PATH, nextClaims);
    await runNodeScript(SYNC_SCRIPT, ["--source-root", checkout]);

    for (const entry of nextLock.sources.filter(({ target }) => target.endsWith(".mdx"))) {
      const current = await readFile(resolveRepositoryPath(entry.target));
      const diff = await createUnifiedDiff(entry.target, priorOutputs.get(entry.target), current);
      console.log(`source ${entry.path} -> ${entry.target}`);
      console.log(diff || "(no changes)");
    }
    return runReverificationScripts(checkout);
  });

  if (failures.length > 0) {
    console.warn(`review required for Store6 re-verification: ${failures.join(", ")}`);
  }

  console.log(`re-pinned Store6 sources from ${lock.revision} to ${nextLock.revision}`);
  return { reviewRequiredScripts: failures };
}

export function advanceClaimsRevision(claims, priorRevision, nextRevision) {
  if (
    !claims ||
    claims.schemaVersion !== 1 ||
    typeof claims.revision !== "string" ||
    !Array.isArray(claims.claims)
  ) {
    throw new Error("invalid Store6 claims ledger");
  }
  if (claims.revision !== priorRevision) {
    throw new Error("store6-claims.json is pinned to a different Store6 revision than the source lock");
  }
  return { ...claims, revision: nextRevision };
}

export async function recomputeSourceLock(lock, sourceRoot, revision) {
  validateSourceLock(lock);
  const checkout = resolve(sourceRoot);
  const sources = [];
  for (const entry of lock.sources) {
    const sourcePath = await resolveConfinedCheckoutSource(checkout, entry.path);
    const source = await readFile(sourcePath);
    const nextEntry = { ...entry, sha256: sha256(source) };
    if (Object.hasOwn(entry, "markdownLinkCount")) {
      nextEntry.markdownLinkCount = countMarkdownLinks(source.toString("utf8"));
    }
    sources.push(nextEntry);
  }
  return { ...lock, revision, sources };
}

export async function assertLockedTransformBoundaries(sourceRoot, lock) {
  const syncSource = await readFile(SYNC_SCRIPT, "utf8");
  assertTransformCatalogMatchesSync(syncSource);
  const lockedPaths = new Set(lock.sources.map(({ path }) => path));
  for (const boundary of TRANSFORM_BOUNDARIES) {
    if (!lockedPaths.has(boundary.path)) continue;
    const source = await readFile(await resolveConfinedCheckoutSource(sourceRoot, boundary.path), "utf8");
    const lines = source.replace(/\r\n/g, "\n").split("\n");
    if (boundary.start < 2 || boundary.end >= lines.length) {
      throw new Error(
        `TRANSFORM_BOUNDARY_DRIFT: ${boundary.path}:${boundary.start}-${boundary.end} is outside the source`,
      );
    }
    const actual = [
      classifyMarkdownLine(lines[boundary.start - 2]),
      classifyMarkdownLine(lines[boundary.start - 1]),
      classifyMarkdownLine(lines[boundary.end - 1]),
      classifyMarkdownLine(lines[boundary.end]),
    ];
    if (actual.some((kind, index) => kind !== boundary.expected[index])) {
      throw new Error(
        `TRANSFORM_BOUNDARY_DRIFT: ${boundary.path}:${boundary.start}-${boundary.end} expected ${boundary.expected.join("/")}, got ${actual.join("/")}`,
      );
    }
  }
}

function assertTransformCatalogMatchesSync(syncSource) {
  const discovered = [];
  let sourcePath;
  for (const line of syncSource.split("\n")) {
    const sourceMatch = line.match(/sourceRelative === "([^"]+)"/);
    if (sourceMatch) sourcePath = sourceMatch[1];
    const rangeMatch = line.match(/replaceLineRange\(lines, (\d+), (\d+),/);
    if (rangeMatch) discovered.push(`${sourcePath}:${rangeMatch[1]}-${rangeMatch[2]}`);
  }
  const expected = TRANSFORM_BOUNDARIES.map(({ end, path, start }) => `${path}:${start}-${end}`);
  if (discovered.sort().join("\n") !== expected.sort().join("\n")) {
    throw new Error("TRANSFORM_BOUNDARY_CATALOG_DRIFT: sync transforms and re-pin boundary checks differ");
  }
}

export function parseArguments(argumentsList) {
  let sourceRoot;
  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    if (argument === "--source-root") {
      sourceRoot = argumentsList[index + 1];
      index += 1;
    } else {
      throw new Error(`unknown argument: ${argument}`);
    }
  }
  if (!sourceRoot) throw new Error("usage: repin-store6-lock.mjs --source-root <checkout>");
  return { sourceRoot };
}

function validateSourceLock(lock) {
  if (!lock || lock.schemaVersion !== 1 || typeof lock.revision !== "string" || !Array.isArray(lock.sources)) {
    throw new Error("invalid Store6 source lock");
  }
  for (const entry of lock.sources) {
    if (!entry || typeof entry.path !== "string" || typeof entry.target !== "string") {
      throw new Error("invalid Store6 source lock entry");
    }
  }
}

function resolveCheckoutPath(sourceRoot, relativePath) {
  const checkout = resolve(sourceRoot);
  const path = resolve(checkout, relativePath);
  const relativePathFromRoot = relative(checkout, path);
  if (
    relativePathFromRoot === "" ||
    relativePathFromRoot === ".." ||
    relativePathFromRoot.startsWith(`..${sep}`)
  ) {
    throw new Error(`locked source escapes checkout: ${relativePath}`);
  }
  return path;
}

export async function resolveConfinedCheckoutSource(sourceRoot, relativePath) {
  const checkout = await realpath(resolve(sourceRoot));
  const lexicalPath = resolveCheckoutPath(checkout, relativePath);
  const stat = await lstat(lexicalPath);
  if (!stat.isFile() || stat.isSymbolicLink()) {
    throw new Error(`locked source is not a regular file: ${relativePath}`);
  }
  const resolvedPath = await realpath(lexicalPath);
  const pathFromCheckout = relative(checkout, resolvedPath);
  if (
    pathFromCheckout === "" ||
    pathFromCheckout === ".." ||
    pathFromCheckout.startsWith(`..${sep}`) ||
    isAbsolute(pathFromCheckout)
  ) {
    throw new Error(`locked source escapes checkout: ${relativePath}`);
  }
  return resolvedPath;
}

function classifyMarkdownLine(line) {
  if (/^\s*$/.test(line)) return "blank";
  if (/^\s*>\s*$/.test(line)) return "blockquote-blank";
  if (/^\s*>/.test(line)) return "blockquote";
  if (/^\s{0,3}#{1,6}\s+/.test(line)) return "heading";
  if (/^\s{0,3}(?:[-+*]|\d+[.)])\s+/.test(line)) return "list";
  if (/^(?: {4}|\t)/.test(line)) return "indented-code";
  if (/^\s*(`{3,}|~{3,})/.test(line)) return "fence";
  return "paragraph";
}

async function readCurrentOutputs(lock) {
  const outputs = new Map();
  for (const entry of lock.sources) {
    try {
      outputs.set(entry.target, await readFile(resolveRepositoryPath(entry.target)));
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
      outputs.set(entry.target, Buffer.alloc(0));
    }
  }
  return outputs;
}

function resolveRepositoryPath(relativePath) {
  const path = resolve(ROOT, relativePath);
  const relativePathFromRoot = relative(ROOT, path);
  if (
    relativePathFromRoot === "" ||
    relativePathFromRoot === ".." ||
    relativePathFromRoot.startsWith(`..${sep}`)
  ) {
    throw new Error(`locked target escapes the documentation repository: ${relativePath}`);
  }
  return path;
}

async function createUnifiedDiff(target, before, after) {
  if (before.equals(after)) return "";
  const temporaryRoot = await mkdtemp(resolve(tmpdir(), "store6-repin-diff-"));
  const beforePath = resolve(temporaryRoot, "before");
  const afterPath = resolve(temporaryRoot, "after");
  try {
    await writeFile(beforePath, before);
    await writeFile(afterPath, after);
    let output;
    try {
      output = (
        await execFile(
          "git",
          ["diff", "--no-index", "--no-ext-diff", "--no-renames", "--unified=3", "--", beforePath, afterPath],
          { maxBuffer: 32 * 1024 * 1024 },
        )
      ).stdout;
    } catch (error) {
      if (error?.code !== 1) throw error;
      output = error.stdout;
    }
    return output
      .replace(/^diff --git .*$/m, `diff --git a/${target} b/${target}`)
      .replace(/^--- .*$/m, `--- a/${target}`)
      .replace(/^\+\+\+ .*$/m, `+++ b/${target}`)
      .trimEnd();
  } finally {
    await rm(temporaryRoot, { force: true, recursive: true });
  }
}

async function writeJsonAtomically(path, value) {
  await writeFileAtomically(path, `${JSON.stringify(value, null, 2)}\n`);
}

async function writeFileAtomically(path, value) {
  const temporaryPath = `${path}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporaryPath, value, { flag: "wx" });
    await rename(temporaryPath, path);
  } catch (error) {
    await rm(temporaryPath, { force: true });
    throw error;
  }
}

async function runNodeScript(script, argumentsList) {
  const result = await executeNodeScript(script, argumentsList);
  printCommandOutput(result.stdout, result.stderr);
  return result;
}

async function executeNodeScript(script, argumentsList) {
  try {
    return await execFile(process.execPath, [script, ...argumentsList], {
      cwd: ROOT,
      maxBuffer: 32 * 1024 * 1024,
    });
  } catch (error) {
    if (error && typeof error === "object") {
      error.stdout ??= "";
      error.stderr ??= "";
    }
    throw error;
  }
}

export async function runReverificationScripts(
  checkout,
  { execute = executeNodeScript, print = printCommandOutput, scripts = REVERIFICATION_SCRIPTS } = {},
) {
  const failures = [];
  for (const script of scripts) {
    console.log(`re-verification: node ${script} --source-root ${checkout}`);
    try {
      const result = await execute(resolve(ROOT, script), ["--source-root", checkout]);
      print(result.stdout ?? "", result.stderr ?? "");
    } catch (error) {
      print(error?.stdout ?? "", error?.stderr ?? String(error));
      const status = Number.isInteger(error?.code) ? error.code : -1;
      const output = `${error?.stdout ?? ""}${error?.stderr ?? String(error)}`;
      if (classifyReverificationReport({ output, script, status }) !== "review") throw error;
      failures.push(script);
    }
  }
  return failures;
}

export function classifyReverificationReport({ output, script, status }) {
  if (status === 0) return "clean";
  if (status !== 1 || typeof output !== "string") return "hard";
  if (script.endsWith("check-claims.mjs")) {
    return isOrdinaryClaimDriftReport(output) ? "review" : "hard";
  }
  if (script.endsWith("check-snippets.mjs")) {
    return isOrdinarySnippetDriftReport(output) ? "review" : "hard";
  }
  return "hard";
}

function isOrdinaryClaimDriftReport(output) {
  const lines = normalizedReportLines(output);
  if (lines.length === 0 || lines.length % 2 !== 0) return false;
  for (let index = 0; index < lines.length; index += 2) {
    const header = lines[index].match(
      /^claim (\S+) on (\S+) anchors (.+?), (.+); re-verify the claim, then run check-claims\.mjs --reconcile (\S+)$/,
    );
    if (!header || header[1] !== header[5]) return false;
    const detail = header[4];
    const ordinaryDrift =
      detail === "whose whole-file hash no longer matches store6-claims.json" ||
      /^which changed since [0-9a-f]{40}$/.test(detail) ||
      /^but store6-claims\.json records [0-9a-f]{64} while pinned revision [0-9a-f]{40} hashes to [0-9a-f]{64}$/.test(
        detail,
      );
    if (!ordinaryDrift || !/^  claim: \S/.test(lines[index + 1])) return false;
  }
  return true;
}

function isOrdinarySnippetDriftReport(output) {
  const lines = normalizedReportLines(output);
  const header = /^snippet \S+ on \S+ differs from .+ at [0-9a-f]{40}$/;
  let blockCount = 0;
  let index = 0;
  while (index < lines.length) {
    if (!header.test(lines[index])) return false;
    index += 1;
    if (!lines[index]?.startsWith("--- ")) return false;
    index += 1;
    if (!lines[index]?.startsWith("+++ ")) return false;
    index += 1;

    let hasChange = false;
    let diffLineCount = 0;
    while (index < lines.length && !header.test(lines[index])) {
      if (!/^[ +\-]/.test(lines[index])) return false;
      if (/^[+\-]/.test(lines[index])) hasChange = true;
      diffLineCount += 1;
      index += 1;
    }
    if (diffLineCount === 0 || !hasChange) return false;
    blockCount += 1;
  }
  return blockCount > 0;
}

function normalizedReportLines(output) {
  const normalized = output.replace(/\r\n/g, "\n").trim();
  return normalized === "" ? [] : normalized.split("\n");
}

async function classifyReverificationCli(argumentsList) {
  if (argumentsList.length !== 3 || !/^\d+$/.test(argumentsList[1])) {
    throw new Error(
      "usage: repin-store6-lock.mjs --classify-reverification <script> <status> <report-path>",
    );
  }
  const [script, statusText, reportPath] = argumentsList;
  const output = await readFile(resolve(reportPath), "utf8");
  console.log(classifyReverificationReport({ output, script, status: Number(statusText) }));
}

// Each rename is atomic. This wrapper additionally restores every coordinated file
// after an observed hard exception; a process kill between renames would require a
// durable journal, so the self-test intentionally covers exception rollback instead.
export async function withCoordinatedFileRollback(paths, operation) {
  const snapshots = [];
  for (const path of [...new Set(paths)]) {
    try {
      snapshots.push({ content: await readFile(path), exists: true, path });
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
      snapshots.push({ content: undefined, exists: false, path });
    }
  }

  try {
    return await operation();
  } catch (operationError) {
    const rollbackErrors = [];
    for (const snapshot of snapshots) {
      try {
        if (snapshot.exists) await writeFileAtomically(snapshot.path, snapshot.content);
        else await rm(snapshot.path, { force: true });
      } catch (rollbackError) {
        rollbackErrors.push(rollbackError);
      }
    }
    if (rollbackErrors.length > 0) {
      throw new AggregateError(
        [operationError, ...rollbackErrors],
        "Store6 re-pin failed and coordinated rollback was incomplete",
      );
    }
    throw operationError;
  }
}

function printCommandOutput(stdout, stderr) {
  if (stdout?.trimEnd()) console.log(stdout.trimEnd());
  if (stderr?.trimEnd()) console.error(stderr.trimEnd());
}

async function assertDirectory(path, message) {
  try {
    const stat = await lstat(path);
    if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error(message);
  } catch (error) {
    if (error?.message === message) throw error;
    throw new Error(message, { cause: error });
  }
}

function countMarkdownLinks(source) {
  return [...source.matchAll(/!?\[[^\]]*\]\([^)]+\)/g)].length;
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function runSelfTests() {
  await selfTestHardFailureRollback();
  await selfTestIntermediateSymlinkEscape();
  await selfTestReverificationFindingsAreNonfatal();
  await selfTestMultipleSnippetDriftsAreReviewable();
  await selfTestMissingPinnedBlobRollsBack();
  await selfTestMissingSnippetSourcePropagates();
  await selfTestHardReverificationFailurePropagates();
  await selfTestGitReverificationFailurePropagates();
  console.log("repin-store6-lock self-tests passed");
}

async function selfTestHardFailureRollback() {
  const fixtureRoot = await mkdtemp(resolve(tmpdir(), "store6-repin-rollback-"));
  const lockPath = resolve(fixtureRoot, "lock.json");
  const claimsPath = resolve(fixtureRoot, "claims.json");
  const originalLock = Buffer.from('{"revision":"before"}\n');
  const originalClaims = Buffer.from('{"revision":"before","claims":[]}\n');
  try {
    await writeFile(lockPath, originalLock);
    await writeFile(claimsPath, originalClaims);
    await assert.rejects(
      async () =>
        withCoordinatedFileRollback([lockPath, claimsPath], async () => {
          await writeFile(lockPath, '{"revision":"after"}\n');
          await writeFile(claimsPath, '{"revision":"after","claims":[]}\n');
          throw new Error("fixture hard failure");
        }),
      /fixture hard failure/,
    );
    assert.deepEqual(await readFile(lockPath), originalLock);
    assert.deepEqual(await readFile(claimsPath), originalClaims);
    assert.deepEqual(
      (await readdir(fixtureRoot)).filter((name) => name.includes(".tmp")),
      [],
    );
  } finally {
    await rm(fixtureRoot, { force: true, recursive: true });
  }
}

async function selfTestIntermediateSymlinkEscape() {
  const fixtureRoot = await mkdtemp(resolve(tmpdir(), "store6-repin-path-"));
  const checkout = resolve(fixtureRoot, "checkout");
  const outside = resolve(fixtureRoot, "outside");
  try {
    await mkdir(checkout);
    await mkdir(outside);
    await writeFile(resolve(outside, "Source.md"), "outside\n");
    await symlink(outside, resolve(checkout, "linked"), "dir");
    await assert.rejects(
      resolveConfinedCheckoutSource(checkout, "linked/Source.md"),
      /locked source escapes checkout: linked\/Source\.md/,
    );
  } finally {
    await rm(fixtureRoot, { force: true, recursive: true });
  }
}

async function selfTestReverificationFindingsAreNonfatal() {
  const revision = "a".repeat(40);
  const recordedHash = "b".repeat(64);
  const pinnedHash = "c".repeat(64);
  const drift =
    `claim value/id on /docs/store6/concepts/value anchors Value.kt, but store6-claims.json records ${recordedHash} while pinned revision ${revision} hashes to ${pinnedHash}; ` +
    "re-verify the claim, then run check-claims.mjs --reconcile value/id\n  claim: Value changed.\n";
  const snippetDrift =
    `snippet sample on /docs/store6/guides/sample differs from samples/Sample.kt at ${revision}\n` +
    "--- samples/Sample.kt:sample\n" +
    "+++ content/docs/store6/guides/sample.mdx\n" +
    "-val answer = 42\n" +
    "+val answer = 41\n";
  const output = [];
  const failures = await runReverificationScripts("/fixture", {
    execute: async (script) => {
      if (script.endsWith("check-claims.mjs")) {
        throw Object.assign(new Error("review required"), {
          code: 1,
          stderr: drift,
          stdout: "",
        });
      }
      throw Object.assign(new Error("review required"), {
        code: 1,
        stderr: snippetDrift,
        stdout: "",
      });
    },
    print: (stdout, stderr) => output.push({ stderr, stdout }),
  });
  assert.deepEqual(failures, ["scripts/check-claims.mjs", "scripts/check-snippets.mjs"]);
  assert.deepEqual(output, [
    {
      stderr: drift,
      stdout: "",
    },
    { stderr: snippetDrift, stdout: "" },
  ]);
}

async function selfTestMissingPinnedBlobRollsBack() {
  const fixtureRoot = await mkdtemp(resolve(tmpdir(), "store6-repin-missing-blob-"));
  const lockPath = resolve(fixtureRoot, "lock.json");
  const claimsPath = resolve(fixtureRoot, "claims.json");
  const originalLock = Buffer.from('{"revision":"before"}\n');
  const originalClaims = Buffer.from('{"revision":"before","claims":[]}\n');
  const revision = "a".repeat(40);
  const diagnostic =
    `claim value/id on /docs/store6/concepts/value anchors Missing.kt; Missing.kt is missing from pinned revision ${revision}; ` +
    "re-verify the claim before reconciling\n  claim: Missing value.\n";
  try {
    await writeFile(lockPath, originalLock);
    await writeFile(claimsPath, originalClaims);
    await assert.rejects(
      withCoordinatedFileRollback([lockPath, claimsPath], async () => {
        await writeFile(lockPath, '{"revision":"after"}\n');
        await writeFile(claimsPath, '{"revision":"after","claims":[]}\n');
        await runReverificationScripts("/fixture", {
          execute: async () => {
            throw Object.assign(new Error(diagnostic.trim()), {
              code: 1,
              stderr: diagnostic,
              stdout: "",
            });
          },
          print: () => {},
          scripts: ["scripts/check-claims.mjs"],
        });
      }),
      /missing from pinned revision/,
    );
    assert.deepEqual(await readFile(lockPath), originalLock);
    assert.deepEqual(await readFile(claimsPath), originalClaims);
    assert.deepEqual(
      (await readdir(fixtureRoot)).filter((name) => name.includes(".tmp")),
      [],
    );
  } finally {
    await rm(fixtureRoot, { force: true, recursive: true });
  }
}

async function selfTestMultipleSnippetDriftsAreReviewable() {
  const revision = "d".repeat(40);
  const first =
    `snippet first on /docs/store6/guides/first differs from samples/First.kt at ${revision}\n` +
    "--- samples/First.kt:first\n" +
    "+++ content/docs/store6/guides/first.mdx\n" +
    "-val answer = 1\n" +
    "+val answer = 2\n";
  const second =
    `snippet second on /docs/store6/guides/second differs from samples/Second.kt at ${revision}\n` +
    "--- samples/Second.kt:second\n" +
    "+++ content/docs/store6/guides/second.mdx\n" +
    "-val enabled = false\n" +
    "+val enabled = true\n";
  assert.equal(
    classifyReverificationReport({
      output: `${first}${second}`,
      script: "scripts/check-snippets.mjs",
      status: 1,
    }),
    "review",
  );
  assert.equal(
    classifyReverificationReport({
      output: `${first}snippet second source path is missing: samples/Second.kt\n`,
      script: "scripts/check-snippets.mjs",
      status: 1,
    }),
    "hard",
  );
  assert.equal(
    classifyReverificationReport({
      output: `${first}snippet malformed on /docs/store6/guides/malformed differs from samples/Malformed.kt at ${revision}\n--- only-one-header\n`,
      script: "scripts/check-snippets.mjs",
      status: 1,
    }),
    "hard",
  );
}

async function selfTestHardReverificationFailurePropagates() {
  await assert.rejects(
    runReverificationScripts("/fixture", {
      execute: async () => {
        throw Object.assign(new Error("invalid Store6 claims ledger"), {
          code: 1,
          stderr: "invalid Store6 claims ledger\n",
          stdout: "",
        });
      },
      print: () => {},
      scripts: ["scripts/check-claims.mjs"],
    }),
    /invalid Store6 claims ledger/,
  );
}

async function selfTestMissingSnippetSourcePropagates() {
  await assert.rejects(
    runReverificationScripts("/fixture", {
      execute: async () => {
        throw Object.assign(new Error("snippet sample source path is missing"), {
          code: 1,
          stderr: "snippet sample source path is missing: samples/Sample.kt\n",
          stdout: "",
        });
      },
      print: () => {},
      scripts: ["scripts/check-snippets.mjs"],
    }),
    /snippet sample source path is missing/,
  );
}

async function selfTestGitReverificationFailurePropagates() {
  await assert.rejects(
    runReverificationScripts("/fixture", {
      execute: async () => {
        throw Object.assign(new Error("Store6 Git object lookup failed"), {
          code: 1,
          stderr: "Store6 Git object lookup failed: fatal: bad object\n",
          stdout: "",
        });
      },
      print: () => {},
      scripts: ["scripts/check-claims.mjs"],
    }),
    /Store6 Git object lookup failed/,
  );
}
