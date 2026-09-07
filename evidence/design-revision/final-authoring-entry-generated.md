# Final entry and generated-page authoring pass

Read all eight complete entry files and all 12 generated MDX pages. Applied three prose replacements in two entry files. Seven generated-page proposals remain unapplied. Assessments concern wording within the supplied contracts, not current release correctness.

Used documentation-discipline, code-documentation, and writing-voice in that order, in the educational register. Read the complete discipline-rules, evidence-and-verification, and voice-rules references, the TypeScript/JavaScript and Kotlin adapters, the interface-documentation reference, and the relevant installed Next MDX guide.

## Entry files

| File | Result |
| --- | --- |
| `app/page.tsx` | Sufficient; unchanged |
| `app/tokens-demo/TokenExamples.tsx` | Sufficient; unchanged |
| `content/docs/store6/overview.mdx` | Three listed replacements across two files |
| `components/hero/HeroThesis.tsx` | Sufficient; unchanged |
| `components/hero/KeyEngineTrace.tsx` | Sufficient; unchanged |
| `components/overview/ReadResolutionTable.tsx` | Sufficient; unchanged |
| `components/overview/StartHereList.tsx` | Three listed replacements across two files |
| `components/overview/SupportMatrix.tsx` | Sufficient; unchanged |

SupportMatrix and TokenExamples retain their prior UI changes and exact support/release wording. StartHereList retains its status dot and changes only one paragraph description. Headings and navigation labels remain unchanged.

## Applied passages

File: `content/docs/store6/overview.mdx`

Before: Start with a fetcher, then add only the persistence and projection seams your application needs.

After: Start with a fetcher, then add only the persistence and projections your application needs.

File: `content/docs/store6/overview.mdx`

Before: Choose the guide that matches the next boundary you need to add.

After: Choose the guide for what you need to add next.

File: `components/overview/StartHereList.tsx`

Before: See what zero configuration already decides about freshness and failures.

After: See the freshness and failure behavior you get with zero configuration.

The overview names persistence and projections directly and makes the guide chooser instruction concrete. The default-guide description names the behavior readers will learn.

## Generated-page assessment

Source revision: `5a8c956bc1dbd6ad838ea9da3b34c7d76c703a71`. Inputs are mapped by `evidence/T4-store6-source-lock.json`. No generated output, source input, source lock, or existing proposal patch was edited. Root decides whether to authorize source changes and regeneration.

| Generated page | Source input | Assessment |
| --- | --- | --- |
| `content/docs/store6/quickstart.mdx` | `docs/store6/quickstart.md` | Specific prose proposal below |
| `content/docs/store6/important-defaults.mdx` | `docs/store6/important-defaults.md` | Specific prose proposal below |
| `content/docs/store6/invalidate-vs-clear.mdx` | `docs/store6/invalidate-vs-clear.md` | Protected-content issue below; surrounding prose sufficient |
| `content/docs/store6/key-design.mdx` | `docs/store6/key-design.md` | Specific prose proposal below |
| `content/docs/store6/stability.mdx` | `STABILITY.md` | Sufficient within this wording-only scope |
| `content/docs/store6/roadmap.mdx` | `ROADMAP.md` | Specific prose proposal below |
| `content/docs/store6/contributing.mdx` | `CONTRIBUTING.md` | Specific prose proposal below |
| `content/docs/store6/compose.mdx` | `store6-compose/README.md` | Sufficient within this wording-only scope |
| `content/docs/store6/sqldelight.mdx` | `store6-sqldelight/README.md` | Specific prose proposal below |
| `content/docs/store6/room.mdx` | `store6-room/README.md` | Specific prose proposal below |
| `content/docs/store6/realtime.mdx` | `store6-realtime/README.md` | Sufficient within this wording-only scope |
| `content/docs/store6/graphql.mdx` | `store6-graphql/README.md` | Sufficient within this wording-only scope |

## Exact source proposals

Every proposed before span occurs exactly once in its source input at the stated revision. Proposals preserve inline code and numeric tokens exactly. Blockquote markers are retained where the authoritative source uses them. An empty after block means delete that paragraph.

### 1. docs/store6/quickstart.md

Class: Unnecessary. Removes an introduction that delays the explanation of why the example terminates.

Before:

```text
One detail worth naming so it does not read as magic: **`take(2)` is what ends this program.**
```

After:

```text
**`take(2)` is what ends this program.**
```

### 2. docs/store6/important-defaults.md

Class: Unnecessary. States the tested scope directly. The following telemetry and overlay exclusion remains unchanged.

