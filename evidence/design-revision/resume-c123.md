# C1-C3 acceptance fixture handoff

This change closes the recorded fixture gaps for callbacks, refs, keyboard state, session reload and clipboard outcomes. It does not revise the Q1 review or claim browser acceptance.

## Scope and source

- Source revision: `a1df36996934d8286240b02a9ec5b311d9207bf6`.
- Installed contract: `@mintlify/components@1.0.18` declarations and runtime modules.
- Edited families: C1 status, C2 disclosure and C3 layout fixtures plus their focused tests.
- Adapter and stylesheet changes: none.
- Shared `component-coverage.json` changes: none.

## Focused automated result

`/opt/homebrew/opt/node@22/bin/node --test scripts/mintlify-status.test.mjs scripts/mintlify-disclosure.test.mjs scripts/mintlify-layout.test.mjs`

Result: 28 tests passed, zero failed. These checks establish executable server rendering, exact fixture selectors and initial outputs, public enum rendering, adapter exports, compound-member identity and the static ref surfaces. They do not establish hydrated effects, callback settlement, DOM ref attachment, keyboard transitions, session reload, clipboard behavior, tooltip portals or focus appearance.

## Missing acceptance now made observable

| Fixture | Export or member | Observable acceptance surface |
| --- | --- | --- |
| `status-client-callbacks` | `Badge`, `ParamHead` | Separate button/link callback counts, focused label, `onMount`, current hash, unhandled-rejection count and a denial toggle that restores the original clipboard descriptor. |
| `c2-expandable` | `Expandable` | Exact `user_toggled_expandables.c2-session-fields` value plus controls that reset only that entry or reload the fixture. |
| `c2-steps` | `Steps.Item` | Exact ID for `scrollElementIntoView`, `onCopyAnchorLink`, `onRegisterHeading` and `onUnregisterHeading`, plus an explicit unmount/remount control. |
| `c2-tabs` | `Tabs` | `onTabChange` index and attached `panelsRef` state. |
| `c2-tree` | `Tree`, `Tree.File`, `Tree.Folder` | Focused tree-item label and open-folder list after each keyboard event. |
| `layout-update-visibility-callbacks` | `Update` | Forwarded ref state plus copy, register and unregister callback IDs across unmount/remount. |
| `layout-view-registry` | `View` | Active forwarded ref name across Kotlin and Swift registry switches. |
| `layout-color-variants` | `Color.Item` | Named table swatches with exact clipboard, copied-state and tooltip assertions. |

The complete per-export/member and meaningful enum/state mapping is in `resume-c123.json` under `coverage`. It names all 13 C1 exports, all 10 C2 exports and compound members, and all 11 C3 exports and compound members. The same file contains nine root-executable browser probes with exact fixture IDs, setup, actions and assertions.

## Browser gate

All nine probes in `resume-c123.json` remain `pending-root-execution`. Their setup uses fixture controls and the browser's real clipboard. Root must run them against the gated component gallery. Static rendering is not keyboard, ref, callback, clipboard, session or portal proof.
