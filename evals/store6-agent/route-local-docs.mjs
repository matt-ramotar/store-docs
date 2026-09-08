const originalFetch = globalThis.fetch;
const canonicalOrigin = 'https://store.mobilenativefoundation.org';
const deliveryOrigin = 'http://127.0.0.1:3222';
globalThis.fetch = async (input, init) => {
  const url = new URL(input instanceof Request ? input.url : String(input));
  if (url.origin !== canonicalOrigin) return originalFetch(input, init);
  if (input instanceof Request) throw new Error('Evaluation adapter expects URL/string documentation requests');
  const local = new URL(url.pathname + url.search, deliveryOrigin);
  return originalFetch(local, init);
};
