import { execFile as execFileCallback } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { readFile, readdir, realpath, rename, stat, unlink, writeFile } from "node:fs/promises";
import { basename, dirname, posix, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFile = promisify(execFileCallback);
const ROOT = resolve(import.meta.dirname, "..");
const CLAIMS_FILE = "evidence/store6-claims.json";
const LOCK_FILE = "evidence/T4-store6-source-lock.json";
const USAGE = "usage: check-claims.mjs --source-root <checkout> [--reconcile <id> | --reconcile-all]";
const COMMIT_PATTERN = /^[0-9a-f]{40}$/;
const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const VERDICTS = new Set(["CONFIRMED", "REFUTED", "UNSAMPLED"]);

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  try {
    const result = await checkClaims(parseArguments(process.argv.slice(2)));
    if (result.reconciledClaimCount > 0 && result.mutated) {
      console.log(
        `reconciled ${result.reconciledClaimCount} claims; checked ${result.claimCount} claims (${result.anchorCount} anchors) at ${result.revision}`,
      );
    } else if (result.reconciledClaimCount > 0) {
      console.log(
        `reconciliation made no hash changes; checked ${result.claimCount} claims (${result.anchorCount} anchors) at ${result.revision}`,
      );
    } else {
      console.log(`checked ${result.claimCount} claims (${result.anchorCount} anchors) at ${result.revision}`);
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

export function parseArguments(argumentsList) {
  let sourceRoot;
  let reconcileAll = false;
  let reconcileId;
  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    if (argument === "--source-root") {
      if (sourceRoot !== undefined) throw new Error("--source-root may be specified only once");
      sourceRoot = argumentsList[index + 1];
      if (!sourceRoot || sourceRoot.startsWith("--")) throw new Error(USAGE);
      index += 1;
    } else if (argument === "--reconcile") {
      if (reconcileId !== undefined) throw new Error("--reconcile may be specified only once");
      reconcileId = argumentsList[index + 1];
      if (!reconcileId || reconcileId.startsWith("--")) throw new Error(USAGE);
      index += 1;
    } else if (argument === "--reconcile-all") {
      reconcileAll = true;
    } else {
      throw new Error(`unknown argument: ${argument}`);
    }
  }
  if (!sourceRoot) throw new Error(USAGE);
  if (reconcileAll && reconcileId !== undefined) {
    throw new Error("--reconcile and --reconcile-all are mutually exclusive");
  }
  return { reconcileAll, reconcileId, sourceRoot };
}

export async function checkClaims({ reconcileAll = false, reconcileId, root = ROOT, sourceRoot }) {
  if (reconcileAll && reconcileId !== undefined) {
    throw new Error("--reconcile and --reconcile-all are mutually exclusive");
  }

  const repositoryRoot = resolve(root);
  const claimsPath = resolve(repositoryRoot, CLAIMS_FILE);
  const lockPath = resolve(repositoryRoot, LOCK_FILE);
  const [claimsDocument, lockDocument] = await Promise.all([
    readJsonDocument(claimsPath, CLAIMS_FILE),
    readJsonDocument(lockPath, LOCK_FILE),
  ]);
  validateClaimsLedger(claimsDocument.value);
  validateSourceLock(lockDocument.value);

  const claims = claimsDocument.value;
  const lock = lockDocument.value;
  if (claims.revision !== lock.revision) {
    throw new Error("store6-claims.json is pinned to a different Store6 revision than the source lock");
  }

  const selectedIndexes = selectClaims(claims, reconcileAll, reconcileId);
  const censusIssues = await collectCensusIssues(repositoryRoot, lock, claims);
  if (censusIssues.length > 0) throw new Error(censusIssues.join("\n"));

  const store6Context = await preflightStore6Root(sourceRoot, claims.revision);
  const storeDocsContext = await prepareRepositoryRoot(repositoryRoot, "store-docs");
  const candidate = structuredClone(claims);
  const pinnedBlobs = new Map();
  const workingFiles = new Map();

  for (const index of selectedIndexes) {
    const selected = candidate.claims[index];
    for (let anchorIndex = 0; anchorIndex < selected.anchors.length; anchorIndex += 1) {
      const anchor = selected.anchors[anchorIndex];
      const jsonPath = `$.claims[${index}].anchors[${anchorIndex}]`;
      const pinned =
        anchor.repository === "store6"
          ? await readPinnedBlob(store6Context, claims.revision, anchor.path, pinnedBlobs)
          : undefined;
      const content =
        anchor.repository === "store6"
          ? pinned?.content
          : await readWorkingFile(storeDocsContext, anchor.path, CLAIMS_FILE, `${jsonPath}.path`, workingFiles);
      if (content === undefined) {
        const message =
          anchor.repository === "store6"
            ? missingPinnedAnchorMessage(selected, anchor, claims.revision)
            : changedAnchorMessage(selected, anchor, claims.revision);
        throw new Error(message);
      }
      anchor.sha256 = sha256(content);
    }
  }

  const inspection = await inspectAnchors({
    claims: candidate,
    pinnedBlobs,
    revision: claims.revision,
    store6Context,
    storeDocsContext,
    workingFiles,
  });
  if (inspection.integrityIssues.length > 0) {
    throw new Error(inspection.integrityIssues.join("\n"));
  }

  const candidateText = serializeJson(candidate);
  const mutationRequested = reconcileAll || reconcileId !== undefined;
  const mutated = mutationRequested && candidateText !== claimsDocument.text;
  if (mutated) await writeFileAtomically(claimsPath, candidateText);

  if (inspection.driftIssues.length > 0) {
    const mutationNotice = mutated
      ? `store6-claims.json was updated for ${selectedIndexes.length} explicitly reconciled ${pluralize("claim", selectedIndexes.length)}; remaining anchor drift follows:\n`
      : "";
    throw new Error(`${mutationNotice}${inspection.driftIssues.join("\n")}`);
  }

  return {
    anchorCount: inspection.anchorCount,
    claimCount: candidate.claims.length,
    mutated,
    reconciledClaimCount: selectedIndexes.length,
    revision: candidate.revision,
  };
}

function validateClaimsLedger(value) {
  assertObject(value, CLAIMS_FILE, "$", "expected an object");
  if (value.schemaVersion !== 1) schemaError(CLAIMS_FILE, "$.schemaVersion", "expected 1");
  validateCommit(value.revision, CLAIMS_FILE, "$.revision");
  if (!Array.isArray(value.claims)) schemaError(CLAIMS_FILE, "$.claims", "expected an array");

  const claimIds = new Map();
  const pageOccurrences = new Map();
  for (let claimIndex = 0; claimIndex < value.claims.length; claimIndex += 1) {
    const claim = value.claims[claimIndex];
    const claimPath = `$.claims[${claimIndex}]`;
    assertObject(claim, CLAIMS_FILE, claimPath, "expected an object");
    validatePage(claim.page, CLAIMS_FILE, `${claimPath}.page`);
    validateNonemptyString(claim.id, CLAIMS_FILE, `${claimPath}.id`);
    if (claimIds.has(claim.id)) {
      schemaError(
        CLAIMS_FILE,
        `${claimPath}.id`,
        `duplicate claim id: ${claim.id}; first used at $.claims[${claimIds.get(claim.id)}].id`,
      );
    }
    claimIds.set(claim.id, claimIndex);
    const occurrence = (pageOccurrences.get(claim.page) ?? 0) + 1;
    pageOccurrences.set(claim.page, occurrence);
    const expectedId = `${pageIdPrefix(claim.page)}/${String(occurrence).padStart(3, "0")}`;
    if (claim.id !== expectedId) {
      schemaError(CLAIMS_FILE, `${claimPath}.id`, `expected ${JSON.stringify(expectedId)} for this page and order`);
    }
    validateNonemptyString(claim.claim, CLAIMS_FILE, `${claimPath}.claim`);
    if (!VERDICTS.has(claim.verdict)) {
      schemaError(CLAIMS_FILE, `${claimPath}.verdict`, "expected CONFIRMED, REFUTED, or UNSAMPLED");
    }
    if (claim.note !== undefined) validateNonemptyString(claim.note, CLAIMS_FILE, `${claimPath}.note`);
    if (claim.correction !== undefined) {
      validateNonemptyString(claim.correction, CLAIMS_FILE, `${claimPath}.correction`);
    }
    if (!Array.isArray(claim.anchors) || claim.anchors.length === 0) {
      schemaError(CLAIMS_FILE, `${claimPath}.anchors`, `claim ${claim.id} must have at least one anchor`);
    }
    for (let anchorIndex = 0; anchorIndex < claim.anchors.length; anchorIndex += 1) {
      const anchor = claim.anchors[anchorIndex];
      const anchorPath = `${claimPath}.anchors[${anchorIndex}]`;
      assertObject(anchor, CLAIMS_FILE, anchorPath, "expected an object");
      if (anchor.repository !== "store6" && anchor.repository !== "store-docs") {
        schemaError(
          CLAIMS_FILE,
          `${anchorPath}.repository`,
          `claim ${claim.id} has unsupported anchor repository: ${String(anchor.repository)}`,
        );
      }
      validateSafeRelativePath(anchor.path, CLAIMS_FILE, `${anchorPath}.path`, {
        rejectPrivateRecords: anchor.repository === "store6",
      });
      validateSha256(anchor.sha256, CLAIMS_FILE, `${anchorPath}.sha256`);
      if (anchor.lines !== undefined) validateLines(anchor.lines, CLAIMS_FILE, `${anchorPath}.lines`);
    }
  }
}

function validateSourceLock(value) {
  assertObject(value, LOCK_FILE, "$", "expected an object");
  if (value.schemaVersion !== 1) schemaError(LOCK_FILE, "$.schemaVersion", "expected 1");
  validateCommit(value.revision, LOCK_FILE, "$.revision");
  if (!Array.isArray(value.sources)) schemaError(LOCK_FILE, "$.sources", "expected an array");

  const sourcePaths = new Map();
  const targets = new Map();
  for (let index = 0; index < value.sources.length; index += 1) {
    const source = value.sources[index];
    const sourcePath = `$.sources[${index}]`;
    assertObject(source, LOCK_FILE, sourcePath, "expected an object");
    validateSafeRelativePath(source.path, LOCK_FILE, `${sourcePath}.path`);
    validateSha256(source.sha256, LOCK_FILE, `${sourcePath}.sha256`);
    validateSafeRelativePath(source.target, LOCK_FILE, `${sourcePath}.target`);
    if (source.target !== "public/llms.txt" && !/^content\/docs\/store6\/.+\.mdx$/.test(source.target)) {
      schemaError(LOCK_FILE, `${sourcePath}.target`, "expected public/llms.txt or a content/docs/store6/**/*.mdx target");
    }
    if (source.markdownLinkCount !== undefined && (!Number.isInteger(source.markdownLinkCount) || source.markdownLinkCount < 0)) {
      schemaError(LOCK_FILE, `${sourcePath}.markdownLinkCount`, "expected a non-negative integer");
    }
    rejectDuplicate(sourcePaths, source.path, LOCK_FILE, `${sourcePath}.path`, "source path", index);
    rejectDuplicate(targets, source.target, LOCK_FILE, `${sourcePath}.target`, "target", index);
  }
}

function validateSafeRelativePath(value, filename, jsonPath, { rejectPrivateRecords = false } = {}) {
  validateNonemptyString(value, filename, jsonPath);
  if (value.includes("\0") || value.includes("\\") || posix.isAbsolute(value)) {
    schemaError(filename, jsonPath, "expected a normalized POSIX-relative path");
  }
  const normalized = posix.normalize(value);
  if (rejectPrivateRecords && (normalized === "docs/v6" || normalized.startsWith("docs/v6/"))) {
    schemaError(
      filename,
      jsonPath,
      "claims may not anchor private decision records; anchor the code or a tracked doc",
    );
  }
  const segments = value.split("/");
  if (
    normalized !== value ||
    normalized === "." ||
    segments.some((segment) => segment === "" || segment === "." || segment === "..")
  ) {
    schemaError(filename, jsonPath, "expected a normalized POSIX-relative path");
  }
}

function validatePage(value, filename, jsonPath) {
  validateNonemptyString(value, filename, jsonPath);
  if (
    value.includes("\0") ||
    value.includes("\\") ||
    value.includes("?") ||
    value.includes("#") ||
    posix.normalize(value) !== value ||
    (value !== "/" && value.endsWith("/")) ||
    !/^\/(?:[a-z0-9][a-z0-9.-]*(?:\/[a-z0-9][a-z0-9.-]*)*)?$/.test(value)
  ) {
    schemaError(filename, jsonPath, "expected a normalized lowercase absolute route without query or fragment");
  }
}

function validateLines(value, filename, jsonPath) {
  assertObject(value, filename, jsonPath, "expected { start, end }");
  if (
    !Number.isInteger(value.start) ||
    !Number.isInteger(value.end) ||
    value.start < 1 ||
    value.end < value.start
  ) {
    schemaError(filename, jsonPath, "expected positive integer start and end with start <= end");
  }
}

function validateCommit(value, filename, jsonPath) {
  if (typeof value !== "string" || !COMMIT_PATTERN.test(value)) {
    schemaError(filename, jsonPath, "expected a full 40-character lowercase hexadecimal commit");
  }
}

function validateSha256(value, filename, jsonPath) {
  if (typeof value !== "string" || !SHA256_PATTERN.test(value)) {
    schemaError(filename, jsonPath, "expected a 64-character lowercase hexadecimal SHA-256");
  }
}

function validateNonemptyString(value, filename, jsonPath) {
  if (typeof value !== "string" || value.trim().length === 0) {
    schemaError(filename, jsonPath, "expected a nonempty string");
  }
}

function assertObject(value, filename, jsonPath, message) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) schemaError(filename, jsonPath, message);
}

