import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  symlinkSync,
  utimesSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

import { reconcileOwnedOutputs } from './generated-output-transaction.mjs';

const ROOT = resolve(import.meta.dirname, '..');
const ORIGIN = 'https://store.mobilenativefoundation.org';
const REVISION = 'a'.repeat(40);

async function bundleModule() {
  return import('./agent-docs/bundle.mjs');
}

test('assembleBundle sorts pages and inputs, lowers MDX, rewrites internal links, and hashes UTF-8 bytes', async () => {
  const { assembleBundle, sha256 } = await bundleModule();
  const makePages = () => [
    page('zeta', 'Zeta', 'See [Alpha](/docs/store6/alpha) and café.'),
    page('alpha', 'Alpha', 'First.'),
  ];
  const first = assembleBundle({
    config: configFor([]),
    lock: { revision: REVISION },
    pages: makePages(),
    context: emptyContext(),
    inputFiles: new Map([['z.txt', Buffer.from('z')], ['a.txt', Buffer.from('é')]]),
  });
  const reordered = assembleBundle({
    config: configFor([]),
    lock: { revision: REVISION },
    pages: makePages().reverse(),
    context: emptyContext(),
    inputFiles: new Map([['a.txt', Buffer.from('é')], ['z.txt', Buffer.from('z')]]),
  });

  assert.deepEqual([...first], [...reordered]);
  const manifest = JSON.parse(first.get('public/llms/store6-manifest.json'));
  assert.deepEqual(manifest.pages.map(({ id }) => id), ['alpha', 'zeta']);
  assert.match(first.get('public/llms/store6/zeta.md'), /https:\/\/store\.mobilenativefoundation\.org\/llms\/store6\/alpha\.md/);
  assert.equal(
    manifest.pages[1].sha256,
    createHash('sha256').update(Buffer.from(first.get('public/llms/store6/zeta.md'), 'utf8')).digest('hex'),
  );
  assert.equal(sha256('é'), createHash('sha256').update(Buffer.from('é', 'utf8')).digest('hex'));
});

test('assembleBundle rejects duplicate canonical routes and Markdown destinations', async () => {
  const { assembleBundle } = await bundleModule();
  const alpha = page('alpha', 'Alpha', 'One.');
  const duplicateRoute = page('beta', 'Beta', 'Two.');
  duplicateRoute.identity.canonicalUrl = alpha.identity.canonicalUrl;
  assert.throws(() => assembleBundle(bundleArguments([alpha, duplicateRoute])), /Duplicate Store6 route or Markdown destination/);

  const duplicateMarkdown = page('beta', 'Beta', 'Two.');
  duplicateMarkdown.identity.markdownPath = alpha.identity.markdownPath;
  assert.throws(() => assembleBundle(bundleArguments([alpha, duplicateMarkdown])), /Duplicate Store6 route or Markdown destination/);
});

