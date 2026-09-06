# Store 6 generated reference design proposal

Status: ready for a source-owner decision. The attached
`reference.patch` is a reviewable proposal against Store6
`5a8c956bc1dbd6ad838ea9da3b34c7d76c703a71`; it has not been approved,
committed, merged, or published. Isolated generation has passed; see the configured generation evidence below.

Current patch/source parity and exact patch/resource hashes are recorded in
`evidence/design-revision/resume-source-proposal-parity.md`. The refresh changes no proposed source payload.

## Decision requested

Approve the attached Store6 source patch for an upstream branch and pull
request. A human source owner must review and merge that pull request before
Store Docs can re-pin Store6 and regenerate either public reference tree.

The proposal makes Store identity and a guide-return control persistent across
every generated `store6-core` and `store6-mutations` page. It also applies the
approved Tidal light palette and a contrast-adjusted dark reference mode through
Dokka's supported HTML configuration. It does not edit generated HTML, CSS,
JavaScript, navigation data, or symbol routes.

## Authority and reproducibility boundary

| Item | Locked value |
| --- | --- |
| Proposal base | `5a8c956bc1dbd6ad838ea9da3b34c7d76c703a71` |
| Current public reference provenance | `c67a94ed30460a35161c2cbc3e725f127caf055e` |
| Docs baseline revision | `a1df36996934d8286240b02a9ec5b311d9207bf6` |
| Dokka Gradle plugin | `2.2.0` |
| Kotlin | `2.3.20` |
| Gradle wrapper | `8.11.1`, SHA-256 `f397b287023acdba1e9f6fc5ea72d22dd63669d59ed4a289a29b1a76eee151c6` |
| Store6 JVM toolchain | Java 11 |
| Generation runner required by the current workflow | Zulu JDK 17 |

The proposal base and the current public reference provenance are intentionally
different. Source approval and merge establish a new revision; Store Docs must
then re-pin to that exact merged revision before generation. A successful local
generation against the proposal checkout would not authorize a source re-pin.

## Proposed source patch

The source change is limited to these files:

- `tooling/plugins/src/main/kotlin/org/mobilenativefoundation/store/tooling/plugins/KotlinMultiplatformConventionPlugin.kt`
- `tooling/plugins/src/main/resources/dokka/store-reference.css`
- `tooling/plugins/src/main/resources/dokka/logo-icon.svg`
- `tooling/plugins/src/main/resources/dokka/templates/includes/header.ftl`

`configureDokka()` is shared by the Store6 convention plugin and legacy
conventions. The new configuration is therefore gated by the exact project
names `store6-core` and `store6-mutations`. Other modules retain their current
Dokka output.

Dokka 2.2.0 registers the HTML parameter block as
`DokkaHtmlPluginParameters` under `DokkaExtension.pluginsConfiguration`. Its
installed API exposes `customStyleSheets`, `customAssets`, `footerMessage`,
`homepageLink`, and the `templatesDir` directory property. The stock resource
installer copies custom styles to
`styles/<basename>`, copies custom assets to `images/<basename>`, and replaces
a stock resource when the generated path has the same basename. The proposal
uses that supported mechanism to:

- append `styles/store-reference.css` to every generated Store6 page;
- replace only the stock `images/logo-icon.svg` with the Store mark;
- set the persistent footer text to `Store 6 API reference`; and
- enable Dokka's stock homepage control with the literal same-origin target
  `/docs/store6/overview`, an explicit `Store 6 guide` accessible name, and
  visible `Store guide` text.

The supported template directory contains the stock Dokka 2.2.0 header copied
verbatim except for the homepage anchor's label and text. It still emits
`homepageLink` verbatim, so the root-relative target works from both
entrypoints and arbitrarily deep symbol pages. No redirect, base element, event
handler, or custom script is needed.

## Visual contract

Light reference mode uses the approved Tidal tokens:

- paper `#F7F6F0`;
- primary text and navigation `#172C2A`;
- secondary text `#596A65`;
- accent `#13766D`, with hover `#136D65`; and
- soft surface `#E3F0E9`.

Dark reference mode keeps Dokka's existing user-selectable theme behavior while
moving its surfaces and syntax colors to the contrast-checked reference set:

- code/page surface `#172624`;
- primary text `#DDE9E5`;
- secondary and comment text `#A8B7B0`;
- keyword `#CBB9F5`;
- string `#D8C39A`; and
- function/focus accent `#9BD6D0`.

The recorded computed contrast ratios are 13.56:1 for primary text on paper,
5.28:1 for secondary text on paper, 5.05:1 for accent on paper, 12.59:1 for dark
primary text, 7.52:1 for dark secondary text, and at least 8.81:1 for the three
named dark syntax colors. Rendered contrast remains a post-generation browser
check.

