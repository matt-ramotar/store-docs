import assert from "node:assert/strict";
import test from "node:test";

const origins = [
  {
    label: "Origin.MEMORY",
    boundary: "Resident replay",
    meaning: "The collector receives a value already resident in this engine.",
    chipClass: "bg-store-origin-memory-soft text-foreground",
    dotClass: "bg-store-origin-memory",
  },
  {
    label: "Origin.SOT",
    boundary: "Source of truth",
    meaning: "A source-of-truth read or write supplied the confirmed value.",
    chipClass: "bg-store-origin-sot-soft text-foreground",
    dotClass: "bg-store-origin-sot",
  },
  {
    label: "Origin.FETCHER",
    boundary: "Fetcher",
    meaning: "The configured fetcher produced or revalidated the authoritative value.",
    chipClass: "bg-store-origin-fetcher-soft text-foreground",
    dotClass: "bg-store-origin-fetcher",
  },
  {
    label: "Origin.OVERLAY",
    boundary: "Stream projection",
    meaning: "An overlay projected over confirmed residence or confirmed absence for streams.",
    chipClass: "bg-store-origin-overlay-soft text-foreground",
    dotClass: "bg-store-origin-overlay",
  },
];

const notice = {
  type: "Info",
  title: "Important default",
  body: [
    "With Store 6's default freshness validator, wall-clock age alone never makes",
    { code: " Freshness.CachedOrFetch" },
    " fetch. It fetches when no resident value exists, freshness metadata is missing, the resident is invalidated, or durable status marks it stale. Use ",
    { code: "Freshness.MaxAge" },
    " when elapsed age should participate. A custom",
    { code: " FreshnessValidator" },
    " may plan differently, and",
    { code: " Freshness.MustBeFresh" },
    " follows different serving and failure rules.",
  ],
};

const paragraphs = [
  [
    "With Store 6's default freshness validator and",
    { code: " Freshness.CachedOrFetch" },
    ", the first cold stream after restart serves a durably invalidated persisted row as",
    { code: " Data(origin=Origin.SOT, isStale=true, refreshing=true)" },
    ". If its refresh fails, the stream emits ",
    { code: "Error(StoreError.Fetch, servedStale=true)" },
    " without an intervening ",
    { code: "Loading" },
    ", and the stream stays live.",
  ],
  [
    { code: "Bookkeeper.recordFailure" },
    " completes before that fetch error is emitted. Hydrated resident metadata does not reuse the persisted ETag, so a fetch planned from that state sees ",
    { code: "etag=null" },
    ". After the first hydrated emission, a later resident emission may use ",
    { code: "Origin.MEMORY" },
    ".",
  ],
  [
    "Read the ",
    { href: "/docs/store6/concepts/read-contract", label: "read contract" },
    " for the complete stream and point-read semantics. Use the ",
    { href: "/docs/store6/concepts/freshness", label: "freshness policies" },
    " to choose when a fetch participates.",
  ],
];

const modules = [
  { module: "store6-core", tier: "Stable track", release: "alpha01", targets: "Canonical 12", detail: "The API is not frozen until the beta01 freeze candidate." },
  { module: "store6-testing", tier: "Experimental", release: "alpha01", targets: "Canonical 12", detail: undefined },
  { module: "store6-mutations", tier: "Experimental", release: "alpha01", targets: "Canonical 12", detail: undefined },
  { module: "store6-compose", tier: "Experimental", release: "alpha01, may slip one alpha", targets: "Canonical 12", detail: undefined },
  { module: "store6-sqldelight", tier: "Experimental", release: "alpha01, may slip one alpha", targets: "Canonical 12 artifacts. Drivers run on Android, JVM, Apple, Linux, and Windows. JS and Wasm are compile-only.", detail: undefined },
  { module: "store6-room", tier: "Experimental", release: "alpha01, may slip one alpha", targets: "Android, JVM, iosArm64, iosSimulatorArm64, macosArm64, watchosArm64, tvosArm64, and linuxX64.", detail: undefined },
  { module: "store6-devtools", tier: "Experimental", release: "alpha02 (target)", targets: "Canonical 12", detail: undefined },
  { module: "store6-devtools-inspector", tier: "Experimental", release: "alpha02 (target)", targets: "Inspector 8", detail: undefined },
];

