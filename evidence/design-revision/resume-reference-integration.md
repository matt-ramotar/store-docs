# Reference verification integration

Completed 2026-09-06. The docs-side verifier now has an explicit strict Tidal mode. It passes the
isolated proposed output and rejects the current public output for its missing persistent guide
control. The current public output still passes legacy integrity verification. This work does
not close U6 or approve source changes.

## Changes

- `scripts/test-t6b-reference.mjs` accepts `theme: "tidal"` through its callable API and
  `--theme tidal` through its CLI. `--root` selects an isolated docs tree. Unknown options and
  unsupported themes fail. The default remains legacy verification.
- Results report `verificationMode: "legacy-integrity"` with zero custom-theme pages, or
  `verificationMode: "tidal-customization"` with the number of full documents checked. A legacy
  pass cannot be reported as evidence that the persistent guide/theme contract was checked.
- Strict mode checks each full document in both modules. Only each module's `navigation.html`
  fragment is exempt from the page shell checks, and it is rejected if it contains a full
  document. Its existing links, handlers, assets, and ownership checks still run.
- Each full page must retain the exact header guide href `/docs/store6/overview`, accessible name
  `Store 6 guide`, visible text `Store guide`, current-context navigation, module identity and
  local module-root target. It must retain the stock theme, search, TOC, source-set filter,
  platform selector, sidebar, breadcrumbs, and main-content structures. Known hidden/disabled
  attributes and inline hiding on required controls or their ancestors are rejected.
- Every page must load the supported stylesheet and Store icon at their canonical module paths.
  Candidate CSS and icon contents are pinned by SHA-256. The stock style links and all seven
  approved stock script paths must remain loaded. The Store footer must remain present.
- `scripts/test-t6b-reference.test.mjs` adds DOM/resource mutation tests. Its fixture resources
  live under `scripts/fixtures/reference-theme/`, independently of the verifier's hash constants.
  They preserve the exact tested source-proposal bytes and include explicit provenance. Existing stock-script fixtures still come from
  the checked-in generated trees. These fixtures do not depend on a private temporary checkout.
- `scripts/dokka-reference-workflow.test.mjs` checks the proposed integration in an isolated
  temporary workflow. It also accepts that same integration after an authorized application.

## Workflow proposal

`evidence/design-revision/proposals/drift-reference-integration.patch` remains unapplied.
It makes two changes to `.github/workflows/drift.yml`:

1. Before generation, explicitly require the source-owned CSS, logo, and header-template
   resources. An unmodified source revision fails with a message directing the operator to
   integrate the approved Store6 source change before selecting strict Tidal verification.
2. Invoke `node scripts/test-t6b-reference.mjs --theme tidal` before packaging the publication
   artifact.

The patch preserves the existing exact-revision check, cadence, ownership allowlists, complete
tree replacement, verification order, publisher job, and credentials boundaries. It retains the
supported `:store6-core:dokkaHtml :store6-mutations:dokkaHtml --stacktrace` command. The isolated
Store6 convention plugin registers those wrapper tasks with a dependency on
`dokkaGeneratePublicationHtml`; the saved `reference-generation-configured.log` shows both
publication tasks and both wrappers executing. No obsolete Dokka API or guessed output path was
introduced.

The source-resource precondition is an explicit prerequisite, not proof that the plugin installed
those resources. Strict verification of the generated output supplies that second check.

## Checks run

All commands ran under Node v22.22.0. Only Node verification/tests and their isolated local
fixture helpers ran. No Gradle invocation, build, server, browser, installation, or public output
replacement occurred.

| Command/check | Result |
| --- | --- |
| New strict tests before implementation, selected by `--test-name-pattern='Tidal\|CLI selects'` | 0 passed, 6 failed. Missing mode reporting and unimplemented strict rejection were observed. |
| `node --test scripts/test-t6b-reference.test.mjs` after implementation | 37 passed, 0 failed. |
| `node --test scripts/dokka-reference-workflow.test.mjs` | 14 passed, 0 failed. |
| Focused proposed-workflow test after allowing the same test to run post-integration | 1 passed, 0 failed. |
| `node scripts/test-t6b-reference.mjs` on current public output | Passed legacy integrity: 601 HTML, 711 files, 5,990 script checks, 0 custom-theme pages. |
| `node scripts/test-t6b-reference.mjs --theme tidal` on current public output | Expected rejection: no header `#homepage-link` on `store6-core/index.html`. |
| `node scripts/test-t6b-reference.mjs --root /private/tmp/store-reference-proposal-proof-jORu04 --theme tidal` | Passed strict customization: 599 full documents, 601 HTML, 713 files, 5,990 script checks. |
| Byte comparison of stock-script SHA constants/path sets, `verifyStockDokkaScript`, and `verifyScript` against Git HEAD | Unchanged. |
| `git diff --check` for the three changed script files | Passed. |
| `.github/workflows/drift.yml` diff | Empty. Proposal only. |

One initial positive fixture check found that the synthetic nested page accidentally embedded
its already-updated entrypoint body, creating duplicate headers. The fixture was corrected to
capture the original body links once before writing either page. The positive fixture and all
negative mutations then passed. No application failure was bypassed or retried to hide it.

The mutation tests remove or break deep-page guide links, use production-origin or query/hash
aliases, change accessible names, hide controls, remove each stock control, disable the theme
button, break the search role, change module identity/root targets, remove or unload CSS, alter
or delete both theme assets, remove the footer or a stock script, tamper with stock script bytes,
and disguise a full page as a navigation fragment. Workflow tests execute the extracted
source-resource guard against missing and complete fixture resources, apply the proposal in a
temporary directory, parse the resulting YAML, verify order, and compare the unchanged
publisher and other generator steps.

## Source authority and remaining dependencies

Current public reference provenance remains `c67a94ed30460a35161c2cbc3e725f127caf055e`. The isolated
candidate was generated from `5a8c956bc1dbd6ad838ea9da3b34c7d76c703a71` plus the uncommitted source
proposal. No source revision was invented or substituted, and neither provenance record changed.

Root still needs source approval/merge, an exact merged-revision re-pin, authorized generation of
both complete trees, and application of the workflow proposal. The candidate resource hashes
must be reconsidered if the reviewed source changes its CSS or logo. Permanent test fixtures under `scripts/fixtures/reference-theme/` preserve the tested CSS, logo,
and proposal-only workflow patch with explicit provenance. The tests have no dependency on
transient files under `evidence/design-revision/proposals/`.

Strict verification proves structural presence, exact guide navigation, resource contents, and
the existing integrity/ownership rules. It does not prove computed contrast, responsive layout,
keyboard focus, search interaction, platform filtering, theme persistence, or source approval.
Those require the root-owned generation/provenance and browser acceptance steps. No strict
result from this isolated candidate is a claim of public integration or U6 completion.


## Permanent fixture correction

The CSS and logo test resources were moved to permanent fixtures under
`scripts/fixtures/reference-theme/` without changing their tested bytes. The exact tested workflow
proposal patch is now a permanent fixture in that same directory. `provenance.json` records the
source proposal state, resource paths and hashes, workflow base hash, and the patch's proposal-only
status. The workflow test reads this fixture and still applies it only inside an isolated temporary
directory. The actual `.github/workflows/drift.yml` remains unchanged pending source authority.

After the resource-fixture correction, the affected verifier suite passed 37/37. After the final
workflow-fixture correction, only the affected workflow suite was rerun, as directed. Its result
was 14 passed, 0 failed. No source proposal or production output changed during either correction.
