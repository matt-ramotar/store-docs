# Final authoring pass: concepts and guides

## Scope

The pass read all 12 authored pages in full as educational interface documentation.

Changed:

- `content/docs/store6/concepts/api-tiers.mdx`
- `content/docs/store6/concepts/errors.mdx`
- `content/docs/store6/concepts/freshness.mdx`
- `content/docs/store6/concepts/memory-and-lifecycle.mdx`
- `content/docs/store6/concepts/read-contract.mdx`
- `content/docs/store6/guides/extending.mdx`
- `content/docs/store6/guides/fetchers.mdx`
- `content/docs/store6/guides/performance.mdx`
- `content/docs/store6/guides/swift.mdx`

Reviewed and left unchanged because no prose change was sufficiently useful:

- `content/docs/store6/guides/devtools.mdx`
- `content/docs/store6/guides/persistence.mdx`
- `content/docs/store6/guides/testing.mdx`

The final diff contains 31 inserted lines and 32 removed lines across nine pages. It changes prose
only.

## Representative revisions

- The API-tier opening now starts with the compiler behavior and its purpose. It removes the guess
  about why the reader arrived and the decorative claim that nothing is usable by accident.
- The freshness page replaces “hiding elsewhere” and “one pitfall worth naming” with direct
  statements of the complete policy set and the metadata-less-row behavior.
- The lifecycle opening now identifies the engine, its work, the idle bound, eviction behavior,
  and closure without repeating the page description.
- The read contract calls `stream` and `get` read operations instead of “doors,” then states the
  failure rule immediately.
- The extending page changes “proves” to “shows” for the `MetricsTelemetry` example. This keeps the
  evidence claim at the level demonstrated by the reference module.
- The performance opening now begins with the evidence limit: none of the benchmark numbers is a
  performance guarantee.
- The Swift opening identifies the committed dumps as the source that defines the current exported
  surface, without assigning the commit action to Store 6 itself.

## Self-review

The required three passes ran once over the complete authoring diff:

1. Accuracy and scope: retained contract force, restored wording where a synonym weakened a useful
   boundary or strengthened a capability into a guarantee, and found no passage in the edited hunks
   that required a technical correction.
2. Warrant and voice: removed reader guesses, decorative phrasing, and editorial scaffolding; kept
   uncertainty, evidence limits, and implementation boundaries.
3. Reader utility: confirmed that each retained edit reaches the governing rule sooner without
   removing setup needed to apply it.

## Protected-content comparison

The shared `/private/tmp/store-docs-final-authoring-baseline.json` was overwritten during the pass.
Root confirmed that these 12 pages were clean at the checkpoint, so `git show HEAD:<path>` served as
the pre-pass baseline. The comparison did not write the shared snapshot.

A mechanical comparison ran seven ordered checks for each of the 12 pages, for 84 checks total:

- complete fenced blocks
- inline-code tokens outside fences
- heading lines and their generated anchors
- Markdown link targets
- JSX tags and props
- source and snippet marker lines
- numeric and version tokens

Result: 84 of 84 comparisons matched, with zero mismatches. `git diff --check` also exited 0 for
the concepts and guides paths.

No concrete unresolved technical concern arose from the edited passages. This pass did not rerun
source verification, claims, builds, or browser checks; those remain with the integration owner.
