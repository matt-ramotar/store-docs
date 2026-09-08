# Store6 agent evaluation rubric

Reviewer-only material. Do not include this file, its expected behaviors, negative probes, or previous scores in a candidate prompt or checkout. The six prompts in `cases.json` remain unchanged. This rubric is frozen before candidate tuning and applies to all three arms.

## Review procedure

First establish a valid cell: matching recorded identities, one permitted Kotlin test file plus explanation/results, real artifacts and trace, and no treatment contamination. An invalid infrastructure cell is neither a model success nor a valid model failure. Preserve its reason and any linked replacement.

Inspect the candidate's code and explanation against the same corrected documentation snapshot and immutable library source used by the run. Cite concrete source locations in the review record. The candidate's claim to have compiled, run tests, or read a page is not sufficient; use recorded command and retrieval evidence.

For each applicable requirement, record `satisfied`, `violated`, or `unverified`, the artifact/source evidence, and whether the issue is critical. A negative probe is a reviewer question about the artifact and trace. Do not add a new candidate message, change its prompt, or introduce another scenario inside the 54-cell matrix. Mark a probe unexercised where the original task and trace supply no observation. Separate follow-up experiments require their own recorded identity.

## Independent dimensions

| Dimension | Score/status | Evidence |
| --- | --- | --- |
| API and version correctness | `2`: applicable checks satisfied; `1`: incomplete but no contradicted API/version claim; `0`: incompatible/invented API or unsupported compatibility claim; `unverified`: insufficient artifact | Exact imports, signatures, module/target dependencies, recorded source revision, documented opt-ins |
| Task semantics | `2`: applicable case requirements satisfied; `1`: bounded partial solution with limitations; `0`: contradicts a required guarantee or omits the core task; `unverified`: insufficient artifact | Code, explanation, source contracts, and discriminating assertions |
| Citation quality | `2`: relevant canonical citations support significant claims; `1`: relevant but incomplete citation coverage; `0`: missing, fabricated, or contradictory citations | Actual retrieved pages and passage-to-claim checks |
| Compilation | `passed`, `failed`, or `unverified` | Trace and actual task outcome for this artifact; distinguish fresh compilation from cached/up-to-date tasks |
| Executed behavior | `passed`, `failed`, or `unverified`, with the exact exercised dimensions | Named test results and discriminating assertions; distinguish fresh execution, cache reuse, mock tests, reopen tests, and real process-death tests |
| Negative probes | `handled`, `violated`, or `unexercised` for each probe | Observable choice in the artifact/trace; silence is not evidence of correct handling |
| Retrieval cost | Requests/pages, bytes, tokens and elapsed time when available | Harness metrics; unavailable metrics remain unavailable |

Do not combine these dimensions into a single score that can hide a critical error or unavailable runtime evidence. A source-reviewed success requires complete applicable source/API and task checks, supported citations, a valid artifact/trace, and no critical violation. Label it `source-reviewed`; only observed compilation or behavior justifies the stronger labels. A valid partial solution remains partial. Correctly acknowledging an unavailable probe preserves honesty but does not complete the task requirement.

Critical violations include an invented or incompatible required API, a falsely asserted exact version match, an unsupported process-death/crash guarantee, data resurrection or loss assumptions contradicted by the source, and false execution claims. Preserve every critical finding even if another replicate passes.

## first-store

Frozen candidate prompt:

> Create a typed user Store6 repository from a fetch function, with explicit ownership of its lifetime and result handling.

Reviewer requirements from the plan: correct Store6 imports/DSL; key/namespace; complete result handling; close/cancellation boundaries.

- Confirm the generated repository uses the Store6 builder and actual types available at the verified target identity. A passing-looking Store5 implementation fails the API check.
- Check stable key identity and namespace for users. Verify result handling follows the documented result cases and does not assume that a stream or one-shot read cannot fail.
- Identify who owns the store and collection scope, when collection ends, and when the store closes. Check cleanup on failure and cancellation without swallowing cancellation.
- Require assertions that exercise a real store and its relevant result/lifetime behavior. A fake returning the expected value alone cannot verify the repository integration.

Negative probes: did the artifact infer compatibility from a `6.0.0-SNAPSHOT` or unknown coordinate; did it silently ignore a conflicting source passage; does cleanup swallow cancellation or leak the owner; did it introduce undocumented experimental APIs or opt-ins? Record unexercised version/contradiction decisions honestly.

## freshness

Frozen candidate prompt:

> Add pull-to-refresh for a visible cached user. Explain the effect of invalidate and clear while a fetch is in flight.

Reviewer requirements from the plan: preserve stale/resident distinctions, documented initial-failure semantics, no automatic retry invention, no pre-clear resurrection assumption.

- Check the visible resident value, freshness state, refresh request, and emitted results against the exact read contract. Invalidation and clearing are not interchangeable.
- Compare the explanation of an already-running fetch with source invalidation/clear behavior. Reject an assumption that a result fetched before clear may always repopulate the cleared record.
- Check initial fetch failure behavior and whether later retry/revalidation is explicitly requested or documented. Do not credit an invented background retry scheduler.
- Require assertions that control an in-flight fetch and observe the relevant stale/resident transition through the real store. A sequential happy-path fetch does not prove the in-flight behavior.

Negative probes: mismatched dependency identity; conflicting stale/freshness claims; cancellation converted into a retry; automatic retries without a documented trigger; clear followed by assumed resurrection. Check each against actual artifacts and source.

## persistence

Frozen candidate prompt:

> Add persistent user storage and explain what is guaranteed after a crash. Choose between the available SQLDelight and Room adapters.

Reviewer requirements from the plan: preserve adapter differences, transaction/bookkeeper boundaries, live reader semantics, no uniform crash guarantee.

- Require an explained adapter choice based on the documented target and behavioral differences. Confirm availability at the consumer source/version identity.
- Check where user rows and bookkeeping live and which writes share a transaction. Do not infer an atomicity/crash guarantee merely because both use a database.
- Check live reader/query observation, invalidation, and lifecycle behavior for the selected adapter. Verify that data changes are observable through the actual adapter semantics.
- The SQLDelight executable probe must use the existing test schema and real JDBC driver in the module. For persistence across reopening, use a file-backed database and reopen the same file. Memory-backed SQL and mocked databases are insufficient physical persistence evidence.
- Review Room claims from sources separately. A SQLDelight JVM test cannot establish Room crash behavior. A graceful close/reopen test cannot establish every process-crash boundary.

Negative probes: unknown version; source contradictions about transaction or bookkeeping scope; an unsupported uniform crash guarantee across adapters; a fake/in-memory database described as durable; live reader guarantees asserted without source or behavior evidence.

## ui-lifecycle

Frozen candidate prompt:

> Integrate a user stream into a lifecycle-bound Compose screen and describe the ownership needed for Swift consumers.

Reviewer requirements from the plan: correct collection/lifetime, stable keys, opt-ins, target limitations, no invented Swift-export promise.

- Check lifecycle-bound collection and state retention against the actual Compose entry points. Verify start/stop transitions, disposal, and stable key identity where relevant.
- Require explicit store ownership independent from the transient UI collector. Check which owner closes the store and what happens when the screen leaves its lifecycle state.
- Verify required API opt-ins and target support from the reviewed source/docs. Do not treat Kotlin/JVM compilation as proof of Swift export compatibility.
- Use existing Compose runtime/lifecycle test facilities for an observable lifecycle assertion. Merely compiling a composable does not exercise lifecycle gating.
- Review the Swift ownership explanation independently. Mark native/Swift execution unverified unless an actual target check exists.

Negative probes: incompatible target version; contradictory support-matrix claims; swallowed cancellation on screen disposal; missing experimental opt-in; a promised Swift exported API unsupported by the checked source.

## durable-mutation

Frozen candidate prompt:

> Rename a user optimistically while offline and preserve the queued write across process death.

Reviewer requirements from the plan: persistent journal, key recovery, explicit drain/scheduling, stream overlay versus get, correct experimental tier; no default-memory durability.

- Verify use of persistent journal storage and reopening the same durable store. The default in-memory journal cannot satisfy this task's durability requirement.
- Check serialized mutation/value identity, key recovery, and the actual registry/server/codec APIs used. Recovery must reconstruct the correct user key rather than guess from unrelated runtime state.
- Identify explicit draining and scheduling ownership when connectivity returns. Do not credit automatic network/background scheduling absent from the source.
- Check optimistic stream overlays and one-shot `get` behavior against their documented differences. Confirm the required experimental API tier and opt-ins.
- The executable probe must use a file-backed JDBC journal with the existing mutation SQL harness. A new store over the same in-memory driver or a mock only tests a narrower boundary. Preserve that limit in the result.
- A graceful store/driver close and reopen tests persistence across reopen. Only a test that actually exercises process-death recovery may be called a process-death test; neither establishes an unrestricted power-loss guarantee.

Negative probes: mismatched dependency/source identity; conflicting default-journal wording; durability attributed to default memory storage; missing key recovery; invented drain scheduler; unsupported experimental or crash claims.

## store5-migration

Frozen candidate prompt:

> Port a Store5 repository using a Converter, Updater, custom cache behavior, and local-only reads to Store6.

Reviewer requirements from the plan: identify unsupported mappings, correct modules/imports, avoid Store5 API substitutions, select meaningful real-store tests.

- Compare each requested Store5 responsibility with the documented Store6 mapping. Require explicit identification of unsupported or non-equivalent mappings instead of a made-up one-to-one replacement.
- Check module dependencies and imports. Store5 may appear in the migration explanation; the new Store6 implementation must not use Store5 APIs as substitutes.
- Verify custom cache and local-only read behavior against the Store6 contract. Do not infer equivalent semantics from similar names.
- Require meaningful tests against the real Store6 implementation, supported by the existing testing helpers where useful. Tests that only assert a configured fake do not establish migration behavior.
- Check that the candidate explains any request it cannot preserve under the documented API rather than claiming full parity.

Negative probes: unknown or mismatched source/version; a source contradiction about migration support; fabricated Converter/Updater/cache equivalents; local-only reads implemented with a fetching path; experimental seam use without the documented opt-in or limitations.

## Decision and record

For each cell record reviewer identity, case/arm/replicate, source/bundle/package identities, rubric hash, artifact and trace paths, dimension outcomes, requirement findings, critical violations, negative-probe coverage, actual compile/test evidence, and remaining limits. A reviewer may assign a stronger evidence label only from independent observed evidence.

Keep valid failures and partial outcomes in the 54-cell summary. A successful replicate does not erase a critical failure in another. Release review requires a successful skill outcome for every case and retention of a success wherever the baseline succeeded, with no unresolved critical API/version or durability-guarantee error. A corrective skill/content change starts a new candidate identity and reruns the affected frozen cases across all three arms; preserve prior results and this rubric's hash.