test('bundle output contains only selected Store6 pages while retaining external Store5 and Dokka links', async () => {
  const { assembleBundle } = await bundleModule();
  const selected = page(
    'overview',
    'Store6 overview',
    'Links.',
  );
  selected.tree.children[0].children = [
    { type: 'link', url: '/docs/store5/migration', children: [{ type: 'text', value: 'Store5 migration' }] },
    { type: 'text', value: ' and ' },
    {
      type: 'link',
      url: 'https://store.mobilenativefoundation.org/api/store6/index.html',
      children: [{ type: 'text', value: 'Dokka API' }],
    },
    { type: 'text', value: '.' },
  ];
  const outputs = assembleBundle(bundleArguments([selected]));
  const full = outputs.get('public/llms-full.txt');
  assert.match(full, /Store6 overview/);
  assert.match(full, /https:\/\/store\.mobilenativefoundation\.org\/docs\/store5\/migration/);
  assert.match(full, /https:\/\/store\.mobilenativefoundation\.org\/api\/store6\/index\.html/);
  assert.doesNotMatch(full, /# Store5 guide corpus/);
  assert.equal([...outputs.keys()].some(path => path.includes('/api/') || path.includes('/store5/')), false);
});

test('buildAgentDocs rejects missing or excluded public pages', async () => {
  const { buildAgentDocs } = await bundleModule();
  await withFixture(async root => {
    writeFixture(root, 'content/docs/store6/unlisted.mdx', mdx('Unlisted', 'Not configured.'));
    await assert.rejects(buildAgentDocs({ root }), /Store6 public-page census differs from export configuration/);
  });
  await withFixture(async root => {
    const config = configFor(['content/docs/store6/missing.mdx']);
    writeFixture(root, 'scripts/agent-docs/config.json', json(config));
    await assert.rejects(buildAgentDocs({ root }), /Store6 public-page census differs from export configuration/);
  });
});

test('buildAgentDocs rejects unsafe config paths, symlinked selected inputs, and symlinked parents', async () => {
  const { buildAgentDocs } = await bundleModule();
  await withFixture(async root => {
    writeFixture(root, 'scripts/agent-docs/config.json', json(configFor(['content/docs/store6/../outside.mdx'])));
    await assert.rejects(buildAgentDocs({ root }), /Invalid Store6 page|Invalid page ID|Unsafe input path/);
  });
  await withFixture(async root => {
    rmSync(resolve(root, 'content/docs/store6/overview.mdx'));
    writeFixture(root, 'outside.mdx', mdx('Outside', 'Escaped.'));
    symlinkSync(resolve(root, 'outside.mdx'), resolve(root, 'content/docs/store6/overview.mdx'));
    await assert.rejects(buildAgentDocs({ root }), /Symlink content|Symlink input/);
  });
  await withFixture(async root => {
    rmSync(resolve(root, 'content/docs/store6'), { recursive: true });
    mkdirSync(resolve(root, 'outside-content'), { recursive: true });
    writeFixture(root, 'outside-content/overview.mdx', mdx('Outside', 'Escaped.'));
    symlinkSync(resolve(root, 'outside-content'), resolve(root, 'content/docs/store6'));
    await assert.rejects(buildAgentDocs({ root }), /Invalid content directory|Symlink input/);
  });
});

test('component and used diagram bytes independently affect bundle identity', async () => {
  const { buildAgentDocs } = await bundleModule();
  await withFixture(async root => {
    writeFixture(root, 'content/docs/store6/overview.mdx', mdx('Overview', '<StoreDiagram id="store5-migration" />'));
    writeFixture(root, 'public/diagrams/store5-migration.html', diagram('First label'));
    const initial = manifestOf(await buildAgentDocs({ root })).bundleId;

    writeFixture(root, 'components/overview/content/inline.ts', `${readFixture(root, 'components/overview/content/inline.ts')}\n// identity input\n`);
    const componentChanged = manifestOf(await buildAgentDocs({ root })).bundleId;
    assert.notEqual(componentChanged, initial);

    writeFixture(root, 'public/diagrams/store5-migration.html', diagram('Second label'));
    const diagramChanged = manifestOf(await buildAgentDocs({ root })).bundleId;
    assert.notEqual(diagramChanged, componentChanged);
  });
});

test('buildAgentDocs emits one Markdown file per configured page plus manifest and full text', async () => {
  const { buildAgentDocs } = await bundleModule();
  const outputs = await buildAgentDocs({ root: ROOT });
  const config = JSON.parse(readFileSync(resolve(ROOT, 'scripts/agent-docs/config.json'), 'utf8'));
  assert.equal(outputs.size, config.pages.length + 2);
  assert.equal(outputs.size, 45);
  const manifest = manifestOf(outputs);
  assert.equal(manifest.pages.length, 43);
  assert.equal(manifest.verifiedArtifacts.length, 0);
  assert.equal(manifest.sourceRevision, JSON.parse(readFileSync(resolve(ROOT, 'evidence/T4-store6-source-lock.json'))).revision);
  assert.equal(manifest.pages.every(entry => /^sha256:[a-f0-9]{64}$/.test(manifest.bundleId) && /^[a-f0-9]{64}$/.test(entry.sha256)), true);
});

test('build-agent-docs owner safely removes stale files, rejects modified stale files, and preserves other owners', async () => {
  await withFixture(async root => {
    const owner = 'build-agent-docs';
    writeFixture(root, 'public/llms/store6/keep.md', 'old keep');
    writeFixture(root, 'public/llms/store6/stale.md', 'old stale');
    writeFixture(root, 'public/other-owner.txt', 'other');
    writeFixture(root, 'evidence/T4-owned-targets.json', json({
      schemaVersion: 1,
      owners: {
        [owner]: entriesFor({ 'public/llms/store6/keep.md': 'old keep', 'public/llms/store6/stale.md': 'old stale' }),
        other: entriesFor({ 'public/other-owner.txt': 'other' }),
      },
    }));
    await reconcileOwnedOutputs({
      root,
      owner,
      ledgerRelativePath: 'evidence/T4-owned-targets.json',
      outputs: new Map([['public/llms/store6/keep.md', 'new keep']]),
    });
    assert.equal(readFixture(root, 'public/llms/store6/keep.md'), 'new keep');
    assert.equal(exists(root, 'public/llms/store6/stale.md'), false);
    assert.equal(readFixture(root, 'public/other-owner.txt'), 'other');
    assert.deepEqual(JSON.parse(readFixture(root, 'evidence/T4-owned-targets.json')).owners.other, entriesFor({ 'public/other-owner.txt': 'other' }));
  });

  await withFixture(async root => {
    const owner = 'build-agent-docs';
    writeFixture(root, 'public/llms/store6/keep.md', 'old keep');
    writeFixture(root, 'public/llms/store6/stale.md', 'locally modified');
    writeFixture(root, 'evidence/T4-owned-targets.json', json({
      schemaVersion: 1,
      owners: { [owner]: entriesFor({ 'public/llms/store6/keep.md': 'old keep', 'public/llms/store6/stale.md': 'old stale' }) },
    }));
    const before = snapshot(root);
    await assert.rejects(reconcileOwnedOutputs({
      root,
      owner,
      ledgerRelativePath: 'evidence/T4-owned-targets.json',
      outputs: new Map([['public/llms/store6/keep.md', 'new keep']]),
    }), /OWNED_STALE_MODIFIED/);
    assert.deepEqual(snapshot(root), before);
  });

  await withFixture(async root => {
    writeFixture(root, 'public/collision.txt', 'other');
    writeFixture(root, 'evidence/T4-owned-targets.json', json({
      schemaVersion: 1,
      owners: { other: entriesFor({ 'public/collision.txt': 'other' }) },
    }));
    await assert.rejects(reconcileOwnedOutputs({
      root,
      owner: 'build-agent-docs',
      ledgerRelativePath: 'evidence/T4-owned-targets.json',
      outputs: new Map([['public/collision.txt', 'replacement']]),
    }), /OWNED_TARGET_COLLISION/);
  });
});

test('CLI --check verifies the fixture without writing any file', async () => {
  const { buildAgentDocs } = await bundleModule();
  await withFixture(async root => {
    copyFixture(root, 'scripts/build-agent-docs.mjs');
    copyFixture(root, 'scripts/generated-output-transaction.mjs');
    symlinkSync(resolve(ROOT, 'node_modules'), resolve(root, 'node_modules'), 'dir');
    const outputs = await buildAgentDocs({ root });
    writeFixture(root, 'evidence/T4-owned-targets.json', json({ schemaVersion: 1, owners: {} }));
    await reconcileOwnedOutputs({
      root,
      outputs,
      owner: 'build-agent-docs',
      ledgerRelativePath: 'evidence/T4-owned-targets.json',
    });
    const old = new Date('2020-01-01T00:00:00Z');
    for (const path of walkFiles(root)) {
      if (!lstatSync(resolve(root, path)).isSymbolicLink()) utimesSync(resolve(root, path), old, old);
    }
    const before = snapshot(root, true);
    const result = spawnSync(process.execPath, [resolve(root, 'scripts/build-agent-docs.mjs'), '--check'], {
      cwd: root,
      encoding: 'utf8',
    });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, 'checked 3 agent-doc outputs\n');
    assert.deepEqual(snapshot(root, true), before);
  });
});