Before:

```text
One honest limit on that
> guarantee: the equivalence is asserted over persistence, bookkeeper, freshness validator, and idle
> cap.
```

After:

```text
The equivalence is asserted over persistence, bookkeeper, freshness validator, and idle
> cap.
```

### 3. docs/store6/key-design.md

Class: Unnecessary. Removes announced importance while retaining the distinction explained next.

Before:

```text
It is worth the attention because a `StoreKey` is doing two jobs at once, and they have different
consequences when you get them wrong.
```

After:

```text
A `StoreKey` does two jobs, with different consequences when either is wrong.
```

### 4. ROADMAP.md

Class: Unnecessary. Uses a complete sentence. Date uncertainty and the governing rule remain unchanged.

Before:

```text
Store 6's plan, with dates on it.
```

After:

```text
Store 6's release plan includes target dates.
```

### 5. CONTRIBUTING.md

Class: Unnecessary. Removes a preview. Existing getting-started instructions become the opening.

Before:

```text
Thanks for considering contributing to Store. This document provides guidelines and information about how you can contribute.
```

After:

```text

```

### 6. store6-room/README.md

Class: Unnecessary. Removes emphasis about the claim while preserving the schema boundary.

Before:

```text
This is the precise schema claim: Store6 changes no columns or constraints in
your tables.
```

After:

```text
Store6 changes no columns or constraints in
your tables.
```

### 7. store6-sqldelight/README.md

Class: Unnecessary. Removes an evaluative modifier. Measurement, machine scope, and evidence classification remain unchanged.

Before:

```text
This automated run is evidence that the documented path fits comfortably inside 15 minutes on this machine.
```

After:

```text
This automated run is evidence that the documented path fits within 15 minutes on this machine.
```

## Unresolved protected-content issues

- `content/docs/store6/invalidate-vs-clear.mdx` opens with “Both make a value go away,” while the next summary says invalidation retains the value. This is a claim-level inconsistency. No substitute contract is proposed in this wording pass. A correction belongs in `docs/store6/invalidate-vs-clear.md` under separate scope.
- Root dismissed the proposed Quickstart line-count finding: its opening example has six physical lines, including one blank line, and five nonblank lines. The “five lines” description is accurate and remains unchanged.
- `app/tokens-demo/TokenExamples.tsx` retains its readable-contrast statement. This authoring pass did not establish visual contrast. Earlier indeterminate token samples remain indeterminate.

## Three separate self-review passes

1. Accuracy, vagueness, and mechanics: compared all replacement spans with the complete passages and source proposals with the locked inputs. Preserved actors, attribution, qualifications, exact technical tokens, and evidence classifications.
2. Warrant and performance: removed only abstract wording, announced importance, previews, or an unnecessary modifier. Kept limitations and explanations readers need to act. Already clear text remains unchanged.
3. Reader task and completeness: reread the changed passages in context. Entry guidance still leads from first Store to defaults and read contracts. Each generated proposal retains surrounding instructions and exclusions.

## Verification

The supplied baseline path was overwritten during the pass by another worker. Root reconstructed the full initial content at `/private/tmp/store-docs-final-authoring-root-baseline.json` from the clean checkpoint plus the exact three pre-pass UI diffs. A final hunk comparison against that baseline shows only the three listed replacements in this lease. The other six entry files remain unchanged.

Root reports that its MDX protected-node comparison and Babel TSX AST comparison pass across all 27 current edited files. This is root-owned mechanical integration evidence from `/private/tmp/store-docs-final-authoring-boundary.mjs`, using `next/dist/compiled/babel/parser`. This worker performed the separate hunk and meaning review and does not claim to have run that checker. Generated files were read only throughout this lease.

The hunk review preserves fenced and inline code, commands, identifiers, numbers, version/release/stability facts, links, headings and anchors, source metadata, imports, tags, props, attributes, and behavior. The only changed TSX value is a human-facing `description` rendered as paragraph text. No ARIA, navigation, or identifier string changed.

A Node TypeScript parser inspection stopped before parsing because the installed `require("typescript")` export did not provide `ScriptTarget.Latest`. No AST proof is claimed. No tests, builds, servers, browser runs, source mutations, commits, or external actions were performed.

Commands used: complete filesystem reads, `rg --files node_modules/next/dist/docs` to locate the installed guide, read-only `git -C /Users/matt/src/matt-ramotar/Store6 show <revision>:<path>`, the failed Node parser inspection, and Python exact-span comparisons.