const canonical = "Canonical 12: Android, JVM, iosArm64, iosSimulatorArm64, iosX64, macosArm64, watchosArm64, tvosArm64, JS, WasmJS, linuxX64, and mingwX64.";
const inspector = "Inspector 8: Android, JVM, iosArm64, iosSimulatorArm64, iosX64, macosArm64, JS, and WasmJS.";
const supportIntro = [
  "Read the ",
  { href: "/docs/store6/stability", label: "Stability" },
  " policy and ",
  { href: "/docs/store6/concepts/api-tiers", label: "API tiers" },
  " guidance for these classifications.",
];
const supportFooter = [
  "Browse the ",
  { href: "/reference/store6-core/index.html", label: "store6-core API reference" },
  " for the core surface.",
];

const starts = [
  { id: "quickstart", title: "Build your first store", description: "Build a fetcher-backed Store and make the first read.", experimental: false, links: [{ href: "/docs/store6/quickstart", label: "Quickstart" }] },
  { id: "important-defaults", title: "Important Defaults", description: "See the freshness and failure behavior you get with zero configuration.", experimental: false, links: [{ href: "/docs/store6/important-defaults", label: "Important Defaults" }] },
  { id: "read-contract", title: "Read contract", description: "Choose stream or point reads and interpret origins and lifecycle state.", experimental: false, links: [{ href: "/docs/store6/concepts/read-contract", label: "Read contract" }] },
  { id: "data-seams", title: "Fetchers and persistence", description: "Add the two seams most applications need after the first store.", experimental: false, links: [{ href: "/docs/store6/guides/fetchers", label: "Fetchers" }, { href: "/docs/store6/guides/persistence", label: "Persistence" }] },
  { id: "mutations", title: "Mutations", description: "Adopt the journalled write path and its acknowledgement contract.", experimental: true, links: [{ href: "/docs/store6/mutations", label: "Mutations" }] },
  { id: "migration", title: "Migrate from Store 5", description: "Move one Store 5 screen at a time while both major lines coexist.", experimental: false, links: [{ href: "/docs/store6/migration/from-store5", label: "Migration guide" }] },
];

const flatten = node => {
  if (node.type === "text" || node.type === "inlineCode") return node.value;
  return (node.children ?? []).map(flatten).join("");
};
const links = nodes => nodes.flatMap(node => [
  ...(node.type === "link" ? [{ url: node.url, label: flatten(node) }] : []),
  ...links(node.children ?? []),
]);
const codes = nodes => nodes.flatMap(node => [
  ...(node.type === "inlineCode" ? [node.value] : []),
  ...codes(node.children ?? []),
]);

test("shared overview models preserve every authored teaching value", async () => {
  const read = await import("../components/overview/content/read-resolution.ts");
  const support = await import("../components/overview/content/support-matrix.ts");
  const start = await import("../components/overview/content/start-here.ts");

  assert.deepEqual(read.readOrigins, origins);
  assert.deepEqual(read.readNotice, notice);
  assert.deepEqual(read.readParagraphs, paragraphs);
  assert.deepEqual(support.supportModules, modules);
  assert.equal(support.canonicalTargets, canonical);
  assert.equal(support.inspectorTargets, inspector);
  assert.deepEqual(support.supportIntro, supportIntro);
  assert.deepEqual(support.supportFooter, supportFooter);
  assert.deepEqual(start.startHereItems, starts);
});

