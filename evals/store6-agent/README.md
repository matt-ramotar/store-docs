# Store6 agent evaluation

This directory contains six frozen task prompts, a reviewer rubric, a result schema, and a test-only local delivery adapter. It contains no evaluation results. Preparing these files does not establish client support, compilation, or agent effectiveness.

The evaluation asks whether Markdown access and a Store6 skill improve an agent's use of the same Store6 documentation. The comparison uses 54 cells: six cases × three arms (`html`, `markdown`, `skill`) × three independent replicates. Each session has a 180-second wall-clock allowance. At most two candidate sessions may run at once. Gradle checks have one serialized owner.

## Files and candidate visibility

| File | Consumer |
| --- | --- |
| `cases.json` | Harness: exact prompts, public reference paths, test placements, and all 54 cell identities |
| `rubric.md` | Independent reviewers only; never included in a candidate prompt or fixture |
| `result.schema.json` | Candidate output schema and harness validation |
| `route-local-docs.mjs` | Explicit Node preload for local skill retrieval only |
| `run.mjs` | Bounded preflight, fixed candidate runner, and raw evidence retention |
| `run.test.mjs` | Harness checks using disposable files and ordinary Node processes |
| `client-smoke.md` | Client installation, discovery, retrieval, and update observer |

Supply only the selected case's `prompt`, neutral fixture instructions, the applicable arm instructions, and the result schema to each candidate. Do not copy this entire evaluation directory, the rubric, previous outputs, or reviewer notes into candidate checkouts. The public reference paths identify the same page set across arms. Convert only the delivery form appropriate to the arm; keep canonical URLs in citations.

## Freeze before running

Complete foundation build/HTTP verification and explicit skill/corpus pairing before any candidate cell. All arms must use the final corrected Store6 content, including the corrected durability wording. The read-only fixture source inspection recorded in `cases.json` is an earlier baseline; it does not choose the final evaluated source revision.

Create one run record with:

- A run ID, start time, final immutable Store6 revision, docs commit plus any reviewed content delta, bundle ID, and skill package digest.
- SHA-256 hashes of `cases.json`, `rubric.md`, `result.schema.json`, and `route-local-docs.mjs`.
- The inherited model, reasoning/settings configuration, client version, tool inventory and access checks, installer version, and prompt-template hash. Record unavailable settings explicitly and do not manufacture equivalence.
- The 54 fixed cell identities from `cases.json`, session allowance of 180 seconds, maximum two simultaneous sessions, and the serialized Gradle owner.

Keep the same model, settings, tool availability, source revision, corrected content snapshot, task scope, and allowance for every cell. Arm instructions only change documentation delivery and explicit skill use. Do not rescue a failing cell with a different model, extra time, a hidden hint, or a different dependency revision.

Use the fixed order in `cases.json`, which rotates arm order between cases and replicates. Each cell starts a fresh session and fresh disposable library checkout at the recorded revision. Confirm that none of the six candidate test filenames already exists at that revision. Save the starting status and source identity. Never reuse a modified fixture or conversation from another cell.

Before the matrix, verify the supported session runner exposes the intended documentation tools. Validate the preload with the actual unchanged installed helper against the verified local corpus and a deliberately altered page in a disposable server fixture. Unchanged bytes must succeed; altered bytes must still fail with `CONTENT_MISMATCH`. These are prerequisite checks, not evaluation outcomes. Compare installed skill package digests before and after each run.

Raw records belong under the ignored `evidence/agent-docs-runs/<run-id>/` directory in the docs repository. The integration owner must add `/evidence/agent-docs-runs/` to `.gitignore` and verify the path is ignored before writing traces. Keep the frozen files here and the compact release summary tracked. Do not commit raw prompts, JSONL sessions, terminal logs, or generated candidate worktrees.

## Candidate fixture boundary

Each disposable checkout contains the same reviewed library source and its repository instructions. A candidate may add one Kotlin test file at its case's `fixture.testPath`, with the requested implementation and relevant assertions inside it. It may also write explanation and structured result files. Record and review the actual diff. Existing production source, build scripts, dependency versions, and other tests are outside the candidate's task scope.

Supply these neutral facts with the exact case prompt:

1. Cell ID, case ID, arm, replicate, verified source revision, bundle ID, and inherited model identifier needed for structured output.
2. The one permitted Kotlin path and the paths for explanation/results. Preserve the case prompt byte for byte.
3. The ordinary repository instructions, available tools, 180-second session allowance, and the requirement to report only verification actually performed.
4. The relevant public reference paths and arm-specific delivery instructions below.
5. The requirement to return JSON conforming to `result.schema.json`, with paths to real output artifacts, canonical citations, commands, and remaining limitations.

Tell candidates to leave Gradle execution to the serialized evaluator. They may inspect the source and suggest the case command, but a suggested command is not an executed entry in `commands`. Do not add a command to that array unless an actual tool trace establishes that it was requested. A pre-start rejection has `started: false` and `exitCode: null`; preserve the rejection in the trace.

## Arms and local delivery

Canonical documentation origin: `https://store.mobilenativefoundation.org`.
Local delivery origin: `http://127.0.0.1:3222`.

| Arm | Candidate instruction |
| --- | --- |
| `html` | Retrieve ordinary HTML pages at the corresponding localhost `/docs/store6/…` paths. Use canonical HTTPS paths for citations. Do not retrieve Markdown exports, the skill, or its helper. |
| `markdown` | Use the localhost discovery index and `/llms/store6/…` Markdown pages for the same source snapshot. Do not load the skill, its instructions, or its helper. |
| `skill` | Explicitly invoke the installed Store6 skill, using the same Markdown corpus. Resolve helper paths from that installed skill and use the explicit preload command below. |

HTML and Markdown agents may inspect the same library source to implement their task. The skill arm receives the installed skill as the intentional additional treatment. None receives Store6-specific advice from ambient user skills, memories, previous cells, or reviewer materials. Repository instructions are retained and recorded identically across arms.

`route-local-docs.mjs` preserves the canonical URL's path and query, forwarding only that origin to localhost. Other origins pass through unchanged. It forwards the original fetch options, including redirect policy and timeout signal. The unchanged installed helper continues to check consumer version, paired bundle identity, and exact content hashes. The adapter intentionally rejects canonical-origin `Request` objects; the helper uses URL/string requests.

Use only the per-command preload:

```sh
node --import "$STORE6_EVAL_FETCH_ADAPTER" "$STORE6_INSTALLED_SKILL/scripts/get-docs.mjs" --source-revision "$STORE6_EVAL_SOURCE_REVISION" quickstart
```

The variables identify recorded absolute fixture paths or the consumer's verified immutable source revision. Do not set global `NODE_OPTIONS`, alter the installed package, modify the paired manifest, add force flags, or change user profiles. The observer must record requested canonical URL, delivered local URL, returned document hash, and trace pointer. The adapter itself does not create evidence or log files.

This comparison measures local delivery. HTTPS deployment, immutable public installation, DNS, and TLS remain separate publication checks.

## Fresh session runner

The bounded runner pins Codex CLI `0.153.4` and uses its normal automatic approval review with an implicit `workspace-write` sandbox. Its fixed per-session command is:

```sh
npx --yes @openai/codex@0.153.4 --disable memories exec --ephemeral --approve-for-me --skip-git-repo-check --cd "$STORE6_CASE_ROOT" --json --output-schema "$STORE6_RESULT_SCHEMA" --output-last-message "$STORE6_RESULT_PATH" -
```

Set task-specific variables to recorded absolute paths. Supply the frozen prompt on stdin through a managed runner or PTY and retain JSONL output in the ignored run directory. The run owner enforces the 180-second deadline, records actual elapsed time and available token counts, and terminates only its own overdue process/session. Missing token metrics remain unavailable, not zero. Limit simultaneous candidate processes to two.

The per-invocation `--disable memories` feature control disables memory delivery identically in every arm. It writes no saved configuration and preserves repository rules, `HOME`, `CODEX_HOME`, inherited model and reasoning effort, and ordinary approvals. Do not combine `--approve-for-me` with an explicit `--sandbox` option. Local retrieval may require the normal `require_escalated` approval path. A successful clean-context preflight must establish the absence of persistent Store6 memory advice with this exact command shape before evaluation. Ephemeral sessions and memory delivery control do not establish filesystem or host-enforced treatment isolation.

