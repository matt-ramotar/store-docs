import { createHash, randomUUID } from "node:crypto";
import {
  chmod,
  lstat,
  mkdir,
  readFile,
  rename,
  rmdir,
  unlink,
  writeFile,
} from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";

const LEDGER_SCHEMA_VERSION = 1;

export async function reconcileOwnedOutputs({
  ledgerRelativePath,
  owner,
  outputs,
  root,
  testHooks = {},
}) {
  const repositoryRoot = resolve(root);
  const ledgerTarget = validateRelativeTarget(ledgerRelativePath);
  const normalizedOutputs = normalizeOutputs(outputs, ledgerTarget);
  const ledgerPath = resolve(repositoryRoot, ledgerTarget);

  await assertRegularDirectory(repositoryRoot, "repository root");
  await assertSafeTargetPaths(repositoryRoot, [ledgerTarget, ...normalizedOutputs.keys()]);
  const originalLedgerBytes = await readRequiredRegularFile(repositoryRoot, ledgerTarget);
  const originalLedger = validateOwnedTargetLedger(JSON.parse(originalLedgerBytes.toString("utf8")), ledgerTarget);
  const priorEntries = originalLedger.owners[owner] ?? [];
  const priorPaths = new Set(priorEntries.map((entry) => entry.path));
  const nextEntries = [...normalizedOutputs]
    .map(([path, content]) => ({ path, sha256: sha256(content) }))
    .sort(compareEntries);
  const nextPaths = new Set(nextEntries.map((entry) => entry.path));
  const staleEntries = priorEntries.filter((entry) => !nextPaths.has(entry.path));

  const otherOwnedPaths = new Set(
    Object.entries(originalLedger.owners)
      .filter(([otherOwner]) => otherOwner !== owner)
      .flatMap(([, entries]) => entries.map((entry) => entry.path)),
  );
  for (const entry of nextEntries) {
    if (otherOwnedPaths.has(entry.path)) throw new Error(`OWNED_TARGET_COLLISION: ${entry.path}`);
    if (!priorPaths.has(entry.path) && (await lstatOptional(resolve(repositoryRoot, entry.path))) !== null) {
      throw new Error(`OWNED_TARGET_UNCLAIMED: ${entry.path}`);
    }
  }

  await assertSafeTargetPaths(repositoryRoot, staleEntries.map((entry) => entry.path));
  for (const entry of staleEntries) {
    const bytes = await readOptionalRegularFile(repositoryRoot, entry.path);
    if (bytes !== null && sha256(bytes) !== entry.sha256) {
      throw new Error(`OWNED_STALE_MODIFIED: ${entry.path}`);
    }
  }

  const nextLedger = {
    schemaVersion: LEDGER_SCHEMA_VERSION,
    owners: Object.fromEntries(
      [...new Set([...Object.keys(originalLedger.owners), owner])]
        .sort()
        .map((ownerName) => [ownerName, ownerName === owner ? nextEntries : originalLedger.owners[ownerName]]),
    ),
  };
  validateOwnedTargetLedger(nextLedger, ledgerTarget);
  const nextLedgerBytes = Buffer.from(`${JSON.stringify(nextLedger, null, 2)}\n`);
  const targetModes = new Map();
  for (const entry of nextEntries) {
    const stat = await lstatOptional(resolve(repositoryRoot, entry.path));
    targetModes.set(entry.path, stat === null ? 0o644 : stat.mode & 0o777);
  }
  const ledgerMode = (await lstat(ledgerPath)).mode & 0o777;

  const transactionRelative = `.t4-transaction-${randomUUID()}`;
  const transactionPath = resolve(repositoryRoot, transactionRelative);
  await assertSafeTargetPaths(repositoryRoot, [transactionRelative]);
  await mkdir(transactionPath, { mode: 0o700 });

  const createdDirectories = [];
  const staged = new Map();
  const backups = new Map();
  const installed = new Set();
  try {
    let stageIndex = 0;
    for (const [target, content] of normalizedOutputs) {
      const stagePath = resolve(transactionPath, `output-${stageIndex}`);
      await writeStagedFile(stagePath, content, targetModes.get(target));
      staged.set(target, stagePath);
      stageIndex += 1;
    }
    const ledgerStagePath = resolve(transactionPath, "ledger-next");
    await writeStagedFile(ledgerStagePath, nextLedgerBytes, ledgerMode);

    const parentTargets = [...normalizedOutputs.keys(), ledgerTarget];
    for (const target of parentTargets) {
      await createMissingParents(repositoryRoot, target, createdDirectories);
    }

    const targetsToBackup = [
      ...new Set([...normalizedOutputs.keys(), ...staleEntries.map((entry) => entry.path), ledgerTarget]),
    ];
    let backupIndex = 0;
    for (const target of targetsToBackup) {
      await assertSafeTargetPaths(repositoryRoot, [target]);
      const existing = await lstatOptional(resolve(repositoryRoot, target));
      if (existing === null) continue;
      if (!existing.isFile() || existing.isSymbolicLink()) throw new Error(`OWNED_TARGET_NOT_REGULAR: ${target}`);
      const backupPath = resolve(transactionPath, `backup-${backupIndex}`);
      await rename(resolve(repositoryRoot, target), backupPath);
      backups.set(target, backupPath);
      backupIndex += 1;
    }

    for (const [target, stagePath] of staged) {
      await assertSafeTargetPaths(repositoryRoot, [target]);
      await rename(stagePath, resolve(repositoryRoot, target));
      installed.add(target);
    }

    await testHooks.beforeLedgerInstall?.();
    await assertSafeTargetPaths(repositoryRoot, [ledgerTarget]);
    await rename(ledgerStagePath, ledgerPath);
  } catch (error) {
    const rollbackErrors = [];
    for (const target of [...installed].reverse()) {
      try {
        await assertSafeTargetPaths(repositoryRoot, [target]);
        await unlink(resolve(repositoryRoot, target));
      } catch (rollbackError) {
        if (rollbackError?.code !== "ENOENT") rollbackErrors.push(rollbackError);
      }
    }
    for (const [target, backupPath] of [...backups].reverse()) {
      try {
        await assertSafeTargetPaths(repositoryRoot, [target]);
        await rename(backupPath, resolve(repositoryRoot, target));
      } catch (rollbackError) {
        rollbackErrors.push(rollbackError);
      }
    }
    for (const stagePath of staged.values()) {
      try {
        await unlink(stagePath);
      } catch (rollbackError) {
        if (rollbackError?.code !== "ENOENT") rollbackErrors.push(rollbackError);
      }
    }
    try {
      await unlink(resolve(transactionPath, "ledger-next"));
    } catch (rollbackError) {
      if (rollbackError?.code !== "ENOENT") rollbackErrors.push(rollbackError);
    }
    for (const directory of [...createdDirectories].reverse()) {
      try {
        await rmdir(directory);
      } catch (rollbackError) {
        if (rollbackError?.code !== "ENOENT" && rollbackError?.code !== "ENOTEMPTY") rollbackErrors.push(rollbackError);
      }
    }
    try {
      await rmdir(transactionPath);
    } catch (rollbackError) {
      if (rollbackError?.code !== "ENOENT" && rollbackError?.code !== "ENOTEMPTY") rollbackErrors.push(rollbackError);
    }
    if (rollbackErrors.length > 0) {
      throw new AggregateError([error, ...rollbackErrors], "owned-output transaction and rollback failed");
    }
    throw error;
  }

  const cleanupErrors = [];
  try {
    await testHooks.afterLedgerInstall?.();
  } catch (error) {
    cleanupErrors.push(error);
  }
  for (const backupPath of backups.values()) {
    try {
      await unlink(backupPath);
    } catch (error) {
      if (error?.code !== "ENOENT") cleanupErrors.push(error);
    }
  }
  try {
    await rmdir(transactionPath);
  } catch (error) {
    cleanupErrors.push(error);
  }
  if (cleanupErrors.length > 0) {
    throw new AggregateError(
      cleanupErrors,
      `OWNED_OUTPUT_COMMITTED_CLEANUP_FAILED: outputs and ledger are committed; rerunning is safe but does not retry cleanup for ${transactionRelative}; if that path still exists, inspect it and remove verified transaction leftovers manually`,
    );
  }
  return nextLedger;
}

