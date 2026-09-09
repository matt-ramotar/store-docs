import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import nextConfig from '../next.config.mjs';
import { pageIdentity } from './agent-docs/links.mjs';

const root = new URL('../', import.meta.url);
const config = JSON.parse(await readFile(new URL('scripts/agent-docs/config.json', root), 'utf8'));

test('only declared Markdown and discovery text receive explicit public headers', async () => {
  assert.equal(typeof nextConfig.headers, 'function');
  const rules = await nextConfig.headers();
  const markdownPaths = config.pages.map(path => pageIdentity(path, config.origin).markdownPath);
  assert.deepEqual(rules.map(rule => rule.source), [...markdownPaths, '/llms-full.txt', '/llms.txt']);
  for (const rule of rules) {
    assert.deepEqual(rule.headers, [
      { key: 'Content-Type', value: `${markdownPaths.includes(rule.source) ? 'text/markdown' : 'text/plain'}; charset=utf-8` },
      { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
    ]);
  }
});

test('build and dev regenerate agent documents while start serves the built candidate', async () => {
  const pkg = JSON.parse(await readFile(new URL('package.json', root), 'utf8'));
  assert.equal(pkg.scripts.build, 'node scripts/build-agent-docs.mjs && next build --webpack');
  assert.equal(pkg.scripts.dev, 'node scripts/build-agent-docs.mjs && next dev -p 3111');
  assert.equal(pkg.scripts.start, 'next start -p 3222');
});
