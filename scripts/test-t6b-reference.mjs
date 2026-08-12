import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { lstat, readFile, readdir, realpath } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { load } from "cheerio";

const defaultRepoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const canonicalSiteOrigin = "https://store.mobilenativefoundation.org";
const localReferenceOrigin = "https://reference.invalid";
const stockKotlinPlaygroundScript =
  "https://unpkg.com/kotlin-playground@1/dist/playground.min.js";
const approvedStockDokkaScriptSha256 = Object.freeze({
  "store6-core/scripts/main.js": "f67b38f8e9805d566f137a37a95e2622aa7eb018ae24ddafdf3c7e05f9eed84e",
  "store6-core/scripts/navigation-loader.js": "10880a206be17a3f5f2bb61af7fb2c83ba2ef1939477870badb08e02c3062868",
  "store6-core/scripts/platform-content-handler.js": "62da13cd4807ecc5ff9b18cb9f5dbb7cb3c0f7f8681cf1651ff0a96b135cb987",
  "store6-core/scripts/prism.js": "73995d49b765f3938d508a956eba6f74fead5133b78c2a351f6da226c8b93290",
  "store6-core/scripts/safe-local-storage_blocking.js": "259d21ed2a2d01a0cb5ae9fb1fcc4ec0851c8950e19994f29aeb745b03bad294",
  "store6-core/scripts/sourceset_dependencies.js": "1497ac56f2356ee91c594b05bd69ffdce2cecb3bf799e674e8845ee314d84eb7",
  "store6-core/ui-kit/ui-kit.min.js": "850086e62c237c4137fb8cbda71662c3dabe886b4507cd862164bfe69103c914",
  "store6-mutations/scripts/main.js": "f67b38f8e9805d566f137a37a95e2622aa7eb018ae24ddafdf3c7e05f9eed84e",
  "store6-mutations/scripts/navigation-loader.js": "10880a206be17a3f5f2bb61af7fb2c83ba2ef1939477870badb08e02c3062868",
  "store6-mutations/scripts/platform-content-handler.js": "62da13cd4807ecc5ff9b18cb9f5dbb7cb3c0f7f8681cf1651ff0a96b135cb987",
  "store6-mutations/scripts/prism.js": "73995d49b765f3938d508a956eba6f74fead5133b78c2a351f6da226c8b93290",
  "store6-mutations/scripts/safe-local-storage_blocking.js": "259d21ed2a2d01a0cb5ae9fb1fcc4ec0851c8950e19994f29aeb745b03bad294",
  "store6-mutations/scripts/sourceset_dependencies.js": "864bcd3553260fe03a10bcc38b656464c81e7e89d8b53a6206698fe0663e27ae",
  "store6-mutations/ui-kit/ui-kit.min.js": "850086e62c237c4137fb8cbda71662c3dabe886b4507cd862164bfe69103c914",
});
const approvedDokkaScriptPaths = new Set(
  Object.keys(approvedStockDokkaScriptSha256).map((key) => key.slice(key.indexOf("/") + 1)),
);
const approvedDokkaScriptBasenames = new Set(
  [...approvedDokkaScriptPaths].map((scriptPath) => path.posix.basename(scriptPath)),
);
const moduleContracts = [
  {
    siblingHref: "/reference/store6-mutations/index.html",
    slug: "store6-core",
  },
  {
    siblingHref: "/reference/store6-core/index.html",
    slug: "store6-mutations",
  },
];
const internalTrackerPattern = new RegExp(
  `\\b(?:${["ST", "ORE"].join("")}-\\d+|${["T", "6"].join("")}[ab]?|${[
    "Lin",
    "ear",
  ].join("")})\\b`,
);
const durablePublicSurfacePatterns = [
  internalTrackerPattern,
  /\b(?:TD|FS|RISK|RD)-\d+\b/,
  /\bD\d+\s*=\s*[A-Za-z]\b/,
  /docs\/v6\//,
  /\bIssue 0\d\d\b/,
];
const localPrivateFilesystemPathPattern =
  /(?:\/(?:Users|private|tmp)\/|[A-Za-z]:[\\/]+Users[\\/]+|file:\/\/)/i;
