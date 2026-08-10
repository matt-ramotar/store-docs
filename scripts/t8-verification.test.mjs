import assert from "node:assert/strict";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";

import {
  assessPageFidelity,
  createFailureEnvelope,
  createSerialLiveFetcher,
  deriveRouteContract,
  extractRenderedPage,
  parseMode,
  verifyLiveFidelity,
  verifyLiveInventory,
  verifyLocalRoutes,
} from "./t8-verification.mjs";

const ROOT = resolve(import.meta.dirname, "..");
const LIVE_ORIGIN = "https://store.mobilenativefoundation.org";
const LOCAL_ORIGIN = "http://127.0.0.1:3222";

test("committed sources derive the inventory, separate exclusion, extras, and page census", async () => {
  const contract = await deriveRouteContract({ root: ROOT });
  const inventory = readLines(resolve(ROOT, "evidence/live-url-inventory.txt"));
  const extras = readLines(resolve(ROOT, "evidence/T8-extras.txt"));
  const lock = JSON.parse(readFileSync(resolve(ROOT, "evidence/T4-store6-source-lock.json"), "utf8"));
  const lockedStore6Routes = lock.sources
    .filter((entry) => entry.target.startsWith("content/docs/store6/") && entry.target.endsWith(".mdx"))
    .map((entry) => docsRoute(entry.target))
    .sort();

  assert.deepEqual(contract.inventoryUrls, inventory);
  assert.deepEqual(contract.inventoryPaths.filter((path) => !path.startsWith("/docs/")), [
    "/developer-newsletter/overview",
    "/release-notes/overview",
  ]);
  assert.deepEqual(contract.excludedUrls, [`${LIVE_ORIGIN}/api/openapi.json`]);
  assert.deepEqual(contract.exclusionsWithinInventory, []);
  assert.deepEqual(contract.store6SyncedRoutes, lockedStore6Routes);
  assert.deepEqual(contract.extras, extras);
  assert.equal(new Set(contract.pageRoutes).size, contract.pageRoutes.length);
  assert.equal(contract.pageRoutes.length, contract.inventoryPaths.length + contract.extras.length);
  assert.deepEqual(contract.nonPageSurfaces, [
    { path: "/api/search", surface: "static search API" },
    { path: "/llms.txt", surface: "public text file" },
  ]);
});

test("fixture derivation gets synchronized Store6 routes from both lock and ledger", async () => {
  await withFixture(async (root) => {
    const fixture = writeContractFixture(root);
    const contract = await deriveRouteContract({ root });

    assert.deepEqual(contract.inventoryUrls, fixture.inventoryUrls);
    assert.deepEqual(contract.store6SyncedRoutes, ["/docs/store6/quickstart"]);
    assert.deepEqual(contract.extras, fixture.extras);
    assert.deepEqual(contract.pageRoutes, [...new Set([...fixture.inventoryPaths, ...fixture.extras])].sort());
  });
});

test("route derivation rejects OpenAPI inside the inventory", async () => {
  await withFixture(async (root) => {
    writeContractFixture(root, {
      inventoryUrls: [
        `${LIVE_ORIGIN}/docs/intro`,
        `${LIVE_ORIGIN}/api/openapi.json`,
      ],
    });

    await assert.rejects(deriveRouteContract({ root }), /OpenAPI exclusion must remain outside the inventory/);
  });
});

test("route derivation rejects Store6 lock and ledger drift", async () => {
  await withFixture(async (root) => {
    writeContractFixture(root);
    const ledgerPath = resolve(root, "evidence/T4-owned-targets.json");
    const ledger = JSON.parse(readFileSync(ledgerPath, "utf8"));
    ledger.owners["sync-store6-docs"] = [];
    writeFileSync(ledgerPath, `${JSON.stringify(ledger, null, 2)}\n`);

    await assert.rejects(deriveRouteContract({ root }), /Store6 source lock and owned-target ledger differ/);
  });
});

