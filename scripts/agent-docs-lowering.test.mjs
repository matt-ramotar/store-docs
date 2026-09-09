import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { fromMarkdown } from 'mdast-util-from-markdown';
import { gfm } from 'micromark-extension-gfm';
import { gfmFromMarkdown, gfmToMarkdown } from 'mdast-util-gfm';
import { toMarkdown } from 'mdast-util-to-markdown';

import { lowerMdx } from './agent-docs/lower-mdx.mjs';
import { parsePage } from './agent-docs/parse.mjs';
import { semanticContext } from './agent-docs/semantic-context.mjs';

const fixturePath = 'scripts/agent-docs/fixtures/fidelity.mdx';
const codeSlabPages = [
  {
    path: 'content/docs/store6/overview.mdx',
    expected: {
      lang: 'kotlin',
      title: 'Fetcher-only Store',
      value: 'val users = store<UserKey, User> {\n  fetcher { key -> FakeApi.getUser(key.id) }\n}',
    },
  },
  {
    path: 'content/docs/store6/concepts/freshness.mdx',
    expected: {
      lang: 'kotlin',
      title: 'Per-call freshness',
      value: 'val profile = users.get(UserKey("1"), Freshness.MaxAge(5.minutes))\n\nusers.stream(UserKey("1"), Freshness.LocalOnly).collect { result ->\n  render(result)\n}',
    },
  },
];

const expectedOrigins = [
  ['Origin.MEMORY', 'Resident replay', 'The collector receives a value already resident in this engine.'],
  ['Origin.SOT', 'Source of truth', 'A source-of-truth read or write supplied the confirmed value.'],
  ['Origin.FETCHER', 'Fetcher', 'The configured fetcher produced or revalidated the authoritative value.'],
  ['Origin.OVERLAY', 'Stream projection', 'An overlay projected over confirmed residence or confirmed absence for streams.'],
];

const expectedModules = [
  ['store6-core', 'Stable track', 'alpha01', 'Canonical 12', 'The API is not frozen until the beta01 freeze candidate.'],
  ['store6-testing', 'Experimental', 'alpha01', 'Canonical 12', ''],
  ['store6-mutations', 'Experimental', 'alpha01', 'Canonical 12', ''],
  ['store6-compose', 'Experimental', 'alpha01, may slip one alpha', 'Canonical 12', ''],
  ['store6-sqldelight', 'Experimental', 'alpha01, may slip one alpha', 'Canonical 12 artifacts. Drivers run on Android, JVM, Apple, Linux, and Windows. JS and Wasm are compile-only.', ''],
  ['store6-room', 'Experimental', 'alpha01, may slip one alpha', 'Android, JVM, iosArm64, iosSimulatorArm64, macosArm64, watchosArm64, tvosArm64, and linuxX64.', ''],
  ['store6-devtools', 'Experimental', 'alpha02 (target)', 'Canonical 12', ''],
  ['store6-devtools-inspector', 'Experimental', 'alpha02 (target)', 'Inspector 8', ''],
];

const expectedStartEntries = [
  ['Build your first store', 'Build a fetcher-backed Store and make the first read.', [['Quickstart', '/docs/store6/quickstart']]],
  ['Important Defaults', 'See the freshness and failure behavior you get with zero configuration.', [['Important Defaults', '/docs/store6/important-defaults']]],
  ['Read contract', 'Choose stream or point reads and interpret origins and lifecycle state.', [['Read contract', '/docs/store6/concepts/read-contract']]],
  ['Fetchers and persistence', 'Add the two seams most applications need after the first store.', [['Fetchers', '/docs/store6/guides/fetchers'], ['Persistence', '/docs/store6/guides/persistence']]],
  ['Mutations (Experimental)', 'Adopt the journalled write path and its acknowledgement contract.', [['Mutations', '/docs/store6/mutations']]],
  ['Migrate from Store 5', 'Move one Store 5 screen at a time while both major lines coexist.', [['Migration guide', '/docs/store6/migration/from-store5']]],
];

