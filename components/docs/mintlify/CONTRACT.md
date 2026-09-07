# Store component compatibility contract

The local adapters preserve the installed `@mintlify/components` API while applying the Store documentation theme. [api-contract.ts](./api-contract.ts) checks runtime export assignability. [index.ts](./index.ts) exposes the adapters, legacy aliases, upstream utilities, and public types. Keep API compatibility, interaction behavior, and appearance verification separate.

## Implementation boundaries

Each component family owns its adapters in `index.tsx`, executable examples in `fixtures.tsx`, serializable MDX examples in `serializable.mdx`, and scoped rules in `styles.css`. Fixtures implement [ComponentFixture](./fixture-contract.ts). Import sibling adapters locally. Importing the shared runtime from a family creates a cycle.

Preserve package props, callbacks, declared refs, compound members, and utility/type imports. Keep legacy aliases, including `AccordionGroup`, `CardGroup`, `Step`, and `Tab`. Apply local defaults only when callers omit a value. Legacy Callout `type` remains accepted. Explicit package `variant` wins and determines accessible labeling. Explicit caller Card `as` wins, and protocol-relative URLs are external. Caller overrides remain last in [getMDXComponents](../../../mdx-components.tsx).

Search requires supplied data/callbacks. View requires an explicit items registry. The adapters do not promise hosted Mintlify indexing, Ask AI, RSS, hosted tab persistence, or automatic multi-view extraction. Upstream utility class maps remain unchanged imports rather than themed output.

## Theme

[app/globals.css](../../../app/globals.css) defines the current tokens and imports each family's `styles.css`. Maintain colors and state styling there rather than duplicating palette values in this document.

The body has `.store-docs`, including body-mounted portals. Scope family selectors to `.store-docs` and a family class or component part. Keep the light shell and dark default code surface. Preserve explicit component theme/color props, author swatches, and diagram colors. Origin-category tokens remain separate from code syntax. Do not add a shell theme switch. Disabled controls retain labels and disabled semantics. Their contrast exemption does not apply to active controls.

## Client boundaries and gallery

Server-authored MDX passes only serializable props across client boundaries. Callback examples belong in client fixtures. Compatibility barrels only re-export components and must not declare `use client`. Each interactive family declares its own client boundary. Adding a client boundary to the asynchronous re-export barrels can break Next's serialized page segments even when full-page HTML renders.

The [component gallery](../../../app/design-review/components/page.tsx) compiles real MDX through the production Fumadocs configuration and MDX component map, alongside separate client fixtures. `/design-review/components` is enabled only by `DOCS_COMPONENT_GALLERY=1`. It has noindex and no public navigation or search registration. Normal builds return 404.

## Verification and source ownership

Maintain API registration and override checks in [mintlify-contract.test.mjs](../../../scripts/mintlify-contract.test.mjs), family coverage in `scripts/mintlify-*.test.mjs`, and executable examples in the family fixtures. Use [mintlify-test-utils.mjs](../../../scripts/mintlify-test-utils.mjs) for isolated Node rendering checks. [client-navigation.test.mjs](../../../scripts/client-navigation.test.mjs) checks built Flight payloads for server-render errors.

Static rendering does not establish keyboard interaction, portal behavior, focus restoration, or visual contrast. Browser verification must exercise the affected states and actual sidebar navigation without reloading between destinations. Report only the states and surfaces observed.

Source dates and revisions are attribution, separate from release and API tier. Missing metadata cannot produce Verified. Generated output and source re-pins require a clean, committed, authorized source revision. Fixture results do not authorize upstream changes.