test("route derivation checks the complete Store6 lock and ledger target sets", async () => {
  await withFixture(async (root) => {
    writeContractFixture(root);
    const ledgerPath = resolve(root, "evidence/T4-owned-targets.json");
    const ledger = JSON.parse(readFileSync(ledgerPath, "utf8"));
    ledger.owners["sync-store6-docs"] = ledger.owners["sync-store6-docs"].filter(
      ({ path }) => path !== "public/llms.txt",
    );
    writeFileSync(ledgerPath, `${JSON.stringify(ledger, null, 2)}\n`);

    await assert.rejects(deriveRouteContract({ root }), /Store6 source lock and owned-target ledger differ/);
  });
});

test("route derivation keeps the hand-authored Store6 overview outside the sync lock", async () => {
  await withFixture(async (root) => {
    writeContractFixture(root);
    const lockPath = resolve(root, "evidence/T4-store6-source-lock.json");
    const lock = JSON.parse(readFileSync(lockPath, "utf8"));
    lock.sources.push({ path: "docs/store6/overview.md", target: "content/docs/store6/overview.mdx" });
    writeFileSync(lockPath, `${JSON.stringify(lock, null, 2)}\n`);
    const ledgerPath = resolve(root, "evidence/T4-owned-targets.json");
    const ledger = JSON.parse(readFileSync(ledgerPath, "utf8"));
    ledger.owners["sync-store6-docs"].push({
      path: "content/docs/store6/overview.mdx",
      sha256: "0".repeat(64),
    });
    writeFileSync(ledgerPath, `${JSON.stringify(ledger, null, 2)}\n`);

    await assert.rejects(deriveRouteContract({ root }), /hand-authored Store6 overview must remain outside the sync lock/);
  });
});

test("route derivation requires the locked public text surface", async () => {
  await withFixture(async (root) => {
    writeContractFixture(root);
    const lockPath = resolve(root, "evidence/T4-store6-source-lock.json");
    const lock = JSON.parse(readFileSync(lockPath, "utf8"));
    lock.sources = lock.sources.filter(({ target }) => target !== "public/llms.txt");
    writeFileSync(lockPath, `${JSON.stringify(lock, null, 2)}\n`);
    const ledgerPath = resolve(root, "evidence/T4-owned-targets.json");
    const ledger = JSON.parse(readFileSync(ledgerPath, "utf8"));
    ledger.owners["sync-store6-docs"] = ledger.owners["sync-store6-docs"].filter(
      ({ path }) => path !== "public/llms.txt",
    );
    writeFileSync(ledgerPath, `${JSON.stringify(ledger, null, 2)}\n`);

    await assert.rejects(deriveRouteContract({ root }), /Store6 source lock must own public\/llms\.txt/);
  });
});

test("route derivation rejects inventory target and port ledger drift", async () => {
  await withFixture(async (root) => {
    writeContractFixture(root);
    const ledgerPath = resolve(root, "evidence/T4-owned-targets.json");
    const ledger = JSON.parse(readFileSync(ledgerPath, "utf8"));
    ledger.owners["port-page:generate"].pop();
    writeFileSync(ledgerPath, `${JSON.stringify(ledger, null, 2)}\n`);

    await assert.rejects(deriveRouteContract({ root }), /inventory targets and port ledger differ/);
  });
});

test("route derivation rejects an orphan content documentation route", async () => {
  await withFixture(async (root) => {
    writeContractFixture(root);
    writeFixture(root, "content/docs/orphan.mdx", "fixture\n");

    await assert.rejects(deriveRouteContract({ root }), /content documentation routes differ/);
  });
});

