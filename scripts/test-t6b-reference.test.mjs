import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { load } from "cheerio";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";

const guard = await import("./test-t6b-reference.mjs");
const { verifyReferenceTree } = guard;
const canonicalSiteOrigin = "https://store.mobilenativefoundation.org";
const fixtureSourceRoot = resolve(import.meta.dirname, "..");

const approvedScriptPaths = [
  "scripts/main.js",
  "scripts/navigation-loader.js",
  "scripts/platform-content-handler.js",
  "scripts/prism.js",
  "scripts/safe-local-storage_blocking.js",
  "scripts/sourceset_dependencies.js",
  "ui-kit/ui-kit.min.js",
];
const stockDokkaV2ScriptPaths = [
  "scripts/safe-local-storage_blocking.js",
  "ui-kit/ui-kit.min.js",
];
const stockDokkaDarkModeBootstrap = `const storage = localStorage.getItem("dokka-dark-mode")
if (storage == null) {
    const osDarkSchemePreferred = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    if (osDarkSchemePreferred === true) {
        document.getElementsByTagName("html")[0].classList.add("theme-dark")
    }
} else {
    const savedDarkMode = JSON.parse(storage)
    if(savedDarkMode === true) {
        document.getElementsByTagName("html")[0].classList.add("theme-dark")
    }
}`;
const stockDokkaV2DarkModeBootstrap = `const storage = localStorage.getItem("dokka-dark-mode")
if (storage == null) {
    const osDarkSchemePreferred = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    if (osDarkSchemePreferred === true) {
        document.getElementsByTagName("html")[0].classList.add("theme-dark")
    }
} else {
    const savedDarkMode = JSON.parse(storage)
    if (savedDarkMode === true) {
        document.getElementsByTagName("html")[0].classList.add("theme-dark")
    }
}`;

test("exports a fixture-callable reference verifier", () => {
  assert.equal(typeof verifyReferenceTree, "function");
});

test("accepts a minimal generated-compatible reference tree", async () => {
  await withFixture(async (root) => {
    writeValidFixture(root);

    assert.deepEqual(await verifyReferenceTree({ root }), {
      verificationMode: "legacy-integrity",
      customThemePagesChecked: 0,
      htmlFilesChecked: 2,
      moduleRootsChecked: 2,
      referenceFiles: 2,
      scriptsChecked: 0,
    });
  });
});

test("rejects placeholder reference notices anywhere in the generated tree", async () => {
  for (const notice of [
    "Store 6 Core API Reference Unavailable",
    "This page is not generated API documentation.",
    "Generated API documentation is currently unavailable.",
    "Replace its placeholder directory with the complete Dokka output.",
  ]) {
    await withFixture(async (root) => {
      writeValidFixture(root);
      writeNestedHtml(root, `<p>${notice}</p>`);

      await assert.rejects(
        verifyReferenceTree({ root }),
        /placeholder reference notice.*store6-core\/symbols\/index\.html/i,
      );
    });
  }
});

test("accepts a nested generated page with safe links and stock Dokka scripts", async () => {
  await withFixture(async (root) => {
    writeValidFixture(root);
    writeGeneratedPage(root);

    assert.deepEqual(await verifyReferenceTree({ root }), {
      verificationMode: "legacy-integrity",
      customThemePagesChecked: 0,
      htmlFilesChecked: 3,
      moduleRootsChecked: 2,
      referenceFiles: 11,
      scriptsChecked: 10,
    });
  });
});

test("accepts all three stock Dokka inline bootstraps", async () => {
  await withFixture(async (root) => {
    writeValidFixture(root);
    writeNestedHtml(
      root,
      `<script>document.documentElement.classList.replace("no-js", "js");</script>
<script>var pathToRoot = "../";</script>
<script>${stockDokkaDarkModeBootstrap}</script>`,
    );

    const summary = await verifyReferenceTree({ root });

    assert.equal(summary.scriptsChecked, 3);
  });
});

test("accepts the exact Dokka 2.2 dark-mode bootstrap", async () => {
  await withFixture(async (root) => {
    writeValidFixture(root);
    writeNestedHtml(root, `<script>${stockDokkaV2DarkModeBootstrap}</script>`);

    const summary = await verifyReferenceTree({ root });

    assert.equal(summary.scriptsChecked, 1);
  });
});

