#!/usr/bin/env node
/** Bounded S6 runner. Default is read-only preflight; --execute runs all 54 cells once. */
import { spawn, execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { access, lstat, mkdir, readFile, readdir, realpath, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../..');
const hash = value => createHash('sha256').update(value).digest('hex');
const json = async filename => JSON.parse(await readFile(filename, 'utf8'));
const writeJson = (filename, value) => writeFile(filename, `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx' });
const git = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
const exists = async filename => { try { await access(filename); return true; } catch { return false; } };
const inside = (root, filename) => filename !== root && !path.relative(root, filename).startsWith(`..${path.sep}`) && path.relative(root, filename) !== '..' && !path.isAbsolute(path.relative(root, filename));
const quote = value => `'${String(value).replaceAll("'", "'\\''")}'`;
const deadlineMs = 180_000;
const maximumConcurrentSessions = 2;
const fixedRunner = Object.freeze(['npx', '--yes', '@openai/codex@0.153.4', '--disable', 'memories']);

export function parseArgs(args) {
  const result = { execute: false };
  for (let i = 0; i < args.length; i++) {
    const key = args[i];
    if (key === '--execute') { result.execute = true; continue; }
    if (!['--fixtures-root', '--runs-root', '--source-revision', '--bundle-id', '--model', '--provenance'].includes(key)) throw new Error(`Unknown option ${key}`);
    const value = args[++i];
    if (!value || value.startsWith('--')) throw new Error(`Missing value for ${key}`);
    result[key.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] = value;
  }
  for (const key of ['fixturesRoot', 'runsRoot', 'sourceRevision', 'bundleId', 'model']) if (!result[key]) throw new Error(`Required --${key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}`);
  if (!/^[a-f0-9]{40}$/.test(result.sourceRevision)) throw new Error('source-revision must be an immutable 40-character commit');
  if (result.model !== 'gpt-6-astra') throw new Error('Model metadata must match inherited gpt-6-astra protocol');
  result.fixturesRoot = path.resolve(result.fixturesRoot);
  result.runsRoot = path.resolve(result.runsRoot);
  return result;
}

export function validateSchema(value, schema, at = '$') {
  const errors = [];
  const types = Array.isArray(schema.type) ? schema.type : [schema.type];
  const matches = type => type === 'null' ? value === null : type === 'array' ? Array.isArray(value) : type === 'object' ? value !== null && typeof value === 'object' && !Array.isArray(value) : type === 'integer' ? Number.isInteger(value) : typeof value === type;
  if (!types.some(matches)) return [`${at}: expected ${types.join('|')}`];
  if (schema.enum && !schema.enum.includes(value)) errors.push(`${at}: outside enum`);
  if (typeof value === 'number' && ((schema.minimum !== undefined && value < schema.minimum) || (schema.maximum !== undefined && value > schema.maximum))) errors.push(`${at}: outside bounds`);
  if (Array.isArray(value)) value.forEach((item, index) => errors.push(...validateSchema(item, schema.items, `${at}[${index}]`)));
  else if (value !== null && typeof value === 'object') {
    for (const key of schema.required ?? []) if (!Object.hasOwn(value, key)) errors.push(`${at}.${key}: required`);
    for (const [key, item] of Object.entries(value)) {
      if (schema.properties?.[key]) errors.push(...validateSchema(item, schema.properties[key], `${at}.${key}`));
      else if (schema.additionalProperties === false) errors.push(`${at}.${key}: unexpected property`);
    }
  }
  return errors;
}

export async function digestTree(root) {
  const files = {};
  async function walk(directory) {
    for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a, b) => Buffer.compare(Buffer.from(a.name), Buffer.from(b.name)))) {
      const filename = path.join(directory, entry.name);
      if (entry.isSymbolicLink()) throw new Error(`Package symlink is not a frozen copy: ${filename}`);
      if (entry.isDirectory()) await walk(filename);
      else if (entry.isFile()) files[path.relative(root, filename)] = hash(await readFile(filename));
      else throw new Error(`Unsupported package entry: ${filename}`);
    }
  }
  await walk(root);
  const pairs = Object.entries(files).sort(([left], [right]) => Buffer.compare(Buffer.from(left), Buffer.from(right)));
  return { sha256: hash(JSON.stringify(pairs)), algorithm: 'sha256(JSON.stringify(sorted [relativePath, sha256(fileBytes)] pairs)); UTF-8 lexical path order', files: Object.fromEntries(pairs) };
}

export async function installerLockSnapshot(fixture) {
  const lockPath = path.join(fixture, 'skills-lock.json');
  if (!(await lstat(lockPath)).isFile() || await realpath(lockPath) !== lockPath) throw new Error('Installer lock must be a regular fixture file');
  return { path: 'skills-lock.json', sha256: hash(await readFile(lockPath)) };
}

export function candidatePrompt(cell, selectedCase, options, fixture, skill) {
  const identity = { caseId: cell.caseId, arm: cell.arm, replicate: cell.replicate, model: options.model, sourceRevision: options.sourceRevision, bundleId: options.bundleId };
  const canonical = 'https://store.mobilenativefoundation.org';
  const local = 'http://127.0.0.1:3222';
  const pages = selectedCase.publicReferencePaths.map(page => `${canonical}${page} => ${local}${cell.arm === 'html' ? page : page.replace('/docs/', '/llms/') + '.md'}`).join('\n');
  const treatment = cell.arm === 'html'
    ? 'Retrieve the ordinary HTML pages at the local URLs below. Do not retrieve Markdown exports or load any Store6 skill, its instructions, or its helper.'
    : cell.arm === 'markdown'
      ? `Retrieve the discovery index at ${local}/llms.txt and the Markdown pages below. Do not load any Store6 skill, its instructions, or its helper.`
      : `$store6\nExplicitly invoke the installed Store6 skill at ${path.join(skill, 'SKILL.md')}. Follow that installed skill and use its unchanged helper with this per-command local delivery preload:\nnode --import ${quote(path.join(here, 'route-local-docs.mjs'))} ${quote(path.join(skill, 'scripts/get-docs.mjs'))} --source-revision ${quote(options.sourceRevision)} <page-or-task>\nResolve helper arguments from the installed skill. Do not set global NODE_OPTIONS or alter the installed package or manifest. Use the same local Markdown corpus listed below.`;
  return `Cell: ${cell.cellId}\nStructured result identity (model is inherited metadata, not a setting override):\n${JSON.stringify(identity, null, 2)}\n\nTask (exact frozen prompt):\n${selectedCase.prompt}\n\nCommon task scope:\nWork in ${fixture} and preserve its repository instructions. You have 180 seconds for this fresh session. Inspect the library source as needed. Add exactly one Kotlin test file at ${selectedCase.fixture.testPath}, containing your requested implementation and relevant assertions. Write explanation.md explaining your choices and limitations. You may also write result.json. Existing production source, build scripts, dependencies, other tests and installed skills are outside the edit scope. Do not run Gradle; the serialized evaluator owns compilation and test execution. You may suggest ${selectedCase.fixture.command} in explanation.md, but suggestions must not appear as executed commands. Do not read evaluator materials, other fixture roots, previous cells, reviewer outputs, ambient Store6 advice or memory. Common repository instructions and source inspection remain allowed. Do not spawn agents. Local documentation retrieval may need the ordinary require_escalated approval path.\n\nDocumentation delivery:\n${treatment}\nReference pages (canonical citation URL => delivery URL):\n${pages}\nUse canonical HTTPS documentation URLs in citations. Report only retrieval, commands and verification you actually performed. If you collect document hashes, report the actual response-byte hash and corresponding canonical/local URL; do not invent them.\n\nReturn JSON conforming to the supplied output schema. artifactPaths must include the permitted Kotlin test and explanation.md, as paths within this fixture to real files. commands must describe actual tool requests only, with actual command text/status. For a pre-start rejection use started=false and exitCode=null. Missing execution stays unverified; source inspection does not establish compilation or behavior. Independent reviewer scores are not requested.\n`;
}

export function traceObservations(raw) {
  const events = [], malformedLines = [], commands = [], urls = [];
  let usage = null;
  for (const [index, line] of raw.split('\n').entries()) {
    if (!line.trim()) continue;
    let event;
    try { event = JSON.parse(line); } catch { malformedLines.push(index + 1); continue; }
    const pointer = `session.jsonl:${index + 1}`;
    events.push({ pointer, event });
    if (event.type === 'turn.completed' && event.usage) usage = event.usage;
    if (event.item?.type === 'command_execution') commands.push({ pointer, eventType: event.type, command: event.item.command, status: event.item.status, exitCode: event.item.exit_code ?? null, output: event.item.aggregated_output ?? null });
    // URLs in traces may be echoed prompt/output. They are references, not proof of delivery.
    for (const match of JSON.stringify(event.item ?? {}).matchAll(/https?:\/\/[^\s"<>\\]+/g)) {
      if (/store\.mobilenativefoundation\.org|127\.0\.0\.1:3222/.test(match[0])) urls.push({ pointer, url: match[0], evidenceLevel: 'trace-reference-only', responseSha256: null });
    }
  }
  return { events, malformedLines, commands, urls, usage };
}

export function correlateCommands(submitted, observed) {
  return submitted.map(command => {
    const matches = observed.filter(item => item.command === command.text);
    const completed = matches.filter(item => item.eventType === 'item.completed');
    // A failed command event alone cannot distinguish tool startup rejection from shell failure.
    const confirmed = command.started === true && completed.some(item => Number.isInteger(item.exitCode) && item.exitCode === command.exitCode);
    return { submitted: command, tracePointers: matches.map(item => item.pointer), status: confirmed ? 'completed-command-and-exit-correlated' : matches.length ? 'request-observed-status-unverified' : 'unverified-no-exact-command-match' };
  });
}

async function statusPaths(fixture) {
  return [...new Set([...git(fixture, 'diff', '--name-only', '-z', 'HEAD').split('\0'), ...git(fixture, 'ls-files', '--others', '--exclude-standard', '-z').split('\0')].filter(Boolean))].sort();
}

export async function inspectArtifacts(fixture, selectedCase, result) {
  const required = [selectedCase.fixture.testPath, 'explanation.md'];
  const allowed = new Set([...required, 'result.json']);
  const issues = [], artifacts = [];
  const paths = await statusPaths(fixture);
  const outOfScope = paths.filter(filename => !allowed.has(filename));
  for (const filename of [...new Set([...required, ...(Array.isArray(result?.artifactPaths) ? result.artifactPaths.filter(item => typeof item === 'string') : [])])]) {
    const absolute = path.resolve(fixture, filename);
    if (!inside(fixture, absolute)) { issues.push(`Artifact outside fixture: ${filename}`); continue; }
    try {
      if (!inside(fixture, await realpath(absolute)) || !(await lstat(absolute)).isFile()) throw new Error('not a regular file inside fixture');
      const relative = path.relative(fixture, absolute);
      if (!allowed.has(relative)) issues.push(`Artifact outside permitted output scope: ${filename}`);
      const bytes = await readFile(absolute);
      if (!artifacts.some(artifact => artifact.path === relative)) artifacts.push({ path: relative, sha256: hash(bytes), bytes: bytes.length });
      if (!bytes.length) issues.push(`Empty artifact: ${filename}`);
    } catch (error) { issues.push(`Missing/invalid artifact ${filename}: ${error.message}`); }
  }
  if (Array.isArray(result?.artifactPaths)) for (const requiredPath of required) if (!result.artifactPaths.some(item => typeof item === 'string' && path.resolve(fixture, item) === path.join(fixture, requiredPath))) issues.push(`Required artifact absent from result: ${requiredPath}`);
  return { changedPaths: paths, outOfScope, artifacts, issues };
}

const owned = new Set();
function killGroup(pid, signal) {
  if (!owned.has(pid)) return;
  try { process.kill(-pid, signal); } catch (error) { if (error.code !== 'ESRCH') throw error; }
}

export async function runProcess(argv, cwd, prompt, destination, allowanceMs = deadlineMs) {
  const startedAt = new Date().toISOString();
  const started = performance.now();
  const stdout = createWriteStream(path.join(destination, 'session.jsonl'), { flags: 'wx' });
  const stderr = createWriteStream(path.join(destination, 'stderr.log'), { flags: 'wx' });
  const child = spawn(argv[0], argv.slice(1), { cwd, detached: true, env: process.env, stdio: ['pipe', 'pipe', 'pipe'] });
  let timedOut = false, spawnError = null, killTimer;
  if (child.pid) owned.add(child.pid);
  child.stdout.pipe(stdout); child.stderr.pipe(stderr);
  child.stdin.on('error', error => { if (error.code !== 'EPIPE') spawnError = error.message; });
  child.stdin.end(prompt);
  const timer = setTimeout(() => {
    timedOut = true;
    killGroup(child.pid, 'SIGTERM');
    killTimer = setTimeout(() => killGroup(child.pid, 'SIGKILL'), 2000);
  }, allowanceMs);
  const outcome = await new Promise(resolve => {
    child.on('error', error => { spawnError = error.message; });
    child.on('close', (exitCode, signal) => resolve({ exitCode, signal }));
  });
  clearTimeout(timer);
  if (timedOut) killGroup(child.pid, 'SIGKILL');
  clearTimeout(killTimer);
  owned.delete(child.pid);
  await Promise.all([stdout, stderr].map(stream => stream.writableFinished ? Promise.resolve() : new Promise((resolve, reject) => { stream.on('finish', resolve); stream.on('error', reject); })));
  return { startedAt, processId: child.pid ?? null, finishedAt: new Date().toISOString(), elapsedSeconds: (performance.now() - started) / 1000, allowanceSeconds: allowanceMs / 1000, timedOut, spawnError, ...outcome };
}

export async function validateProvenance(provenance, identity) {
  const expected = {
    client: { version: '0.153.4' },
    settings: { model: 'gpt-6-astra', reasoningEffort: 'ultra', inherited: true },
    installer: { version: '1.5.24' },
    docsHttp: { status: 'passed', origin: 'http://127.0.0.1:3222' },
    helperPositive: { status: 'passed', ...identity },
    helperNegative: { errorCode: 'CONTENT_MISMATCH', stdoutEmpty: true, packageUnchanged: true },
    cleanContext: { status: 'passed', memoriesDisabled: true, store6MemoryObserved: false },
  };
  const object = properties => ({ type: 'object', additionalProperties: false, required: Object.keys(properties), properties });
  const schema = object(Object.fromEntries(Object.entries(expected).map(([section, fields]) => [section, object({
    ...Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, { type: typeof value, enum: [value] }])),
    trace: { type: 'string' },
  })])));
  const errors = validateSchema(provenance, schema);
  if (errors.length) throw new Error(`Invalid provenance: ${errors.join('; ')}`);
  const evidence = {};
  for (const [section, record] of Object.entries(provenance)) {
    try {
      if (!path.isAbsolute(record.trace) || !(await lstat(record.trace)).isFile()) throw new Error('trace must be an absolute regular file');
      const bytes = await readFile(record.trace);
      if (!bytes.length) throw new Error('trace is empty');
      evidence[section] = { path: record.trace, sha256: hash(bytes), bytes: bytes.length };
    } catch (error) { throw new Error(`Invalid provenance ${section} trace: ${error.message}`); }
  }
  return { status: 'required-identities-and-trace-files-validated', evidence, limitation: 'Trace meaning and observed outcomes are owner-attested; file checks do not independently establish the claims.' };
}

export async function snapshotCorpus(publicRoot, identity, expected = null) {
  const corpusPath = path.join(publicRoot, 'llms/store6-manifest.json');
  const bytes = await readFile(corpusPath);
  const manifestSha256 = hash(bytes);
  if (expected && manifestSha256 !== expected.manifestSha256) throw new Error('Local corpus manifest changed from frozen snapshot');
  const corpus = JSON.parse(bytes);
  if (corpus.sourceRevision !== identity.sourceRevision || corpus.bundleId !== identity.bundleId) throw new Error('Local corpus identity differs from requested source/bundle');
  if (!Array.isArray(corpus.pages) || !corpus.pages.length) throw new Error('Local corpus manifest has no pages');
  for (const page of corpus.pages) {
    const url = new URL(page.markdownUrl);
    const filename = path.resolve(publicRoot, '.' + url.pathname);
    if (!inside(publicRoot, filename) || hash(await readFile(filename)) !== page.sha256) throw new Error(`Local corpus page bytes differ from manifest: ${page.id}`);
  }
  // Detect a concurrent manifest replacement during the page scan too.
  if (hash(await readFile(corpusPath)) !== manifestSha256) throw new Error('Local corpus manifest changed during snapshot');
  return { manifestSha256, bundleId: corpus.bundleId, sourceRevision: corpus.sourceRevision, pageCount: corpus.pages.length, evidenceLevel: 'local-generated-file-hashes; candidate delivery requires trace review' };
}

export function createCorpusGuard(checkSnapshot) {
  let failure = null;
  return {
    get failure() { return failure; },
    async check() {
      // Still read each time so every completed cell and matrix end get an actual recheck.
      let observation = null;
      try { observation = await checkSnapshot(); }
      catch (error) { failure ??= { detectedAt: new Date().toISOString(), reason: error.message }; }
      return { checkedAt: new Date().toISOString(), status: failure ? 'invalid-corpus-drift' : 'unchanged', failure, observation };
    },
  };
}

async function preflight(options) {
  const cases = await json(path.join(here, 'cases.json'));
  if (cases.cells.length !== 54 || new Set(cases.cells.map(cell => cell.cellId)).size !== 54) throw new Error('Expected 54 unique frozen cells');
  if (await exists(options.runsRoot)) throw new Error('runs-root already exists; preserve it and use a new run identity, never overwrite or resume');
  const ignoredRoot = path.join(repo, 'evidence/agent-docs-runs');
  if (!inside(ignoredRoot, options.runsRoot)) throw new Error(`runs-root must be a new directory below ${ignoredRoot}`);
  git(repo, 'check-ignore', path.join(options.runsRoot, 'probe.json'));
  const frozen = {};
  for (const filename of ['cases.json', 'rubric.md', 'result.schema.json', 'route-local-docs.mjs', 'run.mjs']) frozen[filename] = hash(await readFile(path.join(here, filename)));
  const fixtures = [];
  for (const cell of cases.cells) {
    const fixture = path.join(options.fixturesRoot, cell.cellId);
    if (await realpath(fixture) !== fixture) throw new Error(`Fixture must use its canonical path: ${fixture}`);
    if (git(fixture, 'rev-parse', 'HEAD').trim() !== options.sourceRevision) throw new Error(`Wrong fixture source: ${cell.cellId}`);
    for (const item of cases.cases) if (await exists(path.join(fixture, item.fixture.testPath))) throw new Error(`Pre-existing candidate test: ${cell.cellId}/${item.fixture.testPath}`);
    for (const filename of ['explanation.md', 'result.json']) if (await exists(path.join(fixture, filename))) throw new Error(`Pre-existing output: ${cell.cellId}/${filename}`);
    const skill = path.join(fixture, '.agents/skills/store6');
    let skillDigest = null;
    if (cell.arm === 'skill') {
      await access(path.join(skill, 'SKILL.md'));
      const paired = await json(path.join(skill, 'references/docs-manifest.json'));
      if (paired.sourceRevision !== options.sourceRevision || paired.bundleId !== options.bundleId) throw new Error(`Installed skill pairing mismatch: ${cell.cellId}`);
      skillDigest = await digestTree(skill);
    }
    else if (await exists(path.join(fixture, '.agents/skills/store6'))) throw new Error(`Baseline fixture contains Store6 skill: ${cell.cellId}`);
    let installerLock = null;
    if (cell.arm === 'skill') {
      installerLock = await installerLockSnapshot(fixture);
    }
    const startingStatus = git(fixture, 'status', '--porcelain=v1', '--untracked-files=all');
    const changed = await statusPaths(fixture);
    if (changed.some(filename => !(cell.arm === 'skill' && (filename.startsWith('.agents/skills/store6/') || filename === 'skills-lock.json')))) throw new Error(`Fixture has pre-existing changes outside installed skill: ${cell.cellId}`);
    fixtures.push({ ...cell, fixture, skill: cell.arm === 'skill' ? skill : null, skillDigest, installerLock, startingStatus, sourceRevision: options.sourceRevision, repositoryInstructions: await exists(path.join(fixture, 'AGENTS.md')) ? hash(await readFile(path.join(fixture, 'AGENTS.md'))) : null });
  }
  const skillHashes = new Set(fixtures.filter(item => item.skillDigest).map(item => item.skillDigest.sha256));
  if (skillHashes.size !== 1) throw new Error('Skill fixtures have different package digests');
  if (new Set(fixtures.map(item => item.repositoryInstructions)).size !== 1) throw new Error('Root repository instructions differ between fixtures');
  const corpusIdentity = await snapshotCorpus(path.join(repo, 'public'), options);
  return { cases, frozen, fixtures, corpusIdentity };
}

export function candidateArgv(fixture, resultPath) {
  return [...fixedRunner, 'exec', '--ephemeral', '--approve-for-me', '--skip-git-repo-check', '--cd', fixture, '--json', '--output-schema', path.join(here, 'result.schema.json'), '--output-last-message', resultPath, '-'];
}

async function runCell(cell, selectedCase, options, schema) {
  const destination = path.join(options.runsRoot, cell.cellId);
  await mkdir(destination);
  const prompt = candidatePrompt(cell, selectedCase, options, cell.fixture, cell.skill);
  await writeFile(path.join(destination, 'prompt.txt'), prompt, { flag: 'wx' });
  await writeJson(path.join(destination, 'start.json'), { ...cell, promptSha256: hash(prompt), independentReview: 'unverified', compilation: 'unverified', behavior: 'unverified' });
  const argv = candidateArgv(cell.fixture, path.join(destination, 'candidate-result.json'));
  await writeJson(path.join(destination, 'invocation.json'), { argv, cwd: cell.fixture, environment: 'inherited unchanged; values not copied', memoryDelivery: 'disabled per invocation via --disable memories; clean-context preflight required', approvalMode: 'auto-review via --approve-for-me', sandbox: 'workspace-write (implicit in --approve-for-me)', modelOverride: null, effortOverride: null });
  const execution = await runProcess(argv, cell.fixture, prompt, destination);
  await writeJson(path.join(destination, 'execution.json'), execution);
  const observations = traceObservations(await readFile(path.join(destination, 'session.jsonl'), 'utf8'));
  let result = null;
  const issues = [];
  try { result = await json(path.join(destination, 'candidate-result.json')); issues.push(...validateSchema(result, schema)); }
  catch (error) { issues.push(`Structured result unavailable: ${error.message}`); }
  if (result) for (const [key, expected] of Object.entries({ caseId: cell.caseId, arm: cell.arm, replicate: cell.replicate, model: options.model, sourceRevision: options.sourceRevision, bundleId: options.bundleId })) if (result[key] !== expected) issues.push(`Identity mismatch ${key}: expected ${expected}`);
  const artifacts = await inspectArtifacts(cell.fixture, selectedCase, result);
  // The frozen installed package is an allowed pre-existing fixture, never a candidate artifact.
  artifacts.outOfScope = artifacts.outOfScope.filter(filename => !(cell.arm === 'skill' && (filename.startsWith('.agents/skills/store6/') || filename === 'skills-lock.json')));
  let installerLockAfter = null;
  if (cell.installerLock) {
    try {
      installerLockAfter = await installerLockSnapshot(cell.fixture);
      if (installerLockAfter.sha256 !== cell.installerLock.sha256) issues.push('Installer lock changed during cell');
    } catch (error) { issues.push(`Installer lock unavailable after cell: ${error.message}`); }
  }
  let skillAfter = null;
  if (cell.skill) {
    try { skillAfter = await digestTree(cell.skill); if (skillAfter.sha256 !== cell.skillDigest.sha256) issues.push('Installed skill package changed during cell'); }
    catch (error) { issues.push(`Installed skill package unavailable after cell: ${error.message}`); }
  }
  if (git(cell.fixture, 'rev-parse', 'HEAD').trim() !== options.sourceRevision) issues.push('Fixture HEAD changed during cell');
  if (artifacts.outOfScope.length) issues.push('Candidate changed paths outside task scope');
  await writeFile(path.join(destination, 'tracked.diff'), git(cell.fixture, 'diff', '--binary', 'HEAD'), { flag: 'wx' });
  await writeFile(path.join(destination, 'ending-status.txt'), git(cell.fixture, 'status', '--porcelain=v1', '--untracked-files=all'), { flag: 'wx' });
  for (const artifact of artifacts.artifacts) {
    const filename = path.join(destination, 'artifacts', artifact.path);
    await mkdir(path.dirname(filename), { recursive: true });
    await writeFile(filename, await readFile(path.join(cell.fixture, artifact.path)), { flag: 'wx' });
  }
  const commandCorrelation = correlateCommands(Array.isArray(result?.commands) ? result.commands : [], observations.commands);
  const audit = {
    ...cell, skillAfter, installerLockAfter, execution, tokenUsage: observations.usage,
    resultValidation: { schemaAndIdentityIssues: issues, artifactIssues: artifacts.issues, ...artifacts },
    commandCorrelation, observedCommands: observations.commands, documentationReferences: observations.urls,
    malformedTraceLines: observations.malformedLines,
    traceAudit: 'requires independent review for source reads, documentation delivery, skill activation, ambient context and contamination; URL references alone do not establish retrieval',
    independentReview: 'unverified', compilation: 'unverified', behavior: 'unverified',
    outcome: 'candidate evidence retained; no automatic success score', replacementOf: null,
  };
  await writeJson(path.join(destination, 'audit.json'), audit);
  return { cellId: cell.cellId, execution, issues: [...issues, ...artifacts.issues], tokenUsage: observations.usage, independentReview: 'unverified', compilation: 'unverified', behavior: 'unverified' };
}

export async function main(args = process.argv.slice(2)) {
  const options = parseArgs(args);
  const prepared = await preflight(options);
  if (!options.execute) {
    process.stdout.write(`${JSON.stringify({ mode: 'preflight-only-no-candidates-started', options, cells: prepared.fixtures.map(item => ({ cellId: item.cellId, fixture: item.fixture, skillSha256: item.skillDigest?.sha256 ?? null })), frozen: prepared.frozen, corpusIdentity: prepared.corpusIdentity, maximumConcurrentSessions, allowanceSeconds: deadlineMs / 1000, prerequisites: 'Run owner must attest client tools, inherited settings, local delivery and altered-content rejection before --execute.' }, null, 2)}\n`);
    return;
  }
  if (!options.provenance) throw new Error('--execute requires --provenance JSON recording client/tool/content preflight and settings evidence');
  const provenance = await json(options.provenance);
  const provenanceValidation = await validateProvenance(provenance, { sourceRevision: options.sourceRevision, bundleId: options.bundleId, packageSha256: prepared.fixtures.find(cell => cell.skillDigest).skillDigest.sha256 });
  await mkdir(options.runsRoot, { recursive: true });
  const schema = await json(path.join(here, 'result.schema.json'));
  await writeJson(path.join(options.runsRoot, 'run.json'), {
    runId: path.basename(options.runsRoot), startedAt: new Date().toISOString(), options,
    sourceRevision: options.sourceRevision, bundleId: options.bundleId,
    docsRevision: git(repo, 'rev-parse', 'HEAD').trim(), docsWorkingTreeStatus: git(repo, 'status', '--porcelain=v1', '--untracked-files=all'),
    frozen: prepared.frozen, corpusIdentity: prepared.corpusIdentity, skillPackageSha256: prepared.fixtures.find(cell => cell.skillDigest).skillDigest.sha256,
    memoryDelivery: 'disabled per invocation via --disable memories; clean-context preflight required', approvalMode: 'auto-review via --approve-for-me', sandbox: 'workspace-write (implicit in --approve-for-me)',
    inheritedModel: options.model, inheritedSettings: 'not overridden; see owner provenance',
    provenance, provenanceValidation, provenanceSha256: hash(await readFile(options.provenance)),
    promptTemplateSha256: hash(candidatePrompt.toString()), cells: prepared.cases.cells,
    wallClockSecondsPerSession: deadlineMs / 1000, maximumConcurrentSessions,
    serializedGradleOwner: 'external run owner; this runner and candidates must not execute Gradle',
    isolation: 'fresh disposable fixture and ephemeral session; task restrictions are not host filesystem isolation',
  });
  const interrupt = signal => { for (const pid of owned) killGroup(pid, 'SIGKILL'); process.exit(signal === 'SIGINT' ? 130 : 143); };
  process.once('SIGINT', interrupt); process.once('SIGTERM', interrupt);
  const summaries = new Array(prepared.fixtures.length);
  const activeCells = new Set(), invalidCells = new Set(), startedCells = new Set();
  const corpusGuard = createCorpusGuard(() => snapshotCorpus(path.join(repo, 'public'), options, prepared.corpusIdentity));
  let next = 0;
  async function checkCorpus(currentCell = null) {
    const check = await corpusGuard.check();
    if (check.status === 'invalid-corpus-drift') {
      for (const cellId of activeCells) invalidCells.add(cellId);
      if (currentCell) invalidCells.add(currentCell);
    }
    return check;
  }
  async function worker() {
    while (next < prepared.fixtures.length) {
      if ((await checkCorpus()).status !== 'unchanged') break;
      // Another worker may detect drift while this worker's read was pending.
      if (corpusGuard.failure || next >= prepared.fixtures.length) break;
      const index = next++, cell = prepared.fixtures[index];
      activeCells.add(cell.cellId); startedCells.add(cell.cellId);
      process.stdout.write(`${JSON.stringify({ event: 'cell-start', cellId: cell.cellId, time: new Date().toISOString() })}\n`);
      try { summaries[index] = await runCell(cell, prepared.cases.cases.find(item => item.id === cell.caseId), options, schema); }
      catch (error) {
        const executionPath = path.join(options.runsRoot, cell.cellId, 'execution.json');
        const execution = await exists(executionPath) ? await json(executionPath) : null;
        summaries[index] = { cellId: cell.cellId, execution, harnessError: error.stack, independentReview: 'unverified', compilation: 'unverified', behavior: 'unverified' };
        await writeJson(path.join(options.runsRoot, `${cell.cellId}.harness-error.json`), summaries[index]);
      }
      const corpusCheck = await checkCorpus(cell.cellId);
      summaries[index].corpusCheck = corpusCheck;
      await writeJson(path.join(options.runsRoot, `${cell.cellId}.corpus-check.json`), corpusCheck);
      activeCells.delete(cell.cellId);
      process.stdout.write(`${JSON.stringify({ event: 'cell-finish', cellId: cell.cellId, time: new Date().toISOString(), ...summaries[index] })}\n`);
    }
  }
  await Promise.all(Array.from({ length: maximumConcurrentSessions }, worker));
  const failureBeforeFinal = corpusGuard.failure;
  const finalCorpusCheck = await checkCorpus();
  // A newly observed end-of-run drift has an unknown onset: conservatively invalidate all started cells.
  if (!failureBeforeFinal && corpusGuard.failure) for (const cellId of startedCells) invalidCells.add(cellId);
  process.removeListener('SIGINT', interrupt); process.removeListener('SIGTERM', interrupt);
  for (const [index, cell] of prepared.fixtures.entries()) {
    if (!summaries[index]) summaries[index] = { cellId: cell.cellId, execution: null, status: 'not-started-corpus-drift', independentReview: 'unverified', compilation: 'unverified', behavior: 'unverified' };
    else if (invalidCells.has(cell.cellId)) summaries[index].status = 'invalid-corpus-drift';
    else summaries[index].status = 'evidence-retained-unreviewed';
  }
  await writeJson(path.join(options.runsRoot, 'corpus-integrity.json'), { finalCorpusCheck, invalidCellIds: [...invalidCells], note: 'This integrity record and final summary supersede earlier cell integrity observations when drift is detected later.' });
  await writeJson(path.join(options.runsRoot, 'summary.json'), {
    finishedAt: new Date().toISOString(), plannedCellCount: prepared.fixtures.length,
    attemptedCellCount: startedCells.size, startedSessionCount: summaries.filter(item => item.execution?.processId).length, finishedCellRecordCount: startedCells.size,
    notStartedCellCount: prepared.fixtures.length - startedCells.size,
    status: corpusGuard.failure ? 'stopped-invalid-corpus-drift' : 'all-candidate-evidence-retained-unreviewed',
    summaries, independentReview: 'unverified', compilation: 'unverified', behavior: 'unverified', reruns: 0,
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(error => { process.stderr.write(`${error.stack}\n`); process.exitCode = 1; });
