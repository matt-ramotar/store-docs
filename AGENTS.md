<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

Single service: the `store-docs` Next.js 16 (App Router) documentation site. Package
manager is pnpm (`packageManager` pins `pnpm@10.30.3`, already on PATH). Standard
commands live in `package.json` and `README.md`; ports are `pnpm dev` → 3111 and
`pnpm start` → 3222. Dependencies are refreshed automatically by the startup update
script (`pnpm install --frozen-lockfile`), so you normally do not run install yourself.

### Licensed dependency — `HEROUI_AUTH_TOKEN` required to build/run

`@heroui-pro/react` is a licensed HeroUI **Pro** package. Its `postinstall`
downloads the real components from HeroUI's CDN and only authenticates when the
`HEROUI_AUTH_TOKEN` environment variable (a HeroUI Pro CI license token) is set; the
same token backs CI. Without it, `pnpm install` still succeeds (the postinstall
prints a "sign in" notice and exits 0) but leaves `@heroui-pro/react` with no
usable entry, so `pnpm build`, `pnpm dev`, and `pnpm start` fail with
`Can't resolve '@heroui-pro/react'` / `@heroui-pro/react/css`. Add `HEROUI_AUTH_TOKEN`
as a secret; after it is present a fresh `pnpm install --frozen-lockfile` re-runs the
postinstall and downloads the components. (Alternative for a human: `npx heroui-pro login`.)

### Node version — contract tests need Node ≥ 22.18

The default interpreter (`/exec-daemon/node`) is Node 22.14, which is too old to
import the `.ts` files the contract tests load (`ERR_UNKNOWN_FILE_EXTENSION` for
`.ts`). Node's unflagged TypeScript type-stripping only exists in Node ≥ 22.18. Use
nvm's Node 22 (≥ 22.22, pre-installed and set as the nvm default) to run the tests:

```
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use 22 >/dev/null
node --test scripts/*.test.mjs
```

`pnpm build`/`pnpm dev` do NOT need the newer Node (Turbopack handles TS), so the
app itself runs on the default Node once the license token is present.

### Tests

- Contract/verification suite: `node --test scripts/*.test.mjs` (run under Node ≥ 22.18 as above).
- CI (`.github/workflows/verify.yml`) runs `pnpm build` **before** the suite: seven
  tests assert against `.next/server/app/**` static HTML, so build first or they fail
  with `ENOENT ... no static HTML` — these are not real failures, just a missing build.
- Two workflow-parsing tests shell out to `ruby` (installed in this environment; not
  on the base image by default — it is a test-only system dependency, kept out of the
  update script).
- There is no lint script; `tsc` is available via `pnpm exec tsc --noEmit` if needed.
- Some `scripts/*.mjs` verifiers (`sync-store6-docs`, `check-claims`, `check-snippets`,
  the `drift.yml` workflow) require an external `../Store6` checkout and Gradle/JDK;
  those are CI/cron concerns, not part of local app development.