const executableAssetExtensionPattern =
  /\.(?:js|mjs|cjs|jsx|ts|tsx|wasm|sh|bash|zsh|fish|command|bat|cmd|ps1|py|pyc|rb|pl|php|cgi|exe|com|dll|dylib|so|jar|class|dex|apk|ipa|app)$/i;
const strictUtf8Decoder = new TextDecoder("utf-8", { fatal: true });
const placeholderReferencePattern =
  /API Reference Unavailable|This page is not generated API documentation|Generated API documentation is currently unavailable|replace its placeholder directory/i;
const inlineDokkaBootstraps = [
  /^\s*document\s*\.\s*documentElement\s*\.\s*classList\s*\.\s*replace\s*\(\s*"no-js"\s*,\s*"js"\s*\)\s*;?\s*$/,
  /^\s*var\s+pathToRoot\s*=\s*"(?:\.\.\/)*"\s*;?\s*$/,
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
const normalizedStockInlineDokkaScripts = new Set([
  normalizeInlineScript(stockDokkaDarkModeBootstrap),
  normalizeInlineScript(stockDokkaV2DarkModeBootstrap),
]);

export async function verifyReferenceTree({ root = defaultRepoRoot } = {}) {
  const repoRoot = path.resolve(root);
  const repoRootReal = await realpath(repoRoot);
  const publicRoot = path.join(repoRoot, "public");
  const publicRootReal = await assertOwnedDirectory({
    containmentRoot: repoRootReal,
    repoRoot,
    target: publicRoot,
  });
  const referenceRoot = path.join(publicRoot, "reference");
  const referenceRootReal = await assertOwnedDirectory({
    containmentRoot: publicRootReal,
    repoRoot,
    target: referenceRoot,
  });
  let htmlFilesChecked = 0;
  let referenceFiles = 0;
  let scriptsChecked = 0;

  for (const contract of moduleContracts) {
    const moduleRoot = path.join(referenceRoot, contract.slug);
    const moduleRootReal = await assertOwnedDirectory({
      containmentRoot: referenceRootReal,
      repoRoot,
      target: moduleRoot,
    });
    await assertOwnedRegularFile({
      containmentRoot: moduleRootReal,
      repoRoot,
      target: path.join(moduleRoot, "index.html"),
    });
    const files = await collectModuleFiles(moduleRoot, repoRoot);
    referenceFiles += files.length;

    const entrypoint = files.find(({ relative }) => relative === "index.html");
    assert.notEqual(
      entrypoint,
      undefined,
      `public/reference/${contract.slug}/index.html must be an existing regular file`,
    );

    let entrypointDetails;
    for (const file of files.filter(({ relative }) => relative.endsWith(".html"))) {
      const details = await verifyHtmlFile({
        absoluteFile: file.absolute,
        moduleRoot,
        moduleRootReal,
        moduleSlug: contract.slug,
        relativeFile: file.relative,
        repoRoot,
      });
      htmlFilesChecked += 1;
      scriptsChecked += details.scriptsChecked;
      if (file.relative === "index.html") entrypointDetails = details;
    }

    for (const file of files) {
      await verifyGeneratedAsset({ file, moduleSlug: contract.slug, repoRoot });
    }

    assert.notEqual(entrypointDetails, undefined, `${contract.slug}/index.html must be HTML`);
    verifyEntrypoint({ contract, details: entrypointDetails });
  }

  await verifyIntegrationInvariants(repoRoot);

  return {
    htmlFilesChecked,
    moduleRootsChecked: moduleContracts.length,
    referenceFiles,
    scriptsChecked,
  };
}

async function assertOwnedDirectory({ containmentRoot, repoRoot, target }) {
  const label = toRepoRelative(repoRoot, target);
  const metadata = await lstatOrNull(target);
  assert.notEqual(metadata, null, `${label} must be an existing directory`);
  assert.equal(metadata.isSymbolicLink(), false, `${label} must not be a symlink`);
  assert.equal(metadata.isDirectory(), true, `${label} must be a directory`);
  const resolved = await realpath(target);
  assertRealpathContained(containmentRoot, resolved, label);
  return resolved;
}

async function assertOwnedRegularFile({ containmentRoot, repoRoot, target }) {
  const label = toRepoRelative(repoRoot, target);
  const metadata = await lstatOrNull(target);
  assert.notEqual(metadata, null, `${label} must be an existing regular file`);
  assert.equal(metadata.isSymbolicLink(), false, `${label} must not be a symlink`);
  assert.equal(metadata.isFile(), true, `${label} must be a regular file`);
  const resolved = await realpath(target);
  assertRealpathContained(containmentRoot, resolved, label);
  return resolved;
}

async function collectModuleFiles(moduleRoot, repoRoot) {
  const files = [];

  async function walk(directory, relativeDirectory = "") {
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort(({ name: left }, { name: right }) => left.localeCompare(right));

    for (const entry of entries) {
      const relative = path.posix.join(relativeDirectory, entry.name);
      const absolute = path.join(directory, entry.name);
      const label = toRepoRelative(repoRoot, absolute);
      const metadata = await lstat(absolute);

      assert.equal(metadata.isSymbolicLink(), false, `${label} must not be a symlink`);
      if (metadata.isDirectory()) {
        await walk(absolute, relative);
        continue;
      }

      assert.equal(metadata.isFile(), true, `${label} must be a regular file`);
      files.push({ absolute, mode: metadata.mode, relative });
    }
  }

  await walk(moduleRoot);
  return files;
}

async function verifyGeneratedAsset({ file, moduleSlug, repoRoot }) {
  const label = toRepoRelative(repoRoot, file.absolute);
  const bytes = await readFile(file.absolute);
  assert.equal((file.mode & 0o111) === 0, true, `unexpected executable asset ${label}`);
  if (file.relative.endsWith(".js")) {
    verifyStockDokkaScript({ bytes, label, moduleSlug, relativePath: file.relative });
  } else {
    assert.equal(
      executableAssetExtensionPattern.test(file.relative),
      false,
      `unexpected executable asset ${label}`,
    );
  }

  let source;
  try {
    source = strictUtf8Decoder.decode(bytes);
  } catch {
    return;
  }

  assert.equal(
    /\bdata-unresolved-link\b/i.test(source),
    false,
    `data-unresolved-link found in generated text asset ${label}`,
  );
  assert.equal(
    placeholderReferencePattern.test(source),
    false,
    `placeholder reference notice found in generated text asset ${label}`,
  );
  for (const pattern of durablePublicSurfacePatterns) {
    assert.equal(
      pattern.test(source),
      false,
      `durable public-surface token ${pattern.source} found in ${label}`,
    );
  }
  assert.equal(
    localPrivateFilesystemPathPattern.test(source),
    false,
    `local or private filesystem path found in ${label}`,
  );
}

function verifyStockDokkaScript({ bytes, label, moduleSlug, relativePath }) {
  const expectedSha256 = approvedStockDokkaScriptSha256[`${moduleSlug}/${relativePath}`];
  assert.notEqual(expectedSha256, undefined, `unexpected executable asset ${label}`);
  const actualSha256 = createHash("sha256").update(bytes).digest("hex");
  assert.equal(
    actualSha256,
    expectedSha256,
    `stock Dokka script integrity mismatch in ${label}`,
  );
}

async function verifyHtmlFile({
  absoluteFile,
  moduleRoot,
  moduleRootReal,
  moduleSlug,
  relativeFile,
  repoRoot,
}) {
  const label = toRepoRelative(repoRoot, absoluteFile);
  const html = await readFile(absoluteFile, "utf8");
  const $ = load(html);

  assert.equal(
    /\bdata-unresolved-link\b/i.test(html),
    false,
    `data-unresolved-link found in ${label}`,
  );
  assert.equal(
    placeholderReferencePattern.test(html),
    false,
    `placeholder reference notice found in ${label}`,
  );
  assert.equal(
    internalTrackerPattern.test(html),
    false,
    `internal tracker vocabulary found in ${label}`,
  );
  assert.equal($("base").length, 0, `base element is not allowed in ${label}`);

  for (const element of $("*").toArray()) {
    for (const [attribute, value] of Object.entries(element.attribs ?? {})) {
      if (!/^on[a-z]/i.test(attribute)) continue;
      assert.equal(
        isApprovedDokkaEventHandler({ attribute, element, moduleSlug, relativeFile, value }),
        true,
        `inline event handler ${attribute} found in ${label}`,
      );
    }
  }

  const localAnchorPaths = new Set();
  for (const element of $("a[href]").toArray()) {
    const href = $(element).attr("href");
    const localPath = await verifyAnchor({
      href,
      label,
      moduleRoot,
      moduleRootReal,
      moduleSlug,
      relativeFile,
    });
    if (localPath !== null) localAnchorPaths.add(localPath);
  }

  const scripts = $("script").toArray();
  for (const element of scripts) {
    await verifyScript({
      $,
      element,
      label,
      moduleRoot,
      moduleRootReal,
      moduleSlug,
      relativeFile,
    });
  }

  return {
    localAnchorPaths,
    scriptsChecked: scripts.length,
    title: $("title").first().text().replace(/\s+/g, " ").trim(),
  };
}

function isApprovedDokkaEventHandler({ attribute, element, moduleSlug, relativeFile, value }) {
  if (attribute !== "onclick" || element.tagName !== "button" || relativeFile !== "navigation.html") {
    return false;
  }
  const prefix = `window.handleTocButtonClick(event, '${moduleSlug}-nav-submenu`;
  if (!value.startsWith(prefix) || !value.endsWith("')")) return false;
  const suffix = value.slice(prefix.length, -2);
  return suffix === "" || /^(?:-\d+)+$/.test(suffix);
}

function verifyEntrypoint({ contract, details }) {
  const label = `public/reference/${contract.slug}/index.html`;
  assert.notEqual(details.title, "", `${label} title must be nonempty`);
  assert.equal(
    normalizeModuleName(details.title).includes(normalizeModuleName(contract.slug)),
    true,
    `${label} title must identify ${contract.slug}`,
  );

  for (const requiredHref of [contract.siblingHref, "/docs", "/docs/store6/overview"]) {
    assert.equal(
      details.localAnchorPaths.has(requiredHref),
      true,
      `${label} must contain required link ${requiredHref}`,
    );
  }
}

async function verifyAnchor({
  href,
  label,
  moduleRoot,
  moduleRootReal,
  moduleSlug,
  relativeFile,
}) {
  const source = href.trim();
  if (source.startsWith("#")) return null;

  if (source.startsWith("//") || source.includes("\\")) {
    assert.fail(`unsafe anchor href ${JSON.stringify(href)} in ${label}`);
  }

  if (hasExplicitScheme(source)) {
    const target = parseUrl(source, `unsafe anchor href ${JSON.stringify(href)} in ${label}`);
    assert.equal(
      target.protocol,
      "https:",
      `unsafe anchor href ${JSON.stringify(href)} in ${label}; external anchors require https:`,
    );
    if (target.origin === canonicalSiteOrigin) {
      assert.equal(
        target.username === "" && target.password === "",
        true,
        `unsafe anchor href ${JSON.stringify(href)} in ${label}`,
      );
      const pathname = decodedNormalizedPathname(
        target.pathname,
        `unsafe anchor href ${JSON.stringify(href)} in ${label}`,
      );
      assert.equal(
        pathname,
        target.pathname,
        `unsafe anchor href ${JSON.stringify(href)} in ${label}`,
      );
      assert.equal(
        isAllowedSitePath(pathname),
        true,
        `unsafe anchor href ${JSON.stringify(href)} in ${label}`,
      );
      return pathname;
    }
    return null;
  }

  if (source.startsWith("/")) {
    const target = parseUrl(
      source,
      `unsafe anchor href ${JSON.stringify(href)} in ${label}`,
      `${localReferenceOrigin}/`,
    );
    const pathname = decodedNormalizedPathname(
      target.pathname,
      `unsafe anchor href ${JSON.stringify(href)} in ${label}`,
    );
    assert.equal(
      pathname,
      target.pathname,
      `unsafe anchor href ${JSON.stringify(href)} in ${label}`,
    );
    assert.equal(
      isAllowedSitePath(pathname),
      true,
      `unsafe anchor href ${JSON.stringify(href)} in ${label}`,
    );
    return pathname;
  }

  const target = await resolveRelativeTarget({
    href: source,
    kind: "relative anchor",
    label,
    moduleRoot,
    moduleRootReal,
    moduleSlug,
    relativeFile,
  });
  if (target.metadata.isDirectory()) {
    const indexFile = path.join(target.absolute, "index.html");
    const indexMetadata = await lstatOrNull(indexFile);
    assert.notEqual(
      indexMetadata,
      null,
      `relative anchor directory target is missing index.html for ${JSON.stringify(href)} in ${label}`,
    );
    assert.equal(
      indexMetadata.isSymbolicLink(),
      false,
      `relative anchor directory index must not be a symlink for ${JSON.stringify(href)} in ${label}`,
    );
    assert.equal(
      indexMetadata.isFile(),
      true,
      `relative anchor directory index must be a regular file for ${JSON.stringify(href)} in ${label}`,
    );
  } else {
    assert.equal(
      target.metadata.isFile(),
      true,
      `relative anchor target must be a regular file for ${JSON.stringify(href)} in ${label}`,
    );
  }
  return target.pathname;
}

async function verifyScript({
  $,
  element,
  label,
  moduleRoot,
  moduleRootReal,
  moduleSlug,
  relativeFile,
}) {
  const sourceAttribute = $(element).attr("src");
  const body = $(element).html() ?? "";

  if (sourceAttribute === undefined) {
    assert.equal(
      inlineDokkaBootstraps.some((pattern) => pattern.test(body)) ||
        normalizedStockInlineDokkaScripts.has(normalizeInlineScript(body)),
      true,
      `inline script in ${label} is not an approved Dokka bootstrap`,
    );
    return;
  }

  assert.equal(
    body.trim(),
    "",
    `script with src ${JSON.stringify(sourceAttribute)} in ${label} must not have inline content`,
  );
  const source = sourceAttribute.trim();
  if (hasExplicitScheme(source) || source.startsWith("//")) {
    assert.equal(
      source,
      stockKotlinPlaygroundScript,
      `external script ${JSON.stringify(sourceAttribute)} in ${label} is not approved`,
    );
    return;
  }

  assert.equal(
    source.startsWith("/") || source.includes("\\"),
    false,
    `local script ${JSON.stringify(sourceAttribute)} in ${label} must use a relative source`,
  );
  const target = await resolveRelativeTarget({
    href: source,
    kind: "local script",
    label,
    moduleRoot,
    moduleRootReal,
    moduleSlug,
    relativeFile,
  });
  assert.equal(
    target.metadata.isFile(),
    true,
    `local script ${JSON.stringify(sourceAttribute)} in ${label} must resolve to a regular file`,
  );
  const basename = path.posix.basename(target.pathname);
  assert.equal(
    basename.endsWith(".js") && approvedDokkaScriptBasenames.has(basename),
    true,
    `local script basename ${JSON.stringify(basename)} in ${label} is not approved`,
  );
  const moduleRelativePath = target.pathname.slice(`/reference/${moduleSlug}/`.length);
  assert.equal(
    approvedDokkaScriptPaths.has(moduleRelativePath),
    true,
    `local script must resolve to an approved canonical module script path in ${label}`,
  );
  verifyStockDokkaScript({
    bytes: await readFile(target.absolute),
    label: `public/reference/${moduleSlug}/${moduleRelativePath}`,
    moduleSlug,
    relativePath: moduleRelativePath,
  });
}

async function resolveRelativeTarget({
  href,
  kind,
  label,
  moduleRoot,
  moduleRootReal,
  moduleSlug,
  relativeFile,
}) {
  const pageUrl = new URL(`${localReferenceOrigin}/`);
  pageUrl.pathname = `/reference/${moduleSlug}/${relativeFile}`;
  const target = parseUrl(href, `unsafe ${kind} ${JSON.stringify(href)} in ${label}`, pageUrl);
  assert.equal(
    target.origin,
    localReferenceOrigin,
    `unsafe ${kind} ${JSON.stringify(href)} in ${label}`,
  );

  const pathname = decodedNormalizedPathname(
    target.pathname,
    `unsafe ${kind} ${JSON.stringify(href)} in ${label}`,
  );
  const moduleUrlRoot = `/reference/${moduleSlug}`;
  assert.equal(
    pathname === moduleUrlRoot || pathname.startsWith(`${moduleUrlRoot}/`),
    true,
    `${kind} escapes ${moduleSlug}: ${JSON.stringify(href)} in ${label}`,
  );

  const relativeTarget = pathname.slice(moduleUrlRoot.length).replace(/^\/+/, "");
  const absolute = path.resolve(moduleRoot, ...relativeTarget.split("/").filter(Boolean));
  const filesystemRelative = path.relative(moduleRoot, absolute);
  assert.equal(
    filesystemRelative === ".." ||
      filesystemRelative.startsWith(`..${path.sep}`) ||
      path.isAbsolute(filesystemRelative),
    false,
    `${kind} escapes ${moduleSlug}: ${JSON.stringify(href)} in ${label}`,
  );

  const metadata = await lstatOrNull(absolute);
  assert.notEqual(
    metadata,
    null,
    `${kind} target is missing for ${JSON.stringify(href)} in ${label}`,
  );
  assert.equal(
    metadata.isSymbolicLink(),
    false,
    `${kind} target must not be a symlink for ${JSON.stringify(href)} in ${label}`,
  );
  const resolved = await realpath(absolute);
  assertRealpathContained(moduleRootReal, resolved, `${kind} target ${JSON.stringify(href)}`);
  return { absolute, metadata, pathname };
}

function normalizeInlineScript(source) {
  return source
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");
}

function decodedNormalizedPathname(pathname, failureMessage) {
  let decoded = pathname;
  for (let pass = 0; pass < 5; pass += 1) {
    let next;
    try {
      next = decodeURIComponent(decoded);
    } catch {
      assert.fail(failureMessage);
    }
    if (next === decoded) {
      assert.equal(decoded.includes("\0"), false, failureMessage);
      return path.posix.normalize(decoded);
    }
    decoded = next;
  }
  assert.fail(failureMessage);
}

function isAllowedSitePath(pathname) {
  if (pathname === "/docs" || pathname.startsWith("/docs/")) return true;
  return moduleContracts.some(({ slug }) => {
    const root = `/reference/${slug}`;
    return pathname === root || pathname.startsWith(`${root}/`);
  });
}

function hasExplicitScheme(value) {
  return /^[a-z][a-z\d+.-]*:/i.test(value);
}

function parseUrl(value, failureMessage, base) {
  try {
    return base === undefined ? new URL(value) : new URL(value, base);
  } catch {
    assert.fail(failureMessage);
  }
}

function normalizeModuleName(value) {
  return value
    .normalize("NFKD")
    .replace(/\p{Mark}/gu, "")
    .toLowerCase()
    .replace(/[^a-z\d]+/g, "");
}

function assertRealpathContained(containmentRoot, target, label) {
  const relative = path.relative(containmentRoot, target);
  assert.equal(
    relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative),
    false,
    `${label} realpath must remain within ${containmentRoot}`,
  );
}