test("accepts the exact Dokka 2.2 local script paths", async () => {
  await withFixture(async (root) => {
    writeValidFixture(root);
    for (const relativePath of stockDokkaV2ScriptPaths) {
      writeStockScriptFixture(root, relativePath);
    }
    writeNestedHtml(
      root,
      stockDokkaV2ScriptPaths
        .map((relativePath) => `<script src="../${relativePath}"></script>`)
        .join("\n"),
    );

    const summary = await verifyReferenceTree({ root });

    assert.equal(summary.scriptsChecked, 2);
  });
});

test("rejects a base element before validating approved-looking relative scripts", async () => {
  await withFixture(async (root) => {
    writeValidFixture(root);
    writeStockScriptFixture(root, "scripts/main.js");
    writeNestedHtml(
      root,
      '<base href="https://evil.example/"><script src="../scripts/main.js"></script>',
    );

    await assert.rejects(verifyReferenceTree({ root }), /base element.*not allowed/i);
  });
});

test("rejects an approved script basename outside the module-root scripts directory", async () => {
  await withFixture(async (root) => {
    writeValidFixture(root);
    writeFixture(root, "public/reference/store6-core/assets/main.js", "// generated fixture\n");
    writeNestedHtml(root, '<script src="../assets/main.js"></script>');

    await assert.rejects(verifyReferenceTree({ root }), /canonical module script path/i);
  });
});

test("accepts a deeply nested page whose script resolves to module-root scripts", async () => {
  await withFixture(async (root) => {
    writeValidFixture(root);
    writeStockScriptFixture(root, "scripts/main.js");
    writeNestedHtmlAt(
      root,
      "public/reference/store6-core/symbols/classes/index.html",
      '<script src="../../scripts/main.js"></script>',
    );

    const summary = await verifyReferenceTree({ root });

    assert.equal(summary.scriptsChecked, 1);
  });
});

test("rejects symlinked owned public path components before module traversal", async () => {
  for (const ownedPath of ["public/reference", "public"]) {
    await withFixture(async (root) => {
      writeValidFixture(root);
      const owned = resolve(root, ownedPath);
      const target = resolve(root, `${ownedPath.replaceAll("/", "-")}-target`);
      renameSync(owned, target);
      symlinkSync(target, owned, "dir");

      await assert.rejects(
        verifyReferenceTree({ root }),
        new RegExp(`${escapeRegExp(ownedPath)}.*must not be a symlink`, "i"),
      );
    });
  }
});

test("accepts published words that merely contain the tracker spelling", async () => {
  await withFixture(async (root) => {
    writeValidFixture(root);
    const trackerPrefix = ["Lin", "ear"].join("");
    writeNestedHtml(root, `<p>${trackerPrefix}ization preserves a deterministic order.</p>`);

    await verifyReferenceTree({ root });
  });
});

test("scans nested pages for unresolved-link markers", async () => {
  await withFixture(async (root) => {
    writeValidFixture(root);
    writeNestedHtml(root, '<span data-unresolved-link="Store">Store</span>');

    await assert.rejects(
      verifyReferenceTree({ root }),
      /data-unresolved-link.*store6-core\/symbols\/index\.html/i,
    );
  });
});

test("scans nested pages for internal tracker vocabulary", async () => {
  for (const token of [["ST", "ORE-123"].join(""), "T6b", ["Lin", "ear"].join("")]) {
    await withFixture(async (root) => {
      writeValidFixture(root);
      writeNestedHtml(root, `<p>${token}</p>`);

      await assert.rejects(
        verifyReferenceTree({ root }),
        /internal tracker vocabulary.*store6-core\/symbols\/index\.html/i,
      );
    });
  }
});

test("scans every non-HTML text asset for durable forbidden tokens", async () => {
  const forbiddenToken = ["ST", "ORE-123"].join("");
  for (const relativePath of [
    "styles/fixture.css",
    "scripts/fixture.js.json",
    "metadata/fixture.json",
    "store6-core/package-list",
    "store6-core/source-list",
    "notes/fixture.txt",
    "images/fixture.svg",
  ]) {
    await withFixture(async (root) => {
      writeValidFixture(root);
      writeFixture(root, `public/reference/store6-core/${relativePath}`, forbiddenToken);

      await assert.rejects(
        verifyReferenceTree({ root }),
        new RegExp(`durable public-surface token.*${escapeRegExp(relativePath)}`, "i"),
      );
    });
  }
});

