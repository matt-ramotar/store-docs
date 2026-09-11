import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";

const REVISION = "a6a156e99db29cebf7da238263b007802bff2bfb";

test("dedents a named source region and checks every declared hand-authored page", async () => {
  const { checkSnippets } = await import("./check-snippets.mjs");

  await withFixture(async ({ root, sourceRoot }) => {
    writeFixture(
      sourceRoot,
      "samples/Quickstart.kt",
      [
        "fun main() {",
        "    // docs:snippet:quickstart",
        "    val store = store<String, Value> {",
        "        fetcher { key -> load(key) }",
        "    }",
        "    // docs:snippet:end",
        "}",
        "",
      ].join("\n"),
    );
    writePage(
      root,
      "/docs/store6/guides/first",
      [
        "{/* snippet: quickstart */}",
        "```kotlin",
        "val store = store<String, Value> {",
        "    fetcher { key -> load(key) }",
        "}",
        "```",
      ].join("\n"),
    );
    writePage(
      root,
      "/docs/store6/guides/second",
      [
        "{/* snippet: quickstart */}",
        "```kotlin title=\"Quickstart\"",
        "val store = store<String, Value> {",
        "    fetcher { key -> load(key) }",
        "}",
        "```",
      ].join("\n"),
    );
    writeManifest(root, [
      {
        name: "quickstart",
        path: "samples/Quickstart.kt",
        pages: ["/docs/store6/guides/first", "/docs/store6/guides/second"],
      },
    ]);

    assert.deepEqual(await checkSnippets({ revision: REVISION, root, sourceRoot }), {
      pageReferenceCount: 2,
      revision: REVISION,
      snippetCount: 1,
    });
  });
});

test("maps an index.mdx hand-authored page to its directory route", async () => {
  const { checkSnippets } = await import("./check-snippets.mjs");

  await withFixture(async ({ root, sourceRoot }) => {
    writeFixture(
      sourceRoot,
      "samples/Mutations.kt",
      "// docs:snippet:mutations\nval mutations = true\n// docs:snippet:end\n",
    );
    writeFixture(
      root,
      "content/docs/store6/mutations/index.mdx",
      "---\ntitle: Mutations\n---\n\n{/* snippet: mutations */}\n```kotlin\nval mutations = true\n```\n",
    );
    writeManifest(root, [
      {
        name: "mutations",
        path: "samples/Mutations.kt",
        pages: ["/docs/store6/mutations"],
      },
    ]);

    assert.deepEqual(await checkSnippets({ revision: REVISION, root, sourceRoot }), {
      pageReferenceCount: 1,
      revision: REVISION,
      snippetCount: 1,
    });
  });
});

test("a changed fence reports the exact contract failure and a useful diff", async () => {
  const { checkSnippets } = await import("./check-snippets.mjs");

  await withFixture(async ({ root, sourceRoot }) => {
    writeFixture(
      sourceRoot,
      "samples/Quickstart.kt",
      "// docs:snippet:quickstart\nval answer = 42\n// docs:snippet:end\n",
    );
    writePage(
      root,
      "/docs/store6/guides/quickstart",
      "{/* snippet: quickstart */}\n```kotlin\nval answer = 41\n```\n",
    );
    writeManifest(root, [
      {
        name: "quickstart",
        path: "samples/Quickstart.kt",
        pages: ["/docs/store6/guides/quickstart"],
      },
    ]);

    await assert.rejects(checkSnippets({ revision: REVISION, root, sourceRoot }), (error) => {
      assert.match(
        error.message,
        new RegExp(
          `^snippet quickstart on /docs/store6/guides/quickstart differs from samples/Quickstart\\.kt at ${REVISION}`,
        ),
      );
      assert.match(error.message, /--- samples\/Quickstart\.kt:quickstart/);
      assert.match(error.message, /\+\+\+ content\/docs\/store6\/guides\/quickstart\.mdx/);
      assert.match(error.message, /-val answer = 42/);
      assert.match(error.message, /\+val answer = 41/);
      return true;
    });
  });
});

