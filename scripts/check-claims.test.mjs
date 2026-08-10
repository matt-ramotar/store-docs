import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";

const REVISION = "a6a156e99db29cebf7da238263b007802bff2bfb";

test("claims can anchor whole files in Store6 and store-docs", async () => {
  const { checkClaims } = await import("./check-claims.mjs");

  await withFixture(async ({ root, sourceRoot }) => {
    writeFixture(sourceRoot, "src/Value.kt", "class Value\n");
    writeFixture(root, "lib/value.mjs", "export const value = true;\n");
    writeFixture(root, "content/docs/store6/concepts/value.mdx", "---\ntitle: Value\n---\n");
    const revision = commitStore6(sourceRoot);
    writeJson(root, "evidence/T4-store6-source-lock.json", lock([], revision));
    writeJson(root, "evidence/store6-claims.json", {
      schemaVersion: 1,
      revision,
      claims: [
        {
          id: "docs/store6/concepts/value/001",
          page: "/docs/store6/concepts/value",
          claim: "Value is available to both repositories.",
          verdict: "UNSAMPLED",
          anchors: [
            {
              repository: "store6",
              path: "src/Value.kt",
              sha256: sha256("class Value\n"),
              lines: { start: 1, end: 1 },
            },
            {
              repository: "store-docs",
              path: "lib/value.mjs",
              sha256: sha256("export const value = true;\n"),
            },
          ],
        },
      ],
    });

    assert.deepEqual(await checkClaims({ root, sourceRoot }), {
      anchorCount: 2,
      claimCount: 1,
      mutated: false,
      reconciledClaimCount: 0,
      revision,
    });
  });
});

test("claims and the source lock must name the same Store6 revision", async () => {
  const { checkClaims } = await import("./check-claims.mjs");

  await withFixture(async ({ root, sourceRoot }) => {
    writeJson(root, "evidence/T4-store6-source-lock.json", lock());
    writeJson(root, "evidence/store6-claims.json", {
      schemaVersion: 1,
      revision: "0".repeat(40),
      claims: [],
    });

    await assert.rejects(
      checkClaims({ root, sourceRoot }),
      /store6-claims\.json is pinned to a different Store6 revision than the source lock/,
    );
  });
});

test("changed and missing anchors report the page, id, claim, path, and reconciliation command", async () => {
  const { checkClaims } = await import("./check-claims.mjs");

  await withFixture(async ({ root, sourceRoot }) => {
    writeFixture(sourceRoot, "src/Changed.kt", "original\n");
    const revision = commitStore6(sourceRoot);
    writeFixture(sourceRoot, "src/Changed.kt", "changed\n");
    writeJson(root, "evidence/T4-store6-source-lock.json", lock([], revision));
    writeJson(root, "evidence/store6-claims.json", {
      schemaVersion: 1,
      revision,
      claims: [
        claim({
          anchor: {
            repository: "store6",
            path: "src/Changed.kt",
            sha256: sha256("original\n"),
          },
          id: "docs/store6/concepts/value/001",
          statement: "The value is original.",
        }),
        claim({
          anchor: {
            repository: "store-docs",
            path: "lib/missing.mjs",
            sha256: sha256("missing\n"),
          },
          id: "docs/store6/concepts/value/002",
          statement: "The site value exists.",
        }),
      ],
    });

    await assert.rejects(checkClaims({ root, sourceRoot }), (error) => {
      assert.match(
        error.message,
        new RegExp(
          `claim docs/store6/concepts/value/001 on /docs/store6/concepts/value anchors src/Changed\\.kt, which changed since ${revision}; re-verify the claim, then run check-claims\\.mjs --reconcile docs/store6/concepts/value/001`,
        ),
      );
      assert.match(error.message, /claim: The value is original\./);
      assert.match(
        error.message,
        new RegExp(
          "claim docs/store6/concepts/value/002 on /docs/store6/concepts/value anchors store-docs/lib/missing\\.mjs, whose whole-file hash no longer matches store6-claims\\.json; re-verify the claim, then run check-claims\\.mjs --reconcile docs/store6/concepts/value/002",
        ),
      );
      assert.match(error.message, /claim: The site value exists\./);
      return true;
    });
  });
});