test("scans non-HTML text assets for local and private filesystem paths", async () => {
  const localPaths = [
    ["", "Users", "developer", "src"].join("/"),
    ["", "private", "tmp", "generated"].join("/"),
    ["", "tmp", "generated"].join("/"),
    ["C:", "Users", "developer", "src"].join("\\"),
    ["file:", "", "", "Users", "developer", "src"].join("/"),
  ];
  for (const [index, localPath] of localPaths.entries()) {
    await withFixture(async (root) => {
      writeValidFixture(root);
      const relativePath = `metadata/local-path-${index}.json`;
      writeFixture(root, `public/reference/store6-core/${relativePath}`, localPath);

      await assert.rejects(
        verifyReferenceTree({ root }),
        new RegExp(`local or private filesystem path.*${escapeRegExp(relativePath)}`, "i"),
      );
    });
  }
});

test("rejects an unreferenced unexpected executable asset", async () => {
  await withFixture(async (root) => {
    writeValidFixture(root);
    writeFixture(root, "public/reference/store6-core/scripts/custom.js", "window.alert(1);\n");

    await assert.rejects(verifyReferenceTree({ root }), /unexpected executable asset.*custom\.js/i);
  });
});

test("rejects altered bytes at an approved stock Dokka script path", async () => {
  await withFixture(async (root) => {
    writeValidFixture(root);
    const relativeScript = "scripts/main.js";
    const stockScript = readFileSync(
      resolve(fixtureSourceRoot, "public/reference/store6-core", relativeScript),
    );
    writeFixture(
      root,
      `public/reference/store6-core/${relativeScript}`,
      Buffer.concat([stockScript, Buffer.from("\nwindow.alert(1);\n")]),
    );
    writeNestedHtml(root, `<script src="../${relativeScript}"></script>`);

    await assert.rejects(
      verifyReferenceTree({ root }),
      /stock Dokka script integrity mismatch.*main\.js/i,
    );
  });
});

test("rejects unsafe anchor schemes and site-root paths", async () => {
  for (const href of ["javascript:alert(1)", "data:text/plain,no", "http://example.com", "/admin"]) {
    await withFixture(async (root) => {
      writeValidFixture(root);
      writeNestedHtml(root, `<a href="${href}">unsafe</a>`);

      await assert.rejects(verifyReferenceTree({ root }), /unsafe anchor href/i);
    });
  }
});

test("rejects missing and escaping relative anchor targets", async () => {
  for (const href of ["./missing.html", "..%2F..%2Fstore6-mutations%2Findex.html"]) {
    await withFixture(async (root) => {
      writeValidFixture(root);
      writeNestedHtml(root, `<a href="${href}">unsafe</a>`);

      await assert.rejects(verifyReferenceTree({ root }), /relative anchor.*(?:missing|escapes)/i);
    });
  }
});

test("rejects arbitrary inline scripts", async () => {
  await withFixture(async (root) => {
    writeValidFixture(root);
    writeNestedHtml(root, '<script>window.alert("no")</script>');

    await assert.rejects(verifyReferenceTree({ root }), /inline script.*not an approved Dokka bootstrap/i);
  });
});

test("rejects unapproved external scripts", async () => {
  await withFixture(async (root) => {
    writeValidFixture(root);
    writeNestedHtml(root, '<script src="https://example.com/app.js"></script>');

    await assert.rejects(verifyReferenceTree({ root }), /external script.*not approved/i);
  });
});

test("rejects unapproved and missing local scripts", async () => {
  for (const { href, writeTarget } of [
    { href: "../scripts/custom.js", writeTarget: true },
    { href: "../scripts/main.js", writeTarget: false },
  ]) {
    await withFixture(async (root) => {
      writeValidFixture(root);
      if (writeTarget) {
        writeFixture(root, "public/reference/store6-core/scripts/custom.js", "fixture\n");
      }
      writeNestedHtml(root, `<script src="${href}"></script>`);

      await assert.rejects(verifyReferenceTree({ root }), /local script.*(?:basename|missing)/i);
    });
  }
});