test("rejects duplicate manifest names, page routes, source regions, and page markers", async (t) => {
  const { checkSnippets } = await import("./check-snippets.mjs");

  await t.test("manifest names", async () => {
    await withFixture(async ({ root, sourceRoot }) => {
      writeManifest(root, [entry(), entry({ path: "samples/Other.kt" })]);
      await assert.rejects(
        checkSnippets({ revision: REVISION, root, sourceRoot }),
        /duplicate snippet name: sample/,
      );
    });
  });

  await t.test("page routes", async () => {
    await withFixture(async ({ root, sourceRoot }) => {
      writeManifest(root, [entry({ pages: [sampleRoute(), sampleRoute()] })]);
      await assert.rejects(
        checkSnippets({ revision: REVISION, root, sourceRoot }),
        /snippet sample has duplicate page: \/docs\/store6\/guides\/sample/,
      );
    });
  });

  await t.test("source regions", async () => {
    await withFixture(async ({ root, sourceRoot }) => {
      writeFixture(
        sourceRoot,
        "samples/Sample.kt",
        [
          "// docs:snippet:sample",
          "val first = true",
          "// docs:snippet:end",
          "// docs:snippet:sample",
          "val second = true",
          "// docs:snippet:end",
          "",
        ].join("\n"),
      );
      writePage(root, sampleRoute(), "{/* snippet: sample */}\n```kotlin\nval first = true\n```\n");
      writeManifest(root, [entry()]);
      await assert.rejects(
        checkSnippets({ revision: REVISION, root, sourceRoot }),
        /duplicate source region sample in samples\/Sample\.kt/,
      );
    });
  });

  await t.test("page markers", async () => {
    await withFixture(async ({ root, sourceRoot }) => {
      writeFixture(
        sourceRoot,
        "samples/Sample.kt",
        "// docs:snippet:sample\nval answer = 42\n// docs:snippet:end\n",
      );
      writePage(
        root,
        sampleRoute(),
        [
          "{/* snippet: sample */}",
          "```kotlin",
          "val answer = 42",
          "```",
          "{/* snippet: sample */}",
          "```kotlin",
          "val answer = 42",
          "```",
        ].join("\n"),
      );
      writeManifest(root, [entry()]);
      await assert.rejects(
        checkSnippets({ revision: REVISION, root, sourceRoot }),
        /duplicate snippet marker sample on \/docs\/store6\/guides\/sample/,
      );
    });
  });
});

test("rejects missing and unterminated source regions", async (t) => {
  const { checkSnippets } = await import("./check-snippets.mjs");

  await t.test("missing", async () => {
    await withFixture(async ({ root, sourceRoot }) => {
      writeFixture(sourceRoot, "samples/Sample.kt", "val answer = 42\n");
      writePage(root, sampleRoute(), "{/* snippet: sample */}\n```kotlin\nval answer = 42\n```\n");
      writeManifest(root, [entry()]);
      await assert.rejects(
        checkSnippets({ revision: REVISION, root, sourceRoot }),
        /snippet sample is missing from samples\/Sample\.kt/,
      );
    });
  });

  await t.test("unterminated", async () => {
    await withFixture(async ({ root, sourceRoot }) => {
      writeFixture(sourceRoot, "samples/Sample.kt", "// docs:snippet:sample\nval answer = 42\n");
      writePage(root, sampleRoute(), "{/* snippet: sample */}\n```kotlin\nval answer = 42\n```\n");
      writeManifest(root, [entry()]);
      await assert.rejects(
        checkSnippets({ revision: REVISION, root, sourceRoot }),
        /unterminated source region sample in samples\/Sample\.kt/,
      );
    });
  });
});

test("rejects missing pages, markers, Kotlin fences, and closing fences", async (t) => {
  const { checkSnippets } = await import("./check-snippets.mjs");

  const cases = [
    {
      name: "page",
      page: undefined,
      expected: /snippet sample page is missing: \/docs\/store6\/guides\/sample/,
    },
    {
      name: "marker",
      page: "No snippet here.\n",
      expected: /snippet sample marker is missing on \/docs\/store6\/guides\/sample/,
    },
    {
      name: "Kotlin fence",
      page: "{/* snippet: sample */}\n\n```kotlin\nval answer = 42\n```\n",
      expected: /snippet sample marker on \/docs\/store6\/guides\/sample must be immediately above a Kotlin fence/,
    },
    {
      name: "closing fence",
      page: "{/* snippet: sample */}\n```kotlin\nval answer = 42\n",
      expected: /snippet sample Kotlin fence on \/docs\/store6\/guides\/sample is unterminated/,
    },
  ];

  for (const fixture of cases) {
    await t.test(fixture.name, async () => {
      await withFixture(async ({ root, sourceRoot }) => {
        writeFixture(
          sourceRoot,
          "samples/Sample.kt",
          "// docs:snippet:sample\nval answer = 42\n// docs:snippet:end\n",
        );
        if (fixture.page !== undefined) writePage(root, sampleRoute(), fixture.page);
        writeManifest(root, [entry()]);
        await assert.rejects(checkSnippets({ revision: REVISION, root, sourceRoot }), fixture.expected);
      });
    });
  }
});

