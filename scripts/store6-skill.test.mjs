import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { listPages, retrieveDocs } from '../skills/store6/scripts/retrieve.mjs';

const origin = 'https://store.mobilenativefoundation.org';
const markdown = '# Quickstart\n\nA Unicode key: café.\n';
const pinned = {
  schemaVersion: 1,
  bundleId: `sha256:${'a'.repeat(64)}`,
  origin,
  sourceRevision: '5a8c956bc1dbd6ad838ea9da3b34c7d76c703a71',
  verifiedArtifacts: [],
  pages: [{
    id: 'quickstart', title: 'Quickstart',
    canonicalUrl: `${origin}/docs/store6/quickstart`,
    markdownUrl: `${origin}/llms/store6/quickstart.md`,
    sha256: createHash('sha256').update(markdown).digest('hex'),
    provenance: { kind: 'source-synced', sourcePath: 'docs/store6/quickstart.md',
      sourceRevision: '5a8c956bc1dbd6ad838ea9da3b34c7d76c703a71',
      sourceSha256: 'c'.repeat(64), recordedAttribution: null },
  }],
};
const target = { kind: 'revision', value: pinned.sourceRevision };
const response = (body, type) => new Response(body,
  { headers: { 'content-type': `${type}; charset=utf-8` } });
const makePage = (id, body) => ({
  id,
  title: id.replaceAll('-', ' '),
  canonicalUrl: `${origin}/docs/store6/${id}`,
  markdownUrl: `${origin}/llms/store6/${id}.md`,
  sha256: createHash('sha256').update(body).digest('hex'),
  provenance: {
    kind: 'source-synced',
    sourcePath: `docs/store6/${id}.md`,
    sourceRevision: pinned.sourceRevision,
    sourceSha256: 'd'.repeat(64),
    recordedAttribution: null,
  },
});

test('lists pages offline', () => {
  assert.deepEqual(listPages(pinned), [{ id: 'quickstart', title: 'Quickstart' }]);
});

test('retrieves exact UTF-8 bytes with provenance', async () => {
  const requests = [];
  const result = await retrieveDocs({ pinned, ids: ['quickstart'], target,
    fetchImpl: async (url) => {
      requests.push(url);
      return url.endsWith('.json')
        ? response(JSON.stringify(pinned), 'application/json')
        : response(markdown, 'text/markdown');
    } });
  assert.equal(result.pages[0].markdown, markdown);
  assert.deepEqual(result.pages[0].provenance, pinned.pages[0].provenance);
  assert.equal(requests.length, 2);
});

test('unknown consumer version makes no network request', async () => {
  await assert.rejects(retrieveDocs({ pinned, ids: ['quickstart'],
    target: { kind: 'artifact', value: 'org.mobilenativefoundation.store:store6-core:6.0.0-SNAPSHOT' },
    fetchImpl: () => assert.fail('unexpected network request') }),
    { code: 'VERSION_MISMATCH' });
});

test('bundle mismatch stops before page retrieval', async () => {
  const requests = [];
  await assert.rejects(retrieveDocs({ pinned, ids: ['quickstart'], target,
    fetchImpl: async (url) => {
      requests.push(url);
      return response(JSON.stringify({ ...pinned,
        bundleId: `sha256:${'b'.repeat(64)}` }), 'application/json');
    } }), { code: 'BUNDLE_MISMATCH' });
  assert.deepEqual(requests, [`${origin}/llms/store6-manifest.json`]);
});

test('changed page bytes are rejected', async () => {
  await assert.rejects(retrieveDocs({ pinned, ids: ['quickstart'], target,
    fetchImpl: async (url) => url.endsWith('.json')
      ? response(JSON.stringify(pinned), 'application/json')
      : response(markdown + 'changed', 'text/markdown') }),
    { code: 'CONTENT_MISMATCH' });
});

test('rejects malformed page IDs before network access', async () => {
  for (const id of ['../quickstart', 'Quickstart', 'quickstart//nested', '/quickstart']) {
    await assert.rejects(retrieveDocs({ pinned, ids: [id], target,
      fetchImpl: () => assert.fail('unexpected network request') }),
    { code: 'USAGE' });
  }
});

test('rejects duplicate and over-limit requests before network access', async () => {
  const noNetwork = () => assert.fail('unexpected network request');
  await assert.rejects(retrieveDocs({ pinned, ids: ['quickstart', 'quickstart'], target,
    fetchImpl: noNetwork }), { code: 'USAGE' });
  await assert.rejects(retrieveDocs({ pinned, ids: ['one', 'two', 'three', 'four', 'five'], target,
    fetchImpl: noNetwork }), { code: 'USAGE' });
});

test('rejects an unknown well-formed page ID before network access', async () => {
  await assert.rejects(retrieveDocs({ pinned, ids: ['missing'], target,
    fetchImpl: () => assert.fail('unexpected network request') }),
  { code: 'UNKNOWN_PAGE' });
});

