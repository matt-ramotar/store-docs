# Store 6 docs — orchestrator execution plan

> **STATUS: EXECUTED (verified 2026-08-12). Do not re-run.** All phases landed on store-docs `main`: B0 `c5ab5ee` · B1-close `5bda225` · B2 `3fc8cfb` · B3 `2bbd5a0` · B4 `f0d5ac4` · B5 `7c52570` · B6 `12d9c34`; STORE-31…36 and STORE-28 are Done. End-state verified 2026-08-12 with a fresh pinned build: 80/80 static pages, suite 240 tests / 239 pass / 0 fail / 1 env-gated skip, search verifier green, and at lock revision `c67a94ed`: sync `--check` (11 locked outputs), check-claims (454 claims / 493 anchors), check-snippets (33 snippets / 38 page references) all green. Remaining open work sits outside this plan's scope: STORE-29 (staged hero) and STORE-30 (deploy/cutover). This document is retained as the record of how the run was specified.

**Written:** 2026-08-10. **Audience:** an orchestrator agent that fans out subagents. This document is self-contained: execute it without access to the conversation that produced it.

---

## 0. Mission and repo map

Finish the Store 6 documentation authoring track: batches B0–B6 of the IA/content plan, ending with a site whose every route is green under its own verification harness and whose Linear board reflects reality.

| Thing | Where | Facts you must not violate |
|---|---|---|
| Docs site (Repo B) | `/Users/matt/src/matt-ramotar/store-docs` | **No git remote.** Commit directly to local `main`. Conventional-commit style (`feat(content): …`, `fix(verification): …`). Subagents NEVER commit — only you do, once per batch, after gates pass. |
| Library (Repo A) | `/Users/matt/src/matt-ramotar/Store6` | Has a remote + PR discipline. Any Repo A change goes on a branch → PR via `gh pr create --repo matt-ramotar/Store6` (the `--repo` flag is mandatory; a bare call targets the wrong upstream). PRs are merged by Matt — creating a PR is a **human gate**: continue non-dependent work, never merge yourself. |
| Master plan | `store-docs/plans/2026-08-10-store6-docs-ia-content-plan.md` | §3 sitemap · §5 per-page outlines · §6 sync plan · §8 addenda (batch definitions §8.6, meta.json inventory §8.4, llms.txt policy §8.3, nav re-points §8.7). Agents extract a page's outline by locating its `## <slug>` heading inside §5. |
| Claims ledger | `store-docs/plans/2026-08-10-claims-ledger.json` | 437 claims with anchors; seed for `evidence/store6-claims.json` in B0. |
| Linear | Team **Store**, epic STORE-21 | STORE-31=B0 (Todo) · STORE-32=B1 (In Progress, site-side landed) · STORE-33=B2 · STORE-34=B3 · STORE-35=B4 · STORE-36=B5 · STORE-28=B6 (Dokka). Blockers already wired. |

**State when this plan was written** (verify in preflight): store-docs `main` @ `5d5792b` (on `18f8f4b`); Store6 `main` @ `a6a156e9`; site baselines: 57 page routes, 20 extras, search pin **60**, build **58/58**, suite **125 tests / 124 pass / 0 fail / 1 env-gated skip** (`T4_VERIFY_LIVE`), local crawl **57/57**.

**Anchor-drift rule:** all §5 outline anchors were verified at Store6 `a6a156e9`. If Store6 `main` has moved, agents still follow the outlines but must verify every anchor against **current** source; where source and outline disagree, the source wins and the discrepancy is recorded in the agent's structured return.

---

## 1. How to run subagents (applies to every phase)

- **Fan-out pattern (proven in B1):** `Author agents (parallel, one page each)` → `Integrate agent ∥ Review agent` → `Fix agent (only if review found high/medium findings or integration left failures)`. Authors write only their own file; integration owns shared files (meta.json, census, pins); review is read-only.
- **Prompts:** embed absolute paths **literally** in every agent prompt — never trust interpolation you haven't verified. Sanity-read your first spawned prompt; a path rendered as `undefined` means your templating failed.
- **Structured returns:** every agent returns machine-readable data. Author schema: `{slug, file, deferredLinks[], anchorDiscrepancies[], notes}`. Integrate schema: `{buildPages, pinsChanged[], testResults, remainingFailures[], notes}`. Review schema: `{findings[{page, severity: high|medium|low, what, fix}], notes}`.
- **Review is adversarial and mandatory** for every authoring phase: verify claims against Repo A source, check outline coverage, dead links, banner/conventions, cross-page consistency. High = factual error, dead link, missing banner. Fix agents apply high+medium; low findings are recorded, not blocking.
- **Never weaken an assertion.** Harness failures are fixed by correcting causes or updating pins the new content legitimately moved — both recorded in `pinsChanged`.
- **Escalate to Matt** (stop the phase, report) when: a test fails for a reason that isn't your batch's content; a fix would require changing frozen Store 5 content or a byte-pinned page outside your batch's scope; or a Repo A behavioral question can't be settled by reading source.