function schemaError(filename, jsonPath, message) {
  throw new Error(`${filename} ${jsonPath}: ${message}`);
}

function rejectDuplicate(seen, value, filename, jsonPath, label, index) {
  if (seen.has(value)) {
    schemaError(filename, jsonPath, `duplicate ${label}: ${value}; first used at $.sources[${seen.get(value)}]`);
  }
  seen.set(value, index);
}

function pageIdPrefix(page) {
  if (page === "/") return "home";
  const route = page.slice(1);
  return route.endsWith(".html") ? route.slice(0, -".html".length) : route;
}

function selectClaims(claims, reconcileAll, reconcileId) {
  if (reconcileAll) return claims.claims.map((_, index) => index);
  if (reconcileId === undefined) return [];
  const index = claims.claims.findIndex((claim) => claim.id === reconcileId);
  if (index === -1) throw new Error(`unknown claim id: ${reconcileId}`);
  return [index];
}

async function preflightStore6Root(sourceRoot, revision) {
  if (typeof sourceRoot !== "string" || sourceRoot.length === 0) throw new Error(USAGE);
  const resolvedRoot = resolve(sourceRoot);
  let realRoot;
  try {
    realRoot = await realpath(resolvedRoot);
  } catch (error) {
    throw new Error(`Store6 source root Git preflight failed for ${resolvedRoot}\ngit stderr: ${error.message}`);
  }

  const topLevel = await runGit(
    ["-C", realRoot, "rev-parse", "--show-toplevel"],
    `Store6 source root Git preflight failed for ${realRoot}`,
  );
  const realTopLevel = await realpath(bufferText(topLevel.stdout).trim());
  if (realTopLevel !== realRoot) {
    throw new Error(
      `Store6 source root Git preflight failed for ${realRoot}\ngit stderr: checkout root is ${realTopLevel}`,
    );
  }
  await runGit(
    ["-C", realRoot, "rev-parse", "--verify", "--end-of-options", `${revision}^{commit}`],
    `Store6 source root Git preflight failed for pinned revision ${revision}`,
  );
  return { label: "store6", realRoot, root: resolvedRoot };
}

