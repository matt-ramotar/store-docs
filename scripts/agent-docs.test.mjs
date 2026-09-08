import assert from 'node:assert/strict';
import test from 'node:test';
import { load } from 'cheerio';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { parsePage } from './agent-docs/parse.mjs';
import { literalAttributes, literalString, isCommentExpression } from './agent-docs/literals.mjs';
import { pageIdentity, rewriteAgentLink, rewriteTreeLinks } from './agent-docs/links.mjs';
import { loadFixtureModule } from './mintlify-test-utils.mjs';

const parse = body => parsePage(`---\ntitle: Fixture\n---\n\n${body}\n`, 'fixture.mdx').tree;
test('CodeSlab preserves literal code and language without evaluating expressions', () => {
  const code = 'val users = store<UserKey, User> {\n  fetcher { key -> api.get(key.id) }\n}';
  const [node] = parse(`<CodeSlab code={${JSON.stringify(code)}} lang="kotlin" title="Example" />`).children;
  assert.deepEqual(literalAttributes(node, ['code', 'lang', 'title']), {
    code, lang: 'kotlin', title: 'Example',
  });
});
test('template literals use the cooked string and reject interpolation', () => {
  const [literal] = parse('<CodeSlab code={`one\\ntwo`} lang="text" title="Example" />').children;
  assert.equal(literalAttributes(literal, ['code', 'lang', 'title']).code, 'one\ntwo');
  const [dynamic] = parse('<CodeSlab code={`hello ${runCode()}`} lang="text" title="Example" />').children;
  assert.throws(() => literalAttributes(dynamic, ['code', 'lang', 'title']), /dynamic MDX expression/);
});
test('JSX spread attributes fail rather than disappearing', () => {
  const [node] = parse('<CodeSlab {...props} />').children;
  assert.throws(() => literalAttributes(node, ['code', 'lang', 'title']), /unsupported or duplicate/);
});
test('comments are distinct from literal text and executable expressions', () => {
  const [comment] = parse('{/* snippet: fixture-code */}').children;
  assert.equal(isCommentExpression(comment), true);
  const [literal] = parse('{"Visible text"}').children;
  assert.equal(literalString(literal, 'body'), 'Visible text');
  const [dynamic] = parse('{runCode()}').children;
  assert.equal(isCommentExpression(dynamic), false);
  assert.throws(() => literalString(dynamic, 'body'), /dynamic MDX expression/);
});
test('Kotlin generics and interpolation remain ordinary fenced code', () => {
  const code = 'val users: Store<UserKey, User> = users\nprintln("Name=${user.name}")';
  const [node] = parse('```kotlin\n' + code + '\n```').children;
  assert.equal(node.type, 'code');
  assert.equal(node.lang, 'kotlin');
  assert.equal(node.value, code);
});

const agentOrigin = 'https://store-docs.example';

test('pageIdentity removes a trailing index and derives both public route shapes', () => {
  assert.deepEqual(pageIdentity('content/docs/store6/mutations/index.mdx', agentOrigin), {
    id: 'mutations',
    canonicalPath: '/docs/store6/mutations',
    markdownPath: '/llms/store6/mutations.md',
    canonicalUrl: 'https://store-docs.example/docs/store6/mutations',
    markdownUrl: 'https://store-docs.example/llms/store6/mutations.md',
  });
  assert.deepEqual(
    pageIdentity('content/docs/store6/mutations/pending-write-ui.mdx', agentOrigin),
    {
      id: 'mutations/pending-write-ui',
      canonicalPath: '/docs/store6/mutations/pending-write-ui',
      markdownPath: '/llms/store6/mutations/pending-write-ui.md',
      canonicalUrl: 'https://store-docs.example/docs/store6/mutations/pending-write-ui',
      markdownUrl: 'https://store-docs.example/llms/store6/mutations/pending-write-ui.md',
    },
  );
});

test('pageIdentity exposes x and x/index as the same route for bundle duplicate checks', () => {
  const leaf = pageIdentity('content/docs/store6/mutations.mdx', agentOrigin);
  const index = pageIdentity('content/docs/store6/mutations/index.mdx', agentOrigin);
  assert.equal(leaf.id, index.id);
  assert.equal(leaf.canonicalUrl, index.canonicalUrl);
  assert.equal(leaf.markdownUrl, index.markdownUrl);
});