function bundleArguments(pages) {
  return {
    config: configFor([]),
    lock: { revision: REVISION },
    pages,
    context: emptyContext(),
    inputFiles: new Map([['contract.mjs', Buffer.from('v1')]]),
  };
}

function configFor(paths) {
  return { schemaVersion: 1, contractVersion: 'store6-agent-docs-v1', origin: ORIGIN, pages: paths };
}

function page(id, title, body) {
  return {
    metadata: { title, description: `${title} description` },
    tree: {
      type: 'root',
      children: [{
        type: 'paragraph',
        children: body.includes('[')
          ? [{ type: 'link', url: body.match(/\]\(([^)]+)\)/)[1], children: [{ type: 'text', value: body.match(/\[([^\]]+)\]/)[1] }] }, { type: 'text', value: body.slice(body.indexOf(')') + 1) }]
          : [{ type: 'text', value: body }],
      }],
    },
    identity: {
      id,
      canonicalUrl: `${ORIGIN}/docs/store6/${id}`,
      markdownUrl: `${ORIGIN}/llms/store6/${id}.md`,
      markdownPath: `/llms/store6/${id}.md`,
    },
    provenance: {
      kind: 'site-authored',
      sourcePath: `content/docs/store6/${id}.mdx`,
      sourceRevision: null,
      sourceSha256: 'b'.repeat(64),
      recordedAttribution: null,
    },
  };
}