test("claims reject private Store6 decision-record anchors", async () => {
  const { checkClaims } = await import("./check-claims.mjs");

  await withFixture(async ({ root, sourceRoot }) => {
    writeFixture(sourceRoot, "docs/v6/private.md", "private\n");
    writeJson(root, "evidence/T4-store6-source-lock.json", lock());
    writeJson(root, "evidence/store6-claims.json", {
      schemaVersion: 1,
      revision: REVISION,
      claims: [
        claim({
          anchor: {
            repository: "store6",
            path: "docs/v6/private.md",
            sha256: sha256("private\n"),
          },
          id: "docs/store6/concepts/value/001",
          statement: "The private record defines the value.",
        }),
      ],
    });

    await assert.rejects(
      checkClaims({ root, sourceRoot }),
      /claims may not anchor private decision records; anchor the code or a tracked doc/,
    );
  });
});

test("every hand-authored Store6 page has a claim while locked pages and overview are excluded", async () => {
  const { checkClaims } = await import("./check-claims.mjs");

  await withFixture(async ({ root, sourceRoot }) => {
    writeFixture(sourceRoot, ".fixture", "fixture\n");
    const revision = commitStore6(sourceRoot);
    writeFixture(root, "content/docs/store6/overview.mdx", "---\ntitle: Overview\n---\n");
    writeFixture(root, "content/docs/store6/locked.mdx", "---\ntitle: Locked\n---\n");
    writeFixture(root, "content/docs/store6/guides/empty.mdx", "---\ntitle: Empty\n---\n");
    writeJson(
      root,
      "evidence/T4-store6-source-lock.json",
      lock(
        [
          {
            path: "docs/store6/locked.md",
            sha256: "0".repeat(64),
            target: "content/docs/store6/locked.mdx",
          },
        ],
        revision,
      ),
    );
    writeJson(root, "evidence/store6-claims.json", {
      schemaVersion: 1,
      revision,
      claims: [],
    });

    await assert.rejects(
      checkClaims({ root, sourceRoot }),
      /hand-authored page \/docs\/store6\/guides\/empty has no entries in store6-claims\.json/,
    );
  });
});

test("reconciling one claim rewrites only that claim's whole-file hash", async () => {
  const { checkClaims } = await import("./check-claims.mjs");

  await withFixture(async ({ root, sourceRoot }) => {
    writeFixture(sourceRoot, "src/Selected.kt", "selected now\n");
    writeFixture(sourceRoot, "src/Unselected.kt", "unselected\n");
    const revision = commitStore6(sourceRoot);
    writeJson(root, "evidence/T4-store6-source-lock.json", lock([], revision));
    const ledger = {
      schemaVersion: 1,
      revision,
      claims: [
        claim({
          anchor: {
            repository: "store6",
            path: "src/Selected.kt",
            sha256: sha256("selected before\n"),
          },
          id: "docs/store6/concepts/value/001",
          statement: "The selected value is current.",
        }),
        claim({
          anchor: {
            repository: "store6",
            path: "src/Unselected.kt",
            sha256: sha256("unselected\n"),
          },
          id: "docs/store6/concepts/value/002",
          statement: "The unselected value is current.",
        }),
      ],
    };
    writeJson(root, "evidence/store6-claims.json", ledger);

    const result = await checkClaims({ reconcileId: "docs/store6/concepts/value/001", root, sourceRoot });
    const updated = readJson(root, "evidence/store6-claims.json");

    assert.equal(updated.claims[0].anchors[0].sha256, sha256("selected now\n"));
    assert.equal(updated.claims[1].anchors[0].sha256, ledger.claims[1].anchors[0].sha256);
    assert.deepEqual(result, {
      anchorCount: 2,
      claimCount: 2,
      mutated: true,
      reconciledClaimCount: 1,
      revision,
    });
  });
});

test("reconcile-all rewrites every claim's whole-file hashes", async () => {
  const { checkClaims } = await import("./check-claims.mjs");

  await withFixture(async ({ root, sourceRoot }) => {
    writeFixture(sourceRoot, "src/First.kt", "first now\n");
    writeFixture(root, "lib/second.mjs", "second now\n");
    const revision = commitStore6(sourceRoot);
    writeJson(root, "evidence/T4-store6-source-lock.json", lock([], revision));
    writeJson(root, "evidence/store6-claims.json", {
      schemaVersion: 1,
      revision,
      claims: [
        claim({
          anchor: {
            repository: "store6",
            path: "src/First.kt",
            sha256: sha256("first before\n"),
          },
          id: "docs/store6/concepts/value/001",
          statement: "The first value is current.",
        }),
        claim({
          anchor: {
            repository: "store-docs",
            path: "lib/second.mjs",
            sha256: sha256("second before\n"),
          },
          id: "docs/store6/concepts/value/002",
          statement: "The second value is current.",
        }),
      ],
    });

    const result = await checkClaims({ reconcileAll: true, root, sourceRoot });
    const updated = readJson(root, "evidence/store6-claims.json");

    assert.equal(updated.claims[0].anchors[0].sha256, sha256("first now\n"));
    assert.equal(updated.claims[1].anchors[0].sha256, sha256("second now\n"));
    assert.equal(result.reconciledClaimCount, 2);
  });
});

