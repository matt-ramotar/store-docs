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

The exact candidate README is publicly readable: its `raw.githubusercontent.com` URL returned HTTP 200 during this run. That establishes source-blob availability only. It does not align existing site contracts or provide a released artifact.

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

All candidate paths below are relative to `/private/tmp/store6-background-work-source-20260911` at `3d62af803b96e59af23e647228f0807f5c62b3e7`. A source inspection does not establish executed tests. The following tables cover both finished drafts, including the orchestrator's corrections.

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

### Additional draft claims

These path prefixes keep the implementation anchors readable:

- `drain/` = `mutations-drain/src/commonMain/kotlin/org/mobilenativefoundation/store6/mutations/drain/`
- `adapter/` = `mutations-drain-meeseeks/src/commonMain/kotlin/org/mobilenativefoundation/store6/mutations/drain/meeseeks/`
- `mutation/` = `mutations/src/commonMain/kotlin/org/mobilenativefoundation/store6/mutations/`
- `drainTest/` = `mutations-drain/src/commonTest/kotlin/org/mobilenativefoundation/store6/mutations/drain/`
- `adapterJvmTest/` = `mutations-drain-meeseeks/src/jvmTest/kotlin/org/mobilenativefoundation/store6/mutations/drain/meeseeks/`

| Reader claim | Source path and lines | Evidence kind | Observed result | Allowed wording |
|---|---|---|---|---|
| A stale read can return before revalidation finishes | `docs/store6/important-defaults.md:16-42` | Source contract | Inspected | Cache revalidation follows read demand and engine lifetime; it does not install an OS job |
| Explicit drains are bounded calls, including when invoked in workers | `mutation/MutationStore.kt:255-289` | Public API contract | Inspected | Keyed and global drains are scheduler-agnostic passes |
| Journal storage defaults to memory and is retained by the store | `mutation/MutationStoreBuilder.kt:160-170` | Public API contract | Inspected | Use durable storage for process-death recovery; the scheduler cannot recover lost intent |
| Uncertain transport replays the immutable generation and idempotency key | `mutation/MutationProtocol.kt:168-183,254-269`; `mutation/storage/MutationJournalStorage.kt:121-125` | Public transport and receipt contracts | Inspected | Cancellation leaves uncertain `INFLIGHT` state; replay requires the same generation and an idempotent endpoint |
| Mutation eligibility differs from coordinator delay | `mutation/MutationEngine.kt:3904-3967`; `drain/MutationDrainCoordinator.kt:257-263` | Implementation | Inspected | The engine checks eligibility during a pass; the coordinator derives another activation |
| Pending writes, dead letters, and events have distinct meanings | `mutation/MutationStore.kt:307-339` | Public API contract | Inspected | Pending inspection contains nonterminal intents; dead letters are parked; events have no replay and may drop entries |
| In-process timers end with their supplied scope | `drain/InProcessDrainScheduler.kt:12-55` | Implementation | Inspected | Timers use the supplied scope and ignore constraints |
| Stable names have a constrained format | `drain/MutationDrainCoordinator.kt:52-69` | Public API contract | Inspected | Names match `[A-Za-z0-9._-]{1,64}` and remain stable across launches |
| Unregister and close have different lifecycle effects | `drain/MutationDrainCoordinator.kt:72-84,184-194`; `adapter/MeeseeksDrainScheduler.kt:84-92` | Public API and implementation | Inspected | Unregister cancels the watch and tracked pending activation; an in-flight pass may already have changed the journal; close does not close stores or cancel persisted scheduling |
| Both copied regions omit required enclosing opt-in | `drainTest/docs/DrainQuickstartDocsSnippet.kt:1-5,45-55`; `adapterJvmTest/docs/MeeseeksWiringDocsSnippet.kt:1,24-52` | Source fixture context | Inspected and exact region compared | Explain file/function-level opt-in adjacent to both snippets; Background also needs a coroutine or suspending function |
| The restart fixture reuses one in-memory storage object | `drainTest/RestartReplayTest.kt:19-57`; `drainTest/DrainTestFixtures.kt:155-192` | Test source and fresh JVM execution | One test passed | Same-process store reopening is tested; physical storage, process termination, and OS wake-up are not |
| Meeseeks manager initialization and worker registration belong to the host | `adapter/MeeseeksDrainScheduler.kt:18-28,33-48`; `adapter/StoreDrainWorker.kt:11-30` | Public API and implementation | Inspected | Supply one stable manager instance and register the payload/worker before accepting work |
| Attachment and store registration failures differ | `adapter/MeeseeksDrainScheduler.kt:95-96,126-127`; `drain/MutationDrainCoordinator.kt:165-181`; `adapter/internal/TaskRequestMapping.kt:29-36` | Implementation | Inspected | Unattached scheduler throws; attached coordinator with unknown name returns `Unavailable`, mapped to transient worker failure |
| Worker success is not a mutation receipt | `adapter/internal/TaskRequestMapping.kt:29-36`; `drain/MutationDrainCoordinator.kt:219-278,294-313` | Implementation | Inspected | A cleared pass or successfully scheduled follow-up can return success; inspect pending writes and dead letters |
| Store6 forwards network and charging only | `drain/DrainConstraints.kt:5-14`; `adapter/internal/TaskRequestMapping.kt:15-26` | Public API and mapping | Inspected | The adapter exposes two constraints; it does not forward every Meeseeks option |
| Default network constraint is rejected on JVM and JS | `drain/DrainConstraints.kt:8-14`; `adapter/MeeseeksDrainScheduler.kt:40-48`; `mutations-drain-meeseeks/README.md:172-179` | Public API and documented platform support | Inspected | Use false flags when appropriate, or an in-process scheduler |
| Candidate targets and Java requirement are limited | `mutations-drain-meeseeks/build.gradle.kts:8-29`; `gradle/libs.versions.toml:55` | Build configuration | Inspected | Android/JVM/iOS/JS targets, Meeseeks 1.1.1, Java 17 for JVM consumers; no wider target-resolution promise |
| Candidate coordinate is source metadata, not availability proof | `mutations-drain-meeseeks/gradle.properties:1-2`; `gradle.properties:11`; `mutations-drain-meeseeks/README.md:14-28` | Publication configuration | Inspected; no artifact availability test | Name the module and group, omit a runnable dependency declaration |
| Android host uses WorkManager and the Meeseeks worker factory | `mutations-drain-meeseeks/README.md:86-122,167,218` | Source documentation | Inspected, no device run | Explain Application setup, network/charging, and OS deferral; link the full example |
| iOS identifiers and lifecycle hooks are host configuration | `mutations-drain-meeseeks/README.md:124-161,168,214-217` | Source documentation | Inspected, no device run | Preserve both identifiers; supply foreground/reachability activation and recover on next user open |
| JVM execution and foreign-payload recovery remain unresolved | `mutations-drain-meeseeks/README.md:181-202`; `mutations-drain-meeseeks/build.gradle.kts:44-58` | Recorded upstream failures and test configuration | Inspected; opt-in suites not run | Record these as candidate limitations, not fresh reproductions or passing runtime evidence |
| Concurrent scheduling uniqueness remains a release requirement | `STABILITY.md:60-61`; `adapter/MeeseeksDrainScheduler.kt:52-118` | Support policy and implementation | Inspected, no cross-platform verification | Logical tracking is not proof of one invocation per mutation or universally safe overlap |

