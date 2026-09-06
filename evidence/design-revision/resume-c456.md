# C4–C6 acceptance fixture handoff

Recorded 2026-09-06 11:35 UTC against source revision `a1df36996934d8286240b02a9ec5b311d9207bf6` and installed `@mintlify/components@1.0.18`.

The C4–C6 acceptance gaps now have deterministic fixture targets. Existing fixture IDs and prior cases remain intact. The additions expose expansion state, synchronized example changes, menu dismissal and authored/native ref composition, Search keyboard/focus/input-ref behavior, supplied loading and empty callbacks, Tooltip touch/placement/CTA variants, all seven ZoomControls keyboard actions, both zoom limits, and live reduced-motion changes.

`resume-c456.json` is the execution contract. Its `coverage` array maps every C4–C6 public export or compound member to meaningful states and fixture IDs. Its `browserChecks` array gives the exact action order and expected result for each remaining hydrated interaction.

## Automated result

The focused command passed 33 of 33 tests with zero failures:

```text
PATH=/opt/homebrew/opt/node@22/bin:$PATH node --test scripts/mintlify-code.test.mjs scripts/mintlify-overlays.test.mjs scripts/mintlify-diagrams.test.mjs
```

This run proves fixture execution, static adapter contracts, C4 ref composition and cleanup, C5 prop/callback/ref preservation, C6 action names and callback directions, and the presence of each deterministic browser target. It does not prove hydrated portal, focus, touch, repeated-input, or media-query transitions.

## Browser status

All eleven entries under `browserChecks` are `pending-root-browser`. Root can execute them on `/design-review/components` by scoping each action to `[data-fixture=<fixtureId>]`. No browser result is claimed here.

No C4, C5, or C6 family implementation or style file changed. No build, server, install, browser operation, shared ledger edit, commit, or review wave was performed.
