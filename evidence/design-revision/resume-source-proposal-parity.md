# Source proposal parity

Verified 2026-09-06. U5 and U6 proposal patches match the existing isolated source files. Both
source checkouts still have HEAD `5a8c956bc1dbd6ad838ea9da3b34c7d76c703a71`; their tracked and
untracked status is unchanged by this refresh.

- U5 checkout: `/private/tmp/store6-design-revision-source-20260906`.
- U6 checkout: `/private/tmp/store6-design-revision-reference-20260906`.
- Candidate output: `/private/tmp/store-reference-proposal-proof-jORu04`.

## Refreshed patches

| Proposal | SHA-256 | Result |
| --- | --- | --- |
| `proposals/quickstart.patch` | `a64925baa811980914d8121cbc34f44639424fb79285a5cb6467f24498eb354a` | Already current, byte-identical after refresh. Includes "This checkout" and "learn the read path" voice corrections. 23 additions, 0 deletions. |
| `proposals/reference.patch` | `7331df6638a990bb48f54e29896e94a6de60fc288f54dc135d801bc8cc9d63a5` | Regenerated from the current plugin diff and all three untracked resources. 215 additions, 0 deletions across four files. |

The previous reference patch hash was
`79806d7c44f8d0ed77eae35944919d45292214970a992ab2da2177dc58e0a9fc`. The refreshed patch restores
Git's space prefix on blank context lines. Replacing `\n \n` with `\n\n` reproduces that previous
hash exactly. The patch's source changes are identical.

## Current source hashes

Paths below are relative to their respective isolated source roots.

| Source | SHA-256 |
| --- | --- |
| U5 `docs/store6/quickstart.md` | `f8176457db509059a7331f4329f84c0b857ecb6146b75d9ad6f52f10f01c15ac` |
| U6 `tooling/plugins/src/main/kotlin/org/mobilenativefoundation/store/tooling/plugins/KotlinMultiplatformConventionPlugin.kt` | `02b525e60288552b7a26cce4877ef10a1ee76eae5a0e6a41a725220203ca10fc` |
| U6 `tooling/plugins/src/main/resources/dokka/store-reference.css` | `4ef8bbdd7f9e10add671f7e625c3e615c9e802d32b338699b1edf2d5484e2d9a` |
| U6 `tooling/plugins/src/main/resources/dokka/logo-icon.svg` | `db0f47312813ca7786d5e05b63035495b654dfd3275ed95b28c40d9fd4f481c6` |
| U6 `tooling/plugins/src/main/resources/dokka/templates/includes/header.ftl` | `7f0756e50b54757fc42d02e36f2aa96d1c1b379a2d6021d75120af195160d123` |

## Commands and protected-content checks

For both checkouts, ran `git rev-parse HEAD`, `git status --porcelain=v1 --untracked-files=all`,
`git diff --name-only`, `git diff --numstat`, and `git diff --check`. The only U5 tracked change is
the Quickstart. The only U6 tracked change is the convention plugin, and its only untracked files
are the three named Dokka resources.

Regenerated U5 with `git diff -- docs/store6/quickstart.md`. Regenerated U6 by concatenating
`git diff -- tooling/plugins/src/main/kotlin/org/mobilenativefoundation/store/tooling/plugins/KotlinMultiplatformConventionPlugin.kt`
with `git diff --no-index -- /dev/null <resource>` for the CSS, logo, and header template, in that
order. Each no-index comparison returned the expected status 1 because the resource is new.
For each saved patch, `git apply --reverse --check -` against its source checkout passed without
mutating source. `git apply --numstat` confirmed the complete four-file U6 patch inventory.

Python byte comparisons established:

- No original Quickstart line was removed or changed. All original Kotlin fences and source
  marker comments remain byte-identical. The existing commands, inline identifiers, links,
  lifecycle guidance, release qualification, and footer are therefore retained.
- Both U6 module documents remain byte-identical to HEAD. `store6-core/dokka/Module.md` remains
  `dfe5776645dc4b05ebbc12dc160e170938ce61967b114c45e7ba31ccbfbe515d`;
  `store6-mutations/dokka/Module.md` remains
  `492a269a66571c446683f691d42bb00286da14a6352de56432fa38de3d8d65ee`.
- Current proposed CSS and logo bytes match the generated assets in both candidate module trees
  and the permanent fixtures under `scripts/fixtures/reference-theme/`.
- Source status before and after the refresh is identical. No source file was written.

This is fresh patch/source parity evidence, not a new generation or runtime result. Existing
generation evidence is unchanged. The proposals remain uncommitted and unapproved. Source-owner
approval and merge, an exact merged-revision re-pin, authorized regeneration, and integration
acceptance remain dependencies. No source commit, source-lock change, public-output replacement,
workflow mutation, build, publication, or deployment occurred.