const expectedNotice = "With Store 6's default freshness validator, wall-clock age alone never makes Freshness.CachedOrFetch fetch. It fetches when no resident value exists, freshness metadata is missing, the resident is invalidated, or durable status marks it stale. Use Freshness.MaxAge when elapsed age should participate. A custom FreshnessValidator may plan differently, and Freshness.MustBeFresh follows different serving and failure rules.";
const expectedReadParagraphs = [
  "With Store 6's default freshness validator and Freshness.CachedOrFetch, the first cold stream after restart serves a durably invalidated persisted row as Data(origin=Origin.SOT, isStale=true, refreshing=true). If its refresh fails, the stream emits Error(StoreError.Fetch, servedStale=true) without an intervening Loading, and the stream stays live.",
  'Bookkeeper.recordFailure completes before that fetch error is emitted. Hydrated resident metadata does not reuse the persisted ETag, so a fetch planned from that state sees etag=null. After the first hydrated emission, a later resident emission may use Origin.MEMORY.',
  'Read the read contract for the complete stream and point-read semantics. Use the freshness policies to choose when a fetch participates.',
];

const walk = function* (node) {
  yield node;
  for (const child of node.children ?? []) yield* walk(child);
};
const textOf = node => typeof node.value === 'string'
  ? node.value
  : (node.children ?? []).map(textOf).join('');
const linksOf = node => [...walk(node)]
  .filter(candidate => candidate.type === 'link')
  .map(link => [textOf(link), link.url]);
const tableValues = table => table.children.slice(1).map(row => row.children.map(textOf));
const codePairs = tree => [...walk(tree)]
  .filter(node => node.type === 'code')
  .map(node => ({ lang: node.lang ?? null, value: node.value }));
const ordinaryGfm = markdown => fromMarkdown(markdown, {
  extensions: [gfm()],
  mdastExtensions: [gfmFromMarkdown()],
});
const serialize = tree => toMarkdown(tree, { extensions: [gfmToMarkdown()], fences: true });

async function parsed(path) {
  return parsePage(await readFile(path, 'utf8'), path).tree;
}

async function fixtureTree() {
  const [source, diagram] = await Promise.all([
    readFile(fixturePath, 'utf8'),
    readFile('public/diagrams/alias-activation.html', 'utf8'),
  ]);
  return lowerMdx(parsePage(source, fixturePath).tree, semanticContext([['alias-activation', diagram]]));
}

test('the fidelity fixture lowers literal content without executing MDX', async () => {
  const tree = await fixtureTree();
  const markdown = serialize(tree);
  const reparsed = ordinaryGfm(markdown);

  assert.deepEqual(codePairs(reparsed).slice(0, 3), [
    { lang: 'kotlin', value: 'val users: Store<UserKey, User> = users\nprintln("Name=${user.name}")' },
    { lang: 'kotlin', value: 'val nested = "callout fence"' },
    { lang: 'kotlin', value: 'val sql = `SELECT ${column}`\nprintln("$price")' },
  ]);
  const callout = [...walk(tree)].find(node => node.type === 'blockquote' && textOf(node.children[0]) === 'Warning: Keep every detail');
  assert.ok(callout);
  assert.deepEqual(callout.children.map(node => node.type), ['paragraph', 'paragraph', 'list', 'code']);
  assert.equal(textOf(callout.children[1]), 'This body survives lowering.');
  assert.deepEqual(callout.children[2].children.map(textOf), ['First callout item', 'Second callout item with inlineCode']);
  assert.deepEqual({ lang: callout.children[3].lang, value: callout.children[3].value }, { lang: 'kotlin', value: 'val nested = "callout fence"' });
  assert.match(markdown, /<a id="fidelity-anchor"><\/a>/);
  assert.match(markdown, /Static text from expression\./);
  assert.doesNotMatch(markdown, /fixture comment/);
  assert.equal(tree.children.some(node => node.type === 'paragraph' && textOf(node) === 'Escaped template characters'), true);
  assert.deepEqual(linksOf(tree).find(([label]) => label === 'quickstart'), ['quickstart', '/docs/store6/quickstart']);
});