test("route derivation rejects unexpected application page entrypoints for every configured extension", async () => {
  for (const extension of ["mdx", "md", "jsx", "js", "tsx", "ts"]) {
    await withFixture(async (root) => {
      writeContractFixture(root);
      writeFixture(root, `app/unexpected/page.${extension}`, "fixture\n");

      await assert.rejects(deriveRouteContract({ root }), /application page entrypoints differ/);
    });
  }
});

test("route derivation rejects an unexpected public reference entrypoint", async () => {
  await withFixture(async (root) => {
    writeContractFixture(root);
    writeFixture(root, "public/reference/unexpected/index.html", "fixture\n");

    await assert.rejects(deriveRouteContract({ root }), /public reference entrypoints differ/);
  });
});

test("route derivation rejects an extras file that differs from computed routes", async () => {
  await withFixture(async (root) => {
    writeContractFixture(root);
    writeFixture(root, "evidence/T8-extras.txt", "/unexpected\n");

    await assert.rejects(deriveRouteContract({ root }), /T8 extras file differs from computed page extras/);
  });
});

test("rendered-page extraction retains hidden panels and ordered headings", () => {
  const page = extractRenderedPage(
    renderedPage({
      body: '<h2>First</h2><p>Visible</p><div hidden><h3>Second</h3><pre>hidden code</pre></div>',
      title: "Example",
    }),
    `${LIVE_ORIGIN}/docs/example`,
  );

  assert.equal(page.title, "Example");
  assert.equal(page.normalizedText, "FirstVisibleSecondhidden code");
  assert.equal(page.chars, page.normalizedText.length);
  assert.deepEqual(page.headings, ["First", "Second"]);
});

test("served-page extraction uses the title and content contract without the live-only main", () => {
  const page = extractRenderedPage(
    servedPage({ body: '<h2>Details</h2><div hidden><pre>hidden code</pre></div>', title: "Served" }),
    `${LOCAL_ORIGIN}/docs/example`,
    { requireMain: false },
  );

  assert.equal(page.title, "Served");
  assert.equal(page.normalizedText, "Detailshidden code");
  assert.deepEqual(page.headings, ["Details"]);
});

test("rendered-page extraction requires one container, title, and content node", () => {
  const duplicateContent = renderedPage({ body: "<p>One</p>", title: "Example" }).replace(
    "</main>",
    '<div id="content">Two</div></main>',
  );

  assert.throws(
    () => extractRenderedPage(duplicateContent, `${LIVE_ORIGIN}/docs/example`),
    /expected exactly one main#content-container, #page-title, and #content; got 1\/1\/2/,
  );
});

test("fidelity uses title equality, ordered headings, and the normalized character ratio", () => {
  const live = pageContract({ chars: 100, headings: ["One", "Two"], title: "Example" });
  const passing = assessPageFidelity(
    live,
    pageContract({ chars: 60, headings: ["One", "Two"], title: "Example" }),
  );
  const failing = assessPageFidelity(
    live,
    pageContract({ chars: 59, headings: ["Two", "One"], title: "Different" }),
  );

  assert.deepEqual(passing, {
    headingsMatch: true,
    passed: true,
    ratio: 0.6,
    reasons: [],
    titleMatch: true,
  });
  assert.deepEqual(failing, {
    headingsMatch: false,
    passed: false,
    ratio: 0.59,
    reasons: ["title differs", "normalized character ratio is below 60%", "ordered headings differ"],
    titleMatch: false,
  });
});

test("title-only fidelity is N/A and rejects invented local body content", () => {
  const live = pageContract({ chars: 0, headings: [], title: "Coming soon" });
  const passing = assessPageFidelity(
    live,
    pageContract({ chars: 0, headings: [], title: "Coming soon" }),
  );
  const failing = assessPageFidelity(
    live,
    pageContract({ chars: 1, headings: [], title: "Coming soon" }),
  );

  assert.equal(passing.ratio, null);
  assert.equal(passing.passed, true);
  assert.equal(failing.ratio, null);
  assert.equal(failing.passed, false);
  assert.deepEqual(failing.reasons, ["title-only live page has nonempty local content"]);
});

