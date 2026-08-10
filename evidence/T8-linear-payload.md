# T8 Linear Payload

Date: 2026-08-10

Status: applied to Linear on 2026-08-10. All nine comments and all seven
authorized state actions completed successfully.

This file is the payload-first authority for the intended STORE-21 through
STORE-29 updates. Comment bodies are exact within each `text` fence.

## State identifiers

| State | Identifier |
| --- | --- |
| Done | `d2bfdb60-3ab0-4292-a2b6-304f4324f2d7` |
| In Progress | `f039e5a6-5239-453c-a65c-ed3ca651adfd` |
| Backlog | `70946bed-a854-4075-81a5-99570f6c19dc` |

## STORE-21

State action: comment only. Do not change state.

Comment body:

```text
The local Store documentation run completed through the static hero stage in /Users/matt/src/matt-ramotar/store-docs. T8 began from committed HEAD 153ed0fc5cc1ba82ca28837e35451540b25994f0.

Evidence: evidence/T8.md, evidence/T8-crawl.md, and evidence/T8-linear-payload.md. The pinned Node 22 production build passed Next.js 16.3.0 compilation and TypeScript and generated 53/53 static pages. The independent route census derived 37 inventory pages, zero within-inventory exclusions, 15 extras, and 52 unique expected page routes. All 52 local page routes returned 200. /api/search and /llms.txt separately returned 200. The live sitemap matched all 37 inventory URLs in exact order, and all 37 live pages returned 200 with exact titles, exact ordered headings, and passing fidelity assessments. The Browser self-check recorded zero warnings and zero errors.

Figma comparison remains COMP-UNVERIFIED where recorded. No deployment or cutover was performed.

Blockers:
- evidence/BLOCKED-T1-figma.md
- evidence/BLOCKED-T6a.md

SKIPPED: none
```

## STORE-22

State action after posting the comment: set state to Done
`d2bfdb60-3ab0-4292-a2b6-304f4324f2d7`.

Comment body:

```text
The scaffold and package-mode gates are complete. evidence/T0-package-mode.md records PRO, and evidence/T0.md records the inventory, resolved package set, static /docs route, and local visual gate. The final pinned Node 22 build compiled, completed TypeScript, and generated 53/53 static pages. The T8 local crawl returned 200 for every one of the 52 expected page routes. Evidence: evidence/T0.md and evidence/T8-crawl.md.
```

## STORE-23

State action after posting the comment: set state to Done
`d2bfdb60-3ab0-4292-a2b6-304f4324f2d7`.

Comment body:

```text
The token architecture, token demonstration route, contrast gates, and local Browser self-check are complete. Figma component data was unavailable, so the affected origin soft and on-dark values remain PROVISIONAL and the visual classification remains COMP-UNVERIFIED. Evidence: evidence/T1.md, evidence/BLOCKED-T1-figma.md, and evidence/T8-crawl.md.
```

## STORE-24

State action after posting the comment: set state to Done
`d2bfdb60-3ab0-4292-a2b6-304f4324f2d7`.

Comment body:

```text
The Paper and Slate documentation shell, recursive navigation, responsive mobile dialog, right rail, and accessible code surface are complete. The T8 local crawl passed all expected routes, and the overview Browser check retained the six primary navigation entries with no horizontal overflow. The Figma comparison remains COMP-UNVERIFIED. Evidence: evidence/T2.md, evidence/BLOCKED-T1-figma.md, and evidence/T8-crawl.md.
```

## STORE-25

State action after posting the comment: set state to Done
`d2bfdb60-3ab0-4292-a2b6-304f4324f2d7`.

Comment body:

```text
The Store 6 overview is complete with the Store 6, Start here, Read resolution, and Modules and targets sections and the source-warranted engine and compatibility content. The T8 overview Browser check rendered the expected title and three content h2 headings with no horizontal overflow. The Figma overview comparison remains COMP-UNVERIFIED. Evidence: evidence/T3.md, evidence/BLOCKED-T1-figma.md, and evidence/T8-crawl.md.
```

## STORE-26

State action after posting the comment: set state to Done
`d2bfdb60-3ab0-4292-a2b6-304f4324f2d7`.

Comment body:

```text
Content migration is Done with deviations. The 37-row inventory manifest contains 36 ported-clean rows and one noted loss: the source-authored /docs/use-cases/store5/multiplatform-integration destination returned 404, is outside the inventory, and is rendered as an unavailable non-link. app/globals.css retains the generic /* STORE TOKENS START */ and /* STORE TOKENS END */ fence under the recorded marker-policy deviation; token scoping and runtime behavior are unchanged. https://store.mobilenativefoundation.org/api/openapi.json is omitted by design, remains outside the 37-page inventory, and has no generated target.

The T8 crawl passed all 52 local page routes and independently passed all 37 live pages for HTTP status, title, ordered headings, and fidelity. Evidence: evidence/T4.md, evidence/T4-manifest.md, and evidence/T8-crawl.md.
```

## STORE-27

State action after posting the comment: set state to Done
`d2bfdb60-3ab0-4292-a2b6-304f4324f2d7`.

Comment body:

```text
Local search is Done with a dependency deviation. The installed @orama/core@1.2.19 surface is remote-only for the required operations, so the implementation uses Fumadocs 16.12.1's supported local Orama search API while retaining the required installed package. No cloud collection, credential, or outward search request is used. The T8 palette check retained the fetcher query, 46-result status, 46 menu items, and the 31 Store5 / 15 Store6 split. The unavailable Figma comparison remains COMP-UNVERIFIED. Evidence: evidence/T5.md, evidence/BLOCKED-T1-figma.md, and evidence/T8-crawl.md.
```

## STORE-28

State action: do not change state. Keep Backlog
`70946bed-a854-4075-81a5-99570f6c19dc`.

Comment body:

```text
No state change. The acceptance criterion for versioned generated Dokka documentation remains unmet. evidence/BLOCKED-T6a.md records the Android SDK location blocker before Dokka generation. evidence/T6b.md records the two honest Core and Mutations placeholder pages and their exact replacement tasks. T8 confirmed both public reference destinations return 200 and visually checked the Core placeholder, but a working placeholder does not establish generated or versioned API documentation. Evidence: evidence/BLOCKED-T6a.md, evidence/T6b.md, and evidence/T8-crawl.md.
```

## STORE-29

State action after posting the comment: set state to In Progress
`f039e5a6-5239-453c-a65c-ed3ca651adfd`.

Comment body:

```text
The static hero stage shipped in the repository and passed its source, build, route, and local Browser gates. Imagery and scroll choreography remain deferred, so the full acceptance criteria are not met and the issue remains In Progress. The visual comparison remains COMP-UNVERIFIED because the Figma artifact was unavailable. No deployment or cutover occurred. Evidence: evidence/T7.md, evidence/BLOCKED-T1-figma.md, and evidence/T8-crawl.md.
```

## Application boundary

Apply each comment body without alteration, then perform only its stated state
action. STORE-21 receives a comment only. STORE-28 remains in Backlog. This
payload does not authorize deployment or cutover.

## Application result

The payload above was applied without alteration on 2026-08-10. The nine
comment creates and seven state updates succeeded without a retry. A final
read returned the intended state for every issue.

| Issue | Comment identifier | Final state | State result |
| --- | --- | --- | --- |
| STORE-21 | `1e2d5b19-dc74-4f1a-91b4-b0702ae85379` | Backlog | Unchanged |
| STORE-22 | `85712dd4-c390-4869-8baa-aa128099bcca` | Done | Updated |
| STORE-23 | `5d9d2a2d-9e0a-47d9-a702-366d012af1d9` | Done | Updated |
| STORE-24 | `9e1fa007-1c3e-4da6-9a2c-8ae72a6abbd4` | Done | Updated |
| STORE-25 | `a43c5b19-bdda-4612-acc5-3551813eb3ae` | Done | Updated |
| STORE-26 | `27fd698d-7bcf-4e23-a2c8-e423237638df` | Done | Updated |
| STORE-27 | `8e6de735-44be-4d6b-ab4c-5e7ae8c143a7` | Done | Updated |
| STORE-28 | `7800d416-0189-4d4b-a5b5-6eddeb59a714` | Backlog | Unchanged |
| STORE-29 | `0dc042c7-6147-49de-a2ba-7b2ff5f2c792` | In Progress | Updated |

STORE-30 was not read or changed. No description, label, assignee, project,
release, or deployment field was changed.