async function prepareRepositoryRoot(root, label) {
  const resolvedRoot = resolve(root);
  return { label, realRoot: await realpath(resolvedRoot), root: resolvedRoot };
}

async function runGit(argumentsList, operation) {
  try {
    return await execFile("git", argumentsList, { encoding: "buffer", maxBuffer: 64 * 1024 * 1024 });
  } catch (error) {
    const stderr = bufferText(error?.stderr).trim();
    throw new Error(`${operation}\ngit stderr: ${stderr || error.message}`);
  }
}

async function readPinnedBlob(context, revision, path, cache) {
  if (cache.has(path)) return cache.get(path);
  const tree = await runGit(
    ["-C", context.realRoot, "ls-tree", "-z", "--full-tree", revision, "--", path],
    `Store6 Git object lookup failed for ${revision}:${path}`,
  );
  if (tree.stdout.length === 0) {
    cache.set(path, undefined);
    return undefined;
  }
  const record = tree.stdout.subarray(0, tree.stdout.indexOf(0)).toString("utf8");
  const tab = record.indexOf("\t");
  const [mode, type, object] = record.slice(0, tab).split(" ");
  const recordPath = record.slice(tab + 1);
  if (tab === -1 || recordPath !== path || type !== "blob" || !/^[0-9a-f]{40,64}$/.test(object) || !/^100[0-7]{3}$|^120000$/.test(mode)) {
    cache.set(path, undefined);
    return undefined;
  }
  const blob = await runGit(
    ["-C", context.realRoot, "cat-file", "blob", object],
    `Store6 Git blob read failed for ${revision}:${path}`,
  );
  const pinned = { content: blob.stdout, mode };
  cache.set(path, pinned);
  return pinned;
}

