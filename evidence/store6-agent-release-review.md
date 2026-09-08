# Store6 agent and LLM support: candidate review

The fixed local evaluation is complete. The skill candidate has not met the release gate. No source push, pull request, merge, tag, or deployment has been performed.

Local validation finished within the approved four-hour limit. The branch is `matt-ramotar/store6-agent-llm-support`; [execution evidence](agent-docs-execution.json) records the exact commits, changed paths, and verification times.

## Delivered local candidate

- Forty-three complete Store6 Markdown pages, the full guide corpus, a discovery index, and a manifest with exact content hashes and source attribution.
- Three agent setup pages, navigation/search entries, Copy page and View Markdown actions, and Markdown discovery metadata.
- A portable Apache-2.0 Store6 skill with task routing, explicit version matching, bounded retrieval, and rejection of changed bundles or page bytes. Site generation preserves the installed skill's paired manifest.
- A two-file Store6 source correction: qualify the default in-memory journal's durability and add agent discovery links while preserving the prior destinations.

## Exact candidate identities

| Item | Identity |
| --- | --- |
| Docs baseline | `25b253bb52458756ecb374956d97c7d6929dec40` |
| Docs evaluation start | `ef2e439c3a9fea2523b63e8caaa451848a0dca81` |
| Implementation checkpoint before final evidence | `c4465855a1b6124ebf5feaf125a681391adbd6c5` |
| Store6 source | `ad435df1095673709a22f1b52a82aa03748cd9b3` |
| Documentation bundle | `sha256:b3ea53d182cc6e88d3b706000b8d180ba93c70bf603c2558df84b50ad75f65ac` |
| Skill package SHA-256 | `9165539ac007438873c3cf9eed51db293a3798a4146eb648fdedfe96951010a4` |
| Skill version / license | `0.1.0` / `Apache-2.0` |
| Planned skill ref | `store6-skill-v0.1.0` (not published) |

The source revision is a local candidate. It must be reachable by intended readers before this pin is promoted. Replacing the source identity requires a new re-pin, corpus/skill pairing, and affected evaluation. The package digest uses sorted relative paths and exact file-byte hashes; the full algorithm is recorded in [release evidence](store6-skill-release.json).

## Foundation and package verification

- Final site build passed. Contract suite: **450 passed, 1 existing skip, 0 failed**. Bounded runner tests: **10 passed**.
- All **45 generated outputs**, **13 source-locked outputs**, **479 claims / 532 anchors**, and **33 snippets / 38 page references** passed their checks.
- Local HTTP verification covered **43 Markdown pages, 3 bundle/discovery files, and 105 internal links**, including status, MIME, hashes, fragments, and unknown-route behavior.
- Forty existing human articles were compared: 38 were unchanged after attribution normalization; the two intended changes were agent discovery and the journal durability qualification.
- Keyboard copy matched the exact Markdown bytes; feedback, 390px layout, metadata, and absence of Store5 actions were observed. The in-app browser blocked direct Markdown navigation with `net::ERR_BLOCKED_BY_CLIENT`, so native opening remains unverified despite the valid link and HTTP resource.
- Exact raw payloads for the same 43 routes total **420,156 Markdown bytes** versus **5,742,473 built HTML bytes**. This is a raw document-size observation, not compressed traffic or model-token savings.
- Project installations, eight-file package parity, offline listing of 43 guides, local helper retrieval, and explicit update fixtures passed for Codex, Claude Code, and Cursor. The update used a clearly labeled test fixture rather than a real newer release.
- The actual unchanged installed helper rejected a deliberately modified page with `CONTENT_MISMATCH`, exit 1, and empty stdout. Package bytes stayed unchanged.

## Client observations

| Client | Observed native invocation | Local helper | Public immutable install / HTTPS |
| --- | --- | --- | --- |
| Codex 0.153.4 | Explicit skill invocation passed; unrelated task did not activate it | Passed | Pending publication |
| Claude Code 2.1.220 | Unverified after automatic approval rejection | Passed | Pending publication |
| Cursor 3.19.13 | Unverified after automatic approval rejection | Passed | Pending publication |

