# Background work and Meeseeks source record

Execution began 2026-09-11 at 04:07:57 UTC, with a 60-minute limit. This record is private authoring evidence outside the public content tree.

## Authority

| Input | Exact revision | Verified local root |
|---|---|---|
| Site baseline | `5c18ee5b11ba4f5c3b0b27f453213f69ab98fb61` | `/Users/matt/.codex/worktrees/638b/store-docs` |
| Site's pinned Store6 source | `ad435df1095673709a22f1b52a82aa03748cd9b3` | `/private/tmp/store6-agent-docs-source-20260908` |
| Store6 source for both drafts | `3d62af803b96e59af23e647228f0807f5c62b3e7` | `/private/tmp/store6-background-work-source-20260911` |

The planned candidate directory no longer existed. A local shared clone recovered the exact commit from `/Users/matt/src/matt-ramotar/Store6`, followed by a detached checkout. The new candidate checkout initially had no tracked or untracked changes. The original Store6 checkout remains untouched.

The implementation branch is `matt-ramotar/background-work-meeseeks-docs`. The plan and spec were untracked at execution start. The draft implementation does not change the site's source lock, content routes, or generated corpus.

## Reader task and shared example

The reader has a configured mutation store and needs pending writes to progress across connectivity and application lifetimes. Both guides use this explanatory sequence:

1. A user edits while offline. `mutate` records intent in the journal.
2. The application uses durable journal storage if pending intent must survive process death.
3. The user leaves the app. In-process execution alone cannot promise a later wake-up.
4. On reconstruction, the host opens the same journal and registers the same store name. A supported background grant or an explicit foreground/reconnect trigger supplies an execution opportunity.
5. The coordinator invokes a bounded mutation drain.
6. The mutation engine adopts the acknowledgement according to its durable receipt contract.
7. The UI reads pending-write state and the confirmed value. A worker finishing is not itself a mutation receipt.

`users` means a fully constructed `MutationStore`. `scope` is the host's application-owned `CoroutineScope`. `appContext` is the platform's Meeseeks context. Durable storage, the mutation server, mutator registration, and identity reconstruction belong to the existing mutation quickstart and journal/server guides. Snippets in these pages wire scheduling around that store; they do not construct all of those inputs.

The existing restart test reopens a store in the same test process. Its fixture is not evidence of operating-system process death, physical disk recovery, or device wake-up behavior.

## Ownership boundaries

- The mutation journal owns pending intent and durable acknowledgement state.
- The coordinator maps activations onto mutation drains and derives later work from store state. It owns neither transport nor connectivity monitoring.
- Meeseeks owns its scheduling state and dispatches the registered worker.
- The host initializes Meeseeks, registers workers and stores, reconstructs the mutation store, chooses scope lifetime, and supplies application-active/reachability hooks.

## Claim and evidence map

All candidate paths below are relative to `/private/tmp/store6-background-work-source-20260911` at `3d62af803b96e59af23e647228f0807f5c62b3e7`. A source inspection does not establish executed tests. Draft-specific additions and final verification results are recorded below as the two writers return.