test('pageIdentity rejects malformed and unsafe page IDs', () => {
  const invalidPaths = [
    'content/docs/other/overview.mdx',
    'content/docs/store6/.mdx',
    'content/docs/store6/UPPER.mdx',
    'content/docs/store6/under_score.mdx',
    'content/docs/store6/has space.mdx',
    'content/docs/store6/../secret.mdx',
    'content/docs/store6/concepts/./freshness.mdx',
    'content/docs/store6/concepts//freshness.mdx',
    'content/docs/store6/concepts\\freshness.mdx',
    'content/docs/store6/concepts%2Ffreshness.mdx',
    'content/docs/store6/overview.mdx?raw=1',
    'content/docs/store6/overview.mdx#source',
  ];
  for (const path of invalidPaths) {
    assert.throws(() => pageIdentity(path, agentOrigin), /Invalid (?:Store6 page|page ID)/, path);
  }
});

test('rewriteAgentLink maps known unfragmented Store6 pages and preserves queries', () => {
  const overview = pageIdentity('content/docs/store6/overview.mdx', agentOrigin);
  const mutations = pageIdentity('content/docs/store6/mutations/index.mdx', agentOrigin);
  const routes = new Map([
    [overview.canonicalUrl, overview],
    [mutations.canonicalUrl, mutations],
  ]);
  assert.equal(
    rewriteAgentLink('/docs/store6/mutations', overview.canonicalUrl, routes, agentOrigin),
    'https://store-docs.example/llms/store6/mutations.md',
  );
  assert.equal(
    rewriteAgentLink('./mutations?mode=fast', overview.canonicalUrl, routes, agentOrigin),
    'https://store-docs.example/llms/store6/mutations.md?mode=fast',
  );
  assert.equal(
    rewriteAgentLink('?format=compact', overview.canonicalUrl, routes, agentOrigin),
    'https://store-docs.example/llms/store6/overview.md?format=compact',
  );
});

test('rewriteAgentLink leaves same-page and cross-page fragments on canonical HTML', () => {
  const overview = pageIdentity('content/docs/store6/overview.mdx', agentOrigin);
  const mutations = pageIdentity('content/docs/store6/mutations/index.mdx', agentOrigin);
  const routes = new Map([
    [overview.canonicalUrl, overview],
    [mutations.canonicalUrl, mutations],
  ]);
  assert.equal(
    rewriteAgentLink('#start-here', overview.canonicalUrl, routes, agentOrigin),
    'https://store-docs.example/docs/store6/overview#start-here',
  );
  assert.equal(
    rewriteAgentLink('/docs/store6/mutations?mode=fast#conflicts', overview.canonicalUrl, routes, agentOrigin),
    'https://store-docs.example/docs/store6/mutations?mode=fast#conflicts',
  );
});

test('rewriteAgentLink returns absolute external and communication links and rejects other schemes', () => {
  const routes = new Map();
  const canonicalUrl = `${agentOrigin}/docs/store6/overview`;
  assert.equal(rewriteAgentLink('https://example.com/guide?q=1#part', canonicalUrl, routes, agentOrigin), 'https://example.com/guide?q=1#part');
  assert.equal(rewriteAgentLink('http://example.com/guide', canonicalUrl, routes, agentOrigin), 'http://example.com/guide');
  assert.equal(rewriteAgentLink('mailto:docs@example.com', canonicalUrl, routes, agentOrigin), 'mailto:docs@example.com');
  assert.equal(rewriteAgentLink('tel:+14165550123', canonicalUrl, routes, agentOrigin), 'tel:+14165550123');
  for (const raw of ['javascript:alert(1)', 'data:text/plain,hello', 'ftp://example.com/file']) {
    assert.throws(
      () => rewriteAgentLink(raw, canonicalUrl, routes, agentOrigin),
      /Unsupported documentation link protocol/,
      raw,
    );
  }
});