test("local verification checks page routes and labels non-page surfaces separately", async () => {
  const pageRoutes = ["/", "/docs/example"];
  const contract = {
    inventoryPaths: ["/docs/example"],
    nonPageSurfaces: [
      { path: "/api/search", surface: "static search API" },
      { path: "/llms.txt", surface: "public text file" },
    ],
    pageRoutes,
  };
  const calls = [];
  const fetchImpl = async (url) => {
    calls.push(url);
    const pathname = new URL(url).pathname;
    if (pathname === "/api/search") return response("[]", 200, "application/json");
    if (pathname === "/llms.txt") return response("# Store", 200, "text/plain");
    return response(servedPage({ body: "<p>Body</p>", title: pathname }), 200, "text/html");
  };

  const result = await verifyLocalRoutes(contract, { fetchImpl });

  assert.deepEqual(calls, [
    `${LOCAL_ORIGIN}/`,
    `${LOCAL_ORIGIN}/docs/example`,
    `${LOCAL_ORIGIN}/api/search`,
    `${LOCAL_ORIGIN}/llms.txt`,
  ]);
  assert.deepEqual(result.pageResults.map(({ path, status }) => ({ path, status })), [
    { path: "/", status: 200 },
    { path: "/docs/example", status: 200 },
  ]);
  assert.deepEqual(result.nonPageResults.map(({ path, status, surface }) => ({ path, status, surface })), [
    { path: "/api/search", status: 200, surface: "static search API" },
    { path: "/llms.txt", status: 200, surface: "public text file" },
  ]);
  assert.equal(result.localPages.has("/docs/example"), true);
});

test("local verification fails on the first non-200 response", async () => {
  const contract = {
    inventoryPaths: ["/docs/missing"],
    nonPageSurfaces: [],
    pageRoutes: ["/docs/missing"],
  };

  await assert.rejects(
    verifyLocalRoutes(contract, { fetchImpl: async () => response("missing", 404, "text/html") }),
    /http:\/\/127\.0\.0\.1:3222\/docs\/missing: expected HTTP 200, got 404/,
  );
});

test("local verification identifies the exact route when transport fails", async () => {
  const contract = {
    inventoryPaths: ["/docs/missing"],
    nonPageSurfaces: [],
    pageRoutes: ["/docs/missing"],
  };

  await assert.rejects(
    verifyLocalRoutes(contract, {
      fetchImpl: async () => {
        throw new Error("connection refused");
      },
    }),
    /http:\/\/127\.0\.0\.1:3222\/docs\/missing: request failed: connection refused/,
  );
});

test("serial live fetcher spaces every attempt and retries only 5xx", async () => {
  let clock = 0;
  const starts = [];
  const responses = [
    response("retry", 500),
    response("retry", 502),
    response("ok", 200),
    response("missing", 404),
  ];
  const fetchLive = createSerialLiveFetcher({
    fetchImpl: async () => {
      starts.push(clock);
      return responses.shift();
    },
    now: () => clock,
    sleep: async (milliseconds) => {
      clock += milliseconds;
    },
  });

  const first = await fetchLive(`${LIVE_ORIGIN}/docs/one`);
  assert.equal(first.attempts, 3);
  assert.equal(first.text, "ok");
  await assert.rejects(fetchLive(`${LIVE_ORIGIN}/docs/two`), /HTTP 404/);
  assert.deepEqual(starts, [0, 1000, 2000, 3000]);
});

test("serial live fetcher rechecks the clock after an early timer wake", async () => {
  let clock = 0;
  const starts = [];
  const fetchLive = createSerialLiveFetcher({
    fetchImpl: async () => {
      starts.push(clock);
      return response("ok", 200);
    },
    now: () => clock,
    sleep: async (milliseconds) => {
      clock += Math.min(milliseconds, 600);
    },
  });

  await fetchLive(`${LIVE_ORIGIN}/docs/one`);
  await fetchLive(`${LIVE_ORIGIN}/docs/two`);
  assert.deepEqual(starts, [0, 1000]);
});

