# Claims reconciliation after transactional regeneration

Date: 2026-09-06

## Boundary

The Store6 source lock remains `5a8c956bc1dbd6ad838ea9da3b34c7d76c703a71`. This reconciliation changes no
source revision, source lock, generated page, or ownership assignment. It updates the claims ledger
only after checking each currently changed anchor against the implementation and regenerated
ownership ledger.

## Findings

The seven previously stale `evidence/T4-owned-targets.json` anchors remain distinct from source
drift. Transactional regeneration updated the ownership-ledger bytes while preserving these seven
entries under `port-page:generate`: `content/docs/meet-store.mdx`, `content/docs/intro.mdx`,
`content/docs/quickstart.mdx`, `content/docs/challenges-at-scale.mdx`,
`content/docs/community/overview.mdx`, `app/developer-newsletter/overview/page.tsx`, and
`app/release-notes/overview/page.tsx`. The existing `docs/meet-store/003` refutation and correction
remain unchanged: continued outputs are overwritten during regeneration rather than rejected for a
byte mismatch.

The navigation claims remain true. `primaryNavItems` still sends Docs to
`/docs/store6/overview` and Community to `/docs/community/overview`; `docsVersions` still sends the
Store 5 choice to `/docs`; `/tokens-demo` appears in neither definition.

Four claims needed implementation-aware corrections:

- `home/006` now records that T7 moved the exact failure-result assertions to the read-contract
  page and requires Quickstart first plus the overview and failure-trace destinations on the built
  homepage.
- `docs/quickstart/004` now records that the search verifier replaced the exact 60-result pin with
  destination, version-scope, normalization, and uniqueness checks. `docs/quickstart/003` remains
  true and now points at the relocated closed-trigger assertions.
- `developer-newsletter/overview/001` and `release-notes/overview/001` now record the generated
  header `Separator` between the `Coming soon` heading and empty content region.
- `tokens-demo/003` now records that T7 checks the five code-surface text tokens and no longer
  asserts contrast for the four on-dark origin tokens.

`tokens-demo/002` remains true, but its semantic anchor now points to
`app/tokens-demo/TokenExamples.tsx`, where the origin chips, dots, on-dark variants, and separate
Supported/Experimental status chips are rendered. `tokens-demo/004` remains true: the fixed-extra
source array contains 33 routes, including `/tokens-demo`, while the source lock supplies 12 Store6
page routes separately.

## Verification

The final whole-ledger reconciliation ran only after the no-mutation check enumerated 19 affected
claim IDs and each was inspected. The command completed successfully:

```text
node scripts/check-claims.mjs --source-root /private/tmp/store6-design-revision-locked-20260906 --reconcile-all
reconciled 475 claims; checked 475 claims (526 anchors) at 5a8c956bc1dbd6ad838ea9da3b34c7d76c703a71
```

This result confirms ledger integrity and current hashes. It does not grant source re-pin,
publication, build, or browser authority.