### Authoring conventions (give to every author verbatim)

- Frontmatter `--- / title: "…" / ---`; **no h1 in body**; headings start at `##`.
- Directly under frontmatter, this banner **verbatim**:
  > Store 6 is in development and **nothing is published yet**. This page is the shape of the API as
  > it stands on `main`; the install coordinates land with 6.0.0-alpha01.
- Prose + fenced ` ```kotlin ` blocks; `CodeSlab` at most once per page (hero snippet); `Callout` supports **only** `Info | Note | Tip` (no Warning — use Note).
- End the page with the footer (after a `---` separator): `*Last verified: <date> · `main` @ `<sha>`, pre-6.0.0-alpha01*`.
- **Read the anchored Repo A source before writing any snippet or claim** — real symbols, real signatures, real defaults; never invent.
- **Link policy:** internal links only to routes that exist *after this batch*. A cross-link whose target ships in a later batch is written as plain text and recorded in `deferredLinks`.
- Documentation discipline: no hype, no unverified claims, no internal shorthand (issue IDs, decision numbers, session names) in page content. Commit messages MAY reference STORE-nn.

### Per-batch harness checklist (integration agent, one motion with the content)

1. `content/docs/**/meta.json` — new folder meta + extend `content/docs/store6/meta.json` with only-now-existing routes (§8.4 orderings).
2. Route census: add each new route to `FIXED_EXTRA_SOURCES` in `scripts/t8-verification.mjs` (the slot for hand-authored routes), mirror in the `writeContractFixture` in `scripts/t8-verification.test.mjs`, and add rows to `evidence/T8-extras.txt` (sorted; it is derived-checked, not free-form).
3. Search pin: rebuild, re-derive the raw `"fetcher"` count, update **both** `scripts/verify-search-index.mjs` and `scripts/t5-search-contract.test.mjs`.
4. Wire any **deferred links** whose targets ship in this batch (registry in §4 below + prior batches' returns).
5. Gates (all must pass; use the pinned runtime):
   - Build: `/opt/homebrew/opt/node@22/bin/node /opt/homebrew/opt/node@22/lib/node_modules/corepack/dist/corepack.js pnpm build` → `N_routes + 1` static pages, zero errors.
   - Suite: `/opt/homebrew/opt/node@22/bin/node --test scripts/*.test.mjs` → 0 fail (the single `T4_VERIFY_LIVE` skip is pre-existing).
   - Crawl: `node scripts/t8-verification.mjs --local` (start the production server on port 3222 for the run; stop it after) → all routes 200.
   - Search: `node scripts/verify-search-index.mjs` exits 0.
6. Route arithmetic per batch: B2 +8 routes → 65 (build 66) · B3 +11 → 76 (77) · B4 +3 → 79 (80) · B5 +0.

### Per-batch close-out (you, the orchestrator)

1. Commit to store-docs `main`: content + harness in one commit, message referencing the STORE-nn issue.
2. Linear: flip the batch issue (In Progress at start, Done at close), comment with: commit sha, pages landed, pins changed (old→new), gate numbers, deferred links created/wired, anything escalated.
3. llms.txt growth (§8.3): at batch close, if the batch shipped contract-bearing pages, the Repo A `llms.txt` gains their links → that is a Repo A PR + lock re-pin (`markdownLinkCount` + sha256) once merged. Batch it with any other pending Repo A edits.

---

## 2. Phase graph

```
P-pre (preflight)
   └─ P0 = B0 infra (STORE-31)          ──────────────┐
   └─ P1a = B1 upstream PR (Repo A)  … human gate …   │
        └─ P1b = lock re-pin + llms.txt (after merge) │
P0 ─┬─ P2 = B2 guides (STORE-33)   ─┬─ P4 = B4 migration (STORE-35) ─ P5 = B5 entry (STORE-36)
    └─ P3 = B3 mutations (STORE-34) ┘
P6 = B6 Dokka (STORE-28) — gated only on Store6 PR #33 merging; run whenever unblocked
```

P2 ∥ P3 run concurrently. P1a can be filed immediately (parallel with P0). P1b, and every llms.txt re-pin, waits on its PR's merge — poll `gh pr view --repo matt-ramotar/Store6`, don't block other phases.

---

## 3. Phase specs

### P-pre — preflight (you, no fan-out; ~15 min)

1. `git -C /Users/matt/src/matt-ramotar/store-docs log --oneline -3` → expect `5d5792b` at tip (if not, read what landed since and adjust baselines).
2. `git -C /Users/matt/src/matt-ramotar/Store6 rev-parse --short HEAD` → if not `a6a156e9`, the anchor-drift rule is in force; also run `node scripts/sync-store6-docs.mjs --source-root ../Store6 --check` and handle any drift **before** authoring.
3. Run the suite + search gates once to confirm the green baseline.
4. `gh pr view 33 --repo matt-ramotar/Store6 --json state` → determines whether P6 is unblocked.
5. Read Linear STORE-31…36 + STORE-28 states; correct any that drifted.

### P0 — B0 infrastructure (STORE-31; fan-out: 3 build agents + 1 verify)

Spec: master plan §6 ("Sequencing" PRs 1–2) + STORE-31 description. Flip STORE-31 → In Progress.

- **Agent infra-site** (Repo B): `.github/workflows/verify.yml` + `drift.yml`; `scripts/repin-store6-lock.mjs`; `scripts/check-snippets.mjs` + empty manifest; banned-token scan added to `t4-contract.test.mjs`; PR template. Everything green with zero content changes. The drift workflow's failure semantics come from §6.3 — remember the corrected failure names: hand edits fail `--check` as `<path>: generated output differs` / `OWNED_CENSUS_MISMATCH`, **not** `OWNED_STALE_MODIFIED`.
- **Agent claims-seed** (Repo B): `scripts/check-claims.mjs` + `evidence/store6-claims.json` seeded from `plans/2026-08-10-claims-ledger.json` (§6.5 format). The check flags claims whose anchored file changed since the recorded revision; it must run in `verify.yml`.
- **Agent repoA-guard** (Repo A, branch + PR): `docs-sync-guard` job + `.github/docs-sync-sources.txt` listing lock-listed sources; PR body explains the guard. Do NOT delete branch `claude/angry-cerf-10ee7d` unless PR #33 is merged.
- **Verify agent:** run every new script against fixtures + the live tree; suite still 0 fail; workflows lint (`actionlint` if available, else careful read).

Close: commit Repo B; PR filed for Repo A (human gate noted on STORE-31); flip STORE-31 → In Review or Done per whether the Repo A PR is the only remainder.

### P1a — B1 upstream edits (Repo A, one PR; fan-out: 1–2 agents)

From §5 outlines' "Upstream edits wanted" notes on the four sync-owned spine pages: `docs/store6/key-design.md` (add the StoreNamespace equality rule — normalization by `namespace.value`, no `equals` override; see §7.3/§8.9), `docs/store6/invalidate-vs-clear.md`, `docs/store6/quickstart.md`, `docs/store6/important-defaults.md`. One agent extracts the wanted-edits list from §5 and drafts the edits (documentation discipline applies; these files are lock sources — protected technical tokens stay intact); a second reviews against source. One branch, one PR to matt-ramotar/Store6. **Human gate:** merge.

### P1b — B1 close (after P1a merges; you + 1 agent)

`node scripts/repin-store6-lock.mjs` (from P0; else hand-edit `evidence/T4-store6-source-lock.json`: new revision + sha256s) → regenerate synced pages via `node scripts/sync-store6-docs.mjs --source-root ../Store6` → `--check` green → llms.txt additions for the concepts tree ride the same or next Repo A PR (§8.3) → commit Repo B → STORE-32 → Done with close-out comment.

### P2 — B2 guides (STORE-33; fan-out: 7 authors + integrate + review + fix)

Flip STORE-33 → In Progress. Pages (§3 sitemap, outlines in §5): `guides/fetchers`, `guides/persistence` (+ `#the-bookkeeper-seam` gap section), `guides/testing`, `guides/devtools` (+ `#reference-demo-app`), `guides/extending` (+ Overlay & WallClock seam sections), `guides/performance`, `guides/swift`.

Also in this batch:
- **Room page (sync-owned, NOT hand-authored):** add `store6-room/README.md` to the source lock → generates `content/docs/store6/room.mdx`. This goes through the lock + `deriveStore6OwnedTargets`, not `FIXED_EXTRA_SOURCES`. One integration-agent step.
- **Upstream:** SQLDelight etag-lifecycle edit to `store6-sqldelight/README.md` (§8.9) → include in the next Repo A PR.
- **Deferred-link wiring** (targets now exist): freshness → `guides/fetchers`, `guides/extending`; errors → `guides/fetchers`, `guides/swift`, `guides/testing`; memory-and-lifecycle → `guides/persistence`, `room`; api-tiers → `guides/extending`, `guides/testing`.
- Nav: `guides/meta.json` (order: fetchers, persistence, testing, devtools, extending, performance, swift); extend `store6/meta.json`.

Gates per §1; route arithmetic +8. Close out on STORE-33.

### P3 — B3 mutations (STORE-34; fan-out: 11 authors + integrate + review + fix; run concurrently with P2)

Flip STORE-34 → In Progress. Pages: `mutations` (index), `quickstart`, `mutators`, `pending-write-ui`, `server`, `conflicts`, `aliases`, `drain-and-restart`, `journal-storage`, `inspection` (+ `#keyevents` section), `testing` — outlines in §5 (store6-mutations + gap-fill sections). Every page: experimental/alpha banner; state the two-step ack crash window (adopt-first/retire-last; idempotent endpoints) where relevant.

Deferred-link wiring: read-contract → `mutations/pending-write-ui`; api-tiers → mutations index. Nav: `mutations/meta.json` in adoption order (§8.4). Concurrency caution with P2: both integrations touch `store6/meta.json`, the census files, and the search pin — **serialize the two integrate agents** (authors may overlap freely), or run P3's integration after P2's commit. Gates per §1; +11 routes. Close out on STORE-34.

### P4 — B4 migration (STORE-35; fan-out: 3 authors + integrate + review + fix)

After P2+P3 commit. Pages: `migration/from-store5` (with the rx2/Java out-of-scope statement, §8.8), `migration/component-map` (all seven Store 5 components; honest no-direct-analog entries for Updater, Bookkeeper, Converter), `migration/from-store4`. Wire freshness's deferred links to `migration/from-store5` + `component-map`. Nav: `migration/meta.json`. Gates per §1; +3 routes. Close out on STORE-35.

### P5 — B5 entry revisions (STORE-36; fan-out: 3 agents + verify; SERIAL edits, no route additions)

After P4. Byte-pinned surfaces move here — each agent updates its pin in the same edit:

- **Agent hero:** `/` CTAs → `/docs/store6/overview` + `/docs/store6/quickstart`; update T7 pins in `scripts/t7-static-hero.test.mjs`.
- **Agent docs-router:** `content/docs/index.mdx` → two-track router (Store 6 start-here / Store 5 frozen legacy shelf); root `content/docs/meta.json` "Store 5 (legacy)" labeling (§8.4).
- **Agent overview+nav:** revise `content/docs/store6/overview.mdx` per its §5 outline (links into concepts/guides/mutations/migration now all live) and update `T3_OVERVIEW_SHA256` in `scripts/t4-contract.test.mjs`; re-point `lib/nav.ts` per §8.7: Start → `/docs/store6/overview`, Use Store → `/docs/store6/guides/fetchers`, Integrations → `/docs/store6/room`, Test → `/docs/store6/guides/testing`; Reference/Project unchanged.
- **Verify agent + gates:** search pin re-derive (content changed), full suite, crawl — zero-redirect means every old route still 200s.

Close out on STORE-36.

### P6 — B6 Dokka reference (STORE-28; gated on Store6 PR #33; fan-out: 2 agents + verify)

When PR #33 is merged: generate Dokka for `store6-core` and `store6-mutations` in Repo A; replace `public/reference/store6-core/index.html` + `public/reference/store6-mutations/index.html` **per the replacement contracts stated inside the placeholder HTML themselves** (read them first); apply the `t8-verification.mjs` reference-census relaxation the sync plan §4 pairs with this change; decide + implement the refresh cadence from §6.4. Known Dokka 1.9.20 quirk: unresolved KDoc links are silent in the log — grep the generated HTML for `data-unresolved-link`. Gates + close out on STORE-28.

---

## 4. Deferred-link registry (from B1 authors; wire in the phase whose routes land)

| Source page | Plain-text mention today | Target route | Wire in |
|---|---|---|---|
| concepts/read-contract | pending-write UI in mutations docs | `/docs/store6/mutations/pending-write-ui` | P3 |
| concepts/freshness | fetchers guide | `/docs/store6/guides/fetchers` | P2 |
| concepts/freshness | extending-Store guide | `/docs/store6/guides/extending` | P2 |
| concepts/freshness | the migration guide | `/docs/store6/migration/from-store5` | P4 |
| concepts/freshness | component-by-component mapping | `/docs/store6/migration/component-map` | P4 |
| concepts/errors | fetchers guide (retry patterns) | `/docs/store6/guides/fetchers` | P2 |
| concepts/errors | Swift bridge guide | `/docs/store6/guides/swift` | P2 |
| concepts/errors | testing guide | `/docs/store6/guides/testing` | P2 |
| concepts/memory-and-lifecycle | persistence adapter guide | `/docs/store6/guides/persistence` | P2 |
| concepts/memory-and-lifecycle | Room adapter | `/docs/store6/room` | P2 |
| concepts/api-tiers | extending guide | `/docs/store6/guides/extending` | P2 |
| concepts/api-tiers | testing guide | `/docs/store6/guides/testing` | P2 |
| concepts/api-tiers | mutations overview | `/docs/store6/mutations` | P3 |

Each later batch's authors extend this registry via `deferredLinks` in their returns; carry it forward.

---

## 5. Traps registry (all previously hit or verified — do not rediscover)

1. **Silent overwrite, not blocking:** hand edits to `port-page:generate`-owned files are silently overwritten by `reconcileOwnedOutputs` on the next generate run. Byte-verifying `--check` exists only for the `sync-store6-docs` owner. Never hand-edit any generated file.
2. **Failure names:** `--check` failures read `<path>: generated output differs` / `OWNED_CENSUS_MISMATCH`. `OWNED_STALE_MODIFIED` fires only at reconcile-time drops of formerly-owned targets.
3. **`FIXED_EXTRA_SOURCES` + fixture + `T8-extras.txt` move together** — extras are derived and equality-asserted, and the test fixture must mirror new sources or the suite fails misleadingly.
4. **Search pin lives in two files** (`verify-search-index.mjs`, `t5-search-contract.test.mjs`); it's derived, never predicted.
5. **Callout has no Warning variant** (Info/Note/Tip only, `MigratedWidgets.tsx`).
6. **`meta.json` may only list routes that exist** at build time; folder meta without `title` keeps the existing label.
7. **Pinned runtime is Node 22** via the corepack path in §1.5 — the system default node is not the verified runtime.
8. **zsh `===`** in shell one-liners triggers equals-expansion (`== not found`); quote separators.
9. **`gh pr create` needs `--repo matt-ramotar/Store6`** — bare invocation targets the fork's upstream.
10. **Frozen means frozen:** the 30 Store 5 pages, `/docs/meet-store`, `/docs/intro`, `/docs/quickstart`, `/docs/challenges-at-scale`, placeholders, `/tokens-demo` — never edited, never re-slugged; zero-redirect is harness-asserted.
11. **Prompt interpolation:** verify your first agent prompt doesn't contain `undefined` where a path should be.
12. **Store 5 use-cases tree contains title-only stubs** — that's inherited and correct; don't "fix" them.
13. **Repo A discipline binds synced content:** wording passes never alter protected technical tokens; internal process vocabulary never reaches site surfaces.

---

## 6. Done criteria

- STORE-31…36 all Done (or In Review awaiting only Matt's Repo A merges), STORE-28 Done if PR #33 merged during the run — each with an evidence comment (commit sha, gate numbers, pins old→new).
- store-docs `main` green: build, full suite (0 fail), `--local` crawl all-200, search verifier, sync `--check`.
- 79 page routes live locally (57 + 8 + 11 + 3); every deferred link in §4 wired or still honestly plain-text with its target batch recorded.
- No frozen route edited; no assertion weakened; every Repo A change in a filed PR.
- Out of scope regardless of progress: deploy/cutover (STORE-30), DNS, Mintlify decommission, pushing store-docs anywhere.
