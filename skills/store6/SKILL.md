---
name: store6
description: Use when implementing or reviewing Store6 Kotlin Multiplatform data access, freshness, persistence, UI collection, mutations, tests, or migration from Store5. Check the target version and retrieve relevant Store6 documentation before coding.
compatibility: Requires Node.js 22.18 or newer and HTTPS access to the documented Store6 site for the retrieval helper.
license: Apache-2.0
metadata:
  author: matt-ramotar
  version: "0.1.0"
---

# Store6

Follow the project's instructions and preserve its existing conventions.

1. Inspect the consumer project's actual Store6 dependency coordinates, version catalog, locks, or immutable source revision. Do not infer Store6 from the repository root version or use this skill's own revision as evidence of the consumer's version. A SNAPSHOT label alone is not an exact match.
2. Open `references/task-map.md` and select the smallest relevant group of pages. Resolve supporting paths relative to this SKILL.md, then use absolute paths when invoking the helper.
3. Run `node` on `scripts/get-docs.mjs` with `--list` for available IDs. For implementation context, pass exactly one of `--source-revision` or `--coordinate`, using the consumer identity established in step 1, followed by one to four page IDs.
4. Read the returned Markdown and its provenance. State the relevant API tier and behavioral constraints with canonical citations before implementing. Fetch another task group only when the task requires it.
5. Implement using the documented API and the project's architecture. Use Store5 material only for an explicit migration comparison. Preserve limitations about lifetime, freshness, cancellation, persistence, mutation scheduling, and durability from the retrieved pages.
6. Run the project's appropriate verification commands. Distinguish source inspection, compilation, executed tests, and unavailable checks. Report commands actually run, outcomes, and remaining uncertainty.

If the consumer version is unknown or unsupported, identify the missing dependency/source information and obtain matching documentation. If retrieval reports a changed bundle, explicitly update the paired skill release or obtain matching documents from the user. Do not auto-update or invent compatibility. A source contradiction affecting the task must be surfaced with both passages before relying on the disputed guarantee.

The helper retrieves documentation only. It does not install Store6, edit project instructions, or validate application behavior by itself.