test("reconciling one claim persists its hash while reporting other claims that still need review", async () => {
  const { checkClaims } = await import("./check-claims.mjs");

  await withFixture(async ({ root, sourceRoot }) => {
    writeFixture(sourceRoot, "src/Selected.kt", "selected now\n");
    writeFixture(sourceRoot, "src/Pending.kt", "pending before\n");
    const revision = commitStore6(sourceRoot);
    writeFixture(sourceRoot, "src/Pending.kt", "pending now\n");
    writeJson(root, "evidence/T4-store6-source-lock.json", lock([], revision));
    const selectedBefore = sha256("selected before\n");
    const pendingBefore = sha256("pending before\n");
    writeJson(root, "evidence/store6-claims.json", {
      schemaVersion: 1,
      revision,
      claims: [
        claim({
          anchor: { repository: "store6", path: "src/Selected.kt", sha256: selectedBefore },
          id: "docs/store6/concepts/value/001",
          statement: "The selected value is current.",
        }),
        claim({
          anchor: { repository: "store6", path: "src/Pending.kt", sha256: pendingBefore },
          id: "docs/store6/concepts/value/002",
          statement: "The pending value is current.",
        }),
      ],
    });

    await assert.rejects(checkClaims({ reconcileId: "docs/store6/concepts/value/001", root, sourceRoot }), (error) => {
      assert.match(error.message, /store6-claims\.json was updated for 1 explicitly reconciled claim/);
      assert.match(error.message, /check-claims\.mjs --reconcile docs\/store6\/concepts\/value\/002/);
      return true;
    });
    const updated = readJson(root, "evidence/store6-claims.json");
    assert.equal(updated.claims[0].anchors[0].sha256, sha256("selected now\n"));
    assert.equal(updated.claims[1].anchors[0].sha256, pendingBefore);
  });
});

test("post-repin selective reconciliation persists one pinned hash and reports the other", async () => {
  const { checkClaims } = await import("./check-claims.mjs");

  await withFixture(async ({ root, sourceRoot }) => {
    writeFixture(sourceRoot, "src/Selected.kt", "selected now\n");
    writeFixture(sourceRoot, "src/Pending.kt", "pending now\n");
    const revision = commitStore6(sourceRoot);
    writeJson(root, "evidence/T4-store6-source-lock.json", lock([], revision));
    const selectedBefore = sha256("selected before\n");
    const pendingBefore = sha256("pending before\n");
    writeJson(root, "evidence/store6-claims.json", {
      schemaVersion: 1,
      revision,
      claims: [
        claim({
          anchor: { repository: "store6", path: "src/Selected.kt", sha256: selectedBefore },
          id: "docs/store6/concepts/value/001",
          statement: "The selected value is current.",
        }),
        claim({
          anchor: { repository: "store6", path: "src/Pending.kt", sha256: pendingBefore },
          id: "docs/store6/concepts/value/002",
          statement: "The pending value is current.",
        }),
      ],
    });

    await assert.rejects(checkClaims({ reconcileId: "docs/store6/concepts/value/001", root, sourceRoot }), (error) => {
      assert.match(error.message, /store6-claims\.json was updated for 1 explicitly reconciled claim/);
      assert.match(
        error.message,
        new RegExp(
          `claim docs/store6/concepts/value/002 on /docs/store6/concepts/value anchors src/Pending\\.kt, but store6-claims\\.json records ${pendingBefore} while pinned revision ${revision} hashes to ${sha256("pending now\n")}`,
        ),
      );
      assert.match(error.message, /check-claims\.mjs --reconcile docs\/store6\/concepts\/value\/002/);
      return true;
    });
    const updated = readJson(root, "evidence/store6-claims.json");
    assert.equal(updated.claims[0].anchors[0].sha256, sha256("selected now\n"));
    assert.equal(updated.claims[1].anchors[0].sha256, pendingBefore);
  });
});

