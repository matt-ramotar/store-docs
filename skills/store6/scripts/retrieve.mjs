import { createHash } from 'node:crypto';

const MAX_MANIFEST = 1024 * 1024;
const MAX_PAGE = 512 * 1024;
const ORIGIN = 'https://store.mobilenativefoundation.org';
const SHA = /^[a-f0-9]{64}$/;
const REVISION = /^[a-f0-9]{40}$/;
const PAGE_ID = /^[a-z0-9-]+(?:\/[a-z0-9-]+)*$/;
const ARTIFACT = /^org\.mobilenativefoundation\.store:store6-[a-z0-9-]+:[A-Za-z0-9][A-Za-z0-9._+-]*$/;

class RetrievalError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

function fail(code, message) {
  throw new RetrievalError(code, message);
}

function decodeUtf8(bytes, code, message) {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    fail(code, message);
  }
}

function validSourcePath(value) {
  return typeof value === 'string' && value.length > 0 && !value.startsWith('/') &&
    !value.includes('\\') && value.split('/').every(segment => segment !== '' && segment !== '.' && segment !== '..');
}

function validProvenance(value, manifestRevision) {
  return value && typeof value === 'object' && !Array.isArray(value) &&
    (value.kind === 'source-synced' || value.kind === 'site-authored') &&
    validSourcePath(value.sourcePath) &&
    (value.kind === 'source-synced'
      ? value.sourceRevision === manifestRevision
      : value.sourceRevision === null) &&
    typeof value.sourceSha256 === 'string' && SHA.test(value.sourceSha256) &&
    (value.recordedAttribution === null ||
      (typeof value.recordedAttribution === 'string' && value.recordedAttribution.length > 0));
}

function validate(manifest) {
  if (manifest?.schemaVersion !== 1 || typeof manifest.bundleId !== 'string' ||
      !manifest.bundleId.startsWith('sha256:') ||
      !SHA.test(manifest.bundleId.slice(7)) || typeof manifest.sourceRevision !== 'string' ||
      !REVISION.test(manifest.sourceRevision) ||
      manifest.origin !== ORIGIN ||
      !Array.isArray(manifest.pages) || !Array.isArray(manifest.verifiedArtifacts) ||
      !manifest.verifiedArtifacts.every(value => typeof value === 'string' &&
        ARTIFACT.test(value) && !/-SNAPSHOT$/i.test(value))) {
    fail('MANIFEST_INVALID', 'Invalid Store6 documentation manifest.');
  }
  const ids = new Set();
  for (const page of manifest.pages) {
    if (!page || typeof page !== 'object' || Array.isArray(page) ||
        typeof page.id !== 'string' || !PAGE_ID.test(page.id) ||
        ids.has(page.id) || typeof page.sha256 !== 'string' || !SHA.test(page.sha256) ||
        typeof page.title !== 'string' || page.title.length === 0 ||
        !validProvenance(page.provenance, manifest.sourceRevision)) {
      fail('MANIFEST_INVALID', 'Invalid or duplicate documentation page.');
    }
    ids.add(page.id);
    if (page.canonicalUrl !== `${manifest.origin}/docs/store6/${page.id}` ||
        page.markdownUrl !== `${manifest.origin}/llms/store6/${page.id}.md`) {
      fail('MANIFEST_INVALID', `Invalid URLs for page ${page.id}.`);
    }
  }
  return manifest;
}

