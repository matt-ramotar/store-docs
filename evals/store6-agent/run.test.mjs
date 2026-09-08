import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { candidateArgv, candidatePrompt, correlateCommands, digestTree, installerLockSnapshot, parseArgs, runProcess, traceObservations, validateSchema, validateProvenance, snapshotCorpus, createCorpusGuard } from './run.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const cases = JSON.parse(await readFile(path.join(here, 'cases.json')));
const schema = JSON.parse(await readFile(path.join(here, 'result.schema.json')));
const options = { model: 'inherited-model', sourceRevision: 'a'.repeat(40), bundleId: 'bundle' };
const result = { caseId: 'first-store', arm: 'html', replicate: 1, ...options, artifactPaths: ['test.kt', 'explanation.md'], citations: [], commands: [], verificationStatus: 'unverified', limitations: [] };

test('schema catches identity-shaped mistakes and nested command errors', () => {
  assert.deepEqual(validateSchema(result, schema), []);
  const invalid = { ...result, replicate: 4, extra: true, commands: [{ text: 'cmd', started: 'yes', exitCode: 1.5 }] };
  const errors = validateSchema(invalid, schema);
  for (const property of ['replicate', 'extra', 'started', 'exitCode']) assert(errors.some(error => error.includes(property)));
  assert(validateSchema(null, schema).length);
});

test('all frozen prompts remain verbatim and each treatment receives only its delivery instructions', () => {
  for (const cell of cases.cells) {
    const selected = cases.cases.find(item => item.id === cell.caseId);
    const prompt = candidatePrompt(cell, selected, options, '/fixture', '/fixture/.agents/skills/store6');
    assert(prompt.includes(`Task (exact frozen prompt):\n${selected.prompt}\n\n`));
    assert(prompt.includes(selected.fixture.testPath));
    assert(prompt.includes('Local documentation retrieval may need the ordinary require_escalated approval path.'));
    assert(!prompt.includes('rubric.md'));
    assert.equal(prompt.includes('$store6'), cell.arm === 'skill');
    assert.equal(prompt.includes('--import'), cell.arm === 'skill');
    assert.equal(prompt.includes('/llms/store6/'), cell.arm !== 'html');
    assert.equal(prompt.includes('127.0.0.1:3222/llms.txt'), cell.arm === 'markdown');
    for (const other of cases.cases.filter(item => item.id !== selected.id)) assert(!prompt.includes(other.prompt));
  }
});

test('runner defaults preserve model/settings and require explicit immutable identity', () => {
  const args = ['--fixtures-root', '/tmp/fixtures', '--runs-root', '/tmp/runs', '--source-revision', 'a'.repeat(40), '--bundle-id', 'bundle', '--model', 'gpt-6-astra'];
  const parsed = parseArgs(args);
  assert.equal(parsed.execute, false);
  assert.equal(Object.hasOwn(parsed, 'runner'), false);
  assert.throws(() => parseArgs([...args, '--runner', '["codex","--model","other"]']), /Unknown option/);
  assert.throws(() => parseArgs([...args, '--resume']), /Unknown option/);
  assert.throws(() => parseArgs([...args, '--skill-source', '/other']), /Unknown option/);
  assert.throws(() => parseArgs(args.map(value => value === 'a'.repeat(40) ? 'main' : value)), /immutable/);
});

test('trace URLs do not become delivery/hash evidence and missing usage remains unavailable', () => {
  const raw = [
    JSON.stringify({ type: 'item.started', item: { type: 'command_execution', command: 'curl http://127.0.0.1:3222/docs/store6/quickstart', status: 'in_progress' } }),
    JSON.stringify({ type: 'item.completed', item: { type: 'command_execution', command: 'false', status: 'completed', exit_code: 1, aggregated_output: '' } }),
    'not-json',
  ].join('\n');
  const observation = traceObservations(raw);
  assert.equal(observation.usage, null);
  assert.deepEqual(observation.malformedLines, [3]);
  assert.equal(observation.urls[0].evidenceLevel, 'trace-reference-only');
  assert.equal(observation.urls[0].responseSha256, null);
  const correlation = correlateCommands([
    { text: 'false', started: true, exitCode: 1 },
    { text: 'false', started: false, exitCode: null },
    { text: 'suggested Gradle command', started: true, exitCode: 0 },
  ], observation.commands);
  assert.equal(correlation[0].status, 'completed-command-and-exit-correlated');
  assert.equal(correlation[1].status, 'request-observed-status-unverified');
  assert.equal(correlation[2].status, 'unverified-no-exact-command-match');
});

test('package digest is path-independent and changes with installed bytes', async t => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 's6-harness-package-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  await mkdir(path.join(directory, 'references'));
  await writeFile(path.join(directory, 'SKILL.md'), 'skill');
  await writeFile(path.join(directory, 'references', 'pin.json'), 'pin');
  const initial = await digestTree(directory);
  const sha = text => createHash('sha256').update(text).digest('hex');
  assert.equal(initial.sha256, sha(JSON.stringify([['SKILL.md', sha('skill')], ['references/pin.json', sha('pin')]])));
  await writeFile(path.join(directory, 'references', 'pin.json'), 'changed');
  assert.notEqual((await digestTree(directory)).sha256, initial.sha256);
});

