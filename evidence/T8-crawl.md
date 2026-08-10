# T8 Crawl and Visual Verification

Date: 2026-08-10

Status: local build, route crawl, independent live comparison, and Browser
self-check passed. The inherited Figma comparison remains `COMP-UNVERIFIED`.

## Verification boundary

T8 began from committed site HEAD
`153ed0fc5cc1ba82ca28837e35451540b25994f0`. The package mode remains `PRO`,
and the verification runtime was pinned to Node 22. No deployment or cutover
was performed.

The production build used:

```sh
/opt/homebrew/opt/node@22/bin/node /opt/homebrew/opt/node@22/lib/node_modules/corepack/dist/corepack.js pnpm build
```

It exited `0`. Next.js 16.3.0 compiled, completed TypeScript, and generated
`53/53` static pages. The build repeated the known warning that
`/Users/matt/package-lock.json` is outside this Git repository and was ignored.

The focused harness command was:

```sh
/opt/homebrew/opt/node@22/bin/node --test scripts/t8-verification.test.mjs
```

It exited `0` with `30` passing tests and zero failures. The suite covers route
derivation, lock and ledger parity, source-tree census, live and served-page
selectors, title-only behavior, hidden panels, ordered headings, the 60%
character threshold, local HTTP failures, the shared serial request queue,
5xx-only retries, sitemap parity, and deterministic failure output.

## Derived route census

The harness derives its route set from `evidence/live-url-inventory.txt`,
`evidence/T4-manifest.md`, `evidence/T4-store6-source-lock.json`,
`evidence/T4-owned-targets.json`, and `evidence/T8-extras.txt`. It does not use a
fixed expected route total.

| Partition | Count | Boundary |
| --- | ---: | --- |
| Live inventory | 37 | 35 `/docs/**` paths and the two exact outside routes |
| Exclusions within inventory | 0 | No inventory route was subtracted |
| Page extras | 15 | Root, docs index, Store6 pages, token demo, and two reference HTML files |
| Unique expected pages | 52 | Inventory paths plus extras |
| Separate non-page surfaces | 2 | `/api/search` and `/llms.txt` |

`https://store.mobilenativefoundation.org/api/openapi.json` remains a separate
`excluded by design` manifest row. It is not one of the 37 inventory URLs, is
not subtracted from the inventory denominator, and has no local route.

The 15 page extras are recorded exactly in `evidence/T8-extras.txt`:

```text
/
/docs
/docs/store6/compose
/docs/store6/contributing
/docs/store6/important-defaults
/docs/store6/invalidate-vs-clear
/docs/store6/key-design
/docs/store6/overview
/docs/store6/quickstart
/docs/store6/roadmap
/docs/store6/sqldelight
/docs/store6/stability
/reference/store6-core/index.html
/reference/store6-mutations/index.html
/tokens-demo
```

The nine synchronized Store6 pages are derived from exact equality between the
Store6 source lock and its owned-target ledger. The hand-authored Store6
overview remains outside that lock. Independent source scans found exactly the
expected content documentation, application page entrypoints, and public
reference HTML entrypoints.

## Local HTTP crawl

With the production server on `http://127.0.0.1:3222`, this command ran:

```sh
/opt/homebrew/opt/node@22/bin/node scripts/t8-verification.mjs --local
```

All `52/52` expected page routes returned HTTP `200`. The harness then checked
the two non-page surfaces separately:

| Path | Classification | Status |
| --- | --- | ---: |
| `/api/search` | Static search API | 200 |
| `/llms.txt` | Public text file | 200 |

Those resources are required HTTP checks but are not included in the 52-page
denominator.

## Independent live comparison

This command first repeated the complete local crawl, then independently
fetched the live sitemap and inventory pages:

```sh
/opt/homebrew/opt/node@22/bin/node scripts/t8-verification.mjs --live
```

The live sitemap returned the same 37 URLs as
`evidence/live-url-inventory.txt`, in exact order. All `37/37` live pages
returned HTTP `200`; no request used a retry.

