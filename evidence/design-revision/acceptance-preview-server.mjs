import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';

// Local acceptance harness. Public application responses still come from the production server.
const referenceRoot = '/private/tmp/store-reference-proposal-proof-jORu04/public';
const types = { html: 'text/html', css: 'text/css', js: 'text/javascript', json: 'application/json', svg: 'image/svg+xml', png: 'image/png', woff2: 'font/woff2' };
const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, 'http://127.0.0.1:3223');
  try {
    if (url.pathname.startsWith('/reference/')) {
      const target = resolve(referenceRoot, '.' + decodeURIComponent(url.pathname));
      if (!target.startsWith(referenceRoot + sep)) { response.writeHead(400); response.end(); return; }
      const body = await readFile(target);
      response.writeHead(200, { 'content-type': types[target.split('.').at(-1)] ?? 'application/octet-stream' });
      response.end(body);
      return;
    }
    if (url.pathname === '/api/search') {
      const referer = new URL(request.headers.referer ?? '/', 'http://127.0.0.1:3223');
      const fault = referer.searchParams.get('acceptance-search');
      if (fault === 'error') { response.writeHead(503, { 'content-type': 'application/json' }); response.end('{"error":"deliberate local acceptance failure"}'); return; }
      if (fault === 'slow') await new Promise(resolveDelay => setTimeout(resolveDelay, 1500));
    }
    const upstream = await fetch('http://127.0.0.1:3222' + url.pathname + url.search, { redirect: 'manual' });
    const headers = Object.fromEntries(upstream.headers);
    delete headers['content-encoding'];
    delete headers['content-length'];
    response.writeHead(upstream.status, headers);
    response.end(Buffer.from(await upstream.arrayBuffer()));
  } catch (error) {
    response.writeHead(error.code === 'ENOENT' ? 404 : 502, { 'content-type': 'text/plain' });
    response.end(error.code === 'ENOENT' ? 'Not found' : 'Local preview upstream unavailable');
  }
});
server.listen(3223, '127.0.0.1', () => console.log('Acceptance preview on http://127.0.0.1:3223'));