test('managed process retains output and timeout status without executing a candidate', async t => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 's6-harness-process-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const normal = path.join(directory, 'normal');
  await mkdir(normal);
  const completed = await runProcess([process.execPath, '-e', 'process.stdin.resume();process.stdin.on("end",()=>{process.stdout.write("retained output\\n");process.stderr.write("retained error\\n")})'], directory, 'prompt', normal, 5000);
  assert.equal(completed.exitCode, 0);
  assert.equal(completed.timedOut, false);
  assert.equal(await readFile(path.join(normal, 'session.jsonl'), 'utf8'), 'retained output\n');
  assert.equal(await readFile(path.join(normal, 'stderr.log'), 'utf8'), 'retained error\n');
  const overdue = path.join(directory, 'overdue');
  await mkdir(overdue);
  const timeout = await runProcess([process.execPath, '-e', 'setInterval(()=>{},1000)'], directory, '', overdue, 100);
  assert.equal(timeout.timedOut, true);
  assert.equal(timeout.signal, 'SIGTERM');
  assert(timeout.elapsedSeconds < 4);
});

test('candidate invocation uses normal automatic review and its implicit workspace-write mode', () => {
  const argv = candidateArgv('/fixture', '/records/result.json');
  assert.deepEqual(argv.slice(0, 9), ['npx', '--yes', '@openai/codex@0.153.4', '--disable', 'memories', 'exec', '--ephemeral', '--approve-for-me', '--skip-git-repo-check']);
  assert.equal(argv.includes('--sandbox'), false);
  assert.equal(argv.includes('--model'), false);
  assert.equal(argv.includes('--config'), false);
  assert.equal(argv[argv.indexOf('--cd') + 1], '/fixture');
  assert.equal(argv[argv.indexOf('--output-last-message') + 1], '/records/result.json');
  assert.equal(argv.at(-1), '-');
});

test('installer lock snapshots detect changed bytes and reject redirected files', async t => {
  const directory = await realpath(await mkdtemp(path.join(os.tmpdir(), 's6-harness-lock-')));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const lockPath = path.join(directory, 'skills-lock.json');
  await assert.rejects(installerLockSnapshot(directory), /ENOENT/);
  await writeFile(lockPath, '{"version":1}');
  const first = await installerLockSnapshot(directory);
  assert.equal(first.path, 'skills-lock.json');
  await writeFile(lockPath, '{"version":2}');
  assert.notEqual((await installerLockSnapshot(directory)).sha256, first.sha256);
  await rm(lockPath);
  await writeFile(path.join(directory, 'other.json'), '{}');
  await symlink('other.json', lockPath);
  await assert.rejects(installerLockSnapshot(directory), /regular fixture file/);
});

test('provenance requires exact observed identities, clean context and existing evidence files', async t => {
  const directory = await realpath(await mkdtemp(path.join(os.tmpdir(), 's6-harness-provenance-')));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const trace = path.join(directory, 'trace.log');
  await writeFile(trace, 'retained preflight evidence');
  const identity = { sourceRevision: 'a'.repeat(40), bundleId: 'bundle', packageSha256: 'b'.repeat(64) };
  const valid = {
    client: { version: '0.153.4', trace },
    settings: { model: 'gpt-6-astra', reasoningEffort: 'ultra', inherited: true, trace },
    installer: { version: '1.5.24', trace },
    docsHttp: { status: 'passed', origin: 'http://127.0.0.1:3222', trace },
    helperPositive: { status: 'passed', ...identity, trace },
    helperNegative: { errorCode: 'CONTENT_MISMATCH', stdoutEmpty: true, packageUnchanged: true, trace },
    cleanContext: { status: 'passed', memoriesDisabled: true, store6MemoryObserved: false, trace },
  };
  await assert.rejects(validateProvenance({}, identity), /provenance/);
  for (const [section, field, wrong] of [['client', 'version', '0.149'], ['settings', 'reasoningEffort', 'high'], ['helperPositive', 'bundleId', 'other'], ['helperPositive', 'packageSha256', 'c'.repeat(64)], ['cleanContext', 'store6MemoryObserved', true], ['helperNegative', 'stdoutEmpty', false]]) {
    const invalid = structuredClone(valid); invalid[section][field] = wrong;
    await assert.rejects(validateProvenance(invalid, identity), /provenance/);
  }
  const invalidTrace = structuredClone(valid); invalidTrace.client.trace = path.join(directory, 'missing');
  await assert.rejects(validateProvenance(invalidTrace, identity), /trace/);
  const validated = await validateProvenance(valid, identity);
  assert.equal(validated.evidence.client.bytes, 27);
  assert.match(validated.evidence.client.sha256, /^[a-f0-9]{64}$/);
  await writeFile(trace, '');
  await assert.rejects(validateProvenance(valid, identity), /empty/);
});

test('corpus guard latches drift even after bytes are restored', async t => {
  const directory = await realpath(await mkdtemp(path.join(os.tmpdir(), 's6-harness-corpus-')));
  t.after(() => rm(directory, { recursive: true, force: true }));
  await mkdir(path.join(directory, 'llms/store6'), { recursive: true });
  const page = path.join(directory, 'llms/store6/page.md');
  const manifest = path.join(directory, 'llms/store6-manifest.json');
  const sha = text => createHash('sha256').update(text).digest('hex');
  await writeFile(page, 'original');
  await writeFile(manifest, JSON.stringify({ sourceRevision: 'a'.repeat(40), bundleId: 'bundle', pages: [{ id: 'page', markdownUrl: 'https://store.mobilenativefoundation.org/llms/store6/page.md', sha256: sha('original') }] }));
  const initial = await snapshotCorpus(directory, options);
  const guard = createCorpusGuard(() => snapshotCorpus(directory, options, initial));
  assert.equal((await guard.check()).status, 'unchanged');
  await writeFile(page, 'changed');
  assert.equal((await guard.check()).status, 'invalid-corpus-drift');
  await writeFile(page, 'original');
  assert.equal((await guard.check()).status, 'invalid-corpus-drift');
  await writeFile(manifest, (await readFile(manifest, 'utf8')) + '\n');
  await assert.rejects(snapshotCorpus(directory, options, initial), /manifest/);
});
