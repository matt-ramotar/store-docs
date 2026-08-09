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
- `evidence/`: local verification records.