async function inspectAnchors({ claims, pinnedBlobs, revision, store6Context, storeDocsContext, workingFiles }) {
  const integrityIssues = [];
  const driftIssues = [];
  let anchorCount = 0;
  for (let claimIndex = 0; claimIndex < claims.claims.length; claimIndex += 1) {
    const claim = claims.claims[claimIndex];
    for (let anchorIndex = 0; anchorIndex < claim.anchors.length; anchorIndex += 1) {
      anchorCount += 1;
      const anchor = claim.anchors[anchorIndex];
      const jsonPath = `$.claims[${claimIndex}].anchors[${anchorIndex}]`;
      if (anchor.repository === "store6") {
        const pinned = await readPinnedBlob(store6Context, revision, anchor.path, pinnedBlobs);
        if (pinned === undefined) {
          integrityIssues.push(missingPinnedAnchorMessage(claim, anchor, revision));
          continue;
        }
        if (pinned.mode === "120000") {
          integrityIssues.push(committedSymlinkMessage(claim, anchor, claimIndex, anchorIndex, revision));
          continue;
        }
        const pinnedHash = sha256(pinned.content);
        if (anchor.sha256 !== pinnedHash) {
          driftIssues.push(pinnedHashMismatchMessage(claim, anchor, revision, pinnedHash));
          continue;
        }
      }
      const context = anchor.repository === "store6" ? store6Context : storeDocsContext;
      const content = await readWorkingFile(context, anchor.path, CLAIMS_FILE, `${jsonPath}.path`, workingFiles);
      if (content === undefined || sha256(content) !== anchor.sha256) {
        driftIssues.push(changedAnchorMessage(claim, anchor, revision));
      }
    }
  }
  return { anchorCount, driftIssues, integrityIssues };
}