test('semantic components retain the independently frozen human-facing content', async () => {
  const tree = await fixtureTree();
  const tables = [...walk(tree)].filter(node => node.type === 'table');
  assert.deepEqual(tables[0].children[0].children.map(textOf), ['Origin', 'Resolution boundary', 'Meaning']);
  assert.deepEqual(tableValues(tables[0]), expectedOrigins);
  assert.deepEqual(tables[1].children[0].children.map(textOf), ['Module', 'API tier', 'Release target', 'Targets', 'Notes']);
  assert.deepEqual(tableValues(tables[1]), expectedModules);

  const notice = [...walk(tree)].find(node => node.type === 'blockquote' && textOf(node.children[0]) === 'Info: Important default');
  assert.ok(notice);
  assert.equal(textOf(notice.children[1]), expectedNotice);
  const noticeIndex = tree.children.indexOf(notice);
  assert.deepEqual(tree.children.slice(noticeIndex + 1, noticeIndex + 4).map(textOf), expectedReadParagraphs);
  assert.deepEqual(linksOf(tree.children[noticeIndex + 3]), [
    ['read contract', '/docs/store6/concepts/read-contract'],
    ['freshness policies', '/docs/store6/concepts/freshness'],
  ]);

  const startList = [...walk(tree)].find(node => node.type === 'list' && node.children.length === 6);
  assert.ok(startList);
  assert.deepEqual(startList.children.map(item => [
    textOf(item.children[0]),
    textOf(item.children[1]),
    linksOf(item.children[2]),
  ]), expectedStartEntries);

  assert.equal(textOf(tree).includes('Canonical 12: Android, JVM, iosArm64, iosSimulatorArm64, iosX64, macosArm64, watchosArm64, tvosArm64, JS, WasmJS, linuxX64, and mingwX64.'), true);
  assert.equal(textOf(tree).includes('Inspector 8: Android, JVM, iosArm64, iosSimulatorArm64, iosX64, macosArm64, JS, and WasmJS.'), true);
  assert.deepEqual(linksOf(tree).filter(([, href]) => href === '/docs/store6/stability' || href === '/docs/store6/concepts/api-tiers' || href === '/reference/store6-core/index.html'), [
    ['Stability', '/docs/store6/stability'],
    ['API tiers', '/docs/store6/concepts/api-tiers'],
    ['store6-core API reference', '/reference/store6-core/index.html'],
  ]);
  const supportTableIndex = tree.children.indexOf(tables[1]);
  assert.equal(textOf(tree.children[supportTableIndex - 1]), 'Read the Stability policy and API tiers guidance for these classifications.');
  assert.deepEqual(tree.children.slice(supportTableIndex + 1, supportTableIndex + 4).map(textOf), [
    'Canonical 12: Android, JVM, iosArm64, iosSimulatorArm64, iosX64, macosArm64, watchosArm64, tvosArm64, JS, WasmJS, linuxX64, and mingwX64.',
    'Inspector 8: Android, JVM, iosArm64, iosSimulatorArm64, iosX64, macosArm64, JS, and WasmJS.',
    'Browse the store6-core API reference for the core surface.',
  ]);
});

test('both authored CodeSlabs preserve exact cooked values through Markdown round trip', async () => {
  for (const page of codeSlabPages) {
    const lowered = lowerMdx(await parsed(page.path), semanticContext([]));
    const codeIndex = lowered.children.findIndex(node => node.type === 'code' && node.lang === page.expected.lang && node.value === page.expected.value);
    assert.notEqual(codeIndex, -1, page.path);
    assert.equal(textOf(lowered.children[codeIndex - 1]), page.expected.title, page.path);
    const matches = codePairs(ordinaryGfm(serialize(lowered)))
      .filter(pair => pair.lang === page.expected.lang && pair.value === page.expected.value);
    assert.deepEqual(matches, [{ lang: page.expected.lang, value: page.expected.value }], page.path);
  }
});

