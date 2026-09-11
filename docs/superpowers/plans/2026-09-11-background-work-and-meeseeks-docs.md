# Background Work and Meeseeks Documentation Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Write complete, source-backed Background work and Meeseeks guides, then integrate them into the Store6 site once its source revision coherently includes the documented scheduling APIs.

**Architecture:** Write two hand-authored guides using the site's existing MDX components and one shared offline-write scenario. Draft against the inspected scheduling candidate outside the public content tree; promote both pages only after the independent source-alignment dependency is satisfied. Reuse existing snippets, claims, route census, search, and Markdown generation machinery.

**Tech Stack:** Markdown/MDX, Next.js 16.3, Fumadocs, pnpm 10.30.3, Node 22.18+, Kotlin Multiplatform, Store6 mutations/drain modules, Meeseeks 1.1.1 as recorded in the candidate, existing Node contract tests and Gradle tests.

---

## Scope and execution boundaries

Spec: `docs/superpowers/specs/2026-09-11-background-work-and-meeseeks-docs.md` in the site repository.

This is one documentation project: the background-work guide establishes the responsibilities consumed by the Meeseeks guide. The source-alignment migration is a separate prerequisite, not a third guide or an implicit implementation task here.

**Execution update, 2026-09-11:** The user authorized execution with scoped subagents, requested Matt's writing voice, set a 60-minute limit, and prohibited recursive reviews. Apply voice to eligible narrative prose after the factual pass. The orchestrator owns shared records, Gradle, and commits. The candidate temp directory disappeared; the exact planned commit was recovered at `/private/tmp/store6-background-work-source-20260911`. Substitute this verified root for the old candidate path in commands below. These instructions supersede the planning-only authority note and optional-voice wording below. Milestone B's source-alignment dependency remains in force.

**Milestone A: complete reviewable drafts.** Tasks 1–5 can run against the current checkout. Complete both pages even if source alignment is pending. Keep drafts outside `content/` and the agent corpus.

**Milestone B: integrated site pages.** Tasks 6–8 require the source-alignment acceptance conditions below. Until those pass, report “both drafts complete; site integration pending source alignment.” Do not report both public guides complete.

Use @authoring:documentation-discipline for exact contracts and reader utility. Use @superpowers:verification-before-completion before reporting either milestone. Apply Matt's writing voice to narrative prose while preserving source contracts and technical qualifiers. Do not add tests that merely assert prose wording; reuse semantic export, source-snippet, route, and search checks.

Do not run Gradle concurrently. One integration owner holds the Gradle and generated-file write responsibility. Preserve the first failing output. A wrapper rejection before Gradle startup means zero tests executed; do not probe caches, daemons, or locks or try alternate rejected variants.

Commit boundaries below are local implementation checkpoints. The user's execution request authorizes the local checkpoints. Pushing, opening a PR, merging, deploying, and releasing remain outside this task.

## Workspace and source map

Paths below are exact repository-relative paths under these roots. Shell commands run in the site root unless a working directory is specified.

| Name | Inspected root | Role |
|---|---|---|
| Site | `/Users/matt/.codex/worktrees/638b/store-docs` | Dedicated existing site worktree; planning HEAD `5c18ee5b11ba4f5c3b0b27f453213f69ab98fb61` |
| Pinned source | `/private/tmp/store6-agent-docs-source-20260908` | Store6 `ad435df1095673709a22f1b52a82aa03748cd9b3`; authority for current published inputs |
| Candidate source | `/private/tmp/store6-alpha-candidate-2026-09-06` | Store6 `3d62af803b96e59af23e647228f0807f5c62b3e7`; authority for the drafts |
| Meeseeks source | `/Users/matt/src/matt-ramotar/meeseeks` | Local checkout was 1.1.0-era; do not use it as authority for 1.1.1-specific fixes |

Temporary paths are discovery aids. Verify exact revisions before use. If a path has disappeared, locate the same commit in an available Store6 checkout; do not silently substitute branch HEAD. Use a fresh isolated worktree if implementation needs a writable source checkout. Read its `AGENTS.md` first.

### Why a bare re-pin is insufficient

`evidence/T4-store6-source-lock.json` and `evidence/store6-claims.json` share one revision. `scripts/check-claims.mjs` reads Store6 anchors from that pinned Git object. `scripts/sync-store6-docs.mjs` additionally requires the source checkout HEAD and file hashes to match the lock. Candidate directories such as `core`, `mutations`, and `compose` replace older `store6-*` paths, and existing guides and policy have changed.

The source-alignment prerequisite must deliver:

1. One explicit Store6 commit containing the scheduling modules and their compatible core/mutations dependencies.
2. A site baseline whose existing source mappings, snippets, generated references, policy wording, claims, and publication transforms have been reviewed against that commit, with existing checks passing or independently documented blockers.
3. Public fetchability of the pinned commit before hosted CI is claimed possible. A commit present only in a local object database is insufficient.
4. A source `llms.txt` update that can include both eventual page routes, incorporated into the selected coherent source commit. The site does not hand-edit its generated `public/llms.txt`.

Do not run the re-pin helper merely to satisfy this list. Its current mappings refer to files absent from the candidate. Do not add candidate files to the old source tree or change validators to accept mixed revisions.

