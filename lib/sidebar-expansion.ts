export function normalizeExpandedKeys<Key>(
  proposedKeys: Iterable<Key>,
  lockedKeys: Iterable<Key>,
): Set<Key> {
  const expandedKeys = new Set(proposedKeys);

  for (const key of lockedKeys) expandedKeys.add(key);

  return expandedKeys;
}