test("serial live fetcher does not retry a network exception", async () => {
  let attempts = 0;
  const fetchLive = createSerialLiveFetcher({
    fetchImpl: async () => {
      attempts += 1;
      throw new Error("network unavailable");
    },
    now: () => 0,
    sleep: async () => {},
  });

  await assert.rejects(fetchLive(`${LIVE_ORIGIN}/docs/one`), /network unavailable/);
  assert.equal(attempts, 1);
});

test("serial live fetcher stops after two retries and never retries 429", async () => {
  let clock = 0;
  let attempts = 0;
  const fetchLive = createSerialLiveFetcher({
    fetchImpl: async () => {
      attempts += 1;
      return response("unavailable", 503);
    },
    now: () => clock,
    sleep: async (milliseconds) => {
      clock += milliseconds;
    },
  });

  await assert.rejects(fetchLive(`${LIVE_ORIGIN}/docs/one`), /HTTP 503/);
  assert.equal(attempts, 3);

  const noRetry = createSerialLiveFetcher({
    fetchImpl: async () => {
      attempts += 1;
      return response("limited", 429);
    },
    now: () => clock,
    sleep: async (milliseconds) => {
      clock += milliseconds;
    },
  });
  await assert.rejects(noRetry(`${LIVE_ORIGIN}/docs/two`), /HTTP 429/);
  assert.equal(attempts, 4);
});

test("serial live fetcher retries a 5xx even when its response body cannot be read", async () => {
  let attempts = 0;
  let clock = 0;
  const fetchLive = createSerialLiveFetcher({
    fetchImpl: async () => {
      attempts += 1;
      if (attempts === 1) {
        return {
          arrayBuffer: async () => {
            throw new Error("broken body");
          },
          status: 503,
          text: async () => {
            throw new Error("broken body");
          },
        };
      }
      return response("ok", 200);
    },
    now: () => clock,
    sleep: async (milliseconds) => {
      clock += milliseconds;
    },
  });

  const result = await fetchLive(`${LIVE_ORIGIN}/docs/one`);
  assert.equal(result.attempts, 2);
  assert.equal(attempts, 2);
});

test("serial live fetcher queues concurrent callers", async () => {
  let clock = 0;
  let inFlight = 0;
  let maxInFlight = 0;
  const starts = [];
  const fetchLive = createSerialLiveFetcher({
    fetchImpl: async () => {
      starts.push(clock);
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((resolveTurn) => setImmediate(resolveTurn));
      inFlight -= 1;
      return response("ok", 200);
    },
    now: () => clock,
    sleep: async (milliseconds) => {
      clock += milliseconds;
    },
  });

  await Promise.all([
    fetchLive(`${LIVE_ORIGIN}/docs/one`),
    fetchLive(`${LIVE_ORIGIN}/docs/two`),
  ]);
  assert.equal(maxInFlight, 1);
  assert.deepEqual(starts, [0, 1000]);
});

test("live inventory re-fetch requires exact sitemap value-and-order equality", async () => {
  const inventoryUrls = [
    `${LIVE_ORIGIN}/docs/one`,
    `${LIVE_ORIGIN}/docs/two`,
  ];
  const contract = { inventoryUrls };
  const sitemap = inventoryUrls.map((url) => `<url><loc>${url}</loc></url>`).join("");
  const passing = await verifyLiveInventory(contract, {
    liveFetch: async (url) => {
      assert.equal(url, `${LIVE_ORIGIN}/sitemap.xml`);
      return { attempts: 1, status: 200, text: `<urlset>${sitemap}</urlset>` };
    },
  });

  assert.deepEqual(passing, {
    attempts: 1,
    status: 200,
    url: `${LIVE_ORIGIN}/sitemap.xml`,
    urlCount: inventoryUrls.length,
  });
  await assert.rejects(
    verifyLiveInventory(contract, {
      liveFetch: async () => ({
        attempts: 1,
        status: 200,
        text: `<urlset><url><loc>${inventoryUrls[1]}</loc></url><url><loc>${inventoryUrls[0]}</loc></url></urlset>`,
      }),
    }),
    /live sitemap differs from evidence\/live-url-inventory\.txt/,
  );
});