test('StoreDiagram uses the first SVG title, description, and visible labels in order', () => {
  const html = '<svg><title>Alias &amp; activation</title><desc>Registration &lt; activation.</desc><text>First</text><g><text>Duplicate</text><text>Duplicate</text></g></svg><svg><title>Ignored</title><desc>Ignored</desc><text>Ignored</text></svg>';
  const tree = lowerMdx(parsePage('---\ntitle: Diagram\n---\n<StoreDiagram id="alias-activation" />\n', 'diagram.mdx').tree, semanticContext([['alias-activation', html]]));
  assert.deepEqual(tree.children.map(node => node.type), ['paragraph', 'paragraph', 'list', 'paragraph']);
  assert.equal(textOf(tree.children[0]), 'Alias & activation');
  assert.equal(textOf(tree.children[1]), 'Registration < activation.');
  assert.deepEqual(tree.children[2].children.map(textOf), ['First', 'Duplicate', 'Duplicate']);
  assert.deepEqual(linksOf(tree.children[3]), [['Open full-size diagram', '/diagrams/alias-activation.html']]);
});

test('source records lower to neutral wording with known and unknown revisions', () => {
  const known = lowerMdx(parsePage('---\ntitle: Source\n---\n*Last verified: 2026-08-12 · `main` @ `539614c0`, pre-6.0.0-alpha01*\n', 'known.mdx').tree, semanticContext([]));
  assert.equal(textOf(known), 'Source recorded 2026-08-12 · main@539614c0 · pre-6.0.0-alpha01');
  assert.deepEqual(linksOf(known), [['main@539614c0', 'https://github.com/matt-ramotar/Store6/commit/539614c06be1a8f20dead562585e47394551ebae']]);

  const unknown = lowerMdx(parsePage('---\ntitle: Source\n---\n*Last verified: 2026-09-08 · `topic` @ `abcdef0`, draft*\n', 'unknown.mdx').tree, semanticContext([]));
  assert.equal(textOf(unknown), 'Source recorded 2026-09-08 · topic@abcdef0 · draft');
  assert.deepEqual(linksOf(unknown), []);
  assert.equal([...walk(unknown)].some(node => node.type === 'emphasis'), false);
});

test('semantic context rejects unknown, incomplete, and unloaded diagrams', () => {
  assert.throws(() => semanticContext([['not-allowlisted', '<svg><title>T</title><desc>D</desc><text>L</text></svg>']]), /Unknown Store diagram/);
  assert.throws(() => semanticContext([['alias-activation', '<svg><title>T</title><desc>D</desc></svg>']]), /Incomplete Store diagram/);
  assert.throws(() => semanticContext([]).diagram('alias-activation'), /Unloaded or unknown Store diagram/);
});

const invalidCases = [
  ['unknown component', '<Tabs />', /Unsupported MDX component: Tabs/],
  ['unknown attribute', '<Callout type="Info" mood="loud">Body</Callout>', /Callout: unsupported or duplicate attribute/],
  ['dynamic interpolation', '<CodeSlab code={`hello ${runCode()}`} lang="text" title="Example" />', /dynamic MDX expression is unsupported/],
  ['dynamic body expression', '{runCode()}', /dynamic MDX expression is unsupported/],
  ['spread prop', '<CodeSlab {...props} />', /CodeSlab: unsupported or duplicate attribute/],
  ['ESM import', "import Thing from './thing.js'\n\nBody", /MDX imports and exports are unsupported/],
  ['unsupported HTML element', '<section>Raw HTML</section>', /Unsupported MDX component: section/],
  ['block in inline context', '<p><Callout type="Info">nested</Callout></p>', /Expected inline content, received blockquote/],
  ['block in emphasis context', '**Lead <Callout type="Info">nested</Callout>**', /Expected inline content, received blockquote/],
];

for (const [name, body, expected] of invalidCases) {
  test(`${name} fails closed`, () => {
    const tree = parsePage(`---\ntitle: Invalid\n---\n${body}\n`, `${name}.mdx`).tree;
    assert.throws(() => lowerMdx(tree, semanticContext([])), expected);
  });
}

test('ordinary raw HTML nodes fail closed', () => {
  assert.throws(() => lowerMdx({ type: 'root', children: [{ type: 'html', value: '<i>raw</i>' }] }, semanticContext([])), /Unsupported Markdown node: html/);
});
