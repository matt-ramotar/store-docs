# Store Docs diagrams

These are the authored layouts for every public documentation diagram. They use
Diagram Design 2.6.17's editorial SVG conventions with Store Docs' theme and
typography. The generated, self-contained HTML files live in `public/diagrams`;
`StoreDiagram` embeds their SVG directly in the initial page HTML. No Mermaid
runtime, remote image, or JavaScript is needed to read them.

Regenerate after editing a layout or the shared CSS:

```sh
python3 scripts/diagrams/generate.py
pnpm build
node --test scripts/store-designed-diagrams.test.mjs
```

Run the installed skill's `scripts/self_check.py public/diagrams/*.html` as well.
Keep the generated files committed with their sources so a normal site build
does not depend on Python or the skill installation.

## Brand mapping

The user requested Store Docs colors; `app/globals.css` is the color authority.
The site's existing light shell supplies the inline figures' theme. Standalone
files follow `prefers-color-scheme` and print with a light background.

| Diagram role | Store token |
| --- | --- |
| paper | `--background` |
| paper-2 / state | `--surface-secondary` |
| ink | `--foreground` |
| muted / soft | 76% foreground mixed with background, for small-label contrast |
| rule / rule-solid | `--border` |
| accent | `--accent` (Tidal teal) |
| accent-tint | 8% accent mixed with background |
| link | `--link` |
| node names and titles | the site's `--font-sans`, weight 600 |
| technical labels and tags | the site's `--font-mono` |

The public site uses system sans and monospace stacks, verified in its installed
Tailwind/HeroUI theme. This deliberately keeps the site's typography instead of
loading the skill's default Google Fonts. The standalone dark skin uses Store's
`#141A19` code background, `#202424` header, `#F9FDFC` foreground, and `#9AA2A1`
muted text. Its teal keeps the brand hue/chroma with lightness raised to 76% for
contrast. `standalone.css` records those defaults; `styles.css` only consumes
the surrounding theme. No global plugin profile or site theme switch is changed.

## Coverage and fidelity

Audience: engineers. Detail: faithful. Format: self-contained HTML, with inline
SVG embedded in MDX. Standard figures use `doc-inline` (960×600); longer figures
use a fitted vertical canvas at the same width. Names are 16px and annotations
12px to stay readable in the documentation column, on a 4px grid. Narrow screens
scroll the figure without overflowing the page; the full-size link opens the
same artifact.

| Documentation source | Figure / visual type | Fidelity |
| --- | --- | --- |
| `store6/migration/from-store5.mdx` | `store5-migration` / architecture | 3 nodes, 2 edges, app boundary retained |
| `store6/mutations/drain-and-restart.mdx` | `namespace-ownership` / architecture | 4 nodes, 2 edges, both namespaces retained; A blocks while B progresses |
| `store6/mutations/aliases.mdx` | `alias-activation` / sequence, 960×880 | 4 actors, 8 messages; pending receipt and active retirement remain separate |
| `store6/mutations/server.mdx` | `server-outcomes`, `server-recovery` / sequence, 960×728 and 960×1040 | All 3 actors, 14 messages, both notes and all guards retained; nested alternatives split at backend acceptance |
| `store6/guides/persistence.mdx` | `persistence-read-path` / architecture | All 6 nodes and 6 edges retained, including the fetch-policy guard and write notification |
| `store6/guides/extending.mdx` | `extension-lifecycle`, `extension-lifecycle-rollback` / process | All 8 success steps and 4 rollback steps retained in separate figures |
| `best-practices/store5/single-or-multiple-stores.mdx` | `single-or-multiple-stores`, `independent-stores` / flowchart, 960×1024 and 960×1312 | All 7 questions, 14 decision edges and both outcomes retained; decorative Start node/edge replaced by the first figure's heading; coupling NO continues in part 2 |

The Store 5 original is the decision SVG linked by the page before this change.
Its green/red-only branches are now labeled YES/NO; the adjacent instructions
use those labels. Source wording is wrapped or shortened without changing the
questions. The split introduces a labeled continuation, not a new decision.

The initial inventory covered all public MDX, components, image references, and
generated API-reference HTML. Logos, conference thumbnails, decorative hero art,
and code examples are not diagrams. `/design-review/components` retains the
existing Mermaid compatibility fixtures (including deliberately invalid syntax
and custom-color cases); they test the public adapter rather than teach Store.

## Reviewing changes

Check each source's relationships and labels first, then inspect the standalone
and embedded figure. The skill self-check validates file safety and accessible
SVG structure; it does not prove routing or legibility. Inspect connector bends,
label masks, attachment points, and text bounds in a browser. For a repeated
figure on one page, add a unique instance namespace before embedding it.

## Verification (2026-09-07)

- Production build: 84 pages generated; TypeScript passed.
- Full contract suite: 337 passed, 1 existing live-network check skipped.
- Diagram Design self-check: all 10 HTML artifacts passed.
- Browser: all 10 dark standalone figures had text within their canvas and
  label/node bounds; all 7 light documentation pages stayed within a 390px
  viewport, with the figures scrolling internally. Focused keyboard scrolling
  was verified on the alias sequence. Site font stacks and theme colors were
  checked with computed styles.
- Static routing review: no mask/node overlap or shared connector segments.
  The Store 5 migration regression also proves that regeneration retains the
  declared diagram replacement while preserving the historical source snapshot.