test("reconciliation hashes the pinned Store6 object instead of dirty checkout bytes", async () => {
  const { checkClaims } = await import("./check-claims.mjs");

  await withFixture(async ({ root, sourceRoot }) => {
    writeFixture(sourceRoot, "src/Value.kt", "pinned\n");
    const revision = commitStore6(sourceRoot);
    writeFixture(sourceRoot, "src/Value.kt", "dirty\n");
    writeJson(root, "evidence/T4-store6-source-lock.json", lock([], revision));
    writeJson(root, "evidence/store6-claims.json", {
      schemaVersion: 1,
      revision,
      claims: [
        claim({
          anchor: { repository: "store6", path: "src/Value.kt", sha256: sha256("before\n") },
          id: "docs/store6/concepts/value/001",
          statement: "The pinned value is current.",
        }),
      ],
    });

    await assert.rejects(
      checkClaims({ reconcileId: "docs/store6/concepts/value/001", root, sourceRoot }),
      new RegExp(`which changed since ${revision}`),
    );
    const updated = readJson(root, "evidence/store6-claims.json");
    assert.equal(updated.claims[0].anchors[0].sha256, sha256("pinned\n"));
    assert.notEqual(updated.claims[0].anchors[0].sha256, sha256("dirty\n"));
  });
});

test("CLI parsing requires a source root and recognizes only explicit reconciliation modes", async () => {
  const { parseArguments } = await import("./check-claims.mjs");

  assert.deepEqual(parseArguments(["--source-root", "../Store6"]), {
    reconcileAll: false,
    reconcileId: undefined,
    sourceRoot: "../Store6",
  });
  assert.deepEqual(parseArguments(["--source-root", "../Store6", "--reconcile", "value/id"]), {
    reconcileAll: false,
    reconcileId: "value/id",
    sourceRoot: "../Store6",
  });
  assert.deepEqual(parseArguments(["--reconcile-all", "--source-root", "../Store6"]), {
    reconcileAll: true,
    reconcileId: undefined,
    sourceRoot: "../Store6",
  });
  assert.throws(
    () => parseArguments(["--source-root", "../Store6", "--reconcile", "value/id", "--reconcile-all"]),
    /--reconcile and --reconcile-all are mutually exclusive/,
  );
  assert.throws(
    () => parseArguments([]),
    /usage: check-claims\.mjs --source-root <checkout> \[--reconcile <id> \| --reconcile-all\]/,
  );
  assert.throws(() => parseArguments(["--source-root", "../Store6", "--check"]), /unknown argument: --check/);
});

test("an index.mdx hand-authored page is claimed by its directory route", async () => {
  const { checkClaims } = await import("./check-claims.mjs");

  await withFixture(async ({ root, sourceRoot }) => {
    writeFixture(sourceRoot, "src/Mutation.kt", "class Mutation\n");
    writeFixture(root, "content/docs/store6/mutations/index.mdx", "---\ntitle: Mutations\n---\n");
    const revision = commitStore6(sourceRoot);
    writeJson(root, "evidence/T4-store6-source-lock.json", lock([], revision));
    writeJson(root, "evidence/store6-claims.json", {
      schemaVersion: 1,
      revision,
      claims: [
        claim({
          anchor: {
            repository: "store6",
            path: "src/Mutation.kt",
            sha256: sha256("class Mutation\n"),
          },
          id: "docs/store6/mutations/001",
          page: "/docs/store6/mutations",
          statement: "The mutations entrypoint exists.",
        }),
      ],
    });

    await checkClaims({ root, sourceRoot });
  });
});

test("claim ids must be unique", async () => {
  const { checkClaims } = await import("./check-claims.mjs");

  await withFixture(async ({ root, sourceRoot }) => {
    writeFixture(sourceRoot, "src/Value.kt", "class Value\n");
    const anchor = { repository: "store6", path: "src/Value.kt", sha256: sha256("class Value\n") };
    writeJson(root, "evidence/T4-store6-source-lock.json", lock());
    writeJson(root, "evidence/store6-claims.json", {
      schemaVersion: 1,
      revision: REVISION,
      claims: [
        claim({ anchor, id: "docs/store6/concepts/value/001", statement: "The first value exists." }),
        claim({ anchor, id: "docs/store6/concepts/value/001", statement: "The second value exists." }),
      ],
    });

    await assert.rejects(
      checkClaims({ root, sourceRoot }),
      /duplicate claim id: docs\/store6\/concepts\/value\/001/,
    );
  });
});

test("every anchor names its repository explicitly", async () => {
  const { checkClaims } = await import("./check-claims.mjs");

  await withFixture(async ({ root, sourceRoot }) => {
    writeFixture(sourceRoot, "src/Value.kt", "class Value\n");
    writeJson(root, "evidence/T4-store6-source-lock.json", lock());
    writeJson(root, "evidence/store6-claims.json", {
      schemaVersion: 1,
      revision: REVISION,
      claims: [
        claim({
          anchor: {
            repository: "unspecified",
            path: "src/Value.kt",
            sha256: sha256("class Value\n"),
          },
          id: "docs/store6/concepts/value/001",
          statement: "The value exists.",
        }),
      ],
    });

    await assert.rejects(
      checkClaims({ root, sourceRoot }),
      /claim docs\/store6\/concepts\/value\/001 has unsupported anchor repository: unspecified/,
    );
  });
});

