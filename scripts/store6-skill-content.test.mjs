import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { access, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const repositoryRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const skillRoot = join(repositoryRoot, 'skills/store6');

async function readSkillFile(relativePath) {
  return readFile(join(skillRoot, relativePath), 'utf8');
}

function parseFrontmatter(markdown) {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n/);
  assert.ok(match, 'SKILL.md must start with YAML frontmatter');
  const lines = match[1].split('\n');
  const values = new Map();
  let parent = '';
  for (const line of lines) {
    const nested = line.match(/^  ([a-z]+):\s*(.+)$/);
    if (nested && parent) {
      values.set(`${parent}.${nested[1]}`, nested[2].replace(/^"|"$/g, ''));
      continue;
    }
    const field = line.match(/^([a-z]+):(?:\s*(.*))?$/);
    if (field) {
      parent = field[2] ? '' : field[1];
      if (field[2]) values.set(field[1], field[2].replace(/^"|"$/g, ''));
    }
  }
  return values;
}

test('declares the Store6 skill identity and runtime boundary', async () => {
  const frontmatter = parseFrontmatter(await readSkillFile('SKILL.md'));
  assert.equal(frontmatter.get('name'), 'store6');
  assert.match(frontmatter.get('description'), /Kotlin Multiplatform/);
  for (const trigger of ['data access', 'freshness', 'persistence', 'UI collection',
    'mutations', 'tests', 'migration from Store5']) {
    assert.match(frontmatter.get('description'), new RegExp(trigger));
  }
  assert.equal(frontmatter.get('compatibility'),
    'Requires Node.js 22.18 or newer and HTTPS access to the documented Store6 site for the retrieval helper.');
  assert.equal(frontmatter.get('license'), 'Apache-2.0');
  assert.equal(frontmatter.get('metadata.author'), 'matt-ramotar');
  assert.equal(frontmatter.get('metadata.version'), '0.1.0');
});

test('all concrete task-map IDs exist in the 43-page export configuration', async () => {
  const [taskMap, configuration] = await Promise.all([
    readSkillFile('references/task-map.md'),
    readFile(join(repositoryRoot, 'scripts/agent-docs/config.json'), 'utf8').then(JSON.parse),
  ]);
  assert.equal(configuration.pages.length, 43);
  const available = new Set(configuration.pages.map(path => {
    const id = path.replace(/^content\/docs\/store6\//, '').replace(/\.mdx$/, '');
    return id.endsWith('/index') ? id.slice(0, -'/index'.length) : id;
  }));
  const rows = taskMap.split('\n').filter(line => /^\| (?!---)/.test(line)).slice(1);
  assert.equal(rows.length, 9);
  const qualifiers = new Set(['when needed']);
  const ids = [...taskMap.matchAll(/`([^`]+)`/g)].map(match => match[1]);
  assert.ok(ids.length > 0);
  for (const id of ids) {
    if (!qualifiers.has(id)) assert.ok(available.has(id), `unknown task-map ID: ${id}`);
  }
  assert.doesNotMatch(taskMap, /```|\b(?:class|interface|fun)\s+[A-Za-z_]/);
});

test('supporting paths resolve from the skill and UI metadata invokes $store6', async () => {
  const skill = await readSkillFile('SKILL.md');
  for (const relativePath of ['references/task-map.md', 'scripts/get-docs.mjs']) {
    assert.match(skill, new RegExp(relativePath.replace(/[./]/g, '\\$&')));
    await access(join(skillRoot, relativePath));
  }
  const metadata = await readSkillFile('agents/openai.yaml');
  assert.match(metadata, /^interface:\n/);
  assert.match(metadata, /display_name: "Store6"/);
  assert.match(metadata, /short_description: "Build Store6 integrations from versioned documentation"/);
  assert.match(metadata, /default_prompt: "Use \$store6 /);
});

test('package preserves retrieval, evidence, and update boundaries', async () => {
  const [skill, taskMap] = await Promise.all([
    readSkillFile('SKILL.md'),
    readSkillFile('references/task-map.md'),
  ]);
  assert.match(skill, /exactly one of `--source-revision` or `--coordinate`/);
  assert.match(skill, /one to four page IDs/);
  assert.match(skill, /provenance/);
  assert.match(skill, /canonical citations/);
  assert.match(skill, /Distinguish source inspection, compilation, executed tests, and unavailable checks/);
  assert.match(skill, /Do not auto-update or invent compatibility/);
  assert.match(skill, /source contradiction[\s\S]*both passages/);
  assert.doesNotMatch(`${skill}\n${taskMap}`, /(?:npm|pnpm|yarn)\s+(?:install|add)|git\s+(?:clone|checkout|pull)|writeFile|config(?:uration)?\s+overwrite/i);
});

test('license and notice identify the skill package without licensing the repository', async () => {
  const [license, notice] = await Promise.all([
    readFile(join(skillRoot, 'LICENSE.txt')),
    readSkillFile('NOTICE'),
  ]);
  assert.equal(license.byteLength, 11_398);
  assert.equal(createHash('sha256').update(license).digest('hex'),
    'c08f624e9ec8e391a14576ddec553e94dda9292376837fbfa7d185b2086f0c5a');
  assert.equal(notice,
    'Store6 coding skill\nCopyright 2026 Matt Ramotar\n\n' +
    'This package links to Store6 documentation and source at\n' +
    'https://github.com/matt-ramotar/Store6 rather than bundling a second API manual.\n');
});
