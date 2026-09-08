import { createHash } from 'node:crypto';
import { lstat, readFile, readdir } from 'node:fs/promises';
import { relative, resolve, sep } from 'node:path';
import { toMarkdown } from 'mdast-util-to-markdown';
import { gfmToMarkdown } from 'mdast-util-gfm';

import { storeDiagramIds } from '../../lib/store-diagrams.ts';
import { parseRecordedSource } from '../../lib/source-recorded.ts';
import { rewriteTreeLinks, pageIdentity } from './links.mjs';
import { literalAttributes } from './literals.mjs';
import { lowerMdx } from './lower-mdx.mjs';
import { parsePage } from './parse.mjs';
import { semanticContext } from './semantic-context.mjs';

export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

const paragraph = value => ({ type: 'paragraph', children: [{ type: 'text', value }] });
const stable = value => JSON.stringify(value);

export function assembleBundle({ config, lock, pages, context, inputFiles }) {
  const sorted = [...pages].sort((left, right) => compare(left.identity.id, right.identity.id));
  const ids = new Set(sorted.map(page => page.identity.id));
  const urls = new Map(sorted.map(page => [page.identity.canonicalUrl, page.identity]));
  const markdownDestinations = new Set(sorted.map(page => page.identity.markdownPath));
  if (ids.size !== sorted.length || urls.size !== sorted.length || markdownDestinations.size !== sorted.length) {
    throw new Error('Duplicate Store6 route or Markdown destination');
  }

  const outputs = new Map();
  const entries = [];
  const documents = [];
  for (const page of sorted) {
    const tree = lowerMdx(page.tree, context);
    tree.children.unshift(
      { type: 'heading', depth: 1, children: [{ type: 'text', value: page.metadata.title }] },
      paragraph(`Canonical page: ${page.identity.canonicalUrl}`),
      paragraph(`Markdown: ${page.identity.markdownUrl}`),
      paragraph(`Source kind: ${page.provenance.kind}; source path: ${page.provenance.sourcePath}`),
      ...(page.provenance.sourceRevision
        ? [paragraph(`Source revision: ${page.provenance.sourceRevision}`)]
        : []),
      ...(page.metadata.description ? [paragraph(page.metadata.description)] : []),
    );
    rewriteTreeLinks(tree, page.identity.canonicalUrl, urls, config.origin);
    const markdown = toMarkdown(tree, { extensions: [gfmToMarkdown()], fences: true });
    outputs.set(`public${page.identity.markdownPath}`, markdown);
    entries.push({
      id: page.identity.id,
      title: page.metadata.title,
      canonicalUrl: page.identity.canonicalUrl,
      markdownUrl: page.identity.markdownUrl,
      sha256: sha256(markdown),
      provenance: page.provenance,
    });
    documents.push(markdown);
  }

  const manifestBody = {
    schemaVersion: 1,
    origin: config.origin,
    sourceRevision: lock.revision,
    verifiedArtifacts: [],
    pages: entries,
  };
  const inputHashes = [...inputFiles]
    .sort(([left], [right]) => compare(left, right))
    .map(([path, bytes]) => [path, sha256(bytes)]);
  const bundleId = `sha256:${sha256(stable({
    manifest: manifestBody,
    contractVersion: config.contractVersion,
    inputHashes,
  }))}`;
  const manifest = { schemaVersion: 1, bundleId, ...manifestBody };
  outputs.set('public/llms/store6-manifest.json', `${JSON.stringify(manifest, null, 2)}\n`);
  outputs.set(
    'public/llms-full.txt',
    '# Store6 guide corpus\n\n' +
      'Includes Store6 guides and agent setup. Store5 and generated Dokka API HTML are excluded; linked references remain available.\n\n' +
      documents.join('\n---\n\n'),
  );
  return outputs;
}

