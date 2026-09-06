# Q2 independent route and reader-journey acceptance review

## Verdict

**HOLD.** The frozen U1-U4 implementation has a coherent source-level reader journey, and root corrected the route overflow found during this review. The first production sweep covers all 82 routes at the four required widths; a focused production rebuild/recheck demonstrates that all five initially failing routes now contain at 320, 390, 768, and 1440. The interaction artifact does not prove several named cases and records an Escape/focus failure. Targeted-layout evidence also omits required first-viewport and TOC measurements. U5 and U6 remain proposals awaiting source authority, so this review does not call the full design revision complete.

## Audit scope and evidence identity

- Reviewed the frozen product identified by `evidence/design-revision/o2-gallery-freeze-manifest.json`: docs baseline `a1df36996934d8286240b02a9ec5b311d9207bf6`, product digest `ea815338e6df00267b593cb0d5ba6ca0d13c9fd75640f75b8844839d641e983d`, captured `2026-09-06T08:30:11.335Z`.
- Read-only source review covered U1 search, U2 shell/provenance, U3 homepage/introduction, U4 module matrix, ordinary fenced-code copy integration, the 82-route ledger, and the current generated reference entries.
- No build, test, server, browser, install, source write, or generated-output operation was performed by Q2.
- `evidence/design-revision/browser/production-routes.json` is the first production route sweep. It contains 328 records: all 82 routes at 320, 390, 768, and 1440.
- `evidence/design-revision/browser/production-overflow-corrections.json` rechecks the five corrected routes at all four widths; every document scroll width equals its viewport.
- `evidence/design-revision/browser/production-journeys.json` records the first search, TOC, hash, and copy attempts. Its observed values are assessed below rather than accepted from the case labels.
- `evidence/design-revision/browser/production-targeted-layout.json` records homepage CTA positions, Quickstart widths, and all eight matrix rows at selected widths. Missing height/TOC fields limit its claims.

## Route-ledger reconciliation

The ledger contains 82 unique routes, matching its declared public-page count: 76 docs routes, four other app routes, and two generated-reference entry routes. It also records 601 generated reference HTML files and separates `/api/search` and `/llms.txt` as non-page surfaces.

All 82 routes currently have `pending` at 320, 390, 768, and 1440. Quickstart and the overview also remain pending at 1280; the other 80 route-level 1280 cells are explicitly `not-applicable` with the targeted-check rationale. The separate first-sweep artifact proves one `main`, one `h1`, zero duplicate IDs, and zero unresolved in-page hash targets in all 328 records. It also proves 318 no-overflow records and ten failures. The ledger has not yet linked those records or incorporated the correction run.

The first-pass failed routes were:

| Route | 320px scroll width | 390px scroll width |
| --- | ---: | ---: |
| `/docs/store6/important-defaults` | 544 | 544 |
| `/docs/store6/migration/component-map` | 454 | 454 |
| `/docs/store6/mutations/conflicts` | 404 | 404 |
| `/docs/store6/mutations/journal-storage` | 492 | 492 |
| `/docs/store6/mutations/server` | 522 | 522 |

Root's DOM inspection found callout content imposing min-content width in all five routes, compounded by long inline identifiers; the Markdown table scroll containers were behaving correctly. The focused recheck covers all 20 affected route/width combinations and shows each document scroll width equal to its viewport. This closes the responsive regression found by Q2 without rewriting the preserved tables.

### Ledger corrections made during Q2

1. Root removed false shell, version-selector, and search applicability from the standalone `/` and `/tokens-demo` routes.
2. Root marked 1280 not applicable on the 80 routes outside the targeted Quickstart TOC and overview module-matrix cases.
3. Root added `copy-control` applicability to all 45 fenced-code source routes, including `/docs/store6/quickstart`. The sweep found one additional copy-bearing route, `/docs/store6/overview`, through its `CodeSlab`; root was asked to add that applicability row too.

The reference rows intentionally describe only the current generated-reference controls. Their entry-page bodies contain absolute production links back to Docs home and the Store 6 overview; the proposed persistent, same-origin U6 return control remains unapproved and absent from the public trees and is tracked as a source-authority gap below.

## Journey review

### U1 — Search

Source review supports the intended structure: one responsive trigger receives the active docs version; Store 6 or Store 5 is the default scope; both versions is explicit; result rows expose type and version; canonical title matches receive priority; stale results are generation- and scope-bound; and closing requests focus return to the trigger. The source contract also rejects unsafe destinations and normalizes display text.

The production interaction record confirms a single dialog, successful keyboard activation of `/docs/store6/guides/fetchers`, and settled Store 6 freshness ranking: 36 results with `Freshness policies` first. It does not yet accept the rest:

- section/text results visibly identify parent page, section when available, and version in real built-index results;
- changing scope cannot activate an old result;
- Escape and focus return: the case labeled `search Escape restores focus` records active element `Search Store documentation` and one remaining dialog, rather than the `Search documentation` trigger and zero dialogs;
- both-version selection: the later record has `scope: store5` and contains only Store 5 results, rather than `both` with both versions represented;
- loading, empty, and failure announcements are exposed; and
- the mobile icon trigger remains visible and usable without article scrolling.