## File structure and ownership

### Milestone A files in the site repository

| File | Responsibility |
|---|---|
| `docs/superpowers/drafts/store6-background-work/background-work.mdx` | Complete Background work draft; eventual route `/docs/store6/mutations/background-work` |
| `docs/superpowers/drafts/store6-background-work/meeseeks.mdx` | Complete Meeseeks draft; eventual route `/docs/store6/meeseeks` |
| `docs/superpowers/drafts/store6-background-work/sources.md` | Exact commits, claim-to-source map, snippet identities, version boundaries, and source-alignment handoff |
| `docs/superpowers/drafts/store6-background-work/validation.md` | Commands, outcomes, evidence classes, and remaining integration dependency |

Keep these records out of the public export corpus. Do not copy private task IDs, local paths, or review-process terminology into the page bodies.

### Milestone B site files

| Action and file | Responsibility |
|---|---|
| Create `content/docs/store6/mutations/background-work.mdx` | Promote reviewed background-work draft as a hand-authored page |
| Create `content/docs/store6/meeseeks.mdx` | Promote reviewed integration draft; Integrations is a sidebar divider, not a directory |
| Modify `content/docs/store6/mutations/meta.json` | Insert `background-work` immediately after `drain-and-restart` |
| Modify `content/docs/store6/meta.json` | Insert `meeseeks` after `graphql` in Integrations |
| Modify `content/docs/store6/mutations/drain-and-restart.mdx` | Clarify that the mutation engine does not schedule itself; link to Background work |
| Modify `content/docs/store6/mutations/index.mdx` | Add the background-work guide to the existing guide table |
| Modify `evidence/store6-claims.json` | Add verified claims for both pages and reconcile affected existing anchors |
| Modify `evidence/store6-snippets.json` | Register both existing source snippet regions and their new page consumers |
| Modify `scripts/t8-verification.mjs` | Add two `FIXED_EXTRA_SOURCES` entries |
| Modify `scripts/t8-verification.test.mjs` | Update mutation-route list and fixture extras/source files |
| Modify `evidence/T8-extras.txt` | Add both exact routes in sorted order |
| Modify `scripts/agent-docs/config.json` | Add both MDX source paths in sorted order |
| Modify `scripts/agent-docs-bundle.test.mjs` | Update actual corpus/output census and assert inclusion of the two page identities |
| Modify `scripts/t4-contract.test.mjs` | Update exact sidebar/llms inventories where affected |
| Modify `scripts/verify-search-index.mjs` | Add built-index assertions that each new topic returns its page |
| Generated `public/llms/store6/mutations/background-work.md`, `public/llms/store6/meeseeks.md` | Canonical Markdown versions |
| Generated `public/llms/store6-manifest.json`, `public/llms-full.txt`, existing Markdown for the two edited mutation pages | Updated corpus metadata, bundle, and cross-linked pages |
| Generated `public/llms.txt`, `evidence/T4-owned-targets.json` | Source-owned discovery index and sync ownership after the aligned source's index update |

Both generators use `evidence/T4-owned-targets.json` with separate owners. `evidence/T4-store6-source-lock.json`, `scripts/store6-prose-edits.json`, `scripts/repin-store6-lock.mjs`, and existing source-owned pages belong to the prerequisite's alignment work. The two guides do not introduce a second lock or generator.

### Source files to read; no source behavior changes

All of these exist in the inspected candidate:

- `STABILITY.md` (artifact roster and caveats), `mutations-drain/README.md`, `mutations-drain-meeseeks/README.md`, `mutations-drain-meeseeks/build.gradle.kts`.
- `mutations-drain/src/commonMain/kotlin/org/mobilenativefoundation/store6/mutations/drain/MutationDrainCoordinator.kt`.
- `mutations-drain/src/commonMain/kotlin/org/mobilenativefoundation/store6/mutations/drain/DrainPolicy.kt`.
- `mutations-drain/src/commonMain/kotlin/org/mobilenativefoundation/store6/mutations/drain/DrainConstraints.kt`.
- `mutations-drain/src/commonTest/kotlin/org/mobilenativefoundation/store6/mutations/drain/docs/DrainQuickstartDocsSnippet.kt`.
- `mutations-drain/src/commonTest/kotlin/org/mobilenativefoundation/store6/mutations/drain/WatchTest.kt`, `RunActivationTest.kt`, and `RestartReplayTest.kt` in that same package directory.
- `mutations-drain-meeseeks/src/commonMain/kotlin/org/mobilenativefoundation/store6/mutations/drain/meeseeks/MeeseeksDrainScheduler.kt`, `StoreDrainWorker.kt`, and `StoreDrainPayload.kt` in that directory.
- `mutations-drain-meeseeks/src/jvmTest/kotlin/org/mobilenativefoundation/store6/mutations/drain/meeseeks/docs/MeeseeksWiringDocsSnippet.kt`.
- `mutations-drain-meeseeks/src/jvmTest/kotlin/org/mobilenativefoundation/store6/mutations/drain/meeseeks/MeeseeksExecutionIntegrationTest.kt` and `MeeseeksRecoveryIntegrationTest.kt`.

