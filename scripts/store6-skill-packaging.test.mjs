import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const repositoryRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const sourceScripts = join(repositoryRoot, 'skills/store6/scripts');
const packageScript = join(repositoryRoot, 'scripts/package-store6-skill.mjs');
const revision = '5a8c956bc1dbd6ad838ea9da3b34c7d76c703a71';
const origin = 'https://store.mobilenativefoundation.org';
const quickstart = '# Quickstart\n';
const advanced = '# Advanced\n';

const page = (id, title, markdown) => ({
  id,
  title,
  canonicalUrl: `${origin}/docs/store6/${id}`,
  markdownUrl: `${origin}/llms/store6/${id}.md`,
  sha256: createHash('sha256').update(markdown).digest('hex'),
  provenance: {
    kind: 'source-synced',
    sourcePath: `docs/store6/${id}.md`,
    sourceRevision: revision,
    sourceSha256: 'c'.repeat(64),
    recordedAttribution: null,
  },
});

const manifest = {
  schemaVersion: 1,
  bundleId: `sha256:${'a'.repeat(64)}`,
  origin,
  sourceRevision: revision,
  verifiedArtifacts: ['org.mobilenativefoundation.store:store6-core:6.0.0-alpha01'],
  pages: [
    page('quickstart', 'Quickstart', quickstart),
    page('advanced', 'Advanced', advanced),
  ],
};

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'store6-skill-packaging-'));
  const scripts = join(root, 'skill/scripts');
  const references = join(root, 'skill/references');
  const elsewhere = join(root, 'different-cwd');
  await Promise.all([
    mkdir(scripts, { recursive: true }),
    mkdir(references, { recursive: true }),
    mkdir(elsewhere, { recursive: true }),
  ]);
  await Promise.all([
    copyFile(join(sourceScripts, 'retrieve.mjs'), join(scripts, 'retrieve.mjs')),
    copyFile(join(sourceScripts, 'get-docs.mjs'), join(scripts, 'get-docs.mjs')),
    writeFile(join(references, 'docs-manifest.json'), JSON.stringify(manifest)),
  ]);
  return { root, scripts, elsewhere, cli: join(scripts, 'get-docs.mjs') };
}

function invoke(cli, cwd, args) {
  return spawnSync(process.execPath, [cli, ...args], { cwd, encoding: 'utf8' });
}

async function pairingFixture({ live = `${JSON.stringify(manifest, null, 2)}\n`, pinned = live } = {}) {
  const root = await mkdtemp(join(tmpdir(), 'store6-skill-pairing-'));
  const scripts = join(root, 'scripts');
  const skillScripts = join(root, 'skills/store6/scripts');
  const references = join(root, 'skills/store6/references');
  const publicDocs = join(root, 'public/llms');
  const elsewhere = join(root, 'different-cwd');
  await Promise.all([
    mkdir(scripts, { recursive: true }),
    mkdir(skillScripts, { recursive: true }),
    mkdir(references, { recursive: true }),
    mkdir(publicDocs, { recursive: true }),
    mkdir(elsewhere, { recursive: true }),
  ]);
  await Promise.all([
    copyFile(packageScript, join(scripts, 'package-store6-skill.mjs')),
    copyFile(join(sourceScripts, 'retrieve.mjs'), join(skillScripts, 'retrieve.mjs')),
    live === null ? Promise.resolve() : writeFile(join(publicDocs, 'store6-manifest.json'), live),
    writeFile(join(references, 'docs-manifest.json'), pinned),
  ]);
  return {
    root,
    elsewhere,
    cli: join(scripts, 'package-store6-skill.mjs'),
    live: join(publicDocs, 'store6-manifest.json'),
    pinned: join(references, 'docs-manifest.json'),
  };
}

test('lists paired pages offline from a different working directory', async t => {
  const paths = await fixture();
  t.after(() => rm(paths.root, { recursive: true, force: true }));

  const result = invoke(paths.cli, paths.elsewhere, ['--list']);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, '');
  assert.equal(result.stdout, `${JSON.stringify([
    { id: 'quickstart', title: 'Quickstart' },
    { id: 'advanced', title: 'Advanced' },
  ], null, 2)}\n`);
});

test('rejects invalid CLI arguments and unknown versions without stdout', async t => {
  const paths = await fixture();
  t.after(() => rm(paths.root, { recursive: true, force: true }));
  const cases = [
    { args: ['--source-revision', revision, '--coordinate', manifest.verifiedArtifacts[0], 'quickstart'], code: 'USAGE' },
    { args: ['--source-revision', revision, '--source-revision', revision, 'quickstart'], code: 'USAGE' },
    { args: ['--source-revision'], code: 'USAGE' },
    { args: ['--coordinate', '--list', 'quickstart'], code: 'USAGE' },
    { args: ['--force', '--source-revision', revision, 'quickstart'], code: 'USAGE' },
    { args: ['--unknown', 'quickstart'], code: 'USAGE' },
    { args: ['--source-revision', revision, 'quickstart', 'quickstart'], code: 'USAGE' },
    { args: ['--source-revision', 'f'.repeat(40), 'quickstart'], code: 'VERSION_MISMATCH' },
  ];

  for (const { args, code } of cases) {
    const result = invoke(paths.cli, paths.elsewhere, args);
    assert.equal(result.status, 1, `${args.join(' ')}\n${result.stderr}`);
    assert.equal(result.stdout, '', args.join(' '));
    assert.equal(JSON.parse(result.stderr).code, code, args.join(' '));
  }
});