| Reader claim | Source path and lines | Evidence kind | Observed result | Allowed wording |
|---|---|---|---|---|
| Coordinator owns no transport/connectivity monitor | `mutations-drain/README.md:3-6` | Source documentation | Inspected | Host supplies transport and connectivity triggers |
| Registration validates constraints | `mutations-drain/src/commonMain/kotlin/org/mobilenativefoundation/store6/mutations/drain/MutationDrainCoordinator.kt:63-69` | Implementation | Inspected | Unsupported constraints can fail during registration |
| Launch watching subscribes before an unconditional pass | Same coordinator file, `109-150` | Implementation | Inspected | `watch` starts collection before draining existing work |
| Reconcile runs an unconditional pass for idle registrations | Same coordinator file, `87-106` | Implementation | Inspected | Reconcile can recover work including retirement checkpoints invisible to pending inspection |
| Enqueue fast path omits pre-pass persisted safety activation | Same coordinator file, `138-145`; `DrainPolicy.kt:13-19` in that directory | Implementation | Inspected | `drainOnEnqueue = true` is in-process and does not prove a persisted wake-up for every enqueue |
| Explicit activation attempts safety scheduling but continues if scheduling fails | Same coordinator file, `154-181` | Interface and implementation | Inspected | Successfully persisted safety work is a wake-up hint, not guaranteed OS execution |
| Calling activation from the drain stack deadlocks | Same coordinator file, `161-163` | Interface contract | Inspected | Host calls activation outside server/mutator/conflict/source-of-truth/watch-handler execution |
| Close cancels watches without closing registered stores or pending scheduler work | Same coordinator file, `184-194` | Interface and implementation | Inspected | Host manages these lifetimes separately |
| Events are advisory and may drop old entries | Same coordinator file, `196-202` | Interface contract | Inspected | Use durable store inspection to reason about pending mutations |
| In-process scheduler ignores constraints | `mutations-drain/README.md:45-47` | Source documentation | Inspected | In-process timing does not establish OS constraint enforcement |
| Stable registration names survive app updates | `mutations-drain/README.md:65-73` | Source documentation | Inspected | Reuse the registered name; renaming leaves old payloads unavailable |
| Default journal does not survive process death | `mutations-drain/README.md:75-79` | Source documentation | Inspected | Install durable journal storage for restart durability |
| Meeseeks platform support differs | `mutations-drain-meeseeks/README.md:163-179` | Source documentation | Inspected | Describe the Android/iOS/JVM/JS rows with their constraints and lifetime limits |
| JVM 1.1.1 initialization and execution are different results | `mutations-drain-meeseeks/README.md:181-202` | Recorded source limitation | Inspected, not reproduced in this run | State the candidate's documented scheduling/recovery failures and compile-only example status |
| Scheduling artifacts target alpha02 | `STABILITY.md:60-61,88-91` | Candidate support policy | Inspected | A target does not establish artifact availability or an alpha01 installation promise |

## Snippet identities

| Draft | Marker | Candidate source |
|---|---|---|
| `background-work.mdx` | `mutations-drain-quickstart` | `mutations-drain/src/commonTest/kotlin/org/mobilenativefoundation/store6/mutations/drain/docs/DrainQuickstartDocsSnippet.kt` |
| `meeseeks.mdx` | `mutations-drain-meeseeks-jvm-wiring` | `mutations-drain-meeseeks/src/jvmTest/kotlin/org/mobilenativefoundation/store6/mutations/drain/meeseeks/docs/MeeseeksWiringDocsSnippet.kt` |

The first fixture includes an executable in-process quickstart test. The second is a compile-only host-wiring function and must not be invoked. Its old surrounding KDoc refers to Meeseeks 1.1.0's initialization failure. The candidate README and dependency use 1.1.1 and record a later scheduled-execution failure. Preserve the snippet body and omit the stale explanation.

## Source-alignment handoff

Target routes are `/docs/store6/mutations/background-work` and `/docs/store6/meeseeks`. Keep their drafts outside `content/` until a coherent source-alignment change satisfies all of the following:

1. Select one Store6 commit containing both scheduling modules and their compatible dependencies. The current site pin `ad435df1095673709a22f1b52a82aa03748cd9b3` contains neither module.
2. Review existing source mappings, claims, snippet paths, generated reference inputs, and policy wording at that revision. Candidate module directory renames make a bare re-pin invalid.
3. Verify public fetchability of the selected commit before expecting hosted CI to check it out.
4. Include links for both desired routes in authoritative Store6 `llms.txt`, commit them coherently with the selected source revision, and regenerate the site's discovery index through its owner.
5. Pass or independently account for the existing site/source verification baseline, then execute Tasks 6–8 in the plan. Recheck these drafts against the selected revision before promotion.

Do not backport scheduling modules onto the older source, add a second source-lock system, or anchor candidate behavior to the current site's revision. This dependency remains separate from writing the two guides.
