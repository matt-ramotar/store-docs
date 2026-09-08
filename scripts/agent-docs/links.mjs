export function pageIdentity(path, origin) {
  const prefix = 'content/docs/store6/';
  if (!path.startsWith(prefix) || !path.endsWith('.mdx')) {
    throw new Error(`Invalid Store6 page: ${path}`);
  }
  const id = path.slice(prefix.length, -4).replace(/\/index$/, '');
  if (!/^[a-z0-9-]+(?:\/[a-z0-9-]+)*$/.test(id)) {
    throw new Error(`Invalid page ID: ${id}`);
  }
  const canonicalPath = `/docs/store6/${id}`;
  const markdownPath = `/llms/store6/${id}.md`;
  return {
    id,
    canonicalPath,
    markdownPath,
    canonicalUrl: `${origin}${canonicalPath}`,
    markdownUrl: `${origin}${markdownPath}`,
  };
}

export function rewriteAgentLink(raw, canonicalUrl, byCanonicalUrl, origin) {
  const destination = new URL(raw, canonicalUrl);
  if (!['https:', 'http:', 'mailto:', 'tel:'].includes(destination.protocol)) {
    throw new Error(`Unsupported documentation link protocol: ${destination.protocol}`);
  }
  if (destination.origin === origin && !destination.hash) {
    const mapped = byCanonicalUrl.get(`${origin}${destination.pathname}`);
    if (mapped) destination.pathname = mapped.markdownPath;
  }
  return destination.href;
}

export function rewriteTreeLinks(node, canonicalUrl, byCanonicalUrl, origin) {
  if (['link', 'definition', 'image'].includes(node.type)) {
    node.url = rewriteAgentLink(node.url, canonicalUrl, byCanonicalUrl, origin);
  }
  for (const child of node.children ?? []) {
    rewriteTreeLinks(child, canonicalUrl, byCanonicalUrl, origin);
  }
  return node;
}
