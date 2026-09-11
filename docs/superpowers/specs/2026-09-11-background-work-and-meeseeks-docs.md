# Background work and Meeseeks documentation scope

Date: 2026-09-11. Requested outcome: a plan for writing both guides proposed in the preceding discussion.

## Reader and outcome

Help a Store6 adopter explain and implement the path from an offline edit to a later acknowledged write when screen lifetimes, connectivity, or process lifetimes change. Teach scheduling responsibilities before the Meeseeks wiring that supplies execution opportunities.

## Deliverables

1. **Background work**, ultimately at `/docs/store6/mutations/background-work`, beside the existing drain-and-restart guide. Explain cache revalidation, a foreground drain, and scheduled background execution; durable journals; triggers; restart; cancellation; retries; and pending-write truth.
2. **Meeseeks**, ultimately at `/docs/store6/meeseeks`, in the existing Integrations sidebar group. Explain host initialization, worker and store registration, lifecycle hooks, platform setup, constraints, support status, and verification limits.

Both follow the same example: edit offline, persist the mutation, leave the app, receive an execution opportunity, drain, adopt the acknowledgement, and update pending-write UI. This is an explanatory scenario; label exactly which parts have executable evidence.

Use existing components and compiled-source snippets. Link to existing mutation quickstart, journal storage, server, inspection, and pending-write UI pages for their full contracts. Keep Meeseeks optional and core scheduling-agnostic. Do not add a general-purpose Meeseeks manual, new scheduling behavior, dependency upgrades, release changes, or a site redesign.

## Source boundary discovered during planning

- Site inspected: `5c18ee5b11ba4f5c3b0b27f453213f69ab98fb61`.
- Site source lock: Store6 `ad435df1095673709a22f1b52a82aa03748cd9b3`; neither scheduling module exists there.
- Scheduling candidate inspected: Store6 `3d62af803b96e59af23e647228f0807f5c62b3e7`. It contains `mutations-drain` and `mutations-drain-meeseeks`, but also renames other module paths and changes existing source contracts.
- Candidate `STABILITY.md` targets both modules for alpha02. The Meeseeks adapter records unresolved JVM execution/recovery issues and concurrent scheduling verification requirements. An alpha02 target is not an installation or release promise.
- The site currently enforces one Store6 source revision for claims. An unrelated page-level version note cannot make candidate anchors valid at the older pin.

Therefore complete both reviewable drafts against the candidate immediately. Promotion into the public content tree depends on a separately completed, coherent site/source alignment. Do not silently expand this two-guide task into a site-wide source migration, backport modules onto the older source, or introduce a second source-lock system. The implementation plan must distinguish draft completion from publication completion and provide the subsequent integration steps.

## Acceptance

- Both drafts are complete prose with exact snippet bodies, prerequisites, links, support status, and a source/evidence record.
- No promise of exactly-once delivery, bounded operating-system wake-up latency, universal constraint support, or process durability from the in-memory journal.
- Code compilation, in-process runtime tests, simulated restart, device background execution, local site rendering, and deployed behavior remain separate evidence classes.
- Once source alignment is complete, both pages enter navigation, route census, claims/snippet checks, search, and canonical Markdown discovery together.
- All existing routes remain available. The subsequent PR handoff authorizes pushing the completed draft branch and opening its pull request. Deployment, merge, tags, and artifact publication remain outside this work.