test("claims without anchors are rejected instead of being silently skipped", async () => {
  const { checkClaims } = await import("./check-claims.mjs");

  await withFixture(async ({ root, sourceRoot }) => {
    writeJson(root, "evidence/T4-store6-source-lock.json", lock());
    writeJson(root, "evidence/store6-claims.json", {
      schemaVersion: 1,
      revision: REVISION,
      claims: [
        {
          id: "docs/store6/concepts/value/001",
          page: "/docs/store6/concepts/value",
          claim: "The value exists.",
          verdict: "UNSAMPLED",
          anchors: [],
        },
      ],
    });

    await assert.rejects(
      checkClaims({ root, sourceRoot }),
      /claim docs\/store6\/concepts\/value\/001 must have at least one anchor/,
    );
  });
});

test("anchor paths must be normalized POSIX-relative paths", async () => {
  const { checkClaims } = await import("./check-claims.mjs");
  const cases = ["../outside.kt", "/absolute.kt", "src\\Value.kt", "src/Value\0.kt"];

  for (const path of cases) {
    await withFixture(async ({ root, sourceRoot }) => {
      writeJson(root, "evidence/T4-store6-source-lock.json", lock());
      writeJson(root, "evidence/store6-claims.json", {
        schemaVersion: 1,
        revision: REVISION,
        claims: [
          claim({
            anchor: { repository: "store6", path, sha256: "0".repeat(64) },
            id: "docs/store6/concepts/value/001",
            statement: "The value exists.",
          }),
        ],
      });

      await assert.rejects(
        checkClaims({ root, sourceRoot }),
        /evidence\/store6-claims\.json \$\.claims\[0\]\.anchors\[0\]\.path:/,
      );
    });
  }
});

test("the private-record guard applies after path normalization", async () => {
  const { checkClaims } = await import("./check-claims.mjs");

  await withFixture(async ({ root, sourceRoot }) => {
    writeJson(root, "evidence/T4-store6-source-lock.json", lock());
    writeJson(root, "evidence/store6-claims.json", {
      schemaVersion: 1,
      revision: REVISION,
      claims: [
        claim({
          anchor: { repository: "store6", path: "./docs/v6/private.md", sha256: "0".repeat(64) },
          id: "docs/store6/concepts/value/001",
          statement: "The private value exists.",
        }),
      ],
    });

    await assert.rejects(
      checkClaims({ root, sourceRoot }),
      /evidence\/store6-claims\.json \$\.claims\[0\]\.anchors\[0\]\.path: claims may not anchor private decision records; anchor the code or a tracked doc/,
    );
  });
});

test("working-tree anchors may not escape their repository through a symlink", async () => {
  const { checkClaims } = await import("./check-claims.mjs");

  await withFixture(async ({ root, sourceRoot }) => {
    writeFixture(sourceRoot, "src/Value.kt", "pinned\n");
    const revision = commitStore6(sourceRoot);
    rmSync(resolve(sourceRoot, "src/Value.kt"));
    writeFixture(root, "outside.kt", "pinned\n");
    symlinkSync(resolve(root, "outside.kt"), resolve(sourceRoot, "src/Value.kt"));
    writeJson(root, "evidence/T4-store6-source-lock.json", lock([], revision));
    writeJson(root, "evidence/store6-claims.json", {
      schemaVersion: 1,
      revision,
      claims: [
        claim({
          anchor: { repository: "store6", path: "src/Value.kt", sha256: sha256("pinned\n") },
          id: "docs/store6/concepts/value/001",
          statement: "The pinned value exists.",
        }),
      ],
    });

    await assert.rejects(
      checkClaims({ root, sourceRoot }),
      /evidence\/store6-claims\.json \$\.claims\[0\]\.anchors\[0\]\.path resolves outside the store6 root through a symlink/,
    );
  });
});