test('rejects malformed pinned manifest fields offline', () => {
  const invalid = [
    { ...pinned, origin: 'https://example.com', pages: pinned.pages.map(page => ({
      ...page,
      canonicalUrl: `https://example.com/docs/store6/${page.id}`,
      markdownUrl: `https://example.com/llms/store6/${page.id}.md`,
    })) },
    { ...pinned, verifiedArtifacts: ['org.mobilenativefoundation.store:store6-core:6.0.0-SNAPSHOT'] },
    { ...pinned, pages: [{ ...pinned.pages[0], provenance: {
      ...pinned.pages[0].provenance, sourceSha256: 'invalid',
    } }] },
    { ...pinned, pages: [{ ...pinned.pages[0], provenance: {
      ...pinned.pages[0].provenance, kind: 'unknown',
    } }] },
    { ...pinned, pages: [{ ...pinned.pages[0], provenance: {
      ...pinned.pages[0].provenance, sourcePath: '../private.md',
    } }] },
  ];
  for (const manifest of invalid) {
    assert.throws(() => listPages(manifest), { code: 'MANIFEST_INVALID' });
  }
});

test('rejects an empty manifest response', async () => {
  await assert.rejects(retrieveDocs({ pinned, ids: ['quickstart'], target,
    fetchImpl: async () => response('', 'application/json') }),
  { code: 'EMPTY_RESPONSE' });
});

test('classifies coded transport failures as network errors', async () => {
  await assert.rejects(retrieveDocs({ pinned, ids: ['quickstart'], target,
    fetchImpl: async () => {
      throw Object.assign(new Error('connection reset'), { code: 'ECONNRESET' });
    } }), { code: 'NETWORK_ERROR' });
});

test('checks every selected live hash before fetching any page', async () => {
  const secondMarkdown = '# Second\n';
  const paired = { ...pinned, pages: [pinned.pages[0], makePage('second', secondMarkdown)] };
  const live = { ...paired, pages: [paired.pages[0], {
    ...paired.pages[1], sha256: 'e'.repeat(64),
  }] };
  const requests = [];
  await assert.rejects(retrieveDocs({ pinned: paired, ids: ['quickstart', 'second'], target,
    fetchImpl: async (url) => {
      requests.push(url);
      return response(JSON.stringify(live), 'application/json');
    } }), { code: 'BUNDLE_MISMATCH' });
  assert.deepEqual(requests, [`${origin}/llms/store6-manifest.json`]);
});

test('rejects invalid live JSON and invalid live schema', async () => {
  await assert.rejects(retrieveDocs({ pinned, ids: ['quickstart'], target,
    fetchImpl: async () => response('{', 'application/json') }),
  { code: 'MANIFEST_INVALID' });
  await assert.rejects(retrieveDocs({ pinned, ids: ['quickstart'], target,
    fetchImpl: async () => response(JSON.stringify({ ...pinned, schemaVersion: 2 }), 'application/json') }),
  { code: 'MANIFEST_INVALID' });
});

test('requires exact response MIME types', async () => {
  await assert.rejects(retrieveDocs({ pinned, ids: ['quickstart'], target,
    fetchImpl: async () => response(JSON.stringify(pinned), 'application/json-patch+json') }),
  { code: 'CONTENT_TYPE' });
  await assert.rejects(retrieveDocs({ pinned, ids: ['quickstart'], target,
    fetchImpl: async (url) => url.endsWith('.json')
      ? response(JSON.stringify(pinned), 'application/json')
      : response(markdown, 'text/plain') }),
  { code: 'CONTENT_TYPE' });
});

test('rejects non-200 and redirect responses', async () => {
  await assert.rejects(retrieveDocs({ pinned, ids: ['quickstart'], target,
    fetchImpl: async () => new Response('missing', { status: 404,
      headers: { 'content-type': 'application/json' } }) }),
  { code: 'HTTP_ERROR' });
  await assert.rejects(retrieveDocs({ pinned, ids: ['quickstart'], target,
    fetchImpl: async (_url, options) => {
      assert.equal(options.redirect, 'error');
      return Response.redirect(`${origin}/elsewhere`, 302);
    } }), { code: 'HTTP_ERROR' });
});

test('rejects a followed redirect even if the final response is 200', async () => {
  const redirected = response(JSON.stringify(pinned), 'application/json');
  Object.defineProperty(redirected, 'redirected', { value: true });
  await assert.rejects(retrieveDocs({ pinned, ids: ['quickstart'], target,
    fetchImpl: async () => redirected }), { code: 'HTTP_ERROR' });
});

