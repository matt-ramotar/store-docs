# store-docs

This repository contains the standalone Store documentation site. It uses the
Next.js 16 App Router, headless Fumadocs, and HeroUI v3.

## Package mode

The package mode is **PRO**. `@heroui-pro/react` and its required peer packages
are installed. See `evidence/T0-package-mode.md` for the resolved versions.

## Ports

| Script | Command | Port |
|---|---|---|
| `pnpm dev` | `next dev -p 3111` | `3111` |
| `pnpm start` | `next start -p 3222` | `3222` |

Run `pnpm build` for a production build. The build does not start a server.

## Agent access

The homepage, documentation pages, and diagram gallery serve Markdown at their
usual URLs when the request prefers `Accept: text/markdown`. HTML is the default.
Negotiation honors quality values and exclusions and returns `406` when neither
format is acceptable. Both variants include `Accept` in `Vary` along with encoding
and Next.js navigation headers.

The production build reuses the source-synchronized Store6 Markdown corpus byte
for byte. For other pages, it generates Markdown from prerendered content,
retaining code, tables, callouts, diagram descriptions, and inactive tab content.
The generated route inventory and `public/agent-markdown/` files are ignored by
Git. Run `pnpm build` after content changes; use `pnpm start` to verify the generated
responses. Markdown export is a production-build step, not a live development
renderer. New MDX components must have their complete content verified by the
exporter before the build will publish them.

Next.js 16.3 overwrites proxy `Vary` headers when serving HTML. The final build step
merges the required keys into each negotiated page's prerender metadata while
preserving existing metadata. This integration depends on Next's build format;
the build and HTTP checks must pass when upgrading Next. Serve the completed
`pnpm build` output, including the generated public files and finalized metadata.

Unknown page URLs return `404` with recovery links. Markdown requests and ordinary
command-line requests receive a short Markdown body; browsers receive the styled
404 page. Unknown `/api` paths and unsupported search methods return RFC 9457
`application/problem+json`, including a stable error code and a resolution hint.

- `/llms.txt` is the existing source-synchronized documentation index.
- `/sitemap.xml` lists the homepage, documentation pages, and diagram gallery.
- `/robots.txt` permits crawling and identifies the sitemap.
- `/openapi.json` describes the existing static `/api/search` index, its supported
  methods, and error format. The site does not expose a hosted Store data API.

After `pnpm build`, run the contract suite with Node.js 22.18 or newer:

```sh
node --test scripts/*.test.mjs
```

With the production server running, verify every page, generated Markdown
variant, public file, API method, and recovery response:

```sh
node scripts/verify-agent-readiness.mjs http://127.0.0.1:3222
```

The same verifier accepts a deployment URL. Run it against the matching deployed
build to verify CDN content negotiation and cache headers before rerunning an
agent-readiness audit.

## Required CSS configuration

Keep these imports in this order in `app/globals.css`:

```css
@import "tailwindcss";
@import "@heroui/styles";
@import "@heroui-pro/react/css";
```

`postcss.config.mjs` must configure `@tailwindcss/postcss`; otherwise the
Tailwind transform does not run. Define site tokens with `@theme inline` so
utilities continue to reference runtime theme variables.

## Fumadocs boundary

The site uses `fumadocs-core` and `fumadocs-mdx` without `fumadocs-ui`.
`lib/source.ts` owns the loader at `/docs`, and `source.config.ts` owns the MDX
source under `content/docs`. Keep `fumadocs-core@16.12.1` and
`fumadocs-mdx@15.2.0` pinned because the scaffold verifies that pairing.

pnpm build-script allowances live in `package.json` under
`pnpm.onlyBuiltDependencies`. Do not use the interactive
`pnpm approve-builds` command.

## Layout

- `content/docs/`: MDX content served under `/docs`.
- `lib/source.ts`: the shared Fumadocs loader with `baseUrl: "/docs"`.
- `mdx-components.tsx`: the shared MDX component map.
- `app/(docs)/docs/[[...slug]]/page.tsx`: the documentation catch-all route.
- `app/globals.css`: the CSS entry and token insertion boundary.
- `evidence/`: source locks, ownership ledgers, claim and snippet manifests, and other verification inputs.

Keep verification inputs and maintained contracts in Git. Build logs, browser dumps, and routine
screenshots from local runs stay in ignored artifact directories. CI run outputs belong in workflow
artifacts. The `design-revision` and `sidebar-navigation` directories under `evidence/` are local
run archives and are not required to build or verify the site.

Claim verification also needs an explicit checkout of
[`store-agent-skills`](https://github.com/matt-ramotar/store-agent-skills), which owns
the Store6 retrieval helper:

```sh
node scripts/check-claims.mjs --source-root ../Store6 --skills-root ../store-agent-skills
```

The re-pin helper runs claim verification too. Pass the same skill checkout when
updating the Store6 source revision:

```sh
node scripts/repin-store6-lock.mjs --source-root ../Store6 --skills-root ../store-agent-skills
```

Store6 anchors are checked against the pinned source revision and checkout bytes.
An optional full-commit `revision` on a Store6 claim anchor or snippet entry pins
that evidence independently of the shared source lock. Evidence at a different
revision is checked against immutable Git blobs, including whole-file claim hashes
and exact snippet regions. The commit must exist in the source repository; missing
commits, files, and symlink sources fail verification. Use an explicit revision
only for a guide that identifies that source version. CI's full Store6 clone
includes the published branches containing these pins. For an existing local
checkout, fetch a missing pin before running the checks:

```sh
git -C ../Store6 fetch origin b123c95a373f3629c23e797cb97e2bca18bb260a
```

Site and skill anchors are checked against the whole-file hashes recorded in the
claims ledger. A skill change requires claim review before explicitly reconciling
its hash. Both CI workflows check out the skill repository at
`1aadb4a8ba816cfb90129b30db5f5eebc5446848`; update that pin together with any reviewed
skill-anchor hash changes. Publish this skill commit before landing the
corresponding documentation change.