## Task 1: Record source authority and the shared example

**Files:** Create `docs/superpowers/drafts/store6-background-work/sources.md` and `validation.md`. Read the source map above and the spec.

- [x] **Step 1: Confirm clean inputs.** Run separately:

```bash
git status --short
git rev-parse HEAD
git -C /private/tmp/store6-agent-docs-source-20260908 rev-parse HEAD
git -C /private/tmp/store6-alpha-candidate-2026-09-06 rev-parse HEAD
git -C /private/tmp/store6-alpha-candidate-2026-09-06 status --short
```

Expected: recorded revisions match the source map, with any changes explained before relying on them. Preserve unrelated files. If implementation starts detached, create `matt-ramotar/background-work-meeseeks-docs` before its first commit; do not reuse or overwrite an existing branch without inspecting it.

- [x] **Step 2: Record the two ownership boundaries in `sources.md`.** Store6's mutation journal owns pending intent and acknowledgement state. The coordinator/scheduler provides execution opportunities. The host owns store reconstruction, worker registration, lifecycle/reachability signals, and scheduler configuration. Cite exact file, commit, and line ranges; public links use immutable commit URLs.
- [x] **Step 3: Inventory evidence in a table.** Columns: reader claim; source revision/path/lines; evidence kind; observed result; allowed wording. Include journal durability, `watch` launch/enqueue behavior, `runActivation`, pending/dead-letter truth, constraints, cancellation, JVM limitations, and the artifact roster. A source test existing is “test source inspected,” not “test passed.”
- [x] **Step 4: Define the example's acceptance trace in `sources.md`.** A mutation is queued while offline; durable storage is required for process death; replacement host reconstructs the store and registration; a grant or foreground reconciliation invokes a drain; acknowledgement adoption changes durable state; the UI observes pending-write state. Name app-owned inputs (`users`, `scope`, `appContext`, durable storage) and link to their existing setup guides. The existing restart fixture reopens a store in one test process; it does not prove OS process-death or device wake-up behavior.
- [x] **Step 5: Create the evidence sections in `validation.md`.** Use separate sections for source inspection, snippet fidelity, snippet compilation, in-process execution, simulated restart, Android/iOS/device execution, local site rendering, and deployed checks. Initialize unexecuted sections as “not run.” Record the source-alignment prerequisite as pending.
- [x] **Step 6: Commit the source brief.** Stage only the two created files and use `docs: record background work guide sources`.

## Task 2: Write the Background work guide

**Files:** Create `docs/superpowers/drafts/store6-background-work/background-work.mdx`. Read candidate drain sources and the site's existing `mutations/drain-and-restart.mdx`, `journal-storage.mdx`, `server.mdx`, and `pending-write-ui.mdx`.

- [x] **Step 1: Write frontmatter and the opening.** Title `Background work`; description `Schedule pending mutation work across connectivity and application lifetimes.` Explain the offline-write task before introducing API names. Add the following candidate-specific callout; revalidate it at promotion:

```mdx
<Callout type="Note">

**Experimental integration.** This guide describes `mutations-drain` in the Store6
source revision linked below. The artifact targets alpha02 and is outside the
alpha01 publication roster. The target does not establish artifact availability.

</Callout>
```

- [x] **Step 2: Write `## What background work means here`.** Add a three-row table: cache revalidation triggered by read demand; one explicit `drain` pass; scheduled activation that later invokes a pass. Explain the scope lifetime and trigger for each. Core cache revalidation does not install an OS job. `drain` being a foreground pass describes the bounded call, and it can be called from a worker.
- [x] **Step 3: Write `## Follow an offline edit`.** Walk the seven-step trace from Task 1. Use a numbered list and existing pending-write UI links. State that no scheduler reconstructs lost in-memory intents. Distinguish an acknowledged mutation from successful execution of a worker invocation.
- [x] **Step 4: Write `## Choose a trigger`.** Compare explicit foreground/reconnect calls, coordinator launch/enqueue watching, `InProcessDrainScheduler`, and Meeseeks-backed activations. Explain that in-process work ends with its host scope/process, the host supplies connectivity signals, and Meeseeks is optional. Link to `/docs/store6/meeseeks` for platform-backed setup.
- [x] **Step 5: Write `## Register and run a store`.** Copy the existing source region `mutations-drain-quickstart`, with `{/* snippet: mutations-drain-quickstart */}` immediately before its Kotlin fence. Its complete body at the inspected candidate is:

```kotlin
    @OptIn(ExperimentalStoreApi::class)   // required: the whole module is experimental
    val coordinator = mutationDrainCoordinator(InProcessDrainScheduler(scope))
    coordinator.register("com.example.users", users)
    val watch = scope.launch { coordinator.watch("com.example.users") }
    coordinator.runActivation("com.example.users")
```

