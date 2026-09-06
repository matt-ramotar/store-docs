# Quickstart source proposal

Status: draft for upstream human review. This proposal is not approved, landed, source-locked,
synchronized, published, or deployed.

Current patch/source parity, including the writing-voice correction, is recorded in
`evidence/design-revision/resume-source-proposal-parity.md`.

## Authority and scope

- Authoritative base: clean detached Store6 revision
  `5a8c956bc1dbd6ad838ea9da3b34c7d76c703a71`.
- Proposed upstream source: `docs/store6/quickstart.md`.
- Review patch: `evidence/design-revision/proposals/quickstart.patch`.
- Derived site output: `content/docs/store6/quickstart.mdx`. It is generated and was not edited.
- The working Store6 checkout at `/Users/matt/src/matt-ramotar/Store6` was read only and remains
  outside this proposal.

The reader job is to obtain the unpublished source, create a Store, read through `stream` and
`get`, interpret the result frames, and close the Store. The revision adds that sequence around the
existing exact example instead of replacing it.

## Proposed source journey

1. Keep the source-owned release qualification beside setup: Store 6 is in development, nothing is
   published, and coordinates begin with `6.0.0-alpha01`.
2. Add **Get the source** with one shell block that clones the verified Store6 fork, checks out the
   exact source revision, and runs the existing executable quickstart module.
3. Add **Create a store** immediately before the compact `store { fetcher { ... } }` example.
4. Add **Read from the store** before the explanation of `stream` and `get` and the full
   CI-executed program.
5. Retain **Reading the output** as the interpretation step, including all four `StoreResult`
   variants, `take(2)`, and lifecycle guidance.
6. Retain **Write path (experimental)** and its `#write-path-experimental` destination, then add an
   onward link to the existing mutations quickstart. The current detailed experimental material
   remains in place in this patch.

Existing section destinations `#the-whole-program`, `#reading-the-output`, and
`#write-path-experimental` remain unchanged.

## Proposed setup commands

These commands are new technical additions. They are review candidates, not commands inherited
from the locked source:

```shell
git clone https://github.com/matt-ramotar/Store6.git
cd Store6
git checkout --detach 5a8c956bc1dbd6ad838ea9da3b34c7d76c703a71
./gradlew :store6-quickstart:run
```

The public clone URL is `https://github.com/matt-ramotar/Store6.git`; the real Store6 workspace
uses the equivalent SSH URL for its configured `origin`. The locked commit is contained by
`refs/remotes/origin/main`; no
`refs/remotes/upstream/*` contains it. The module exists in `settings.gradle`, its application entry point is
`org.mobilenativefoundation.store6.quickstart.MainKt`, and `.github/workflows/store6.yml` runs the
same Gradle task with `--stacktrace`.

Root ran `./gradlew :store6-quickstart:run` from the current isolated checkout with JDK 17 and the
existing `ANDROID_HOME`. It passed with this exact application output:

```text
Loading…
Data(name=User 1, origin=FETCHER)
get: User 2
```

The authority log is `evidence/design-revision/commands/quickstart-run.log`. Root did not execute
the newly proposed clone or detached-checkout commands.

## Protected content preserved

The patch is additive. It removes or changes no line from the locked source. In particular, it
preserves:

- all four original Kotlin code blocks byte for byte;
- all four source-marker comments: the display block, both parity-checked program blocks, and the
  mutation source anchors;
- `users.stream(UserKey("1")).take(2)` and the explanation that `take(2)` ends the example;
- all four `StoreResult` branches and the `FETCHER`, `SOT`, `MEMORY`, and `OVERLAY` identifiers;
- `users.get(UserKey("2"))`, `users.close()`, and the screen-lifetime/Store-lifecycle guidance;
- the `@OptIn(ExperimentalStoreApi::class)` boundary and all experimental mutation qualifications;
- every existing link destination, including the read contract, freshness policies, key design,
  workflow, and stability anchors;
- the source-date footer: `Last verified: 2026-08-10`, `main` at `a6a156e9`,
  `pre-6.0.0-alpha01`.

The added sentence about the stand-in service is supported by the checked-in `FakeApi`, whose
fixed delay and `User(id, "User $id")` return are part of the parity-checked example.

## Generated-output drift

The source lock maps `docs/store6/quickstart.md` to `content/docs/store6/quickstart.mdx` at the
authoritative revision. Before this proposal, `evidence/design-revision/baseline-drift.json`
already recorded a Quickstart ownership mismatch: expected SHA-256
`767e0d9c572fac78d9da323dc74eb51dd1d766cc00c0819b576e365d5dd25b33`, actual SHA-256
`97a4ead0b1aa58245b5ebe823ea289ed552e8807def6a8c3e8da59d49c3a21b7`.

The generator intentionally removes source markers, rewrites repository links, wraps the mutation
qualification in a warning callout, and removes the in-page source status quote. The checked-in MDX
still contains that quote, confirming pre-existing drift. This proposal does not treat the
hand-edited generated output as source authority and does not modify it.

## Review and semantic checks

Executed against the isolated source clone:

```text
git rev-parse HEAD
5a8c956bc1dbd6ad838ea9da3b34c7d76c703a71

git diff --check -- docs/store6/quickstart.md
(no output; passed)

git diff --numstat -- docs/store6/quickstart.md
23  0  docs/store6/quickstart.md
```

The zero-deletion diff establishes that all locked source lines remain byte-preserved. Focused
semantic checks passed for:

- exactly one each of the new `Get the source`, `Create a store`, and `Read from the store`
  headings;
- the three original section headings and their destinations;
- the four original source-marker comments;
- the original Kotlin fences, `take(2)`, `close()`, opt-in, release qualification, identifiers,
  links, and footer;
- exactly one onward link to `/docs/store6/mutations/quickstart`;
- no change in `/Users/matt/src/matt-ramotar/Store6` attributable to this proposal.

No application build, server, browser, source-lock update, generated-MDX edit, commit, push, pull
request, merge, publication, or deployment was performed.

## Approval and dependencies

### Resumed writing-voice pass

The 2026-09-06 prose pass changed only the newly added setup explanation from "The locked
checkout" to "This checkout" and from "focus on the read path" to "learn the read path". The
deterministic stand-in service and CI-module qualifications remain unchanged. The review patch was
refreshed from the isolated source diff. It still adds 23 lines and deletes none.

Three separate passes checked vagueness and mechanics, warrant and performance, and reader
application. Fenced blocks, inline code, source markers, link destinations, headings, the source
footer, and every original source line remain byte-preserved. See
`evidence/design-revision/resume-writing-voice.md` for the comparison evidence. This wording pass
does not approve the source proposal or change its publication status.

### Remaining source authority

The placement and wording are settled: **Get the source**, **Create a store**, **Read from the
store**, and **Reading the output** form the accepted journey, and the site CTA is **Build your first
store** linking to this quickstart. Routine wording and placement do not require another decision.

The remaining authority gate is the source change itself. It requires a Store6 source branch, pull
request, and human merge before source-lock re-pin, deterministic regeneration, and site
acceptance. The newly proposed clone and locked-checkout commands were not executed.
