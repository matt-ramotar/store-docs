import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  chmodSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import test from "node:test";

const ROOT = resolve(import.meta.dirname, "..");
const LEDGER_PATH = resolve(ROOT, "evidence/T4-owned-targets.json");

test("committed ledger records disjoint live, snapshot, and Store6 censuses", async () => {
  const { derivePortPageOwnedTargets } = await import("./port-page.mjs");
  const { deriveStore6OwnedTargets } = await import("./sync-store6-docs.mjs");
  const inventory = readFileSync(resolve(ROOT, "evidence/live-url-inventory.txt"), "utf8")
    .trim()
    .split(/\r?\n/)
    .filter(Boolean);
  const lock = JSON.parse(readFileSync(resolve(ROOT, "evidence/T4-store6-source-lock.json"), "utf8"));
  const ledger = JSON.parse(readFileSync(LEDGER_PATH, "utf8"));

  assert.deepEqual(
    ledger.owners["port-page:generate"].map((entry) => entry.path),
    derivePortPageOwnedTargets(inventory),
  );
  assert.deepEqual(
    ledger.owners["sync-store6-docs"].map((entry) => entry.path),
    deriveStore6OwnedTargets(lock),
  );
  assert.deepEqual(
    ledger.owners["port-page:acquire"].map((entry) => entry.path),
    ["evidence/T4-live-snapshot.json"],
  );

  const allTargets = Object.values(ledger.owners).flatMap((entries) => entries.map((entry) => entry.path));
  assert.equal(new Set(allTargets).size, allTargets.length);
  assert.equal(allTargets.includes("content/docs/store6/overview.mdx"), false);
  assert.equal(allTargets.includes("evidence/T4-store6-source-lock.json"), false);
  assert.equal(allTargets.includes("evidence/live-url-inventory.txt"), false);
  for (const entries of Object.values(ledger.owners)) {
    for (const entry of entries) {
      assert.match(entry.sha256, /^[a-f0-9]{64}$/);
      assert.equal(sha256(readFileSync(resolve(ROOT, entry.path))), entry.sha256, entry.path);
    }
  }
});