test("ReadResolutionTable semantic adapter emits its full table, notice, and explanation", async () => {
  const { semanticComponent } = await import("./agent-docs/semantic-components.mjs");
  const tree = semanticComponent("ReadResolutionTable");

  assert.deepEqual(tree.map(node => node.type), ["table", "blockquote", "paragraph", "paragraph", "paragraph"]);
  assert.deepEqual(tree[0].align, [null, null, null]);
  assert.deepEqual(tree[0].children.map(row => row.children.map(flatten)), [
    ["Origin", "Resolution boundary", "Meaning"],
    ...origins.map(origin => [origin.label, origin.boundary, origin.meaning]),
  ]);
  assert.deepEqual(tree[1].children.map(node => node.type), ["paragraph", "paragraph"]);
  assert.equal(tree[1].children[0].children[0].type, "strong");
  assert.deepEqual(tree[1].children.map(flatten), ["Info: Important default", flatten({ children: notice.body.map(token => typeof token === "string" ? { type: "text", value: token } : { type: "inlineCode", value: token.code }) })]);
  assert.deepEqual(tree.slice(2).map(flatten), paragraphs.map(tokens => tokens.map(token => typeof token === "string" ? token : "code" in token ? token.code : token.label).join("")));
  assert.deepEqual(codes(tree), origins.map(origin => origin.label).concat(notice.body.filter(token => typeof token !== "string").map(token => token.code), paragraphs.flat().filter(token => typeof token !== "string" && "code" in token).map(token => token.code)));
  assert.deepEqual(links(tree), [
    { url: "/docs/store6/concepts/read-contract", label: "read contract" },
    { url: "/docs/store6/concepts/freshness", label: "freshness policies" },
  ]);
});

test("SupportMatrix semantic adapter emits eight complete rows and both target groups", async () => {
  const { semanticComponent } = await import("./agent-docs/semantic-components.mjs");
  const tree = semanticComponent("SupportMatrix");

  assert.deepEqual(tree.map(node => node.type), ["paragraph", "table", "paragraph", "paragraph", "paragraph"]);
  assert.deepEqual(tree[1].align, [null, null, null, null, null]);
  assert.deepEqual(tree[1].children.map(row => row.children.map(flatten)), [
    ["Module", "API tier", "Release target", "Targets", "Notes"],
    ...modules.map(module => [module.module, module.tier, module.release, module.targets, module.detail ?? ""]),
  ]);
  assert.equal(flatten(tree[0]), supportIntro.map(token => typeof token === "string" ? token : token.label).join(""));
  assert.equal(flatten(tree[2]), canonical);
  assert.equal(flatten(tree[3]), inspector);
  assert.equal(flatten(tree[4]), supportFooter.map(token => typeof token === "string" ? token : token.label).join(""));
  assert.deepEqual(links(tree), [
    { url: "/docs/store6/stability", label: "Stability" },
    { url: "/docs/store6/concepts/api-tiers", label: "API tiers" },
    { url: "/reference/store6-core/index.html", label: "store6-core API reference" },
  ]);
});

test("StartHereList semantic adapter emits all six ordered authored entries", async () => {
  const { semanticComponent } = await import("./agent-docs/semantic-components.mjs");
  const [list] = semanticComponent("StartHereList");

  assert.equal(list.type, "list");
  assert.equal(list.ordered, false);
  assert.equal(list.spread, true);
  assert.ok(list.children.every(item => item.type === "listItem" && item.spread === false));
  assert.ok(list.children.every(item => item.children.length === 3 && item.children.every(node => node.type === "paragraph")));
  assert.deepEqual(list.children.map(item => item.children.map(flatten)), starts.map(item => [
    `${item.title}${item.experimental ? " (Experimental)" : ""}`,
    item.description,
    item.links.map(link => link.label).join(" · "),
  ]));
  assert.deepEqual(links([list]), starts.flatMap(item => item.links.map(link => ({ url: link.href, label: link.label }))));
  assert.throws(() => semanticComponent("Unknown"), /Unsupported semantic component: Unknown/);
});