function emptyContext() {
  return { diagram() { throw new Error('unused'); }, recordedSource() { return undefined; } };
}

async function withFixture(callback) {
  const root = mkdtempSync(join(tmpdir(), 'store6-agent-docs-bundle-'));
  try {
    seedFixture(root);
    await callback(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function seedFixture(root) {
  const copied = [
    'package.json',
    'pnpm-lock.yaml',
    'lib/source-recorded.ts',
    'lib/store-diagrams.ts',
    'components/overview/content/inline.ts',
    'components/overview/content/read-resolution.ts',
    'components/overview/content/support-matrix.ts',
    'components/overview/content/start-here.ts',
    ...readdirSync(resolve(ROOT, 'scripts/agent-docs'))
      .filter(name => name.endsWith('.mjs'))
      .map(name => `scripts/agent-docs/${name}`),
  ];
  for (const path of copied) copyFixture(root, path);
  writeFixture(root, 'scripts/agent-docs/config.json', json(configFor(['content/docs/store6/overview.mdx'])));
  writeFixture(root, 'evidence/T4-store6-source-lock.json', json({ schemaVersion: 1, revision: REVISION, sources: [] }));
  writeFixture(root, 'content/docs/store6/overview.mdx', mdx('Overview', 'Fixture body.'));
}

function copyFixture(root, path) {
  writeFixture(root, path, readFileSync(resolve(ROOT, path)));
}

function mdx(title, body) {
  return `---\ntitle: ${title}\ndescription: Fixture description.\n---\n\n${body}\n`;
}

function diagram(label) {
  return `<svg><title>Fixture diagram</title><desc>Fixture description</desc><text>${label}</text></svg>\n`;
}

function manifestOf(outputs) {
  return JSON.parse(outputs.get('public/llms/store6-manifest.json'));
}

function entriesFor(values) {
  return Object.entries(values)
    .map(([path, content]) => ({ path, sha256: digest(content) }))
    .sort((left, right) => left.path.localeCompare(right.path));
}

function digest(value) {
  return createHash('sha256').update(value).digest('hex');
}

function json(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function writeFixture(root, path, content) {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, content);
}

function readFixture(root, path) {
  return readFileSync(resolve(root, path), 'utf8');
}

function exists(root, path) {
  try {
    lstatSync(resolve(root, path));
    return true;
  } catch (error) {
    if (error?.code === 'ENOENT') return false;
    throw error;
  }
}

function walkFiles(root) {
  const files = [];
  function visit(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const absolute = resolve(directory, entry.name);
      const path = relative(root, absolute);
      if (entry.isDirectory() && !entry.isSymbolicLink()) visit(absolute);
      else files.push(path);
    }
  }
  visit(root);
  return files.sort();
}

function snapshot(root, includeTimes = false) {
  return walkFiles(root).map(path => {
    const stat = lstatSync(resolve(root, path));
    return {
      path,
      kind: stat.isSymbolicLink() ? 'symlink' : 'file',
      sha256: stat.isSymbolicLink() ? null : digest(readFileSync(resolve(root, path))),
      ...(includeTimes ? { mtimeMs: stat.mtimeMs } : {}),
    };
  });
}