test("rejects unsafe source paths and page routes", async (t) => {
  const { checkSnippets } = await import("./check-snippets.mjs");

  for (const fixture of [
    { name: "parent source path", value: entry({ path: "../outside.kt" }) },
    { name: "absolute source path", value: entry({ path: "/outside.kt" }) },
    { name: "backslash source path", value: entry({ path: "samples\\Sample.kt" }) },
    { name: "parent page route", value: entry({ pages: ["/docs/store6/../private"] }) },
    { name: "outside page route", value: entry({ pages: ["/docs/store5/sample"] }) },
  ]) {
    await t.test(fixture.name, async () => {
      await withFixture(async ({ root, sourceRoot }) => {
        writeManifest(root, [fixture.value]);
        await assert.rejects(
          checkSnippets({ revision: REVISION, root, sourceRoot }),
          /snippet sample has unsafe (?:source path|page route):/,
        );
      });
    });
  }
});

test("rejects a source path whose symlink escapes the checkout", async () => {
  const { checkSnippets } = await import("./check-snippets.mjs");

  await withFixture(async ({ root, sourceRoot }) => {
    writeFixture(
      sourceRoot,
      "../outside.kt",
      "// docs:snippet:sample\nval answer = 42\n// docs:snippet:end\n",
    );
    mkdirSync(resolve(sourceRoot, "samples"), { recursive: true });
    symlinkSync("../../outside.kt", resolve(sourceRoot, "samples/Sample.kt"));
    writePage(root, sampleRoute(), "{/* snippet: sample */}\n```kotlin\nval answer = 42\n```\n");
    writeManifest(root, [entry()]);

    await assert.rejects(
      checkSnippets({ revision: REVISION, root, sourceRoot }),
      /snippet sample has unsafe source path: samples\/Sample\.kt/,
    );
  });
});

test("rejects undeclared Class H markers and manifest entries for sync-owned pages", async (t) => {
  const { checkSnippets } = await import("./check-snippets.mjs");

  await t.test("undeclared marker", async () => {
    await withFixture(async ({ root, sourceRoot }) => {
      writePage(root, sampleRoute(), "{/* snippet: undeclared */}\n```kotlin\nval answer = 42\n```\n");
      writeManifest(root, []);
      await assert.rejects(
        checkSnippets({ revision: REVISION, root, sourceRoot }),
        /snippet undeclared on \/docs\/store6\/guides\/sample has no entry in store6-snippets\.json/,
      );
    });
  });

  await t.test("sync-owned page", async () => {
    await withFixture(async ({ root, sourceRoot }) => {
      writeFixture(
        sourceRoot,
        "samples/Sample.kt",
        "// docs:snippet:sample\nval answer = 42\n// docs:snippet:end\n",
      );
      writePage(root, sampleRoute(), "{/* snippet: sample */}\n```kotlin\nval answer = 42\n```\n");
      writeLock(root, [{ path: "README.md", target: "content/docs/store6/guides/sample.mdx" }]);
      writeManifest(root, [entry()]);
      await assert.rejects(
        checkSnippets({ revision: REVISION, root, sourceRoot }),
        /snippet sample page \/docs\/store6\/guides\/sample is sync-owned and must not be listed/,
      );
    });
  });
});

test("CLI parsing requires exactly one source root", async () => {
  const { parseArguments } = await import("./check-snippets.mjs");

  assert.deepEqual(parseArguments(["--source-root", "../Store6"]), { sourceRoot: "../Store6" });
  assert.throws(
    () => parseArguments([]),
    /usage: check-snippets\.mjs --source-root <checkout>/,
  );
  assert.throws(
    () => parseArguments(["--source-root", "../Store6", "--source-root", "../Other"]),
    /--source-root may be specified only once/,
  );
  assert.throws(
    () => parseArguments(["--source-root", "../Store6", "--check"]),
    /unknown argument: --check/,
  );
});