for (const implementation of [
  { exportName: "writeLiveOutputTransaction", module: "./port-page.mjs", owner: "port-page:generate" },
  { exportName: "writeStore6OutputTransaction", module: "./sync-store6-docs.mjs", owner: "sync-store6-docs" },
]) {
  test(`${implementation.owner} removes only matching stale files and updates its census`, async () => {
    const transaction = await loadTransaction(implementation);
    await withTemporaryRoot(async (root) => {
      const ledger = ledgerFor(implementation.owner, {
        "owned/keep.txt": "old keep",
        "owned/stale.txt": "old stale",
      });
      writeFixture(root, "owned/keep.txt", "old keep");
      writeFixture(root, "owned/stale.txt", "old stale");
      writeFixture(root, "owned/unrelated.txt", "sentinel");
      writeFixture(root, "evidence/ledger.json", `${JSON.stringify(ledger, null, 2)}\n`);

      await transaction(new Map([["owned/keep.txt", "new keep"]]), {
        ledgerRelativePath: "evidence/ledger.json",
        root,
      });

      assert.equal(readFixture(root, "owned/keep.txt"), "new keep");
      assert.equal(exists(root, "owned/stale.txt"), false);
      assert.equal(readFixture(root, "owned/unrelated.txt"), "sentinel");
      const updated = JSON.parse(readFixture(root, "evidence/ledger.json"));
      assert.deepEqual(updated.owners[implementation.owner], [
        { path: "owned/keep.txt", sha256: sha256("new keep") },
      ]);
    });
  });

  test(`${implementation.owner} preserves existing modes and defaults new generated files to 0644`, async () => {
    const transaction = await loadTransaction(implementation);
    await withTemporaryRoot(async (root) => {
      const ledger = ledgerFor(implementation.owner, {
        "owned/keep.txt": "old keep",
      });
      writeFixture(root, "owned/keep.txt", "old keep");
      writeFixture(root, "evidence/ledger.json", `${JSON.stringify(ledger, null, 2)}\n`);
      chmodSync(resolve(root, "owned/keep.txt"), 0o640);
      chmodSync(resolve(root, "evidence/ledger.json"), 0o660);

      await transaction(
        new Map([
          ["owned/keep.txt", "new keep"],
          ["owned/new.txt", "new file"],
        ]),
        { ledgerRelativePath: "evidence/ledger.json", root },
      );

      assert.equal(fileMode(root, "owned/keep.txt"), 0o640);
      assert.equal(fileMode(root, "owned/new.txt"), 0o644);
      assert.equal(fileMode(root, "evidence/ledger.json"), 0o660);
    });
  });

  test(`${implementation.owner} refuses to remove a stale file changed after its census`, async () => {
    const transaction = await loadTransaction(implementation);
    await withTemporaryRoot(async (root) => {
      const oldLedger = ledgerFor(implementation.owner, {
        "owned/keep.txt": "old keep",
        "owned/stale.txt": "old stale",
      });
      const oldLedgerText = `${JSON.stringify(oldLedger, null, 2)}\n`;
      writeFixture(root, "owned/keep.txt", "old keep");
      writeFixture(root, "owned/stale.txt", "user-modified stale");
      writeFixture(root, "owned/unrelated.txt", "sentinel");
      writeFixture(root, "evidence/ledger.json", oldLedgerText);
      const before = walk(root);

      await assert.rejects(
        transaction(new Map([["owned/keep.txt", "new keep"]]), {
          ledgerRelativePath: "evidence/ledger.json",
          root,
        }),
        /OWNED_STALE_MODIFIED/,
      );

      assert.equal(readFixture(root, "owned/keep.txt"), "old keep");
      assert.equal(readFixture(root, "owned/stale.txt"), "user-modified stale");
      assert.equal(readFixture(root, "owned/unrelated.txt"), "sentinel");
      assert.equal(readFixture(root, "evidence/ledger.json"), oldLedgerText);
      assert.deepEqual(walk(root), before);
    });
  });

  test(`${implementation.owner} refuses to overwrite a pre-existing unclaimed target`, async () => {
    const transaction = await loadTransaction(implementation);
    await withTemporaryRoot(async (root) => {
      const oldLedger = ledgerFor(implementation.owner, {
        "owned/keep.txt": "old keep",
      });
      const oldLedgerText = `${JSON.stringify(oldLedger, null, 2)}\n`;
      writeFixture(root, "owned/keep.txt", "old keep");
      writeFixture(root, "owned/unclaimed.txt", "unrelated content");
      writeFixture(root, "owned/unrelated.txt", "sentinel");
      writeFixture(root, "evidence/ledger.json", oldLedgerText);
      const before = walk(root);

      await assert.rejects(
        transaction(
          new Map([
            ["owned/keep.txt", "new keep"],
            ["owned/unclaimed.txt", "generated replacement"],
          ]),
          { ledgerRelativePath: "evidence/ledger.json", root },
        ),
        /OWNED_TARGET_UNCLAIMED/,
      );

      assert.equal(readFixture(root, "owned/keep.txt"), "old keep");
      assert.equal(readFixture(root, "owned/unclaimed.txt"), "unrelated content");
      assert.equal(readFixture(root, "owned/unrelated.txt"), "sentinel");
      assert.equal(readFixture(root, "evidence/ledger.json"), oldLedgerText);
      assert.deepEqual(walk(root), before);
    });
  });

  test(`${implementation.owner} rolls a stale removal back when ledger installation fails`, async () => {
    const transaction = await loadTransaction(implementation);
    await withTemporaryRoot(async (root) => {
      const oldLedger = ledgerFor(implementation.owner, {
        "owned/keep.txt": "old keep",
        "owned/stale.txt": "old stale",
      });
      const oldLedgerText = `${JSON.stringify(oldLedger, null, 2)}\n`;
      writeFixture(root, "owned/keep.txt", "old keep");
      writeFixture(root, "owned/stale.txt", "old stale");
      writeFixture(root, "owned/unrelated.txt", "sentinel");
      writeFixture(root, "evidence/ledger.json", oldLedgerText);
      chmodSync(resolve(root, "owned/keep.txt"), 0o640);
      chmodSync(resolve(root, "owned/stale.txt"), 0o604);
      chmodSync(resolve(root, "evidence/ledger.json"), 0o660);

      await assert.rejects(
        transaction(new Map([["owned/keep.txt", "new keep"]]), {
          ledgerRelativePath: "evidence/ledger.json",
          root,
          testHooks: {
            beforeLedgerInstall() {
              throw new Error("injected ledger failure");
            },
          },
        }),
        /injected ledger failure/,
      );

      assert.equal(readFixture(root, "owned/keep.txt"), "old keep");
      assert.equal(readFixture(root, "owned/stale.txt"), "old stale");
      assert.equal(readFixture(root, "owned/unrelated.txt"), "sentinel");
      assert.equal(readFixture(root, "evidence/ledger.json"), oldLedgerText);
      assert.equal(fileMode(root, "owned/keep.txt"), 0o640);
      assert.equal(fileMode(root, "owned/stale.txt"), 0o604);
      assert.equal(fileMode(root, "evidence/ledger.json"), 0o660);
      assert.deepEqual(findTransactionArtifacts(root), []);
    });
  });

  test(`${implementation.owner} keeps committed outputs when backup cleanup fails after one removal`, async () => {
    const transaction = await loadTransaction(implementation);
    await withTemporaryRoot(async (root) => {
      const oldLedger = ledgerFor(implementation.owner, {
        "owned/keep.txt": "old keep",
        "owned/stale.txt": "old stale",
      });
      writeFixture(root, "owned/keep.txt", "old keep");
      writeFixture(root, "owned/stale.txt", "old stale");
      writeFixture(root, "owned/unrelated.txt", "sentinel");
      writeFixture(root, "evidence/ledger.json", `${JSON.stringify(oldLedger, null, 2)}\n`);

      let cleanupError;
      await assert.rejects(
        transaction(new Map([["owned/keep.txt", "new keep"]]), {
          ledgerRelativePath: "evidence/ledger.json",
          root,
          testHooks: {
            afterLedgerInstall() {
              const transactionDirectory = walk(root).find((path) => /^\.t4-transaction-[^/]+$/.test(path));
              assert.ok(transactionDirectory, "transaction directory must exist before cleanup");
              rmSync(resolve(root, transactionDirectory, "backup-1"));
              mkdirSync(resolve(root, transactionDirectory, "backup-1"));
            },
          },
        }),
        (error) => {
          cleanupError = error;
          return true;
        },
      );

      assert.ok(cleanupError instanceof AggregateError);
      assert.match(cleanupError.message, /OWNED_OUTPUT_COMMITTED_CLEANUP_FAILED/);
      assert.match(cleanupError.message, /if that path still exists/);
      assert.equal(cleanupError.errors.some((error) => error?.code === "ENOENT"), false);
      assert.equal(readFixture(root, "owned/keep.txt"), "new keep");
      assert.equal(exists(root, "owned/stale.txt"), false);
      assert.equal(readFixture(root, "owned/unrelated.txt"), "sentinel");
      assert.deepEqual(
        JSON.parse(readFixture(root, "evidence/ledger.json")).owners[implementation.owner],
        [{ path: "owned/keep.txt", sha256: sha256("new keep") }],
      );
      const transactionArtifacts = findTransactionArtifacts(root);
      assert.equal(transactionArtifacts.length, 2);
      assert.equal(transactionArtifacts[1], `${transactionArtifacts[0]}/backup-1`);
    });
  });

  test(`${implementation.owner} keeps committed outputs when transaction-directory cleanup fails`, async () => {
    const transaction = await loadTransaction(implementation);
    await withTemporaryRoot(async (root) => {
      const oldLedger = ledgerFor(implementation.owner, {
        "owned/keep.txt": "old keep",
        "owned/stale.txt": "old stale",
      });
      writeFixture(root, "owned/keep.txt", "old keep");
      writeFixture(root, "owned/stale.txt", "old stale");
      writeFixture(root, "owned/unrelated.txt", "sentinel");
      writeFixture(root, "evidence/ledger.json", `${JSON.stringify(oldLedger, null, 2)}\n`);

      let transactionDirectory;
      let cleanupError;
      await assert.rejects(
        transaction(new Map([["owned/keep.txt", "new keep"]]), {
          ledgerRelativePath: "evidence/ledger.json",
          root,
          testHooks: {
            afterLedgerInstall() {
              transactionDirectory = walk(root).find((path) => /^\.t4-transaction-[^/]+$/.test(path));
              assert.ok(transactionDirectory, "transaction directory must exist before cleanup");
              writeFixture(root, `${transactionDirectory}/cleanup-blocker`, "block cleanup");
            },
          },
        }),
        (error) => {
          cleanupError = error;
          return true;
        },
      );

      assert.ok(cleanupError instanceof AggregateError);
      assert.match(cleanupError.message, /OWNED_OUTPUT_COMMITTED_CLEANUP_FAILED/);
      assert.match(cleanupError.message, /if that path still exists/);
      assert.equal(cleanupError.errors.some((error) => error?.code === "ENOENT"), false);
      assert.equal(readFixture(root, "owned/keep.txt"), "new keep");
      assert.equal(exists(root, "owned/stale.txt"), false);
      assert.equal(readFixture(root, "owned/unrelated.txt"), "sentinel");
      assert.deepEqual(
        JSON.parse(readFixture(root, "evidence/ledger.json")).owners[implementation.owner],
        [{ path: "owned/keep.txt", sha256: sha256("new keep") }],
      );
      assert.deepEqual(findTransactionArtifacts(root), [
        transactionDirectory,
        `${transactionDirectory}/cleanup-blocker`,
      ]);
    });
  });

  test(`${implementation.owner} rejects a symlinked parent before any mutation`, async () => {
    const transaction = await loadTransaction(implementation);
    await withTemporaryRoot(async (root) => {
      const outside = mkdtempSync(join(tmpdir(), "store-docs-outside-"));
      try {
        mkdirSync(resolve(root, "safe"), { recursive: true });
        symlinkSync(outside, resolve(root, "safe/escape"));
        writeFixture(
          root,
          "evidence/ledger.json",
          `${JSON.stringify(ledgerFor(implementation.owner, {}), null, 2)}\n`,
        );
        const before = walk(root);

        await assert.rejects(
          transaction(
            new Map([
              ["new/valid.txt", "valid"],
              ["safe/escape/payload.txt", "escaped"],
            ]),
            { ledgerRelativePath: "evidence/ledger.json", root },
          ),
          /OWNED_TARGET_SYMLINK/,
        );

        assert.deepEqual(walk(root), before);
        assert.deepEqual(readdirSync(outside), []);
      } finally {
        rmSync(outside, { force: true, recursive: true });
      }
    });
  });
}

