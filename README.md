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
Site and skill anchors are checked against the whole-file hashes recorded in the
claims ledger. A skill change requires claim review before explicitly reconciling
its hash. Both CI workflows check out the skill repository at
`1aadb4a8ba816cfb90129b30db5f5eebc5446848`; update that pin together with any reviewed
skill-anchor hash changes. Publish this skill commit before landing the
corresponding documentation change.