export async function verifyOwnedOutputs({ ledgerRelativePath, owner, outputs, root }) {
  const repositoryRoot = resolve(root);
  const ledgerTarget = validateRelativeTarget(ledgerRelativePath);
  const normalizedOutputs = normalizeOutputs(outputs, ledgerTarget);
  await assertRegularDirectory(repositoryRoot, "repository root");
  await assertSafeTargetPaths(repositoryRoot, [ledgerTarget, ...normalizedOutputs.keys()]);
  const ledgerBytes = await readRequiredRegularFile(repositoryRoot, ledgerTarget);
  const ledger = validateOwnedTargetLedger(JSON.parse(ledgerBytes.toString("utf8")), ledgerTarget);
  const expected = [...normalizedOutputs]
    .map(([path, content]) => ({ path, sha256: sha256(content) }))
    .sort(compareEntries);
  if (JSON.stringify(ledger.owners[owner] ?? []) !== JSON.stringify(expected)) {
    throw new Error(`OWNED_CENSUS_MISMATCH: ${owner}`);
  }
  for (const [path, content] of normalizedOutputs) {
    const actual = await readRequiredRegularFile(repositoryRoot, path);
    if (!actual.equals(Buffer.from(content))) throw new Error(`${path}: generated output differs`);
  }
}