Run `node evals/store6-agent/run.mjs` with `--fixtures-root`, a new ignored `--runs-root`, `--source-revision`, `--bundle-id`, and `--model gpt-6-astra` for read-only fixture and corpus preflight. Add `--execute --provenance /absolute/provenance.json` to run the fixed matrix once. There are no runner, skill-source, subset, resume, or retry overrides. Skill cells use their own installed `.agents/skills/store6` package and a recorded, unchanged `skills-lock.json`.

The provenance JSON must contain these exact sections. Replace identity placeholders with the observed immutable source, bundle, and installed package digest. Every `trace` must link to an absolute, nonempty regular file. The harness validates fields and hashes the evidence files before creating the run directory; it records the distinction between those checks and the owner's interpretation of trace contents.

```json
{
  "client": {"version": "0.153.4", "trace": "/absolute/client.log"},
  "settings": {"model": "gpt-6-astra", "reasoningEffort": "ultra", "inherited": true, "trace": "/absolute/settings.log"},
  "installer": {"version": "1.5.24", "trace": "/absolute/installer.log"},
  "docsHttp": {"status": "passed", "origin": "http://127.0.0.1:3222", "trace": "/absolute/http.log"},
  "helperPositive": {"status": "passed", "sourceRevision": "<source>", "bundleId": "<bundle>", "packageSha256": "<package digest>", "trace": "/absolute/helper-positive.log"},
  "helperNegative": {"errorCode": "CONTENT_MISMATCH", "stdoutEmpty": true, "packageUnchanged": true, "trace": "/absolute/helper-negative.log"},
  "cleanContext": {"status": "passed", "memoriesDisabled": true, "store6MemoryObserved": false, "trace": "/absolute/clean-context.jsonl"}
}
```

The harness rechecks the frozen local manifest and every page hash before each launch, after each cell, and at matrix end. Any observed drift remains invalid even if bytes are restored. It stops launching new cells, retains started records, marks affected cells invalid, and lists unstarted cells as unverified. An end-of-run drift with unknown onset conservatively invalidates every started cell. `corpus-integrity.json` and the final summary supersede earlier cell integrity observations. These checks observe local files; actual delivery still requires candidate trace review.

## Trace audit and failure retention

For every cell, the harness validates the result's case/arm/replicate/model/source/bundle against its own run record, checks the schema, resolves artifact paths inside the permitted fixture, checks artifacts exist, and correlates command statuses with tool traces. Candidate claims alone cannot establish success. The schema deliberately contains candidate observations; final reviewer scores remain separate.

Audit source reads, documentation requests, skill activations, output diffs, and ambient context. HTML sessions reading Markdown exports or skill files, Markdown sessions loading the skill, leaked rubric/previous outputs, or Store6-specific ambient instruction leakage invalidate the cell. Record the exact trace and reason. Distinguish this from reading the common allowed library source.

Rerun only invalid infrastructure or contamination cells with the same frozen configuration, preserving the original and its replacement link. Valid model failures, incomplete results at the deadline, wrong APIs, weak citations, version mismatches the candidate mishandles, and failed generated tests remain outcomes. Do not rerun them until green or discard them from the denominator. An infrastructure error without a candidate artifact cannot become a source-reviewed success.

## Verified test placements

Read-only inspection used Store6 revision `5a8c956bc1dbd6ad838ea9da3b34c7d76c703a71`. All five modules are included in `settings.gradle` and apply `Store6MultiplatformConventionPlugin`, whose source declares `jvm()`. This supports the proposed task names structurally; no Gradle task listing, compilation, or test execution was performed.

All paths below are relative to each disposable Store6 checkout. The package path is `kotlin/org/mobilenativefoundation/store6/agents/` within the listed source set.

