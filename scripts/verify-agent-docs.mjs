import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { gfm } from 'micromark-extension-gfm';
import { gfmFromMarkdown } from 'mdast-util-gfm';
import * as cheerio from 'cheerio';

export function assertMarkdownResponse({ status, type, bytes, expectedHash }) {
  assert.equal(status, 200, 'Markdown status');
  assert.equal(type?.split(';')[0].trim(), 'text/markdown', 'Markdown content type');
  assert.equal(createHash('sha256').update(bytes).digest('hex'), expectedHash, 'Markdown bytes');
}

export async function verifyAgentDocs({ root, baseUrl, fetchImpl = fetch }) {
  const manifestBytes = await readFile(resolve(root, 'public/llms/store6-manifest.json'));
  const manifest = JSON.parse(manifestBytes.toString('utf8'));
  assert.ok(baseUrl === 'http://127.0.0.1:3222' || baseUrl === manifest.origin, 'Expected local production or configured HTTPS origin');
  const cache = new Map();
  async function get(path) {
    if (!cache.has(path)) cache.set(path, (async () => {
      const response = await fetchImpl(new URL(path, baseUrl), { redirect: 'error', signal: AbortSignal.timeout(10000) });
      return { status: response.status, type: response.headers.get('content-type'),
        bytes: Buffer.from(await response.arrayBuffer()) };
    })());
    return cache.get(path);
  }
  const internalLinks = new Set();
  for (const page of manifest.pages) {
    const actual = await get(new URL(page.markdownUrl).pathname);
    assertMarkdownResponse({ ...actual, expectedHash: page.sha256 });
    const tree = fromMarkdown(actual.bytes.toString('utf8'), {
      extensions: [gfm()], mdastExtensions: [gfmFromMarkdown()],
    });
    function inspect(node) {
      if (['link', 'definition', 'image'].includes(node.type)) {
        const destination = new URL(node.url, page.canonicalUrl);
        if (destination.origin === manifest.origin) internalLinks.add(destination.href);
      }
      for (const child of node.children ?? []) inspect(child);
    }
    inspect(tree);
  }
  for (const [path, bytes, type] of [
    ['/llms/store6-manifest.json', manifestBytes, 'application/json'],
    ['/llms-full.txt', await readFile(resolve(root, 'public/llms-full.txt')), 'text/plain'],
    ['/llms.txt', await readFile(resolve(root, 'public/llms.txt')), 'text/plain'],
  ]) {
    const actual = await get(path);
    assert.equal(actual.status, 200, path);
    assert.equal(actual.type?.split(';')[0].trim(), type, path);
    assert.deepEqual(actual.bytes, bytes, path);
  }
  for (const url of internalLinks) {
    const parsed = new URL(url);
    const actual = await get(parsed.pathname + parsed.search);
    assert.equal(actual.status, 200, url);
    if (parsed.hash) {
      const id = decodeURIComponent(parsed.hash.slice(1));
      const $ = cheerio.load(actual.bytes.toString('utf8'));
      assert.ok($('[id]').toArray().some(element => $(element).attr('id') === id), `Missing fragment: ${url}`);
    }
  }
  for (const path of ['/llms/store6/this-page-does-not-exist.md', '/llms/store6/invalid..id.md']) {
    assert.equal((await get(path)).status, 404, path);
  }
  return { markdownPages: manifest.pages.length, bundleFiles: 3, internalLinks: internalLinks.size };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.length !== 2 || args[0] !== '--base-url') throw new Error('usage: node scripts/verify-agent-docs.mjs --base-url ORIGIN');
  const result = await verifyAgentDocs({ root: resolve(import.meta.dirname, '..'), baseUrl: args[1] });
  process.stdout.write(JSON.stringify(result) + '\n');
}