### U2 — Reading shell, mobile navigation, TOC, and provenance

Source review supports a single search trigger, a skip link targeting the real `main`, a mobile navigation sheet with an explicit close control, and a compact TOC placed after the page title/description and before article content. Desktop and compact TOCs share the same source data, preserve nesting, and use generated IDs. Pages without authored headings receive a `#page-title` fallback.

The previous unconditional green `Verified` rail is removed. Source metadata is rendered as neutral `Source recorded` text. Only locally enumerated Store6 revisions become commit links; unknown revisions remain plain text. Version destinations remain `/docs/store6/overview` and `/docs` without invented latest/legacy labels. The Store 6 release notice is consolidated to `In development. Nothing in Store 6 is published yet.`

The production record proves the compact TOC precedes content at 390, includes `#reading-the-output`, and lands that heading at 112px after activation. Equivalent reachability evidence at 768 and desktop TOC measurements at 1280/1440 are absent. Navigation-sheet focus containment/restoration, TOC keyboard use, visible focus, and reduced-motion behavior are also absent.

### U3 — Homepage and first useful action

The homepage now leads with what Store coordinates and presents `Build your first store` before the overview and failure-trace links. The accompanying code surface labels the store block as verbatim from the executable Quickstart module and the `stream`/`get` lines as illustrative. The detailed failure trace has moved to the read-contract page with its qualifying conditions and exact `Data(...)` and `Error(...)` labels intact.

The targeted-layout artifact records the primary CTA at 390, 768, 1280, and 1440, but omits 320 and does not record viewport height. Its CTA bottom coordinate therefore does not independently prove initial-viewport visibility. The end-to-end first-read journey is still incomplete because the authoritative Quickstart sequence is only an unapproved U5 proposal.

### U4 — Module matrix

The revised list preserves all eight row IDs, exact tier labels, release targets, the canonical 12 target set, Inspector 8, the Room subset, SQLDelight runtime-versus-compile-only distinction, and the three existing destinations. It removes the 760px minimum-width table and repeats the shared target groups once. Each non-Room target value has an `aria-describedby` relationship to its shared group definition.

The targeted-layout artifact shows all eight rows contained at 390, 768, 1280, and 1440, and the focused U4 command log passes semantic equality for IDs, tiers, releases, canonical/Inspector groups, Room, SQLDelight, and links. The requested 320 targeted matrix record is absent. Q2 also lacks visual proof that `Canonical 12` remains understandable while reading an individual mobile row; an accessibility description alone does not prove that sighted readers can resolve the shorthand without losing their place.

### Route-level copy controls

The production MDX map sends ordinary `pre` elements through `FencedCodeBlock`, and the compiler adds exact raw source plus language metadata. The rendered block includes a keyboard-focusable scroll area and a copy button with success/failure live-region text. The route sweep sees copy controls on 46 routes, including four on Quickstart, but the interaction record reports `statuses: []` and the button still labeled `Copy`. It therefore does not prove success or failure feedback. Q2 does not accept copy interaction behavior yet.

### Generated reference return paths

The current public reference trees remain generated from recorded provenance `c67a94ed30460a35161c2cbc3e725f127caf055e`. Their entry-page body text has absolute links to the deployed Docs home and Store 6 overview. The U6 proposal for persistent Store identity and a same-origin guide-return control passed isolated proposal generation across the complete candidate output, but it has not been approved, merged, re-pinned into Store Docs, substituted for the current public trees, or published. Current entry links may be browser-checked as legacy behavior; they cannot satisfy or close U6.

## Coverage gaps versus failed behavior

### Coverage gaps

- The production route artifacts exist, but the ledger still has empty evidence links and pending status for every required viewport.
- No route-level copy-control proof yet; applicability is now present for all 45 fenced-code sources.
- No current-control browser proof for the reference entry links; the new persistent same-origin return control remains outside U1-U4 pending U6 authority.
- The combined-version walkthrough does not enter both-version scope, and the Escape walkthrough does not close/restore focus.
- No inspectable keyboard walkthrough for mobile navigation, compact TOC, copy, or reference controls.
- Homepage first-viewport evidence omits 320 and all viewport heights; TOC evidence omits 768 and desktop measurement.
- The first route sweep failed mobile overflow on five routes; focused correction proof now closes all 20 rechecked route/width combinations.

### Confirmed failed contracts

- None remain from rendered overflow inspection; the first-pass mobile failures were corrected and rechecked.
- The overview copy control is present in the rendered sweep but was absent from the last inspected ledger interaction list.
- Search Escape/focus restoration is failed in both attempts (`active` remains the search input and `dialogs` remains 1).
- Both-version search and copy feedback have no conforming captured result/status values and remain coverage failures. Freshness canonical-first ranking is accepted from the settled record.

## Acceptance condition

Q2 can be reconsidered after root links production evidence to each applicable route/viewport and supplies the focused interaction/keyboard records. Passing those checks would support only the U1-U4 site milestone. The full revision remains open until the U5 Quickstart and U6 reference proposals receive source authority and their generated outputs are accepted.