Explain all omitted setup: `users` is an already constructed `MutationStore`; `scope` is an application-owned `CoroutineScope`; `watch` must run as a coroutine. Link the mutating/durable-store setup rather than implying this five-line fragment constructs it. Give exact imports from the source file as inline identifiers or an adjacent explained list. Explain stable registration names, cancellation, and explicit coordinator cleanup; closing the coordinator does not close the store or cancel every persisted activation.
- [x] **Step 6: Write `## Recover pending work`.** Explain startup reconciliation, reuse of the same durable journal, and foreground reconnect without a new enqueue. `watch` runs an unconditional launch pass; `reconcile()` visits registrations. Explain the host hook `runActivation(storeName)` and warn against calling it from a server, mutator, conflict policy, source-of-truth implementation, or a watch event handler on the drain stack.
- [x] **Step 7: Write `## Retries, cancellation, and progress`.** Explain `DrainPolicy.drainOnEnqueue`'s default in-process fast path and its lack of a pre-pass persisted safety activation. Keep scheduling backoff distinct from mutation eligibility and transport idempotency. Describe uncertain remote acceptance and durable acknowledgement recovery by linking the server contract. Use `pendingWrites()`/`deadLetters()` as truth; events are advisory. Avoid unconditional claims that every enqueue receives a durable wake-up or that all scheduler overlaps are verified safe.
- [x] **Step 8: Write `## Verify the integration` and the next-page link.** Give checks for launch, reconnect without a new write, cancellation, restart with durable storage, and no work remaining. State which are modeled by existing tests and which need device evidence. End with one forward link to Meeseeks and contextual links to drain-and-restart, journal storage, inspection, and pending-write UI in the relevant sections.
- [x] **Step 9: Check the page against the source/evidence table and commit.** Confirm each behavioral assertion has an evidence row; preserve technical qualifiers. Commit only the draft with `docs: draft background work guide`.

## Task 3: Write the Meeseeks integration guide

**Files:** Create `docs/superpowers/drafts/store6-background-work/meeseeks.mdx`. Read candidate adapter README, code, build file, and tests.

- [x] **Step 1: Write frontmatter and support status.** Title `Meeseeks`; description `Connect Store6 mutation drains to Meeseeks scheduling.` Start with its relationship to the Background work guide. State that `mutations-drain-meeseeks` is optional, experimental, targets alpha02 in the inspected source, and has unresolved JVM execution/recovery and scheduling-verification requirements. Do not claim a Maven artifact is available from its source README's SNAPSHOT dependency block.
- [x] **Step 2: Write `## Before you start`.** List a durable mutation store, stable store registration name, application-owned scope, a single host-owned Meeseeks manager, and platform setup. Explain the candidate's Android/JVM/iOS/JS target subset and Java 17 consumer requirement; a larger shared target set cannot assume this artifact resolves everywhere. Link a source/build file for candidate coordinates; add a runnable dependency line only after an actual published version has been verified for the documented Store6 revision.
- [x] **Step 3: Write `## How the adapter fits`.** Use a short ordered flow: host/OS activation → Meeseeks worker → drain coordinator → `MutationStore.drain()` → journal state. The adapter does not initialize Meeseeks or own transport. The journal owns mutations; Meeseeks owns scheduling state. Worker completion alone is not a durable mutation receipt.
- [x] **Step 4: Write `## Wire the host`.** Copy region `mutations-drain-meeseeks-jvm-wiring` from `MeeseeksWiringDocsSnippet.kt`, with the matching MDX snippet marker. Use its complete body:

```kotlin
    @OptIn(ExperimentalStoreApi::class)   // required: the whole module is experimental
    lateinit var bgTaskManager: BGTaskManager
    val drainScheduler = MeeseeksDrainScheduler(manager = { bgTaskManager })
    bgTaskManager =
        Meeseeks.initialize(appContext) {
            register<StoreDrainPayload> { workerContext ->
                StoreDrainWorker(workerContext, drainScheduler)
            }
        }
    val coordinator = mutationDrainCoordinator(drainScheduler)
    coordinator.register(
        "com.example.users",
        users,
        DrainPolicy(
            constraints = DrainConstraints(
                requiresNetwork = false,
                requiresCharging = false,
            ),
        ),
    )
    val watch = scope.launch { coordinator.watch("com.example.users") }
    scope.launch { coordinator.runActivation("com.example.users") }
```