export function validateOwnedTargetLedger(value, ledgerRelativePath = "evidence/T4-owned-targets.json") {
  if (!value || value.schemaVersion !== LEDGER_SCHEMA_VERSION || !isPlainObject(value.owners)) {
    throw new Error("OWNED_LEDGER_INVALID: metadata");
  }
  const seen = new Set();
  for (const [owner, entries] of Object.entries(value.owners)) {
    if (!owner || !Array.isArray(entries)) throw new Error("OWNED_LEDGER_INVALID: owner");
    const sorted = [...entries].sort(compareEntries);
    if (JSON.stringify(entries) !== JSON.stringify(sorted)) throw new Error(`OWNED_LEDGER_INVALID: unsorted ${owner}`);
    for (const entry of entries) {
      if (!entry || typeof entry.path !== "string" || !/^[a-f0-9]{64}$/.test(entry.sha256 ?? "")) {
        throw new Error(`OWNED_LEDGER_INVALID: entry ${owner}`);
      }
      const target = validateRelativeTarget(entry.path, ledgerRelativePath);
      if (seen.has(target)) throw new Error(`OWNED_TARGET_COLLISION: ${target}`);
      seen.add(target);
    }
  }
  return value;
}

export async function assertSafeTargetPaths(root, relativePaths) {
  const repositoryRoot = resolve(root);
  await assertRegularDirectory(repositoryRoot, "repository root");
  for (const rawTarget of relativePaths) {
    const target = validateRelativeTarget(rawTarget);
    const segments = target.split("/");
    let current = repositoryRoot;
    for (let index = 0; index < segments.length; index += 1) {
      current = resolve(current, segments[index]);
      const stat = await lstatOptional(current);
      if (stat === null) break;
      if (stat.isSymbolicLink()) throw new Error(`OWNED_TARGET_SYMLINK: ${target}`);
      const leaf = index === segments.length - 1;
      if (!leaf && !stat.isDirectory()) throw new Error(`OWNED_TARGET_PARENT_NOT_DIRECTORY: ${target}`);
      if (leaf && !stat.isFile()) throw new Error(`OWNED_TARGET_NOT_REGULAR: ${target}`);
    }
  }
}

async function createMissingParents(root, target, createdDirectories) {
  const segments = dirname(target).split("/").filter((segment) => segment && segment !== ".");
  let current = root;
  for (const segment of segments) {
    await assertSafeAbsoluteDirectory(current, target);
    current = resolve(current, segment);
    const stat = await lstatOptional(current);
    if (stat === null) {
      await mkdir(current, { mode: 0o755 });
      createdDirectories.push(current);
      continue;
    }
    if (stat.isSymbolicLink()) throw new Error(`OWNED_TARGET_SYMLINK: ${target}`);
    if (!stat.isDirectory()) throw new Error(`OWNED_TARGET_PARENT_NOT_DIRECTORY: ${target}`);
  }
}

async function assertSafeAbsoluteDirectory(path, target) {
  const stat = await lstat(path);
  if (stat.isSymbolicLink()) throw new Error(`OWNED_TARGET_SYMLINK: ${target}`);
  if (!stat.isDirectory()) throw new Error(`OWNED_TARGET_PARENT_NOT_DIRECTORY: ${target}`);
}

async function readRequiredRegularFile(root, target) {
  const value = await readOptionalRegularFile(root, target);
  if (value === null) throw new Error(`OWNED_TARGET_MISSING: ${target}`);
  return value;
}

async function readOptionalRegularFile(root, target) {
  await assertSafeTargetPaths(root, [target]);
  const path = resolve(root, target);
  const stat = await lstatOptional(path);
  if (stat === null) return null;
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`OWNED_TARGET_NOT_REGULAR: ${target}`);
  return readFile(path);
}

async function assertRegularDirectory(path, label) {
  const stat = await lstat(path);
  if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error(`OWNED_TARGET_ROOT_INVALID: ${label}`);
}

async function lstatOptional(path) {
  try {
    return await lstat(path);
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

async function writeStagedFile(path, content, mode) {
  await writeFile(path, content, { flag: "wx", mode });
  await chmod(path, mode);
}

function normalizeOutputs(outputs, ledgerTarget) {
  if (!(outputs instanceof Map) || outputs.size === 0) throw new Error("OWNED_OUTPUTS_EMPTY");
  const normalized = new Map();
  for (const [rawTarget, rawContent] of outputs) {
    const target = validateRelativeTarget(rawTarget, ledgerTarget);
    if (normalized.has(target)) throw new Error(`OWNED_OUTPUT_DUPLICATE: ${target}`);
    if (typeof rawContent !== "string" && !Buffer.isBuffer(rawContent)) {
      throw new Error(`OWNED_OUTPUT_INVALID: ${target}`);
    }
    normalized.set(target, rawContent);
  }
  return new Map([...normalized].sort(([left], [right]) => left.localeCompare(right)));
}

function validateRelativeTarget(target, ledgerTarget) {
  if (
    typeof target !== "string" ||
    target.length === 0 ||
    isAbsolute(target) ||
    target.includes("\\") ||
    /[\u0000-\u001f\u007f]/.test(target)
  ) {
    throw new Error(`OWNED_TARGET_INVALID: ${target}`);
  }
  const segments = target.split("/");
  if (segments.some((segment) => segment.length === 0 || segment === "." || segment === "..")) {
    throw new Error(`OWNED_TARGET_INVALID: ${target}`);
  }
  if (ledgerTarget && target === ledgerTarget) throw new Error(`OWNED_LEDGER_SELF_OWNERSHIP: ${target}`);
  return target;
}

function compareEntries(left, right) {
  return left.path.localeCompare(right.path);
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}