test("Store6 anchors reject committed symlinks even when they stay inside the checkout", async () => {
  const { checkClaims } = await import("./check-claims.mjs");

  await withFixture(async ({ root, sourceRoot }) => {
    writeFixture(sourceRoot, "src/Target.kt", "pinned\n");
    symlinkSync("Target.kt", resolve(sourceRoot, "src/Value.kt"));
    const revision = commitStore6(sourceRoot);
    writeJson(root, "evidence/T4-store6-source-lock.json", lock([], revision));
    writeJson(root, "evidence/store6-claims.json", {
      schemaVersion: 1,
      revision,
      claims: [
        claim({
          anchor: { repository: "store6", path: "src/Value.kt", sha256: sha256("Target.kt") },
          id: "docs/store6/concepts/value/001",
          statement: "The pinned value exists.",
        }),
      ],
    });
    const claimsPath = resolve(root, "evidence/store6-claims.json");
    const before = readFileSync(claimsPath, "utf8");

    await assert.rejects(
      checkClaims({ reconcileId: "docs/store6/concepts/value/001", root, sourceRoot }),
      new RegExp(
        `evidence/store6-claims\\.json \\$\\.claims\\[0\\]\\.anchors\\[0\\]\\.path: claim docs/store6/concepts/value/001 on /docs/store6/concepts/value anchors committed Store6 symlink src/Value\\.kt at pinned revision ${revision}; anchor the regular file containing the evidence instead`,
      ),
    );
    assert.equal(readFileSync(claimsPath, "utf8"), before);
  });
});

test("claims schema errors identify the evidence file and JSON path", async () => {
  const { checkClaims } = await import("./check-claims.mjs");
  const valid = {
    schemaVersion: 1,
    revision: REVISION,
    claims: [
      claim({
        anchor: { repository: "store-docs", path: "lib/value.mjs", sha256: "0".repeat(64) },
        id: "docs/store6/concepts/value/001",
        statement: "The value exists.",
      }),
    ],
  };
  const cases = [
    { mutate: (value) => (value.schemaVersion = 2), path: "\\$\\.schemaVersion" },
    { mutate: (value) => (value.revision = "A".repeat(40)), path: "\\$\\.revision" },
    { mutate: (value) => (value.claims = {}), path: "\\$\\.claims" },
    { mutate: (value) => (value.claims[0].id = "value/id"), path: "\\$\\.claims\\[0\\]\\.id" },
    { mutate: (value) => (value.claims[0].page = "docs/store6/value"), path: "\\$\\.claims\\[0\\]\\.page" },
    { mutate: (value) => (value.claims[0].claim = ""), path: "\\$\\.claims\\[0\\]\\.claim" },
    { mutate: (value) => (value.claims[0].verdict = "UNKNOWN"), path: "\\$\\.claims\\[0\\]\\.verdict" },
    { mutate: (value) => (value.claims[0].anchors = []), path: "\\$\\.claims\\[0\\]\\.anchors" },
    {
      mutate: (value) => (value.claims[0].anchors[0].sha256 = "A".repeat(64)),
      path: "\\$\\.claims\\[0\\]\\.anchors\\[0\\]\\.sha256",
    },
    {
      mutate: (value) => (value.claims[0].anchors[0].lines = { start: 3, end: 2 }),
      path: "\\$\\.claims\\[0\\]\\.anchors\\[0\\]\\.lines",
    },
  ];

  for (const { mutate, path } of cases) {
    await withFixture(async ({ root, sourceRoot }) => {
      const value = structuredClone(valid);
      mutate(value);
      writeJson(root, "evidence/T4-store6-source-lock.json", lock());
      writeJson(root, "evidence/store6-claims.json", value);
      await assert.rejects(
        checkClaims({ root, sourceRoot }),
        new RegExp(`evidence/store6-claims\\.json ${path}:`),
      );
    });
  }
});

test("source-lock schema errors identify the evidence file and JSON path", async () => {
  const { checkClaims } = await import("./check-claims.mjs");
  const source = {
    path: "docs/store6/locked.md",
    sha256: "0".repeat(64),
    target: "content/docs/store6/locked.mdx",
  };
  const valid = { schemaVersion: 1, revision: REVISION, sources: [source] };
  const cases = [
    { mutate: (value) => (value.schemaVersion = 2), path: "\\$\\.schemaVersion" },
    { mutate: (value) => (value.revision = "short"), path: "\\$\\.revision" },
    { mutate: (value) => (value.sources = {}), path: "\\$\\.sources" },
    { mutate: (value) => (value.sources[0].path = "../locked.md"), path: "\\$\\.sources\\[0\\]\\.path" },
    {
      mutate: (value) => (value.sources[0].sha256 = "0".repeat(63)),
      path: "\\$\\.sources\\[0\\]\\.sha256",
    },
    {
      mutate: (value) => (value.sources[0].target = "content/docs/store5/locked.mdx"),
      path: "\\$\\.sources\\[0\\]\\.target",
    },
  ];

  for (const { mutate, path } of cases) {
    await withFixture(async ({ root, sourceRoot }) => {
      const value = structuredClone(valid);
      mutate(value);
      writeJson(root, "evidence/T4-store6-source-lock.json", value);
      writeJson(root, "evidence/store6-claims.json", { schemaVersion: 1, revision: REVISION, claims: [] });
      await assert.rejects(
        checkClaims({ root, sourceRoot }),
        new RegExp(`evidence/T4-store6-source-lock\\.json ${path}:`),
      );
    });
  }
});