Label this **compile-only JVM host wiring** next to the fence; do not instruct the reader to invoke the source fixture. Explain why JVM constraint flags are false, how existing Meeseeks users add one worker registration to their existing manager, why the manager lambda must keep returning the same manager, and which inputs the host supplies. The source file's old KDoc mentions the 1.1.0 initialization failure; current candidate dependencies/README use 1.1.1, whose recorded failure is scheduled execution. Do not copy that stale KDoc into the guide.
- [x] **Step 5: Write `## Android setup`.** Explain `Application`/WorkManager configuration and `MeeseeksWorkerFactory` using the candidate README and the corresponding version of upstream platform docs. Network/charging constraints are supported. Explain Doze/background restrictions and durable-journal requirements. Link the full platform wiring example instead of presenting an uncompiled adaptation as verified Kotlin.
- [x] **Step 6: Write `## iOS setup`.** List the two exact identifiers `dev.mattramotar.meeseeks.task.refresh` and `dev.mattramotar.meeseeks.task.processing` under `BGTaskSchedulerPermittedIdentifiers`, required background-mode setup, and the app-active/reachability hook. Explain best-effort OS execution and recovery when the app next opens. Link version-appropriate upstream setup. Record platform claims as documentation/source evidence unless actual device validation exists.
- [x] **Step 7: Write `## Platform behavior` as a four-row table.** Android: WorkManager, network/charging, OS deferral. iOS: BGTaskScheduler, network/charging, OS-managed opportunities. JVM: Quartz, neither constraint supported, candidate's known execution/recovery gaps, use `InProcessDrainScheduler` where appropriate. JS: neither constraint supported, lifetime limits, in-process alternative. Limit the table to constraints exposed by Store6's `DrainConstraints`; do not imply every Meeseeks option is forwarded by this adapter.
- [x] **Step 8: Write `## Recovery and troubleshooting`.** Cover missing worker registration, unstable registration names, reconstruction order, foreground reconnect, unsupported constraints failing early, lost in-memory journal, the recorded JVM foreign-payload recovery issue, and worker success while mutation state remains pending/dead-lettered. State that scheduling uniqueness remains a verification requirement in the candidate; avoid an unconditional delivery/overlap guarantee.
- [x] **Step 9: Write `## Verify your host`.** Give a practical matrix: enqueue offline; restore connectivity while foregrounded without another edit; leave and reopen; cancellation during execution; background grant on supported devices; inspect pending/dead-letter state. Distinguish a compiled wiring block from runtime evidence. End with one next step to `/docs/store6/mutations/inspection` and a contextual backlink to Background work.
- [x] **Step 10: Review facts against sources and commit.** Commit only this draft with `docs: draft Meeseeks integration guide`.

## Task 4: Validate draft structure, snippets, and evidence

**Files:** Read both draft pages and their source snippets. Update `sources.md` and `validation.md`. No permanent prose-matching test file is needed.

- [x] **Step 1: Select a suitable Node runtime.** Run `node --version`; use Node 22.18+ (22.22+ preferred). If the shell has nvm, the existing project recipe is:

```bash
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
nvm use 22 >/dev/null
```

- [x] **Step 2: Parse both drafts and compare their marked snippets to candidate source.** First check whether project dependencies are installed. They were absent in this planning worktree. If missing, use `pnpm install --frozen-lockfile` with the established licensed dependency environment; do not print or invent credentials. If provisioning is unavailable, record draft parsing as unexecuted and still complete the source/prose review. Once dependencies are available, run this complete one-off check from the site root:

```bash
node --input-type=module <<'NODE'
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parsePage } from './scripts/agent-docs/parse.mjs';
const draftRoot = 'docs/superpowers/drafts/store6-background-work';
const sourceRoot = '/private/tmp/store6-alpha-candidate-2026-09-06';
const pairs = [
  ['background-work', 'mutations-drain-quickstart', 'mutations-drain/src/commonTest/kotlin/org/mobilenativefoundation/store6/mutations/drain/docs/DrainQuickstartDocsSnippet.kt'],
  ['meeseeks', 'mutations-drain-meeseeks-jvm-wiring', 'mutations-drain-meeseeks/src/jvmTest/kotlin/org/mobilenativefoundation/store6/mutations/drain/meeseeks/docs/MeeseeksWiringDocsSnippet.kt'],
];
for (const [page, name, path] of pairs) {
  const mdx = await readFile(`${draftRoot}/${page}.mdx`, 'utf8');
  const parsed = parsePage(mdx, `${page}.mdx`);
  assert.ok(parsed.tree.children.length > 0);
  const source = (await readFile(`${sourceRoot}/${path}`, 'utf8')).replaceAll('\r\n', '\n');
  const lines = source.split('\n');
  const start = lines.findIndex(line => line.trim() === `// docs:snippet:${name}`);
  const end = lines.findIndex((line, index) => index > start && line.trim() === '// docs:snippet:end');
  assert.ok(start >= 0 && end > start, `missing source region ${name}`);
  const expected = lines.slice(start + 1, end).join('\n');
  const marker = `{/* snippet: ${name} */}`;
  assert.equal(mdx.split(marker).length, 2, `expected one marker ${name}`);
  const fence = mdx.slice(mdx.indexOf(marker) + marker.length).match(/^\s*```kotlin\n([\s\S]*?)\n```/);
  assert.ok(fence, `missing Kotlin fence after ${name}`);
  assert.equal(fence[1], expected, `${name} drifted from candidate source`);
}
console.log('Both drafts parse; both Kotlin snippets match candidate source.');
NODE
```

Expected: the printed success line. This proves parsing and snippet fidelity only. If the selected source changes, rebind `sourceRoot` only after Task 1's authority record is updated.
- [x] **Step 3: Check all links and claims manually.** Every local public destination must either already exist or be one of the two declared future routes. Verify source links use exact public commit URLs and upstream links support the stated version. Every scheduling/support claim must have a `sources.md` row. Remove placeholders and TODOs from finished drafts.
- [x] **Step 4: Run a narrow existing in-process test set, once, if local source execution is authorized and available.** Working directory: candidate source. Use one serialized invocation:

```bash
./gradlew :mutations-drain:jvmTest --tests '*DrainQuickstartDocsSnippet*' --tests '*RestartReplayTest*'
```

Expected on a functioning environment: both named test classes execute successfully. Inspect `mutations-drain/build/test-results/jvmTest/` for the exact executed test names. `FROM-CACHE`/`UP-TO-DATE` is not fresh execution. On a startup or test failure, preserve the first result and report that evidence class accurately; do not expand into scheduler fixes or rerun to green.
- [x] **Step 5: Compile the existing Meeseeks host snippet, once, under the candidate's Java 17 toolchain.** Working directory: candidate source.

```bash
./gradlew :mutations-drain-meeseeks:compileTestKotlinJvm
```

Expected: compilation succeeds. This neither invokes `wireJvmHost` nor establishes scheduled execution. If Task 4 Step 4 hit a wrapper/safety rejection, do not try this as a workaround; mark it unexecuted under the same boundary.
- [x] **Step 6: Record the known-red integration boundary without executing unrelated release work.** Candidate `jvmTest` excludes `MeeseeksExecutionIntegrationTest` and `MeeseeksRecoveryIntegrationTest` unless `-Pstore6.meeseeksJvmIntegration` is present. Record that default unit success cannot clear these failures. Running that property-gated release investigation is outside this writing task.
- [x] **Step 7: Review each page in three passes: factual accuracy, warranted guarantees, reader utility.** Correct duplicated explanations by linking between pages. Check that the offline-edit scenario is coherent and that device/OS guarantees are not inferred from in-process fixtures.
- [x] **Step 8: Commit validated drafts and their evidence record.** Use `docs: verify background work documentation drafts` with only the four draft/evidence files staged as applicable.

## Task 5: Close the drafting milestone and hand off source alignment

**Files:** Update `sources.md` and `validation.md`.

- [x] **Step 1: Compare both completed drafts to the spec's deliverables and acceptance list.** Record any unavailable validation explicitly, not as a completed check.
- [x] **Step 2: Write the exact alignment handoff in `sources.md`.** Include both desired routes, candidate SHA, the existing incompatible site pin, the two snippet regions/paths, the needed source `llms.txt` links, and the one-revision acceptance conditions. Explain that existing page/policy/reference migration must happen coherently before these pages enter `content/`.
- [x] **Step 3: Report Milestone A complete.** Link both draft files and the validation record. If alignment is pending, state the dependency and stop before Task 6. This is a source-authority dependency, not a request to re-approve writing the guides. Resume Task 6 when the dependency exists.

## Task 6: Promote both guides after coherent source alignment

**Files:** Create the two final MDX paths. Modify navigation, `mutations/index.mdx`, `mutations/drain-and-restart.mdx`, `evidence/store6-claims.json`, and `evidence/store6-snippets.json`.

- [ ] **Step 1: Reconfirm the alignment acceptance conditions.** Compare site lock, claims revision, source HEAD, snippet paths, artifact roster, and current tests. Record the aligned absolute checkout as `STORE6_DOCS_SOURCE_ROOT` and the verified skill-source checkout as `STORE6_DOCS_SKILLS_ROOT`. Do not put literal placeholders into commands or fall back to the old default Store6 main checkout.
- [ ] **Step 2: Re-review both drafts against the aligned commit.** Update status banners, module/dependency names, snippet bodies, immutable source links, and evidence rows. If source behavior changed materially, revise the applicable sections before copying files. A released dependency recipe requires verified published coordinates; a preview guide retains its source-only status.
- [ ] **Step 3: Copy the two reviewed drafts to their final paths.** Keep both pages hand-authored; do not add them to the sync-owned target list or copy entire module READMEs as the guides.
- [ ] **Step 4: Insert navigation and entry links.** Add `background-work` after `drain-and-restart` in mutations metadata and `meeseeks` after `graphql` in root Store6 metadata. Add a Background work row to the mutation index. Replace the overly broad scheduling callout in drain-and-restart with:

```mdx
<Callout type="Note">

The mutation engine does not schedule background work by itself. Call `drain(key)`
or `drain()` from an application-owned trigger, or connect the optional drain
coordinator to a scheduler. Each drain is a bounded pass. See
[Background work](/docs/store6/mutations/background-work) for lifecycle and scheduling setup.