test("pinned snippets read an immutable file absent from the checked-out revision", async () => {
  const { checkSnippets } = await import("./check-snippets.mjs");
  await withFixture(async ({ root, sourceRoot }) => {
    const oldRevision = initializeGit(sourceRoot);
    writeFixture(sourceRoot, "samples/Sample.kt", sourceRegion("sample", "val answer = 42"));
    const pinnedRevision = commitFixture(sourceRoot);
    git(sourceRoot, "checkout", "--detach", oldRevision);
    writePage(root, sampleRoute(), pageRegion("sample", "val answer = 42"));
    writeManifest(root, [entry({ revision: pinnedRevision })]);

    const result = await checkSnippets({ root, sourceRoot });
    assert.equal(result.snippetCount, 1);
    assert.equal(result.revision, oldRevision);
    assert.deepEqual(result.additionalRevisions, [pinnedRevision]);
  });
});

test("pinned snippet mismatch uses the pinned blob and identifies its revision", async () => {
  const { checkSnippets } = await import("./check-snippets.mjs");
  await withFixture(async ({ root, sourceRoot }) => {
    initializeGit(sourceRoot);
    writeFixture(sourceRoot, "samples/Sample.kt", sourceRegion("sample", "val answer = 41"));
    const pinnedRevision = commitFixture(sourceRoot);
    writeFixture(sourceRoot, "samples/Sample.kt", sourceRegion("sample", "val answer = 42"));
    commitFixture(sourceRoot);
    writePage(root, sampleRoute(), pageRegion("sample", "val answer = 42"));
    writeManifest(root, [entry({ revision: pinnedRevision })]);

    await assert.rejects(checkSnippets({ root, sourceRoot }), (error) => {
      assert.match(error.message, new RegExp(`differs from samples/Sample\\.kt at ${pinnedRevision}`));
      assert.match(error.message, /-val answer = 41/);
      assert.match(error.message, /\+val answer = 42/);
      return true;
    });
  });
});

test("snippet revisions must be full lowercase commit hashes", async () => {
  const { checkSnippets } = await import("./check-snippets.mjs");
  for (const revision of ["main", "abc123", "A".repeat(40), null, 42, "a".repeat(41)]) {
    await withFixture(async ({ root, sourceRoot }) => {
      writeManifest(root, [entry({ revision })]);
      await assert.rejects(checkSnippets({ revision: REVISION, root, sourceRoot }), /snippet sample has invalid revision/);
    });
  }
});

test("pinned snippets fail closed for missing commits, non-commit hashes, and missing paths", async (t) => {
  const { checkSnippets } = await import("./check-snippets.mjs");
  for (const kind of ["missing commit", "blob hash", "missing path"]) {
    await t.test(kind, async () => {
      await withFixture(async ({ root, sourceRoot }) => {
        const firstRevision = initializeGit(sourceRoot);
        writeFixture(sourceRoot, "samples/Sample.kt", sourceRegion("sample", "val answer = 42"));
        commitFixture(sourceRoot);
        const pin = kind === "missing commit" ? "0".repeat(40)
          : kind === "blob hash" ? git(sourceRoot, "rev-parse", "HEAD:samples/Sample.kt") : firstRevision;
        writePage(root, sampleRoute(), pageRegion("sample", "val answer = 42"));
        writeManifest(root, [entry({ revision: pin })]);
        await assert.rejects(checkSnippets({ root, sourceRoot }), (error) => {
          assert.ok(error.message.includes(pin), error.message);
          assert.match(error.message, kind === "missing path" ? /source path is missing/ : /revision.*(?:missing|not a commit|unavailable)/);
          return true;
        });
      });
    });
  }
});

test("pinned snippets reject symlink and directory entries even when working files look usable", async (t) => {
  const { checkSnippets } = await import("./check-snippets.mjs");
  for (const kind of ["symlink", "directory"]) {
    await t.test(kind, async () => {
      await withFixture(async ({ root, sourceRoot }) => {
        initializeGit(sourceRoot);
        writeFixture(sourceRoot, "samples/Real.kt", sourceRegion("sample", "val answer = 42"));
        if (kind === "symlink") symlinkSync("Real.kt", resolve(sourceRoot, "samples/Sample.kt"));
        else writeFixture(sourceRoot, "samples/Sample.kt/inside.kt", "val inside = true\n");
        const pin = commitFixture(sourceRoot);
        rmSync(resolve(sourceRoot, "samples/Sample.kt"), { recursive: true });
        writeFixture(sourceRoot, "samples/Sample.kt", sourceRegion("sample", "val answer = 42"));
        writePage(root, sampleRoute(), pageRegion("sample", "val answer = 42"));
        writeManifest(root, [entry({ revision: pin })]);
        await assert.rejects(checkSnippets({ root, sourceRoot }), (error) => {
          assert.ok(error.message.includes(pin), error.message);
          assert.match(error.message, /not a regular Git file/);
          return true;
        });
      });
    });
  }
});