test("rejects inline event-handler attributes on nested pages", async () => {
  await withFixture(async (root) => {
    writeValidFixture(root);
    writeNestedHtml(root, '<button onclick="window.alert(1)">unsafe</button>');

    await assert.rejects(verifyReferenceTree({ root }), /inline event handler.*onclick/i);
  });
});

test("accepts only the exact Dokka 2.2 navigation toggle handler", async () => {
  await withFixture(async (root) => {
    writeValidFixture(root);
    writeNestedHtmlAt(
      root,
      "public/reference/store6-core/navigation.html",
      `<button onclick="window.handleTocButtonClick(event, 'store6-core-nav-submenu-0-2')">Toggle</button>`,
    );

    await verifyReferenceTree({ root });
  });

  for (const { body, relativePath } of [
    {
      body: `<button onclick="window.handleTocButtonClick(event, 'store6-core-nav-submenu-0-2')">Toggle</button>`,
      relativePath: "public/reference/store6-core/symbols/index.html",
    },
    {
      body: `<button onclick="window.handleTocButtonClick(event, 'store6-mutations-nav-submenu-0-2')">Toggle</button>`,
      relativePath: "public/reference/store6-core/navigation.html",
    },
    {
      body: `<div onclick="window.handleTocButtonClick(event, 'store6-core-nav-submenu-0-2')">Toggle</div>`,
      relativePath: "public/reference/store6-core/navigation.html",
    },
  ]) {
    await withFixture(async (root) => {
      writeValidFixture(root);
      writeNestedHtmlAt(root, relativePath, body);

      await assert.rejects(verifyReferenceTree({ root }), /inline event handler/i);
    });
  }
});

test("rejects a symlink nested in either module tree", async () => {
  await withFixture(async (root) => {
    writeValidFixture(root);
    const linkPath = resolve(root, "public/reference/store6-core/symbols/linked.html");
    mkdirSync(dirname(linkPath), { recursive: true });
    symlinkSync(resolve(root, "next.config.mjs"), linkPath, "file");

    await assert.rejects(verifyReferenceTree({ root }), /linked\.html must not be a symlink/i);
  });
});

test("requires each module entrypoint and a normalized module title", async () => {
  await withFixture(async (root) => {
    writeValidFixture(root);
    rmSync(resolve(root, "public/reference/store6-core/index.html"));

    await assert.rejects(
      verifyReferenceTree({ root }),
      /store6-core\/index\.html.*regular file/i,
    );
  });

  await withFixture(async (root) => {
    writeValidFixture(root, { coreTitle: "Unrelated API Reference" });

    await assert.rejects(verifyReferenceTree({ root }), /title.*store6-core/i);
  });
});

test("requires sibling, docs, and Store6 overview links on each entrypoint", async () => {
  for (const missingHref of [
    "/reference/store6-mutations/index.html",
    "/docs",
    "/docs/store6/overview",
  ]) {
    await withFixture(async (root) => {
      writeValidFixture(root, { omittedCoreHrefs: [missingHref] });

      await assert.rejects(
        verifyReferenceTree({ root }),
        new RegExp(`store6-core/index\\.html.*required link.*${escapeRegExp(missingHref)}`, "i"),
      );
    });
  }
});

test("accepts required entrypoint links on the canonical Store documentation origin", async () => {
  await withFixture(async (root) => {
    writeValidFixture(root, { linkOrigin: canonicalSiteOrigin });

    assert.deepEqual(await verifyReferenceTree({ root }), {
      verificationMode: "legacy-integrity",
      customThemePagesChecked: 0,
      htmlFilesChecked: 2,
      moduleRootsChecked: 2,
      referenceFiles: 2,
      scriptsChecked: 0,
    });
  });
});

test("rejects required-link aliases with duplicate or encoded separators", async () => {
  for (const linkOrigin of ["", canonicalSiteOrigin]) {
    for (const coreSiblingHref of [
      "//reference/store6-mutations/index.html",
      "/%2Freference/store6-mutations/index.html",
      "/reference/store6-core/%2E%2E%2Fstore6-mutations/index.html",
    ]) {
      await withFixture(async (root) => {
        writeValidFixture(root, { coreSiblingHref, linkOrigin });

        await assert.rejects(verifyReferenceTree({ root }), /unsafe anchor href/i);
      });
    }
  }
});

