# Sidebar navigation correction

The user reported that sidebar clicks showed “This page couldn’t load,” while reloading the destination succeeded. The failure reproduced twice in the running production preview: Quickstart → Freshness, then Freshness → Errors. Both clicks logged React error 441. Reloading Freshness rendered its correct heading.

## Cause and change

The full-page HTML and Flight payloads rendered successfully, but **45 page-segment payloads contained 278 error records**. The normal build suppressed the underlying segment-collection errors. A diagnostic production build with `NEXT_DEBUG_BUILD=1` exposed the module error: the `mintlify-runtime.tsx` exports were marked as asynchronous ESM modules but loaded as CJS proxies during segment serialization. The affected exports were `FencedCodeBlock`, `Step`, `Tabs`, and `Tab`.

Removed the redundant `use client` directives from `components/docs/mintlify-runtime.tsx` and `components/docs/mintlify/index.ts`. These files only re-export components. The actual interactive families retain their client boundaries, and public exports remain intact. Sidebar links still use Next Link and client navigation.

The new `scripts/client-navigation.test.mjs` examines the built full and segmented Flight payloads. It fails on server-render error records and exempts only the intentionally hidden component gallery. It failed before the fix and passes afterward. Static HTML checks alone did not detect this failure.

## Verification

- Corrected production build: `tDZkDmjMZP4GzeiE_j9qa`. Build and nonincremental TypeScript checks pass.
- Full suite: **326 passed, zero failed, one opt-in live test skipped**.
- Zero server-render errors remain in public page navigation payloads; diagnostic build logging reports no segment-collection error.
- **Nine actual sidebar transitions pass without intervening reloads**, covering the 880px drawer, 1440px desktop sidebar, and Store 5 Quickstart. The Store 5 code tab switches to its expected visible panel after client navigation.
- The browser console retains the two original reproduction errors and records no new error during corrected navigation.
- The preview was returned to `/docs/store6/overview`, with viewport overrides reset. The server remains running at `http://localhost:3222` (session 52986).

`first-browser-failures.json`, `first-segment-errors.json`, `first-freshness.segment.rsc`, `debug-build.log`, and `first-regression-red.log` preserve the failure. `boundary-fix-build.log`, `regression-green.log`, `types.log`, `contracts.log`, and `fixed-browser-navigation.json` record the correction.

The initial worker's build-mismatch suggestion was incorrect: the preview server had been started after the latest build, and no rebuild occurred while it was running. The archived payloads and diagnostic build established the actual cause before implementation. No dependency, source-lock, generated documentation, or public-reference change was made for this correction.