| Case | Module/source set and filename | Narrow evaluator command |
| --- | --- | --- |
| `first-store` | `store6-core/src/commonTest/…/FirstStoreAgentTest.kt` | `./gradlew :store6-core:jvmTest --tests '*FirstStoreAgentTest*'` |
| `freshness` | `store6-core/src/commonTest/…/FreshnessAgentTest.kt` | `./gradlew :store6-core:jvmTest --tests '*FreshnessAgentTest*'` |
| `persistence` | `store6-sqldelight/src/jvmTest/…/PersistenceAgentTest.kt` | `./gradlew :store6-sqldelight:jvmTest --tests '*PersistenceAgentTest*'` |
| `ui-lifecycle` | `store6-compose/src/commonTest/…/UiLifecycleAgentTest.kt` | `./gradlew :store6-compose:jvmTest --tests '*UiLifecycleAgentTest*'` |
| `durable-mutation` | `store6-mutations-sqldelight/src/jvmTest/…/DurableMutationAgentTest.kt` | `./gradlew :store6-mutations-sqldelight:jvmTest --tests '*DurableMutationAgentTest*'` |
| `store5-migration` | `store6-testing/src/commonTest/…/Store5MigrationAgentTest.kt` | `./gradlew :store6-testing:jvmTest --tests '*Store5MigrationAgentTest*'` |

`cases.json` contains the complete paths without ellipses. Two placements correct the plan's `commonTest` assumption while preserving its cases, filenames, and commands:

- SQLDelight's `commonSqlTest` depends on `commonTest`, while `jvmTest` depends on `commonSqlTest`. Existing `SqlHarness` and `TestSchema` live in `store6-sqldelight/src/commonSqlTest/kotlin/org/mobilenativefoundation/store6/sqldelight/SqlHarness.kt`. The real JDBC SQLite driver is a `jvmTest` dependency. `src/jvmTest/…/FreshHarness.jvm.kt` currently opens an in-memory driver, so a physical persistence probe must use the existing schema with a file-backed driver and reopen the same database. `store6-sqldelight/sample` is a separate JVM sample module; do not assume its generated database is on the adapter test classpath.
- Mutation `JournalHarness` and `JournalTestSchema` similarly live in `store6-mutations-sqldelight/src/commonSqlTest/kotlin/org/mobilenativefoundation/store6/mutations/sqldelight/JournalHarness.kt`. The `jvmTest` source set adds the JDBC SQLite driver and already contains `FileBackedJournalReopenTest.kt`, which uses `java.nio.file` and a real database file. A new JVM test can use that existing harness. A graceful close/reopen test is narrower evidence than actual process death or crash recovery.

Core tests have Store6 testing helpers, coroutine-test, and Turbine dependencies. Compose tests have Store6 testing and coroutine-test, with Compose runtime and lifecycle runtime available through `commonMain`; `ComposeTestHarness.kt` supplies `runComposeTest` and existing lifecycle tests show real composition control. Store6 testing exposes core and Kotlin/coroutine test APIs and has real-store integration examples. These are source observations, not executed results.

Recheck source placement and dependencies at the final corrected revision before the matrix. If a proposed probe still cannot run, mark that execution dimension unavailable, retain source review, and explain the precise reason. Do not replace it with an unrelated passing sample. Room crash behavior and Swift target behavior stay unverified unless their actual platforms are exercised.

## Independent review and summary

An independent reviewer reads the frozen rubric, relevant public docs and locked source, candidate artifacts, actual diff, and trace. The reviewer does not receive the candidate's self-score as authority. Record source/API correctness, task semantics, citation quality, compilation, executed behavior, negative-probe coverage, and limitations separately. Reviewers must identify when a test uses a real store or physical persistence versus a fake.

The serialized Gradle owner runs the exact case command from that disposable checkout under Store6's first-red/no-rerun-to-green policy. Retain the first failure. A wrapper or sandbox rejection before startup means zero tests executed. Do not inspect caches, daemons, locks, sockets, or alter flags to evade it. Compilation that did not run stays unverified; cached task success is not a fresh behavior execution claim.

Summarize every one of the 54 cells, including invalid cells and linked infrastructure replacements. Report counts by case/arm, API/version errors, critical semantic failures, source-review outcomes, actual compile/behavior status, citations, time/tokens, and variation across the three replicates. Do not collapse missing execution into a numeric zero or a pass.

The release check requires at least one independently reviewed successful skill outcome per case, no unresolved critical API/version or durability-guarantee error, and at least one successful skill outcome for every case with a successful baseline. Report success at its observed evidence level; a source-reviewed outcome is not a behavior-tested outcome. Any skill/content correction creates a new candidate identity and requires the affected frozen cases across all three arms again, with earlier runs retained. The sample is a limited screen, not a broad reliability benchmark.