test("preserves the Reference nav, no-redirect, and no-shadow-route invariants", async () => {
  await withFixture(async (root) => {
    writeValidFixture(root, { navSource: "export const primaryNavItems = [];\n" });

    await assert.rejects(verifyReferenceTree({ root }), /nav.*Reference/i);
  });

  await withFixture(async (root) => {
    writeValidFixture(root, {
      nextConfig: "export default { async redirects() { return []; } };\n",
    });

    await assert.rejects(verifyReferenceTree({ root }), /must not add a redirect/i);
  });

  for (const shadowPath of [
    "public/reference/index.html",
    "app/reference/page.tsx",
    "app/reference-note/page.tsx",
  ]) {
    await withFixture(async (root) => {
      writeValidFixture(root);
      writeFixture(root, shadowPath, "fixture\n");

      await assert.rejects(verifyReferenceTree({ root }), /forbidden shadow route/i);
    });
  }
});

async function withFixture(run) {
  const root = mkdtempSync(join(tmpdir(), "store-docs-t6b-"));
  try {
    await run(root);
  } finally {
    rmSync(root, { force: true, recursive: true });
  }
}

function writeValidFixture(
  root,
  {
    coreTitle = "store6-core API",
    coreSiblingHref = "/reference/store6-mutations/index.html",
    mutationsTitle = "store6-mutations API",
    navSource = 'export const primaryNavItems = [{ href: "/reference/store6-core/index.html", label: "Reference" }];\n',
    nextConfig = "export default {};\n",
    omittedCoreHrefs = [],
    linkOrigin = "",
  } = {},
) {
  writeFixture(
    root,
    "public/reference/store6-core/index.html",
    entrypointHtml({
      omittedHrefs: omittedCoreHrefs,
      linkOrigin,
      siblingHref: coreSiblingHref,
      title: coreTitle,
    }),
  );
  writeFixture(
    root,
    "public/reference/store6-mutations/index.html",
    entrypointHtml({
      linkOrigin,
      siblingHref: "/reference/store6-core/index.html",
      title: mutationsTitle,
    }),
  );
  writeFixture(root, "lib/nav.ts", navSource);
  writeFixture(root, "next.config.mjs", nextConfig);
}

function entrypointHtml({ omittedHrefs = [], linkOrigin = "", siblingHref, title }) {
  const links = [
    ["/docs", "Docs"],
    ["/docs/store6/overview", "Store 6 overview"],
    [siblingHref, "Sibling module"],
  ]
    .filter(([href]) => !omittedHrefs.includes(href))
    .map(([href, label]) => `<a href="${linkOrigin}${href}">${label}</a>`)
    .join("\n");

  return `<!doctype html>
<html><head><title>${title}</title></head><body>${links}</body></html>
`;
}

function writeGeneratedPage(root) {
  const localScripts = approvedScriptPaths
    .map((relativePath) => `<script src="../${relativePath}"></script>`)
    .join("\n");
  for (const relativePath of approvedScriptPaths) {
    writeStockScriptFixture(root, relativePath);
  }
  writeFixture(root, "public/reference/store6-core/styles/main.css", "/* generated fixture */\n");
  writeNestedHtml(
    root,
    `<a href="#symbol">Fragment</a>
<a href="../index.html?source=generated#top">Module root</a>
<a href="https://example.com/reference">External HTTPS</a>
${localScripts}
<script src="https://unpkg.com/kotlin-playground@1/dist/playground.min.js"></script>
<script>
  document.documentElement.classList.replace("no-js", "js")
</script>
<script> var pathToRoot = "../"; </script>`,
  );
}

function writeNestedHtml(root, body) {
  writeNestedHtmlAt(root, "public/reference/store6-core/symbols/index.html", body);
}

function writeNestedHtmlAt(root, relativePath, body) {
  writeFixture(
    root,
    relativePath,
    `<!doctype html><html><head><title>Symbol</title></head><body>${body}</body></html>\n`,
  );
}

function writeFixture(root, relativePath, contents) {
  const target = resolve(root, relativePath);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, contents);
}

function writeStockScriptFixture(root, relativePath, moduleSlug = "store6-core") {
  writeFixture(
    root,
    `public/reference/${moduleSlug}/${relativePath}`,
    readFileSync(resolve(fixtureSourceRoot, "public/reference", moduleSlug, relativePath)),
  );
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}


