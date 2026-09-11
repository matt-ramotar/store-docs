# Background work and Meeseeks validation

Started 2026-09-11 04:07:57 UTC. Deadline 05:07:57 UTC. This is the private evidence record for the two guide drafts.

## Source inspection

- Site starts at `5c18ee5b11ba4f5c3b0b27f453213f69ab98fb61` with only the plan/spec untracked.
- Source lock remains `ad435df1095673709a22f1b52a82aa03748cd9b3`.
- The old candidate directory was absent. Recovered the exact `3d62af803b96e59af23e647228f0807f5c62b3e7` into `/private/tmp/store6-background-work-source-20260911` using a local shared clone and detached checkout. Source clean at setup.
- Source-alignment prerequisite is pending. Tasks 6–8 cannot promote these candidate APIs into the current site.

### Dependency recheck, 2026-09-11 04:32 UTC

The first execution turn made concrete progress: it completed, checked, reviewed, and committed both drafts and their evidence. The continuation checked for an existing aligned baseline before considering Task 6.

Public `main` returned HTTP 200 for both `evidence/T4-store6-source-lock.json` and `evidence/store6-claims.json`; both still name `ad435df1095673709a22f1b52a82aa03748cd9b3`. The current branch has the same source pin. Neither scheduling module exists at that Git revision.

A bounded read-only subagent inspected local site branch refs and their matched lock/claims revisions. It found five distinct source revisions (`ad435df1095673709a22f1b52a82aa03748cd9b3`, `5a8c956bc1dbd6ad838ea9da3b34c7d76c703a71`, `c67a94ed30460a35161c2cbc3e725f127caf055e`, `fc85a221140fb9f8b203acbe08007ba89123a2dc`, and `333a54d4d97eb7a37b45481e0cc4524f91c44476`). Including registered worktree heads adds `539614c06be1a8f20dead562585e47394551ebae` from a prunable detached worktree record. None of these six revisions contains either scheduling module or the new source discovery links. No site ref already pins the scheduling candidate. Local `main` at `25b253bb52458756ecb374956d97c7d6929dec40` is distinct from public main and pins `5a8c956bc1dbd6ad838ea9da3b34c7d76c703a71`; it is not an aligned replacement.

A direct comparison of all 13 locked source mappings with the scheduling candidate found:

- Five missing paths: `store6-compose/README.md`, `store6-sqldelight/README.md`, `store6-room/README.md`, `store6-realtime/README.md`, and `store6-graphql/README.md`.
- Seven changed source inputs: the four `docs/store6/` guides, `STABILITY.md`, `ROADMAP.md`, and `llms.txt`.
- One byte-identical input: `CONTRIBUTING.md`.
- Neither `/docs/store6/mutations/background-work` nor `/docs/store6/meeseeks` is present in the candidate's authoritative `llms.txt`.

This is a source migration prerequisite, not an unexecuted generator command. Task 6's source gate remains unsatisfied; Task 7's route/discovery integration and Task 8's built-site verification remain incomplete. No claim of full-plan completion is made.

## Environment

- Node `v22.22.0`; pnpm `10.30.3`.
- Dependencies were absent. First `pnpm install --frozen-lockfile` attempt exited 1 with `ENOTFOUND registry.npmjs.org` under restricted network access. The same locked install with authorized network access then exited 0, installing 506 packages and running `fumadocs-mdx`. No dependency or lockfile version changed.
- Initial local branch creation encountered sandbox filesystem denial. The authorized sandbox escalation succeeded and created `matt-ramotar/background-work-meeseeks-docs`.

## Snippet fidelity and draft parsing

Passed for both completed drafts, including a final check after the review corrections:

- Ran the plan's one-off `parsePage` and exact marked-source-region comparison using the recovered candidate root. Both Kotlin bodies match their source regions byte for byte after CRLF normalization.
- Lowered each real draft through the site's `lowerMdx` with `semanticContext([])`, serialized it to GFM, and parsed that Markdown again. Code language/body, table structure/cells, and links match the original draft AST. The Note/Warning callouts remain present and no MDX syntax remains in the lowered tree.
- All eight distinct local destinations resolve to six existing content pages or the two explicitly planned future routes.
- All 13 distinct external links use the exact Store6 candidate or Meeseeks 1.1.1 commit. Every URL returned HTTP 200. The upstream Android and iOS documents were read at that version, not inferred from the older local Meeseeks checkout.
- No TODO/TBD/FIXME placeholders remain. `git diff --check` passes.
- Existing parser/export tests: `node --test scripts/agent-docs.test.mjs scripts/agent-docs-lowering.test.mjs scripts/agent-docs-semantics.test.mjs` exited 0 with 34 passed, 0 failed, 0 skipped.

Final draft SHA-256 values:

| Draft | SHA-256 |
|---|---|
| `background-work.mdx` | `a8be52b7068ccfc0f69f7037e5f94a9d586a3a7d004b5f71690c1482674371b8` |
| `meeseeks.mdx` | `4ef8dbeaab28ce174d6792573ac1c4f213844cf0b678fb977290f2393132857d` |

These are draft parsing, source fidelity, and semantic Markdown checks. They do not establish browser rendering, public routes, or deployed endpoint behavior. The existing Node module-type warning was emitted during the semantic checks.

## Snippet compilation

Ran `./gradlew :mutations-drain-meeseeks:compileTestKotlinJvm` in `/private/tmp/store6-background-work-source-20260911`. Exit 0, `BUILD SUCCESSFUL in 1s`. The target `compileTestKotlinJvm` was `FROM-CACHE`: compatible task output was restored, but no fresh compiler invocation occurred. This is neither fresh compilation nor runtime execution evidence. No rerun was performed to strengthen the result.

## In-process execution and simulated restart

Ran `./gradlew :mutations-drain:jvmTest --tests '*DrainQuickstartDocsSnippet*' --tests '*RestartReplayTest*'` in `/private/tmp/store6-background-work-source-20260911`. Exit 0, `BUILD SUCCESSFUL in 3s`. Compilation dependencies used cached outputs, but `:mutations-drain:jvmTest` executed freshly.

Inspected both XML files under `mutations-drain/build/test-results/jvmTest/`:

| Class | Test | Timestamp UTC | Outcome |
|---|---|---|---|
| `org.mobilenativefoundation.store6.mutations.drain.RestartReplayTest` | `watchLaunchPassReplaysJournalAfterStoreRestart[jvm]` | 2026-09-11 04:12:55 | 1 test, 0 failures, 0 errors, 0 skips |
| `org.mobilenativefoundation.store6.mutations.drain.docs.DrainQuickstartDocsSnippet` | `watchAndManualActivationDrainPendingWrite[jvm]` | 2026-09-11 04:12:56 | 1 test, 0 failures, 0 errors, 0 skips |

The tests validate an in-process fixture and reopening a store in the same test process. They do not establish physical disk recovery, process-death behavior, or operating-system activations. Gradle emitted pre-existing deprecation and configuration-on-demand warnings. No Gradle startup safety rejection occurred.

## Android, iOS, and device execution

Not run. No claim of OS wake-up, physical process-death recovery, device timing, or platform constraint enforcement is established by source inspection or JVM fixtures.

## Known-red Meeseeks integration boundary

The candidate excludes `MeeseeksExecutionIntegrationTest` and `MeeseeksRecoveryIntegrationTest` from default JVM tests unless `-Pstore6.meeseeksJvmIntegration` is present. The README records scheduled-execution and foreign-payload recovery failures. Those release investigations are outside this writing task and will not be run or described as passing.

## Local site rendering and deployed checks

Rendering and deployed checks not run. Drafts remain outside the public route tree until source alignment is complete. Local site rendering, search, canonical Markdown endpoint verification, and deployed behavior are separate Milestone B evidence.

Existing baseline preservation checks did run:

- `node scripts/sync-store6-docs.mjs --source-root /private/tmp/store6-agent-docs-source-20260908 --check`: exit 0, checked 13 locked outputs at `ad435df1095673709a22f1b52a82aa03748cd9b3`.
- `node scripts/build-agent-docs.mjs --check`: exit 0, checked 45 agent-doc outputs. An existing Node module-type warning was emitted.
- Candidate README public availability: a GET to `https://raw.githubusercontent.com/matt-ramotar/Store6/3d62af803b96e59af23e647228f0807f5c62b3e7/mutations-drain-meeseeks/README.md` returned HTTP 200. Earlier browser-tool cache misses did not establish HTTP failure. This proves that source blob is public, not that source alignment has occurred.

## Reviews

Two bounded writers, each using `gpt-5.6-sol` at high effort, owned one draft apiece. They completed factual accuracy, warranted guarantees, and reader-utility passes, then Matt's three writing-voice passes. The orchestrator retained ownership of shared records, Gradle, and commits. The writers changed only their assigned page.

The orchestrator checked the shared scenario and source assertions, correcting cache-revalidation lifetime, transport-idempotency wording, platform grant qualifiers, and the cancellation/re-registration verification recipe. The Meeseeks startup guidance now distinguishes missing payload registration, missing coordinator attachment, and an unknown store name.

One independent `gpt-6-astra` reviewer at high effort found an omitted Kotlin-context prerequisite: the visible local-variable opt-in does not cover later statements, and the Background example's direct activation needs an enclosing suspending context. Adjacent prose now explains file/function-level `ExperimentalStoreApi` opt-in for both snippets and the Background coroutine/suspending-function requirement. The exact copied regions remain unchanged. The reviewer found no other blocking factual or guarantee errors. The orchestrator checked the corrections against source and repeated the affected draft checks. No recursive review was requested.

## Spec acceptance and local checkpoints

| Acceptance item | Result |
|---|---|
| Complete Background work and Meeseeks prose | Complete, with the requested frontmatter, scenario, prerequisites, exact snippets, platform sections, recovery guidance, and next-page links |
| Source authority and support status | Both drafts point to the inspected scheduling candidate; optional/experimental alpha02 targets and runtime gaps remain explicit |
| Warranted guarantees | No exactly-once, bounded wake-up latency, universal constraints, or in-memory process-durability promise |
| Evidence classes remain distinct | Fresh in-process tests, cached compilation output, source-documented platform behavior, and unexecuted device/site/deployed checks are identified separately |
| Source-alignment handoff | Complete in `sources.md`, including both routes, old/candidate revisions, snippet paths, source-owned discovery links, and the one-revision acceptance conditions |
| Existing public site | Source lock, content, navigation, application code, dependency versions, and generated corpus remain unchanged |

Local checkpoint commits: `e1a764d` records the initial sources, `e9f0f65` adds Background work, and `224e67c` adds Meeseeks. The final evidence checkpoint uses `docs: verify background work documentation drafts`. Plan/spec progress is recorded separately. At the drafting closeout, nothing had been pushed, opened as a PR, merged, deployed, or released.

## PR handoff

The user subsequently confirmed that source alignment is handled in a different session and authorized committing and opening a PR. The PR scope is the two completed drafts, their plan/spec, and evidence records. Public-page integration remains a separate follow-up after source alignment.

Pre-push verification repeated the actual draft content-hash, exact source-snippet, MDX parsing, and semantic Markdown roundtrip checks successfully. The existing export checks also passed again: 45 agent-doc outputs and 13 locked Store6 outputs. Source behavior and Kotlin bodies did not change, so Gradle was not rerun. Earlier fresh JVM test results and cached compilation output retain their evidence boundaries above.

## Completion status

Milestone A is complete within the 60-minute limit. Milestone B remains pending the separate source-alignment dependency. Per Task 5, execution stops before Task 6: the current site pin lacks both documented scheduling modules, and the candidate cannot replace it without migrating existing source contracts and discovery inputs coherently. The full implementation goal is not complete while integrated guides and their required verification are missing.