async function readWorkingFile(context, path, filename, jsonPath, cache) {
  const cacheKey = `${context.label}\0${path}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);
  const target = resolve(context.root, path);
  let targetRealPath;
  try {
    targetRealPath = await realpath(target);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
    await assertNearestExistingParentInsideRoot(dirname(target), context, filename, jsonPath);
    cache.set(cacheKey, undefined);
    return undefined;
  }
  if (!isWithinOrEqual(context.realRoot, targetRealPath)) {
    throw new Error(`${filename} ${jsonPath} resolves outside the ${context.label} root through a symlink`);
  }
  const targetStat = await stat(targetRealPath);
  if (!targetStat.isFile()) {
    cache.set(cacheKey, undefined);
    return undefined;
  }
  const content = await readFile(target);
  cache.set(cacheKey, content);
  return content;
}

async function assertNearestExistingParentInsideRoot(start, context, filename, jsonPath) {
  let candidate = start;
  while (true) {
    try {
      const candidateRealPath = await realpath(candidate);
      if (!isWithinOrEqual(context.realRoot, candidateRealPath)) {
        throw new Error(`${filename} ${jsonPath} resolves outside the ${context.label} root through a symlink`);
      }
      return;
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
      if (candidate === context.root) return;
      const parent = dirname(candidate);
      if (parent === candidate) return;
      candidate = parent;
    }
  }
}

function isWithinOrEqual(root, path) {
  const relativePath = relative(root, path);
  return relativePath === "" || (relativePath !== ".." && !relativePath.startsWith(`..${sep}`));
}

function changedAnchorMessage(claim, anchor, revision) {
  const path = displayAnchorPath(anchor);
  const drift =
    anchor.repository === "store-docs"
      ? "whose whole-file hash no longer matches store6-claims.json"
      : `which changed since ${revision}`;
  return `claim ${claim.id} on ${claim.page} anchors ${path}, ${drift}; re-verify the claim, then run check-claims.mjs --reconcile ${claim.id}\n  claim: ${claim.claim}`;
}

function missingPinnedAnchorMessage(claim, anchor, revision) {
  return `claim ${claim.id} on ${claim.page} anchors ${anchor.path}; ${anchor.path} is missing from pinned revision ${revision}; re-verify the claim before reconciling\n  claim: ${claim.claim}`;
}

function pinnedHashMismatchMessage(claim, anchor, revision, pinnedHash) {
  return `claim ${claim.id} on ${claim.page} anchors ${anchor.path}, but store6-claims.json records ${anchor.sha256} while pinned revision ${revision} hashes to ${pinnedHash}; re-verify the claim, then run check-claims.mjs --reconcile ${claim.id}\n  claim: ${claim.claim}`;
}

function committedSymlinkMessage(claim, anchor, claimIndex, anchorIndex, revision) {
  return `${CLAIMS_FILE} $.claims[${claimIndex}].anchors[${anchorIndex}].path: claim ${claim.id} on ${claim.page} anchors committed Store6 symlink ${anchor.path} at pinned revision ${revision}; anchor the regular file containing the evidence instead\n  claim: ${claim.claim}`;
}

function displayAnchorPath(anchor) {
  return anchor.repository === "store-docs" ? `store-docs/${anchor.path}` : anchor.path;
}

async function collectCensusIssues(root, lock, claims) {
  const issues = [];
  const lockedTargets = new Set(lock.sources.map((source) => source.target));
  const claimedPages = new Set(claims.claims.map((claim) => claim.page));
  for (const path of await listMdxFiles(resolve(root, "content/docs/store6"))) {
    const relativePath = relative(root, path).split(sep).join("/");
    if (relativePath === "content/docs/store6/overview.mdx" || lockedTargets.has(relativePath)) continue;
    const route = `/${relativePath.slice("content/".length, -".mdx".length)}`.replace(/\/index$/, "");
    if (!claimedPages.has(route)) issues.push(`hand-authored page ${route} has no entries in store6-claims.json`);
  }
  return issues;
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

async function readJsonDocument(path, filename) {
  const text = await readFile(path, "utf8");
  try {
    return { text, value: JSON.parse(text) };
  } catch (error) {
    throw new Error(`${filename} $: invalid JSON: ${error.message}`);
  }
}

async function writeFileAtomically(path, content) {
  const mode = (await stat(path)).mode & 0o777;
  const temporaryPath = resolve(dirname(path), `.${basename(path)}.${process.pid}.${randomUUID()}.tmp`);
  let installed = false;
  try {
    await writeFile(temporaryPath, content, { encoding: "utf8", flag: "wx", mode });
    await rename(temporaryPath, path);
    installed = true;
  } finally {
    if (!installed) {
      try {
        await unlink(temporaryPath);
      } catch (error) {
        if (error?.code !== "ENOENT") throw error;
      }
    }
  }
}

function serializeJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function bufferText(value) {
  if (Buffer.isBuffer(value)) return value.toString("utf8");
  return value === undefined || value === null ? "" : String(value);
}

function pluralize(word, count) {
  return count === 1 ? word : `${word}s`;
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}