test("Tidal verification explicitly distinguishes candidate structure from legacy integrity", async () => {
  await withFixture(async (root) => {
    writeTidalFixture(root);
    const summary = await verifyReferenceTree({ root, theme: "tidal" });
    assert.equal(summary.verificationMode, "tidal-customization");
    assert.equal(summary.customThemePagesChecked, 3);
    assert.equal((await verifyReferenceTree({ root })).verificationMode, "legacy-integrity");
  });
  await withFixture(async (root) => {
    writeValidFixture(root);
    await assert.rejects(verifyReferenceTree({ root, theme: "tidal" }), /Tidal/);
    await assert.rejects(verifyReferenceTree({ root, theme: "typo" }), /unsupported reference theme/);
  });
});

test("Tidal checks the exact guide control on deep pages, not a body link", async () => {
  const mutations = [
    $ => $("#homepage-link").remove(),
    $ => $("#homepage-link").attr("href", "https://store.mobilenativefoundation.org/docs/store6/overview"),
    $ => $("#homepage-link").attr("href", "/docs/store6/overview?from=reference"),
    $ => $("#homepage-link").attr("href", "/docs/store6/overview#start-here"),
    $ => $("#homepage-link").attr("aria-label", "Home"),
    $ => $("#homepage-link").text(""),
    $ => $("#homepage-link").attr("hidden", ""),
    $ => $("body").append($("#homepage-link")),
  ];
  for (const mutate of mutations) await withFixture(async root => {
    writeTidalFixture(root);
    mutateTidalPage(root, mutate);
    await assert.rejects(verifyReferenceTree({ root, theme: "tidal" }), /Tidal/);
  });
});

test("Tidal rejects lost stock controls and broken module identity", async () => {
  for (const selector of ["#theme-toggle-button", "#searchBar", "#toc-toggle", "#filter-section",
    ".platform-selector", "#platform-tags-listbox", "#sideMenu", "#toc-listbox", ".breadcrumbs",
    ".library-name--link"]) {
    await withFixture(async root => {
      writeTidalFixture(root);
      mutateTidalPage(root, $ => $(selector).remove());
      await assert.rejects(verifyReferenceTree({ root, theme: "tidal" }), /Tidal/);
    });
  }
  for (const mutate of [
    $ => $("#theme-toggle-button").attr("disabled", ""),
    $ => $("#searchBar").attr("role", "presentation"),
    $ => $(".library-name--link").attr("href", "index.html"),
    $ => $(".library-name--link").text("Another library"),
    $ => $("#navigation-wrapper").attr("style", "display: none"),
  ]) await withFixture(async root => {
    writeTidalFixture(root);
    mutateTidalPage(root, mutate);
    await assert.rejects(verifyReferenceTree({ root, theme: "tidal" }), /Tidal/);
  });
});

test("Tidal rejects missing, unloaded, and altered theme assets", async () => {
  for (const mutate of [
    $ => $('link[href$="store-reference.css"]').remove(),
    $ => $('link[href$="store-reference.css"]').attr("rel", "preload"),
    $ => $('link[href$="store-reference.css"]').attr("media", "print"),
    $ => $('link[rel="icon"]').remove(),
    $ => $(".footer--content").text("Generated by Dokka"),
    $ => $('script[src$="main.js"]').remove(),
  ]) await withFixture(async root => {
    writeTidalFixture(root);
    mutateTidalPage(root, mutate);
    await assert.rejects(verifyReferenceTree({ root, theme: "tidal" }), /Tidal/);
  });
  for (const asset of ["styles/store-reference.css", "images/logo-icon.svg"]) {
    await withFixture(async root => {
      writeTidalFixture(root);
      writeFixture(root, "public/reference/store6-core/" + asset, "broken asset");
      await assert.rejects(verifyReferenceTree({ root, theme: "tidal" }), /Tidal.*integrity/);
    });
    await withFixture(async root => {
      writeTidalFixture(root);
      rmSync(join(root, "public/reference/store6-core", asset));
      await assert.rejects(verifyReferenceTree({ root, theme: "tidal" }), /Tidal.*missing/);
    });
  }
});