### Versioned upstream platform sources

`git ls-remote` resolved Meeseeks tag `v1.1.1` to `171c1a1301f7486b53b881cdcfaac6767c273276`. Both immutable platform documents were read and returned HTTP 200:

| Claim | Meeseeks source at `171c1a1301f7486b53b881cdcfaac6767c273276` | Evidence and allowed wording |
|---|---|---|
| Android configuration and factory | `docs/platforms/android.md:3-40` | Documented Application, `Configuration.Provider`, `DelegatingWorkerFactory`, and `MeeseeksWorkerFactory` setup; no device execution proof |
| Upstream Android constraints exceed the Store6 adapter surface | `docs/platforms/android.md:44-50` | Upstream supports battery-not-low too, but Store6's mapping fixes that flag to false |
| iOS identifiers, modes, and constraints | `docs/platforms/ios.md:3-32` | Exact identifiers plus app refresh/processing background modes; no invented literal plist mode values |
| iOS scheduling is best-effort | `docs/platforms/ios.md:36-40` | The database records work; OS task requests are hints, not timing guarantees |

The optional integration's platform and recovery descriptions remain source/documentation evidence. The offline edit is an explanatory application scenario, not a claim that every step was executed on a device.

## Snippet identities

| Draft | Marker | Candidate source |
|---|---|---|
| `background-work.mdx` | `mutations-drain-quickstart` | `mutations-drain/src/commonTest/kotlin/org/mobilenativefoundation/store6/mutations/drain/docs/DrainQuickstartDocsSnippet.kt` |
| `meeseeks.mdx` | `mutations-drain-meeseeks-jvm-wiring` | `mutations-drain-meeseeks/src/jvmTest/kotlin/org/mobilenativefoundation/store6/mutations/drain/meeseeks/docs/MeeseeksWiringDocsSnippet.kt` |

The first fixture includes an executable in-process quickstart test. The second is a compile-only host-wiring function and must not be invoked. Its old surrounding KDoc refers to Meeseeks 1.1.0's initialization failure. The candidate README and dependency use 1.1.1 and record a later scheduled-execution failure. Preserve the snippet body and omit the stale explanation.

The quickstart and restart tests executed in this run and passed, one test each. The Meeseeks compile task succeeded using `FROM-CACHE`, so no fresh compiler invocation is claimed. See `validation.md` for exact commands, timestamps, and limits.

## Source-alignment handoff

Target routes are `/docs/store6/mutations/background-work` and `/docs/store6/meeseeks`. Keep their drafts outside `content/` until a coherent source-alignment change satisfies all of the following:

1. Select one Store6 commit containing both scheduling modules and their compatible dependencies. The current site pin `ad435df1095673709a22f1b52a82aa03748cd9b3` contains neither module.
2. Review existing source mappings, claims, snippet paths, generated reference inputs, and policy wording at that revision. Candidate module directory renames make a bare re-pin invalid.
3. Verify public fetchability of the selected commit before expecting hosted CI to check it out.
4. Include links for both desired routes in authoritative Store6 `llms.txt`, commit them coherently with the selected source revision, and regenerate the site's discovery index through its owner.
5. Pass or independently account for the existing site/source verification baseline, then execute Tasks 6–8 in the plan. Recheck these drafts against the selected revision before promotion.

Do not backport scheduling modules onto the older source, add a second source-lock system, or anchor candidate behavior to the current site's revision. This dependency remains separate from writing the two guides.