For each page, the live extractor required exactly one
`main#content-container`, `#page-title`, and `#content`. The served extractor
required exactly one `#page-title` and `#content`. Both sides removed zero-width
characters, collapsed whitespace, counted the complete `#content` text
including hidden code panels, and compared ordered normalized heading arrays.

| Fidelity result | Value |
| --- | ---: |
| Exact title matches | 37/37 |
| Exact ordered-heading matches | 37/37 |
| Pages with nonempty live content | 18 |
| Title-only pages | 19 |
| Passing fidelity assessments | 37/37 |
| Total served normalized characters | 96,102 |
| Total live normalized characters | 93,718 |

The minimum nonempty-page ratio was
`1.0002154475923732` on `/docs/quickstart`, from `18,570` served characters and
`18,566` live characters. Each title-only page had an empty live and served
body, so its ratio was N/A rather than a division by zero.

The live request helper uses one concurrency-safe queue, enforces at least
`1000ms` between request starts, and permits no more than two retries only for
HTTP 5xx responses. The run output records zero retries. It does not record
request-start timestamps, so this evidence does not represent the spacing as
an independently measured duration.

## Browser self-check

The in-app Browser completed the five local checks below. Browser diagnostics
contained zero warnings and zero errors. These are local functional and visual
self-checks. They do not replace the unavailable Figma component comparison,
so the affected T1, T2, T3, T5, and T7 surfaces remain `COMP-UNVERIFIED`.

### Landing page

The full-page landing capture covers the static hero at the native 1280px
width. Imagery and scroll choreography remain outside the shipped static stage.

### Store6 overview

`/docs/store6/overview` rendered the `Store 6` page title and the ordered
`Start here`, `Read resolution`, and `Modules and targets` level-two headings.
The top navigation contained all six primary entries, and the document had no
horizontal overflow.

### Store5 Fetcher

`/docs/concepts/store5/fetcher` rendered the `Fetcher` page title, nine `pre`
elements, and 31 links. The document had no horizontal overflow.

### Search palette

The open palette retained the query `fetcher`, exposed a `46 results.` status,
and rendered 46 menu items. Version labels split into 31 Store5 results and 15
Store6 results.

### Core reference

`/reference/store6-core/index.html` rendered one main landmark and the honest
heading `Store 6 Core API reference unavailable`. It exposed both exact Dokka
replacement task contracts, six anchors, and no horizontal overflow. This
successful placeholder route does not establish generated or versioned Dokka
API documentation.

## Screenshot artifacts

All five files are true, non-interlaced, 8-bit RGB PNG images.

| Artifact | Dimensions | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `evidence/screens/T8-landing.png` | `1280x852` | 381,125 | `95e694784fdf60438e2684bdf4ae31a42016970dbe9e37a9198608d2788997f2` |
| `evidence/screens/T8-overview.png` | `1280x720` | 283,184 | `2bcf505f8ad663b0e6fb4b770e25b91a46d58d0bdcb59b468b68c45a8fd1f1c3` |
| `evidence/screens/T8-store5-fetcher.png` | `1280x720` | 368,130 | `d1af499c5c90dcafa2e42a0e399bb7ba8fdfe6c382f57c8cb108f78e36946e61` |
| `evidence/screens/T8-search-palette.png` | `1280x720` | 271,774 | `bc87360f80aeb7d35fa67e31d5b6557d3cb65a9711d9d0c60531942f3b5ea4f1` |
| `evidence/screens/T8-reference.png` | `1280x1446` | 443,462 | `1c47672b55f4ce01bdcb501c48ebdfcc0c0f9c062068bf6e0dbf137482280dfd` |

## Shutdown and remaining boundary

The production server was stopped after verification. A final listener check
found no process on port `3222`.

The remaining blockers are `evidence/BLOCKED-T1-figma.md` and
`evidence/BLOCKED-T6a.md`. No task was skipped. No deployment, cutover, Linear
mutation, evidence-record copy, or memory update is established by this record.