test('uses a ten-second timeout and classifies timeout rejection', async () => {
  const originalTimeout = AbortSignal.timeout;
  let timeout;
  AbortSignal.timeout = milliseconds => {
    timeout = milliseconds;
    return AbortSignal.abort(new DOMException('timed out', 'TimeoutError'));
  };
  try {
    await assert.rejects(retrieveDocs({ pinned, ids: ['quickstart'], target,
      fetchImpl: async (_url, options) => { throw options.signal.reason; } }),
    { code: 'NETWORK_ERROR' });
  } finally {
    AbortSignal.timeout = originalTimeout;
  }
  assert.equal(timeout, 10_000);
});

test('enforces manifest and page streamed-byte limits', async () => {
  await assert.rejects(retrieveDocs({ pinned, ids: ['quickstart'], target,
    fetchImpl: async () => response(Buffer.alloc(1024 * 1024 + 1), 'application/json') }),
  { code: 'RESPONSE_TOO_LARGE' });
  await assert.rejects(retrieveDocs({ pinned, ids: ['quickstart'], target,
    fetchImpl: async (url) => url.endsWith('.json')
      ? response(JSON.stringify(pinned), 'application/json')
      : response(Buffer.alloc(512 * 1024 + 1), 'text/markdown') }),
  { code: 'RESPONSE_TOO_LARGE' });
});

test('rejects a changed source revision under the same bundle', async () => {
  const changedRevision = 'f'.repeat(40);
  const live = { ...pinned, sourceRevision: changedRevision, pages: pinned.pages.map(page => ({
    ...page,
    provenance: { ...page.provenance, sourceRevision: changedRevision },
  })) };
  await assert.rejects(retrieveDocs({ pinned, ids: ['quickstart'], target,
    fetchImpl: async () => response(JSON.stringify(live), 'application/json') }),
  { code: 'BUNDLE_MISMATCH' });
});

test('retrieves for an exact verified immutable artifact', async () => {
  const artifact = 'org.mobilenativefoundation.store:store6-core:6.0.0-alpha01';
  const paired = { ...pinned, verifiedArtifacts: [artifact] };
  const artifactTarget = { kind: 'artifact', value: artifact };
  const result = await retrieveDocs({ pinned: paired, ids: ['quickstart'], target: artifactTarget,
    fetchImpl: async (url) => url.endsWith('.json')
      ? response(JSON.stringify(paired), 'application/json')
      : response(markdown, 'text/markdown') });
  assert.deepEqual(result.target, artifactTarget);
  assert.equal(result.pages[0].markdown, markdown);
});

test('returns no partial result when a later page fails', async () => {
  const secondMarkdown = '# Second\n';
  const paired = { ...pinned, pages: [pinned.pages[0], makePage('second', secondMarkdown)] };
  const requests = [];
  await assert.rejects(retrieveDocs({ pinned: paired, ids: ['quickstart', 'second'], target,
    fetchImpl: async (url) => {
      requests.push(url);
      if (url.endsWith('.json')) return response(JSON.stringify(paired), 'application/json');
      if (url.endsWith('/quickstart.md')) return response(markdown, 'text/markdown');
      return response(`${secondMarkdown}changed`, 'text/markdown');
    } }), { code: 'CONTENT_MISMATCH' });
  assert.deepEqual(requests, [
    `${origin}/llms/store6-manifest.json`,
    `${origin}/llms/store6/quickstart.md`,
    `${origin}/llms/store6/second.md`,
  ]);
});

test('rejects page bytes that are not valid UTF-8', async () => {
  const invalidUtf8 = Buffer.from([0xff]);
  const page = { ...pinned.pages[0],
    sha256: createHash('sha256').update(invalidUtf8).digest('hex') };
  const paired = { ...pinned, pages: [page] };
  await assert.rejects(retrieveDocs({ pinned: paired, ids: ['quickstart'], target,
    fetchImpl: async (url) => url.endsWith('.json')
      ? response(JSON.stringify(paired), 'application/json')
      : response(invalidUtf8, 'text/markdown') }),
  { code: 'CONTENT_MISMATCH' });
});

test('enforces source revision semantics for page provenance', () => {
  const sourceSyncedWithoutRevision = { ...pinned.pages[0], provenance: {
    ...pinned.pages[0].provenance, sourceRevision: null,
  } };
  const siteAuthoredWithRevision = { ...pinned.pages[0], provenance: {
    ...pinned.pages[0].provenance, kind: 'site-authored',
  } };
  const sourceSyncedAtAnotherRevision = { ...pinned.pages[0], provenance: {
    ...pinned.pages[0].provenance, sourceRevision: 'f'.repeat(40),
  } };
  for (const page of [sourceSyncedWithoutRevision, siteAuthoredWithRevision,
    sourceSyncedAtAnotherRevision]) {
    assert.throws(() => listPages({ ...pinned, pages: [page] }),
      { code: 'MANIFEST_INVALID' });
  }
});