test("live verification compares each live page with its served local page", async () => {
  const inventoryUrls = [
    `${LIVE_ORIGIN}/docs/example`,
    `${LIVE_ORIGIN}/developer-newsletter/overview`,
  ];
  const contract = {
    inventoryPaths: inventoryUrls.map((url) => new URL(url).pathname),
    inventoryUrls,
  };
  const localPages = new Map([
    [
      "/docs/example",
      extractRenderedPage(
        servedPage({ body: "<h2>Details</h2><p>Local body has enough text</p>", title: "Example" }),
        `${LOCAL_ORIGIN}/docs/example`,
        { requireMain: false },
      ),
    ],
    [
      "/developer-newsletter/overview",
      extractRenderedPage(
        servedPage({ body: "", title: "Coming soon" }),
        `${LOCAL_ORIGIN}/developer-newsletter/overview`,
        { requireMain: false },
      ),
    ],
  ]);
  const liveBodies = new Map([
    [
      inventoryUrls[0],
      renderedPage({ body: '<h2>Details</h2><p>Live body</p><div hidden><pre>hidden</pre></div>', title: "Example" }),
    ],
    [inventoryUrls[1], renderedPage({ body: "", title: "Coming soon" })],
  ]);
  const calls = [];
  const liveFetch = async (url) => {
    calls.push(url);
    return { attempts: 1, status: 200, text: liveBodies.get(url) };
  };

  const result = await verifyLiveFidelity(contract, localPages, { liveFetch });

  assert.deepEqual(calls, inventoryUrls);
  assert.equal(result.length, inventoryUrls.length);
  assert.equal(result.every((entry) => entry.passed), true);
  assert.equal(result[0].liveChars > 0, true);
  assert.equal(result[1].ratio, null);
});

test("mode parser exposes bounded local and live commands", () => {
  assert.equal(parseMode(["--local"]), "local");
  assert.equal(parseMode(["--live"]), "live");
  assert.throws(() => parseMode([]), /usage: t8-verification\.mjs --local \| --live/);
  assert.throws(() => parseMode(["--live", "--local"]), /usage: t8-verification\.mjs --local \| --live/);
});

test("failure envelope is deterministic and omits stack and timing data", () => {
  assert.deepEqual(createFailureEnvelope(new Error("route failed"), "local"), {
    schemaVersion: 1,
    mode: "local",
    passed: false,
    error: {
      message: "route failed",
      name: "Error",
    },
  });
});