async function verifyIntegrationInvariants(repoRoot) {
  const navSource = await readFile(path.join(repoRoot, "lib", "nav.ts"), "utf8");
  assert.match(
    navSource,
    /href:\s*["']\/reference\/store6-core\/index\.html["'],\s*label:\s*["']Reference["']/,
    "lib/nav.ts must retain the Reference href",
  );

  for (const relativePath of [
    "public/reference/index.html",
    "app/reference",
    "app/reference-note",
  ]) {
    const target = path.join(repoRoot, ...relativePath.split("/"));
    assert.equal(
      await lstatOrNull(target),
      null,
      `forbidden shadow route must remain absent: ${relativePath}`,
    );
  }

  const nextConfig = await readFile(path.join(repoRoot, "next.config.mjs"), "utf8");
  assert.equal(
    /\bredirects\s*(?:\(|:)/.test(nextConfig),
    false,
    "reference integration must not add a redirect",
  );
}

async function lstatOrNull(target) {
  try {
    return await lstat(target);
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

function toRepoRelative(repoRoot, target) {
  return path.relative(repoRoot, target).split(path.sep).join("/");
}

const invokedPath = process.argv[1] === undefined ? null : path.resolve(process.argv[1]);
if (invokedPath === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(await verifyReferenceTree()));
}