async function fetchBytes(url, maxBytes, mime, fetchImpl) {
  let response;
  try {
    response = await fetchImpl(url, {
      redirect: 'error', signal: AbortSignal.timeout(10000),
      headers: { accept: mime },
    });
    if (response.redirected) fail('HTTP_ERROR', `Redirect refused: ${url}`);
    if (response.status !== 200) fail('HTTP_ERROR', `HTTP ${response.status}: ${url}`);
    if (response.headers.get('content-type')?.split(';')[0].trim() !== mime) {
      fail('CONTENT_TYPE', `Expected ${mime}: ${url}`);
    }
    if (!response.body) fail('EMPTY_RESPONSE', `Missing body: ${url}`);
    const chunks = [];
    let bytes = 0;
    for await (const chunk of response.body) {
      bytes += chunk.byteLength;
      if (bytes > maxBytes) fail('RESPONSE_TOO_LARGE', `Response exceeds ${maxBytes} bytes: ${url}`);
      chunks.push(Buffer.from(chunk));
    }
    if (bytes === 0) fail('EMPTY_RESPONSE', `Empty body: ${url}`);
    return Buffer.concat(chunks);
  } catch (error) {
    if (error instanceof RetrievalError) throw error;
    fail('NETWORK_ERROR', `Could not retrieve ${url}: ${error.message}`);
  }
}

export function listPages(pinned) {
  return validate(pinned).pages.map(({ id, title }) => ({ id, title }));
}

export async function retrieveDocs({ pinned, ids, target, fetchImpl = fetch }) {
  validate(pinned);
  if (!Array.isArray(ids) || ids.length < 1 || ids.length > 4 ||
      new Set(ids).size !== ids.length || !ids.every(id => typeof id === 'string' && PAGE_ID.test(id))) {
    fail('USAGE', 'Request 1-4 distinct manifest page IDs.');
  }
  const selected = ids.map(id => {
    const page = pinned.pages.find(candidate => candidate.id === id);
    if (!page) fail('UNKNOWN_PAGE', `Unknown Store6 documentation page: ${id}`);
    return page;
  });
  const matchesRevision = target?.kind === 'revision' &&
    typeof target.value === 'string' && REVISION.test(target.value) &&
    target.value === pinned.sourceRevision;
  const matchesArtifact = target?.kind === 'artifact' &&
    typeof target.value === 'string' && !/-SNAPSHOT$/i.test(target.value) &&
    pinned.verifiedArtifacts.includes(target.value);
  if (!matchesRevision && !matchesArtifact) {
    fail('VERSION_MISMATCH', 'No verified documentation match for the target. Provide the exact dependency or matching source revision.');
  }
  const manifestBytes = await fetchBytes(
    `${pinned.origin}/llms/store6-manifest.json`, MAX_MANIFEST, 'application/json', fetchImpl,
  );
  let live;
  try {
    live = JSON.parse(decodeUtf8(
      manifestBytes, 'MANIFEST_INVALID', 'Live documentation manifest is not valid UTF-8.',
    ));
  } catch (error) {
    if (error instanceof RetrievalError) throw error;
    fail('MANIFEST_INVALID', 'Live documentation manifest is not valid JSON.');
  }
  validate(live);
  if (live.bundleId !== pinned.bundleId || live.origin !== pinned.origin ||
      live.sourceRevision !== pinned.sourceRevision) {
    fail('BUNDLE_MISMATCH', 'Live documentation differs from the skill bundle. Explicitly update the paired skill release or supply matching documentation.');
  }
  for (const page of selected) {
    if (live.pages.find(candidate => candidate.id === page.id)?.sha256 !== page.sha256) {
      fail('BUNDLE_MISMATCH', `Live page identity differs: ${page.id}`);
    }
  }
  const result = [];
  for (const page of selected) {
    const bytes = await fetchBytes(page.markdownUrl, MAX_PAGE, 'text/markdown', fetchImpl);
    if (createHash('sha256').update(bytes).digest('hex') !== page.sha256) {
      fail('CONTENT_MISMATCH', `Retrieved page differs from paired manifest: ${page.id}`);
    }
    result.push({ ...page, markdown: decodeUtf8(
      bytes, 'CONTENT_MISMATCH', `Retrieved page is not valid UTF-8: ${page.id}`,
    ) });
  }
  return { bundleId: pinned.bundleId, sourceRevision: pinned.sourceRevision,
    target, pages: result };
}
