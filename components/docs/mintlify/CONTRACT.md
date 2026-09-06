# Store component compatibility contract

Contract version 1. Frozen against docs `a1df36996934d8286240b02a9ec5b311d9207bf6` and installed `@mintlify/components@1.0.18` on 2026-09-06. The execution deadline is 08:58:06 UTC. No package version changes are planned.

The public boundary is 42 React root exports, seven compound members, 12 other runtime exports, and the public type exports recorded in `evidence/design-revision/component-coverage.json`. Registration, behavior, and theme acceptance are separate. No fixture is considered browser-verified until root records the result.

## Ownership

Each worker owns only its assigned family directory and named focused test. Export runtime adapters from `index.tsx`, fixture metadata and executable renders from `fixtures.tsx` as `fixtures: ComponentFixture[]`, and scoped styles from `styles.css`. Additional helper files within the directory are allowed. Do not import the shared runtime from a family (that creates a cycle). Import sibling adapters locally. Workers do not edit this contract, the fixture type, barrel, MDX map, global CSS, generated files, shared tests, or ledgers. No worker starts a build/server/browser, installs packages, commits, or spawns agents. Root integrates and conducts one final independent review wave.

## Exact Tidal colors

| Tokens | sRGB |
| --- | --- |
| background | #F7F6F0 |
| surface, overlay, field-background, segment | #FFFFFF |
| foreground, surface-foreground, overlay-foreground, default-foreground | #172C2A |
| muted, foreground-secondary, field-placeholder | #596A65 |
| accent, accent-strong, link, focus | #13766D |
| accent-foreground | #FFFFFF |
| accent-soft | #E3F0E9 |
| accent-soft-foreground | #13766D |
| border, separator | #DCE2DC |
| color-store-code-surface | #172624 |
| color-store-code-foreground | #DDE9E5 |
| color-store-code-keyword | #C4A7FF |
| color-store-code-string | #75D394 |
| color-store-code-function | #F1B96D |
| color-store-code-type | #F08AAC |
| color-store-code-comment | #A8B7B0 |
| success-soft / success-soft-foreground | #EAF3E9 / #23683F |
| warning-soft / warning-soft-foreground | #FFF2D9 / #80520C |
| danger-soft / danger-soft-foreground | #FCECEC / #A43E40 |

Filled statuses use their dark foreground value as background with white text. Secondary/default surfaces derive from 50% white + paper (`#FBFBF8` rounded); tertiary surfaces use paper. Hover surfaces blend 8% primary ink into the starting surface. Accent hover blends 12% ink into accent (`#136D65` rounded); pressed uses 20% (`#146760` rounded). Use CSS color-mix for the exact unrounded mixtures. Focus uses teal on light surfaces, code-function amber on code surfaces; 2px outline with 3px offset. Control boundaries use muted, decorative dividers use border. Disabled controls retain labels and native disabled semantics; their contrast exemption is not applied to active controls. Scrollbars use muted against paper. All resolved pairs and unrounded ratios are in `evidence/design-revision/token-pairs.json`.

## Scope and compatibility

Body has `.store-docs`, including body-mounted portals. Scope family selectors to `.store-docs` and a family class or component part. Keep a light shell and dark default code, preserve explicit component theme/color props and author swatches/diagram colors. Origin-category tokens remain separate from code syntax. Do not add a shell theme switch.

Preserve exact package props, callbacks, refs where declared, compound members and utility/type imports. Legacy aliases remain: AccordionGroup, CardGroup, Step, Tab, all migrated widgets. Local defaults apply only when callers omit a value. Legacy Callout `type` remains accepted; explicit package `variant` wins and determines accessible labeling. Explicit caller Card `as` wins; protocol-relative URLs are external. MDX overrides remain last in `getMDXComponents`.

Server-authored MDX passes only serializable props across client boundaries. Callback examples live in client fixtures. The gallery imports real `.mdx` compiled by Fumadocs with the same `source.config.ts` and MDX component map as production docs, and separately renders client fixtures. Gallery route `/design-review/components` is enabled only by `DOCS_COMPONENT_GALLERY=1`, has noindex and no public navigation/search registration; normal builds return 404.

The compatibility barrels only re-export components; they do not declare `use client`. Each interactive family declares its own client boundary. Adding a client boundary to these asynchronous re-export barrels breaks Next's serialized page segments even when full-page HTML renders. `scripts/client-navigation.test.mjs` checks the built Flight payloads for this failure; browser verification must also include actual sidebar clicks without reloading between destinations.

Search requires supplied data/callbacks. View requires an explicit items registry. No hosted Mintlify indexing, Ask AI, RSS, hosted tab persistence or automatic multi-view extraction is promised. Raw upstream utility class maps are preserved imports, not rethemed output.

U1 exposes `CommandSearch({version}: {version: DocsVersion})`; U2 alone wires it into TopNav. One shell dialog/shortcut listener. Standalone package SearchProvider appears only in fixtures. U2 uses one hierarchical TOC data source for desktop/mobile with separate control IDs and the same heading destinations, plus #page-title fallback and a skip link to the main element.

Source dates/revisions are neutral attribution, separate from release and API tier. Missing metadata cannot produce Verified. Generated output/source re-pin requires a clean, committed authorized source revision. Source proposal preparation proceeds independently; no upstream landing is authorized by a fixture result.

## Handoff

Return changed paths, exports/enums/states covered, exact commands/results, unresolved issues, root integration requests, evidence links, and confirmation of file ownership. Use the shared `scripts/mintlify-test-utils.mjs` loader for isolated Node rendering checks. Browser interaction evidence is root-owned. Do not label static rendering as keyboard or portal proof.