test("the same source path at different pinned revisions has independent snippet regions", async () => {
  const { checkSnippets } = await import("./check-snippets.mjs");
  await withFixture(async ({ root, sourceRoot }) => {
    initializeGit(sourceRoot);
    writeFixture(sourceRoot, "samples/Sample.kt", sourceRegion("old-sample", "val oldAnswer = 41"));
    const oldRevision = commitFixture(sourceRoot);
    writeFixture(sourceRoot, "samples/Sample.kt", sourceRegion("new-sample", "val newAnswer = 42"));
    const newRevision = commitFixture(sourceRoot);
    writePage(root, "/docs/store6/guides/old", pageRegion("old-sample", "val oldAnswer = 41"));
    writePage(root, "/docs/store6/guides/new", pageRegion("new-sample", "val newAnswer = 42"));
    writeManifest(root, [
      entry({ name: "old-sample", revision: oldRevision, pages: ["/docs/store6/guides/old"] }),
      entry({ name: "new-sample", revision: newRevision, pages: ["/docs/store6/guides/new"] }),
    ]);
    const result = await checkSnippets({ root, sourceRoot });
    assert.equal(result.snippetCount, 2);
    assert.equal(result.pageReferenceCount, 2);
    assert.deepEqual(result.additionalRevisions, [oldRevision]);
  });
});

function sourceRegion(name, body) {
  return `// docs:snippet:${name}\n${body}\n// docs:snippet:end\n`;
}

function pageRegion(name, body) {
  return `{/* snippet: ${name} */}\n\`\`\`kotlin\n${body}\n\`\`\`\n`;
}

function git(sourceRoot, ...args) {
  return execFileSync("git", ["-C", sourceRoot, "-c", "user.name=Snippet Fixture", "-c", "user.email=snippet@example.invalid", "-c", "commit.gpgsign=false", "-c", "core.hooksPath=/dev/null", ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function initializeGit(sourceRoot) {
  git(sourceRoot, "init", "--quiet");
  writeFixture(sourceRoot, "README.md", "Snippet fixture\n");
  return commitFixture(sourceRoot);
}

function commitFixture(sourceRoot) {
  git(sourceRoot, "add", "--all");
  git(sourceRoot, "commit", "--quiet", "-m", "Update snippet fixture");
  return git(sourceRoot, "rev-parse", "HEAD");
}

function entry(overrides = {}) {
  return {
    name: "sample",
    path: "samples/Sample.kt",
    pages: [sampleRoute()],
    ...overrides,
  };
}

function sampleRoute() {
  return "/docs/store6/guides/sample";
}

function writePage(root, route, body) {
  const relativeRoute = route.slice("/docs/store6/".length);
  writeFixture(root, `content/docs/store6/${relativeRoute}.mdx`, `---\ntitle: Fixture\n---\n\n${body}`);
}

function writeFixture(root, path, content) {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, content);
}

function writeManifest(root, snippets) {
  writeJson(root, "evidence/store6-snippets.json", { schemaVersion: 1, snippets });
}

function writeLock(root, sources = []) {
  writeJson(root, "evidence/T4-store6-source-lock.json", {
    schemaVersion: 1,
    revision: REVISION,
    sources,
  });
}

function writeJson(root, path, value) {
  writeFixture(root, path, `${JSON.stringify(value, null, 2)}\n`);
}

async function withFixture(callback) {
  const fixtureRoot = mkdtempSync(join(tmpdir(), "store-docs-snippets-"));
  const root = resolve(fixtureRoot, "store-docs");
  const sourceRoot = resolve(fixtureRoot, "Store6");
  mkdirSync(root, { recursive: true });
  mkdirSync(sourceRoot, { recursive: true });
  writeLock(root);
  try {
    await callback({ root, sourceRoot });
  } finally {
    rmSync(fixtureRoot, { force: true, recursive: true });
  }
}