test("source-root Git preflight preserves operational stderr", async () => {
  const { checkClaims } = await import("./check-claims.mjs");

  await withFixture(async ({ root, sourceRoot }) => {
    writeJson(root, "evidence/T4-store6-source-lock.json", lock());
    writeJson(root, "evidence/store6-claims.json", { schemaVersion: 1, revision: REVISION, claims: [] });

    await assert.rejects(checkClaims({ root, sourceRoot }), (error) => {
      assert.match(error.message, /Store6 source root Git preflight failed/);
      assert.match(error.message, /git stderr: fatal:/);
      return true;
    });
  });
});

test("source-root Git preflight requires the pinned commit object", async () => {
  const { checkClaims } = await import("./check-claims.mjs");

  await withFixture(async ({ root, sourceRoot }) => {
    writeFixture(sourceRoot, ".fixture", "fixture\n");
    commitStore6(sourceRoot);
    const missingRevision = "0".repeat(40);
    writeJson(root, "evidence/T4-store6-source-lock.json", lock([], missingRevision));
    writeJson(root, "evidence/store6-claims.json", {
      schemaVersion: 1,
      revision: missingRevision,
      claims: [],
    });

    await assert.rejects(checkClaims({ root, sourceRoot }), (error) => {
      assert.match(error.message, new RegExp(`Git preflight failed for pinned revision ${missingRevision}`));
      assert.match(error.message, /git stderr:/);
      return true;
    });
  });
});

test("a missing pinned Store6 blob is distinct from working-tree drift", async () => {
  const { checkClaims } = await import("./check-claims.mjs");

  await withFixture(async ({ root, sourceRoot }) => {
    writeFixture(sourceRoot, ".fixture", "fixture\n");
    const revision = commitStore6(sourceRoot);
    writeJson(root, "evidence/T4-store6-source-lock.json", lock([], revision));
    writeJson(root, "evidence/store6-claims.json", {
      schemaVersion: 1,
      revision,
      claims: [
        claim({
          anchor: { repository: "store6", path: "src/Missing.kt", sha256: "0".repeat(64) },
          id: "docs/store6/concepts/value/001",
          statement: "The missing value exists.",
        }),
      ],
    });

    await assert.rejects(
      checkClaims({ root, sourceRoot }),
      new RegExp(`src/Missing\\.kt is missing from pinned revision ${revision}`),
    );
  });
});

test("reconciliation does not persist when the Class H census fails", async () => {
  const { checkClaims } = await import("./check-claims.mjs");

  await withFixture(async ({ root, sourceRoot }) => {
    writeFixture(sourceRoot, ".fixture", "fixture\n");
    const revision = commitStore6(sourceRoot);
    writeFixture(root, "lib/value.mjs", "now\n");
    writeFixture(root, "content/docs/store6/unclaimed.mdx", "---\ntitle: Unclaimed\n---\n");
    writeJson(root, "evidence/T4-store6-source-lock.json", lock([], revision));
    writeJson(root, "evidence/store6-claims.json", {
      schemaVersion: 1,
      revision,
      claims: [
        claim({
          anchor: { repository: "store-docs", path: "lib/value.mjs", sha256: sha256("before\n") },
          id: "docs/store6/concepts/value/001",
          statement: "The value exists.",
        }),
      ],
    });
    const claimsPath = resolve(root, "evidence/store6-claims.json");
    const before = readFileSync(claimsPath, "utf8");

    await assert.rejects(
      checkClaims({ reconcileId: "docs/store6/concepts/value/001", root, sourceRoot }),
      /hand-authored page \/docs\/store6\/unclaimed has no entries/,
    );
    assert.equal(readFileSync(claimsPath, "utf8"), before);
  });
});