Automatic approval review rejected Claude Code and Cursor API invocation because transmitting local project and skill context to those providers was not specifically authorized. No alternate route was attempted.

## Frozen evaluation

Six cases × three arms × three replicates = **54 cells**. Every fresh session used inherited `gpt-6-astra` with `ultra` reasoning, Codex 0.153.4, the same source/corpus, and a **180-second** allowance. At most two candidates ran concurrently. Memory delivery was disabled per invocation after a clean-context preflight; repository instructions and normal automatic approval review stayed active. Trace review, rather than working-directory separation, establishes observed treatment validity. Gradle execution had one root owner.

Current evidence: **54/54 sessions finished, 54/54 independently reviewed**, with **54 timeouts**. Valid timeouts and failures remain in the denominator. No reruns have been made.

The independent outcomes are **7 partial, 47 failed, and 0 invalid**. The final owner audit confirmed unchanged source fixtures, all 18 installed skill packages, frozen evaluation inputs, and the retained artifacts after their one-time Gradle checks.

| Arm | Finished | Complete submissions | Kotlin artifacts | Compile passed | Compile failed | Behavior passed | Behavior failed |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| html | 18/18 | 0 | 3 | 2 | 1 | 2 | 0 |
| markdown | 18/18 | 0 | 4 | 4 | 0 | 3 | 1 |
| skill | 18/18 | 0 | 2 | 2 | 0 | 2 | 0 |

Passing behavior is limited to the named tests actually executed. Compose tests using `FakeStore` or `MutableSharedFlow` exercise the real Compose/lifecycle machinery but do not establish real Store-engine, persistence, or Swift behavior. Cached supporting compilation tasks are recorded separately from fresh test compilation and execution. Interrupted sessions lack completed-turn token reports; those metrics remain unavailable.

The detailed [54-cell summary](store6-agent-evaluation.json) retains API, semantics, citations, negative probes, artifacts/hashes, actual execution, costs, variation, and review/trace pointers separately. A correct partial implementation does not satisfy the complete-success gate.

Root execution observed **27 named JVM tests**, with **1 failure** and **0 errors**. One HTML UI artifact failed compilation because it implemented `Store` without the required `DelicateStoreApi` opt-in; zero tests ran for that artifact. One Markdown UI artifact compiled but failed its structural-identity test with a `ClassCastException`. Both original failures are retained; generated candidates were not repaired or rerun.

`first-store.html.3` satisfied the substantive API, semantics, and citation checks and passed four real-store tests. Its missing structured result keeps the full submission incomplete. This useful baseline outcome is recorded separately; the skill did not match it with a substantively complete first-store result. The release conclusion therefore does not depend only on missing result files.

Observed retrieval friction includes initial local connection failures followed by ordinary approved retrieval, repeated CLI `USAGE` errors when candidates combined standalone `--list` with identity flags, and one shell command-resolution error. The summary records exact error counts and cell/trace pointers. These observations identify possible follow-up work; this frozen run does not establish that MCP would help or that one arm reduces model-token use.

## Release decision and remaining boundaries

Current release-gate status: **failed**. Cases without a complete independently reviewed skill success: first-store, freshness, persistence, ui-lifecycle, durable-mutation, store5-migration.

Promotion requires a successful skill outcome for every case, preservation of every successful baseline case, and no unresolved critical API/version/durability error. Source publication, the actual immutable skill ref, deployment, and actual HTTPS/client checks also remain pending. The current localhost results establish none of those publication checks.

No observed result justifies adding MCP within this scope. Retrieval errors and completion failures remain recorded as inputs to a separate decision; this sample is not a broad reliability benchmark. Changing skill/content creates a new candidate and requires affected frozen cases across all three arms again. A different time allowance or model would be a separately identified experiment.

See [execution evidence](agent-docs-execution.json), [client/package evidence](store6-skill-release.json), and [evaluation evidence](store6-agent-evaluation.json). Raw traces, first-red XML, browser captures, and detailed reviews are retained locally under the ignored `evidence/agent-docs-runs/` directory.
