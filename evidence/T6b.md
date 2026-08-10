# T6b Reference Integration Evidence

Date: 2026-08-10

Status: completed with the prescribed placeholder deviation. Generated Dokka
API documentation remains unavailable.

## Preconditions

The site checkout was clean on local `main` at
`4d7278f02b3e4aa6efceac82d0df2375f5350e74`, apart from the two protected,
untracked `.DS_Store` files. Their SHA-256 values remained:

- `.DS_Store`: `0bdb6709c6090e849e22a13bc549c67cbbb15c5ec422d111b3529d48615be486`
- `components/.DS_Store`: `5b115091095d537e0cbc78caca018c01e950046e71f9627994993f580406c6b1`

`evidence/T0-package-mode.md` was read first and remains `PRO`. T6b does not
add or change a HeroUI surface because the fallback pages are standalone
public HTML artifacts.

## T6a blocker consumed

`evidence/BLOCKED-T6a.md` is the authority for the failed generation branch.
The documentation-task inventory confirmed `:store6-core:dokkaHtml`. The Core
generation command then reached Gradle and exited `1` because it could not
determine a valid Android SDK location. The Mutations generation command was
not run. T6b did not rerun Gradle, inspect the SDK, set an environment override,
or attempt another workaround.

The fallback therefore does not contain generated API documentation and does
not imply that either Dokka task succeeds.

## Nav-direct fallback

The existing `Reference` item in `lib/nav.ts` already targets
`/reference/store6-core/index.html`. It was not changed. The fallback adds only
these public destinations:

- `public/reference/store6-core/index.html`
- `public/reference/store6-mutations/index.html`

Both are standalone semantic HTML pages with a skip link, labeled navigation,
one main landmark, one page heading, visible keyboard focus, and no scripts.
Each page explicitly identifies itself as a placeholder rather than generated
API documentation, reports the observed Android SDK location blocker, links to
the Store 6 overview and docs home, and links to both module destinations. The
current module link carries `aria-current="page"`.

Each page records both future replacement contracts:

| Module | Gradle task | Generated output | Public destination |
| --- | --- | --- | --- |
| Core | `:store6-core:dokkaHtml` | `store6-core/build/dokka/html/` | `public/reference/store6-core/` |
| Mutations | `:store6-mutations:dokkaHtml` | `store6-mutations/build/dokka/html/` | `public/reference/store6-mutations/` |

There is no `public/reference/index.html`, `app/reference`, or
`app/reference-note` surface. No bare `/reference` route or reference redirect
was added. The installed Next.js 16.3.0 public-folder contract states that a
file under `public` is addressed from the base URL. The source files therefore
map to the two exact `.html` URLs above. The production build manifest contains
no framework route or redirect with `/reference`; its one redirect is Next.js's
internal trailing-slash normalization. No HTTP server was started in T6b, so
runtime `200` responses remain a T8 crawl gate.

## Red-green contract test

The repository includes `scripts/test-t6b-reference.mjs`. Before the fallback
files existed, the pinned Node 22 run exited `1` with the intended assertion:

```text
AssertionError [ERR_ASSERTION]: public/reference must exist

false !== true
```

After implementation, this command exited `0`:

```sh
/opt/homebrew/opt/node@22/bin/node scripts/test-t6b-reference.mjs
```

```text
{"referenceFiles":2,"pagesChecked":2}
```

The test asserts exact file and directory ownership, regular-file and
no-symlink boundaries, standalone document metadata, landmarks and headings,
the placeholder disclosure, tasks and paths, both module cross-links, docs
links, the existing nav destination, allowed URL forms, no scripts or inline
event handlers, no tracker identifiers in durable HTML, no unresolved-link
attribute, and absence of an index route, app route, or configured redirect.

## Unresolved-link check

The plan command exited `0` and printed `0`:

```sh
grep -rl "data-unresolved-link" public/reference/ | wc -l || true
```

```text
       0
```

This absence proves nothing about unresolved links in Dokka output because
these files are hand-authored placeholders, not generated Dokka pages. Link
safety and the exact local destinations are covered by the contract test
instead.

## Build and artifact gates

The plan-pinned build command used Node `22.22.0` and pnpm `10.30.3`:

```sh
/opt/homebrew/opt/node@22/bin/node /opt/homebrew/opt/node@22/lib/node_modules/corepack/dist/corepack.js pnpm build
```

It exited `0`. Next.js 16.3.0 compiled successfully, completed TypeScript, and
generated `52/52` static pages. It repeated the existing warning that
`/Users/matt/package-lock.json` is outside this Git repository and was ignored.

An independent artifact assertion checked the installed Next public-folder
documentation and `.next/routes-manifest.json`; it exited `0` with:

```text
{"publicContract":"source path maps from base URL","referenceFrameworkRoutes":0,"redirects":1}
```

The three owned implementation files have these SHA-256 values:

| File | SHA-256 |
| --- | --- |
| `public/reference/store6-core/index.html` | `a8402f382f2a71cddf040f370e84b36dffa503f683f613f96fd051a645a14752` |
| `public/reference/store6-mutations/index.html` | `363119acdac3991a260e7fb52465af8e3adccf2775ba95689de6a1f87f325ff1` |
| `scripts/test-t6b-reference.mjs` | `8cd0a8111b650eabcca7b1e3e6e4f9112c2e04356d8441da1601de9b562e5e69` |

`git diff --check` exited `0`. T6b did not start a server, open a browser,
capture a screenshot, mutate Store6, use Figma, write to Linear, push, deploy,
or start T7 or T8. The reference screenshot remains an orchestrator-owned T8
gate.

## Documentation review passes

1. **Accuracy:** the failure classification, exact Gradle task names, source
   paths, public destinations, nav href, runtime versions, command results, and
   route boundary were checked against the blocker record, repository source,
   installed Next documentation, generated manifest, and fresh command output.
2. **Warrant:** the pages describe only the observed build blocker and future
   replacement procedure. They do not claim generated documentation, a working
   Dokka task, resolved Dokka links, runtime serving, browser verification, or
   visual fidelity.
3. **Reader utility:** a reader can identify the unavailable surface, return to
   current Store 6 guides, move between module placeholders, and see exactly
   which tasks and directories replace the placeholders after the blocker is
   resolved.
