# Protected ownership audit

Date: 2026-09-06

The protected baselines remain intact. One checker is not green: `check-claims.mjs` exits 1
because the regenerated title-only routes and their ownership hashes made nine claim anchors
stale. This report does not reconcile those claims.

## Protected boundaries

| Boundary | Evidence | Result |
| --- | --- | --- |
| Store6 source lock | `evidence/T4-store6-source-lock.json` records `5a8c956bc1dbd6ad838ea9da3b34c7d76c703a71`, 13 sources, and SHA-256 `8f8a11a9597449a29ffdd07bee1c70c391956e63d42c0254b8ea3dfe5e23aaac`. The locked checkout is clean at the same revision. | Preserved. All 13 synchronized outputs pass the locked-source check. |
| Real Store6 checkout | `/Users/matt/src/matt-ramotar/Store6` resolves to `5a8c956bc1dbd6ad838ea9da3b34c7d76c703a71`. `git diff --quiet` exits 0. | No tracked Store6 change. Five documentation paths remain untracked: four files below `docs/superpowers/plans/` and `docs/superpowers/reviews/`. |
| Public reference baseline | `evidence/T6b.md` records provenance `c67a94ed30460a35161c2cbc3e725f127caf055e`, 241 `store6-core` files, and 470 `store6-mutations` files. All 711 current files match `evidence/design-revision/resume-fallback-final-freeze-manifest.json`. The protected-path Git comparison is empty. | Preserved. U6 remains pending because this audit does not substitute or approve a newer reference tree. |
| Live snapshot | `evidence/T4-live-snapshot.json` has SHA-256 `513ec3b074da81057dd53710a6015c9b695c4d432ff796045bde3afa80e68155`. `validateSnapshot` accepts all 37 pages, their body and Markdown hashes, the inventory hash, and the link-health hash. | Preserved. The current snapshot is the input to `port-page.mjs --generate`; no live acquisition ran. |
| Dependency lock | `pnpm-lock.yaml` has SHA-256 `ae040a3152ee9f9d5284470286b6be07430b1ffd572f526873e3677f31a263f6` and no Git diff from `HEAD`. | Preserved. No install or dependency mutation ran. |
| Drift workflow | `.github/workflows/drift.yml` has SHA-256 `0d68c2e25cb951c06f29105e460bf7240794a8523350ae2cce0b72537b701b9e` and no Git diff from `HEAD`. It retains the daily schedule, exact source-lock comparison, synchronized-output check, claims and snippet checks, and publication allowlist. | Preserved. This local audit did not execute the network, Gradle, or publication portions of the workflow. |

## Snapshot-generated ownership

`evidence/T4-owned-targets.json` contains 52 entries: one `port-page:acquire`, 38
`port-page:generate`, and 13 `sync-store6-docs`. Every recorded SHA-256 matches the current file.
The ledger, `scripts/port-page.mjs`, and the two title-only outputs also match
`evidence/design-revision/resume-fallback-final-freeze-manifest.json`.

The generator and both title-only routes contain the same `OnThisPage` addition. The ledger diff
changes only the hashes for:

- `app/developer-newsletter/overview/page.tsx` to
  `70c577f7853f3b0a391a32b30ce19fe5a203ee8bb8e848b21e876c4e4cfa9dec`.
- `app/release-notes/overview/page.tsx` to
  `2d8173b1371c5db82b3fc5d2edccf4d21625fd463c8315d9313c59c474e3da99`.

Both hashes match the current files and ledger. No other ownership hash changed. These byte
comparisons establish output-to-ledger consistency. They do not infer who ran the generator from
file bytes.

## Protected content after the voice baseline

The comparison source is `/private/tmp/store6-resume-voice-baseline.json`, documented by
`evidence/design-revision/resume-writing-voice.md`.

- `components/overview/StartHereList.tsx`,
  `content/docs/store6/concepts/read-contract.mdx`,
  `content/docs/store6/quickstart.mdx`, and
  `content/docs/store6/important-defaults.mdx` remain byte-identical to that baseline.
- `components/hero/HeroThesis.tsx` contains the documented prose replacement and later responsive
  spacing and type classes. `components/hero/KeyEngineTrace.tsx` contains the documented caption
  replacement and later inline-code color classes. The code example and inline technical tokens are
  unchanged.