test("Tidal retains stock script integrity and cannot excuse a full page as navigation", async () => {
  await withFixture(async root => {
    writeTidalFixture(root);
    writeFixture(root, "public/reference/store6-core/scripts/main.js", "alert('changed')");
    await assert.rejects(verifyReferenceTree({ root, theme: "tidal" }), /stock Dokka script integrity/);
  });
  await withFixture(async root => {
    writeTidalFixture(root);
    writeFixture(root, "public/reference/store6-core/navigation.html", "<html><body>No header</body></html>");
    await assert.rejects(verifyReferenceTree({ root, theme: "tidal" }), /Tidal.*navigation fragment/);
  });
});

test("CLI selects strict mode explicitly and rejects unknown arguments", async () => {
  await withFixture(async root => {
    writeValidFixture(root);
    const cli = (...args) => spawnSync(process.execPath,
      [join(fixtureSourceRoot, "scripts/test-t6b-reference.mjs"), "--root", root, ...args],
      { encoding: "utf8" });
    const legacy = cli();
    assert.equal(legacy.status, 0, legacy.stderr);
    assert.equal(JSON.parse(legacy.stdout).verificationMode, "legacy-integrity");
    assert.notEqual(cli("--theme", "tidal").status, 0);
    assert.notEqual(cli("--theme", "typo").status, 0);
    assert.notEqual(cli("--tidla").status, 0);
  });
});

function mutateTidalPage(root, mutate) {
  const target = join(root, "public/reference/store6-core/symbols/index.html");
  const $ = load(readFileSync(target, "utf8"));
  mutate($);
  writeFileSync(target, $.html());
}

// Permanent fixtures preserve the tested source resources independently of verifier hashes.
function themeFixtureResource(basename) {
  return readFileSync(join(fixtureSourceRoot, "scripts/fixtures/reference-theme", basename), "utf8");
}

function writeTidalFixture(root) {
  writeValidFixture(root);
  for (const slug of ["store6-core", "store6-mutations"]) {
    for (const relative of approvedScriptPaths) writeStockScriptFixture(root, relative, slug);
    writeFixture(root, `public/reference/${slug}/styles/store-reference.css`, themeFixtureResource("store-reference.css"));
    writeFixture(root, `public/reference/${slug}/images/logo-icon.svg`, themeFixtureResource("logo-icon.svg"));
    writeFixture(root, `public/reference/${slug}/navigation.html`, '<nav>Navigation fragment</nav>');
    for (const relative of ["styles/style.css", "styles/main.css", "ui-kit/ui-kit.min.css"])
      writeFixture(root, `public/reference/${slug}/${relative}`, "/* stock fixture */");
    const original = load(readFileSync(join(root, `public/reference/${slug}/index.html`), "utf8"));
    const bodyLinks = original("body").html();
    const depths = slug === "store6-core" ? ["", "symbols/"] : [""];
    for (const directory of depths) {
      const prefix = directory ? "../" : "";
      writeFixture(root, `public/reference/${slug}/${directory}index.html`, `<!doctype html><html><head>
<title>${slug}</title>
<link rel="icon" href="${prefix}images/logo-icon.svg">
${["styles/style.css", "styles/main.css", "ui-kit/ui-kit.min.css", "styles/store-reference.css"].map(asset => `<link rel="stylesheet" href="${prefix}${asset}">`).join("")}
${approvedScriptPaths.map(asset => `<script src="${prefix}${asset}"></script>`).join("")}
</head><body><header id="navigation-wrapper" role="banner">
<a class="library-name--link" href="${prefix}index.html">${slug}</a>
<button id="toc-toggle" type="button">Toggle table of contents</button>
<div class="navigation-controls"><ul id="filter-section" aria-label="Target filter">
<button class="platform-selector" data-filter=":${slug}/commonMain" aria-pressed="true">common</button>
<button role="combobox" aria-controls="platform-tags-listbox" aria-haspopup="listbox" aria-label="Toggle source sets"></button>
<ul id="platform-tags-listbox" role="listbox"><input type="checkbox" data-filter=":${slug}/commonMain"></ul></ul>
<a id="homepage-link" href="/docs/store6/overview" aria-label="Store 6 guide">Store guide</a>
<button id="theme-toggle-button" type="button">Switch theme</button><div id="searchBar" role="button">Search in API</div>
</div></header><nav id="leftColumn"><ul id="toc-listbox" role="listbox"><div id="sideMenu"></div></ul></nav>
<div id="main" role="main"><div class="breadcrumbs"></div>${bodyLinks}</div>
<div class="footer--content">Store 6 API reference</div></body></html>`);
    }
  }
}