test("reconciliation does not persist when Git preflight fails", async () => {
  const { checkClaims } = await import("./check-claims.mjs");

  await withFixture(async ({ root, sourceRoot }) => {
    writeFixture(root, "lib/value.mjs", "now\n");
    writeJson(root, "evidence/T4-store6-source-lock.json", lock());
    writeJson(root, "evidence/store6-claims.json", {
      schemaVersion: 1,
      revision: REVISION,
      claims: [
        claim({
          anchor: { repository: "store-docs", path: "lib/value.mjs", sha256: sha256("before\n") },
          id: "docs/store6/concepts/value/001",
          statement: "The value exists.",
        }),
      ],
    });
    const claimsPath = resolve(root, "evidence/store6-claims.json");
    const before = readFileSync(claimsPath, "utf8");

    await assert.rejects(
      checkClaims({ reconcileId: "docs/store6/concepts/value/001", root, sourceRoot }),
      /Store6 source root Git preflight failed/,
    );
    assert.equal(readFileSync(claimsPath, "utf8"), before);
  });
});

test("reconciliation does not persist a structurally invalid ledger", async () => {
  const { checkClaims } = await import("./check-claims.mjs");

  await withFixture(async ({ root, sourceRoot }) => {
    writeFixture(root, "lib/value.mjs", "now\n");
    writeJson(root, "evidence/T4-store6-source-lock.json", lock());
    writeJson(root, "evidence/store6-claims.json", {
      schemaVersion: 1,
      revision: REVISION,
      claims: [
        claim({
          anchor: { repository: "store-docs", path: "lib/value.mjs", sha256: sha256("before\n") },
          id: "docs/store6/concepts/value/001",
          statement: "The value exists.",
          verdict: "UNKNOWN",
        }),
      ],
    });
    const claimsPath = resolve(root, "evidence/store6-claims.json");
    const before = readFileSync(claimsPath, "utf8");

    await assert.rejects(
      checkClaims({ reconcileId: "docs/store6/concepts/value/001", root, sourceRoot }),
      /evidence\/store6-claims\.json \$\.claims\[0\]\.verdict:/,
    );
    assert.equal(readFileSync(claimsPath, "utf8"), before);
  });
});

test("an idempotent reconcile preserves canonical ledger bytes", async () => {
  const { checkClaims } = await import("./check-claims.mjs");

  await withFixture(async ({ root, sourceRoot }) => {
    writeFixture(sourceRoot, "src/Value.kt", "pinned\n");
    const revision = commitStore6(sourceRoot);
    writeJson(root, "evidence/T4-store6-source-lock.json", lock([], revision));
    writeJson(root, "evidence/store6-claims.json", {
      schemaVersion: 1,
      revision,
      claims: [
        claim({
          anchor: { repository: "store6", path: "src/Value.kt", sha256: sha256("pinned\n") },
          id: "docs/store6/concepts/value/001",
          statement: "The pinned value exists.",
        }),
      ],
    });
    const claimsPath = resolve(root, "evidence/store6-claims.json");
    const before = readFileSync(claimsPath, "utf8");

    const result = await checkClaims({ reconcileId: "docs/store6/concepts/value/001", root, sourceRoot });

    assert.equal(result.mutated, false);
    assert.equal(readFileSync(claimsPath, "utf8"), before);
  });
});

function lock(sources = [], revision = REVISION) {
  return { schemaVersion: 1, revision, sources };
}

function claim({ anchor, id, statement, page = "/docs/store6/concepts/value", verdict = "UNSAMPLED" }) {
  return { id, page, claim: statement, verdict, anchors: [anchor] };
}

function writeFixture(root, path, content) {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, content);
}

function writeJson(root, path, value) {
  writeFixture(root, path, `${JSON.stringify(value, null, 2)}\n`);
}

function readJson(root, path) {
  return JSON.parse(readFileSync(resolve(root, path), "utf8"));
}

function commitStore6(sourceRoot) {
  execFileSync("git", ["init", "-q"], { cwd: sourceRoot });
  execFileSync("git", ["add", "."], { cwd: sourceRoot });
  execFileSync(
    "git",
    ["-c", "user.name=Claims Test", "-c", "user.email=claims@example.test", "commit", "-qm", "fixture"],
    { cwd: sourceRoot },
  );
  return execFileSync("git", ["rev-parse", "HEAD"], { cwd: sourceRoot, encoding: "utf8" }).trim();
}

async function withFixture(callback) {
  const fixtureRoot = mkdtempSync(join(tmpdir(), "store-docs-claims-"));
  const root = resolve(fixtureRoot, "store-docs");
  const sourceRoot = resolve(fixtureRoot, "Store6");
  mkdirSync(root, { recursive: true });
  mkdirSync(sourceRoot, { recursive: true });
  try {
    await callback({ root, sourceRoot });
  } finally {
    rmSync(fixtureRoot, { force: true, recursive: true });
  }
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}