test('rewriteTreeLinks recursively rewrites ordinary links, definitions, and images', () => {
  const overview = pageIdentity('content/docs/store6/overview.mdx', agentOrigin);
  const mutations = pageIdentity('content/docs/store6/mutations/index.mdx', agentOrigin);
  const routes = new Map([
    [overview.canonicalUrl, overview],
    [mutations.canonicalUrl, mutations],
  ]);
  const tree = {
    type: 'root',
    children: [
      { type: 'paragraph', children: [{ type: 'link', url: '/docs/store6/mutations', children: [] }] },
      { type: 'definition', identifier: 'mutations', url: '/docs/store6/mutations?via=reference' },
      { type: 'image', url: '/docs/store6/mutations', alt: 'Route diagram' },
    ],
  };
  assert.equal(rewriteTreeLinks(tree, overview.canonicalUrl, routes, agentOrigin), tree);
  assert.equal(tree.children[0].children[0].url, 'https://store-docs.example/llms/store6/mutations.md');
  assert.equal(tree.children[1].url, 'https://store-docs.example/llms/store6/mutations.md?via=reference');
  assert.equal(tree.children[2].url, 'https://store-docs.example/llms/store6/mutations.md');
});

test('parseRecordedSource attributes known short and full revisions without inventing unknown links', async () => {
  const { parseRecordedSource } = await loadFixtureModule('lib/source-recorded.ts');
  const full = 'c67a94ed30460a35161c2cbc3e725f127caf055e';
  assert.deepEqual(parseRecordedSource('Last verified: 2026-08-12 · main @ c67a94ed, pre-6.0.0-alpha01'), {
    date: '2026-08-12', branch: 'main', hash: 'c67a94ed', status: 'pre-6.0.0-alpha01',
    commitUrl: `https://github.com/matt-ramotar/Store6/commit/${full}`,
  });
  assert.equal(
    parseRecordedSource(`Last verified: 2026-08-12 · main @ ${full}, pre-6.0.0-alpha01`).commitUrl,
    `https://github.com/matt-ramotar/Store6/commit/${full}`,
  );
  assert.deepEqual(parseRecordedSource('Last verified: 2026-08-12 · feature/docs @ deadbee, source snapshot'), {
    date: '2026-08-12', branch: 'feature/docs', hash: 'deadbee', status: 'source snapshot',
    commitUrl: undefined,
  });
  assert.equal(parseRecordedSource('Source recorded 2026-08-12 · main@c67a94ed · pre-6.0.0-alpha01'), undefined);
});

test('recorded source UI keeps its flattening, classes, and exact neutral label', async () => {
  const { EmWithVerifiedCommit } = await loadFixtureModule('components/docs/LastVerified.tsx');
  const knownHash = 'a6a156e9';
  const known = load(renderToStaticMarkup(React.createElement(EmWithVerifiedCommit, {
    children: ['Last verified: 2026-08-16 · ', React.createElement('strong', { key: 'branch' }, 'main'), ` @ ${knownHash}, pre-6.0.0-alpha01`],
  })));
  assert.equal(known('span').first().attr('class'), 'text-muted inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-sm not-italic');
  assert.equal(known('span').eq(1).text(), 'Source recorded 2026-08-16 ·');
  assert.equal(known('code').attr('class'), 'font-mono text-xs');
  assert.equal(known('code').text(), `main@${knownHash}`);
  assert.equal(known('a').attr('class'), 'text-foreground rounded-sm underline underline-offset-4');
  assert.equal(known('a').attr('href'), 'https://github.com/matt-ramotar/Store6/commit/a6a156e99db29cebf7da238263b007802bff2bfb');
  assert.equal(known('span').eq(2).text(), '· pre-6.0.0-alpha01');
  assert.doesNotMatch(known.text(), /Last verified/);

  const unknown = load(renderToStaticMarkup(React.createElement(EmWithVerifiedCommit, {
    children: 'Last verified: 2026-08-16 · main @ deadbee, pre-6.0.0-alpha01',
  })));
  assert.equal(unknown('span').eq(1).text(), 'Source recorded 2026-08-16 ·');
  assert.equal(unknown('a').length, 0);
  assert.equal(unknown('code').text(), 'main@deadbee');
  assert.doesNotMatch(unknown.text(), /Last verified/);
});