export async function buildAgentDocs({ root }) {
  const absoluteRoot = resolve(root);
  const rootStat = await lstat(absoluteRoot);
  if (!rootStat.isDirectory() || rootStat.isSymbolicLink()) {
    throw new Error('Invalid agent-doc repository root');
  }

  const inputFiles = new Map();
  async function readInput(path) {
    validateInputPath(path);
    const target = resolve(absoluteRoot, path);
    const rel = relative(absoluteRoot, target);
    if (!rel || rel === '..' || rel.startsWith(`..${sep}`)) {
      throw new Error(`Escaped input: ${path}`);
    }
    let cursor = absoluteRoot;
    for (const part of path.split('/')) {
      cursor = resolve(cursor, part);
      const stat = await lstat(cursor);
      if (stat.isSymbolicLink()) throw new Error(`Symlink input: ${path}`);
    }
    const stat = await lstat(target);
    if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`Non-file input: ${path}`);
    const bytes = await readFile(target);
    inputFiles.set(path, bytes);
    return bytes.toString('utf8');
  }

  const config = JSON.parse(await readInput('scripts/agent-docs/config.json'));
  const lock = JSON.parse(await readInput('evidence/T4-store6-source-lock.json'));
  validateConfiguration(config, lock);

  async function census(directory) {
    validateInputPath(directory);
    const target = resolve(absoluteRoot, directory);
    const stat = await lstat(target);
    if (!stat.isDirectory() || stat.isSymbolicLink()) {
      throw new Error(`Invalid content directory: ${directory}`);
    }
    const found = [];
    for (const entry of await readdir(target, { withFileTypes: true })) {
      const path = `${directory}/${entry.name}`;
      if (entry.isSymbolicLink()) throw new Error(`Symlink content: ${path}`);
      if (entry.isDirectory()) found.push(...await census(path));
      else if (entry.isFile() && path.endsWith('.mdx')) found.push(path);
      else if (entry.isFile() && path.endsWith('.md')) {
        throw new Error(`Add explicit .md support before publishing: ${path}`);
      } else if (!entry.isFile()) {
        throw new Error(`Non-regular content: ${path}`);
      }
    }
    return found.sort(compare);
  }

  const selected = [...config.pages].sort(compare);
  for (const path of selected) pageIdentity(path, config.origin);
  if (JSON.stringify(selected) !== JSON.stringify(await census('content/docs/store6'))) {
    throw new Error('Store6 public-page census differs from export configuration');
  }

  const parsedPages = [];
  for (const sourcePath of selected) {
    const source = await readInput(sourcePath);
    parsedPages.push({ sourcePath, parsed: parsePage(source, sourcePath) });
  }

  const flatten = node => typeof node.value === 'string'
    ? node.value
    : (node.children ?? []).map(flatten).join('');
  const usedDiagrams = new Set();
  const pages = [];
  for (const { sourcePath, parsed } of parsedPages) {
    let recordedAttribution = null;
    function inspect(node) {
      if (node.type === 'emphasis' && parseRecordedSource(flatten(node).trim())) {
        if (recordedAttribution !== null) throw new Error(`Duplicate attribution: ${sourcePath}`);
        recordedAttribution = flatten(node).trim();
      }
      if (node.name === 'StoreDiagram') {
        const { id } = literalAttributes(node, ['id']);
        if (!storeDiagramIds.includes(id)) throw new Error(`Unknown Store diagram: ${id}`);
        usedDiagrams.add(id);
      }
      for (const child of node.children ?? []) inspect(child);
    }
    inspect(parsed.tree);

    const locked = lock.sources.find(entry => entry.target === sourcePath);
    if (locked && (typeof locked.path !== 'string' || !locked.path || !/^[a-f0-9]{64}$/.test(locked.sha256))) {
      throw new Error(`Invalid locked provenance: ${sourcePath}`);
    }
    const provenance = {
      kind: locked ? 'source-synced' : 'site-authored',
      sourcePath: locked?.path ?? sourcePath,
      sourceRevision: locked ? lock.revision : null,
      sourceSha256: locked?.sha256 ?? sha256(inputFiles.get(sourcePath)),
      recordedAttribution,
    };
    pages.push({
      ...parsed,
      identity: pageIdentity(sourcePath, config.origin),
      provenance,
    });
  }

  const diagramInputs = new Map();
  for (const id of [...usedDiagrams].sort(compare)) {
    diagramInputs.set(id, await readInput(`public/diagrams/${id}.html`));
  }

  const extras = [
    'package.json',
    'pnpm-lock.yaml',
    'lib/source-recorded.ts',
    'lib/store-diagrams.ts',
    'components/overview/content/inline.ts',
    'components/overview/content/read-resolution.ts',
    'components/overview/content/support-matrix.ts',
    'components/overview/content/start-here.ts',
  ];
  const agentDocsDirectory = resolve(absoluteRoot, 'scripts/agent-docs');
  const agentDocsStat = await lstat(agentDocsDirectory);
  if (!agentDocsStat.isDirectory() || agentDocsStat.isSymbolicLink()) {
    throw new Error('Invalid agent-doc implementation directory');
  }
  for (const entry of await readdir(agentDocsDirectory, { withFileTypes: true })) {
    if (entry.name.endsWith('.mjs')) {
      if (!entry.isFile() || entry.isSymbolicLink()) {
        throw new Error(`Non-file input: scripts/agent-docs/${entry.name}`);
      }
      extras.push(`scripts/agent-docs/${entry.name}`);
    }
  }
  for (const path of extras.sort(compare)) await readInput(path);

  return assembleBundle({
    config,
    lock,
    pages,
    context: semanticContext(diagramInputs),
    inputFiles,
  });
}

function validateConfiguration(config, lock) {
  if (
    config?.schemaVersion !== 1 ||
    config.contractVersion !== 'store6-agent-docs-v1' ||
    config.origin !== 'https://store.mobilenativefoundation.org' ||
    !Array.isArray(config.pages) ||
    !config.pages.every(path => typeof path === 'string') ||
    new Set(config.pages).size !== config.pages.length ||
    lock?.schemaVersion !== 1 ||
    !/^[a-f0-9]{40}$/.test(lock.revision ?? '') ||
    !Array.isArray(lock.sources)
  ) {
    throw new Error('Invalid export configuration or source lock');
  }
  const targets = new Set();
  for (const entry of lock.sources) {
    if (
      !entry ||
      typeof entry.path !== 'string' ||
      !entry.path ||
      typeof entry.target !== 'string' ||
      !entry.target ||
      !/^[a-f0-9]{64}$/.test(entry.sha256 ?? '') ||
      targets.has(entry.target)
    ) {
      throw new Error('Invalid export configuration or source lock');
    }
    targets.add(entry.target);
  }
}

function validateInputPath(path) {
  if (
    typeof path !== 'string' ||
    path.includes('\\') ||
    path.split('/').some(part => !part || part === '.' || part === '..')
  ) {
    throw new Error(`Unsafe input path: ${path}`);
  }
}

function compare(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}