- `app/page.tsx` changes only the responsive vertical-padding class.
- `content/docs/store6/overview.mdx` moves one existing paragraph below the link group without
  changing its text.

The `quickstart.mdx` and `important-defaults.mdx` differences from `HEAD` predate this comparison.
They are the intentional restoration of the locked `sync-store6-docs` output. Both files match the
voice baseline byte for byte and pass the current 13-output check at
`5a8c956bc1dbd6ad838ea9da3b34c7d76c703a71`. This does not approve the separate U5 source proposal.

## Commands and exit codes

| Command | Exit | Result |
| --- | ---: | --- |
| `git diff --quiet HEAD -- evidence/T4-live-snapshot.json evidence/T4-store6-source-lock.json evidence/T6b.md public/reference pnpm-lock.yaml .github/workflows/drift.yml` | 0 | Protected Store Docs paths have no tracked diff. |
| `git -C /Users/matt/src/matt-ramotar/Store6 diff --quiet` | 0 | Real Store6 tracked files are unchanged. |
| `git -C /private/tmp/store6-design-revision-locked-20260906 status --porcelain=v1` | 0 | No output. The locked checkout is clean. |
| `/opt/homebrew/opt/node@22/bin/node scripts/sync-store6-docs.mjs --source-root /private/tmp/store6-design-revision-locked-20260906 --check` | 0 | Checked 13 locked outputs at `5a8c956bc1dbd6ad838ea9da3b34c7d76c703a71`. |
| `/opt/homebrew/opt/node@22/bin/node scripts/check-claims.mjs --source-root /private/tmp/store6-design-revision-locked-20260906` | 1 | Nine claim anchors are stale. Seven anchor `evidence/T4-owned-targets.json`; two still describe the title-only routes as an h1 above an empty content div. |
| `/opt/homebrew/opt/node@22/bin/node scripts/check-snippets.mjs --source-root /private/tmp/store6-design-revision-locked-20260906` | 0 | Checked 33 snippets and 38 page references at the locked revision. |
| Local Node verification of `validateSnapshot`, all 52 ownership hashes, 711 reference files, and selected freeze-manifest hashes | 0 | All comparisons passed. |
| `git diff --check` | 0 | The tracked worktree diff has no whitespace errors. |

The claim failure is the only unresolved result in this audit. Its nine diagnostics require claim
re-verification and reconciliation after the generated title-only route change. No source lock,
snapshot, reference tree, dependency lock, drift workflow, Store6 tracked file, or product file was
changed by this audit.

## Claim reconciliation correction

The first-red result above remains the audit record. The correction changed nine claim records in
`evidence/store6-claims.json`.

Seven claims kept their existing text and verdict. Their sole change is the
`evidence/T4-owned-targets.json` anchor SHA-256, now
`3cc160225f68b9eea8864d02f2bfcfd535f6f6f70d3e73b56ff77e073911df8b`.

The `developer-newsletter/overview/001` and `release-notes/overview/001` claims now state the
current generated structure: an `AppShell` page with an h1 reading `Coming soon`, a compact fallback
table of contents, a header `Separator`, and an empty `#content` div. Both verdicts are `CONFIRMED`.
Their anchors now match the generated entrypoints at
`70c577f7853f3b0a391a32b30ce19fe5a203ee8bb8e848b21e876c4e4cfa9dec` and
`2d8173b1371c5db82b3fc5d2edccf4d21625fd463c8315d9313c59c474e3da99`.

The repository's `--reconcile-all` mechanism refreshed the whole-file anchors. It selected all 475
claims, but the preceding checker identified only these nine stale records. The resulting
`evidence/store6-claims.json` SHA-256 is
`95c24215ba05928db8581654da4beb02bba251e31968929a21ccc3114b0fe813`.

| Correction check | Exit | Result |
| --- | ---: | --- |
| `/opt/homebrew/opt/node@22/bin/node scripts/check-claims.mjs --source-root /private/tmp/store6-design-revision-locked-20260906 --reconcile-all` | 0 | Reconciled 475 claims and checked 526 anchors at the locked revision. |
| `/opt/homebrew/opt/node@22/bin/node scripts/check-claims.mjs --source-root /private/tmp/store6-design-revision-locked-20260906` | 0 | Checked 475 claims and 526 anchors with no remaining drift. |
| `/opt/homebrew/opt/node@22/bin/node --test scripts/check-claims.test.mjs` | 0 | All 28 focused tests passed. |
