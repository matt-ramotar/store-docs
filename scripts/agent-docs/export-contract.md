# Store6 Markdown export contract

Contract version: `store6-agent-docs-v1`. The public origin is
`https://store.mobilenativefoundation.org`. `config.json` lists the initial 40
public Store6 MDX sources explicitly and in sorted order. Store5 pages, generated
Dokka HTML, and private repository files are outside this corpus.

The export runs before the Next.js build. Parsing preserves MDX/GFM structure;
later component lowering supplies the semantic content that plain Markdown
parsing cannot infer. Public file generation and HTTP serving are separate
integration steps.

## Parsing and literal values

`parsePage(input, path)` normalizes CRLF to LF, requires leading YAML
frontmatter, rejects duplicate YAML keys, and requires a nonempty string title.
A supplied description must be a string. It returns the metadata and an MDX/GFM
syntax tree without importing or executing the document.

Fenced code remains a `code` node with its language and exact parsed value.
Kotlin generics such as `Store<UserKey, User>` and interpolation inside a fence
are code text, not JSX or executable MDX expressions. Later serialization must
preserve code values and languages across a parse/serialize/parse round trip;
fence delimiter formatting need not remain identical.

`literalString` accepts an ESTree string literal or a single template literal
with no interpolated expressions. Template literals use the cooked value that
MDX passes to components. Source slicing is not equivalent because MDX container
indentation and escape processing affect that value. No expression is evaluated.

`literalAttributes` accepts only explicitly allowed attribute names with static
string values. Spreads, duplicate or unknown attributes, boolean attributes, and
dynamic expressions fail. `isCommentExpression` distinguishes comment-only
expressions, including `{/* snippet: ... */}`, from visible literal text and
executable expressions. Snippet comments remain available in the parsed tree for
existing source verification; later Markdown lowering can omit their non-visible
content.

## Initial component census

The AST census on 2026-09-08 parsed all 40 configured pages and found these 11 MDX
tags. Their content requirements are the boundary for later lowering:

| Tag | Count | Content that must survive lowering |
| --- | ---: | --- |
| `Callout` | 64 | Severity, title when present, and all body content |
| `CodeSlab` | 2 | Static cooked `code` value, language, and title |
| `ReadResolutionTable` | 1 | All origin rows, the complete default-policy notice, explanatory paragraphs, and links |
| `StoreDiagram` | 8 | Selected diagram description, labels, and other teaching text |
| `div` | 2 | All nested content; layout attributes do not supply teaching content |
| `Link` | 2 | Visible label and destination |
| `Link.Icon` | 2 | Decorative icon; its containing link retains its label and destination |
| `p` | 2 | All nested paragraph content |
| `StartHereList` | 1 | All six entries, descriptions, qualifiers, labels, and links |
| `SupportMatrix` | 1 | All eight module rows, both target-group definitions, explanatory text, and links |
| `a` | 5 | Visible label and destination |

There are no tabs or MDX import/export nodes in the initial corpus. Both current
`CodeSlab` instances, in `overview.mdx` and `concepts/freshness.mdx`, use static
Kotlin template literals. The census also found 93 code fences and 38 comment
expressions. Count tags from MDX JSX nodes rather than scanning source text, so
fenced Kotlin generics do not create false component entries.

Unknown components, including future `Tabs`/`Tab` components, and MDX imports or
exports must fail during lowering. Supporting tabs later requires preserving and
testing every panel. F1 only parses these node types; it does not implement or
claim the F4 rejection/lowering boundary.

## Initial verification

The five tests in `../agent-docs.test.mjs` cover literal CodeSlab code/language,
cooked templates and rejected interpolation, rejected JSX spreads, comment versus
literal/executable expressions, and fenced Kotlin generics/interpolation.
They preceded the parser implementation and pass under Node 22.22.0. The initial
red failed because the parser module did not yet exist. The integration owner
supplied the exact planned direct dependencies and runs broader export/build
checks in later foundation steps.
