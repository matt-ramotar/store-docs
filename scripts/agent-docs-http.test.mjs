import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { assertMarkdownResponse, verifyAgentDocs } from './verify-agent-docs.mjs';

const hash = value => createHash('sha256').update(value).digest('hex');
const origin = 'https://store.mobilenativefoundation.org';

for (const [label, override, expected] of [
  ['missing page', { status: 404 }, /Markdown status/],
  ['wrong MIME', { type: 'text/html' }, /Markdown content type/],
  ['wrong bytes', { bytes: Buffer.from('changed') }, /Markdown bytes/],
]) {
  test(`HTTP verifier rejects ${label}`, () => {
    assert.throws(() => assertMarkdownResponse({ status: 200, type: 'text/markdown; charset=utf-8',
      bytes: Buffer.from('café\n'), expectedHash: hash('café\n'), ...override }), expected);
  });
}

async function fixture(t, changes = {}) {
  const root = await mkdtemp(join(tmpdir(), 'store6-agent-http-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, 'public/llms'), { recursive: true });
  const markdown = `# Example\n\n[Contract](${origin}/docs/store6/example#read%20contract)\n`;
  const manifest = { origin, pages: [{ id: 'example', canonicalUrl: `${origin}/docs/store6/example`,
    markdownUrl: `${origin}/llms/store6/example.md`, sha256: hash(markdown) }] };
  const body = JSON.stringify(manifest) + '\n';
  const responses = new Map([
    ['/llms/store6/example.md', [markdown, 'text/markdown']],
    ['/llms/store6-manifest.json', [body, 'application/json']],
    ['/llms-full.txt', ['Guide corpus\n', 'text/plain']],
    ['/llms.txt', ['Index\n', 'text/plain']],
    ['/docs/store6/example', ['<h2 id="read contract">Read contract</h2>', 'text/html']],
  ]);
  await writeFile(join(root, 'public/llms/store6-manifest.json'), body);
  await writeFile(join(root, 'public/llms-full.txt'), 'Guide corpus\n');
  await writeFile(join(root, 'public/llms.txt'), 'Index\n');
  for (const [path, response] of Object.entries(changes)) responses.set(path, response);
  const calls = [];
  return { root, baseUrl: 'http://127.0.0.1:3222', calls, fetchImpl: async (url, options) => {
    assert.equal(url.origin, 'http://127.0.0.1:3222');
    assert.equal(options.redirect, 'error');
    assert.ok(options.signal instanceof AbortSignal);
    calls.push(url.pathname);
    const entry = responses.get(url.pathname);
    return entry ? new Response(entry[0], { status: entry[2] ?? 200, headers: { 'content-type': entry[1] } })
      : new Response('Missing', { status: 404 });
  } };
}

test('HTTP verifier checks complete bytes, decoded HTML fragments and absent paths', async t => {
  const input = await fixture(t);
  assert.deepEqual(await verifyAgentDocs(input), { markdownPages: 1, bundleFiles: 3, internalLinks: 1 });
  assert.ok(input.calls.includes('/llms/store6/invalid..id.md'));
});

test('HTTP verifier rejects missing HTML fragment', async t => {
  const input = await fixture(t, { '/docs/store6/example': ['<h2 id="wrong">Wrong</h2>', 'text/html'] });
  await assert.rejects(verifyAgentDocs(input), /Missing fragment/);
});

test('HTTP verifier rejects an unlisted Markdown URL returning 200', async t => {
  const input = await fixture(t, { '/llms/store6/this-page-does-not-exist.md': ['Fallback', 'text/html'] });
  await assert.rejects(verifyAgentDocs(input), /this-page-does-not-exist/);
});

test('HTTP verifier refuses unconfigured delivery origins', async t => {
  const input = await fixture(t);
  await assert.rejects(verifyAgentDocs({ ...input, baseUrl: 'https://example.org' }), /Expected local production/);
  assert.deepEqual(input.calls, []);
});
