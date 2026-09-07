# Final authoring pass

Completed the bounded authoring pass on 2026-09-06 with three agents and one integration owner.
Reviewed all 40 Store 6 pages and seven additional entry files. Revised 23 authored pages and one
entry-description component. The source integration work from the larger revision plan remains
separate and incomplete.

## Applied changes

The pass used documentation-discipline, code-documentation, and writing-voice, in that order, in
the educational register. Each agent read complete pages and performed the three required
self-review passes. The integration owner inspected the resulting hunks and removed edits that
added no clarity or changed the force of a claim. No additional review agents were created.

- Concepts and guides: nine pages revised, three retained unchanged.
- Mutations, migration, and paging: 13 pages revised, two retained unchanged.
- Entry copy: two passages in the overview and one description in StartHereList revised.
- Generated pages: all 12 inspected and left byte-identical. Seven wording changes were prepared
  against their authoritative source inputs.

Examples of the applied changes include replacing “read doors” with “read operations,” removing
guesses about why a reader reached the API-tier page, starting the performance page with its
evidence limit, and naming persistence and projections directly in the overview.

The existing theme, chip, code-block, and navigation changes were preserved. One test assertion
was updated to the exact revised overview sentence. The claims ledger now records that origin
and status chips share colors while retaining different meanings. Other changed ledger values
are anchor hashes, including hashes that were already stale before this authoring pass.

## Verification

| Check | Result |
| --- | --- |
| Production build | Passed |
| Full repository tests | 327 passed, 0 failed, 1 opt-in test skipped |
| Claim checker | 475 claims and 527 anchors checked at the unchanged source revision |
| Snippet checker | 33 snippets and 38 page references matched the source checkout |
| Protected-content comparison | 61 files compared with the pre-pass baseline; 24 changed files passed |
| Generated output | All 12 generated Store 6 MDX pages byte-identical to the baseline |
| Source wording patch | Seven files; exact source-span, code, numeric-token, and patch-application checks passed |
| Browser | Revised overview and read-contract copy rendered; link navigation succeeded without a load error; no console errors observed |
| Whitespace | `git diff --check` passed |

The MDX comparison preserves fenced code, inline code, headings, link destinations, JSX tags and
attributes, expressions other than prose strings, source markers, frontmatter, recorded-source
footers, and numeric tokens. The Babel comparison preserves TSX structure and executable content,
excluding only visible prose and description strings. Exact code elements are compared separately.
Hunk review supplies the semantic-equivalence check. This is not a fresh execution of every Kotlin
example or a new release-readiness determination.

The first full test run had one failure: the overview assertion still pinned the previous prose.
The assertion was updated without weakening its checks, and the next full run passed. Both logs
are retained. A worker accidentally replaced the shared temporary baseline before making its
edits. The integration owner reconstructed the baseline from the clean checkpoint plus the three
exact UI diffs recorded before the pass. The final comparison uses that recovered baseline.

## Source-owned follow-up

The [Code Documentation ownership rule](/Users/matt/.codex/skills/code-documentation/references/evidence-and-verification.md)
says: “Edit those inputs instead of their derived artifacts.” The 12 generated pages are owned by
the source lock at `5a8c956bc1dbd6ad838ea9da3b34c7d76c703a71`. Their seven wording changes are supplied
as [an unapplied source patch](proposals/final-authoring-source.patch), ready for the existing
source-integration step. No source commit, source re-pin, or generated-output patch was made.

One existing technical wording issue remains: the opening of `invalidate-vs-clear.mdx` says both
operations make a value disappear, while the summary and following explanation correctly say that
invalidation retains the value and marks it stale. The correction belongs in the authoritative
`docs/store6/invalidate-vs-clear.md`. It was recorded rather than silently changing a protected
behavioral claim in generated output.

The proposed Quickstart line-count finding was dismissed. The opening example contains six
physical lines, one of them blank, so its “five lines” description is accurate.

The generated-page review did not repeat the older origin-on-dark contrast assessment. Its prior
limits remain recorded separately. This pass does not close the original plan's remaining source
integration or acceptance work.

## Evidence

- [Concepts and guides](final-authoring-concepts-guides.md)
- [Mutations, migration, and paging](final-authoring-mutations-migration.md)
- [Entry and generated pages, including exact source proposals](final-authoring-entry-generated.md)
- [Protected-content results](final-authoring-protected-content.json)
- [Build log](commands/final-authoring-build.log)
- [First test run](commands/final-authoring-tests-first.log)
- [Final test run](commands/final-authoring-tests-final.log)
- [Claim check](commands/final-authoring-claims.log)
- [Snippet check](commands/final-authoring-snippets.log)

The local preview is running at `http://localhost:3222/`. Changes remain uncommitted.
