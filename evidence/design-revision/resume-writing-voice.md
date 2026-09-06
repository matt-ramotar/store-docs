# Resumed writing-voice pass

Completed 2026-09-06 within the bounded prose lease. Three newly authored narrative passages
changed. No page structure, behavior, accessible name, command, code example, source metadata,
or failure-trace semantics changed during this pass.

## Scope and authority

The reader is a Kotlin Multiplatform developer choosing a starting point, interpreting an
illustrative read example, or running the source quickstart. The register is educational.
The applicable skill composition was read in order:

1. `/Users/matt/.codex/skills/documentation-discipline/SKILL.md`, including all discipline rules.
2. `/Users/matt/.codex/skills/code-documentation/SKILL.md`, including evidence and verification,
   interface documentation, and TypeScript/JavaScript guidance.
3. `/Users/matt/.codex/skills/writing-voice/SKILL.md`, including the full detailed voice rules.

The baseline was the existing worktree revision, not a clean checkout. Every candidate was
compared with its Git diff before editing. Existing prose outside the added revision was left
unchanged. The isolated Quickstart source remains an uncommitted, unapproved proposal at base
`5a8c956bc1dbd6ad838ea9da3b34c7d76c703a71`. Additional time did not grant source approval.

## Changed passages

| Surface | Before | After | Reader benefit |
| --- | --- | --- | --- |
| `components/hero/HeroThesis.tsx` | Start with a key and a fetcher, then add the data boundaries your application needs. | Start with a key and a fetcher, then add persistence and projections as needed. | Names the optional additions instead of leaving "data boundaries" undefined. |
| `components/hero/KeyEngineTrace.tsx` caption | The two read lines show the same `stream` and `get` calls in their simplest illustrative form. | The two read lines are simplified illustrations of the same `stream` and `get` calls. | Preserves the illustration qualification while removing an unnecessary superlative. |
| Isolated `docs/store6/quickstart.md` setup explanation | The locked checkout runs the same `store6-quickstart` module that CI executes. The example uses a deterministic stand-in service, so you can focus on the read path before connecting a network or database. | This checkout runs the same `store6-quickstart` module that CI executes. The example uses a deterministic stand-in service so you can learn the read path before connecting a network or database. | Refers directly to the checkout just created and makes the teaching purpose explicit. |

The proposal patch was refreshed from the isolated checkout's diff. Its explanatory evidence
document records this wording pass. No other product passages changed.

## Evidence checked before editing

- The existing overview introduces persistence and projection seams. The isolated source's
  `StoreBuilder.kt` declares optional persistence at lines 125–136 and an optional stream-only
  projection layer at lines 146–154. The hero still starts with the key and fetcher and does not
  promise disk persistence or projections by default.
- The isolated `store6-quickstart/src/main/kotlin/org/mobilenativefoundation/store6/quickstart/Main.kt`
  contains the deterministic `FakeApi`, the same store block, both read calls, `take(2)`, and
  `users.close()`. The caption continues to distinguish the verbatim store block from the
  illustrative read lines.
- The isolated `.github/workflows/store6.yml` runs
  `./gradlew :store6-quickstart:run --stacktrace`. The source proposal's command block and its
  qualification about the stand-in service were preserved. This pass did not execute the clone,
  checkout, or Gradle commands.
- The full read-contract page and the original hero diff establish the relocated trace's exact
  conditions and failure sequence. The entire current read-contract file was preserved.
- The installed Next.js `use client` guide was read. Client directives, imports, component
  structure, and attributes were preserved.

## Three separate passes

### 1. Vagueness and mechanics

Compared the added prose with the source and baseline diff. Replaced "data boundaries" with the
already established persistence/projection terms. Made the source setup refer to "This checkout"
and to learning the read path. Kept all uncertainty, experimental boundaries, source attribution,
and commands. No new question, analogy, personal experience, or first-person claim was warranted
for these short documentation passages.

### 2. Warrant and performance

Reread the eligible prose for unsupported emphasis, decorative language, repeated scaffolding,
and unnecessary prose. Replaced "simplest illustrative form" with "simplified illustrations".
Retained the verbatim-versus-illustrative distinction because readers need it to assess whether
the displayed read lines are the executable program. The other added prose was sufficient.

### 3. Make the point

Reread the resulting passages together with the surrounding journey. The hero leads to building
a first store, the caption identifies the example's limits, and the proposed setup precedes
creation, reads, and output interpretation. The failure trace retains all four conditions,
optional replay, no intervening `Loading`, failure-bookkeeping order, stream liveness, durable
ETag qualification, later `Origin.MEMORY`, and wall-clock/custom-validator limits. This pass
required no further wording changes.

## Protected-content comparison

The pre-pass text of eleven leased/protected files was saved to
`/private/tmp/store6-resume-voice-baseline.json`. Comparisons used that snapshot to distinguish
this wording pass from the larger existing revision.

| Check | Result |
| --- | --- |
| Babel parsed AST comparison of all four leased TSX files, excluding only source positions, parser raw metadata, and `JSXText.value` | Passed. No structural, attribute, import, directive, identifier, expression, or template-literal change. |
| Exact comparison of every inline `<code>…</code>` element in those TSX files | Passed. |
| Entire `overview.mdx`, `read-contract.mdx`, generated `quickstart.mdx`, and `important-defaults.mdx` versus the pre-pass snapshot | Byte-identical. |
| Isolated source fenced blocks, inline code, source-marker comments, links, headings, and footer | Byte-identical to the pre-pass proposal. |
| Isolated source diff versus locked base | 23 additions, 0 deletions. Every original source line preserved. |
| `git diff --check` for the two changed TSX files and isolated source | Passed. |

An initial comparison attempted the TypeScript compiler API, but installed TypeScript 7.0.2
exports version metadata rather than that API. The boundary check therefore used the available
Babel parser. An initial heading comparison used an overbroad DOTALL regex flag and failed in
the verification script. Restricting heading matching to individual lines corrected the checker
without changing source. Both events were verification-tool issues, not application test results.

The mechanical comparison establishes the TSX edit boundary. Human hunk review establishes the
semantic equivalence of the eligible narrative. It does not establish a new build, browser, or
runtime result. Root owns any narrative-dependent test expectations and final claim hashes.

## Reviewed without changes

- `app/page.tsx`: the new metadata description already identifies the technology and task.
- `components/overview/StartHereList.tsx`: the changed title matches the accepted CTA.
- `content/docs/store6/overview.mdx`: the added provenance sentence is needed and concise.
- `content/docs/store6/concepts/read-contract.mdx`: the added trace is precise contract material.
- Other changed UI labels in `LastVerified`, `SupportMatrix`, `CommandSearch`, `MobileNav`,
  `OnThisPage`, `RightRail`, `Store6Banner`, `TopNav`, `VersionMenu`, and `lib/nav.ts` were
  inspected read-only. No further wording proposal had enough reader benefit to warrant changing
  established labels or accessible-name assertions.

No commits, installs, builds, servers, browser sessions, generated-output edits, source-lock
updates, source approvals, publishing, or deployment occurred in this pass.