async function loadTransaction({ exportName, module }) {
  const imported = await import(module);
  assert.equal(typeof imported[exportName], "function", `${module} must export ${exportName}`);
  return imported[exportName];
}

function ledgerFor(owner, targets) {
  return {
    owners: {
      [owner]: Object.entries(targets)
        .map(([path, content]) => ({ path, sha256: sha256(content) }))
        .sort((left, right) => left.path.localeCompare(right.path)),
    },
    schemaVersion: 1,
  };
}

function writeFixture(root, path, content) {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, content);
}

function readFixture(root, path) {
  return readFileSync(resolve(root, path), "utf8");
}

function fileMode(root, path) {
  return statSync(resolve(root, path)).mode & 0o777;
}

function exists(root, path) {
  try {
    lstatSync(resolve(root, path));
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

function findTransactionArtifacts(root) {
  return walk(root).filter((path) => path.includes(".t4-transaction-"));
}

function walk(root) {
  const result = [];
  function visit(path) {
    for (const entry of readdirSync(path, { withFileTypes: true })) {
      const absolute = resolve(path, entry.name);
      result.push(relative(root, absolute));
      if (entry.isDirectory() && !entry.isSymbolicLink()) visit(absolute);
    }
  }
  visit(root);
  return result.sort();
}

async function withTemporaryRoot(callback) {
  const root = mkdtempSync(join(tmpdir(), "store-docs-transaction-"));
  try {
    await callback(root);
  } finally {
    rmSync(root, { force: true, recursive: true });
  }
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}
