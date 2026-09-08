# Store6 skill client smoke procedure

This checklist prepares observations for Codex, Claude Code, and Cursor. No client is marked supported by this file. Installation shape, discovery, invocation, local delivery, public HTTPS delivery, and explicit update are separate checks.

## Record and prepare

- [ ] Record client/version/model, inherited settings, operating environment, date, source path/ref, skill package digest, paired bundle/source revision, and trace directory.
- [ ] Resolve the skills installer version once with `npm view skills version` when network/install execution is authorized. Record and reuse that literal version throughout the checks. Verify its actual flags before use.
- [ ] Create a fresh disposable project for each client and source method. Use a client-supported clean environment/profile without another Store6 skill. Retain ordinary approvals and repository rules. Do not override `HOME` or `CODEX_HOME`.
- [ ] Confirm the selected client can access the intended project and required documentation tools. Record unavailable client/authentication as `unverified`.
- [ ] Save the empty initial skill inventory and project status. Keep raw traces in ignored `evidence/agent-docs-runs/` and compact observations in the release evidence record owned by the integrator.

## Local package install

Set `STORE6_INSTALLER_VERSION` to the captured version and `STORE6_SKILL_SOURCE` to the absolute candidate skill directory. Run inside the disposable project:

```sh
npx --yes "skills@$STORE6_INSTALLER_VERSION" add "$STORE6_SKILL_SOURCE" --list
npx --yes "skills@$STORE6_INSTALLER_VERSION" add "$STORE6_SKILL_SOURCE" --skill store6 -a codex --copy -y
```

- [ ] Record listing and installation output. Repeat in each client's own fresh project with `-a claude-code` or `-a cursor` as appropriate.
- [ ] Verify installed files and supporting paths against the exact candidate package. Compare sorted relative paths and byte hashes, including manifest, helper scripts, Apache-2.0 license, and notices. Never infer package parity from a successful installer exit alone.
- [ ] Confirm no existing repository instructions or user configuration were overwritten. Record actual scope and installed destination.

| Client | Project discovery location to observe | Explicit invocation to observe |
| --- | --- | --- |
| Codex | `.agents/skills/store6/` | `/skills` or `$store6` in the supported client selector |
| Claude Code | `.claude/skills/store6/` | `/store6` |
| Cursor | `.agents/skills/store6/` or `.cursor/skills/store6/` | Customize → Skills and the slash selector |

These are planned project-local checks. Record what the installed client actually discovers. Do not infer global, remote, cloud, or synced-profile support from project-local success.

## Discovery and invocation

- [ ] Open a fresh client session, locate Store6, and record the actual skill path. Confirm it resolves to this candidate, not an ambient older installation.
- [ ] Explicitly invoke the skill with a read-only request to identify its package and list available document IDs. Observe the actual offline `scripts/get-docs.mjs --list` output and source path.
- [ ] In another fresh session, use an unrelated prompt: `Write a two-sentence thank-you note for a neighbor who watered my plants.` Inspect the trace for inappropriate Store6 activation. An agent saying it did not activate is insufficient without the observable skill/tool record.
- [ ] Preserve both invocation traces and classify discovery/invocation independently from retrieval.

## Local candidate delivery

- [ ] Require the foundation's actual localhost HTTP/hash checks and explicit skill/corpus pairing to have passed.
- [ ] Use the exact installed helper with the explicit evaluation preload, resolving all paths absolutely:

```sh
node --import "$STORE6_EVAL_FETCH_ADAPTER" "$STORE6_INSTALLED_SKILL/scripts/get-docs.mjs" --source-revision "$STORE6_EVAL_SOURCE_REVISION" quickstart
```

- [ ] Record canonical URL, localhost delivery URL, document byte hash, reported provenance, bundle/source identities, and trace pointer. Label this check `local-delivery`.
- [ ] Confirm the installed package digest is unchanged before and after retrieval. Do not edit the helper, manifest, URL origin, or hash checks to make it work locally.
- [ ] Run deterministic helper fixture checks for unknown/mismatched version and changed live bundle. Observe explicit failure without partial document stdout, silent update, or compatibility inference.
- [ ] Against a disposable local server fixture, change one document's bytes while retaining the pinned manifest and observe `CONTENT_MISMATCH`. Restore only the fixture, preserving failure evidence. This is a helper/transport check rather than a behavioral evaluation cell.
- [ ] Keep the preload outside the installed package and avoid global `NODE_OPTIONS` or profile edits.

## Explicit paired update

- [ ] Prepare a second paired fixture package with a different recorded package/bundle identity. Preserve the first fixture and its evidence.
- [ ] Explicitly select/install that second package in a disposable test project using the same captured installer version. Record the source method and any documented installer prompts.
- [ ] Verify changed installed package and manifest identities, then repeat discovery, offline listing, and matched local retrieval.
- [ ] Confirm an old paired installation reports bundle mismatch against the changed fixture instead of rewriting its own pin. Do not edit the old installed manifest in place.
- [ ] Do not promise that a floating update command advances a source installed from an immutable ref. An update selects the next tested ref explicitly.

## Public installation and HTTPS

- [ ] Before authorized publication, mark the immutable public installation and production HTTPS retrieval cells `pending-publication`.
- [ ] After publication, verify the actual immutable GitHub ref exists at the reviewed candidate. Test the exact public source URL in a fresh project; local path installation success does not prove public installation.
- [ ] Repeat listing, installation, file/hash comparison, discovery, and invocation using that immutable URL. Record commit, installer version, and client version.
- [ ] Invoke the unchanged installed helper in the client against its configured HTTPS origin with no local preload. Check the actual manifest/page bytes, source and bundle identities, and returned provenance.
- [ ] Label only this observed result `https-delivery`. Localhost success does not establish DNS, TLS, publication, or production caching behavior.

## Compact evidence fields

For each client and source method, record `client`, `clientVersion`, `model`, `installerVersion`, `source`, `immutableCommit` when available, `installedPath`, `packageDigest`, `bundleId`, `sourceRevision`, `date`, and separate outcomes/trace pointers for listing, install, parity, discovery, invocation, unrelated activation, local retrieval, mismatch handling, explicit update, immutable public install, and HTTPS retrieval.

Use `passed` or `failed` only for an observed check; use `unverified` for unavailable client/authentication/tool execution and `pending-publication` for dependent public checks before publication. If setup instructions need a correction that changes corpus content, create a new candidate, regenerate/re-pair, and repeat the affected checks. Record observed support in external release evidence, not by editing the already paired setup pages during a run.