The stylesheet changes color variables and identifiable stock component states,
including space for the visible Store guide label.
It does not hide, replace, or reposition search, platform filters, theme
controls, navigation, breadcrumbs, or the table of contents. Focus-visible
styles remain present in both themes, and the stock search popup receives the
same dark reference palette.

## Protected technical behavior

The proposal leaves all technical and linking inputs unchanged:

- `store6-core/dokka/Module.md` remains byte-identical at SHA-256
  `dfe5776645dc4b05ebbc12dc160e170938ce61967b114c45e7ba31ccbfbe515d`;
- `store6-mutations/dokka/Module.md` remains byte-identical at SHA-256
  `492a269a66571c446683f691d42bb00286da14a6352de56432fa38de3d8d65ee`;
- both module entrypoints continue to contain the existing Docs home,
  Store 6 overview, and sibling reference URLs;
- module names and Dokka output directories do not change, preserving existing
  navigation and symbol URL shapes;
- source-set configuration and the `store6-mutations` external link to
  `store6-core` do not change; and
- stock Dokka scripts remain byte-for-byte generator output. The patch adds no
  executable asset and does not weaken their integrity checks.

## Generation and proof plan after upstream merge

The source owner should first create a branch from the proposal base, apply
`reference.patch`, review it, and merge it through the normal upstream pull
request process. After that human merge, the Store Docs owner can lock the
merged revision and run the existing generator:

```sh
git -C /path/to/Store6 rev-parse HEAD
./gradlew :store6-core:dokkaHtml :store6-mutations:dokkaHtml --stacktrace
```

Both complete module trees must exist before replacement:

```sh
test -s store6-core/build/dokka/html/index.html
test -s store6-mutations/build/dokka/html/index.html
rsync -a --delete store6-core/build/dokka/html/ /path/to/store-docs/public/reference/store6-core/
rsync -a --delete store6-mutations/build/dokka/html/ /path/to/store-docs/public/reference/store6-mutations/
```

The docs-side proof sequence should then run under Node 22:

```sh
/opt/homebrew/opt/node@22/bin/node scripts/test-t6b-reference.mjs
/opt/homebrew/opt/node@22/bin/node --test \
  scripts/test-t6b-reference.test.mjs \
  scripts/t8-verification.test.mjs \
  scripts/dokka-reference-workflow.test.mjs
```

The generated-tree inspection must establish:

1. every HTML page references `styles/store-reference.css` and the generated
   trees contain the replacement `images/logo-icon.svg`;
2. `.library-name--link` remains present with each module name and its local
   module-root target;
3. `#homepage-link` exists on entrypoints and deep symbol pages with
   `href="/docs/store6/overview"`, accessible name `Store 6 guide`, and
   visible text `Store guide`;
4. `#theme-toggle-button`, `#searchBar`, `#filter-section`, platform
   selectors, breadcrumbs, side navigation, and local symbol links remain;
5. all protected entrypoint body links remain in both modules;
6. every approved stock Dokka script hash still matches the verifier; and
7. recursive source/output comparisons show that both published trees came
   directly from the locked generator revision.

Browser review must cover both module entrypoints and at least one deep symbol
page per module at desktop and mobile widths. In each sample, toggle light/dark
mode, reload to confirm the stock preference persists, open search and navigate
to a result, change a platform filter where alternatives exist, traverse the
header controls by keyboard, and activate `#homepage-link`. The guide action
must resolve to the current origin plus `/docs/store6/overview`; visible focus
must remain clear against light paper, dark navigation, and the search popup.

## Current verification and remaining gates

This proposal was prepared from a clean isolated checkout at the exact base
revision. Static inspection verified the installed Dokka 2.2.0 Gradle API, the
stock header template, custom resource installation behavior, the shared Store6
convention path, the current generation workflow, the two protected module
hashes, and the absence of a source diff before the proposal. The proposed SVG
parses as XML and the source diff passes `git diff --check`.

Root ran the configured Dokka generation from the isolated proposal checkout.
It succeeded in 44 seconds with 72 actionable tasks (66 executed, 2 from cache,
and 4 up-to-date); the authority log is
`evidence/design-revision/commands/reference-generation-configured.log`. The
source base and patch remain uncommitted, so this result is local generator
evidence rather than landing or source re-pin evidence.

No application build, server, or browser was run in this proposal lane. The
required gates remain: upstream branch and pull request, human Store6 review
and merge, exact merged-revision re-pin, generation of both complete trees from
that merged revision, docs-side automated verification, browser verification,
and separate human approval for docs publication.