function writeContractFixture(root, options = {}) {
  const inventoryUrls = options.inventoryUrls ?? [
    `${LIVE_ORIGIN}/developer-newsletter/overview`,
    `${LIVE_ORIGIN}/docs/intro`,
    `${LIVE_ORIGIN}/release-notes/overview`,
  ];
  const inventoryPaths = inventoryUrls.map((url) => new URL(url).pathname);
  const syncedTarget = "content/docs/store6/quickstart.mdx";
  const extras = [
    "/",
    "/docs",
    "/docs/store6/concepts/api-tiers",
    "/docs/store6/concepts/errors",
    "/docs/store6/concepts/freshness",
    "/docs/store6/concepts/memory-and-lifecycle",
    "/docs/store6/concepts/read-contract",
    "/docs/store6/overview",
    "/docs/store6/quickstart",
    "/reference/store6-core/index.html",
    "/reference/store6-mutations/index.html",
    "/tokens-demo",
  ].sort();

  writeFixture(root, "evidence/live-url-inventory.txt", `${inventoryUrls.join("\n")}\n`);
  writeFixture(
    root,
    "evidence/T4-manifest.md",
    [
      "| URL | Target | Status | Loss |",
      "| --- | --- | --- | --- |",
      ...inventoryUrls.map((url) => `| ${url} | target | ported clean | none |`),
      `| ${LIVE_ORIGIN}/api/openapi.json | — | excluded by design | Not part of inventory |`,
      "",
    ].join("\n"),
  );
  writeFixture(
    root,
    "evidence/T4-store6-source-lock.json",
    `${JSON.stringify(
      {
        schemaVersion: 1,
        sources: [
          { path: "docs/store6/quickstart.md", target: syncedTarget },
          { path: "llms.txt", target: "public/llms.txt" },
        ],
      },
      null,
      2,
    )}\n`,
  );
  writeFixture(
    root,
    "evidence/T4-owned-targets.json",
    `${JSON.stringify(
      {
        schemaVersion: 1,
        owners: {
          "port-page:generate": [
            ...inventoryPaths.map((path) => ({ path: inventoryTarget(path), sha256: "0".repeat(64) })),
            { path: "evidence/T4-manifest.md", sha256: "0".repeat(64) },
          ],
          "sync-store6-docs": [
            { path: syncedTarget, sha256: "0".repeat(64) },
            { path: "public/llms.txt", sha256: "0".repeat(64) },
          ],
        },
      },
      null,
      2,
    )}\n`,
  );
  writeFixture(root, "evidence/T8-extras.txt", `${extras.join("\n")}\n`);
  for (const path of [
    "app/(docs)/docs/[[...slug]]/page.tsx",
    "app/page.tsx",
    "app/tokens-demo/page.tsx",
    "content/docs/index.mdx",
    "content/docs/store6/concepts/api-tiers.mdx",
    "content/docs/store6/concepts/errors.mdx",
    "content/docs/store6/concepts/freshness.mdx",
    "content/docs/store6/concepts/memory-and-lifecycle.mdx",
    "content/docs/store6/concepts/read-contract.mdx",
    "content/docs/store6/overview.mdx",
    syncedTarget,
    ...inventoryPaths.map(inventoryTarget),
    "public/llms.txt",
    "public/reference/store6-core/index.html",
    "public/reference/store6-mutations/index.html",
  ]) {
    writeFixture(root, path, "fixture\n");
  }

  return { extras, inventoryPaths, inventoryUrls };
}

async function withFixture(callback) {
  const root = mkdtempSync(join(tmpdir(), "store-docs-t8-"));
  try {
    await callback(root);
  } finally {
    rmSync(root, { force: true, recursive: true });
  }
}

function writeFixture(root, path, content) {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, content);
}

function readLines(path) {
  return readFileSync(path, "utf8").trim().split(/\r?\n/).filter(Boolean);
}

function docsRoute(target) {
  const relative = target.slice("content/docs/".length, -".mdx".length);
  return relative === "index" ? "/docs" : `/docs/${relative}`;
}

function inventoryTarget(path) {
  return path.startsWith("/docs/") ? `content${path}.mdx` : `app${path}/page.tsx`;
}

function renderedPage({ body, title }) {
  return `<!doctype html><html><body><main id="content-container"><header id="header"><h1 id="page-title">${title}</h1></header><div id="content">${body}</div></main></body></html>`;
}

function servedPage({ body, title }) {
  return `<!doctype html><html><body><article><header><h1 id="page-title">${title}</h1></header><div id="content">${body}</div></article></body></html>`;
}

function pageContract({ chars, headings, title }) {
  return { chars, headings, title };
}

function response(body, status = 200, contentType = "text/html") {
  return new Response(body, { headers: { "content-type": contentType }, status });
}