test('buffers retrieval output when a later page fails', async t => {
  const paths = await fixture();
  t.after(() => rm(paths.root, { recursive: true, force: true }));
  const wrapper = join(paths.scripts, 'failure-wrapper.mjs');
  await writeFile(wrapper, `
    import { readFile } from 'node:fs/promises';
    import { retrieveDocs } from './retrieve.mjs';
    const pinned = JSON.parse(await readFile(
      new URL('../references/docs-manifest.json', import.meta.url), 'utf8'));
    const response = (body, type) => new Response(body,
      { headers: { 'content-type': type } });
    try {
      const result = await retrieveDocs({
        pinned,
        ids: ['quickstart', 'advanced'],
        target: { kind: 'revision', value: pinned.sourceRevision },
        fetchImpl: async url => {
          if (url.endsWith('.json')) return response(JSON.stringify(pinned), 'application/json');
          if (url.endsWith('/quickstart.md')) return response(${JSON.stringify(quickstart)}, 'text/markdown');
          return response(${JSON.stringify(`${advanced}changed`)}, 'text/markdown');
        },
      });
      process.stdout.write(JSON.stringify(result) + '\\n');
    } catch (error) {
      process.stderr.write(JSON.stringify({ code: error.code ?? 'READ_ERROR', message: error.message }) + '\\n');
      process.exitCode = 1;
    }
  `);

  const result = invoke(wrapper, paths.elsewhere, []);

  assert.equal(result.status, 1, result.stderr);
  assert.equal(result.stdout, '');
  assert.equal(JSON.parse(result.stderr).code, 'CONTENT_MISMATCH');
});

test('pairing rejects a missing or invalid live manifest without changing the packaged bytes', async t => {
  for (const live of [null, '{"schemaVersion":1}\n']) {
    const pinned = 'packaged bytes stay exact\n';
    const paths = await pairingFixture({ live, pinned });
    t.after(() => rm(paths.root, { recursive: true, force: true }));

    const result = invoke(paths.cli, paths.elsewhere, []);

    assert.equal(result.status, 1, result.stdout);
    assert.equal(result.stdout, '');
    assert.equal(await readFile(paths.pinned, 'utf8'), pinned);
    assert.match(result.stderr, live === null ? /ENOENT/ : /MANIFEST_INVALID/);
  }
});

test('--check reports a changed bundle and preserves every fixture byte from a foreign CWD', async t => {
  const pinned = `${JSON.stringify(manifest, null, 2)}\n`;
  const changed = { ...manifest, bundleId: `sha256:${'b'.repeat(64)}` };
  const live = `${JSON.stringify(changed, null, 2)}\n`;
  const paths = await pairingFixture({ live, pinned });
  t.after(() => rm(paths.root, { recursive: true, force: true }));
  const before = await Promise.all([
    readFile(paths.cli),
    readFile(join(paths.root, 'skills/store6/scripts/retrieve.mjs')),
    readFile(paths.live),
    readFile(paths.pinned),
  ]);

  const result = invoke(paths.cli, paths.elsewhere, ['--check']);

  assert.equal(result.status, 1, result.stdout);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /SKILL_PAIR_MISMATCH: explicitly pair and revalidate this skill candidate/);
  const after = await Promise.all([
    readFile(paths.cli),
    readFile(join(paths.root, 'skills/store6/scripts/retrieve.mjs')),
    readFile(paths.live),
    readFile(paths.pinned),
  ]);
  assert.deepEqual(after, before);
});

test('ordinary corpus drift preserves the skill pin until an explicit candidate pairing', async t => {
  const pinned = `${JSON.stringify(manifest, null, 2)}\n`;
  const changed = { ...manifest, bundleId: `sha256:${'b'.repeat(64)}` };
  const live = `${JSON.stringify(changed, null, 2)}\n`;
  const paths = await pairingFixture({ live: pinned, pinned });
  t.after(() => rm(paths.root, { recursive: true, force: true }));

  await writeFile(paths.live, live);
  assert.equal(await readFile(paths.pinned, 'utf8'), pinned);

  const rejected = invoke(paths.cli, paths.elsewhere, ['--check']);
  assert.equal(rejected.status, 1, rejected.stdout);
  assert.match(rejected.stderr, /SKILL_PAIR_MISMATCH/);
  assert.equal(await readFile(paths.pinned, 'utf8'), pinned);

  const paired = invoke(paths.cli, paths.elsewhere, []);
  assert.equal(paired.status, 0, paired.stderr);
  assert.equal(paired.stderr, '');
  assert.equal(paired.stdout, 'paired Store6 skill candidate; validation is still required\n');
  assert.equal(await readFile(paths.pinned, 'utf8'), live);

  const checked = invoke(paths.cli, paths.elsewhere, ['--check']);
  assert.equal(checked.status, 0, checked.stderr);
  assert.equal(checked.stderr, '');
  assert.equal(checked.stdout, 'checked Store6 skill/corpus pair\n');
});