</Callout>
```

Also update the mutation index's current “ten subpages” statement to its actual post-change count (eleven if this is the only addition). Keep all deeper drain/idempotency contracts unchanged except source-alignment corrections already approved in the prerequisite.
- [ ] **Step 5: Register snippet consumers.** Add the following entries to `evidence/store6-snippets.json`, using the source paths verified in Step 1:

```json
{
  "name": "mutations-drain-quickstart",
  "path": "mutations-drain/src/commonTest/kotlin/org/mobilenativefoundation/store6/mutations/drain/docs/DrainQuickstartDocsSnippet.kt",
  "pages": ["/docs/store6/mutations/background-work"]
}
```

```json
{
  "name": "mutations-drain-meeseeks-jvm-wiring",
  "path": "mutations-drain-meeseeks/src/jvmTest/kotlin/org/mobilenativefoundation/store6/mutations/drain/meeseeks/docs/MeeseeksWiringDocsSnippet.kt",
  "pages": ["/docs/store6/meeseeks"]
}
```

If the selected aligned revision uses other paths, use its real paths; do not invent matching directories.
- [ ] **Step 6: Add claims for both pages.** Translate every technical assertion in the reviewed evidence map into the existing ledger schema. Set `page` to `/docs/store6/mutations/background-work` or `/docs/store6/meeseeks`; use IDs beginning `docs/store6/mutations/background-work/001` and `docs/store6/meeseeks/001`, incrementing the three-digit sequence per page in ledger order. Supply real source SHA-256 values and tight line ranges, and use the aligned single Store6 revision. Use `CONFIRMED` for source-backed statements only with their actual qualifiers; record runtime gaps as explicit limitations. Do not use a site-local note to disguise another Store6 revision as pinned source evidence.
- [ ] **Step 7: Run the existing source checks.** After Task 7 reconciles route census, run:

```bash
node scripts/check-snippets.mjs --source-root "$STORE6_DOCS_SOURCE_ROOT"
node scripts/check-claims.mjs --source-root "$STORE6_DOCS_SOURCE_ROOT" --skills-root "$STORE6_DOCS_SKILLS_ROOT"
```

Expected: both new snippets match and both new pages have valid claims. Use `--reconcile <id>` only after reviewing a specific changed source/claim; do not use blanket reconciliation to accept changed semantics.

## Task 7: Integrate routes, discovery, and verification contracts

**Files:** Modify the route/export/test files in the Milestone B map. Regenerate owned outputs through their scripts. One owner writes all shared files.

- [ ] **Step 1: Extend existing coverage assertions and observe the missing-integration failure.** Add the two expected routes to the appropriate exact inventories in `scripts/t8-verification.test.mjs`, and add their expected canonical page identities to the committed-bundle test in `scripts/agent-docs-bundle.test.mjs`. Run:

```bash
node --test scripts/t8-verification.test.mjs scripts/agent-docs-bundle.test.mjs
```

Expected before the corresponding inventories are integrated: a missing-route/corpus mismatch. This protects reachability and export completeness; do not add tests that pin article sentences or heading wording.
- [ ] **Step 2: Reconcile the route census.** Add both `{ path, source }` entries to `FIXED_EXTRA_SOURCES` in `scripts/t8-verification.mjs`. Update sorted `evidence/T8-extras.txt`, `B3_MUTATION_ROUTES`, and fixture extras/source-file lists in `scripts/t8-verification.test.mjs`. Preserve all existing paths. At the inspected baseline, total extras would grow 49→51 and fixed source entries 37→39; recalculate after source alignment rather than imposing these historical counts.
- [ ] **Step 3: Reconcile corpus membership.** Add both final MDX paths to sorted `scripts/agent-docs/config.json`. Update actual corpus/output counts and page identity assertions in `scripts/agent-docs-bundle.test.mjs`. The inspected baseline is 43 pages/45 generated outputs, becoming 45/47 if no prerequisite changes the count. Leave historical dated census prose in `scripts/agent-docs/export-contract.md` historical; update active contracts only.
- [ ] **Step 4: Update source-owned discovery through the aligned source.** Confirm its committed `llms.txt` contains both guide destinations and that the lock's hash/link inventory matches. Generate with:

```bash
node scripts/sync-store6-docs.mjs --source-root "$STORE6_DOCS_SOURCE_ROOT"
node scripts/build-agent-docs.mjs
```

Expected: both guides appear in the generated Markdown corpus and source-owned discovery index. Do not append directly to `public/llms.txt` or hand-edit ownership ledgers. A missing committed source index update means the source-alignment dependency is incomplete.
- [ ] **Step 5: Review all generated diffs.** Confirm the new `.md` files retain warning severity, version status, every platform-table row, exact code, and usable links. Confirm the bundle, manifest, and owned-output ledgers include both pages and no private draft/evidence files.
- [ ] **Step 6: Reconcile existing evidence anchors affected by integration.** Inspect `tokens-demo/004`, which currently describes 37 fixed routes and anchors `scripts/t8-verification.mjs`. Update its actual count and reverify before reconciling that ID. After Step 7 changes search verification, also review and reconcile `docs/quickstart/003` and `docs/quickstart/004`, which anchor that script's whole-file hash. Identify other affected hashes via the claims checker. Update exact metadata/llms expectations in `scripts/t4-contract.test.mjs` to the reviewed inventories; do not modify unrelated numeric assertions.
- [ ] **Step 7: Add semantic search checks to `scripts/verify-search-index.mjs`.** Reuse its existing Store6-scoped `store6Client`, query `background work` and `Meeseeks`, normalize with the existing helpers, and assert respectively that `/docs/store6/mutations/background-work` and `/docs/store6/meeseeks` occur. Preserve current Store5/Store6 search checks and payload shape. Complete assertion form inside the existing client lifetime:

```js
for (const [query, destination] of [
  ['background work', '/docs/store6/mutations/background-work'],
  ['Meeseeks', '/docs/store6/meeseeks'],
]) {
  const results = normalizeSearchResults(await store6Client.search(query), query);
  assert.ok(results.some(result => result.url === destination || result.pageUrl === destination),
    `${query} must include ${destination}`);
}
```

- [ ] **Step 8: Run focused structural checks and commit the integrated unit.** Run:

```bash
node --test scripts/t8-verification.test.mjs scripts/agent-docs-bundle.test.mjs scripts/agent-docs-config.test.mjs scripts/check-snippets.test.mjs scripts/check-claims.test.mjs
node scripts/sync-store6-docs.mjs --source-root "$STORE6_DOCS_SOURCE_ROOT" --check
node scripts/build-agent-docs.mjs --check
```

Expected: focused tests pass and generated checks report no drift. Run Task 6's snippet/claim commands now. Commit Tasks 6–7 together with `docs: integrate background work and Meeseeks guides`, staging only the explicit Milestone B file set and reviewed generated changes.

## Task 8: Verify the built reader experience and close out

**Files:** Update `docs/superpowers/drafts/store6-background-work/validation.md`; modify implementation files only to correct identified documentation/integration problems.

- [ ] **Step 1: Read current environment instructions and package scripts.** The inspected `package.json` runs `next build --webpack`; the supplied AGENTS text about the Turbopack build blocker is historical. Do not switch build modes or infer present failure from that note. Check Node version, Ruby availability for workflow-parsing tests, and licensed HeroUI resolution without printing secrets. Reuse Task 4's dependency setup; install only if dependencies are missing. Before any Next.js code change becomes necessary, locate and read the relevant installed guide with `rg --files node_modules/next/dist/docs`; this directory was absent alongside dependencies during planning. Routing or rendering code changes are not expected for adding these two pages.
- [ ] **Step 2: Build, then run the full required contract suite once.** From the site root:

```bash
pnpm build
node --test scripts/*.test.mjs
node scripts/repin-store6-lock.mjs --self-test
```

Expected: successful webpack production build and passing tests, with any intentional skip named. Run these commands sequentially; tests inspecting `.next/server/app/**` require the successful build first. On failure, distinguish dependency/environment, pre-existing behavior, and this change. Fix only relevant documentation/integration regressions and rerun affected checks. Do not count old build artifacts as current rendering evidence.
- [ ] **Step 3: Start the built site.** Run `pnpm start` in a managed terminal and retain the session identifier. It serves port 3222. Wait for readiness; do not start a duplicate server or kill an unrelated process.
- [ ] **Step 4: Run local endpoint and search verification.** With the server running:

```bash
node scripts/t8-verification.mjs --local
node scripts/verify-agent-docs.mjs --base-url http://127.0.0.1:3222
node scripts/verify-search-index.mjs
```

Expected: complete route inventory passes; both new pages and their canonical Markdown are served; export/discovery checks pass; both new search queries find their intended destinations. Preserve failures and request URLs in the validation record.
- [ ] **Step 5: Inspect both guides in the browser.** Use the browser-control skill available to the implementing agent. Check desktop and narrow viewport navigation; entry through mutations and Integrations; previous/next links; table overflow; code readability/copy; visible support notices; search result navigation; and Copy for Agent/Markdown output. Confirm every platform section survives export. No screenshot or mock runtime is evidence that OS background jobs ran.
- [ ] **Step 6: Shut down only the server started in Step 3.** Keep source repositories and unrelated sessions intact.
- [ ] **Step 7: Review the final diff and evidence record.** Run `git diff --check`, `git status --short`, and inspect staged/unstaged changes. Record exact site/source SHAs and actual commands/results; distinguish local site success from device runtime and deployed behavior, which remain unverified unless separately exercised. Record the candidate's unresolved adapter support limitations in the final page and report.
- [ ] **Step 8: Commit the closeout record and report Milestone B.** Use `docs: record background work guide verification`. Link both final pages and the validation record. Stop at local completion; no push, PR, deployment, merge, or release action is part of this plan.

## Agent ownership and dependencies

- Integration owner: Task 1, shared evidence records, all Gradle invocations, Tasks 4–8, navigation/manifests/generated files, commits, final verification.
- Background-work writer: Task 2 only; owns `background-work.mdx` draft. Returns source/evidence additions for the integration owner.
- Meeseeks writer: Task 3 only; owns `meeseeks.mdx` draft. Returns source/evidence additions for the integration owner.
- Tasks 2 and 3 run in parallel after Task 1. Each writer reads the agreed example and boundaries first. Neither edits shared ledgers or runs Gradle.
- Task 4 integrates both drafts. Task 5 closes Milestone A. Task 6 begins only after the independent source-alignment dependency passes. Tasks 6–8 run serially because they share source/route/export inventories.
- Use fresh task agents and the required bounded reviews from @superpowers:subagent-driven-development during implementation. Reviews assess this scope; they do not start new release audits or fix deferred Meeseeks behavior.

## Definition of done

Milestone A requires two complete drafts, exact snippet fidelity, a claim/source map, explicit evidence outcomes, and a concrete source-alignment handoff. Unavailable compile/runtime checks must be named; they cannot be converted into passing evidence.

Milestone B additionally requires one coherent source revision, both public routes, both navigation entries, consistent cross-links, source-owned discovery, claims/snippet parity, canonical Markdown/bundle coverage, search discoverability, successful required site checks, and browser inspection. If a required check cannot run, report that milestone as incomplete with the precise dependency and completed work preserved.
