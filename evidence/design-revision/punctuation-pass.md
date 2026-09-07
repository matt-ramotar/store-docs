# Punctuation correction

Applied the requested em-dash correction to 11 Store 6 pages on September 6, 2026.
Three bounded agents supplied prose edits. The integration owner checked meaning, mechanics,
and reading flow using the requested authoring guidelines, then regenerated the site.

Ten generated pages now receive exact-span editorial changes through
`scripts/store6-prose-edits.json` and the existing publication pipeline. The generator rejects
missing or repeated source spans before writing outputs. Paging was edited in its authored MDX.
The locked Store6 revision and source files remain unchanged.

The remaining seven em dashes in Store 6 MDX occur in five source-code comments and two Roadmap
headings. The headings retain their existing section links. Quickstart has no prose em dashes.

Verification passed:

- Production build and 329 tests. One opt-in test was skipped.
- Regeneration check for all 13 owned outputs at the unchanged source revision.
- 475 claims and 527 anchors checked. Only affected ownership hashes were refreshed.
- 33 source snippets and 38 page references matched.
- Protected-content comparison passed for all 11 changed pages, preserving code, inline tokens,
  headings, links, JSX, metadata, and numbers. Generated pages use the punctuation-pass baseline.
  Paging uses the earlier authoring baseline because its punctuation edits preceded capture.
- Rebuilt Quickstart was checked in the browser. Its only remaining em dash is in a code comment.

The preview is running at http://localhost:3222/. These changes remain uncommitted.

Build, test, claim, and snippet logs are in `commands/punctuation-*.log`.
Protected-content results are in `punctuation-protected-content.json`.
