# Store 6 documentation site — IA and content plan

**Date:** 2026-08-10 · **Site:** store-docs @ `37199e4` · **Library:** Store6 @ `a6a156e9` (main)

**Provenance.** Produced by a 29-agent dynamic workflow (7 discovery readers → 3-lens IA judge panel → 9 per-section outline agents + sync-plan designer → adversarial verification: coverage audit, constraint check, completeness critic, 4 claim skeptics → 1 gap-fill round). Verification results: zero-redirect check PASS (all 52 existing routes preserved at exact paths, confirmed against `evidence/live-url-inventory.txt` + content tree + T8 census); all 60 cited Repo A source paths exist at the pinned revision; live `sync-store6-docs.mjs --check` exited 0; 60-claim verification sample: 59 CONFIRMED, 1 REFUTED (corrected in place — see §7); 1 sync-plan violation (corrected in place — see §7); the one high-severity coverage gap was closed by a gap-fill outline round (§5, aliases page).

---

## 1. Executive summary

This plan takes store.mobilenativefoundation.org from a migrated shell (52 routes: 30 frozen Store 5 pages, 10 Store 6 pages, entry pages, 2 reference placeholders) to a documentation site that fully reflects the merged Store 6 codebase, and defines the machinery that keeps it true as the code moves.

- **The IA** (§3): 9 sections, 79 pages total — 27 new routes (5 concepts, 7 guides, 11 mutations incl. the gap-fill aliases page, 3 migration, /docs/store6/room), 5 revised entry surfaces, 10 sync-owned pages (9 existing + room), 38 kept frozen. All growth is additive under /docs/store6/**; nothing moves, nothing redirects.
- **The shape**: a single newcomer spine (overview → quickstart → important-defaults → concepts → guides → mutations), job-shaped guides that link into concepts, an honestly-bannered experimental mutations subtree, migration from Store 5 as a first-class product, and generated-only API reference per the placeholder pages' own replacement contracts.
- **Every page has an outline** (§5): heading skeletons with per-section content notes, code-snippet plans with verified file:line anchors, stability-tier callouts, and cross-links — ~356 KB of outline material across 10 section files, carrying a 437-claim ledger of checkable factual assertions.
- **The sync plan** (§6): three ownership classes (sync-owned via the existing T4 source lock, hand-authored under a per-page claims ledger, generated Dokka/llms.txt), lock re-pin flow, drift CI on both repos, snippet extraction from CI-compiled modules, and Dokka generation satisfying the placeholder contracts.
- **Open items resolved** (§8): search-pin and route-census churn rules, llms.txt growth policy, the complete meta.json navigation inventory, the amended one-forward-link principle, authoring batches B0–B6 with dependencies, top-nav re-point decisions, and the rx2/Java scope note.

## 2. Design principles

1. One obvious next page: every Store 6 page ends with exactly one forward link, forming the spine overview → quickstart → important-defaults → concepts → guides → mutations; side branches (adapters, testing, devtools, migration) hang off the spine and never interrupt it. *(amended by §8.5)*
2. Concepts arrive exactly when needed and exist to serve tasks: the quickstart teaches only key + fetcher + the four StoreResult kinds; freshness, key design, invalidation, errors, and memory are deferred to the concepts section the reader hits after first success, and every guide opens with the job it completes.
3. Honest stability tiers at point of use: every page states its artifact's tier per STABILITY.md; store6-core is stable-track but not frozen until the beta01 freeze candidate; the seam is a freeze candidate, not frozen; every mutations page carries an experimental/alpha banner and states the two-step ack crash window (adopt-first/retire-last, idempotent endpoints) up front; nothing is described as published until 6.0.0-alpha01 ships.
4. Zero redirects and additive-only IA: all 52 existing routes keep resolving at their exact paths; new content only adds routes under /docs/store6/**; sidebar grouping, ordering, and labels come from new meta.json files (none exist today; outside the T8 route census and all ledgers) — never from file renames, which trip the sync lock, ownership ledger, extras census, byte-pins, and zero-redirect gates simultaneously.
5. Sync-owned pages change only in Repo A: edit the source file, then re-pin evidence/T4-store6-source-lock.json (revision + sha256 + the append-only-fragile 1-based line-range transform anchors); hand edits to generated targets are detected (OWNED_STALE_MODIFIED) and block the pipeline.
6. Harness pins move in one motion with any route change: evidence/T8-extras.txt, the pinned search-index count (54 raw "fetcher" results in verify-search-index.mjs and t5-search-contract.test.mjs), the T3 overview byte-pin (T3_OVERVIEW_SHA256 in t4-contract.test.mjs), the T7 hero pins, and the llms.txt link census are updated in the same change that adds or revises routes.
7. Tests are the specification: pages inherit Repo A's provenance discipline — named conformance tests as authority (if a page line and its test disagree, the test is right and the page is a bug), code blocks from CI-compiled modules, verbatim/display distinctions and provenance markers preserved by the sync pipeline, never stripped.
8. No internal process vocabulary on published surfaces: no issue numbers, ruling tokens, TD-/FS-/RISK- identifiers, or decision-record paths; state the technical fact with durable attribution; org.mobilenativefoundation.store6.core.internal is off-limits as a documentation subject.
9. Every claim carries its consequence, and non-contractual internals stay unpinned: never promise engine retries, atomic acks in alpha, projected get(), or pinned internal constants (reader-grace window, self-heal delay, mutation backoff); pitfall-shaped facts (isStale never set on OVERLAY frames, LocalOnly still requires a fetcher, events are lossy advisory telemetry) are stated where the reader first meets the feature.
10. The migrating Store 5 user is a first-class audience: every keep-frozen Store 5 page names its Store 6 successor in this plan, and the component map gives all seven Store 5 components an explicit answer, including honest no-direct-analog entries (Updater, Bookkeeper, Converter).
11. Per-symbol API reference is generated Dokka output only, dropped into /reference/store6-<module>/ per the placeholder pages' own stated replacement contract — never hand-written symbol lists; prose pages link into it rather than duplicating signatures.

## 3. The sitemap

Dispositions: **new** (author from scratch) · **revise** (edit existing hand-authored page) · **sync-owned** (Repo A is the source of truth; the site copy is generated) · **keep-frozen** (byte-locked legacy).

### Site entry points (`entry`)

The doors into the site. The hand-authored home page and docs home are the only two revisable entry surfaces (neither is ledger-owned); they are re-pointed at the Store 6 spine. The five ported Store 5-era top pages, the two title-only ported routes, and the token demo are port-page-owned or inventory-locked and stay frozen — Store 6 surfaces via the home hero CTAs, the /docs router page, the version switcher, and top-nav edits in lib/nav.ts, never by moving these routes.

| Route | Title | Disposition | Purpose |
|---|---|---|---|
| `/` | Store — home | revise | Hand-built hero already branded Store 6 (HeroThesis + KeyEngineTrace). Revise CTAs to lead to /docs/store6/overview and /docs/store6/quickstart as the single entry to the newcomer spine; keep the pinned trace strings or update the T7 hero pins in the same change. |
| `/docs` | Store documentation home | revise | Replace the MDX/HeroUI scaffold smoke-test with a real two-track router: Store 6 (start here — overview, quickstart, defaults, migration) and Store 5 (frozen legacy, maintained under its own coordinates for all of 6.x). It remains the Store 5 version-switcher target and sidebar root, so it must serve both audiences. |
| `/docs/meet-store` | Meet Store (Store 5) | keep-frozen | Ported Store 5-era landing page (Kotlin Foundation / MNF backing). Frozen legacy bytes, port-page:generate owned; reachable from the Store 5 track. |
| `/docs/intro` | Why Store? (Store 5) | keep-frozen | Ported Store 5 overview and current 'Start' top-nav destination. Frozen; the top-nav Start link is re-pointed to /docs/store6/overview via lib/nav.ts while this route keeps serving 200. |
| `/docs/quickstart` | Store 5 quickstart | keep-frozen | Ported 'build your first Store' walkthrough for Store 5 (Trails sample). Frozen; also the page whose built HTML the search verifier inspects for the search-trigger aria contract, so its bytes are load-bearing. |
| `/docs/challenges-at-scale` | Challenges at scale (placeholder) | keep-frozen | Empty ported placeholder preserving a live URL. Frozen; excluded from all navigation. |
| `/docs/community/overview` | Community resources | keep-frozen | Ported conference/podcast list and current 'Project' top-nav destination. Frozen; version-agnostic enough to keep linking from both tracks since its talks cover both Store generations. |
| `/developer-newsletter/overview` | Developer newsletter | keep-frozen | Ported title-only route preserving a live URL. Frozen. |
| `/release-notes/overview` | Release notes | keep-frozen | Ported title-only route preserving a live URL. Frozen until Store 6 alpha01 ships, at which point release-note content (closing issues by linking named conformance tests) becomes a separate editorial decision at this same path. |
| `/tokens-demo` | Design token demo | keep-frozen | Internal design-token demo page, inventoried as a fixed extra. Frozen; never linked from docs navigation. |

### Store 6 — Start here (`store6-start`)

The three-page on-ramp: what Store 6 is, a working store in five lines, and the named zero-config defaults. All three routes exist today; the hand-authored overview is revised to become the spine's head (its byte-pin hash updates with it), and the two sync-owned pages continue to flow from Repo A. Next-page links: overview → quickstart → important-defaults → concepts.

| Route | Title | Disposition | Purpose |
|---|---|---|---|
| `/docs/store6/overview` | Store 6 overview | revise | The Store 6 landing page: the key + fetcher contract, read-resolution table, and module/tier matrix, with the Start-here list re-pointed at the new progressive path (quickstart → defaults → concepts → guides → mutations → migration). Revising it requires updating T3_OVERVIEW_SHA256 in scripts/t4-contract.test.mjs in the same change. |
| `/docs/store6/quickstart` | Quickstart | sync-owned | First working store: the store { fetcher { … } } block verbatim from the CI-compiled runnable module, the four StoreResult kinds, stream vs get, close(), and the experimental write-path teaser. Synchronized from Repo A; content changes happen there and re-pin the lock. |
| `/docs/store6/important-defaults` | Important defaults | sync-owned | Every zero-config behavior named and pinned to its conformance test: CachedOrFetch, zero retries, in-memory SoT/bookkeeper, 128 idle keys, single-flight, conflation, Revalidated. Declares the tests the specification of record. Synchronized from Repo A. |

### Store 6 — Concepts (`store6-concepts`)

The mental model, one idea per page, ordered by when a newcomer first needs it: the read contract they just used (results, origins, and conflation consolidated onto one citable page), then freshness (the first knob), then the one skill Store asks them to learn (keys), the two maintenance verbs, errors, memory, and the opt-in tier system they will hit as compiler errors. The two existing sync-owned pages keep their slugs and group here via meta.json; five new pages live under /docs/store6/concepts/*.

| Route | Title | Disposition | Purpose |
|---|---|---|---|
| `/docs/store6/concepts/read-contract` | The read contract: stream, get, and origins | new | The one-failure-channel rule (stream emits errors and never throws; get throws and never emits), the four StoreResult kinds with no fifth, honest Origin attribution (MEMORY/SOT/FETCHER/OVERLAY) as a tested contract, per-kind conflation, servedStale semantics, the single stream-terminating case (MustBeFresh initial-cycle failure), unbounded streams, and close() semantics ('Store is closed.'). |
| `/docs/store6/concepts/freshness` | Freshness policies | new | The five per-call policies (CachedOrFetch, MaxAge, MustBeFresh, StaleIfError, LocalOnly), exactly what does and does not trigger a fetch, stale-while-revalidate as the default shape, single-flight sharing across differing policies, typed StoreMeta and the metadata-less-row conservative-stale rule, plus the expert read-planning seam (FreshnessValidator/FetchPlan) as an advanced footnote. Absorbs Store 5 Validator's job natively. |
| `/docs/store6/key-design` | Keys and namespaces | sync-owned | Key design as the one skill Store asks you to learn: canonicalId as the deduplication lever, namespace as the invalidation blast radius, durable watermarks covering never-seen keys, and the stability rules (no timestamps, nonces, secrets). Synchronized from Repo A; slug unchanged, grouped here via meta.json; the one-store-or-many topology reasoning is carried forward here via Repo A edits. |
| `/docs/store6/invalidate-vs-clear` | Invalidate or clear | sync-owned | The two maintenance verbs and the wrong-vs-imperfect decision test: invalidate marks stale and refreshes in place; clear removes destructively with no pre-clear replay and no resurrecting in-flight fetches. Synchronized from Repo A; slug unchanged, grouped here via meta.json. |
| `/docs/store6/concepts/errors` | Errors and failure handling | new | The six frozen StoreError variants (safe for exhaustive when and the bridged Swift enum), StoreException on the get path, the what/which-key/likely-fix message contract, rendering servedStale errors over usable content instead of blanking the screen, and why retries belong in your fetcher — the engine does zero retries and zero backoff. |
| `/docs/store6/concepts/memory-and-lifecycle` | Memory, eviction, and store lifecycle | new | Bounded memory via maxIdleKeys (default 128; 0 destroys at quiescence), why eviction is semantically invisible (durable rows, marks, and watermarks survive), what pins an engine (active collectors, in-flight work), single-flight deduplication, reader grace (window deliberately unpinned), and close() as the end of the store's life. |
| `/docs/store6/concepts/api-tiers` | API tiers and opt-in annotations | new | When and why the compiler asks for @ExperimentalStoreApi, @DelicateStoreApi, or blocks @InternalStoreApi; tier-on-the-artifact, SemVer scoped to the stable tier, and the seam's freeze-candidate (not frozen) status including the Overlay/StoreWriteHandle contingency. |

### Store 6 — Guides and integrations (`store6-guides`)

Task-oriented branches off the spine, each opening with the job it completes: richer fetchers, persistence (the seam contract a self-implementer needs plus the adapter choice), the three adapter walkthroughs (Room joins compose and sqldelight as a sync-owned sibling at the same flat depth), testing, devtools, and the end-of-path advanced material (extending, performance, Swift). Every page states its artifact tier — all these modules are @ExperimentalStoreApi per STABILITY.md.

| Route | Title | Disposition | Purpose |
|---|---|---|---|
| `/docs/store6/guides/fetchers` | Fetchers: results, errors, and conditional fetch | new | From the lambda fetcher to fetcherOfResult and the seam Fetcher: the FetcherResult vocabulary (Success/NotModified/Error/Deleted), ETags and the Revalidated frame, why lambda fetchers never see ETags, last-registration-wins, Deleted as server-reported deletion with no auto-refetch, streaming/fallback patterns, and where retry policy lives (your fetcher, never the engine). |
| `/docs/store6/guides/persistence` | Persistence: the SourceOfTruth contract | new | What Store 6 requires of a local source — reader liveness, read-your-writes, exception-atomicity, the detectable TransactionalSourceOfTruth capability with no silent non-atomic default — plus how to choose between the Room and SQLDelight adapters (atomicity boundary, reader semantics, target coverage) and the instruction to certify custom implementations with the contract kit. |
| `/docs/store6/room` | Room adapter | sync-owned | Wrap an existing Room 3 database: the three-declaration database diff (two sidecar entities + DAO accessor), the one-version migration via Store6RoomSchema.createTables, generation-gated reader echoes, the two-step non-atomic value/meta boundary and its conservative rehydration, and the 8-of-12 target subset. New route, synchronized from the module README as an added sync-lock entry — the same ownership model as its compose and sqldelight siblings. |
| `/docs/store6/sqldelight` | SQLDelight adapter | sync-owned | The 15-minute existing-schema walkthrough: sidecar store6_meta* tables, one-transaction value+meta commits, the three boundary rules (round trip, one driver, synchronous transactions), and driver support including JS/Wasm compile-only status. Synchronized from the module README; slug unchanged, grouped here via meta.json. |
| `/docs/store6/compose` | Compose integration | sync-owned | collectAsState / collectAsStateWithLifecycle / collectAsStoreState, the recomposition discipline (structural Data equivalence with age excluded; lifecycle kinds always pass), skipEqualData, and the shipped stability-configuration snippet. Synchronized from the module README; slug unchanged, grouped here via meta.json. |
| `/docs/store6/guides/testing` | Testing with store6-testing | new | Two tiers taught as such: ViewModel tests with FakeStore (scripted outcomes, recorded interactions, TestWallClock-driven age — with the honest caveat that FakeStore never interprets Freshness and its delivery is stronger than the engine's) and policy tests composing FakeFetcher/FakeSourceOfTruth/FakeBookkeeper into a real store { } (shared FakeBookkeeper simulates restart); plus the contract kits as certification suites for custom seam implementations. |
| `/docs/store6/guides/devtools` | Devtools and the inspector | new | One-line telemetry install (StoreTelemetryLogger, StoreDevtoolsMonitor, storeTelemetryOf), the v0 event vocabulary from EVENTS.md with its projection-not-engine-truth caveats (FRESH is observed telemetry, not freshness authority; v0 is not a stable wire format), the in-process Compose inspector (StoreInspector / StoreInspectorOverlay, 8-target subset, zero transport), and the unset-telemetry null fast path with its measured-cost framing. |
| `/docs/store6/guides/extending` | Extending Store through the seam | new | Patterns proven by the in-repo extension probe: the delegating decorator (why its runtime() is null — the pattern the mutations facade follows), seam-only telemetry, consuming the open KeyEvents hierarchy with a mandatory else, StoreRuntime/StoreWriteHandle as the extension-facing ack path, and the transactional-ack coordination case study — reference reading, explicitly never a dependency. |
| `/docs/store6/guides/performance` | Performance and overhead | new | What the benchmark harness measures and — as important — what its numbers may not support: the store-vs-raw-SoT ratio semantics (attachment and readiness included, not per-emission latency), collectors=1 as the engine-overhead headline, hosted CI as smoke-grade, and the telemetry unset-vs-noop evidence behind the null-fast-path claim. |
| `/docs/store6/guides/swift` | Store 6 from Swift | new | The iOS surface contract: shallow sealed hierarchies bridging to exhaustive Swift enums (StoreError six cases, StoreResult four), suspend/Flow-only operational surface, Duration flattening in ObjC, per-module target subsets, and the committed ObjC/SKIE dumps diffed on every PR as the verification mechanism behind the stability commitment. |

### Store 6 — Mutations (experimental) (`store6-mutations`)

The largest undocumented surface (~40 public types across three artifacts, zero site pages today) and the thing a Store 5 MutableStore user most needs. Its own subtree, entered after the read path is understood, sequenced in adoption order: model → quickstart → mutators → UI → server → conflicts → drain/restart → journal storage → inspection → testing. Every page carries the experimental/alpha banner per STABILITY.md §8 and states the two-step ack posture where relevant; the model page lives at the folder root so /docs/store6/mutations is itself the entry.

| Route | Title | Disposition | Purpose |
|---|---|---|---|
| `/docs/store6/mutations` | Mutations: the journalled write path | new | The model in one page: typed intents through a registry, durable journal, optimistic overlay on stream (origin OVERLAY; get deliberately unprojected), idempotent drains to your server, adopt-then-retire acks — with the alpha posture, gated graduation, and the crash-window/idempotency requirement stated up front, plus explicit tier statements for store6-mutations-sqldelight and store6-mutations-testing. |
| `/docs/store6/mutations/quickstart` | Mutations quickstart | new | A full worked mutationStore(...) example: the five required factory inputs (registry, server, keyResolver, valueCodecVersion, valueCodec), the configure lambda's core-Store doors (and the deliberate absence of an overlay door), a one-line resolver for identity-reconstructible keys, first mutate + drain, and observing the OVERLAY→SOT flip on stream. The Store 6 successor to the Store 5 two-part CRUD walkthrough. |
| `/docs/store6/mutations/mutators` | Authoring mutators | new | The registry shapes (mutator/update/create/delete/upsert), the presence algebra (null means decline, Absent means delete), purity/determinism/non-blocking rules for project and stales with the terminal consequence of violating them, typed refs and ownership validation, and args codec versioning with append-only migration discipline. |
| `/docs/store6/mutations/pending-write-ui` | Pending-write UI | new | Rendering optimistic state honestly: key the saving affordance on origin == OVERLAY (never isStale — overlay frames are unconditionally fresh), narrate the OVERLAY→SOT flip, remember get never sees pending writes so observing your own write requires stream, and use pending()/events for richer affordances. |
| `/docs/store6/mutations/server` | Implementing a MutationServer | new | The app-owned transport contract: push with generation-stable idempotency keys across the crash window (retries after an ack-window crash re-send the same push — endpoints must be idempotent or keyed by mutation identity), conflict signalling only via the sanctioned StoreResults.conflict throw, Present vs Absent acks (canonical-key rekeying; the Absent-ack deletion-coherence obligation on later fetches), and retire checkpoint monotonicity. |
| `/docs/store6/mutations/conflicts` | Conflict resolution | new | The optional conflicts block: pure precondition selector (runs once per prepared generation, never on transport retry), merge returning Retry(presence) (new generation, new idempotency key) or ServerWins, server-wins as the non-removable terminal without a merge, and the three-identical-receipt park bound. |
| `/docs/store6/mutations/drain-and-restart` | Draining, offline, and restart | new | Keyed vs global drain semantics (idempotent foreground passes, FIFO by durable client sequence, namespace ownership), durable identity as exactly the (namespace, canonicalId) pair, the key resolver as the restart-safety requirement with verbatim exact-pair validation, hydration from a durable journal after process death, and internal-only backoff (drain overrides it; no public policy door). |
| `/docs/store6/mutations/journal-storage` | Journal storage | new | The in-memory default (no restart durability — offline-queue semantics require a durable journal) versus SqlDelightMutationJournalStorage (driver/transacter pairing on one database, adapter-owned sidecar schema with its own version table, synchronous-driver-only limitation), plus implementing custom storage behind the delicate opt-in (nine frozen record types, non-suspending exception-atomic transaction door, enum names not ordinals, bytes copied both directions). |
| `/docs/store6/mutations/inspection` | Inspection and observability | new | Durable truth (pending/pendingWrites/deadLetters, the five public pending states, terminal dead letters) versus lossy advisory telemetry (events with DROP_OLDEST and no replay, poisoned) — never build settlement logic on events — plus the normalized failure taxonomy and its sanitization bounds. |
| `/docs/store6/mutations/testing` | Testing mutations | new | Certifying custom journal storage with MutationJournalStorageContractKit plus the deterministic kill-point crash scenarios, and proving projector purity with MutatorPurityContractKit (samples, ambient probes, why snapshotValue exists given Present's deliberate lack of structural equality). |
| `/docs/store6/mutations/aliases` | Aliases and canonical rekeying | new | Gap-fill addition (coverage audit, high severity): the consumer-side alias/canonical rekeying lifecycle. Outline in §5 (gap-fill). |

### Migrating to Store 6 (`store6-migration`)

The single largest missing audience path. STABILITY.md commits to side-by-side store5.*/store6.* coordinates and interop for all of 6.x and names the 5→6 and 4→6 guides as GA launch gates. Migrators arrive with a seven-component vocabulary; they get an explicit mapping table and a screen-at-a-time guide instead of edits to the frozen Store 5 tree. Linked from /docs, the version switcher area, and the Store 6 overview; these pages anchor every keep-frozen disposition below.

| Route | Title | Disposition | Purpose |
|---|---|---|---|
| `/docs/store6/migration/from-store5` | Migrating from Store 5 | new | The screen-at-a-time migration guide: side-by-side coordinates with no flag day (Store 5 is not end-of-life), translating StoreReadResponse habits into origin + isStale + refreshing, what Store 6 now does for you (deduplication, freshness, bounded memory), interop support, and where MutableStore users go (the experimental mutations path, honestly tiered). |
| `/docs/store6/migration/component-map` | Store 5 component → Store 6 map | new | The seven-component translation table: Fetcher/SourceOfTruth/Converter collapse into fetcher + persistence seams (no Converter seam exists — mapping lives in the callbacks); Validator's job is absorbed by native freshness; MutableStore + Updater map to mutationStore and drain/ack; Store 5's failed-sync Bookkeeper maps to the mutations journal and inspection surfaces, distinct from Store 6's engine-owned freshness Bookkeeper — with per-row links into the pages that teach each replacement. |
| `/docs/store6/migration/from-store4` | Migrating from Store 4 | new | The 4→6 path STABILITY.md names as a GA launch gate: what changed across two majors and how the 5→6 mapping applies from a Store 4 starting point. Ships thin initially and grows toward GA; honestly labeled as in progress until then. |

### Store 6 — Project and policy (`store6-project`)

The policy and planning pages that anchor trust: what each artifact promises, where the line is going, and how to contribute. All three already exist as sync-owned routes; they group here via meta.json and are linked from the overview and the Project top-nav item. They are the authority for every tier claim elsewhere on the site.

| Route | Title | Disposition | Purpose |
|---|---|---|---|
| `/docs/store6/stability` | Stability policy | sync-owned | The artifact-to-tier table, the three opt-in markers, deprecation cycle, verification-from-a-released-tag mechanics, the mutations alpha posture, and the OVERLAY-vs-isStale consumer guidance. Synchronized from Repo A STABILITY.md. |
| `/docs/store6/roadmap` | Roadmap | sync-owned | Operating principles as commitments, the release train with target windows and ranges, cut-scope-never-cadence, and the gated (never date-driven) mutations graduation. Synchronized from Repo A ROADMAP.md. |
| `/docs/store6/contributing` | Contributing | sync-owned | Fork/clone workflow, issue and PR conventions. Synchronized from Repo A CONTRIBUTING.md; the stale fork link is corrected in Repo A and re-pinned, never patched on site. |

### API reference (`reference`)

Generated per-symbol reference lives at /reference/store6-<module>/ per the placeholder pages' own stated replacement contract: when the build provides an Android SDK, each module's Dokka output replaces its placeholder directory in place — same paths, no new routes, no redirects. Dokka is wired into the repo's conventions, so 'revise' means executing that contract; additional module lanes are future additive decisions following the same directory pattern.

| Route | Title | Disposition | Purpose |
|---|---|---|---|
| `/reference/store6-core/index.html` | store6-core API reference | revise | Today an honest placeholder stating that generated documentation is unavailable and pinning the replacement contract (:store6-core:dokkaHtml → public/reference/store6-core/). Revise by dropping real Dokka output into the directory per that contract; the top-nav Reference item already targets this page. |
| `/reference/store6-mutations/index.html` | store6-mutations API reference | revise | The mutations twin of the core placeholder, carrying the same replacement contract (:store6-mutations:dokkaHtml → public/reference/store6-mutations/). Revise by executing it, experimental banner intact; cross-links to core and back to the guides stay. |

### Store 5 — Legacy documentation (frozen) (`store5-legacy`)

The migrated Store 5 tree stays byte-frozen at its exact routes (port-page:generate owned; zero-redirect; ledger-enforced — hand edits break reconciliation). It remains reachable through the version switcher and the /docs Store 5 track, labeled legacy via meta.json only. Each page names its Store 6 successor here; the 15 never-authored stubs are preserved solely as live URLs, with no successor manufactured where none was demanded.

| Route | Title | Disposition | Purpose |
|---|---|---|---|
| `/docs/concepts/store5/overview` | Store 5 concepts overview | keep-frozen | Index of the eight Store 5 foundation components. Frozen; successors are /docs/store6/overview and /docs/store6/migration/component-map. |
| `/docs/concepts/store5/store` | Store (Store 5) | keep-frozen | Store 5 core interface and RealStore internals. Frozen; successor is /docs/store6/concepts/read-contract. |
| `/docs/concepts/store5/mutable-store` | MutableStore (Store 5) | keep-frozen | Store 5 write API and conflict machinery. Frozen; successor is the /docs/store6/mutations subtree. |
| `/docs/concepts/store5/source-of-truth` | SourceOfTruth (Store 5) | keep-frozen | Store 5 persistence interface. Frozen; successor is /docs/store6/guides/persistence plus the adapter pages. |
| `/docs/concepts/store5/fetcher` | Fetcher (Store 5) | keep-frozen | Store 5 Fetcher and FetcherResult hierarchy with fallback chains. Frozen; successor is /docs/store6/guides/fetchers. |
| `/docs/concepts/store5/updater` | Updater (Store 5) | keep-frozen | Store 5 outbound-sync component. Frozen; its job is absorbed by /docs/store6/mutations/server and /docs/store6/mutations/drain-and-restart, mapped explicitly in the component map (no standalone analog). |
| `/docs/concepts/store5/bookkeeper` | Bookkeeper (Store 5) | keep-frozen | Store 5 failed-sync bookkeeping. Frozen; the component map explains how the mutations journal and inspection surfaces replace it — the least obvious mapping, called out there as distinct from Store 6's engine-owned freshness Bookkeeper. |
| `/docs/concepts/store5/validator` | Validator (Store 5) | keep-frozen | Store 5 custom-freshness hook. Frozen; absorbed by native freshness policies (/docs/store6/concepts/freshness, important-defaults), noted in the component map. |
| `/docs/concepts/store5/converter` | Converter (Store 5) | keep-frozen | Store 5 type-bridging component. Frozen; the type-boundary story lives inside /docs/store6/guides/fetchers and /docs/store6/guides/persistence (no converter seam exists), mapped in the component map. |
| `/docs/use-cases/store5/overview` | Store 5 use cases overview | keep-frozen | Index of mostly never-authored stubs (with one dead link). Frozen as-is; Store 6 guide discovery lives in the revised overview and the guides subtree. |
| `/docs/use-cases/store5/setting-up-store-for-crud-operations` | Setting up Store for CRUD (Store 5) | keep-frozen | Part 1 of the Store 5 CRUD walkthrough. Frozen; successors are /docs/store6/mutations/quickstart and /docs/store6/mutations/mutators. |
| `/docs/use-cases/store5/implementing-crud-operations-in-store` | Implementing CRUD in Store (Store 5) | keep-frozen | Part 2 of the CRUD walkthrough — the clearest showcase of the assembly burden Store 6 removes. Frozen; the mutations quickstart shows what the four hand-assembled components collapsed into. |
| `/docs/use-cases/store5/advanced-caching-strategies` | Advanced caching strategies (stub) | keep-frozen | Never-authored stub. Frozen; territory delivered by /docs/store6/important-defaults and /docs/store6/concepts/memory-and-lifecycle. |
| `/docs/use-cases/store5/authentication-and-secure-data-access` | Authentication and secure data access (stub) | keep-frozen | Never-authored stub; auth integration is orthogonal to the Store core. Frozen, no successor planned. |
| `/docs/use-cases/store5/data-synchronization-and-conflict-resolution` | Data synchronization and conflict resolution (stub) | keep-frozen | Never-authored stub for territory core to Store 6 mutations. Frozen; successors are /docs/store6/mutations/server, /docs/store6/mutations/conflicts, and /docs/store6/mutations/drain-and-restart. |
| `/docs/use-cases/store5/ensuring-data-integrity-and-freshness` | Ensuring data integrity and freshness (stub) | keep-frozen | Never-authored stub. Frozen; delivered by /docs/store6/concepts/freshness and /docs/store6/invalidate-vs-clear. |
| `/docs/use-cases/store5/error-handling-and-retry-strategies` | Error handling and retry strategies (stub) | keep-frozen | Never-authored stub. Frozen; successor is /docs/store6/concepts/errors (typed failures, servedStale rendering, retry-in-fetcher). |
| `/docs/use-cases/store5/handling-complex-data-relationships` | Handling complex data relationships (stub) | keep-frozen | Never-authored stub. Frozen; adjacent territory covered by /docs/store6/key-design; deeper work is net-new editorial scope, not a migration obligation. |
| `/docs/use-cases/store5/implementing-fallback-mechanisms-to-enhance-resilience` | Fallback mechanisms (stub) | keep-frozen | Never-authored stub. Frozen; the fallback story lives inside /docs/store6/guides/fetchers. |
| `/docs/use-cases/store5/integrating-store-with-state-management-libraries-like-redux` | Store with Redux-style state management (stub) | keep-frozen | Never-authored, niche stub. Frozen; reactive consumption is covered by /docs/store6/concepts/read-contract and /docs/store6/compose; no successor planned. |
| `/docs/use-cases/store5/integration-with-jetpack-compose-and-swift-ui` | Compose and SwiftUI integration (stub) | keep-frozen | Never-authored stub. Frozen; the Compose half is delivered by /docs/store6/compose and the Swift surface by /docs/store6/guides/swift. |
| `/docs/use-cases/store5/migrating-from-existing-data-layers` | Migrating from existing data layers (stub) | keep-frozen | Never-authored stub for the site's most in-demand missing page. Frozen; successor is the /docs/store6/migration subtree — the highest-priority successor page set in this plan. |
| `/docs/use-cases/store5/offline-first-data-access-with-store-and-sql-delight` | Offline-first with SQLDelight (stub) | keep-frozen | Never-authored stub. Frozen; delivered by /docs/store6/sqldelight and, for durable writes, /docs/store6/mutations/journal-storage. |
| `/docs/use-cases/store5/pagination-and-infinite-scrolling` | Pagination and infinite scrolling (stub) | keep-frozen | Never-authored stub. Frozen; a Store 6 paging story is a roadmap-scoped feature (store6-paging-androidx tracks to 6.0.0), documented when the artifact ships — not a doc port. |
| `/docs/use-cases/store5/real-time-data-updates` | Real-time data updates (stub) | keep-frozen | Never-authored stub. Frozen; streaming-source patterns belong in /docs/store6/guides/fetchers; no dedicated successor planned. |
| `/docs/use-cases/store5/security-and-data-encryption` | Security and data encryption (stub) | keep-frozen | Never-authored stub; encryption lives in the persistence implementation the user brings. Frozen, no successor planned. |
| `/docs/use-cases/store5/testing-store-and-its-components` | Testing Store and its components (stub) | keep-frozen | Never-authored stub. Frozen; delivered concretely by /docs/store6/guides/testing over the real store6-testing artifact this stub never had, plus /docs/store6/mutations/testing. |
| `/docs/use-cases/store5/working-with-non-paginated-lists` | Non-paginated lists / StoreMultiCache (stub) | keep-frozen | Never-authored stub around a Store 5-only API. Frozen; whether Store 6's projection/alias machinery serves list decomposition is a roadmap design question, not a doc port. |
| `/docs/best-practices/store5/overview` | Store 5 best practices overview | keep-frozen | One-link index for the frozen best-practices tree. Frozen; a Store 6 best-practices grouping grows from real guides on its own terms. |
| `/docs/best-practices/store5/single-or-multiple-stores` | Single or multiple Stores (Store 5) | keep-frozen | The one substantive, largely version-agnostic architecture guide, frozen in its Store 5 form (Trails example, mintcdn flowchart). Its transferable reasoning is carried forward with Store 6 idioms (namespaces, per-call freshness, typed failure isolation) inside /docs/store6/key-design and the migration guide rather than by editing this page. |

## 4. Judge decisions

The synthesis judge's record of every consequential IA choice:

**4.1 Base proposal for synthesis** — Start from Proposal 1's newcomer-first spine (entry → start → concepts → guides → mutations → migration → project → reference → legacy) and graft Proposal 2's task-first guide framing and sync-owned Room page plus Proposal 3's contract-precision discipline (harness-pin atomicity, unpinned internals, Dokka-only reference).

*Rationale:* P1 scored highest overall (42/50) with the strongest learnability and coherence; P2's best ideas are maintenance wins (Room in the sync lock, consolidated read-contract page); P3's strengths are principles and per-page precision rather than its 50-plus-new-page structure, which is impractical for an alpha-stage library.

**4.2 Room adapter page ownership and slug** — Add /docs/store6/room as a sync-owned page generated from store6-room/README.md via a new (11th) entry in evidence/T4-store6-source-lock.json, at the flat slug matching its compose and sqldelight siblings — rejecting P1's hand-authored /docs/store6/guides/room.

*Rationale:* Hand-authoring a page that mirrors a README guarantees drift; the sync pipeline already handles exactly this shape for the sqldelight and compose READMEs, and the flat slug keeps the three adapter walkthroughs at one depth with one ownership model. This is the only ownership conversion in the plan (a new route entering sync ownership; no existing sync-owned page is converted away).

**4.3 Read-contract page consolidation** — Merge P1's origins page and P3's results-and-origins page into a single /docs/store6/concepts/read-contract covering stream/get, the four kinds, origins, conflation, servedStale, and close().

*Rationale:* One citable home for the read contract beats three partial ones; the four kinds and their origins are inseparable in practice (P2 demonstrated the consolidation works), and it trims a route plus its search-pin churn.

**4.4 No standalone seams section** — Reject P3's eight-page seam-contract section; distribute seam contracts to the pages where users actually meet them — Fetcher/FetcherResult in guides/fetchers, SourceOfTruth/Transactional in guides/persistence, FreshnessValidator in concepts/freshness, Overlay in the mutations pages, StoreRuntime/StoreWriteHandle/KeyEvents/telemetry in guides/extending and guides/devtools.

*Rationale:* The seam is @ExperimentalStoreApi and a freeze candidate; implementers are a small audience, and eight contract pages at alpha would freeze prose against a surface that may still move. Each host page still states the full contract and points at the certifying kit, preserving P3's precision without its page count.

**4.5 Mutations journal coverage** — One /docs/store6/mutations/journal-storage page covering the in-memory default, the SqlDelight adapter, and custom-storage implementation (P2's shape), instead of P1's SqlDelight-only page or P3's separate journal-and-ack page; the ack-path crash window is taught in the mutations overview and server pages where its consequence (idempotent endpoints) lands.

*Rationale:* The storage choice is one decision with three options — splitting it forces readers to reassemble it; the ack ordering is a server-contract fact, not a storage fact, so it lives where the server implementer reads.

**4.6 Devtools page count** — One guides/devtools page covering logger, monitor, v0 event vocabulary, and the inspector, rather than P3's three-page split (overview / events-reference / inspector).

*Rationale:* Both devtools artifacts target alpha02 and EVENTS.md v0 is explicitly not a stable wire format; one page with a vocabulary section documents honestly without freezing a normative reference around an unstable grammar. Split later if v0 graduates.

**4.7 Testing page count** — One two-tier guides/testing page (FakeStore for ViewModels; seam fakes composed into a real store for policy tests; contract kits for certification) plus a separate mutations/testing page — rejecting P2's four-page testing subtree.

*Rationale:* The two-tier split is the module's own design and teaches best as one contrast; the mutations kits serve a different audience (storage implementers, mutator authors) inside the mutations subtree. Four routes for one experimental artifact is premature at alpha.

**4.8 API reference scope** — Keep exactly the two existing /reference lanes (core, mutations) as revise-in-place per the placeholder pages' stated Dokka replacement contract; defer P3's eight additional module lanes to separate additive decisions per module.

*Rationale:* The placeholders pin the replacement mechanics for these two modules only; each new lane trips T8-extras and the reference guard, and shipping eight more placeholders before any real Dokka output exists inverts the honesty posture. The directory pattern is recorded so future lanes are mechanical.

**4.9 No index pages for concepts/guides** — Do not create /docs/store6/concepts or /docs/store6/guides index routes; the revised overview's Start-here list and new meta.json groupings carry navigation.

*Rationale:* Every added route updates T8-extras.txt and the pinned 54-count search index; index pages duplicate the overview's job while adding pin churn. P1's spine survives via the one-next-link convention instead.

**4.10 One-store-or-many successor** — No dedicated Store 6 topology guide at alpha (rejecting P2/P3's guides/one-store-or-many); the frozen Store 5 guide stays reachable, and its transferable reasoning is folded into key-design (via Repo A edits + lock re-pin) and the migration guide. Revisit as a dedicated page at beta.

*Rationale:* key-design already owns namespaces-as-blast-radius, the load-bearing half of the topology decision; a thin new page would mostly restate it while adding route and pin overhead.

**4.11 Platform-support page** — Do not adopt P2's consolidated /docs/store6/platforms page; target matrices live on each adapter page, STABILITY.md (synced), and the new guides/swift page.

*Rationale:* A hand-authored consolidated matrix would drift against per-module READMEs that are already synced or mirrored; the Swift guide covers the one platform story with no existing home.

**4.12 Migration subtree** — Three pages under /docs/store6/migration: from-store5, component-map, and a reserved from-store4 that ships thin and honestly labeled in progress.

*Rationale:* STABILITY.md names both guides as GA launch gates and commits to side-by-side coordinates; the component map is the artifact migrators actually search for, and reserving from-store4 now means the subtree ships complete without inventing content.

**4.13 Entry-surface strategy** — Revise only the two hand-authored, un-ledgered surfaces (/ and /docs) and re-point lib/nav.ts primaryNavItems (Start → /docs/store6/overview, Reference stays on the placeholder); every ported Store 5-era top page keeps its frozen bytes and live URL.

*Rationale:* Ported pages are port-page:generate owned — hand edits break ledger reconciliation — and the zero-redirect gate fails on any move; the two hand-authored pages plus nav config are the only safe levers, and they are sufficient.

**4.14 Harness-pin atomicity** — Every change batch that adds or revises routes must update, in the same change: evidence/T8-extras.txt, the 54-count search pin in verify-search-index.mjs and t5-search-contract.test.mjs, T3_OVERVIEW_SHA256 when the overview changes, the T7 hero pins when the home page changes, the sync lock + owned-targets ledger for any sync-owned addition, and the llms.txt census when Repo A's llms.txt gains links.

*Rationale:* The site's four test harnesses enumerate exact censuses and byte-pins; partial updates leave CI red and block the pipeline, so the plan encodes atomicity as an execution rule rather than discovering it per PR.

**4.15 Sync-owned page set** — All nine existing sync-owned pages remain sync-owned (quickstart, important-defaults, key-design, invalidate-vs-clear, stability, roadmap, contributing, compose, sqldelight), joined by room; no page converts to hand-authored.

*Rationale:* Repo A is the single source of truth with provenance discipline and CI-compiled code blocks; converting any page to hand ownership would reintroduce the drift the lock exists to prevent.

**4.16 Alpha-stage page budget** — 26 new routes total (5 concepts, 8 guides including sync-owned room, 10 mutations, 3 migration), bringing the Store 6 tree from 10 to 36 pages alongside 2 reference revisions and 3 revised entry surfaces.

*Rationale:* Mutations alone is ~40 undocumented public types across three artifacts and justifies its 10 pages; everything else was trimmed against P2/P3's larger counts (no index pages, no seams section, single testing/devtools pages, deferred reference lanes) to keep the buildout executable within the alpha window.

**Panel scoring:** Proposal 1 (newcomer-first spine): coverage 8, learnability 9, maintenance/sync cost 7, constraint compliance 9, coherence with existing 10 pages 9 — total 42/50. Strongest single path and cleanest use of existing slugs; weaknesses: hand-authored Room page duplicating a README, devtools/testing slightly compressed. Proposal 2 (task-first working engineer): coverage 9, learnability 8, maintenance 7, compliance 8, coherence 9 — 41/50. Best maintenance ideas (Room via sync lock, consolidated read contract, explicit successor naming on every frozen page); weaknesses: 13 sections and a 4-page testing subtree oversized for alpha. Proposal 3 (precision-first contract surface): coverage 10, learnability 7, maintenance 5, compliance 8, coherence 9 — 39/50. Deepest and most accurate per-page contracts and the best principles (harness-pin atomicity, unpinned internals); weaknesses: ~50 new pages including an 8-page seams section and 8 speculative Dokka lanes — the highest drift and execution risk at this stage. Synthesis: P1 skeleton + P2 grafts (sync-owned room, read-contract merge, successor mapping) + P3 grafts (pin-atomicity principle, distributed seam precision, Dokka-only reference), landing at 9 sections and 78 page entries (52 existing + 26 new).

---

## 5. Page outlines

One subsection per IA section; every page's outline includes heading skeleton, content notes, snippet plans with verified anchors, admonitions, and cross-links. Anchors were verified against Store6 @ `a6a156e9`.


<!-- ================================================================ -->

# Section outlines — Site entry points (`entry`)

# Section: Site entry points (entry) — per-page outlines

All Repo B paths are relative to `/Users/matt/src/matt-ramotar/store-docs`. All Repo A paths are
relative to `/Users/matt/src/matt-ramotar/Store6`. Every anchor below was read and verified on
2026-08-10 against Repo A main @ a6a156e9 and the Repo B working tree.

---

## /

- **Title:** Store — home
- **Disposition:** revise
- **Audience:** Everyone; first-contact newcomers
- **Purpose:** Hand-built hero already branded Store 6 (HeroThesis + KeyEngineTrace). Revise CTAs to
  lead to /docs/store6/overview and /docs/store6/quickstart as the single entry to the newcomer
  spine; keep the pinned trace strings or update the T7 hero pins in the same change.
- **Sources:** store-docs/app/page.tsx; store-docs/components/hero/HeroThesis.tsx;
  store-docs/components/hero/KeyEngineTrace.tsx; store-docs/scripts/t7-static-hero.test.mjs

### Page skeleton (component sections, not prose headings)

- **Hero thesis (HeroThesis, revised)**
  - Keep the h1 exactly as shipped: "Offline is just another origin." (HeroThesis.tsx:14; the built
    HTML asserts this exact h1 text, t7-static-hero.test.mjs:242).
  - Keep the supporting paragraph's claim as-is — it is true of the library: under the default
    freshness validator, `Freshness.CachedOrFetch` can keep an invalidated persisted value visible
    while a refresh runs (HeroThesis.tsx:17-19; library source: Freshness.kt:13-17 — invalidated
    values are served as stale while one background revalidation runs).
  - Revise the CTA block: primary CTA "Read the docs" → `/docs/store6/overview` (unchanged target,
    HeroThesis.tsx:23); ADD a secondary CTA → `/docs/store6/quickstart` labeled for the build-first
    reader (for example "Build your first store"). No third link; the hero remains the single entry
    to the newcomer spine.
- **KeyEngine trace (KeyEngineTrace, kept byte-stable)**
  - Keep the static SVG trace exactly as shipped: cold subscription after restart hydrates a durably
    invalidated persisted row, requests an unconditional fetch with etag null, emits
    `Data(origin=Origin.SOT, isStale=true, refreshing=true)`, then
    `Error(StoreError.Fetch, servedStale=true)` after `Bookkeeper.recordFailure`, with no Loading
    intervening and the stream remaining live (KeyEngineTrace.tsx:1-2, 20-28).
  - Both result strings are semantically accurate against the library: Data carries value/origin/
    age/isStale/refreshing (StoreResult.kt:19-37); `servedStale = true` means an invalidated
    resident was served and its refresh failed under CachedOrFetch or StaleIfError
    (StoreResult.kt:62-69); a non-MustBeFresh failure leaves the stream live (Store.kt:21-27).
  - No changes to the trace or its accessibility contract (labelled region, title/desc ids,
    overflow behavior) — the pinned strings stay byte-identical.
- **Implementation note (not page content): T7 harness updates required by the CTA change**
  - t7-static-hero.test.mjs:244 asserts the built `main` contains exactly one `<a>`; adding the
    quickstart CTA requires raising that census (and adding a matching
    `a[href="/docs/store6/quickstart"]` assertion) in the same change.
  - t7-static-hero.test.mjs:88 asserts exactly one `/docs/store6/overview` href in the public
    source — still satisfied; leave it pinned.
  - The pinned exact strings EXACT_DATA / EXACT_ERROR (t7-static-hero.test.mjs:14-15) and the
    contrast-token checks (:209-227) are untouched by this revision.
- **Planned admonitions:** none — the home page carries no callouts.
- **Planned diagrams:** the existing KeyEngineTrace SVG is the page's only diagram; no new diagram.
- **Cross-links:** /docs/store6/overview (primary CTA), /docs/store6/quickstart (new CTA). No other
  links, by test contract.

---

## /docs

- **Title:** Store documentation home
- **Disposition:** revise
- **Audience:** Everyone arriving at /docs
- **Purpose:** Replace the MDX/HeroUI scaffold smoke-test (content/docs/index.mdx is literally
  titled "Scaffold smoke test for MDX and HeroUI integration") with a real two-track router:
  Store 6 (start here) and Store 5 (maintained legacy). It remains the Store 5 version-switcher
  target (lib/nav.ts:30) and the sidebar "Docs home" root, so it must serve both audiences.
- **Sources:** store-docs/content/docs/index.mdx; store-docs/lib/nav.ts; Repo A STABILITY.md;
  Repo A README.md

### Page skeleton

- **Intro paragraph (no H1 in body; frontmatter title "Store documentation")**
  - One sentence: Store is a Kotlin Multiplatform library for reading and writing data that lives
    in more than one place — a network, a local database, and memory (mirrors README.md:9-13).
  - One sentence naming the two tracks and that both are maintained: Store 6 is the next major
    line; Store 5 continues under its own coordinates for the whole 6.x major (STABILITY.md:106).
- **H2: Store 6 — start here**
  - Status stated plainly, never rounded up: in development, targeting 6.0.0-alpha01; nothing is
    published yet (README.md:15). Do not print install coordinates on this page.
  - Link list with one-line descriptions (vocabulary reusable from Repo A llms.txt:12-24):
    - /docs/store6/overview — what Store 6 is and where to start.
    - /docs/store6/quickstart — the five-line store and the full runnable program.
    - /docs/store6/important-defaults — every zero-config behavior, each line traceable to a named
      conformance test.
    - /docs/store6/migration/from-store5 — migrate a screen at a time; coordinates live side by
      side, no flag day (STABILITY.md:106-107).
- **H2: Store 5 — maintained legacy**
  - States that Store 5 docs remain available and Store 5 is not end-of-life: `store5.*` and
    `store6.*` coordinates live side by side for the whole 6.x major, and `store6-store5-interop`
    is supported for all of 6.x (STABILITY.md:106-110). Never phrase Store 5 as deprecated.
  - Link list: /docs/meet-store (Store 5 landing), /docs/intro (why Store), /docs/quickstart
    (build your first Store 5 store), /docs/concepts/store5/overview (component reference).
- **H3: Which track am I on?**
  - Two-line router: new project → Store 6 track; existing Store 5 app → keep the Store 5 docs and
    read /docs/store6/migration/from-store5 when ready. The 5→6 and 4→6 migration guides ship with
    the migration — they are launch gates for 6.0.0 (STABILITY.md:109-110).
- **H2: Project**
  - Links: /docs/store6/stability (API tiers, deprecation cycle, cadence, verification),
    /docs/store6/roadmap, /docs/community/overview (talks cover both Store generations).
- **Planned admonitions:**
  - One callout in the Store 6 section: "Store 6 is in development targeting 6.0.0-alpha01; nothing
    is published yet. The store6-core API is not frozen until the beta01 freeze candidate."
    (README.md:15, STABILITY.md:47). No other callouts.
- **Planned code snippets:** none. This page routes; it does not teach.
- **Implementation notes (not page content):**
  - /docs is a fixed extra keyed to content/docs/index.mdx (scripts/t8-verification.mjs:26);
    editing the file in place keeps the route census intact. The page is hand-authored scaffold and
    is in no generated-output ledger, so it is freely editable.
  - The page stays in the Store 5 sidebar tree because belongsToVersion classifies every
    non-/docs/store6 path as store5 (lib/nav.ts:83-86); it must remain the Store5 version-switcher
    target (lib/nav.ts:30).
  - The built search index pins exactly 54 raw results for the query "fetcher"
    (scripts/verify-search-index.mjs:42, re-pinned by scripts/t5-search-contract.test.mjs). If the
    new copy uses the word "fetcher", both pins must be updated in the same change; the outline
    above avoids the word.
- **Cross-links:** /docs/store6/overview, /docs/store6/quickstart, /docs/store6/important-defaults,
  /docs/store6/migration/from-store5, /docs/store6/stability, /docs/store6/roadmap,
  /docs/meet-store, /docs/intro, /docs/quickstart, /docs/concepts/store5/overview,
  /docs/community/overview.

---

## /docs/meet-store

- **Title:** Meet Store (Store 5)
- **Disposition:** keep-frozen
- **Audience:** Store 5 users (legacy)
- **Purpose:** Ported Store 5-era landing page (Kotlin Foundation / MNF backing). Frozen legacy
  bytes, port-page:generate owned; reachable from the Store 5 track.
- **Sources:** store-docs/content/docs/meet-store.mdx

### Current content structure (kept as-is)

- Frontmatter: title "Meet Store", description "Store is our solution for working with data in
  Kotlin…" (meet-store.mdx:1-4).
- Mintlify-CDN hero image (meet-store.mdx:6).
- H2 "Get started" followed by three H2 link headings (meet-store.mdx:8-20):
  - "[Intro to Store](/docs/intro)" — explore capabilities and development flow.
  - "[Quickstart](/docs/quickstart)" — first Store in minutes.
  - "[Cookbook](https://store.mobilenativefoundation.org/cookbook/overview)" — external examples.
- H2 "Backed by" with Kotlin Foundation and Mobile Native Foundation logo images and H2 link
  headings (meet-store.mdx:22-34).

### Disposition rationale

The file's bytes are owned by the port-page:generate ledger entry
(evidence/T4-owned-targets.json:76) and are regenerable only from the pinned live snapshot; a hand
edit does not survive — reconcileOwnedOutputs (generated-output-transaction.mjs:45-58) stages and
overwrites currently-owned outputs unconditionally, so the edit is silently replaced on the next
generate run rather than detected and blocked (no byte-verifying --check is wired to the
port-page:generate owner today). The live URL
(evidence/live-url-inventory.txt:16) must keep serving HTTP 200 with no redirect. The page's
in-track links (/docs/intro, /docs/quickstart) both remain live frozen routes, so freezing this
page leaves no dead ends. Its navigational job for newcomers is superseded by the revised /docs
router and the / hero, which point to the Store 6 spine; this page remains the Store 5 track's own
landing.

---

## /docs/intro

- **Title:** Why Store? (Store 5)
- **Disposition:** keep-frozen
- **Audience:** Store 5 users (legacy)
- **Purpose:** Ported Store 5 overview and current "Start" top-nav destination. Frozen; the top-nav
  Start link is re-pointed to /docs/store6/overview via lib/nav.ts while this route keeps serving
  200.
- **Sources:** store-docs/content/docs/intro.mdx; store-docs/lib/nav.ts

### Current content structure (kept as-is)

- Frontmatter title "Why Store?" plus a lead paragraph on simplifying data management
  (intro.mdx:1-5).
- Flat run of ~20 H2 sections, each one short marketing-register paragraph (intro.mdx:7-85):
  Unified and Efficient Data Management; Unified Data Flow; Smart Caching; Full CRUD Support
  (MutableStore, intro.mdx:21); Flexible Data Conversion (Converter, :25); Powerful Data
  Synchronization; Offline-First Architecture; Request Deduplication; Conflict Resolution
  (Bookkeeper, :41); Flexible Data Validation (Validator, :45); Reactive and Responsive
  Applications; Real-Time Updates; Thread-Safe Operations; Loading State Management; Graceful
  Error Handling; Production-Ready At Any Scale; Modular Architecture; Integration-Friendly;
  Kotlin Multiplatform Support; Community and Support.

### Disposition rationale

The bytes are port-page:generate owned (evidence/T4-owned-targets.json:72) and the URL is
inventoried, so the route must keep serving 200 unredirected. The page speaks the Store 5 component
vocabulary (MutableStore, Converter, Bookkeeper, Validator), which Store 6 replaces with native
per-call freshness (Freshness.kt:12-52) and the seam model — so it stays as legacy-track content
rather than being rewritten. The only change in this IA is external to the file: the "Start"
primary-nav item currently targets /docs/intro (lib/nav.ts:15) and is re-pointed to
/docs/store6/overview in lib/nav.ts, leaving this route reachable from /docs/meet-store and the
Store 5 sidebar.

---

## /docs/quickstart

- **Title:** Store 5 quickstart
- **Disposition:** keep-frozen
- **Audience:** Store 5 users (legacy)
- **Purpose:** Ported "build your first Store" walkthrough for Store 5 (Trails sample). Frozen;
  also the page whose built HTML the search verifier inspects for the search-trigger aria
  contract, so its bytes are load-bearing.
- **Sources:** store-docs/content/docs/quickstart.mdx; store-docs/scripts/verify-search-index.mjs

### Current content structure (kept as-is)

- Frontmatter: title "Quickstart", description "Let's build your first Store." (quickstart.mdx:1-4)
  plus Trails-repo note callout.
- H2 "Prerequisites" — KMP setup, coroutines/Flow, Gradle quick links (quickstart.mdx:14-24).
- H2 "Installation" — two-step StepsGroup: add
  `org.mobilenativefoundation.store:store5` version `5.1.0` via version catalog
  (quickstart.mdx:34-48), then Gradle sync.
- H2 "Building a Store" — ten-step StepsGroup (quickstart.mdx:78-658): data models
  (network/SQL/domain tabs), Ktor API interface, converter extension functions, PostStoreFactory
  skeleton with TODO()s, Fetcher.of, SourceOfTruth.of over SQLDelight, Converter.Builder,
  Updater.by, Bookkeeper.by, and the final `MutableStoreBuilder.from(...).build(updater,
  bookkeeper)` assembly (quickstart.mdx:634-641).
- H2 "Using the Store" — four-step StepsGroup (quickstart.mdx:660-872): PostRepository over
  `postStore.fresh`/`get`/`write(StoreWriteRequest)`, Circuit screen/presenter/UI wiring.
- H2 "Next Steps" — links to /docs/challenges-at-scale ("Deep Dive into Store", quickstart.mdx:878),
  /docs/use-cases/store5/overview, and the external Cookbook (quickstart.mdx:874-889).

### Disposition rationale

Beyond ordinary port-ledger freezing (evidence/T4-owned-targets.json:80), this page is doubly
load-bearing: scripts/verify-search-index.mjs reads the built
`.next/server/app/docs/quickstart.html` (verify-search-index.mjs:14) and asserts the closed search
trigger carries `aria-expanded="false"` and no `aria-controls` (verify-search-index.mjs:76-81), and
the same script pins the built search index at exactly 54 raw results for the query "fetcher"
(verify-search-index.mjs:42) — a count this page's repeated use of "fetcher" contributes to. Any
byte change here risks both gates; the Store 6 equivalent lives at /docs/store6/quickstart, so
there is no reader need justifying that risk.

---

## /docs/challenges-at-scale

- **Title:** Challenges at scale (placeholder)
- **Disposition:** keep-frozen
- **Audience:** None (URL preservation only)
- **Purpose:** Empty ported placeholder preserving a live URL. Frozen; excluded from all
  navigation surfaces the IA controls.
- **Sources:** store-docs/content/docs/challenges-at-scale.mdx

### Current content structure (kept as-is)

- Frontmatter only: title "Challenges at scale", description "Coming soon"
  (challenges-at-scale.mdx:1-4). The body is completely empty.

### Disposition rationale

The route exists solely to keep the inventoried live URL (evidence/live-url-inventory.txt:4)
serving 200 without a redirect; its bytes are port-page:generate owned
(evidence/T4-owned-targets.json:28). It is not in primary navigation, but it is a live link target
from the frozen Store 5 quickstart's "Next Steps" section (quickstart.mdx:878), so deleting it
would create a dead end inside frozen content. Nothing should ever be authored here: the promised
"deep dive" territory is delivered by the Store 6 concept pages (read contract, freshness, memory
and lifecycle) instead.

---

## /docs/community/overview

- **Title:** Community resources
- **Disposition:** keep-frozen
- **Audience:** Everyone
- **Purpose:** Ported conference/podcast list and current "Project" top-nav destination. Frozen;
  version-agnostic enough to keep linking from both tracks since its talks cover both Store
  generations.
- **Sources:** store-docs/content/docs/community/overview.mdx

### Current content structure (kept as-is)

- Frontmatter title "Community resources" (community/overview.mdx:1-3).
- Five entries, each a Mintlify-CDN image plus an external H2 link heading plus a venue/year line
  (community/overview.mdx:5-33):
  - "What's in Store?" — KotlinConf, 2019.
  - "Meet Store5" — Droidcon San Francisco, 2023.
  - "Network-Resilient Applications" — Talking Kotlin #128, 2023.
  - "Meet StoreX Paging" — Droidcon San Francisco, 2024.
  - "Modern Paging at Scale" — Droidcon New York, 2024.

### Disposition rationale

Port-page:generate owned bytes (evidence/T4-owned-targets.json:32) behind an inventoried URL
(evidence/live-url-inventory.txt:5). The page is the "Project" primary-nav destination
(lib/nav.ts:26) and its content is a list of external talks spanning Store 4 through StoreX — not
version-bound documentation — so both tracks can keep linking to it unchanged. New Store 6
community material, when it exists, is an editorial decision for the Store 6 tree, not an edit to
this frozen file.

---

## /developer-newsletter/overview

- **Title:** Developer newsletter
- **Disposition:** keep-frozen
- **Audience:** None (URL preservation only)
- **Purpose:** Ported title-only route preserving a live URL. Frozen.
- **Sources:** store-docs/app/developer-newsletter/overview/page.tsx

### Current content structure (kept as-is)

- An app-router page (outside content/docs) rendering AppShell with the full docs page tree, a
  one-entry TOC, an `<h1>` reading "Coming soon", a separator, and an empty `#content` div
  (app/developer-newsletter/overview/page.tsx:8-26). Page metadata title is "Coming soon"
  (page.tsx:11).

### Disposition rationale

One of the two ported outside-content/docs routes counted by the application-page census
(scripts/t8-verification.mjs:173-178); its bytes are port-page:generate owned
(evidence/T4-owned-targets.json:12) and its URL is line 1 of the live inventory
(evidence/live-url-inventory.txt:1). There is no newsletter program to document, so the page stays
a title-only shell; any future newsletter content would be a new editorial decision at this same
path, made by regenerating through the port pipeline or deliberately transferring ledger
ownership — never by hand-editing the owned file.

---

## /release-notes/overview

- **Title:** Release notes
- **Disposition:** keep-frozen
- **Audience:** None (URL preservation only)
- **Purpose:** Ported title-only route preserving a live URL. Frozen until Store 6 alpha01 ships,
  at which point release-note content (closing issues by linking named conformance tests) becomes
  a separate editorial decision at this same path.
- **Sources:** store-docs/app/release-notes/overview/page.tsx; Repo A STABILITY.md

### Current content structure (kept as-is)

- Identical shell to /developer-newsletter/overview: AppShell, one-entry TOC, `<h1>` "Coming
  soon", separator, empty `#content` div (app/release-notes/overview/page.tsx:8-26).

### Disposition rationale

Port-page:generate owned (evidence/T4-owned-targets.json:16) behind an inventoried URL
(evidence/live-url-inventory.txt:37); frozen for the same census and zero-redirect reasons as its
newsletter sibling. Unlike the newsletter, this path has a stated future: Store 6's release policy
is that each alpha closes at least one community issue with a link to the named conformance test
that resolves it — a test, not a changelog line (STABILITY.md:98-100), with the conformance suite
itself serving as public documentation of what is guaranteed (STABILITY.md:129-133). When alpha01
ships, whether that content lands here or elsewhere is a separate decision; until then the page
does not change, and nothing on the site should promise release notes that do not exist.

---

## /tokens-demo

- **Title:** Design token demo
- **Disposition:** keep-frozen
- **Audience:** Site maintainers
- **Purpose:** Internal design-token demo page, inventoried as a fixed extra. Frozen; never linked
  from docs navigation.
- **Sources:** store-docs/app/tokens-demo/page.tsx

### Current content structure (kept as-is)

- Header: eyebrow "Store token architecture", h1 "Origins and status stay separate.", and a
  paragraph stating origin colors identify where a value came from while semantic status colors
  describe support and release state (app/tokens-demo/page.tsx:39-50).
- Section "Origin legend": four chips — Memory, Source of truth, Fetcher, Overlay — each dot in
  its origin color over the matching soft surface (page.tsx:8-33, 52-74). The four labels map
  one-to-one onto the library's `Origin` enum values MEMORY, SOT, FETCHER, OVERLAY (Repo A
  Origin.kt:4-16).
- Section "Semantic status": Supported (success) and Experimental (warning) chips using HeroUI
  semantic colors, independent of the origin palette (page.tsx:76-98).
- Section "Origins on dark": the four `*-on-dark` origin text tokens rendered on the store code
  surface (page.tsx:100-117).

### Disposition rationale

A hand-authored fixed extra in the route contract (scripts/t8-verification.mjs:36 lists
`/tokens-demo` in FIXED_EXTRA_SOURCES), owned by no generator ledger, and absent from every
navigation surface (lib/nav.ts:14-32 contains no /tokens-demo entry). It exists so maintainers can
eyeball the origin/status token split that the hero and future origin-badged doc components depend
on; the on-dark origin tokens it displays are the same ones the hero harness holds to a 4.5:1
contrast floor against the code surface (scripts/t7-static-hero.test.mjs:209-227). Freezing it
costs nothing and removing it would shrink the pinned route census.


<!-- ================================================================ -->

# Section outlines — Store 6 — Start here (`store6-start`)

# Section outlines: Store 6 — Start here (store6-start)

Repo A = /Users/matt/src/matt-ramotar/Store6 (main @ a6a156e9). Repo B = /Users/matt/src/matt-ramotar/store-docs.
All anchors below were read and verified in this session.

---

## /docs/store6/overview

- **Title:** Store 6 overview
- **Disposition:** revise
- **Audience:** Newcomers deciding whether and how to adopt Store 6
- **Purpose:** The Store 6 landing page: the key + fetcher contract, the read-resolution table, and the module/tier matrix, with the Start-here list re-pointed at the new progressive path (quickstart → defaults → concepts → guides → mutations → migration).
- **Sources:** store-docs/content/docs/store6/overview.mdx (current page, byte-pinned); store-docs/components/overview/{StartHereList,ReadResolutionTable,SupportMatrix}.tsx; store-docs/scripts/t4-contract.test.mjs:33 (T3_OVERVIEW_SHA256, asserted at :834); Store6/STABILITY.md; Store6/README.md; Store6/store6-core/.../StoreBuilder.kt; Store6/store6-core/.../Store.kt; Store6/store6-core/.../Origin.kt

### Revision mechanics (not page content)

- The .mdx is byte-pinned: any edit to content/docs/store6/overview.mdx must update `T3_OVERVIEW_SHA256` in store-docs/scripts/t4-contract.test.mjs:33 in the same change (assertion at :834). t8-verification separately errors if overview.mdx ever appears in the sync lock — it stays hand-authored.
- The three section bodies are React components under store-docs/components/overview/. Editing StartHereList.tsx (the main revision) does NOT touch the .mdx hash; editing the .mdx prose/frontmatter does.
- Frontmatter title is currently "Store 6" (overview.mdx:2); keep it stable unless the IA retitles deliberately.

### Page skeleton

- **(Hero — no heading; overview.mdx:6-35) — keep, one revision**
  - Keep the one-paragraph thesis: Store 6 coordinates network, persistence, and memory through one read contract; start with a fetcher, add seams as needed (overview.mdx:8). This is accurate: a fetcher is the only required builder input — `store<K, V> { }` without one throws IllegalArgumentException at build time (StoreBuilder.kt:29-31).
  - Keep both CTA buttons (Quickstart, Important Defaults; overview.mdx:12-26) and the fetcher-only CodeSlab (overview.mdx:28-34), whose shape matches the CI-compiled quickstart store block (store6-quickstart/src/main/kotlin/org/mobilenativefoundation/store6/quickstart/Main.kt:49-51).
  - ADD one status sentence mirroring Repo A's standing statement: Store 6 is in development targeting 6.0.0-alpha01 and nothing is published yet (README.md:15). The page currently omits this; the quickstart the CTA points at leads with it (docs/store6/quickstart.md:3-4), so the landing page should not read as more shipped than its first click.
- **H2 "Start here" (overview.mdx:37-41) — the main revision**
  - Replace the current four-item StartHereList (quickstart, important-defaults, compose, sqldelight; StartHereList.tsx:3-28) with the approved progressive path:
    1. `/docs/store6/quickstart` — first working store (keep)
    2. `/docs/store6/important-defaults` — what zero config already decided (keep)
    3. `/docs/store6/concepts/read-contract` — stream, get, and origins (new page)
    4. `/docs/store6/guides/fetchers` and `/docs/store6/guides/persistence` — the two seams most apps add next (new pages)
    5. `/docs/store6/mutations` — the journalled write path, labeled Experimental (new page)
    6. `/docs/store6/migration/from-store5` — for arriving Store 5 users (new page)
  - Each item keeps the current title + one-line description shape (StartHereList.tsx:30-52); descriptions state what the reader will be able to do, no adjectives.
  - The mutations item carries an inline "Experimental" chip consistent with the tier table: every public symbol in store6-mutations is `@ExperimentalStoreApi` (STABILITY.md:52).
- **H2 "Read resolution" (overview.mdx:43-48) — keep, add cross-links**
  - Keep the origin legend + three-column table: the four origins are exactly MEMORY, SOT, FETCHER, OVERLAY (Origin.kt:4-15; ReadResolutionTable.tsx:3-32).
  - Keep the framing sentence that origin and freshness are independent — a Data frame carries `origin`, `age`, `isStale`, `refreshing` as separate fields (StoreResult.kt:19-37).
  - Keep the "Important default" alert (ReadResolutionTable.tsx:75-88): under the default validator, wall-clock age alone never makes `Freshness.CachedOrFetch` fetch; `MaxAge` is where elapsed age participates. Consistent with: a resident fresh value is served without a second fetch under CachedOrFetch (docs/store6/important-defaults.md:18-19).
  - Keep the cold-restart worked example paragraphs (ReadResolutionTable.tsx:90-105); ADD closing cross-links: full semantics at `/docs/store6/concepts/read-contract` (new) and `/docs/store6/concepts/freshness` (new).
- **H2 "Modules and targets" (overview.mdx:50-55) — keep, extend**
  - Keep the module/tier/targets table (SupportMatrix.tsx:6-39) and the framing that API tier and target coverage are separate axes (overview.mdx:52-53).
  - Extend rows to cover the devtools pair when they are documented: store6-devtools and store6-devtools-inspector are Experimental with an alpha02 target (STABILITY.md:54-55); the inspector publishes an 8-target subset (store6-devtools-inspector README).
  - Tier chips link to `/docs/store6/stability` (the artifact table's authority, STABILITY.md:45-55) and to `/docs/store6/concepts/api-tiers` (new page) for what each opt-in marker means (Annotations: `@ExperimentalStoreApi` / `@DelicateStoreApi` / `@InternalStoreApi`, all RequiresOptIn ERROR; STABILITY.md:19-30).
  - store6-core row stays "Stable track" with the qualifier the stability page states: not frozen until the beta01 freeze candidate (STABILITY.md:47).
- **Admonitions**
  - One status admonition in the hero (nothing published yet; coordinates land with 6.0.0-alpha01 — README.md:15, docs/store6/quickstart.md:3-4).
  - Experimental chip on the mutations Start-here item (STABILITY.md:52).
- **Diagrams:** none; the two component tables are the visual content.
- **Cross-links:** /docs/store6/quickstart, /docs/store6/important-defaults, /docs/store6/concepts/read-contract, /docs/store6/concepts/freshness, /docs/store6/concepts/api-tiers, /docs/store6/guides/fetchers, /docs/store6/guides/persistence, /docs/store6/mutations, /docs/store6/migration/from-store5, /docs/store6/stability, /reference/store6-core/index.html

---

## /docs/store6/quickstart

- **Title:** Quickstart
- **Disposition:** sync-owned (generated from Repo A docs/store6/quickstart.md; owner "sync-store6-docs" in evidence/T4-owned-targets.json; lock entry in evidence/T4-store6-source-lock.json targets content/docs/store6/quickstart.mdx at revision a6a156e9)
- **Audience:** Newcomers writing their first store
- **Purpose:** First working store: the `store { fetcher { … } }` block verbatim from the CI-compiled runnable module, the four StoreResult kinds, stream vs get, close(), and the experimental write-path teaser. Content changes happen in Repo A and re-pin the lock.
- **Sources:** Store6/docs/store6/quickstart.md; Store6/store6-quickstart/src/main/kotlin/org/mobilenativefoundation/store6/quickstart/Main.kt; store-docs/evidence/T4-store6-source-lock.json; store-docs/scripts/sync-store6-docs.mjs (locked transforms at :141-190)

### Page skeleton (mirrors the Repo A source as it exists today)

- **(Intro — no heading; quickstart.md:1-26)**
  - Status blockquote: nothing is published yet; the page is the shape of the API on `main`; install coordinates land with 6.0.0-alpha01 (quickstart.md:3-4).
  - The two-input contract: a key and a fetcher; Store handles single-flight sharing, serving resident values, staleness tracking, memory bounding (quickstart.md:6-9).
  - Code: "the whole idea in five lines" — `store<UserKey, User> { fetcher { key -> FakeApi.getUser(key.id) } }` plus display-form `stream`/`get` lines (quickstart.md:15-22). Provenance: the store block is verbatim from Main.kt:49-51 (parity-checked per the marker at quickstart.md:13); the stream/get lines are display forms only, shapes from Main.kt:53-62, explicitly NOT parity-checked (quickstart.md:24-26).
- **H2 "The whole program" (quickstart.md:28-108)**
  - Claim: this exact program compiles and runs on every pull request — the store6-quickstart module executed by `./gradlew :store6-quickstart:run` (verified: .github/workflows/store6.yml:62).
  - Code: supporting declarations verbatim from Main.kt:1-39 (UserKey : StoreKey with `namespace = StoreNamespace("users")` and `canonicalId() = id`; User; FakeApi with delay(100)) — quickstart.md:39-79.
  - Prose: a StoreKey gives Store a `namespace` (unit of bulk invalidate/clear) and `canonicalId()` (distinguishes records inside it); key design has its own guide — cross-link to Keys and Namespaces (quickstart.md:81-84; link rewritten by the sync to /docs/store6/key-design).
  - Code: `main` verbatim from Main.kt:47-63 — builds the store, `stream(UserKey("1")).take(2)` with an exhaustive four-branch `when`, one `get(UserKey("2"))`, then `close()` (quickstart.md:90-108).
- **H2 "Reading the output" (quickstart.md:110-126)**
  - Exactly four StoreResult kinds, "no fifth case waiting": Loading, Data (with origin FETCHER/SOT/MEMORY/OVERLAY plus stale/refreshing flags), Revalidated (not-modified with the resident value's age, not a redundant Data), Error (stale value served first when resident) — quickstart.md:112-121; type shape at StoreResult.kt:10-70.
  - Attribution honesty called a contract, not a debugging aid (quickstart.md:117-118).
  - `take(2)` is what ends the program: stream is an unbounded flow that stays live while collected; in an app you collect for the screen's lifetime and `close()` the store when done (quickstart.md:123-126; Store.kt:24-27 documents the flow staying active until cancellation or close).
- **H2 "Write path (experimental)" (quickstart.md:128-188)**
  - Admonition 1 (as published on the site): store6-mutations is a separate artifact, every public symbol `@ExperimentalStoreApi`, ships with 6.0.0-alpha01, nothing published yet (quickstart.md:130-131). Source lines 133-136 are replaced at publication by the locked transform with a two-line "the spelling below is the current API surface … matches the implementation" note (sync-store6-docs.mjs:144-148) — the site copy carries no review/ruling process language.
  - Code: `mutationStore(registry, server, keyResolver, valueCodecVersion, valueCodec) { fetcher { … } }` with the one-line MutationKeyResolver, then `mutate(key, renameRef, Rename("new name"))` and `drain(key)` (quickstart.md:145-161).
  - The end-to-end flow, four numbered steps: offline enqueue (mutate appends one intent, returns a mutation id, nothing pushed) → optimistic visibility (`stream` emits Data(origin = OVERLAY)) → drain pushes pending intents and adopts each ack → the server echo becomes the committed value attributed SOT or MEMORY, optimistic frame retired not replayed, no redundant fetch (quickstart.md:163-172). The page deliberately does NOT promise convergence for a collector already active across the acknowledgement (quickstart.md:170-172) — the outline must preserve that non-promise.
  - Two design decisions: `runtime()` returns null on a mutation store by design, so every consumer write stays journalled (quickstart.md:174-178); a pending write is `origin == OVERLAY`, never `isStale` — isStale is never set on an overlay frame (quickstart.md:179-183; STABILITY.md:189-193), with the stability-policy cross-link (rewritten by the sync to /docs/store6/stability anchors).
  - Closing paragraph: the alpha's two-step durable acknowledgement means a crash in the ack window leaves a replayable pending intent at the cost of a possible re-sent push; full tradeoff stated in the stability policy (quickstart.md:185-188; STABILITY.md:154-170).
- **Footer:** "Last verified" provenance line (quickstart.md:192). The sync preserves provenance content; HTML comment markers are stripped at publication.
- **Cross-links (as rewritten by the sync):** /docs/store6/key-design, /docs/store6/stability (two anchors), GitHub blob link to .github/workflows/store6.yml.

### Upstream edits wanted (Repo A changes; each re-pins revision + sha256 in the lock)

- Add "next step" cross-links matching the new IA: from "Reading the output" to the read-contract and freshness concept pages, and from the write-path section to the mutations landing page — added in docs/store6/quickstart.md, never on the site copy (the concept pages must exist as site routes first; sync link rewriting maps sibling locked docs only, other repo-relative links go to GitHub).
- Refresh the "Last verified" footer (currently 2026-07-26 · main @ c4fbaf4) the next time the source is touched; the lock already pins a6a156e9.
- Reword source lines 133-136 in Repo A to the process-free phrasing the publication transform substitutes, so the fragile 1-based line-range transform for this file can be retired (transform anchors break whenever those lines shift; amendments upstream are append-only for this reason).
- Consider making the display-form `stream`/`get` lines (quickstart.md:20-21) parity-checked against a compiled snippet, closing the one non-parity gap the provenance comment names.

---

## /docs/store6/important-defaults

- **Title:** Important defaults
- **Disposition:** sync-owned (generated from Repo A docs/store6/important-defaults.md; lock entry targets content/docs/store6/important-defaults.mdx at revision a6a156e9)
- **Audience:** Newcomers after first success; anyone auditing behavior
- **Purpose:** Every zero-config behavior named and pinned to its conformance test: CachedOrFetch, zero retries, in-memory SoT/bookkeeper, 128 idle keys, single-flight, conflation, Revalidated. Declares the tests the specification of record. Content changes happen in Repo A.
- **Sources:** Store6/docs/store6/important-defaults.md; store-docs/evidence/T4-store6-source-lock.json; Store6/store6-core/.../StoreBuilder.kt; Store6/store6-core/.../Store.kt

### Page skeleton (mirrors the Repo A source as it exists today)

- **(Intro — no heading; important-defaults.md:1-14)**
  - Purpose: a zero-config `store { fetcher { … } }` already makes many decisions; this page names every one "so you can find out here rather than in production" (important-defaults.md:3-5), with a Quickstart cross-link.
  - Authority statement: each line ends in the conformance test that guarantees it; the tests are the specification — if a line and its test disagree, the test is right and the page is a bug (important-defaults.md:7-8).
  - Blockquote: zero configuration and explicit expert configuration are byte-identical in behavior — same trace, same fetch count (`zeroConfig_and_expertConfig_observeIdenticalDefaults`) — with the honest limit that the equivalence is asserted over persistence, bookkeeper, freshness validator, and idle cap, not telemetry or overlay, which are unset on both sides (important-defaults.md:10-14).
- **H2 "Freshness" (important-defaults.md:16-33)**
  - Default is `Freshness.CachedOrFetch`: absent key fetches; resident fresh value served without a second fetch (important-defaults.md:18-19; the default parameter on both stream and get — Store.kt:43, :67).
  - `MaxAge` within bound serves resident without a second fetch; `MustBeFresh` always fetches even against a fresh resident; `LocalOnly` never fetches — serves what is resident, and with nothing resident fails `Missing` with no `Loading` frame and no fetcher call (important-defaults.md:20-27).
  - Stale-while-revalidate is the shape of every refresh: stale value served immediately, exactly ONE terminal outcome — one fresh Data, or one served-stale Error, or one Revalidated, never two; a `get` on a stale resident serves the stale value and refetches in the background (important-defaults.md:28-33). Each behavior named with its conformance test — test names are protected tokens.
- **H2 "Retry" (important-defaults.md:35-45)**
  - Zero retries, zero backoff at zero configuration: one demand cycle invokes the fetcher exactly once; a failure schedules no background retry; a later call is new demand. Retries belong in your fetcher (important-defaults.md:37-42).
  - The SoT reader subscription self-heals on a fixed internal delay whose constant is internal and NOT contractual — no test pins its value (important-defaults.md:43-45). The page must never pin this number.
- **H2 "Cache and memory" (important-defaults.md:47-64)**
  - In-memory source of truth and bookkeeper by default; nothing touches disk until persistence is installed (important-defaults.md:49-50).
  - Idle residency capped at 128 keys; zero-config cap equals explicit `maxIdleKeys(128)` (important-defaults.md:51-53; default documented at StoreBuilder.kt:116, setter at :118).
  - Eviction touches only quiescent engines (active collector or in-flight fetch pins the engine) and is semantically invisible — stale marks and namespace watermarks survive recreation (important-defaults.md:54-60; StoreBuilder.kt:109-115 KDoc).
  - Invalidation watermarks survive restart and eviction and are observed by keys a fresh store has never seen; the memory cache never diverges from durable truth (important-defaults.md:61-64).
- **H2 "Deduplication and single-flighting" (important-defaults.md:66-75)**
  - 50 getters + 50 collectors on one key produce exactly one fetch, all 100 observe its outcome; a stream arriving mid-fetch piggybacks; cancelling a waiter does not cancel the shared fetch (important-defaults.md:68-75).
- **H2 "Emission" (important-defaults.md:77-99)**
  - Honest attribution with the four origin cases each pinned to a test: FETCHER for a network commit, SOT for an external durable change and for a write-handle apply echo (with no additional fetch), OVERLAY for an optimistic write (important-defaults.md:79-84).
  - Slow collectors never block fast ones or the engine; conflation is per result kind — newer same-kind values supersede, but Loading/Error/Revalidated lifecycle signals are never displaced; every collector eventually observes the latest row (important-defaults.md:85-90).
  - NotModified surfaces as exactly one `Revalidated(age)` and clears staleness — not a redundant Data frame (important-defaults.md:91-92).
  - Post-clear streams start absent or loading and never replay pre-clear data; a clear racing an in-flight fetch cannot resurrect the discarded commit; invalidation reaches live streams and a 10,000-invalidation burst converges without losing final staleness (important-defaults.md:93-99).
- **H2 "Reader grace" (important-defaults.md:101-105)**
  - Re-subscribing within a short window resumes the existing pipeline rather than restarting with a fresh Loading frame; the window's millisecond value is an internal constant the page deliberately does not pin (important-defaults.md:103-105).
- **H2 "What is *not* defaulted" (important-defaults.md:107-115)**
  - A fetcher is required and a source of truth does not substitute; build fails with a message saying so (important-defaults.md:109-111; StoreBuilder.kt:29).
  - Telemetry unset takes a null fast path (no no-op sink cost); overlay unset projects nothing onto reads (important-defaults.md:112-115).
- **Footer:** test-directory link (rewritten by the sync to the GitHub tree URL for store6-core/src/commonTest/...) + "Last verified" line (important-defaults.md:119-122).
- **Admonitions:** the intro blockquote is the page's single callout; the sync renders it as-is. No new admonitions on the site copy.
- **Cross-links (as rewritten by the sync):** /docs/store6/quickstart; GitHub tree link to the conformance-test directory (one of the four pinned GitHub destinations in t4-contract.test.mjs).

### Upstream edits wanted (Repo A changes; each re-pins the lock)

- Add cross-links from the Freshness section to the planned freshness-policies concept page, from Cache and memory to the memory-and-lifecycle concept page, and from Emission to the read-contract page — in Repo A, after those routes exist.
- Refresh the "Last verified" footer (currently 2026-07-26 · main @ c4fbaf4) on next touch.
- The builder-anchor line references in prose (`StoreBuilder.kt:181`, `StoreBuilder.kt:52`, `:58`, `:61`, `:177-180` at important-defaults.md:50, :111-115) are protected tokens that can drift as StoreBuilder.kt changes; an upstream verification pass should re-check them whenever that file moves, since the page's authority framing makes stale line numbers a page bug.


<!-- ================================================================ -->

# Section outlines — Store 6 — Concepts (`store6-concepts`)

# Section outlines: Store 6 — Concepts (store6-concepts)

All anchors below are Repo A (`matt-ramotar/Store6`, main @ `a6a156e9`) unless prefixed `store-docs/`
(Repo B). Every anchor was read and verified against the file as it exists today.

---

## /docs/store6/concepts/read-contract

- **Title:** The read contract: stream, get, and origins
- **Disposition:** new
- **Audience:** All Store 6 users; UI developers rendering store state
- **Purpose:** Teach the one contract every Store 6 read obeys: stream emits errors and never
  throws, get throws and never emits; four result kinds with no fifth; honest Origin attribution;
  per-kind conflation; servedStale; the single stream-terminating case; unbounded streams; and
  close() semantics.
- **Sources:** `store6-core/src/commonMain/kotlin/org/mobilenativefoundation/store6/core/Store.kt`,
  `StoreResult.kt`, `Origin.kt`; supporting: `docs/store6/important-defaults.md`, `STABILITY.md` §9.

### Skeleton

- **Intro (no heading)**
  - One paragraph: a Store has exactly two read doors, `stream` and `get`, and one failure rule
    that splits them. Everything on this page is the contract of the stable-track `Store`
    interface (Store.kt:17).
  - Admonition (stability): store6-core is stable-track but the API is not frozen until the
    beta01 freeze candidate (STABILITY.md:47). No experimental opt-in is needed for anything on
    this page.
- **H2: The one-failure-channel rule**
  - `stream` emits fetcher and source-of-truth failures as `StoreResult.Error` values and never
    throws them to the collector (Store.kt:21-24).
  - `get` returns the resolved value or throws `StoreException`; it never emits partial states
    (Store.kt:59-63).
  - The one exception on both doors: operations on a closed store throw `IllegalStateException`
    (`Store is closed.`), which is a usage error, not a retrieval failure (Store.kt:38-39, :63,
    :169-171). Cross-link: [errors](/docs/store6/concepts/errors).
- **H2: The four result kinds**
  - Exactly four: `Loading` (StoreResult.kt:12), `Data(value, origin, age, isStale, refreshing)`
    (StoreResult.kt:19-37), `Revalidated(age)` (StoreResult.kt:49-52), `Error(error, servedStale)`
    (StoreResult.kt:58-70). State plainly: there is no fifth case, so an exhaustive `when` is safe
    to write.
  - `Loading` means "no servable resident value under the policy in effect" (StoreResult.kt:11) —
    it is policy-relative, not merely "empty cache".
  - `Revalidated` is the not-modified signal of a conditional fetch: server-confirmed fresh,
    metadata refreshed, `age` measured at revalidation (StoreResult.kt:39-48). Collectors that
    only handle Loading/Data/Error silently miss the "nothing changed" signal.
  - Code snippet: the exhaustive `when` over all four kinds, verbatim shape from the CI-run
    quickstart program (store6-quickstart/src/main/kotlin/org/mobilenativefoundation/store6/quickstart/Main.kt:53-60).
- **H2: Origins: attribution is honest**
  - The four `Origin` values with their exact meanings: MEMORY = in-memory resident state, SOT =
    persistent source of truth, FETCHER = configured fetcher, OVERLAY = overlay applied above
    stored data (Origin.kt:4-16).
  - Attribution honesty is a tested contract, not a debugging aid: each origin claim in
    important-defaults ends in a named conformance test (docs/store6/important-defaults.md:79-84).
  - OVERLAY frames are fresh by definition: stamped `age = Duration.ZERO` and `isStale = false`
    unconditionally; only `refreshing` is live on them (STABILITY.md:189-193). Pending-write UI
    keys on `origin == OVERLAY`, never on `isStale`. Cross-link:
    [pending-write UI](/docs/store6/mutations/pending-write-ui).
  - `get` is never projected by a configured overlay; overlays apply only to `stream`
    (Store.kt:54; STABILITY.md:195-198).
- **H2: Conflation: lifecycle signals are never dropped**
  - Conflation is per result kind: a newer `Data` supersedes an older queued `Data`, but a queued
    `Loading`, `Error`, or `Revalidated` is never displaced by another kind
    (docs/store6/important-defaults.md:87-90; StoreResult.kt:45-47).
  - A slow collector never blocks a fast one or the engine, and every collector eventually
    observes the latest row (docs/store6/important-defaults.md:85-90).
- **H2: Errors on the stream: servedStale**
  - `Error.servedStale` is `true` exactly when an invalidated resident value was served and its
    refresh failed under `CachedOrFetch` or `StaleIfError`; `false` when no resident was served or
    the policy withheld it (StoreResult.kt:62-69).
  - Rendering rule: `servedStale = true` means the user is still looking at usable content —
    show an error affordance over it, don't blank the screen. Cross-link:
    [errors](/docs/store6/concepts/errors).
- **H2: The one stream-terminating case**
  - Only a `MustBeFresh` initial-cycle fetch or revalidation failure emits one `Error` and
    completes the flow; every other failure leaves the flow live (Store.kt:22-24;
    StoreResult.kt:55-57).
  - Pitfall callout: wrapping stream collection in try/catch expecting thrown errors — errors
    arrive as values and the stream usually stays live.
- **H2: Streams are unbounded**
  - The flow remains active until its collector is cancelled or the store is closed, and keeps
    reporting later values: refetches triggered by invalidation, and the absent-value transition
    (`Loading`) after a clear (Store.kt:24-27, :116-117).
  - Concurrent collectors and callers for one key share a single fetch (Store.kt:27). Deep
    coverage of sharing lives in
    [memory and lifecycle](/docs/store6/concepts/memory-and-lifecycle).
- **H2: Closing the store**
  - `close()` cancels collectors and value requests waiting on in-flight work; every subsequent
    operation fails with `IllegalStateException` and the exact message `Store is closed.`;
    calling it more than once has no additional effect (Store.kt:166-173).
- **Cross-links (end-of-page "Where next"):**
  - [Freshness policies](/docs/store6/concepts/freshness) — how each read is planned.
  - [Errors and failure handling](/docs/store6/concepts/errors) — the StoreError vocabulary.
  - [Invalidate or clear](/docs/store6/invalidate-vs-clear) — what streams observe after each.
  - [Compose integration](/docs/store6/compose) — collecting this contract in UI.
  - [Quickstart](/docs/store6/quickstart) — the runnable program this page's snippet comes from.

---

## /docs/store6/concepts/freshness

- **Title:** Freshness policies
- **Disposition:** new
- **Audience:** Users tuning read behavior
- **Purpose:** The five per-call policies, exactly what does and does not trigger a fetch,
  stale-while-revalidate as the default shape, single-flight sharing across differing policies,
  typed StoreMeta and the metadata-less-row conservative-stale rule, and the expert read-planning
  seam as an advanced footnote. Natively absorbs the job Store 5's Validator did.
- **Sources:** `store6-core/.../core/Freshness.kt`, `StoreMeta.kt`,
  `seam/FreshnessValidator.kt`, `docs/store6/important-defaults.md`.

### Skeleton

- **Intro (no heading)**
  - Freshness is a per-call parameter on `stream` and `get`, not store-level configuration; each
    read is planned from resident availability, invalidation state, typed metadata, and the
    policy (Freshness.kt:5-11). Both doors default to `CachedOrFetch` (Store.kt:43, :67).
  - Concurrent requests for one key share a single in-flight fetch even when their policies
    differ (Freshness.kt:8-10).
- **H2: The five policies**
  - State that the sealed interface has exactly five variants (Freshness.kt:12-52); no fifth
    fetching mode is hiding elsewhere.
  - H3: `CachedOrFetch` (the default) — serve a locally available value immediately; invalidated
    values and rows without freshness metadata are served as stale while one background
    revalidation runs; fetch only when no local value exists (Freshness.kt:13-18).
  - H3: `MaxAge(notOlderThan)` — serves a local value only when it has known freshness metadata,
    has not been invalidated, and its age is within the bound; otherwise withholds it and fetches
    (Freshness.kt:20-28). Pitfall: a row hydrated by an external writer with no recorded metadata
    is withheld — it fetches, not serves.
  - H3: `MustBeFresh` — never serves a cached value; blocks until a fresh fetch succeeds and
    fails when it does not; a metadata-less row is also withheld (Freshness.kt:30-34). This is
    the one policy whose initial-cycle failure terminates a stream
    (Store.kt:23-24) — cross-link [read contract](/docs/store6/concepts/read-contract).
  - H3: `StaleIfError` — prefer fresh data after invalidation or when a local value has no
    metadata, but fall back to that stale value when the fetch fails; a local value with current
    known metadata is served without fetching (Freshness.kt:36-41). On `get` it blocks after
    invalidation and returns the resident value only when the refresh fails, whereas
    `CachedOrFetch` returns immediately and refreshes in the background (Store.kt:49-52).
  - H3: `LocalOnly` — never invokes the fetcher; serves only locally available data and reports
    `StoreError.Missing` when none exists; on a memory miss the configured source of truth is
    probed once, so a pre-existing persisted row counts as local data (Freshness.kt:43-51).
    When nothing is resident it fails Missing without a `Loading` frame and without calling the
    fetcher (docs/store6/important-defaults.md:24-27). Pitfall: the builder still requires a
    fetcher even if you only ever use LocalOnly (StoreBuilder.kt:176-179).
  - Code snippet: per-call policy at the call site — `store.get(key, Freshness.MaxAge(5.minutes))`
    / `store.stream(key, Freshness.LocalOnly)` — display-form shape verified against the
    `stream`/`get` signatures (Store.kt:41-44, :65-68).
- **H2: What triggers a fetch — and what does not**
  - Two-column summary (fetches / does not fetch), each row sourced:
    - Fetches: absent key under any fetching policy; `MustBeFresh` always, even against a fresh
      resident; `MaxAge` over its bound, invalidated, or metadata-less; a stale resident under
      `CachedOrFetch` (background revalidation) (docs/store6/important-defaults.md:18-33).
    - Does not fetch: resident fresh value under `CachedOrFetch`; `MaxAge` within its bound;
      `LocalOnly` ever (docs/store6/important-defaults.md:18-27; Freshness.kt:44).
  - Note: each line of this table is pinned by a named conformance test on
    [Important defaults](/docs/store6/important-defaults); that page is the specification of
    record for defaults.
- **H2: Stale-while-revalidate is the default shape**
  - Under `CachedOrFetch` a stale resident is served immediately, and the refresh produces
    exactly one terminal outcome — one fresh `Data`, or one served-stale `Error`, or one
    `Revalidated` — never two (docs/store6/important-defaults.md:28-33).
  - This shape degrades gracefully offline and is why `invalidate` is safe for pull-to-refresh —
    cross-link [Invalidate or clear](/docs/store6/invalidate-vs-clear).
  - Zero retries, zero backoff: a failed refresh schedules nothing; a later call is new demand
    (docs/store6/important-defaults.md:37-42). Cross-link
    [errors](/docs/store6/concepts/errors) and [fetchers guide](/docs/store6/guides/fetchers).
- **H2: One fetch, many policies**
  - N concurrent getters and collectors share exactly one fetch and all observe its outcome;
    a stream arriving mid-fetch piggybacks; cancelling one waiter does not cancel the shared
    fetch (docs/store6/important-defaults.md:68-75; Freshness.kt:8-10).
- **H2: Typed metadata: StoreMeta**
  - Freshness and identity metadata is typed: `writtenAtEpochMillis` plus optional `etag`; an
    untyped metadata channel does not exist anywhere in Store (StoreMeta.kt:3-16).
  - `Data.age` and age-bounded policies derive from it; epoch millis are used because no stable
    cross-platform instant type exists on the current language floor (StoreMeta.kt:6-9).
  - The conservative-stale rule: a resident value with null metadata is treated as
    conservatively stale by read planning (FreshnessValidator.kt:13) — which is why
    `CachedOrFetch` serves-then-revalidates it while `MaxAge`/`MustBeFresh` withhold it.
- **H2: Advanced: the read-planning seam** (footnote-level, kept short)
  - Admonition (stability): everything in this section is `@ExperimentalStoreApi` and part of the
    seam, a freeze candidate — not frozen (FreshnessValidator.kt:15, :37; STABILITY.md:57-68).
  - `FreshnessValidator.plan(context)` selects a plan as a pure function of `FreshnessContext`
    (residency, meta, epoch staleness, policy, now, bookkeeping status)
    (FreshnessValidator.kt:16-41).
  - `FetchPlan` has three outcomes: `Skip` (with no resident value it yields
    `StoreError.Missing`), `Fetch(servesResidentWhileFetching)`, and
    `Conditional(etag, servesResidentWhileFetching)` (FreshnessValidator.kt:46-62).
  - A `Conditional` plan is how ETags reach a seam fetcher; `NotModified` comes back as one
    `Revalidated` frame (FetcherResult.kt:12-15, :29-36). Deep coverage:
    [fetchers guide](/docs/store6/guides/fetchers) and
    [extending Store](/docs/store6/guides/extending).
- **H2: Coming from Store 5** (short)
  - Store 5's `Validator` was a user-supplied hook deciding when cached data was still good;
    Store 6 absorbs that job natively into per-call policies plus durable invalidation, with the
    expert `FreshnessValidator` seam for the rare custom case. One-line mapping table;
    cross-links [Migrating from Store 5](/docs/store6/migration/from-store5) and
    [component map](/docs/store6/migration/component-map).
- **Cross-links:** read-contract, invalidate-vs-clear, important-defaults, fetchers guide,
  extending guide, migration/component-map.

---

## /docs/store6/key-design

- **Title:** Keys and namespaces
- **Disposition:** sync-owned (generated from Repo A `docs/store6/key-design.md`; site copy is
  never edited by hand — content changes happen in Repo A and re-pin the sync lock)
- **Audience:** Users designing their first StoreKey; architects
- **Purpose:** Key design as the one skill Store asks you to learn: canonicalId as the
  deduplication lever, namespace as the invalidation blast radius, durable watermarks covering
  never-seen keys, and the stability rules. Slug unchanged; grouped into the Concepts section via
  `meta.json` only.
- **Sources:** `docs/store6/key-design.md` (Repo A, authority),
  `store6-core/.../core/StoreKey.kt`, `store-docs/evidence/T4-store6-source-lock.json` (entry:
  `docs/store6/key-design.md` → `content/docs/store6/key-design.mdx`).

### Current structure (reflects the Repo A source as it exists today)

- **H1: Keys and namespaces** — intro: key design is the one thing Store asks you to get right;
  a StoreKey does two jobs with different failure consequences (key-design.md:1-7).
- **H2: The two jobs** (key-design.md:9-32)
  - Declarations-only `StoreKey` interface block with a provenance comment pointing at
    StoreKey.kt:9-19 (key-design.md:11-18).
  - `canonicalId()` is identity: same namespace + same id = one in-flight fetch, one resident
    value, one stale mark; too narrow double-fetches, too wide collides (key-design.md:20-24).
  - `namespace` is the unit of bulk operations; its durable watermark covers keys the store has
    never seen (key-design.md:26-28).
  - The rule: stable for the lifetime of the key, and containing everything that makes the
    result different (key-design.md:30-32).
- **H2: The smallest correct key** (key-design.md:34-50)
  - `UserKey` example, recipe-annotated to the CI-compiled quickstart key
    (store6-quickstart/.../Main.kt:11-21); one namespace per record type, record id as canonical
    id.
- **H2: When the id needs more than an identifier** (key-design.md:52-77)
  - Composite-id `UserKey(id, includeOrganization)` example; expanded vs plain representations
    must not collide.
  - The two avoid-rules: nothing that varies between requests you want deduplicated (timestamp,
    request id, nonce), and no secrets — the canonical id is written to the source of truth
    (key-design.md:75-77).
- **H2: Choosing namespaces** (key-design.md:79-113)
  - Namespaces are cheap; one per record type by default; split for smaller blast radius; the
    deciding question is "what do I want to invalidate together?"; per-organization
    `DocumentKey` example with `invalidateNamespace`.
- **H2: The payoff** (key-design.md:115-128)
  - invalidate/invalidateNamespace mark stale without removing; clear/clearNamespace/clearAll
    remove; watermarks are durable, cover non-resident keys, survive restart; link to
    Invalidate or Clear (rewritten by the sync to `/docs/store6/invalidate-vs-clear`).
- **Footer:** "Last verified" line (key-design.md:132).

### Disposition notes (site-side work only)

- Group under the Concepts sidebar section via `meta.json`; the slug `/docs/store6/key-design`
  must not move (zero-redirect route parity; the file is owned by the sync ledger).

### Upstream edits wanted (Repo A; each requires re-pinning lock revision + sha256)

- Append a short "One store or many" section carrying forward the version-agnostic topology
  reasoning from the Store 5 best-practices guide (single vs multiple stores), restated in
  Store 6 vocabulary: namespaces within one store vs separate stores, freshness configured
  per call not per store, typed failure isolation. Append-only — the sync's line-range
  transforms anchor on existing line numbers, so amendments go at the end.
- Refresh the "Last verified" footer when re-pinned.

---

## /docs/store6/invalidate-vs-clear

- **Title:** Invalidate or clear
- **Disposition:** sync-owned (generated from Repo A `docs/store6/invalidate-vs-clear.md`)
- **Audience:** Users wiring pull-to-refresh, sign-out, deletes
- **Purpose:** The two maintenance verbs and the wrong-vs-imperfect decision test: invalidate
  marks stale and refreshes in place; clear removes destructively with no pre-clear replay and no
  resurrecting in-flight fetches. Slug unchanged; grouped into Concepts via `meta.json`.
- **Sources:** `docs/store6/invalidate-vs-clear.md` (Repo A, authority),
  `store-docs/evidence/T4-store6-source-lock.json` (entry: `docs/store6/invalidate-vs-clear.md`
  → `content/docs/store6/invalidate-vs-clear.mdx`).

### Current structure (reflects the Repo A source as it exists today)

- **H1: Invalidate or clear** — intro: both make a value go away; picking wrong produces one of
  two bugs (spinner where content was expected, or stale content where a spinner was expected);
  the one-line version of each verb (invalidate-vs-clear.md:1-10).
- **H2: What invalidate does** (invalidate-vs-clear.md:12-62)
  - Marks stale without removing; on return active streams are signaled and will observe
    refetched data; the resident value keeps serving as stale meanwhile.
  - Three safety properties: the stale mark is durable (survives restart until a later
    successful fetch or revalidation); level-triggered monotone state (no lost signal in a race
    window); a live collector observes the refetch — holds under a 10,000-invalidation burst
    (invalidate-vs-clear.md:18-26).
  - Pull-to-refresh code example (`onPullToRefresh` + `observeUser`), recipe-annotated to
    Store.kt:70-98 signatures and the named invalidation conformance test
    (invalidate-vs-clear.md:31-62).
- **H2: What clear does** (invalidate-vs-clear.md:64-127)
  - Destructive removal including the source-of-truth row and freshness bookkeeping; streams
    observe the absent-value transition (`Loading`) then refetched data.
  - Two guarantees: an in-flight fetch that started before the clear can no longer commit
    (waiters observe `StoreError.Missing`); a post-clear stream never replays pre-clear data
    (invalidate-vs-clear.md:70-75).
  - Sign-out (`clearAll`), server-reported deletion (`clear`), tenant revocation
    (`clearNamespace`) code examples (invalidate-vs-clear.md:83-127).
- **H2: Choosing** (invalidate-vs-clear.md:129-140)
  - The five-row intent table ("This might be out of date" → invalidate … "Sign out" →
    clearAll) and the decision test: would showing the old value for a few hundred more
    milliseconds be wrong, or merely imperfect? Wrong means clear.
- **H2: The stale-while-revalidate consequence** (invalidate-vs-clear.md:142-156)
  - After invalidate: stale value served immediately, exactly one terminal outcome (one fresh
    Data, or one served-stale Error, or one Revalidated — never two). After clear: cold read;
    a failed fetch means an empty screen. Invalidate degrades gracefully; clear cannot.
- **Footer:** "Last verified" line (invalidate-vs-clear.md:160).

### Disposition notes (site-side work only)

- Group under Concepts via `meta.json`; slug must not move (zero-redirect parity, sync ledger
  ownership).

### Upstream edits wanted (Repo A; re-pin lock on change)

- None required for this section's launch. Optional future append: a short pointer to the
  mutations write path noting that a server-confirmed deletion arriving through a mutation ack
  is adopted as a clear — belongs after the mutations pages exist, appended at the end of the
  file only.

---

## /docs/store6/concepts/errors

- **Title:** Errors and failure handling
- **Disposition:** new
- **Audience:** Users building resilient screens
- **Purpose:** The six frozen StoreError variants, StoreException on the get path, the
  what/which-key/likely-fix message contract, rendering servedStale errors over usable content,
  and why retries belong in the fetcher — the engine does zero retries and zero backoff.
- **Sources:** `store6-core/.../core/StoreError.kt`, `StoreException.kt`,
  `docs/store6/important-defaults.md`; supporting: `StoreResult.kt`, `seam/FetcherResult.kt`,
  `seam/StoreResults.kt`.

### Skeleton

- **Intro (no heading)**
  - One vocabulary, two channels: `stream` carries a `StoreError` inside `StoreResult.Error`;
    value-returning operations throw `StoreException` wrapping the same `StoreError`
    (StoreException.kt:3-12; Store.kt:59-63). Recap the one-failure-channel rule in one line and
    cross-link [the read contract](/docs/store6/concepts/read-contract).
- **H2: The six variants — and no seventh**
  - `Fetch`, `Persistence`, `Conversion`, `FreshnessUnsatisfiable`, `Conflict(serverMeta)`,
    `Missing(key)` (StoreError.kt:12, :21, :30, :39, :45, :54), each with a one-line "when you
    see it" description drawn from its KDoc.
  - The variant set is frozen for the 6.x major: new failure kinds map into these categories via
    structured detail payloads, which is what lets the hierarchy bridge to an exhaustive Swift
    enum (StoreError.kt:5-8). Consequence stated plainly: an exhaustive `when` over StoreError
    is safe to write, on Kotlin and on the bridged Swift side. Cross-link
    [Store 6 from Swift](/docs/store6/guides/swift).
  - Code snippet: exhaustive `when (result.error)` over the six variants — display-form,
    verified against the sealed class (StoreError.kt:10-61).
- **H2: The message contract**
  - Every message states what was attempted, for which key or namespace, and the likely fix
    (StoreError.kt:8; per-variant message KDocs, e.g. StoreError.kt:13-14).
  - `Conflict` optionally carries server-side `StoreMeta` describing the conflicting state
    (StoreError.kt:45-51); `Missing` carries the key itself (StoreError.kt:54-57).
- **H2: The get path: StoreException**
  - `StoreException` is a `RuntimeException` whose message is the wrapped error's message and
    which exposes the structured `.error` (StoreException.kt:8-12) — catch it, match on
    `.error`, don't parse strings.
  - When `get` throws: fetch or source-of-truth failure, a concurrent clear removing the key
    mid-fetch, `LocalOnly` finding nothing local, or a server-reported deletion — all as
    documented on the method contract (Store.kt:59-63).
  - Boundary note: a closed store fails with `IllegalStateException` (`Store is closed.`), not a
    StoreError — it is a lifecycle bug in the caller, not a data failure (Store.kt:169-171).
- **H2: Where Missing comes from**
  - Four producers, each verifiable: `LocalOnly` with nothing local — no Loading frame, no
    fetcher call (Freshness.kt:44-48; docs/store6/important-defaults.md:24-27); a clear racing
    an in-flight fetch — waiters observe Missing (Store.kt:116-118); a fetcher returning
    `FetcherResult.Deleted` — destructive clear, no auto-refetch (FetcherResult.kt:16-18,
    :43-44); an expert validator returning `Skip` with no resident value
    (FreshnessValidator.kt:48-50, advanced note).
- **H2: Rendering servedStale errors**
  - `Error.servedStale = true` means an invalidated resident was served and its refresh failed
    under `CachedOrFetch` or `StaleIfError` (StoreResult.kt:62-69): the user still has usable
    content on screen. Render an error affordance over the content; don't blank the screen.
  - Tie to the stale-while-revalidate asymmetry: after invalidate a failed fetch leaves old
    content plus an error; after clear it leaves an empty screen plus an error
    (docs/store6/invalidate-vs-clear.md:142-156). Cross-link
    [Invalidate or clear](/docs/store6/invalidate-vs-clear).
- **H2: Retries are yours, deliberately**
  - The engine does not retry the fetcher: zero retries, zero backoff, at zero configuration;
    one demand cycle invokes the fetcher exactly once, a failure schedules no background retry,
    and a later call is new demand (docs/store6/important-defaults.md:37-42).
  - Retry policy belongs inside your fetcher, where you control it — cross-link
    [Fetchers](/docs/store6/guides/fetchers) for patterns.
- **H2: Constructing errors in tests and extensions** (short)
  - Admonition (stability): `StoreError`/`StoreResult`/`StoreException` constructors are
    internal; the sanctioned construction door is the seam's `StoreResults` object
    (`@ExperimentalStoreApi`) (StoreResults.kt:12-28), and store6-testing's result factory for
    tests. Cross-link [Testing](/docs/store6/guides/testing) and
    [API tiers](/docs/store6/concepts/api-tiers).
- **Cross-links:** read-contract, freshness (MustBeFresh terminal case), fetchers guide,
  swift guide, testing guide.

---

## /docs/store6/concepts/memory-and-lifecycle

- **Title:** Memory, eviction, and store lifecycle
- **Disposition:** new
- **Audience:** Users moving to production concerns
- **Purpose:** Bounded memory via maxIdleKeys, why eviction is semantically invisible, what pins
  an engine, single-flight deduplication, reader grace, and close() as the end of the store's
  life.
- **Sources:** `store6-core/.../core/StoreBuilder.kt`, `docs/store6/important-defaults.md`;
  supporting: `Store.kt`.

### Skeleton

- **Intro (no heading)**
  - Frame: a Store holds one lightweight engine per active key; this page explains what keeps an
    engine alive, what bounds the idle ones, and why eviction never changes what a read returns.
- **H2: What pins an engine**
  - Engines whose key has active collectors, in-flight work, or an in-flight fetch are always
    resident and never evicted (StoreBuilder.kt:108-111;
    docs/store6/important-defaults.md:54-57).
- **H2: Bounding idle keys: maxIdleKeys**
  - Once a key becomes quiescent its engine parks in an LRU idle set holding at most `count`
    engines; the eldest quiescent engine beyond the bound is destroyed; default 128; `0`
    destroys every engine at quiescence; the count must be >= 0 or the builder throws
    (StoreBuilder.kt:106-121).
  - `maxIdleKeys` is the one stable non-fetcher builder knob — no experimental opt-in needed
    (StoreBuilder.kt:118, contrast the `@ExperimentalStoreApi` members at :134-172).
  - Code snippet: `store<K, V> { fetcher { … }; maxIdleKeys(256) }` — display-form verified
    against StoreBuilder.kt:75-77, :118-121.
- **H2: Eviction is semantically invisible**
  - Eviction discards only derived in-memory state — durable rows, freshness metadata, stale
    marks, and watermarks live in the source of truth and bookkeeper — so a later read of an
    evicted key is semantically identical to one that was never evicted (StoreBuilder.kt:112-115).
  - Invalidation watermarks survive restart and eviction, and are observed by keys a fresh store
    has never seen (docs/store6/important-defaults.md:61-64).
  - Pitfall: `maxIdleKeys(0)` does not disable caching and eviction does not lose invalidation
    state — durable truth is not in the engine.
- **H2: What "durable" means with zero config**
  - In-memory source of truth and in-memory bookkeeper by default; nothing touches disk until
    `persistence(...)` is installed (StoreBuilder.kt:180, :52;
    docs/store6/important-defaults.md:49-50). With defaults, "durable" state survives eviction
    but not process death — cross-link [Persistence](/docs/store6/guides/persistence),
    [Room](/docs/store6/room), [SQLDelight](/docs/store6/sqldelight).
  - Admonition (stability): `persistence`, `bookkeeper`, `telemetry`, `overlay`, `wallClock`,
    and `freshnessValidator` are `@ExperimentalStoreApi` seam installs (StoreBuilder.kt:134-172);
    the zero-config path needs no opt-in.
- **H2: Single-flight deduplication**
  - 50 getters and 50 collectors demanding one key produce exactly one fetch and all 100 observe
    its outcome; a stream arriving during an in-flight fetch piggybacks; cancelling a waiter
    does not cancel the shared fetch — the work commits and the next caller reuses it
    (docs/store6/important-defaults.md:68-75).
- **H2: Reader grace**
  - Re-subscribing within a short window after the last collector leaves resumes the existing
    pipeline rather than starting over with a fresh `Loading` frame; the window's millisecond
    value is an internal constant and deliberately not pinned by documentation
    (docs/store6/important-defaults.md:101-105). State the non-contractual status explicitly —
    do not design against a specific number.
- **H2: The end of the store's life: close()**
  - `close()` releases resources and cancels in-flight work; waiting collectors and value
    requests are cancelled; every subsequent operation fails with `IllegalStateException` and
    the exact message `Store is closed.`; close is idempotent (Store.kt:166-173).
  - Guidance: scope a store to a lifecycle you own and close it when done; streams do not end on
    their own (Store.kt:24-27) — cross-link
    [read contract](/docs/store6/concepts/read-contract).
- **Cross-links:** important-defaults (test-pinned spec of every default), persistence guide,
  performance guide (measured overhead), compose page (lifecycle-gated collection).

---

## /docs/store6/concepts/api-tiers

- **Title:** API tiers and opt-in annotations
- **Disposition:** new
- **Audience:** All users hitting an opt-in prompt; library evaluators
- **Purpose:** When and why the compiler asks for @ExperimentalStoreApi, @DelicateStoreApi, or
  blocks @InternalStoreApi; tier-on-the-artifact, SemVer scoped to the stable tier, and the
  seam's freeze-candidate status including the Overlay/StoreWriteHandle contingency.
- **Sources:** `store6-core/.../core/Annotations.kt`, `STABILITY.md`.

### Skeleton

- **Intro (no heading)**
  - Frame around the moment the reader is in: the compiler just refused an API and named an
    opt-in. All three markers are `RequiresOptIn.Level.ERROR` — nothing is usable by accident
    (Annotations.kt:9-10, :29-30, :51-52; STABILITY.md:28-30).
- **H2: `@ExperimentalStoreApi` — may change in any release**
  - Marks API under active development that may change or be removed in any release;
    experimental API ships in separate artifacts wherever possible, and the marker exists for
    cases where an experimental member must live beside stable API (Annotations.kt:3-8).
  - Where you will hit it in core: every type in the seam package and every expert builder knob
    — `fetcher(Fetcher)`, `persistence`, `telemetry`, `overlay`, `bookkeeper`, `wallClock`,
    `freshnessValidator` (StoreBuilder.kt:101, :134-172). The zero-config path — `store { }`,
    lambda fetcher, `fetcherOfResult`, `maxIdleKeys` — needs no opt-in
    (StoreBuilder.kt:75, :88, :118).
  - Code snippet: opting in at the use site with `@OptIn(ExperimentalStoreApi::class)` —
    display-form against the annotation declaration (Annotations.kt:22).
- **H2: `@DelicateStoreApi` — stable but easy to misuse**
  - Opting in asserts that you uphold the documented contract of the marked declaration
    (Annotations.kt:24-28).
  - The canonical case: implementing `Store` directly instead of building one through the
    `store { }` DSL — `Store` carries `@SubclassOptInRequired(DelicateStoreApi::class)`, so
    implementing the interface is a deliberate act, not a default (Store.kt:16;
    STABILITY.md:28-30). Seam interfaces users implement carry the same subclass gate (e.g.
    FreshnessValidator.kt:38).
- **H2: `@InternalStoreApi` — never yours**
  - Internal to the Store libraries; may change or disappear without notice even in patch
    releases; must never be used outside `org.mobilenativefoundation.store` artifacts
    (Annotations.kt:46-49). If you find yourself wanting it, the supported route is the seam —
    cross-link [Extending Store](/docs/store6/guides/extending).
- **H2: The tier is on the artifact**
  - Experimental code lives in separate artifacts, never annotation-gated inside a stable one:
    the tier is stated on the artifact you depend on (STABILITY.md:32-34).
  - SemVer is scoped to the stable tier: a breaking change to an `@ExperimentalStoreApi` surface
    in a minor release is not a SemVer violation, because that surface never claimed the
    guarantee (STABILITY.md:36-38).
  - Compact artifact/tier summary (store6-core stable-track, not frozen until the beta01 freeze
    candidate; testing/adapters/mutations/devtools experimental) with a pointer to the
    [stability policy](/docs/store6/stability) for the full table (STABILITY.md:45-55). Do not
    duplicate the whole table — the stability page is the synchronized authority.
- **H2: The seam: freeze candidate, not frozen**
  - Inside store6-core, the `org.mobilenativefoundation.store6.core.seam` package — the 13 files
    you implement to plug in a fetcher, source of truth, bookkeeper, clock, telemetry, or
    overlay — is a freeze candidate, not frozen; today those types are `@ExperimentalStoreApi`,
    the stated exception to the separate-artifact rule (STABILITY.md:57-61).
  - The two-stage distinction stated as the policy states it: candidate status required a real
    producer exercising the seam end to end; `Overlay` and `StoreWriteHandle` become frozen only
    once the ack-path atomicity work and its test matrix are green — if that misses beta01, those
    two ship `@ExperimentalStoreApi` outside the frozen tier and the rest of core freezes on
    schedule (STABILITY.md:63-68).
  - CI enforces the 13-file list on every pull request, so the seam cannot grow quietly
    (STABILITY.md:67-68).
  - One exception worth naming: `FetcherResult` carries no experimental marker, because the
    stable `fetcherOfResult` builder member needs it — it is the one seam type reachable without
    opt-in (FetcherResult.kt:22; StoreBuilder.kt:88-90).
- **H2: What opting in commits you to** (short, practical)
  - Experimental: expect shapes to change between alphas; pin versions accordingly. Delicate:
    read the contract KDoc of the declaration and uphold every documented semantic; custom
    source-of-truth and bookkeeper implementations should run the contract kits — cross-link
    [Testing](/docs/store6/guides/testing) and [Extending Store](/docs/store6/guides/extending).
- **Cross-links:** stability (full artifact table, deprecation cycle, verification mechanics),
  roadmap (freeze timeline), extending guide, testing guide, mutations overview (an entire
  experimental artifact).

---


<!-- ================================================================ -->

# Section outlines — Store 6 — Guides and integrations (`store6-guides`)

# Section outlines: Store 6 — Guides and integrations (store6-guides)

All anchors are repo-relative paths in Repo A (matt-ramotar/Store6, main @ a6a156e9) unless
prefixed `store-docs/` (Repo B). Every anchor below was verified by reading the file at that
revision.

---

## /docs/store6/guides/fetchers

- **Title:** Fetchers: results, errors, and conditional fetch
- **Disposition:** new
- **Audience:** Users connecting a real backend
- **Purpose:** From the lambda fetcher to `fetcherOfResult` and the seam `Fetcher`: the
  `FetcherResult` vocabulary, ETags and the `Revalidated` frame, `Deleted` as server-reported
  deletion, and where retry policy lives (your fetcher, never the engine).
- **Sources:** `store6-core/src/commonMain/kotlin/org/mobilenativefoundation/store6/core/seam/Fetcher.kt`,
  `store6-core/src/commonMain/kotlin/org/mobilenativefoundation/store6/core/seam/FetcherResult.kt`,
  `store6-core/src/commonMain/kotlin/org/mobilenativefoundation/store6/core/StoreBuilder.kt`,
  `docs/store6/important-defaults.md`

### Skeleton

- **H2: The fetcher is the one required input**
  - `store<K, V> { }` fails at build time with `IllegalArgumentException` when no fetcher is
    configured; the message names all three install points
    (`StoreBuilder.kt:176-179`). Installing a source of truth does not substitute for a fetcher
    (`docs/store6/important-defaults.md:109-111`).
  - Even `Freshness.LocalOnly` — which never invokes the fetcher — does not make it optional at
    build time (`Freshness.kt:43-52` LocalOnly KDoc; `docs/store6/important-defaults.md:24-27`).
  - Code snippet: the minimal lambda-fetcher store from the CI-compiled quickstart module
    (`store6-quickstart/src/main/kotlin/org/mobilenativefoundation/store6/quickstart/Main.kt:49-51`).
- **H2: Three install points, last registration wins**
  - `fetcher(lambda)` (`StoreBuilder.kt:75`) is success-or-throw sugar: a returned value becomes
    `FetcherResult.Success`, a thrown exception follows the fetch-failure path
    (`StoreBuilder.kt:66-71`).
  - `fetcherOfResult { }` (`StoreBuilder.kt:88`) returns the full `FetcherResult` vocabulary and is
    a stable builder member; the name follows v5's `Fetcher.ofResult` (`StoreBuilder.kt:79-87`).
  - `fetcher(Fetcher)` (`StoreBuilder.kt:101-104`) installs the regular-interface seam fetcher and
    is `@ExperimentalStoreApi`; `Fetcher` is deliberately not a fun interface so lambda calls keep
    resolving to the sugar overload (`StoreBuilder.kt:92-97`).
  - The last registration wins across all three install points — registrations replace, they never
    compose (`StoreBuilder.kt:70-71`, `:83-84`, `:96-97`).
  - Code snippet: the three registration forms side by side, built from the verified signatures at
    `StoreBuilder.kt:75`, `:88`, `:102`.
- **H2: The FetcherResult vocabulary**
  - Exactly four kinds: `Success(value, etag)`, `NotModified(etag)`, `Error(cause)`, `Deleted`
    (`FetcherResult.kt:22-45`).
  - `Error(cause)` is equivalent to throwing `cause` from the fetcher (`FetcherResult.kt:16`,
    `:38-41`).
  - `FetcherResult` carries no opt-in annotation because the stable `fetcherOfResult` member needs
    it — it is the one seam type reachable without opt-in (`FetcherResult.kt:22`; contrast
    `Fetcher.kt:18-19`).
  - Cross-link: `/docs/store6/concepts/errors` for how a fetch failure surfaces as
    `StoreError.Fetch` on each read door.
- **H2: Conditional fetch: ETags and the Revalidated frame**
  - A seam `Fetcher` receives a non-null `etag` if and only if the engine's freshness validator
    selected a conditional plan (`Fetcher.kt:11-13`, `:22-25`).
  - Returning `NotModified` refreshes the resident value's metadata and emits
    `StoreResult.Revalidated`; with no resident value it produces `StoreError.Missing`
    (`FetcherResult.kt:12-14`, `:29-36`).
  - The stream surfaces this as exactly one `Revalidated(age)` frame that clears durable staleness
    — not a redundant `Data` frame (`docs/store6/important-defaults.md:91-92`).
  - Lambda fetchers never see ETags: their signatures cannot accept them, so the sugar ignores
    conditional plans (`FetcherResult.kt:14-15`).
  - Cross-link: `/docs/store6/concepts/read-contract` (handling all four `StoreResult` kinds,
    including `Revalidated`).
- **H2: Deleted: server-reported deletion**
  - `Deleted` destructively clears the resident value and forgets its freshness; streams and
    waiters receive `StoreError.Missing`, and no automatic refetch follows
    (`FetcherResult.kt:16-18`, `:43-44`).
  - Decision note: `Deleted` is for the server saying "this no longer exists" — contrast with the
    caller-driven removal in `/docs/store6/invalidate-vs-clear`.
- **H2: Where retry policy lives**
  - The engine performs zero retries and zero backoff: one demand cycle invokes the fetcher exactly
    once, a failure schedules no background retry, and a later call is new demand
    (`docs/store6/important-defaults.md:37-42`).
  - Consequence: retry, backoff, and fallback chains belong inside the fetcher body, where the
    application controls the policy (`docs/store6/important-defaults.md:41-42`).
  - Code snippet (pattern, marked as illustrative): a `fetcherOfResult` body that tries a primary
    endpoint, falls back to a secondary, and maps terminal failure to `FetcherResult.Error` —
    composed from the verified vocabulary at `FetcherResult.kt:22-45`.
- **H2: Fetcher boundaries**
  - Implementations must cooperate with coroutine cancellation and must not write Store residence,
    persistence, or bookkeeping directly (`Fetcher.kt:10-11`).
  - The seam fetcher is one suspend call returning one `FetcherResult` (`Fetcher.kt:22-25`); there
    is no multi-emission fetcher. Push/streaming sources write into the source of truth instead:
    external durable changes surface on active reads attributed `Origin.SOT`
    (`SourceOfTruth.kt:33-36`; `docs/store6/important-defaults.md:80-81`). Cross-link:
    `/docs/store6/guides/persistence`.
  - Testing note + cross-link: `FakeFetcher` records the `etag` the engine passed, so conditional
    plans are assertable (`store6-testing/.../FakeFetcher.kt:11-14`, `:69-70`) —
    `/docs/store6/guides/testing`.

### Admonitions

- Stability callout: the seam `Fetcher` interface is `@ExperimentalStoreApi` and implementing it
  requires the subclass opt-in (`Fetcher.kt:18-19`); the lambda and `fetcherOfResult` members are
  stable builder surface (`StoreBuilder.kt:75`, `:88`). Link `/docs/store6/concepts/api-tiers` and
  `/docs/store6/stability`.

### Cross-links

`/docs/store6/concepts/read-contract`, `/docs/store6/concepts/errors`,
`/docs/store6/concepts/freshness`, `/docs/store6/invalidate-vs-clear`,
`/docs/store6/guides/persistence`, `/docs/store6/guides/testing`, `/docs/store6/quickstart`

---

## /docs/store6/guides/persistence

- **Title:** Persistence: the SourceOfTruth contract
- **Disposition:** new
- **Audience:** Users adding a database; self-implementers
- **Purpose:** What Store 6 requires of a local source — reader liveness, read-your-writes,
  exception-atomicity, the detectable transactional capability — plus how to choose between the
  Room and SQLDelight adapters and how to certify a custom implementation.
- **Sources:** `store6-core/.../core/seam/SourceOfTruth.kt`,
  `store6-core/.../core/seam/TransactionalSourceOfTruth.kt`, `store6-room/README.md`,
  `store6-sqldelight/README.md`, `store6-testing/.../SourceOfTruthContractKit.kt`

### Skeleton

- **H2: What a source of truth is to Store**
  - Installed with `persistence(sot)` on the builder (`StoreBuilder.kt:134-137`); until then the
    store uses an internal in-memory default and nothing touches disk (`StoreBuilder.kt:180`;
    `docs/store6/important-defaults.md:49-50`).
  - The engine reads `reader`, writes fetched values through `write`, and treats `delete` as
    destructive persistence removal (`StoreBuilder.kt:124-130`).
  - The contract is a nullable-row model: `reader(key): Flow<V?>`, `write`, `delete`,
    `deleteNamespace`, `deleteAll` (`SourceOfTruth.kt:45-76`).
- **H2: The reader contract**
  - Every collection first emits the current row, or `null` when absent (`SourceOfTruth.kt:14`).
  - An active collection emits every subsequent change made through the instance — including a
    write equal to the current value and matching deletes as `null`; emissions may be conflated
    (`SourceOfTruth.kt:15-17`).
  - A reader collection never completes normally; non-cancellation failures are retried by the
    engine, and each new attempt starts again with the current row (`SourceOfTruth.kt:18-20`).
  - External changes made while no reader is collected must appear in the next collection's first
    emission; reactivity to another instance's changes is implementation-specific
    (`SourceOfTruth.kt:33-36`).
- **H2: The mutation contract**
  - Read-your-writes on normal return: a subsequent reader collection starts with the applied row
    or absence, and each mutation's notification has been published to matching active collections
    (`SourceOfTruth.kt:21-28`).
  - Exception-atomicity for every `Throwable`, including `CancellationException`: normal return
    means applied, throwing means not applied (`SourceOfTruth.kt:29-31`).
  - `deleteNamespace` and `deleteAll` remove rows while readers stay live and receive `null`
    (`SourceOfTruth.kt:58-75`). `clearCache` is deliberately absent — cache clearing is not a
    persistence mutation (`SourceOfTruth.kt:38`).
- **H2: Transactions are a detectable capability**
  - `TransactionalSourceOfTruth` adds `withTransaction`; the engine detects it via
    `sot is TransactionalSourceOfTruth` and never assumes it — there is deliberately no silent
    non-atomic default (`TransactionalSourceOfTruth.kt:8-10`, `:17-19`).
- **H2: Choosing an adapter: Room or SQLDelight**
  - Comparison table (three rows, each cell a checkable claim):
    - Atomicity boundary — SQLDelight commits each user-row mutation and its metadata in one
      `Transacter` transaction (`store6-sqldelight/.../SqlDelightSourceOfTruth.kt:35-38`); Room
      commits value and freshness metadata as two non-atomic durable steps, and rehydration after a
      crash between them conservatively treats the value as age-unknown/stale
      (`store6-room/.../RoomBookkeeper.kt:29-32`).
    - Reader semantics — Room layers a generation-gated echo over the table-granular invalidation
      tracker so equal-value rewrites re-emit exactly once and same-table writes to other rows do
      not re-emit (`store6-room/.../RoomSourceOfTruth.kt:171-183`); SQLDelight reader signals are
      instance-scoped: external commits are read by a new collection's first emission
      (`store6-sqldelight/.../SqlDelightSourceOfTruth.kt:45-49`).
    - Target coverage — Room ships 8 of core's 12 targets (no js, wasmJs, mingwX64, iosX64)
      (`store6-room/README.md:184-198`); SQLDelight compiles for all 12 but JS/Wasm are
      compile-only because the adapter requires synchronous drivers
      (`store6-sqldelight/README.md:110-117`).
  - Cross-links: `/docs/store6/room` and `/docs/store6/sqldelight` for the walkthroughs.
- **H2: Certify a custom implementation**
  - Extend `SourceOfTruthContractKit<K, V>` in the test source set; every inherited `@Test` member
    executes on every compiled target (`store6-testing/.../SourceOfTruthContractKit.kt:21-36`).
  - Pair it with `BookkeeperContractKit` when the implementation ships its own bookkeeper
    (`store6-testing/.../BookkeeperContractKit.kt:18-29`); together the suites cover 15
    source-of-truth contracts and 6 bookkeeping contracts (`store6-room/README.md:173-174`).
  - Code snippet: the kit-extension sample verbatim from the kit KDoc
    (`SourceOfTruthContractKit.kt:25-33`).
  - Cross-link: `/docs/store6/guides/testing`.

### Admonitions

- Stability callout: `SourceOfTruth` is `@ExperimentalStoreApi` and implementing it requires the
  subclass opt-in (`SourceOfTruth.kt:43-44`); the seam package is a freeze candidate, not frozen
  (`STABILITY.md:57-68`). Link `/docs/store6/concepts/api-tiers` and `/docs/store6/stability`.

### Diagrams

- One small flow diagram: read resolution (memory → source-of-truth probe → fetcher) with the
  reader flow feeding stream emissions — mechanism per `StoreBuilder.kt:124-130` and
  `SourceOfTruth.kt:14-20`; no numbers, no internals beyond the seam.

### Cross-links

`/docs/store6/room`, `/docs/store6/sqldelight`, `/docs/store6/guides/testing`,
`/docs/store6/guides/fetchers`, `/docs/store6/concepts/memory-and-lifecycle`,
`/docs/store6/concepts/api-tiers`, `/docs/store6/stability`

---

## /docs/store6/room

- **Title:** Room adapter
- **Disposition:** sync-owned (new route; new sync-lock entry)
- **Audience:** Android/KMP users on Room
- **Purpose:** Wrap an existing Room 3 database: the three-declaration database diff, the
  one-version migration, the walkthrough, contract-kit testing, and the compatibility statement.
  Synchronized from `store6-room/README.md` — the same ownership model as the compose and
  sqldelight siblings.
- **Sources:** `store6-room/README.md`, `store6-room/.../Store6RoomSchema.kt`,
  `store-docs/evidence/T4-store6-source-lock.json`

### Sync mechanics (not page content)

- `store6-room/README.md` is **not** currently in the source lock
  (`store-docs/evidence/T4-store6-source-lock.json` has 10 entries; none is the Room README —
  verified). Adding this page means: new lock entry (path + sha256 + target
  `content/docs/store6/room.mdx`), new `sync-store6-docs` ledger row, T8 extras update, and grouping
  under Guides via `meta.json`. Content changes happen in Repo A only.
- The README's H1 (`store6-room/README.md:1`) becomes frontmatter title under the sync transform;
  the file contains no relative markdown links that need rewriting (verified by reading the file).

### Skeleton (mirrors the Repo A source as it exists today)

- **Intro** — the adapter connects Store6 to an existing Room database; the DAO stays the source of
  truth for values; two sidecar tables carry freshness metadata and durable invalidation
  (`store6-room/README.md:3-5`).
- **H2: 15-minute existing-database walkthrough** (`README.md:7-163`)
  - **H3: 1. Add the dependencies (2 minutes)** — Room 3 plugin (`androidx.room3`), KSP, Kotlin
    2.3.20 plugin block and dependency list; source-set-level opt-in covers Room's generated DAO
    code (`README.md:12-50`).
  - **H3: 2. Make the three-declaration database diff (3 minutes)** — keep every existing entity
    and DAO; add `Store6BookkeepingEntity`, `Store6WatermarkEntity`, and one
    `store6BookkeeperDao()` accessor; Store6 changes no columns or constraints in user tables
    (`README.md:52-74`).
  - **H3: 3. Add the migration (2 minutes)** — one version bump; `Store6RoomSchema.createTables`
    creates `store6_bookkeeping` and `store6_watermarks` and does not alter user tables
    (`README.md:76-92`; SQL constants and `createTables` at `Store6RoomSchema.kt:14-36`).
  - **H3: 4. Wire Store6 to your DAO (5 minutes)** — `RoomSourceOfTruth` over five DAO lambdas plus
    `RoomBookkeeper`; both take the same `RoomDatabase` so operations share one database lifecycle
    (`README.md:94-125`).
  - **H3: 5. Run and inspect the walkthrough (3 minutes)** — the sample checks four observable
    behaviors (legacy row served without fetch; cold key Loading→Data; rebuild serves fresh without
    refetch because metadata is durable; namespace invalidation survives rebuild) and exits nonzero
    on failure (`README.md:127-147`).
  - **H3: Honest timing checklist** — the self-verification checklist with recorded-time blank
    (`README.md:149-163`).
- **H2: Testing your wiring** — extend `SourceOfTruthContractKit` and `BookkeeperContractKit`
  against database-backed fixtures; 15 + 6 inherited contracts (`README.md:165-175`).
- **H2: Compatibility statement** — Room 3.0.0 / Kotlin 2.3.20 / androidx.sqlite 2.7.0 pins; the
  8-target list and the 4-target gap vs core's 12; compileSdk 34+ / minSdk 24+; Room 2.x never
  supported; the cancellation-at-commit-boundary conservative edge (`README.md:177-219`).

### Upstream edits wanted (Repo A, never on the site copy)

- Add the one-line seam-status pointer ("The Store6 seam is a freeze candidate, not frozen — see
  STABILITY.md") that the sqldelight README carries at `store6-sqldelight/README.md:5`, so the two
  adapter pages open with the same stability framing after sync.

### Cross-links

`/docs/store6/guides/persistence`, `/docs/store6/sqldelight`, `/docs/store6/guides/testing`,
`/docs/store6/stability`

---

## /docs/store6/sqldelight

- **Title:** SQLDelight adapter
- **Disposition:** sync-owned (existing lock entry; slug unchanged, grouped under Guides via
  meta.json)
- **Audience:** KMP users on SQLDelight
- **Purpose:** The 15-minute existing-schema walkthrough: sidecar `store6_meta*` tables,
  one-transaction value+meta commits, the three boundary rules, and driver support including
  JS/Wasm compile-only status. Synchronized from `store6-sqldelight/README.md`.
- **Sources:** `store6-sqldelight/README.md`, `store-docs/evidence/T4-store6-source-lock.json`

### Sync mechanics (not page content)

- Already locked: lock entry `store6-sqldelight/README.md` →
  `content/docs/store6/sqldelight.mdx` (`store-docs/evidence/T4-store6-source-lock.json:45-49`).
  The site applies one locked transform rewriting source line 121 into a measurement-provenance
  paragraph. Grouping under Guides is a `meta.json` change only; the slug does not move.

### Skeleton (mirrors the Repo A source as it exists today)

- **Intro** — one SQLDelight database holds values plus durable freshness metadata; the generated
  schema is unchanged; four `store6_meta*` sidecar tables are created at construction; seam is a
  freeze candidate, not frozen (`store6-sqldelight/README.md:3-5`).
- **H2: 15-minute existing-schema walkthrough** (`README.md:7-106`)
  - **H3: 0. Prerequisites** — Kotlin 2.3, SQLDelight 2.1.0, a synchronous driver; Maven Local
    publication until the snapshot is published remotely; Linux native linking needs the SQLite dev
    package and pkg-config (`README.md:9-17`).
  - **H3: 1. Add the adapter** — dependency block with `mavenLocal()` (`README.md:19-33`).
  - **H3: 2. Keep your existing schema** — no Store6 columns, queries, or migrations in `.sq`
    files; the adapter idempotently creates `store6_meta_schema`, `store6_meta_sequence`,
    `store6_meta`, `store6_meta_watermark` (`README.md:35-59`).
  - **H3: 3. Wire generated queries to Store6** — `SqlDelightSourceOfTruth` + `SqlDelightBookkeeper`
    wiring snippet; the three boundary rules verbatim: round trip, one driver, synchronous
    transactions (`README.md:61-89`, rules at `:81-85`); reader signals are instance-scoped
    (`:87`); one logical Store per database and namespace set (`:89`).
  - **H3: 4. Run twice** — reset run then durable-meta zero-refetch run with the exact expected
    output line; `close()` semantics and the `maxIdleKeys` residency bound (`README.md:91-106`).
- **H2: Drivers and current limitations** — the four-row driver table; JS/Wasm not yet supported
  because the adapter currently requires synchronous drivers; published artifact covers the
  canonical targets, driver-backed execution is narrower (`README.md:108-117`).
- **H2: Timing** — measured 62.72 s total from a clean consumer, with machine and method stated;
  evidence the documented path fits inside 15 minutes on that machine (`README.md:119-131`; site
  transform applies to source line 121).

### Upstream edits wanted (Repo A, never on the site copy)

- None required. When remote snapshots publish, the Maven Local instructions in
  `README.md:11-14` and `:24-27` will need a Repo A revision (re-pin lock hash and the line-121
  transform anchor at that time).

### Cross-links

`/docs/store6/guides/persistence`, `/docs/store6/room`, `/docs/store6/guides/testing`,
`/docs/store6/stability`

---

## /docs/store6/compose

- **Title:** Compose integration
- **Disposition:** sync-owned (existing lock entry; slug unchanged, grouped under Guides via
  meta.json)
- **Audience:** Compose Multiplatform UI developers
- **Purpose:** `collectAsState` / `collectAsStateWithLifecycle` / `collectAsStoreState`, the
  recomposition discipline, `skipEqualData`, and the shipped stability-configuration snippet.
  Synchronized from `store6-compose/README.md`.
- **Sources:** `store6-compose/README.md`, `store6-compose/stability/store6-stability.conf`,
  `store-docs/evidence/T4-store6-source-lock.json`

### Sync mechanics (not page content)

- Already locked: `store6-compose/README.md` → `content/docs/store6/compose.mdx`
  (`store-docs/evidence/T4-store6-source-lock.json:40-44`). The site's locked transform replaces
  source lines 37-45 with the `composeCompiler` snippet plus the conf mirror block, and the site
  test pins the conf code block verbatim. Grouping under Guides is a `meta.json` change only.

### Skeleton (mirrors the Repo A source as it exists today)

- **Intro** — everything is `@ExperimentalStoreApi`; the consumed seam is a freeze candidate, not
  frozen (`store6-compose/README.md:1-4`).
- **H2: Entry points** (`README.md:6-15`)
  - `Store.collectAsState(key, freshness)` starts at `Loading` and restarts only on structural
    identity change (namespace/canonicalId/freshness), all targets.
  - `Flow.collectAsStoreState(initial)` is the flow-level variant for stateIn/ViewModel flows.
  - Lifecycle-gated variants need a `LifecycleOwner`; on targets with no UI host populating
    `LocalLifecycleOwner`, pass one explicitly.
  - `skipEqualData()` / `storeResultMutationPolicy()` for custom state holders.
- **H2: Recomposition discipline** (`README.md:17-27`)
  - `StoreResult` types deliberately have identity equality; the module skips recomposition by
    structural comparison of `Data`'s value/origin/isStale/refreshing with `age` excluded (it
    advances every emission).
  - Results are never merged across kinds; `Loading`/`Revalidated`/`Error` always pass — stricter
    than the engine's same-kind conflation rule it mirrors.
  - Event-shaped consumption of `Revalidated`/`Error` should collect the Flow, not a State.
- **H2: Stability configuration for consumers** (`README.md:29-56`)
  - Strong skipping compares unstable parameters by instance; the shipped two-line conf
    (`store6-compose/stability/store6-stability.conf:8-9`) makes core types compare as stable
    values so skipping works on equal content.
  - CI verifies the exact snippet against a tiered probe of core public types on every PR; with it
    every probed core type resolves stable, without it the gate fails (`README.md:47-50`).
  - The Gradle caveat: `stabilityConfigurationFiles` is not a declared task input and reports are
    undeclared outputs; consumers running report-based checks should compensate as this repository
    does (`README.md:52-56`).
- **H2: Demo** — `./gradlew :store6-compose-demo:run`: refreshing spinner-over-content, STALE
  badge, error-with-stale-data against a fake fetcher with toggleable latency and failure
  (`README.md:58-61`).

### Upstream edits wanted (Repo A, never on the site copy)

- None required for this cycle.

### Cross-links

`/docs/store6/concepts/read-contract`, `/docs/store6/mutations/pending-write-ui`,
`/docs/store6/guides/testing`, `/docs/store6/guides/devtools`

---

## /docs/store6/guides/testing

- **Title:** Testing with store6-testing
- **Disposition:** new
- **Audience:** Users writing tests; custom-seam implementers
- **Purpose:** Two tiers taught as such: ViewModel tests with `FakeStore`, and policy tests
  composing the seam fakes into a real `store { }`; plus the contract kits as certification suites
  for custom seam implementations.
- **Sources:** `store6-testing/.../FakeStore.kt`,
  `store6-testing/src/commonTest/.../UserViewModelSampleTest.kt`,
  `store6-testing/.../FakeBookkeeper.kt`, `store6-testing/.../SourceOfTruthContractKit.kt`,
  `store6-testing/.../BookkeeperContractKit.kt`

### Skeleton

- **H2: Two tiers, taught as two tiers**
  - Tier 1: unit-test a ViewModel or presenter against `FakeStore` — a programmable `Store` with
    scripted outcomes and recorded interactions (`FakeStore.kt:23-27`).
  - Tier 2: test engine policy (freshness, staleness, watermarks, overlays) by composing
    `FakeFetcher`/`FakeSourceOfTruth`/`FakeBookkeeper` into a real `store { }` — `FakeStore`
    records `Freshness` but never interprets it (`FakeStore.kt:24-27`).
  - `FakeStore.runtime()` returns null by design; it produces no KeyEvents and performs no overlay
    projection (`FakeStore.kt:56-57`).
- **H2: ViewModel tests with FakeStore**
  - Scripting: `enqueueFetchValue` / `enqueueFetchError` / `enqueueFetchRevalidated` are per-key
    FIFO outcomes consumed by demand (`FakeStore.kt:149-187`); `setValue` seeds residence without
    consuming a script, defaulting to `Origin.MEMORY` while scripted values commit with
    `Origin.FETCHER` (`FakeStore.kt:108-120`, `:52-53`).
  - Assertions: `interactions` records every Store call in order; `clearInteractions()` resets
    (`FakeStore.kt:99-106`); the vocabulary is `FakeStoreInteraction`
    (`store6-testing/.../FakeStoreInteraction.kt`).
  - Age control: the fake's `TestWallClock` drives `Data.age` deterministically — `advanceBy` /
    `setEpochMillis`, epoch 0 start (`FakeStore.kt:66-68`; `TestWallClock.kt:10-13`).
  - One failure channel holds: stream errors are values, never thrown; only an absent `get`
    throws, via `StoreException` through the public result-factory door (`FakeStore.kt:33-38`).
  - Code snippet: the ViewModel sample test end to end — `runningFold` over the four result kinds,
    `stateIn`, Turbine assertions, interaction assertion, close
    (`UserViewModelSampleTest.kt:25-59`).
  - **Honest caveat (its own callout):** every history frame is followed by `yield`, deliberately
    stronger delivery than the engine so StateFlow consumers can assert each lifecycle frame
    without conflation (`FakeStore.kt:28-30`) — passing FakeStore tests therefore do not prove
    conflation-safety against a real store, and FakeStore never interprets `Freshness`.
- **H2: Policy tests with a real store**
  - `FakeFetcher`: per-key FIFO `FetcherResult` queues, invocation recording including the etag
    the engine passed on a conditional plan, `onUnscripted` fallback (`FakeFetcher.kt:11-14`,
    `:19-27`, `:69-70`).
  - `FakeSourceOfTruth`: versioned cells so equal-value rewrites still emit; deletes emit null;
    readers never complete; passes the contract kit on every target (`FakeSourceOfTruth.kt:14-18`).
  - `FakeBookkeeper`: honors the durable-staleness algebra (`max(mark/ns/global) >
    (success ?: 0)`); watermarks never reset; share one instance across store instances to
    simulate process restart (`FakeBookkeeper.kt:13-19`).
  - Code snippet (pattern): a `store { }` composed from the three fakes plus `wallClock(TestWallClock)`,
    built from the verified builder members (`StoreBuilder.kt:134-171`).
- **H2: Contract kits: certification suites for custom seams**
  - Extend `SourceOfTruthContractKit<K, V>` with `createSourceOfTruth`, `keyA`, `keyB`,
    `keyOtherNamespace`, and `value(index)`; every inherited `@Test` executes on every compiled
    target (`SourceOfTruthContractKit.kt:21-50`).
  - Extend `BookkeeperContractKit` with `createBookkeeper()`; the kit asserts identity is derived
    from the `(namespace.value, canonicalId())` pair, not the key class
    (`BookkeeperContractKit.kt:18-51`).
  - Code snippet: the extension sample verbatim from each kit's KDoc
    (`SourceOfTruthContractKit.kt:25-33`; `BookkeeperContractKit.kt:22-26`).
  - Cross-link: `/docs/store6/guides/persistence` (what the contracts mean),
    `/docs/store6/room` and `/docs/store6/sqldelight` (adapters that run these kits).
- **H2: Building results in tests**
  - `TestStoreResults` is the public construction door for `StoreResult`, `StoreError`, and
    `StoreException` instances — their constructors are internal; the object delegates to the
    seam's sanctioned factory (`TestStoreResults.kt:13-20`).

### Admonitions

- Stability callout: store6-testing is Experimental — every public declaration carries
  `@ExperimentalStoreApi` (`STABILITY.md:48`). Link `/docs/store6/concepts/api-tiers`.

### Cross-links

`/docs/store6/guides/persistence`, `/docs/store6/mutations/testing`,
`/docs/store6/concepts/read-contract`, `/docs/store6/concepts/freshness`,
`/docs/store6/guides/fetchers`

---

## /docs/store6/guides/devtools

- **Title:** Devtools and the inspector
- **Disposition:** new
- **Audience:** Users debugging store behavior
- **Purpose:** One-line telemetry install, the v0 event vocabulary with its
  projection-not-engine-truth caveats, the in-process Compose inspector, and the unset-telemetry
  null fast path with its measured-cost framing.
- **Sources:** `store6-devtools/README.md`, `store6-devtools/EVENTS.md`,
  `store6-devtools/.../StoreDevtoolsMonitor.kt`, `store6-devtools-inspector/README.md`

### Skeleton

- **H2: Install in one line**
  - `telemetry(StoreTelemetryLogger())` in the store builder is the whole install
    (`store6-devtools/README.md:22-28`).
  - Logger and monitor together: `telemetry(storeTelemetryOf(logger, monitor))`
    (`README.md:30-44`; factory at
    `store6-devtools/.../CompositeStoreTelemetry.kt:62-65`).
  - The module ships Store6's full 12-target convention (`README.md:46-48`).
  - Code snippet: the logger+monitor store block verbatim from `README.md:32-44`.
- **H2: The v0 log line**
  - One line per event with fixed field order:
    `<label> v0 seq= t_ms= evt= ns= key= [origin=] [fetch_ms=] [error=]` (`EVENTS.md:14-22`).
  - Six kinds: `fetch_started`, `fetch_succeeded`, `fetch_failed`, `serve`, `invalidate`, `clear`
    (`EVENTS.md:37-44`); `error` is exactly one of the six literal `StoreError` variant names
    (`EVENTS.md:46-48`).
  - Callbacks run synchronously inline on the caller's thread and may arrive out of order; `seq`
    is the canonical ordering key (`EVENTS.md:28-35`).
  - Privacy boundary: logger lines never include stored values or `StoreError` message/cause; the
    in-memory monitor projection does retain the structured `StoreError` (`EVENTS.md:7-10`).
  - **Callout — not a wire format:** v0 is versioned but experimental; names and field order are
    stable within v0, a later alpha may revise it, and it is explicitly not the Store 6.1 wire
    format (`EVENTS.md:3-5`, `:88-90`).
- **H2: The monitor projection is observed telemetry, not engine truth**
  - `StoreDevtoolsMonitor.state` is a `StateFlow<DevtoolsSnapshot>`: key summaries, retained
    events, dropped-event count, latest sequence (`README.md:52-55`;
    `StoreDevtoolsMonitor.kt:50-51`).
  - The event→state table: `fetch_started`→FETCHING, `fetch_succeeded`→FRESH,
    `fetch_failed`→ERROR, `invalidate`→STALE, `clear`→CLEARED, first-`serve`→OBSERVED
    (`README.md:57-66`; `EVENTS.md:70-77`).
  - **Callout — FRESH is not freshness authority:** FRESH means only that no invalidation, clear,
    or failure has been observed since the latest success; `MaxAge` expiry emits no event and can
    never change the projection (`README.md:67-70`; `EVENTS.md:79-81`).
  - Capacity defaults to 500 retained events; overflow drops the oldest and increments
    `droppedEvents`; `clearLog()` preserves key summaries and the sequence high-water mark
    (`StoreDevtoolsMonitor.kt:32-37`, `:56-66`).
- **H2: The in-process inspector**
  - Two hosts: `StoreInspector(monitor)` renders directly; `StoreInspectorOverlay` wraps app
    content with a floating toggle and a lower-half panel
    (`store6-devtools-inspector/README.md:25-51`).
  - Tabs: Keys (derived state, last origin, observed-success age), Timeline (per-key rows labelled
    with the v0 event kind; a serve opening retained history renders OBSERVED because dropped
    history is never reconstructed), Events (newest first with drop accounting)
    (`README.md:60-67`).
  - Zero transport: everything stays in process — no sockets, host tools, or web panel
    (`README.md:71-72`).
  - Target subset: 8 targets (Android, JVM, four Apple, JS on Node, WasmJS browser-only) —
    narrower than devtools' 12 (`README.md:53-56`).
  - Code snippet: the two `@Composable` hosts verbatim from `README.md:25-46`.
- **H2: What installed telemetry costs — and what unset costs**
  - Installed cost is nonzero: each monitor event is a StateFlow CAS plus snapshot rebuild; each
    logger event formats one line and invokes its emitter synchronously
    (`store6-devtools/README.md:74-78`).
  - Leaving telemetry unset preserves the engine's null fast path (`README.md:78`;
    `StoreBuilder.kt:139-143`).
  - The JMH unset-vs-configured-no-op table, quoted with its own epistemics: no positive
    configured-no-op overhead was resolved, and the comparison does not prove literal zero cost
    (`README.md:80-93`). Cross-link `/docs/store6/guides/performance`.

### Admonitions

- Stability callout: store6-devtools and store6-devtools-inspector are Experimental with an
  alpha02 target (`STABILITY.md:54-55`).

### Cross-links

`/docs/store6/guides/performance`, `/docs/store6/concepts/freshness`,
`/docs/store6/mutations/inspection`, `/docs/store6/guides/extending`

---

## /docs/store6/guides/extending

- **Title:** Extending Store through the seam
- **Disposition:** new
- **Audience:** Extension authors and advanced implementers
- **Purpose:** Patterns proven by the in-repo extension probe: the delegating decorator, seam-only
  telemetry, consuming the open `KeyEvents` hierarchy, `StoreRuntime`/`StoreWriteHandle` as the
  extension-facing ack path, and the transactional-ack coordination case study — reference
  reading, explicitly never a dependency.
- **Sources:** `store6-extension-probe/.../LoggingStore.kt`,
  `store6-extension-probe/.../MetricsTelemetry.kt`,
  `store6-extension-probe/.../CoordinatedTransactionalSourceOfTruth.kt`,
  `store6-core/.../core/seam/StoreRuntime.kt`, `store6-core/.../core/seam/KeyEvents.kt`

### Skeleton

- **H2: What this page is**
  - The patterns come from an unpublished in-repo module that proves the public API plus the seam
    are sufficient for third-party extension without engine access. It is reference reading; the
    module is not a dependency and its coordinates are never published.
- **H2: The delegating decorator**
  - `LoggingStore` is `Store by delegate` overriding only `stream`, logging each of the four
    result kinds (`LoggingStore.kt:11-31`).
  - `runtime()` returns null for decorators because a decorator exposes its own affordances
    (`LoggingStore.kt:11`; `StoreRuntime.kt:31-33`).
  - The mutations facade follows this same shape: a narrowed delegate whose `runtime()` is null so
    the raw write handle stays hidden (cross-link `/docs/store6/mutations`).
  - Code snippet: `LoggingStore` in full (`LoggingStore.kt:11-31`).
- **H2: Seam-only telemetry**
  - `MetricsTelemetry` counts fetch starts/successes/failures, serves, invalidations, and clears
    by implementing only `StoreTelemetry` (`MetricsTelemetry.kt:11-13`).
  - The handler contract carries over: non-suspending, non-blocking, never throws.
  - Cross-link: `/docs/store6/guides/devtools` for the shipped sinks and `storeTelemetryOf`
    composition.
- **H2: Consuming KeyEvents**
  - The hierarchy is deliberately open, not sealed: consumers must retain an `else` branch so
    future minor-version variants stay source- and binary-compatible; constructors are internal
    (`KeyEvents.kt:10-12`).
  - Delivery is best-effort: hot stream, replay 0, bounded buffer of 64 dropping the oldest;
    correctness must never depend on observing every event; the flow never completes, including
    after `Store.close` — scope collection to your own lifecycle (`KeyEvents.kt:14-17`).
  - Producer points that emit nothing: purge sweeps, nonresident watermark coverage, external
    source-of-truth changes, superseded fetches (`KeyEvents.kt:22-24`).
  - Code snippet: `describeKeyEvent` with its mandatory `else`
    (`KeyEventDescriptions.kt:12-18`).
- **H2: The extension-facing write path: StoreRuntime and StoreWriteHandle**
  - `store.runtime()` exposes `writeHandle`, `keyEvents`, and the configured telemetry without
    implementation downcasts; non-engine stores, fakes, and decorators return null — a tested
    posture, not an accident (`StoreRuntime.kt:18-27`, `:31-39`).
  - `writeHandle.apply(key, value)` commits to the source of truth under the engine write lock;
    streams observe `Data(origin = SOT)`; it never fetches and records no bookkeeping success —
    pair with `confirmFresh` when the value is known fresh (`StoreWriteHandle.kt:18-33`).
  - `markStale` has semantics identical to `Store.invalidate` (`StoreWriteHandle.kt:36-41`);
    `confirmFresh` records success and clears durable staleness like a 304 without fetching, and is
    not an observation mechanism (`StoreWriteHandle.kt:44-54`).
  - Framing sentence: this is the extension-facing acknowledgement path, not a general consumer
    write API — consumer writes belong to the journalled path (cross-link
    `/docs/store6/mutations`).
- **H2: Case study: coordinating a transactional acknowledgement**
  - `CoordinatedTransactionalSourceOfTruth` wraps a `TransactionalSourceOfTruth` and pairs with an
    engine overlay: retirement signals raised while the transaction is open are coalesced until
    the confirmed echo is adopted with `StoreWriteHandle.apply` and `confirmFresh`; each active
    collection then restarts, and its contractually immediate first row recaptures current
    authority (`CoordinatedTransactionalSourceOfTruth.kt:27-39`).
  - Rollback follows the same authoritative recapture and does not rely on `confirmFresh` as an
    observation path (`CoordinatedTransactionalSourceOfTruth.kt:38-39`).
  - Honest label kept verbatim in spirit: an unpublished buildability probe, not a general-purpose
    journal implementation (`CoordinatedTransactionalSourceOfTruth.kt:41`).

### Admonitions

- Stability callout: every seam type on this page is `@ExperimentalStoreApi`, and implementing
  `Store` or a seam interface requires the `DelicateStoreApi` subclass opt-in
  (`StoreRuntime.kt:16-17`; `STABILITY.md:57-68`). The seam is a freeze candidate, not frozen.
  Link `/docs/store6/concepts/api-tiers` and `/docs/store6/stability`.

### Diagrams

- One sequence sketch for the case study: transaction open → retirement signal (coalesced) →
  apply + confirmFresh → collection restart → signal delivery — mechanism per
  `CoordinatedTransactionalSourceOfTruth.kt:27-39`.

### Cross-links

`/docs/store6/mutations`, `/docs/store6/guides/persistence`, `/docs/store6/guides/devtools`,
`/docs/store6/guides/testing`, `/docs/store6/concepts/api-tiers`, `/docs/store6/stability`

---

## /docs/store6/guides/performance

- **Title:** Performance and overhead
- **Disposition:** new
- **Audience:** Users evaluating cost; performance skeptics
- **Purpose:** What the benchmark harness measures and — as important — what its numbers may not
  support: ratio semantics, the collectors=1 headline, hosted CI as smoke-grade, and the telemetry
  unset-vs-noop evidence behind the null-fast-path claim.
- **Sources:** `store6-benchmarks/README.md`, `store6-devtools/README.md`

### Skeleton

- **H2: What the harness is**
  - An unpublished JVM harness; neither a published artifact nor a public API
    (`store6-benchmarks/README.md:3-7`).
  - Three profiles: `benchmark` (default local), `smokeBenchmark` (short CI shape),
    `calibrateBenchmark` (three forks; the only profile whose results may support a
    performance-target proposal, on a documented quiet machine)
    (`README.md:13-22`).
- **H2: What the ratio means — and what it does not**
  - The metric is the `storeStream` / `rawSotFlow` average-time ratio for an end-to-end timed
    invocation: the score includes collector launch, attachment, readiness, the write schedule,
    and final observation; it is not pure per-emission latency (`README.md:71-77`).
  - `collectors=1` is the engine-overhead headline because both sides use the same fake source of
    truth with matching reader multiplicity; `collectors=8` is fan-out/topology data and does not
    isolate engine overhead (`README.md:81-86`).
  - Store's `Dispatchers.Default` hops are part of Store cost; the raw side cooperates on
    `runBlocking` (`README.md:87`).
- **H2: Evidence grades**
  - Hosted CI is smoke-grade: no hosted number may support a performance target
    (`README.md:96-98`).
  - No numeric CI gate exists; workflows validate execution and schema only (`README.md:99-101`);
    the blocking CI step is a rot guard, the measurement lane is report-only and outside the
    release gate (`README.md:106-116`).
  - The timestamped report layout is evidence, not a stable path contract (`README.md:24-26`).
- **H2: Telemetry: unset versus configured no-op**
  - The telemetry-off zero-overhead claim is structural plus measured: structural tests establish
    that unset telemetry remains null and allocates no fetch mark; the `none`-vs-`noop` comparison
    estimates incremental configured-no-op overhead and does not prove literal zero cost
    (`README.md:88-95`).
  - The published JMH table (fetchGet / residentServe / streamEmissions, µs/op with 99.9% error
    bounds) with its stated reading: no positive configured-no-op overhead was resolved, and the
    negative point estimates do not prove the no-op sink is faster
    (`store6-devtools/README.md:80-93`).
  - Cross-link: `/docs/store6/guides/devtools` for what installed telemetry costs in operation.

### Admonitions

- Framing callout at the top: this page quotes numbers together with the boundaries the harness
  itself states; none of them is a guarantee, and only a local calibrate run on a documented quiet
  machine may support a target proposal (`store6-benchmarks/README.md:19-22`, `:96-98`).

### Cross-links

`/docs/store6/guides/devtools`, `/docs/store6/important-defaults`,
`/docs/store6/concepts/memory-and-lifecycle`

---

## /docs/store6/guides/swift

- **Title:** Store 6 from Swift
- **Disposition:** new
- **Audience:** iOS/KMP consumers
- **Purpose:** The iOS surface contract: shallow sealed hierarchies bridging to exhaustive Swift
  case sets, the suspend/Flow operational surface, Duration flattening in ObjC, per-module target
  subsets, and the committed ObjC/SKIE dumps diffed on every PR.
- **Sources:** `STABILITY.md`, `store6-core/api/swift`, `store6-core/.../core/StoreError.kt`

### Skeleton

- **H2: Sealed hierarchies arrive as exhaustive Swift case sets**
  - The SKIE bridge exposes each core sealed hierarchy through `onEnum(of:)` with a frozen
    `__Sealed` enum: `StoreError` has exactly six cases (conflict, conversion, fetch,
    freshnessUnsatisfiable, missing, persistence)
    (`store6-core/api/swift/skie/Store6CoreSkie.swift:2769-2794`); `StoreResult` has four (data,
    error, loading, revalidated) (`Store6CoreSkie.swift:2817-2836`); `Freshness` has five
    (`Store6CoreSkie.swift:2536-2558`); `FetcherResult` has four
    (`Store6CoreSkie.swift:2494-2513`).
  - Exhaustive switching over `StoreError` is safe to write: the variant set is frozen for the 6.x
    major, and new failure kinds map into the existing categories via structured detail payloads
    (`StoreError.kt:5-8`).
  - Code snippet: a Swift `switch onEnum(of: result)` over the four `StoreResult` cases, shaped by
    the verified bridge at `Store6CoreSkie.swift:2817-2836`.
- **H2: The operational surface is suspend and Flow**
  - `Store`'s operations are suspend functions and `stream` is a Flow; the ObjC export bridges
    each suspend member to a completion-handler form — `get(key:freshness:completionHandler:)`,
    `invalidate(key:completionHandler:)`, `clear(key:completionHandler:)` and the namespace/all
    variants (`store6-core/api/swift/objc/Store6Core.h:252-289`).
  - SKIE consumers get the Swift-concurrency and AsyncSequence shapes carried in the committed
    SKIE dump (`store6-core/api/swift/skie/Store6CoreSkie.swift`).
- **H2: Duration flattens in ObjC**
  - `kotlin.time.Duration` surfaces as raw `int64_t` in the ObjC export:
    `Freshness.MaxAge.notOlderThan` (`Store6Core.h:179-180`), `StoreMeta.writtenAtEpochMillis`
    (`Store6Core.h:448`), and the `age` properties on results (`Store6Core.h:466`, `:488`).
  - Practical consequence for the page: state the unit expectations rather than leaving readers to
    infer them from the header.
- **H2: Targets differ per module**
  - Check each module before depending on it from a given platform: store6-room ships 8 of core's
    12 targets, with no iosX64 variant because Room 3 publishes none
    (`store6-room/README.md:184-198`); store6-devtools-inspector publishes an 8-target subset
    (`store6-devtools-inspector/README.md:53-56`); store6-devtools ships the full 12-target
    convention (`store6-devtools/README.md:46-48`); store6-sqldelight compiles all 12 but JS/Wasm
    are compile-only (`store6-sqldelight/README.md:110-117`).
- **H2: How the Swift surface is verified**
  - Generated-Swift dumps are diffed on every pull request across the supported bridges — ObjC
    export and SKIE today — with committed dumps under `store6-core/api/swift/objc` and
    `store6-core/api/swift/skie` (`STABILITY.md:123-126`; directories verified to exist, along
    with `store6-mutations/api/swift/{objc,skie}`).
  - The bridge set follows the recorded Swift Export disposition: the commitment is to the
    mechanism, not to a fixed list of lanes (`STABILITY.md:125-126`).
  - ABI dumps are committed at every released tag, so the surface of any release is diffable from
    the repository (`STABILITY.md:127-128`).

### Admonitions

- Stability callout: nothing is published yet; store6-core is stable-track but not frozen until
  the beta01 freeze candidate, and the seam package is a freeze candidate (`STABILITY.md:45-68`).
  Mutations types visible from Swift are Experimental throughout (`STABILITY.md:52`,
  `:135-151`).

### Cross-links

`/docs/store6/stability`, `/docs/store6/concepts/errors`, `/docs/store6/concepts/read-contract`,
`/docs/store6/concepts/freshness`, `/docs/store6/mutations`


<!-- ================================================================ -->

# Section outlines — Store 6 — Mutations (experimental) (`store6-mutations`)

# Section outlines: Store 6 — Mutations (experimental) (store6-mutations)

All anchors below are repo-relative paths in Repo A (Store6 library, main @ a6a156e9) and were
verified by reading the file. Every page in this section is `disposition: new` (authored for the
docs site, not synchronized from a Repo A file), so each outline is a full skeleton. Section-wide
rules honored throughout: no internal process shorthand, no unverified claims, tier statements on
every page, and page content never presents mutations shapes as frozen.

---

## /docs/store6/mutations

- **Title:** Mutations: the journalled write path
- **Disposition:** new
- **Audience:** Users adding writes; migrating MutableStore users
- **Purpose:** The model in one page: typed intents through a registry, durable journal,
  optimistic overlay on stream (origin OVERLAY; get deliberately unprojected), idempotent drains
  to your server, adopt-then-retire acks — with the alpha posture, gated graduation, and the
  crash-window/idempotency requirement stated up front, plus explicit tier statements for
  store6-mutations-sqldelight and store6-mutations-testing.
- **Sources:** `store6-mutations/src/commonMain/kotlin/org/mobilenativefoundation/store6/mutations/MutationStore.kt`, `STABILITY.md`, `README.md`

### Page skeleton

- **(Opening admonition — experimental tier, before any content)**
  - `store6-mutations` is a separate artifact and every public symbol is `@ExperimentalStoreApi`
    (STABILITY.md:52, STABILITY.md:144). The tier is on the artifact, never annotation-gated
    inside a stable one (README.md:19-21).
  - Explicit tier statements the stability page's artifact table does not carry:
    `store6-mutations-sqldelight` and `store6-mutations-testing` are likewise experimental —
    every public declaration carries `@ExperimentalStoreApi`, and the SqlDelight adapter
    additionally opts into `@DelicateStoreApi` as a journal-storage implementor
    (store6-mutations-sqldelight/src/commonMain/kotlin/org/mobilenativefoundation/store6/mutations/sqldelight/SqlDelightMutationJournalStorage.kt:48-49).
  - Graduation is gated, not scheduled: first review at 6.1, target window roughly 6.3, requiring
    the API unchanged across two consecutive minors, crash-matrix and soak lanes green in
    production-representative apps, and at least three external production adopters
    (STABILITY.md:144-151). Cross-link `/docs/store6/roadmap` and `/docs/store6/stability`.
- **H2: Two facts before anything else**
  - Fact 1: the write path is experimental and its shapes can change in any release
    (STABILITY.md:172-179).
  - Fact 2 (the crash window): the non-transactional acknowledgement path adopts the server echo
    first and retires the journal row last; a crash before retire leaves a replayable pending
    intent, and restart replay can re-send the same push — so server endpoints must be idempotent
    or keyed by mutation identity (STABILITY.md:153-170, README.md:22-26). Making the ack path
    atomic is beta01 work, not alpha01 work (STABILITY.md:170).
- **H2: A MutationStore is a Store**
  - `mutationStore(...)` returns `MutationStore<K, V>`, which implements `Store<K, V>` by
    delegation — stream, get, invalidate, clear, and close all carry the core read contract
    (MutationStore.kt:60-67). Cross-link `/docs/store6/concepts/read-contract`.
  - What it adds: `mutate(key, ref, args)` returning an opaque mutation id (MutationStore.kt:246-253),
    `drain(key)` / `drain()` (MutationStore.kt:270, MutationStore.kt:287), inspection
    (`pending`, `pendingWrites`, `deadLetters`, MutationStore.kt:301-325), and two advisory flows
    (`poisoned`, `events`, MutationStore.kt:329-339).
  - What it withholds: `runtime()` returns `null` by design, so the raw engine write handle is
    inaccessible and every consumer write stays journalled — no second path can commit a value
    the journal never saw (MutationStore.kt:46-47 KDoc; docs/store6/quickstart.md:176-178).
- **H2: The model, end to end**
  - Diagram (planned): one horizontal lifecycle — `mutate` appends a durable intent → stream
    emits the optimistic projection with `origin == OVERLAY` → `drain` pushes the pending FIFO
    prefix to the app-owned `MutationServer` → the ack is adopted into the Store → the journal
    row retires and is later pruned behind a server-confirmed checkpoint.
  - Typed intents: writes are named, registered mutators built once via `mutatorRegistry { }`;
    no call-site closure ever becomes a durable intent (MutatorRegistry.kt:98-103). Cross-link
    `/docs/store6/mutations/mutators`.
  - Optimistic visibility: the engine installs the store's sole overlay; a changed projection is
    stamped `OVERLAY` origin, zero age, `isStale = false` (MutationEngine.kt:262-267,
    STABILITY.md:189-193). `get` is never projected; observing your own write requires `stream`
    (MutationStore.kt:198-202, STABILITY.md:195-197). Cross-link
    `/docs/store6/mutations/pending-write-ui`.
  - Durability: intents live in a journal behind the `MutationJournalStorage` seam — in-memory by
    default, SQLite-backed via the SqlDelight adapter (MutationStoreBuilder.kt:159-166).
    Cross-link `/docs/store6/mutations/journal-storage`.
  - Transport: drains are idempotent foreground passes with no retry or backoff of their own
    (MutationStore.kt:255-268); pushes carry generation-stable idempotency keys
    (MutationProtocol.kt:218-220). Cross-links `/docs/store6/mutations/drain-and-restart`,
    `/docs/store6/mutations/server`.
  - Conflicts: optional precondition/merge policy; server-wins is the non-removable terminal
    without a merge (MutationStoreBuilder.kt:145-149). Cross-link
    `/docs/store6/mutations/conflicts`.
- **H2: Where each piece is documented**
  - Link table over the nine subpages (quickstart, mutators, pending-write-ui, server, conflicts,
    drain-and-restart, journal-storage, inspection, testing) with a one-line scope statement each.
- **H2: Coming from Store 5 MutableStore**
  - The Store 5 write stack (MutableStore + Updater + Bookkeeper hand-assembly) maps onto one
    factory: registry replaces per-request write lambdas, the journal replaces hand-rolled
    outbox/bookkeeping of failed syncs, and drain replaces Updater.post-driven sync.
  - Keep this section to the mapping and defer depth to `/docs/store6/migration/from-store5`
    and `/docs/store6/migration/component-map` (cross-links).
- **Planned code snippet:** the compact end-to-end shape from the Repo A quickstart write-path
  section — `mutationStore(...)` with the five required inputs plus a `fetcher` door, then
  `mutate` and `drain(key)` (docs/store6/quickstart.md:145-161; factory signature verified at
  MutationStore.kt:492-498).
- **Planned admonitions:** experimental-tier callout (top); crash-window/idempotency callout
  (H2 "Two facts"); a "durable truth vs advisory events" note pointing at
  `/docs/store6/mutations/inspection`.

---

## /docs/store6/mutations/quickstart

- **Title:** Mutations quickstart
- **Disposition:** new
- **Audience:** Users writing their first mutation
- **Purpose:** A full worked `mutationStore(...)` example: the five required factory inputs
  (registry, server, keyResolver, valueCodecVersion, valueCodec), the configure lambda's
  core-Store doors (and the deliberate absence of an overlay door), a one-line resolver for
  identity-reconstructible keys, first mutate + drain, and observing the OVERLAY→SOT flip on
  stream. The Store 6 successor to the Store 5 two-part CRUD walkthrough.
- **Sources:** `store6-mutations/.../MutationStore.kt`, `store6-mutations/.../MutationStoreBuilder.kt`, `store6-mutations/.../MutationProtocol.kt`

### Page skeleton

- **(Opening admonition)** — experimental tier; `store6-mutations` is in the first-alpha line
  (STABILITY.md:52, STABILITY.md:139-140). Link `/docs/store6/stability`.
- **H2: What you are building**
  - A store whose reads are ordinary Store 6 reads and whose only write path is journalled:
    enqueue an intent offline, see it optimistically on `stream`, push it with `drain`, watch the
    server echo replace the optimistic frame.
  - Prerequisite pointer: the read-side quickstart at `/docs/store6/quickstart` (cross-link).
- **H2: The five required inputs**
  - The factory signature: `mutationStore(registry, server, keyResolver, valueCodecVersion,
    valueCodec) { ...configure }` (MutationStore.kt:492-498). All five are factory parameters,
    never builder doors (MutationStoreBuilder.kt:26-28).
  - `valueCodecVersion` must be >= 1; the factory rejects non-positive versions before
    construction (MutationStore.kt:500-502).
  - The configure lambda must install a fetcher door — `fetcher { }`, `fetcherOfResult { }`, or
    `fetcher(Fetcher)`; omitting all three fails with `IllegalArgumentException`
    (MutationStore.kt:488-490, MutationStoreBuilder.kt:182-185).
  - **H3: A minimal registry** — one `update` registration with an explicit args version and
    codec, returning a typed `MutatorRef` (MutatorRegistry.kt:166-178). Planned snippet:
    `mutatorRegistry { update(id = "rename", version = 1, codec = ..., stales = ...,
    project = { user, args -> ... }) }`. Defer shapes and rules to
    `/docs/store6/mutations/mutators` (cross-link).
  - **H3: A minimal server** — implement `MutationServer.push` and `retire`
    (MutationProtocol.kt:253-282). Defer the full contract to
    `/docs/store6/mutations/server` (cross-link).
  - **H3: The one-line resolver** — for keys reconstructible from the identity pair the resolver
    is a single expression: `MutationKeyResolver { identity -> UserKey(identity.canonicalId) }`
    (docs/store6/quickstart.md:150-152; interface at MutationProtocol.kt:71-75). State why it is
    required: restart-safe drain cannot exist without it (MutationProtocol.kt:64-65).
  - **H3: The value codec** — a versioned pure byte codec for `V`; decode receives the persisted
    version, which may be older than the registered one (MutationProtocol.kt:86-95).
- **H2: The configure lambda**
  - The doors it mirrors from the core builder: three fetcher install points (last registration
    wins), `persistence`, `bookkeeper`, `telemetry`, `wallClock`, `freshnessValidator`,
    `maxIdleKeys` (default 128), plus mutations-only `conflicts { }` and `journalStorage(...)`
    (MutationStoreBuilder.kt:57-171).
  - There is deliberately no `overlay` door: the mutation engine's overlay is a mutation store's
    sole projection layer and is installed by the factory (MutationStoreBuilder.kt:24-26).
  - Unset `persistence`/`bookkeeper` install one mutations-owned in-memory default forwarded
    identically to both the delegated Store and the engine — core's inaccessible internal
    defaults are never silently substituted (MutationStoreBuilder.kt:30-34, 186-196).
  - Unset `journalStorage` means an in-memory journal: fine for the walkthrough, no restart
    durability. Forward-reference `/docs/store6/mutations/journal-storage` (cross-link).
- **H2: First mutate, first drain**
  - Planned snippet (parity with the Repo A quickstart write-path block,
    docs/store6/quickstart.md:145-161): construct the store, call
    `users.mutate(key, renameRef, Rename("new name"))`, then `users.drain(key)`.
  - `mutate` appends one intent and returns an opaque mutation id; nothing is pushed
    (MutationStore.kt:232-253, docs/store6/quickstart.md:165).
  - `drain(key)` runs one idempotent foreground pass: pushes the pending FIFO prefix once, no
    retry or backoff, and never fetches (MutationStore.kt:255-268).
- **H2: Watching the OVERLAY → SOT flip**
  - Planned snippet: collect `stream(key)` and print `origin` per Data frame; after `mutate` the
    frame is `origin == OVERLAY`; after a drained acknowledgement the server echo is committed
    and attributed `SOT` or `MEMORY` (docs/store6/quickstart.md:166-172).
  - State the honest limit exactly as the Repo A quickstart does: a stream opened after the
    acknowledgement sees the echo; convergence for a collector already active across the
    acknowledgement is not yet promised (docs/store6/quickstart.md:169-172).
  - Note: `get` will not show the optimistic value — it is unprojected by contract
    (MutationStore.kt:198-202). Cross-link `/docs/store6/mutations/pending-write-ui`.
- **H2: Where to go next**
  - Cross-links: `/docs/store6/mutations/mutators`, `/docs/store6/mutations/server`,
    `/docs/store6/mutations/drain-and-restart`, `/docs/store6/mutations/journal-storage`.
  - Positioning line: this page supersedes the Store 5 two-part CRUD walkthrough
    (`/docs/use-cases/store5/setting-up-store-for-crud-operations`,
    `/docs/use-cases/store5/implementing-crud-operations-in-store`) for Store 6 users; those
    pages remain for Store 5 (cross-links, keep-frozen targets).
- **Planned admonitions:** experimental tier (top); crash-window pointer admonition linking
  `/docs/store6/mutations/server` ("your endpoint must tolerate a re-sent push").

---

## /docs/store6/mutations/mutators

- **Title:** Authoring mutators
- **Disposition:** new
- **Audience:** Users defining write intents
- **Purpose:** The registry shapes (mutator/update/create/delete/upsert), the presence algebra
  (null means decline, Absent means delete), purity/determinism/non-blocking rules for project
  and stales with the terminal consequence of violating them, typed refs and ownership
  validation, and args codec versioning with append-only migration discipline.
- **Sources:** `store6-mutations/.../MutatorRegistry.kt`, `store6-mutations/.../MutationProtocol.kt`

### Page skeleton

- **(Opening admonition)** — experimental tier callout.
- **H2: Registrations are durable and named**
  - Registries are built once via `mutatorRegistry { }`; each registration is durable and named,
    and no call-site closure ever becomes a durable intent (MutatorRegistry.kt:98-103, 235-239).
  - Storage identity is the registered id plus args version; enqueue validates `MutatorRef`
    ownership against the registry before any journal append (MutatorRegistry.kt:86-90).
  - Duplicate ids and non-positive versions are rejected at registration
    (MutatorRegistry.kt:140-145); a built builder rejects further registration
    (MutatorRegistry.kt:137-139, 223-227).
- **H2: The five shapes**
  - **H3: `mutator`** — the generic shape: `project(base: MutationPresence<V>, args) ->
    MutationPresence<V>?` plus `stales` (MutatorRegistry.kt:130-136).
  - **H3: `update`** — transforms an existing value; declines when the confirmed base is
    `Absent` (MutatorRegistry.kt:161-178).
  - **H3: `create`** — builds the value from args alone; the confirmed base is ignored
    (MutatorRegistry.kt:180-194).
  - **H3: `delete`** — always applies `Absent` and is drainable; accepts neither a version nor a
    codec: Store 6 owns a fixed version-1 Unit codec encoding exactly zero bytes, and durable
    delete rows with another version or non-empty bytes are a CODEC failure
    (MutatorRegistry.kt:10-33, 196-207).
  - **H3: `upsert`** — receives the explicit confirmed presence and must return a presence; it
    cannot decline (MutatorRegistry.kt:210-221).
  - Planned snippet: one registry block registering all five shapes against a small `User` model,
    each returning a typed ref (shapes verified at the anchors above).
- **H2: The presence algebra**
  - `MutationPresence.Present(value)` / `Absent` is the explicit value state at every base, mine,
    and adoption boundary (MutationProtocol.kt:10-17).
  - `null` from a projector means exactly one thing: decline this intent. Deletion is never
    spelled `null`; it is `Absent` (MutationProtocol.kt:14-15, MutatorRegistry.kt:118-121).
  - A declined head stays pending and blocks only its same-effective-key suffix
    (MutatorRegistry.kt:119-121).
  - As a base, `Absent` is an existence precondition — apply only if the entity is still absent —
    never an unconditional write (MutationProtocol.kt:32-37).
- **H2: Purity rules and what breaking them costs**
  - `project` runs synchronously inside the engine overlay's apply and may be invoked repeatedly
    or concurrently for different keys; it must be a pure, deterministic, non-blocking function
    of `(base, args)` and must not call back into Store (MutatorRegistry.kt:113-117).
  - The terminal consequence: a thrown failure is contained, reported through
    `MutationStore.poisoned`, and parks the row with a normalized `PROJECTION` failure
    (MutatorRegistry.kt:119-120; MutationInspection.kt:38-40). Parked intents are terminal dead
    letters (MutationInspection.kt:181-186) — cross-link `/docs/store6/mutations/inspection`.
  - Context: the core overlay contract treats a defensive violation as terminalizing projection
    for that key; the engine never silently falls back to unprojected values
    (store6-core/src/commonMain/kotlin/org/mobilenativefoundation/store6/core/seam/Overlay.kt:34-37).
  - `stales` is the pure declarative invalidation function: equal inputs must produce
    structurally equal `StaleSet`s; the result is copied, normalized to identity pairs,
    deduplicated, and sorted into immutable durable effect records before the intent's first push
    (MutatorRegistry.kt:122-125; MutationProtocol.kt:110-116).
- **H2: Typed refs and ownership**
  - `MutatorRef<K, V, A>` keeps key, value, and args compile-time bound (MutatorRegistry.kt:36-46).
  - A ref from a different registry instance fails `mutate` with `IllegalArgumentException`:
    refs are ownership-validated by registry identity, not id-matched
    (MutationEngine.kt:640-642; surfaced on MutationStore.kt:242-243).
- **H2: Args codec versioning**
  - Each non-delete registration supplies an explicit positive args version and codec
    (MutatorRegistry.kt:126-128, 143-145).
  - Codecs are pure and deterministic for a given version; the library defensively copies encoded
    bytes before retention and passes a fresh copy into every decode
    (MutationProtocol.kt:77-84, 97-108).
  - Migration discipline is append-only: `decode` receives the persisted version, which may be
    older than the registered one; format changes append a version and old decoders remain until
    the corresponding rows are retired and pruned (MutationProtocol.kt:82-85).
- **H2: Proving purity**
  - Pointer section: certify projectors with the purity kit — cross-link
    `/docs/store6/mutations/testing`.
- **Planned admonitions:** experimental tier (top); a warning admonition under purity rules
  ("a projector throw permanently parks the intent — this is deliberate containment, not retry").

---

## /docs/store6/mutations/pending-write-ui

- **Title:** Pending-write UI
- **Disposition:** new
- **Audience:** UI developers over a MutationStore
- **Purpose:** Rendering optimistic state honestly: key the saving affordance on
  origin == OVERLAY (never isStale — overlay frames are unconditionally fresh), narrate the
  OVERLAY→SOT flip, remember get never sees pending writes so observing your own write requires
  stream, and use pending()/events for richer affordances.
- **Sources:** `STABILITY.md`, `store6-mutations/.../MutationEngine.kt`, `store6-core/.../seam/Overlay.kt`

### Page skeleton

- **(Opening admonition)** — experimental tier callout for the mutations family; the guidance on
  this page restates consumer guidance from the stability policy
  (STABILITY.md:181-197; cross-link `/docs/store6/stability`).
- **H2: Two affordances that look alike and are not**
  - A "pending write" affordance keys on `origin == OVERLAY`; a "stale cache" affordance keys on
    `isStale` (STABILITY.md:186-188).
  - `isStale` is never set on an OVERLAY frame: overlay frames are stamped `age = Duration.ZERO`
    and `isStale = false` unconditionally, because an optimistic value genuinely is new; only
    `refreshing` is live on an overlay frame (STABILITY.md:189-193; engine statement at
    MutationEngine.kt:262-267).
  - Stated consequence: a spinner driven by `isStale` will never fire for a pending write, and
    that is intended (STABILITY.md:192-193).
  - Planned snippet: a `when (result)` branch rendering a saving badge from
    `data.origin == Origin.OVERLAY` and a stale badge from `data.isStale` — two independent
    conditions, never one.
- **H2: get never sees pending writes**
  - Overlays apply only to `stream`; `Store.get` is a point read of committed truth and is
    intentionally unprojected (STABILITY.md:195-197; MutationStore.kt:198-202;
    store6-core/.../seam/Overlay.kt:17). Observing your own optimistic write requires `stream`.
  - Cross-link `/docs/store6/concepts/read-contract` for the two-door read model.
- **H2: Narrating the OVERLAY → SOT flip**
  - After a drained acknowledgement the server echo becomes the committed value attributed
    `SOT` or `MEMORY`, and the optimistic frame is retired rather than replayed
    (docs/store6/quickstart.md:167-172).
  - Honest limit, carried verbatim in spirit from the Repo A quickstart: a stream opened after
    the acknowledgement sees the echo; convergence for a collector already active across the
    acknowledgement is not yet a promised behavior (docs/store6/quickstart.md:169-172).
  - Planned diagram: three frames of one stream over time — `Data(origin=OVERLAY, isStale=false,
    refreshing=...)` → acknowledgement adopted → `Data(origin=SOT)` — annotated with which flag
    changes and which never does.
- **H2: Optimistic creates and deletes on screen**
  - The projection table governs what the stream shows: a non-null projection over a null base is
    an optimistic create (overlay data); a null projection over a non-null base is an optimistic
    delete rendered as the normal absent/loading transition (store6-core/.../seam/Overlay.kt:19-25).
  - UI note: an optimistic delete therefore looks like removal, not like an error.
- **H2: Richer affordances**
  - Counts and states come from durable inspection: `pending(key)` returns the pending intents
    for the key's terminal identity in FIFO order, `pendingWrites()` a truthful snapshot across
    identities (MutationStore.kt:292-315). The five public pending states are the total mapping
    of the nonterminal execution phases (MutationInspection.kt:14-28).
  - `events` may drive transient UI (toasts, timeline chips) but is advisory and lossy —
    replay 0, buffer 64, oldest dropped; never settlement logic (MutationStore.kt:332-339,
    MutationEvents.kt:12-21). Cross-link `/docs/store6/mutations/inspection`.
- **H2: In Compose**
  - Pointer: the Compose adapter's recomposition discipline keeps origin/isStale/refreshing in
    the structural equivalence, so origin-keyed affordances recompose on the flip — defer to
    `/docs/store6/compose` (cross-link).
- **Planned admonitions:** a prominent "key on origin, never isStale" warning; a note admonition
  on the unpromised already-active-collector convergence.

---

## /docs/store6/mutations/server

- **Title:** Implementing a MutationServer
- **Disposition:** new
- **Audience:** Backend/integration engineers
- **Purpose:** The app-owned transport contract: push with generation-stable idempotency keys
  across the crash window (retries after an ack-window crash re-send the same push — endpoints
  must be idempotent or keyed by mutation identity), conflict signalling only via the sanctioned
  StoreResults.conflict throw, Present vs Absent acks (canonical-key rekeying; the Absent-ack
  deletion-coherence obligation on later fetches), and retire checkpoint monotonicity.
- **Sources:** `store6-mutations/.../MutationProtocol.kt`, `store6-core/.../seam/StoreResults.kt`, `STABILITY.md`

### Page skeleton

- **(Opening admonition)** — experimental tier; the transport contract is the part of the
  mutations surface your backend depends on, and it can change in any release
  (STABILITY.md:172-179).
- **H2: The contract in two methods**
  - `MutationServer` is the application-owned transport: `push(request): MutationAck` and
    `retire(request): MutationRetirementAck`; implementations own deterministic wire encoding of
    the library-built carriers (MutationProtocol.kt:239-282).
  - Planned snippet: a skeletal HTTP-backed `MutationServer` implementing both methods against
    the carriers (interface shape verified at MutationProtocol.kt:253-282).
- **H2: What a push carries**
  - `MutationPush` is immutable and library-built: `identity` alone selects the backend entity
    and feeds preconditions and idempotency; `key` is process-local adapter context whose fields
    beyond the validated identity are non-authoritative (MutationProtocol.kt:168-196).
  - Payload fields to document individually: `clientId`/`clientSequence` (durable FIFO unit),
    `retiredThroughSequence` (opportunistically advertised retired prefix), `mutationId`,
    `generation` (starts at 1), `idempotencyKey` (generation-stable), `valueCodecVersion`, frozen
    `base`/`mine`/`baseMeta` (MutationProtocol.kt:198-237).
  - `baseMeta == null` never means an unconditional write — `base` itself is always a
    precondition (MutationProtocol.kt:185-187).
- **H2: Idempotency across the crash window**
  - Retries of one `idempotencyKey` must be idempotent: a duplicate success must return the same
    authoritative presence, value, etag, and canonical target (MutationProtocol.kt:255-260).
  - Why this is load-bearing: the alpha ack path adopts the echo first and retires the journal
    row last, so a crash inside that window re-sends the same push after restart
    (STABILITY.md:153-170). Restated as the page's central design requirement: make the endpoint
    idempotent or key it by mutation identity (STABILITY.md:166-168).
  - Transport cancellation is not failure: a `CancellationException` thrown out of `push` is
    rethrown and leaves the in-flight generation intact; the next drain or restart sends the
    exact same immutable generation (MutationProtocol.kt:178-183, 258-260).
- **H2: Signalling a conflict**
  - A precondition conflict is signalled only through the sanctioned core door:
    `throw StoreResults.exception(StoreResults.conflict(serverMeta, message), cause)`
    (MutationProtocol.kt:241-250; construction door at
    store6-core/.../seam/StoreResults.kt:21 and :26).
  - Any other non-cancellation throw from `push` is a TRANSPORT failure, not a conflict
    (MutationInspection.kt:48-49). What happens next belongs to
    `/docs/store6/mutations/conflicts` (cross-link).
- **H2: Acknowledging: Present or Absent**
  - The sealed ack vocabulary makes a canonical target on confirmed absence unrepresentable:
    only `MutationPresentAck` can carry a canonical key (MutationProtocol.kt:284-296).
  - **H3: Present acks** — carry the backend-authoritative value written into the source of
    truth, an optional etag recorded by freshness bookkeeping, and an optional same-namespace
    `canonicalKey` redirect; a retry of one generation's idempotency key must return the same
    canonical target or the intent parks as a protocol violation (MutationProtocol.kt:298-317).
  - **H3: Absent acks** — certify a deletion adopted through the store's `clear`; the variant
    deliberately has no canonical key, so rekey-on-deletion is unrepresentable in the current
    surface (MutationProtocol.kt:319-331).
  - The deletion-coherence obligation, stated as a hard backend requirement: every fetch begun
    after an Absent acknowledgement returns `FetcherResult.Deleted`; tombstones stop journal
    replay but do not mask a backend that violates this (MutationProtocol.kt:261-265, 320-324).
    Cross-link `/docs/store6/guides/fetchers` for `FetcherResult.Deleted` semantics.
- **H2: Retirement checkpoints**
  - `retire` confirms a monotonic checkpoint so the backend can bound idempotency-receipt
    retention; the confirmation must be monotonic and cannot exceed the requested prefix — the
    library validates both properties and treats a violation as a protocol failure
    (MutationProtocol.kt:269-282, 363-385).
  - The request/ack protocol is idempotent; a later pass may resend the same or a greater prefix,
    and a cancellation during retire leaves the confirmed prefix unchanged and prunes nothing
    (MutationProtocol.kt:276-279).
- **Planned admonitions:** crash-window warning (top of the idempotency section, mirroring
  STABILITY.md §8b); a "conflicts have exactly one spelling" note.
- **Planned diagram:** request/response ladder: push(generation g, idempotencyKey k) → ack |
  conflict throw | crash-and-replay(same k) — annotated with which side owns which guarantee.

---

## /docs/store6/mutations/conflicts

- **Title:** Conflict resolution
- **Disposition:** new
- **Audience:** Users with concurrent writers
- **Purpose:** The optional conflicts block: pure precondition selector (runs once per prepared
  generation, never on transport retry), merge returning Retry(presence) (new generation, new
  idempotency key) or ServerWins, server-wins as the non-removable terminal without a merge, and
  the three-identical-receipt park bound.
- **Sources:** `store6-mutations/.../MutationStoreBuilder.kt`, `store6-mutations/.../MutationProtocol.kt`, `store6-mutations/.../MutationEngine.kt`

### Page skeleton

- **(Opening admonition)** — experimental tier callout.
- **H2: The default: server wins**
  - Without a registered merge policy, server-wins is the non-removable conflict terminal; there
    is deliberately no terminal setter (MutationStoreBuilder.kt:145-149, 200-204).
  - What server-wins does: accepts the authoritative server state and retires the intent without
    another push (MutationProtocol.kt:427-429); the intent's durable invalidation effects are
    terminally SKIPPED rather than applied (MutationEvents.kt:164-166).
- **H2: The conflicts block**
  - Registered on the builder via `conflicts { }`; last registration of the door wins, and within
    one block each policy registers at most once (MutationStoreBuilder.kt:145-157, 200-204,
    229-233, 258-260).
  - Planned snippet: a `conflicts { precondition { ... }; merge { base, mine, theirs -> ... } }`
    block against a small model (builder shapes verified at MutationStoreBuilder.kt:207-262).
- **H2: The precondition selector**
  - Pure; receives only the library-owned `MutationPreconditionCandidate` (identity, key,
    mutationId, generation, base, mine, captured metadata) and never a final push
    (MutationStoreBuilder.kt:217-224; MutationProtocol.kt:128-166).
  - Runs once per newly prepared semantic generation, never on a transport retry
    (MutationStoreBuilder.kt:224-225; MutationProtocol.kt:134-135).
  - Returning `null` selects an existence/value precondition without metadata — it never removes
    the base precondition; without a selector, the candidate's captured metadata is selected
    (MutationStoreBuilder.kt:220-223).
- **H2: The merge policy**
  - Consulted on a server-signalled conflict with `(base, mine, theirs)`; returns
    `Retry(presence)` or `ServerWins` explicitly (MutationStoreBuilder.kt:237-249;
    MutationProtocol.kt:411-430).
  - `Retry` persists generation g+1 — with a new idempotency key — before its first send; a merge
    never edits generation g (MutationProtocol.kt:419-425, 151-153, 176-177).
  - A merge that throws parks the intent (MutationStoreBuilder.kt:245-246), recorded under the
    CONFLICT failure kind (MutationInspection.kt:45-46).
- **H2: The repeat bound**
  - Retrying is bounded: on the third consecutive conflict receipt carrying identical server
    metadata, the intent parks with a normalized CONFLICT failure instead of preparing another
    generation (MutationStoreBuilder.kt:242-245; constant at MutationEngine.kt:60-61).
  - Parked intents are terminal and never re-enter the FIFO — cross-link
    `/docs/store6/mutations/inspection` for dead letters and the CONFLICT kind.
- **H2: Observing conflicts**
  - The advisory event stream carries a conflict-observed event with the conflicted generation
    and the server-reported metadata receipt when one exists (MutationEvents.kt:88-105);
    advisory-only caveat and cross-link `/docs/store6/mutations/inspection`.
- **Planned diagram:** conflict loop state chart — push g → conflict receipt → merge →
  {Retry: persist g+1, new key, push again} | {ServerWins: retire, effects skipped} |
  {third identical receipt or merge throw: park as CONFLICT}.
- **Planned admonitions:** "server-wins is always present; a merge adds to it, it cannot remove
  it"; note that the conflict spelling on the server side lives on
  `/docs/store6/mutations/server` (cross-link).

---

## /docs/store6/mutations/drain-and-restart

- **Title:** Draining, offline, and restart
- **Disposition:** new
- **Audience:** Users building offline-first flows
- **Purpose:** Keyed vs global drain semantics (idempotent foreground passes, FIFO by durable
  client sequence, namespace ownership), durable identity as exactly the (namespace, canonicalId)
  pair, the key resolver as the restart-safety requirement with verbatim exact-pair validation,
  hydration from a durable journal after process death, and internal-only backoff (drain
  overrides it; no public policy door).
- **Sources:** `store6-mutations/.../MutationStore.kt`, `store6-mutations/.../MutationProtocol.kt`, `store6-mutations/.../MutationEngine.kt`

### Page skeleton

- **(Opening admonition)** — experimental tier callout.
- **H2: What a drain is**
  - `drain(key)` is one idempotent, scheduler-agnostic foreground pass: it captures the
    unprojected confirmed base and pushes the pending FIFO prefix once, with no retry or backoff,
    and it never fetches (MutationStore.kt:255-268).
  - `drain()` is the global form: every durable identity is enumerated from the journal and
    reconstructed through the required resolver with exact-pair validation; an identity that
    fails to resolve parks its affected pre-ack head and does not block the others
    (MutationStore.kt:276-290).
  - Ordering promise, stated precisely: deterministic by durable client sequence within an
    effective identity; no promised cross-key order (MutationStore.kt:281-283).
  - Scheduling is yours: the library ships no background scheduler; call drains from your own
    connectivity/foreground triggers.
- **H2: Namespace ownership**
  - Once transport becomes possible or uncertain for an execution, that durable execution owns
    its client namespace until it parks or retires: a keyed drain for another key in that
    namespace returns without transport, while different namespaces remain eligible to progress
    (MutationStore.kt:263-267; carrier-level statement at MutationProtocol.kt:181-184; durable
    authority rule at storage/MutationJournalStorage.kt:104-110).
  - Why: an uncertain in-flight generation retains causal authority for its
    `(clientId, namespace)` so later writes cannot leapfrog an unresolved one.
  - Planned diagram: two namespaces × queued intents; namespace A blocked behind an uncertain
    head while namespace B progresses.
- **H2: Durable identity and the resolver**
  - Durable key identity is exactly `(namespace.value, canonicalId())`; hashes, object identity,
    and key class are never durable identity (MutationProtocol.kt:42-49). Cross-link
    `/docs/store6/key-design`.
  - The resolver is a required factory input because restart-safe drain cannot exist without it;
    it may suspend and do I/O, is never invoked while the journal transaction is held, and
    `CancellationException` is always rethrown (MutationProtocol.kt:61-69).
  - Validation is verbatim: the returned key's namespace and canonicalId are checked exactly
    against the requested pair; null, throw, or mismatch is an IDENTITY failure
    (MutationProtocol.kt:66-68, 387-409; MutationInspection.kt:33-34).
  - Planned snippet: the one-line resolver for identity-reconstructible keys, plus a
    lookup-backed resolver returning null for unknown ids (interface at
    MutationProtocol.kt:71-75).
- **H2: Restart and hydration**
  - After process death, a store constructed over the same durable journal hydrates its process
    caches from one coherent durable snapshot on first use; hydration never emits an overlay or
    alias revision (MutationEngine.kt:292-300).
  - The in-memory journal default gives no restart durability — offline-queue semantics require
    installing durable journal storage and reopening over the same database
    (MutationStoreBuilder.kt:159-166). Cross-link `/docs/store6/mutations/journal-storage`.
  - Restart replay can re-send an in-flight push — restate the idempotent-endpoint requirement
    with a cross-link to `/docs/store6/mutations/server` (STABILITY.md:164-168).
- **H2: Backoff is internal**
  - Between scheduled retries the engine applies an internal exponential backoff (base 1,000 ms,
    cap 300,000 ms); there is no public policy door, and an explicit drain pass overrides the
    backoff wait (MutationEngine.kt:56-58; drain contract at MutationStore.kt:255-268).
  - Contrast note: the core read engine performs zero retries entirely
    (docs/store6/important-defaults.md retry section) — the mutations write path retries only
    through your explicit drains plus this internal pacing.
- **H2: Observing progress**
  - Pointer: durable truth is `pending`/`pendingWrites`/`deadLetters`; events are advisory —
    cross-link `/docs/store6/mutations/inspection`.
- **Planned admonitions:** "no scheduler included" note; idempotent-endpoint warning.

---

## /docs/store6/mutations/journal-storage

- **Title:** Journal storage
- **Disposition:** new
- **Audience:** Users persisting the write queue; storage implementers
- **Purpose:** The in-memory default (no restart durability — offline-queue semantics require a
  durable journal) versus SqlDelightMutationJournalStorage (driver/transacter pairing on one
  database, adapter-owned sidecar schema with its own version table, synchronous-driver-only
  limitation), plus implementing custom storage behind the delicate opt-in (nine frozen record
  types, non-suspending exception-atomic transaction door, enum names not ordinals, bytes copied
  both directions).
- **Sources:** `store6-mutations/.../storage/MutationJournalStorage.kt`, `store6-mutations/.../storage/InMemoryMutationJournalStorage.kt`, `store6-mutations-sqldelight/.../SqlDelightMutationJournalStorage.kt`, `store6-mutations/.../storage/MutationJournalRecords.kt`

### Page skeleton

- **(Opening admonition)** — experimental tier; explicit statement that
  `store6-mutations-sqldelight` is an experimental artifact whose only public type is the
  storage adapter (SqlDelightMutationJournalStorage.kt:48-53).
- **H2: The default is in memory**
  - Leaving the `journalStorage` door unset installs `InMemoryMutationJournalStorage`; the
    journal stays in memory and restart hydration requires reopening over the same durable
    instance (MutationStoreBuilder.kt:159-166, 195).
  - The in-memory implementation is intentionally non-durable across process death: a transaction
    operates on a private snapshot under one mutex; normal return replaces the committed
    snapshot, any throw discards it (InMemoryMutationJournalStorage.kt:14-42).
  - Decision rule for the reader: in-memory is fine for optimistic UI within one process run;
    offline-queue semantics require a durable journal. Cross-link
    `/docs/store6/mutations/drain-and-restart`.
- **H2: The SqlDelight journal**
  - `SqlDelightMutationJournalStorage(driver, transacter)`: both must address the same
    connection/database authority; the library cannot verify the pairing, and violating it breaks
    transaction and storage-local ID guarantees (SqlDelightMutationJournalStorage.kt:37-46).
  - Synchronous drivers only: the transaction boundary supports drivers whose raw operations
    return `QueryResult.Value`; async web drivers are not supported
    (SqlDelightMutationJournalStorage.kt:41-44).
  - Construct the adapter before exposing the driver concurrently, and either dedicate the driver
    to mutation journal adapters or externally serialize other driver access
    (SqlDelightMutationJournalStorage.kt:44-46).
  - Adapter-owned schema: an internal sidecar owns the `store6_mutation_*` tables with its own
    schema-version row (current version 2, with a migration path from version 1); SQLite
    `user_version` remains user-owned
    (store6-mutations-sqldelight/.../internal/MutationJournalSidecar.kt:8, :23-28, :204, :247).
  - Same-driver operations are serialized through a bounded pool of 64 hash-striped mutexes
    (SqlDelightMutationJournalStorage.kt:75-79).
  - Planned snippet: constructing the adapter from an existing SqlDriver + Transacter pair and
    passing it to the builder's `journalStorage(...)` door (MutationStoreBuilder.kt:168-171).
  - Cross-link `/docs/store6/sqldelight` — the read-side adapter is a separate artifact solving a
    different problem (values + freshness metadata), and both can share one database.
- **H2: Implementing custom storage**
  - The seam is a deliberate act: `MutationJournalStorage` and `MutationJournalTransaction` carry
    `@SubclassOptInRequired(DelicateStoreApi::class)` (storage/MutationJournalStorage.kt:25-35).
  - The package freezes nine logical records — client, intent, execution, attempt, ack, failure,
    effect, alias, tombstone (storage/MutationJournalStorage.kt:8-10; record classes at
    storage/MutationJournalRecords.kt:62, :86, :116, :182, :254, :294, :318, :343, :366).
  - Implementation rules stated in the seam contract: persist enum names, never ordinals; store
    every time as Unix epoch milliseconds; copy every byte array on entry and delivery
    (storage/MutationJournalStorage.kt:10-13).
  - The single transaction door: `transaction(block)` is one serializable, exception-atomic unit
    of work — normal return commits everything, any throw (including cancellation) commits
    nothing; the callback is deliberately non-suspending so codec, resolver, transport, and
    policy work cannot run while the transaction is held; a handle is invalid after the callback
    returns (storage/MutationJournalStorage.kt:15-19, :28-29).
  - Pruning bounds: ordinary prune removes eligible records at or below the persisted
    server-confirmed retirement prefix; alias redirects and active or pending tombstone
    generations survive it (storage/MutationJournalStorage.kt:161-173).
  - H3: record-by-record reference table (nine rows: record, role, key invariants from init
    blocks — e.g. the client record's three-way prefix invariant,
    storage/MutationJournalRecords.kt:70-81).
- **H2: Certifying an implementation**
  - Pointer: run the journal-storage contract kit and its kill-point crash scenarios — cross-link
    `/docs/store6/mutations/testing`.
- **Planned admonitions:** delicate-opt-in callout ("implementing storage is a deliberate act");
  driver-pairing warning for the SqlDelight adapter.

---

## /docs/store6/mutations/inspection

- **Title:** Inspection and observability
- **Disposition:** new
- **Audience:** Users operating mutations in production
- **Purpose:** Durable truth (pending/pendingWrites/deadLetters, the five public pending states,
  terminal dead letters) versus lossy advisory telemetry (events with DROP_OLDEST and no replay,
  poisoned) — never build settlement logic on events — plus the normalized failure taxonomy and
  its sanitization bounds.
- **Sources:** `store6-mutations/.../MutationInspection.kt`, `store6-mutations/.../MutationEvents.kt`

### Page skeleton

- **(Opening admonition)** — experimental tier callout.
- **H2: Two kinds of observability**
  - Framing table: durable truth (`pending`, `pendingWrites`, `deadLetters` — survives restart,
    truthful snapshots) versus advisory telemetry (`events`, `poisoned` — in-process, lossy,
    nothing across restart) (MutationEvents.kt:12-21).
  - The rule, stated as this page's headline: the event flow is never a drain, acknowledgement,
    retry, or settlement protocol; durable truth remains inspection and the journal
    (MutationEvents.kt:18-20; MutationStore.kt:332-336).
- **H2: Durable truth**
  - **H3: pending(key)** — current pending intents for the key's terminal identity in durable
    client-sequence FIFO order; aliases are followed as identity pairs only, so inspection never
    consults the resolver and cannot fail on an unresolvable canonical key
    (MutationStore.kt:292-305).
  - **H3: pendingWrites()** — a truthful snapshot of every nonterminal active intent across all
    durable identities in durable client-sequence order; retired history never appears
    (MutationStore.kt:307-315).
  - **H3: deadLetters()** — durably parked intents only; parking is legal only before a
    successful acknowledgement is durably recorded, and a parked sequence never re-enters the
    executable FIFO — recovery is app-level (MutationStore.kt:317-325;
    MutationInspection.kt:181-186).
  - **H3: The five public pending states** — PENDING, INFLIGHT, REFRESHING, ADOPTING,
    APPLYING_EFFECTS: the total public mapping of the six nonterminal durable execution phases;
    parked executions appear only in dead letters, retired ones in neither API
    (MutationInspection.kt:14-28; durable phase names at storage/MutationJournalRecords.kt:19-28).
  - `PendingIntent` fields worth a reference table: identity pair, mutationId, mutatorId, state,
    attempt count, enqueue time (MutationInspection.kt:144-179).
- **H2: The failure taxonomy**
  - Nine broad, append-only kinds: IDENTITY, CODEC, PROJECTION, PROTOCOL, CONFLICT, TRANSPORT,
    ADOPTION, EFFECT, PERSISTENCE — with the one-line meaning each carries in its KDoc
    (MutationInspection.kt:30-59).
  - `MutationFailure` is normalized and restart-safe: a raw `StoreError` or `Throwable` is never
    persisted or carried; `detail` is at most 128 and `message` at most 1,024 UTF-8 bytes, each
    truncated at a code-point boundary after stack-trace and control-character sanitization
    (MutationInspection.kt:61-89).
- **H2: Advisory events**
  - Delivery contract: replay 0, extra buffer capacity 64, oldest dropped on overflow,
    non-blocking `tryEmit` only; a new collector receives no history and restart replays nothing;
    no event carries a raw `Throwable` or `StoreError` (MutationEvents.kt:12-21, 290-313).
  - Event inventory (reference table): intent-scoped Enqueued / Attempted / ConflictObserved /
    Acknowledged / Adopted / EffectApplied / EffectSkipped / Failed / Parked / Retired
    (MutationEvents.kt:47-242) plus client-scoped CheckpointConfirmed / CheckpointFailed
    (MutationEvents.kt:244-288).
  - Planned snippet: a bounded-lifetime collector logging event names — paired with a caveat
    comment that dropped events are expected under pressure.
- **H2: The poisoned flow**
  - `poisoned` reports projection throws with the exact local `Throwable` — in-process only,
    never durable; the same throw also parks the row with a normalized durable PROJECTION failure
    (MutationStore.kt:327-330; MutationInspection.kt:221-240).
  - Delivery: replay 16, oldest dropped (MutationEngine.kt:168-172).
  - Cross-link `/docs/store6/mutations/mutators` (purity rules) — a poisoned report means a
    projector broke its contract.
- **H2: Relationship to store-level telemetry**
  - Note: `StoreTelemetry` installed through the configure lambda observes the delegated core
    store's read lifecycle; the mutation event flow is a separate, mutations-owned vocabulary.
    Cross-link `/docs/store6/guides/devtools`.
- **Planned admonitions:** prominent warning "never build settlement logic on events"; note that
  dead letters are terminal and recovery is app-level.

---

## /docs/store6/mutations/testing

- **Title:** Testing mutations
- **Disposition:** new
- **Audience:** Custom-storage implementers; mutator authors
- **Purpose:** Certifying custom journal storage with MutationJournalStorageContractKit plus the
  deterministic kill-point crash scenarios, and proving projector purity with
  MutatorPurityContractKit (samples, ambient probes, why snapshotValue exists given Present's
  deliberate lack of structural equality).
- **Sources:** `store6-mutations-testing/.../MutationJournalStorageContractKit.kt`, `store6-mutations-testing/.../KillPointJournalStorage.kt`, `store6-mutations-testing/.../MutatorPurityContractKit.kt`

### Page skeleton

- **(Opening admonition)** — tier statement: `store6-mutations-testing` is an experimental
  artifact; every public declaration carries `@ExperimentalStoreApi` (verified across the
  module's four source files). It is a test-source-set dependency, published separately from
  `store6-mutations`.
- **H2: What this module is for**
  - Two certification jobs: (1) prove a custom `MutationJournalStorage` upholds the journal
    contract, including across simulated crashes; (2) prove a registered projector is a pure
    function of `(base, args)`.
  - For fakes and read-side testing, the general test kit is a different artifact — cross-link
    `/docs/store6/guides/testing`.
- **H2: Certifying journal storage**
  - Extend `MutationJournalStorageContractKit` in a consumer test source set and implement two
    hooks: `createStorage()` (fresh instance per test) and `reopenStorage(previous)` (the restart
    boundary — an in-memory implementation returns the same instance, a persistent one returns a
    new adapter over the same durable store) (MutationJournalStorageContractKit.kt:37-60).
  - What the kit enforces, stated as named rule families: the phase rules rather than a false
    total ordering — `INFLIGHT -> READY` is legal after a transport failure, `REFRESH_REQUIRED`
    may advance to a new immutable generation before returning to `READY`, `RETIRED` and `PARKED`
    are terminal, and `ACKED`/`EFFECTS_PENDING` never regress to a pre-ack phase
    (MutationJournalStorageContractKit.kt:45-48).
  - Transaction atomicity: a thrown callback commits none of its operations; pruning is limited
    to the persisted server-confirmed retirement prefix, and alias redirects plus the active
    tombstone generation survive ordinary prune (MutationJournalStorageContractKit.kt:50-52).
  - Planned snippet: a subclass over the SqlDelight adapter showing both hooks (kit shape
    verified at MutationJournalStorageContractKit.kt:55-60). Run on every supported target.
- **H2: Deterministic crash scenarios**
  - The contract kit inherits the kill-point scenarios, so extending it runs them automatically
    (MutationJournalStorageContractKit.kt:55; scenarios class at
    JournalStorageKillPointScenarios.kt:39).
  - `KillPointJournalStorage` is a one-shot deterministic crash decorator: `arm(killPoint)`
    rejects a second armed point; the armed point clears before its crash is raised so reopening
    or retrying cannot trip it twice; classification uses the transaction-entry execution phase
    and the operation invoked, never transaction ordinals or scheduler timing
    (KillPointJournalStorage.kt:33-54).
  - The five semantic boundaries: BEFORE/AFTER retirement-finalization commit, BEFORE_PRUNE,
    BEFORE_PRUNE_COMMIT, AFTER_PRUNE_COMMIT (KillPointJournalStorage.kt:16-24), raised as
    `JournalStorageCrashException` (KillPointJournalStorage.kt:26-31).
  - Content note: these boundaries target the retirement/prune window because that is where a
    real crash exercises replay behavior — tie back to the adopt-then-retire posture with a
    cross-link to `/docs/store6/mutations/server`.
- **H2: Proving projector purity**
  - Build a subject with `mutatorPuritySubject(...)`: the factory registers the projector and
    retains the same lambda, so the tested function cannot drift from the one registered under
    the ref (MutatorPurityContractKit.kt:54-59, 81-123).
  - Inputs: at least one `MutatorPuritySample` (fresh, structurally equivalent values per call —
    fresh values keep one invocation from mutating a later invocation's inputs) and at least one
    named `MutatorAmbientProbe` (bounded ambient state the consumer claims the projector
    ignores); both requirements are enforced (MutatorPurityContractKit.kt:17-52, 92-99).
  - The four inherited tests: repeat determinism; double-application replay equivalence — two
    independent `project(project(base, args), args)` traces, deliberately not idempotence, which
    would reject lawful append/increment mutators; invocation-count independence; ambient-state
    independence (MutatorPurityContractKit.kt:125-197).
  - Why `snapshotValue` exists: it must return detached structural data suitable for equality
    checks because `MutationPresence.Present` deliberately does not define structural equality
    (MutatorPurityContractKit.kt:74-79; presence KDoc at MutationProtocol.kt:19-20).
  - Planned snippet: a purity-kit subclass for the quickstart's rename mutator with one sample
    and one ambient probe (factory shape verified at MutatorPurityContractKit.kt:81-123).
- **H2: What these kits do not cover**
  - Honest-scope note: the kits certify storage and projectors; end-to-end drain/ack behavior is
    exercised by the library's own test suites, and app-level flows are tested with your own
    server fake behind the `MutationServer` interface (MutationProtocol.kt:253).
- **Planned admonitions:** tier callout (top); note admonition "double application is replay
  equivalence, not idempotence".

---

## Cross-cutting notes for the section

- Every page opens with an experimental-tier admonition; the section landing page additionally
  carries explicit tier statements for `store6-mutations-sqldelight` and
  `store6-mutations-testing`, which have no rows in the stability page's artifact table
  (STABILITY.md:45-55).
- The crash-window/idempotency requirement appears in full on the landing page and the server
  page, and as pointer admonitions on quickstart and drain-and-restart (STABILITY.md:153-170).
- No page pins graduation to a date; graduation language always carries the gating criteria
  (STABILITY.md:144-151).
- No page reproduces internal process vocabulary (issue numbers, ruling tokens, decision-record
  paths); technical facts are attributed to code and the stability policy only.
- Pages never claim the already-active-collector convergence across an acknowledgement; the only
  promised observation is a stream opened after the acknowledgement seeing the echo
  (docs/store6/quickstart.md:169-172).


<!-- ================================================================ -->

# Section outlines — Gap-fill addendum (`gap-fill`)

# Section: Gap-fill addendum (gap-fill)

One page in this section. It closes the audit gap: the consumer-side alias/canonical
rekeying lifecycle has no teaching home — the server outline covers only ack-side rules,
the inspection outline only "aliases are followed as identity pairs," and nothing covers
what the app actually observes when a provisional identity is rekeyed.

---

## /docs/store6/mutations/aliases

- **Title:** Aliases and canonical rekeying
- **Disposition:** new
- **Audience:** App developers building optimistic-create flows with provisional client
  IDs on a `MutationStore`, and anyone whose UI collects a facade stream or issues
  key-taking calls across a server rekey.
- **Purpose:** Explain, from the consumer's side, what happens when a server
  acknowledgement redirects a provisional identity to a canonical one: the durable alias
  edge lifecycle, how every facade operation reroutes, what a live stream does at
  activation and on resolver failure, and where tombstones stop journal replay. Without
  this page the promised rerouting behavior is indistinguishable from a bug.
- **Sources:**
  - `store6-mutations/src/commonMain/kotlin/org/mobilenativefoundation/store6/mutations/MutationStore.kt` (facade class KDoc :42-57, stream contract :70-83, get :198-209, mutate :232-253, pending :292-305, close :364-370)
  - `store6-mutations/src/commonMain/kotlin/org/mobilenativefoundation/store6/mutations/MutationProtocol.kt` (identity :42-59, resolver :61-75, server push obligations :252-268, ack variants :284-331)
  - `store6-mutations/src/commonMain/kotlin/org/mobilenativefoundation/store6/mutations/storage/MutationJournalRecords.kt` (MutationAliasState :47-50, MutationTombstoneState :54-58, MutationAckRecord :254-290, MutationKeyAliasRecord :343-362, MutationKeyTombstoneRecord :366-419)
  - `store6-mutations/src/commonMain/kotlin/org/mobilenativefoundation/store6/mutations/storage/MutationJournalStorage.kt` (alias/tombstone transaction doors :142-159, prune survival :161-173)
  - `store6-mutations/src/commonMain/kotlin/org/mobilenativefoundation/store6/mutations/MutationEngine.kt` (ack-time pending alias/tombstone insert :2904-2981, activation at retirement :3621-3672, replay watermark :1292-1308)
  - `STABILITY.md` §8 (:135-179) for the tier callout

### Page skeleton

- **Opening paragraph (no heading)**
  - States the scenario in one breath: an optimistic create enqueues under a provisional
    client-generated identity; the server's acknowledgement can name the entity's
    canonical identity; from then on the mutation store routes every operation on the
    provisional key to the canonical one. This page covers what the app observes.
  - Admonition (stability tier): `store6-mutations` is experimental — every public
    symbol carries `@ExperimentalStoreApi` and shapes can change in any release
    (STABILITY.md:142-151, :172-179). Same callout shape as the other mutations pages.

- **H2: Why an identity changes**
  - Content note: the only rekey channel is `MutationPresentAck.canonicalKey` — an
    optional same-namespace redirect on a confirmed *present* outcome; `null` keeps the
    pushed identity (MutationProtocol.kt:298-317). There is no client-side rekey API.
  - Content note: rekey-on-deletion is unrepresentable by construction —
    `MutationAbsentAck` has no canonical-key property (MutationProtocol.kt:319-331), and
    the durable ack record enforces "canonical targets require an authoritative present
    value" (MutationJournalRecords.kt:281-288).
  - Content note: one sentence delegating ack-side authoring rules (canonical-key
    stability across idempotency-key retries — a differing target on retry parks the
    intent as a protocol violation, MutationProtocol.kt:302-303) to the server page.
  - Planned snippet: a provisional-create flow — `create` registration
    (MutatorRegistry.kt:185), `mutate(provisionalKey, ref, args)` returning the opaque
    mutation id (MutationStore.kt:246-253), and the app's `MutationServer.push`
    returning `MutationPresentAck(authoritative, etag, canonicalKey)`
    (MutationProtocol.kt:306-317).
  - Cross-link: /docs/store6/mutations/server (ack authoring), /docs/store6/mutations/quickstart (first mutate).

- **H2: The durable alias edge**
  - Content note: a rekey is persisted as a `MutationKeyAliasRecord` — a durable
    same-namespace redirect edge with two states, `PENDING` and `ACTIVE`
    (MutationJournalRecords.kt:47-50, :343-362). Record invariants the page states
    plainly: alias edges cannot cross namespaces, self edges are not stored, and
    `activatedAt` exists exactly for `ACTIVE` edges (MutationJournalRecords.kt:354-361).
  - Content note: lifecycle timing. The `PENDING` edge is inserted in the same journal
    transaction as the durable acknowledgement receipt (MutationEngine.kt:2966-2971);
    it advances to `ACTIVE` inside the retirement finalization transaction, which runs
    only after every declared invalidation effect for that intent has reached a terminal
    disposition (MutationEngine.kt:3634-3643). Routing of *live streams* changes at
    activation, not at acknowledgement.
  - Content note: durability. Alias identity is the string pair
    `(namespace.value, canonicalId())` — never object identity or key class
    (MutationKeyIdentity, MutationProtocol.kt:42-59) — and alias redirects are never
    removed by ordinary prune (MutationJournalStorage.kt:161-169), so redirects survive
    restart for as long as the journal database does.
  - Planned diagram: one lifecycle sequence — `mutate(provisional)` → push →
    `PresentAck(canonicalKey)` → [txn: ACKED receipt + PENDING alias] → adopt echo →
    effects → [txn: retire + alias ACTIVE] → live streams reroute. Mirrors the
    two-step-ack framing already on /docs/store6/mutations (adopt first, retire last).
  - Cross-link: /docs/store6/mutations/journal-storage (record set, prune bounds).

- **H2: Every key-taking operation resolves the terminal identity first**
  - Content note: the facade routes every key-taking method through the alias table
    before delegating; a key whose identity no active alias redirects IS terminal and is
    used as given without consulting the resolver (MutationStore.kt:51-57;
    MutationEngine.kt:1046-1056). Aliased identities are reconstructed by the required
    `MutationKeyResolver` with exact-pair validation.
  - H3: Suspending operations — one attempt, then throw
    - Content note: `get`, `invalidate`, and `clear` make one resolution attempt and
      throw a `StoreException` backed by the sanctioned conversion error on failure
      (MutationStore.kt:198-227; the carried error is `StoreError.Conversion`,
      store6-core StoreError.kt:30). `get` remains unprojected — overlays apply only to
      `stream` (MutationStore.kt:198-202).
    - Content note: `mutate` resolves the terminal identity *before* the append: the
      intent is journalled at the effective identity so queued siblings merge by durable
      client sequence, and a resolution failure creates no intent
      (MutationStore.kt:232-253).
    - Content note: keyed `drain` operates on the terminal identity, and a mid-pass
      activation re-homes the owning pass before canonical adoption continues
      (MutationStore.kt:255-273).
  - H3: Inspection follows identity pairs, not keys
    - Content note: `pending(key)` follows aliases as durable identity pairs only — it
      never reconstructs a `K`, never consults the resolver, and therefore cannot fail
      on an unresolvable canonical key (MutationStore.kt:292-305).
  - Content note (scope limit): only the `MutationStore` facade carries the alias
    guarantee — raw `Store` references and foreign object graphs do not follow it
    (MutationStore.kt:57).
  - Planned snippet: a one-line resolver for identity-reconstructible keys, per the
    resolver contract (MutationProtocol.kt:61-75).
  - Cross-link: /docs/store6/mutations/inspection, /docs/store6/mutations/drain-and-restart.

- **H2: What a live stream does at activation**
  - Content note: the alias liveness contract, stated as behavior the app can watch
    (MutationStore.kt:70-83). On success the stream collects the terminal delegate
    stream; after a later activation redirects the identity it re-resolves and swaps to
    the new canonical delegate stream — the app keeps collecting the same `Flow`
    instance and subsequent frames report the canonical identity's data. The swap is
    driven by an alias-revision guard merged into the delegate collection
    (MutationStore.kt:151-193).
  - H3: Resolver failure — one error frame, then wait
    - Content note: on resolver null, throw, or identity mismatch, the stream emits
      exactly one `StoreResult.Error` carrying the conversion error with
      `servedStale = false`, never delegates to the stale source key, and never
      completes; it suspends until a strictly newer revision for that identity — a later
      alias activation or a non-stream facade resolution attempt — then retries. Its own
      attempt never advances the revision; a new collection attempts resolution
      immediately (MutationStore.kt:73-79, :112-131).
    - Content note: `close()` wakes a waiting collector promptly and releases its retry
      subscription (MutationStore.kt:81-82, :364-370).
  - H3: Designing provisional-key UX
    - Content note: do not persist or navigate on the provisional `canonicalId` captured
      at enqueue; after activation, key-taking calls with the provisional key reroute,
      and inspection reports rows at the effective identity — treat the durable identity
      pair as the authority.
    - Content note: there is no dedicated rekey event to listen for — `keyEvents` gains
      no `Rekeyed` variant (MutationStore.kt:47-48) and the advisory `MutationEvent`
      hierarchy carries no alias variant (MutationEvents.kt); the observable signals are
      the stream swap and inspection.
  - Planned snippet: collecting `stream(provisionalKey)` through a create-and-rekey,
    annotated with which contract line each observed phase comes from
    (MutationStore.kt:84-196).
  - Cross-link: /docs/store6/mutations/pending-write-ui (origin == OVERLAY affordance),
    /docs/store6/concepts/read-contract (error-as-value rule this contract extends).

- **H2: Tombstones — where journal replay stops**
  - Content note: a confirmed deletion (`MutationAbsentAck`) writes a `PENDING`
    tombstone for the effective identity in the same transaction as the acknowledgement
    receipt (MutationEngine.kt:2949-2971); like aliases, it activates at retirement.
    Tombstone states are `PENDING`, `ACTIVE`, `SUPERSEDED`
    (MutationJournalRecords.kt:54-58).
  - Content note: the replay rule, from the app's perspective — journal replay for an
    identity excludes every entry at or below the highest ACTIVE same-client tombstone
    sequence for the terminal identity (MutationEngine.kt:1292-1308). Consequence stated
    plainly: intents journalled before a confirmed delete do not re-push after restart.
  - Content note: delete-then-recreate works — a later intent for the identity
    supersedes the active tombstone as part of its own retirement transaction
    (MutationEngine.kt:3657-3672; state invariants MutationJournalRecords.kt:388-417),
    so a superseded tombstone no longer bounds replay.
  - Content note: tombstones stop journal replay only; they do not mask a backend that
    violates the deletion coherence obligation — every fetch begun after an Absent
    acknowledgement must return `FetcherResult.Deleted` (MutationProtocol.kt:262-265,
    :319-326). One sentence, then delegate to the server page.
  - Content note: active and pending tombstone generations are never removed by
    ordinary prune (MutationJournalStorage.kt:161-169).
  - Cross-link: /docs/store6/mutations/server (deletion coherence),
    /docs/store6/invalidate-vs-clear (clear semantics the Absent adoption uses).

- **H2: What this page deliberately does not cover**
  - Content note: ack-side authoring rules (canonical-key stability, conflict
    signalling) → /docs/store6/mutations/server; durable phases and dead letters →
    /docs/store6/mutations/inspection; storage conformance for alias/tombstone records →
    /docs/store6/mutations/journal-storage and /docs/store6/mutations/testing.

### Planned admonitions

1. Top-of-page experimental-tier callout (STABILITY.md:142-151).
2. Inline caution in the stream section: the one-failure-channel rule holds — the
   conversion error arrives as a `StoreResult.Error` value on `stream` and as a thrown
   `StoreException` from suspending operations; neither channel crosses over
   (MutationStore.kt:56-57, core Store contract).
3. Inline note in the UX section: pending-frame affordances still key on
   `origin == OVERLAY`, never `isStale` (STABILITY.md:186-193) — rekeying does not
   change that rule.

### Planned diagrams

1. Alias lifecycle sequence (described above, in "The durable alias edge").
2. Small two-column table: "operation → behavior on an aliased key" (stream: swap +
   wait-on-failure; get/invalidate/clear: one attempt, throw; mutate: resolve before
   append; pending: identity pairs, cannot fail; drain(key): terminal identity,
   re-homed at activation).


<!-- ================================================================ -->

# Section outlines — Migrating to Store 6 (`store6-migration`)

# Section outlines: Migrating to Store 6 (store6-migration)

Anchors are repo-relative. Library files are relative to the Store6 repo root (Repo A); docs-site
files are prefixed `store-docs/` (Repo B). Every anchor below was verified by reading the file.

---

## /docs/store6/migration/from-store5

- **Title:** Migrating from Store 5
- **Disposition:** new
- **Audience:** Migrating Store 5 users
- **Purpose:** The screen-at-a-time migration guide: side-by-side coordinates with no flag day
  (Store 5 is not end-of-life), translating StoreReadRequest/StoreReadResponse habits into
  Freshness + origin + isStale + refreshing, what Store 6 now does for you as named tested
  defaults, interop status, and where MutableStore users go (the experimental mutations path,
  honestly tiered).
- **Sources:** STABILITY.md; ROADMAP.md; README.md; docs/store6/quickstart.md;
  docs/store6/important-defaults.md;
  store/src/commonMain/kotlin/org/mobilenativefoundation/store/store5/ (Store 5 API surface);
  store6-core/src/commonMain/kotlin/org/mobilenativefoundation/store6/core/;
  store6-mutations/src/commonMain/kotlin/org/mobilenativefoundation/store6/mutations/;
  store-docs/content/docs/concepts/store5/store.mdx;
  store-docs/content/docs/concepts/store5/mutable-store.mdx

### Page skeleton

- **H2: No flag day**
  - `store5.*` and `store6.*` coordinates live side by side for the whole 6.x major; you can
    depend on both in one build and migrate a screen at a time (STABILITY.md:106-107).
  - Store 5 is not end-of-life: it continues under its own coordinates for all of 6.x, moves to
    fixes-only maintenance only at GA, and a dated end-of-life is published at GA — not before
    (STABILITY.md:12-13, ROADMAP.md:73).
  - `store6-store5-interop` is supported for all of 6.x and tracks to 6.0.0; it is not in the
    alpha01 line, so until it ships the two lines share no caches — plan whole-screen moves, not
    per-layer moves (STABILITY.md:70-71, STABILITY.md:109).
  - *Admonition (status):* nothing is published yet; the `store6-*` coordinates land with
    6.0.0-alpha01 (README.md:15).
  - *Admonition (doc status):* this guide is a launch gate for 6.0.0 — it blocks GA and grows
    with the migration, per the published policy (STABILITY.md:109-110, ROADMAP.md:21-22).

- **H2: What you already know that still holds**
  - The Store 5 read philosophy — failures delivered as values so the flow keeps running against
    an observable source of truth (StoreReadResponse KDoc,
    store/src/commonMain/kotlin/org/mobilenativefoundation/store/store5/StoreReadResponse.kt:18-24)
    — is the Store 6 stream contract: `stream` emits `StoreResult.Error` values and never throws;
    the only stream-terminating failure is a `MustBeFresh` initial-cycle failure
    (store6-core/src/commonMain/kotlin/org/mobilenativefoundation/store6/core/Store.kt:21-27).
  - The fetcher/source-of-truth/memory round trip carries over: fetched values are written
    through persistence and read back to collectors in both majors
    (store/src/commonMain/kotlin/org/mobilenativefoundation/store/store5/SourceOfTruth.kt:25-36;
    store6-core/src/commonMain/kotlin/org/mobilenativefoundation/store6/core/seam/SourceOfTruth.kt:9-32).
  - Single-flight deduplication also carries over — Store 5's FetcherController deduplicated per
    key (store-docs/content/docs/concepts/store5/store.mdx:94-98); Store 6 states it as a tested
    guarantee: 50 getters and 50 collectors share exactly one fetch
    (docs/store6/important-defaults.md:68-70).

- **H2: The builder, translated**
  - *Code snippet (side-by-side):* Store 5
    `StoreBuilder.from(fetcher = ..., sourceOfTruth = ...).build()`
    (store/src/commonMain/kotlin/org/mobilenativefoundation/store/store5/StoreBuilder.kt:73-76)
    next to the Store 6 `store<UserKey, User> { fetcher { key -> ... } }` block, reproduced
    verbatim from the CI-compiled quickstart module (docs/store6/quickstart.md:90-95, backed by
    store6-quickstart/src/main/kotlin/org/mobilenativefoundation/store6/quickstart/Main.kt:47-63).
  - A fetcher is the one required input: `store<K, V> { }` without a fetcher registration fails at
    build time with `IllegalArgumentException`, and installing a source of truth does not
    substitute for one
    (store6-core/src/commonMain/kotlin/org/mobilenativefoundation/store6/core/StoreBuilder.kt:176-179).
  - Persistence, bookkeeper, telemetry, overlay, wall clock, and freshness validator are
    `@ExperimentalStoreApi` seam doors on the builder; `maxIdleKeys` is the one stable non-fetcher
    knob
    (store6-core/src/commonMain/kotlin/org/mobilenativefoundation/store6/core/StoreBuilder.kt:101-171).
  - Store 5 knobs with no direct Store 6 spelling: `scope(...)` has no counterpart — lifecycle is
    `close()`, after which every operation fails with `IllegalStateException("Store is closed.")`
    (store/src/commonMain/kotlin/org/mobilenativefoundation/store/store5/StoreBuilder.kt:42,
    store6-core/src/commonMain/kotlin/org/mobilenativefoundation/store6/core/Store.kt:166-173);
    `cachePolicy` / `disableCache` map to `maxIdleKeys` (default 128; `0` destroys engines at
    quiescence; eviction is semantically invisible because durable rows, stale marks, and
    watermarks survive)
    (store/src/commonMain/kotlin/org/mobilenativefoundation/store/store5/StoreBuilder.kt:44-54,
    store6-core/src/commonMain/kotlin/org/mobilenativefoundation/store6/core/StoreBuilder.kt:106-121);
    `validator(...)` is covered in the results section below.
  - Keys change shape: Store 5 keys are `Key : Any`; Store 6 keys implement `StoreKey` with a
    `namespace` and a `canonicalId()` that together form durable identity
    (store6-core/src/commonMain/kotlin/org/mobilenativefoundation/store6/core/StoreKey.kt:9-25).
    Cross-link: /docs/store6/key-design.

- **H2: Translating reads: StoreReadRequest → Freshness**
  - Freshness is a per-call parameter on `stream` and `get`, not a request object; concurrent
    calls with different policies still share one in-flight fetch
    (store6-core/src/commonMain/kotlin/org/mobilenativefoundation/store6/core/Freshness.kt:5-11).
  - Translation table (Store 5 factories at
    store/src/commonMain/kotlin/org/mobilenativefoundation/store/store5/StoreReadRequest.kt:53-104;
    Store 6 policies at
    store6-core/src/commonMain/kotlin/org/mobilenativefoundation/store6/core/Freshness.kt:18-51):
    - `StoreReadRequest.cached(key, refresh = false)` → `stream(key)` / `get(key)` with the
      default `CachedOrFetch`.
    - `StoreReadRequest.fresh(key)` → `Freshness.MustBeFresh` (never serves residence; blocks for
      a fresh fetch).
    - `StoreReadRequest.localOnly(key)` → `Freshness.LocalOnly` (never invokes the fetcher; on a
      memory miss it probes the source of truth once; reports `StoreError.Missing` when nothing
      is local).
    - `StoreReadRequest.fresh(key, fallBackToSourceOfTruth = true)` → nearest is
      `Freshness.StaleIfError` (prefer fresh, fall back to the stale local value on fetch
      failure); the page states the fit honestly rather than claiming equivalence.
    - `StoreReadRequest.cached(key, refresh = true)` → no single policy; the pull-to-refresh use
      is `invalidate(key)` plus the built-in stale-while-revalidate refresh on the live stream.
      Cross-link: /docs/store6/invalidate-vs-clear.
    - `StoreReadRequest.skipMemory(key, refresh)` → no equivalent; Store 6 does not expose
      per-layer cache skipping — reads are planned from residency, metadata, and policy.
  - Cross-link: /docs/store6/concepts/freshness for the full policy semantics.

- **H2: Translating results: StoreReadResponse → StoreResult**
  - Kind mapping: Store 5's `Initial` / `Loading` / `Data` / `NoNewData` /
    `Error.Exception|Message|Custom`
    (store/src/commonMain/kotlin/org/mobilenativefoundation/store/store5/StoreReadResponse.kt:31-70)
    become exactly four kinds — `Loading`, `Data`, `Revalidated`, `Error` — with no fifth case
    (store6-core/src/commonMain/kotlin/org/mobilenativefoundation/store6/core/StoreResult.kt:10-70).
  - Honest non-mapping: `NoNewData` (the fetcher's flow was empty,
    StoreReadResponse.kt:46-50) is not `Revalidated`; `Revalidated(age)` is the not-modified
    signal of a conditional fetch and clears staleness
    (store6-core/src/commonMain/kotlin/org/mobilenativefoundation/store6/core/StoreResult.kt:39-52).
  - Origin mapping: `Cache` → `MEMORY`, `SourceOfTruth` → `SOT`, `Fetcher(name)` → `FETCHER`,
    and `OVERLAY` is new (optimistic projection above stored data); the `Initial` origin is gone
    (store/src/commonMain/kotlin/org/mobilenativefoundation/store/store5/StoreReadResponse.kt:148-166;
    store6-core/src/commonMain/kotlin/org/mobilenativefoundation/store6/core/Origin.kt:4-16).
  - New fields to drive UI from: `Data` carries `age`, `isStale`, and `refreshing`
    (store6-core/src/commonMain/kotlin/org/mobilenativefoundation/store6/core/StoreResult.kt:19-37);
    `Error` carries a structured `StoreError` (six variants, frozen for the 6.x major) and
    `servedStale`, which is true exactly when an invalidated resident was served and its refresh
    failed under a stale-tolerant policy
    (store6-core/src/commonMain/kotlin/org/mobilenativefoundation/store6/core/StoreError.kt:3-10,
    store6-core/src/commonMain/kotlin/org/mobilenativefoundation/store6/core/StoreResult.kt:58-70).
  - Helper habits: `requireData()` / `dataOrNull()` / `throwIfError()`
    (StoreReadResponse.kt:72-112) have no counterparts because the doors split — `get` returns or
    throws `StoreException` and never emits; `stream` emits and never throws
    (store6-core/src/commonMain/kotlin/org/mobilenativefoundation/store6/core/Store.kt:6-11,46-68).
  - *Code snippet:* the exhaustive `when` over the four result kinds, verbatim from the
    CI-compiled quickstart (docs/store6/quickstart.md:97-104).
  - Cross-link: /docs/store6/concepts/read-contract, /docs/store6/concepts/errors.

- **H2: What Store 6 now does for you**
  - Every zero-config behavior is named and covered by a conformance test; zero configuration and
    explicit expert configuration are byte-identical in behavior (asserted over persistence,
    bookkeeper, freshness validator, and idle cap)
    (docs/store6/important-defaults.md:7-14).
  - Freshness is native: no `Validator` to write; invalidated values are served stale while
    exactly one background revalidation runs (docs/store6/important-defaults.md:28-33).
  - Zero retries, zero backoff: one demand cycle invokes the fetcher exactly once; retries belong
    in your fetcher where you control the policy (docs/store6/important-defaults.md:37-42).
  - Bounded memory: idle residency capped at 128 keys; keys with active collectors or in-flight
    fetches are never evicted; eviction is semantically invisible
    (docs/store6/important-defaults.md:51-60).
  - Durable invalidation: stale marks and namespace/global watermarks survive restart and
    eviction and cover keys the store has never seen
    (store6-core/src/commonMain/kotlin/org/mobilenativefoundation/store6/core/Store.kt:84-111,
    docs/store6/important-defaults.md:61-63).
  - Cross-link: /docs/store6/important-defaults, /docs/store6/concepts/memory-and-lifecycle.

- **H2: Maintenance calls: where clear() habits go**
  - Store 5's `Store` has only `clear(key)` and `clearAll()`
    (store/src/commonMain/kotlin/org/mobilenativefoundation/store/store5/Store.kt:34-37).
    Store 6 splits maintenance in two: `invalidate` / `invalidateNamespace` / `invalidateAll`
    mark stale and keep serving; `clear` / `clearNamespace` / `clearAll` destructively remove,
    and post-clear streams never replay pre-clear data
    (store6-core/src/commonMain/kotlin/org/mobilenativefoundation/store6/core/Store.kt:70-164).
  - Decision test to state on the page: wrong-to-show means clear; merely imperfect means
    invalidate. Cross-link: /docs/store6/invalidate-vs-clear.

- **H2: Where MutableStore users go**
  - *Admonition (stability tier):* `store6-mutations` is experimental, in its own artifact, and
    every public symbol is `@ExperimentalStoreApi`; it is in the alpha01 floor, not the may-slip
    list; graduation to stable is gated (API unchanged across two consecutive minors, green
    crash/soak lanes, three external production adopters) with the first review at 6.1 and a
    target window of roughly 6.3 — never date-driven (STABILITY.md:52, STABILITY.md:139-151).
  - `mutationStore(...)` returns a `MutationStore` that IS a `Store` — implemented by delegation,
    so every read habit from this page carries over unchanged
    (store6-mutations/src/commonMain/kotlin/org/mobilenativefoundation/store6/mutations/MutationStore.kt:60-67).
  - The write vocabulary changes: no `StoreWriteRequest`/`StoreWriteResponse`. Writes are typed
    intents enqueued with `mutate(key, ref, args)` (returns an opaque mutation id), pushed by
    `drain(key)` / `drain()` passes that adopt each server acknowledgement
    (store6-mutations/src/commonMain/kotlin/org/mobilenativefoundation/store6/mutations/MutationStore.kt:246-290).
    Durable truth about outstanding writes is `pending` / `pendingWrites` / `deadLetters`
    (MutationStore.kt:301-325).
  - *Code snippet:* the `mutationStore` factory plus `mutate`/`drain`, verbatim from
    docs/store6/quickstart.md:145-161 (parity-anchored against the landed surface).
  - `runtime()` returns `null` on a mutation store by design: the raw write handle is withheld so
    every consumer write stays journalled (docs/store6/quickstart.md:176-178;
    store6-mutations/src/commonMain/kotlin/org/mobilenativefoundation/store6/mutations/MutationStore.kt:42-58).
  - Pending-write UI keys on `origin == OVERLAY`, never `isStale` — `isStale` is never set on an
    overlay frame; and `get` is unprojected, so observing your own optimistic write means
    observing `stream` (STABILITY.md:186-198).
  - The alpha ships the two-step durable acknowledgement: adopt the echo first, retire the
    journal row last; a crash inside the window can re-send the same push, so server endpoints
    must be idempotent or keyed by mutation identity (STABILITY.md:153-170, README.md:22-26).
  - Cross-links: /docs/store6/migration/component-map (row-by-row translation),
    /docs/store6/mutations, /docs/store6/mutations/quickstart,
    /docs/store6/mutations/pending-write-ui.

- **H2: A screen at a time: the recipe**
  - Ordered steps, each linking to its teaching page: (1) keep the Store 5 dependency in place;
    (2) add the store6 dependencies for one screen; (3) design the screen's `StoreKey`
    (namespace = what you invalidate together; canonicalId = everything that makes the result
    bytes different) — /docs/store6/key-design; (4) port the fetcher —
    /docs/store6/guides/fetchers; (5) wire persistence through an adapter or the seam —
    /docs/store6/guides/persistence, /docs/store6/room, /docs/store6/sqldelight; (6) translate
    the collection sites using the two tables above; (7) delete the screen's Store 5 store;
    repeat.
  - Note: because the interop artifact tracks to 6.0.0 (STABILITY.md:70-71), a screen mid-flight
    on Store 5 and a migrated screen on Store 6 hold independent caches of the same backend data;
    the page says this plainly.
  - *Diagram (planned):* one small two-column figure — an app with N screens on Store 5 and one
    screen moved to Store 6, both lines depending on the same backend, no shared cache arrow.
- **H2: What to read next**
  - Cross-links: /docs/store6/migration/component-map, /docs/store6/migration/from-store4,
    /docs/store6/concepts/read-contract, /docs/store6/concepts/freshness,
    /docs/store6/guides/testing.

---

## /docs/store6/migration/component-map

- **Title:** Store 5 component → Store 6 map
- **Disposition:** new
- **Audience:** Migrating Store 5 users
- **Purpose:** The seven-component translation table: Fetcher/SourceOfTruth/Converter collapse
  into fetcher + persistence seams (no Converter seam exists — mapping lives in the callbacks);
  Validator's job is absorbed by native freshness; MutableStore + Updater map to mutationStore
  and drain/ack; Store 5's failed-sync Bookkeeper maps to the mutations journal and inspection
  surfaces, distinct from Store 6's engine-owned freshness Bookkeeper — with per-row links into
  the pages that teach each replacement.
- **Sources:** store-docs/content/docs/concepts/store5/overview.mdx;
  store/src/commonMain/kotlin/org/mobilenativefoundation/store/store5/ (Store 5 API surface);
  store6-core/src/commonMain/kotlin/org/mobilenativefoundation/store6/core/StoreBuilder.kt;
  store6-core/src/commonMain/kotlin/org/mobilenativefoundation/store6/core/Freshness.kt;
  store6-core/src/commonMain/kotlin/org/mobilenativefoundation/store6/core/seam/;
  store6-mutations/src/commonMain/kotlin/org/mobilenativefoundation/store6/mutations/MutationStore.kt;
  STABILITY.md

### Page skeleton

- **H2: How to read this map**
  - Store 5 documents eight assembled components — Store, MutableStore, SourceOfTruth, Fetcher,
    Updater, Bookkeeper, Validator, Converter
    (store-docs/content/docs/concepts/store5/overview.mdx:5-35). Store 6 core requires exactly
    one input, the fetcher; everything else is either a seam door or native engine behavior
    (store6-core/src/commonMain/kotlin/org/mobilenativefoundation/store6/core/StoreBuilder.kt:176-179).
  - *Admonition (stability tier):* the seam package — the files you implement to plug in a
    fetcher, source of truth, bookkeeper, clock, telemetry, or overlay — is entirely
    `@ExperimentalStoreApi` and a freeze candidate, not frozen (STABILITY.md:57-68). The
    mutations rows are additionally in a separate experimental artifact (STABILITY.md:52).
  - The summary table (one row per Store 5 component, columns: Store 5 component → Store 6
    replacement → where to learn it), followed by one section per row. The table is the page's
    artifact; no diagram planned.

- **H2: Store → Store**
  - `stream(StoreReadRequest)` becomes `stream(key, freshness)`; a suspending point read `get`
    is added; both doors follow the one-failure-channel rule
    (store/src/commonMain/kotlin/org/mobilenativefoundation/store/store5/Store.kt:34-37;
    store6-core/src/commonMain/kotlin/org/mobilenativefoundation/store6/core/Store.kt:41-68).
  - `clear`/`clearAll` split into non-destructive invalidate operations and destructive clear
    operations, both namespace-aware
    (store6-core/src/commonMain/kotlin/org/mobilenativefoundation/store6/core/Store.kt:70-164).
  - Row links: /docs/store6/concepts/read-contract, /docs/store6/invalidate-vs-clear,
    /docs/store6/migration/from-store5 (the request/response tables).

- **H2: Fetcher → fetcher, fetcherOfResult, or the seam Fetcher**
  - Three install points on the builder; the last registration wins across all three; the
    `fetcherOfResult` name deliberately follows v5's `Fetcher.ofResult`
    (store6-core/src/commonMain/kotlin/org/mobilenativefoundation/store6/core/StoreBuilder.kt:66-104).
  - Result vocabulary: v5 `FetcherResult.Data` / `Error.Exception|Message|Custom`
    (store/src/commonMain/kotlin/org/mobilenativefoundation/store/store5/FetcherResult.kt:3-13)
    → v6 `Success(value, etag)` / `Error(cause)` plus two new variants: `NotModified` (conditional
    fetch; surfaces as one `Revalidated` frame) and `Deleted` (server-reported deletion; no
    auto-refetch)
    (store6-core/src/commonMain/kotlin/org/mobilenativefoundation/store6/core/seam/FetcherResult.kt:22-45).
  - v5 fallback fetchers (`Fetcher.fallback`,
    store/src/commonMain/kotlin/org/mobilenativefoundation/store/store5/Fetcher.kt:28) have no
    engine-level counterpart: Store 6 runs zero retries and no fallback chain — compose fallback
    inside your fetcher (docs/store6/important-defaults.md:37-42).
  - Row link: /docs/store6/guides/fetchers.

- **H2: SourceOfTruth → the persistence seam**
  - v5's `SourceOfTruth<Key, Local, Output>` carries three type parameters because a Converter
    sits in the pipeline
    (store/src/commonMain/kotlin/org/mobilenativefoundation/store/store5/SourceOfTruth.kt:49-71);
    v6's seam `SourceOfTruth<K, V>` is two-parameter with a nullable-row contract:
    `reader` first-emits the current row and never completes normally; mutations are
    exception-atomic and give read-your-writes; `deleteNamespace` is new
    (store6-core/src/commonMain/kotlin/org/mobilenativefoundation/store6/core/seam/SourceOfTruth.kt:9-76).
  - Custom implementations are certified with the contract kit in store6-testing; the Room and
    SQLDelight adapters implement the seam over an existing database.
  - Row links: /docs/store6/guides/persistence, /docs/store6/room, /docs/store6/sqldelight,
    /docs/store6/guides/testing.

- **H2: Converter → no seam; mapping lives in the callbacks**
  - v5's Converter bridges network/local/output model types with `fromNetworkToLocal` and
    `fromOutputToLocal`
    (store/src/commonMain/kotlin/org/mobilenativefoundation/store/store5/Converter.kt:12-15).
  - v6 has no converter role: the seam is the package for plugging in a fetcher, source of
    truth, bookkeeper, clock, telemetry, or overlay — a converter is not among them
    (STABILITY.md:57-58). A Store 6 store is typed on a single value type `V`.
  - Where the mapping went: the fetcher maps network payloads to `V` before returning, and the
    persistence layer maps `V` to and from rows in its own callbacks — for example the SQLDelight
    adapter's constructor takes `readQuery`, `writeRow`, and delete callbacks over generated
    queries
    (store6-sqldelight/src/commonMain/kotlin/org/mobilenativefoundation/store6/sqldelight/SqlDelightSourceOfTruth.kt:68-77).
  - Row links: /docs/store6/guides/fetchers, /docs/store6/guides/persistence.

- **H2: Validator → native freshness**
  - v5's optional `Validator.isValid(item)` decided per item whether cached data triggers a
    refetch
    (store/src/commonMain/kotlin/org/mobilenativefoundation/store/store5/Validator.kt:9-15).
  - v6 absorbs that job natively: each read is planned from a per-call `Freshness` policy
    (CachedOrFetch, MaxAge, MustBeFresh, StaleIfError, LocalOnly), recorded metadata, and durable
    staleness
    (store6-core/src/commonMain/kotlin/org/mobilenativefoundation/store6/core/Freshness.kt:12-51);
    staleness is reported on every `Data` frame via `isStale`
    (store6-core/src/commonMain/kotlin/org/mobilenativefoundation/store6/core/StoreResult.kt:29-33);
    deliberate invalidation is a first-class durable operation
    (store6-core/src/commonMain/kotlin/org/mobilenativefoundation/store6/core/Store.kt:70-84).
  - Expert nuance stated honestly: the seam does contain a `FreshnessValidator`, but it is a pure
    read planner — `plan(context)` returns a `FetchPlan` — not a per-item validity hook
    (store6-core/src/commonMain/kotlin/org/mobilenativefoundation/store6/core/seam/FreshnessValidator.kt:36-42).
  - Row links: /docs/store6/concepts/freshness, /docs/store6/invalidate-vs-clear,
    /docs/store6/important-defaults.

- **H2: MutableStore + Updater → mutationStore, mutate, and drain**
  - *Admonition (stability tier):* everything in this row is `@ExperimentalStoreApi` in the
    separate `store6-mutations` artifact (STABILITY.md:52).
  - v5's `MutableStore.write(StoreWriteRequest)` plus `Updater.post(key, value)`
    (store-docs/content/docs/concepts/store5/mutable-store.mdx:28-44;
    store/src/commonMain/kotlin/org/mobilenativefoundation/store/store5/Updater.kt:9-21) become:
    typed durable intents enqueued with `mutate(key, ref, args)`
    (store6-mutations/src/commonMain/kotlin/org/mobilenativefoundation/store6/mutations/MutationStore.kt:246-253),
    pushed by idempotent `drain(key)` / `drain()` passes
    (MutationStore.kt:270-290), against an app-owned `MutationServer` with exactly two methods —
    `push(request): MutationAck` and `retire(request): MutationRetirementAck`
    (store6-mutations/src/commonMain/kotlin/org/mobilenativefoundation/store6/mutations/MutationProtocol.kt:253-281).
  - v5's per-key write request queue (store-docs/content/docs/concepts/store5/mutable-store.mdx:138)
    maps to the journalled FIFO ordered by durable client sequence, inspectable via
    `pending(key)` (MutationStore.kt:293-305).
  - Write shapes are registered once, compile-time typed: `update` / `create` / `delete` /
    `upsert` registrations return typed refs; no call-site closure becomes a durable intent
    (store6-mutations/src/commonMain/kotlin/org/mobilenativefoundation/store6/mutations/MutatorRegistry.kt:100-221).
  - Conflict resolution moves from the Updater/Bookkeeper pairing to an optional
    `conflicts { precondition(...); merge(...) }` block; without a merge, server-wins is the
    non-removable terminal
    (store6-mutations/src/commonMain/kotlin/org/mobilenativefoundation/store6/mutations/MutationStoreBuilder.kt:145-157,207-262).
  - Row links: /docs/store6/mutations, /docs/store6/mutations/mutators,
    /docs/store6/mutations/server, /docs/store6/mutations/conflicts,
    /docs/store6/mutations/drain-and-restart.

- **H2: Bookkeeper → the journal (and a name collision to know about)**
  - v5's Bookkeeper records failed-sync timestamps per key so unsynced local changes are retried
    and conflicts detected on later reads
    (store/src/commonMain/kotlin/org/mobilenativefoundation/store/store5/Bookkeeper.kt:7-22).
  - That job now belongs to the mutations journal: intents, attempts, acknowledgements, and
    normalized failures are durable records, and the truthful inspection surfaces are
    `pending(key)` / `pendingWrites()` / `deadLetters()`
    (store6-mutations/src/commonMain/kotlin/org/mobilenativefoundation/store6/mutations/MutationStore.kt:292-325).
    Durable journal storage is a seam with an in-memory default and a SQLDelight adapter
    (store6-mutations/src/commonMain/kotlin/org/mobilenativefoundation/store6/mutations/MutationStoreBuilder.kt:159-171).
  - *Admonition (name collision):* Store 6 also has a `Bookkeeper` — the engine-owned durable
    freshness bookkeeping seam (one monotone sequence shared by successes, stale marks, and
    namespace/global watermarks; a key is durably stale exactly when
    `max(mark/ns/global) > (success ?: 0)`)
    (store6-core/src/commonMain/kotlin/org/mobilenativefoundation/store6/core/seam/Bookkeeper.kt:9-35).
    Same name, different job: it tracks freshness, not failed syncs, and an in-memory default is
    installed automatically
    (store6-core/src/commonMain/kotlin/org/mobilenativefoundation/store6/core/StoreBuilder.kt:52).
  - Row links: /docs/store6/mutations/journal-storage, /docs/store6/mutations/inspection,
    /docs/store6/guides/persistence (durable freshness bookkeeping via the adapters).

- **H2: Not in the map**
  - Memory cache / `MemoryPolicy` / `disableCache`: the Store 6 memory bound is `maxIdleKeys`
    (default 128) and eviction is semantically invisible
    (store6-core/src/commonMain/kotlin/org/mobilenativefoundation/store6/core/StoreBuilder.kt:106-121).
  - `scope(...)`: Store 6 stores are closed explicitly with `close()`
    (store6-core/src/commonMain/kotlin/org/mobilenativefoundation/store6/core/Store.kt:166-173).
  - Row links: /docs/store6/concepts/memory-and-lifecycle.

---

## /docs/store6/migration/from-store4

- **Title:** Migrating from Store 4
- **Disposition:** new
- **Audience:** Store 4 holdouts
- **Purpose:** The 4→6 path STABILITY.md names as a GA launch gate: what changed across two
  majors and how the 5→6 mapping applies from a Store 4 starting point. Ships thin initially and
  grows toward GA; honestly labeled as in progress until then.
- **Sources:** STABILITY.md; ROADMAP.md; CHANGELOG.md;
  store/src/commonMain/kotlin/org/mobilenativefoundation/store/store5/ (Store 4 idioms preserved
  in Store 5 source and KDoc); docs/store6/quickstart.md

### Page skeleton

- *Admonition (page status, at top):* In progress. This page ships thin and grows toward GA:
  the Store 4 → 6 migration guide is a launch gate for 6.0.0 — it blocks GA
  (STABILITY.md:109-110), and the roadmap's GA milestone names a "Store 4 → 6 in an afternoon"
  guide as a deliverable (ROADMAP.md:73). Until then this page routes you through the 5→6
  material and states what will be added.

- **H2: Where you are starting from**
  - Store 4 lived under `com.dropbox` packages; the `store4` package name survives verbatim in a
    Store 5 KDoc reference
    (store/src/commonMain/kotlin/org/mobilenativefoundation/store/store5/StoreReadRequest.kt:23).
  - Two facts shrink this migration: Store 5 kept Store 4's concepts and usage unchanged
    (CHANGELOG.md:157-158), and Store 5's stable release was additive over Store 4 with no
    breaking changes (CHANGELOG.md:110). Consequence stated plainly: the 5→6 component map
    applies from a Store 4 codebase — with fewer rows.

- **H2: Rows of the 5→6 map that do not apply to you**
  - Everything Store 5 added after Store 4 — MutableStore, Validator, fallback mechanisms,
    conflict resolution for writes, `NoNewData` (CHANGELOG.md:110-117) — has nothing to
    translate in a Store 4 codebase. For a Store 4 holdout, freshness policies and the journalled
    write path are new capabilities to evaluate, not migrations to perform.
  - Cross-link: /docs/store6/migration/component-map (the rows that remain: Store, Fetcher,
    SourceOfTruth, Converter).

- **H2: The mapping that does apply**
  - Short table, three rows, each deferring detail to the 5→6 pages:
    - Fetcher → `fetcher { }` / `fetcherOfResult { }`; a fetcher is the one required input
      (store6-core/src/commonMain/kotlin/org/mobilenativefoundation/store6/core/StoreBuilder.kt:66-90,176-179).
      Link: /docs/store6/guides/fetchers.
    - Persister / SourceOfTruth → the persistence seam and its Room/SQLDelight adapters
      (store6-core/src/commonMain/kotlin/org/mobilenativefoundation/store6/core/seam/SourceOfTruth.kt:45-76).
      Links: /docs/store6/guides/persistence, /docs/store6/room, /docs/store6/sqldelight.
    - Read idioms: the Store 4-era `store.fresh(key)` and `store.cached(key, refresh = true)`
      spellings (preserved in Store 5's own Store KDoc example,
      store/src/commonMain/kotlin/org/mobilenativefoundation/store/store5/Store.kt:22-31) map to
      `get(key, Freshness.MustBeFresh)` and `stream(key)` with invalidation-driven refresh
      (store6-core/src/commonMain/kotlin/org/mobilenativefoundation/store6/core/Store.kt:41-68;
      store6-core/src/commonMain/kotlin/org/mobilenativefoundation/store6/core/Freshness.kt:34).
      Link: /docs/store6/migration/from-store5 (the request and response tables).
  - *Code snippet:* the Store 6 side only — the five-line `store { }` build and the exhaustive
    four-kind `when`, verbatim from the CI-compiled quickstart (docs/store6/quickstart.md:90-104).
    The page does not fabricate a compilable Store 4 block before the worked example lands; it
    shows the Store 4 idioms as the two-line KDoc-derived spellings above.

- **H2: Coordinates and coexistence**
  - `store6-*` artifacts publish under group `org.mobilenativefoundation.store` with packages
    `org.mobilenativefoundation.store6.*` (STABILITY.md:42-43); nothing is published until
    6.0.0-alpha01 (README.md:15).
  - The no-flag-day posture applies from Store 4 as well: old coordinates keep resolving while
    you add `store6-*` and move a screen at a time (STABILITY.md:106-107).
  - Honest limit: the promised interop artifact is `store6-store5-interop` only; no Store 4
    interop artifact is promised (STABILITY.md:70-71).

- **H2: What this page will grow into**
  - Named forthcoming content, each item checkable at GA: a worked port of a small Store 4 setup
    (fetcher + persister + read sites) sized to an afternoon, matching the roadmap's GA
    deliverable (ROADMAP.md:68-73); a symbol-level rename table verified against a Store 4
    project; a migration checklist. Docs are launch gates, not follow-ups — a release without its
    documentation is not done (ROADMAP.md:21-22).
  - Cross-links: /docs/store6/migration/from-store5, /docs/store6/migration/component-map,
    /docs/store6/quickstart.


<!-- ================================================================ -->

# Section outlines — Store 6 — Project and policy (`store6-project`)

# Section: Store 6 — Project and policy (store6-project)

All three pages in this section are **sync-owned**: their site copies at `content/docs/store6/*.mdx` are generated by `store-docs/scripts/sync-store6-docs.mjs` from Repo A files pinned at revision `a6a156e99db29cebf7da238263b007802bff2bfb` in `store-docs/evidence/T4-store6-source-lock.json`. The outlines below reflect the Repo A sources as they exist today (verified by reading them), plus the locked publication transforms the sync applies. Content changes happen only in Repo A followed by re-pinning (revision + sha256); the site copies are never hand-edited (hand edits fail `--check` and abort the next reconcile with OWNED_STALE_MODIFIED).

Shared mechanical facts, verified:

- Lock entries: `STABILITY.md → content/docs/store6/stability.mdx` (sha256 `1fefba6a…`), `ROADMAP.md → content/docs/store6/roadmap.mdx` (sha256 `c83a0593…`), `CONTRIBUTING.md → content/docs/store6/contributing.mdx` (sha256 `4fee66fc…`) — store-docs/evidence/T4-store6-source-lock.json:26-39.
- The generic pipeline converts the leading H1 into frontmatter `title`, strips HTML comments, and rewrites relative links: links to sibling locked docs become `/docs/store6/*` routes; other in-repo relative links become `https://github.com/matt-ramotar/Store6/{blob|tree}/main/<path>` (store-docs/scripts/sync-store6-docs.mjs:111-139).
- Locked line-range transforms exist for STABILITY.md only in this section (lines 123-126, 162-163, 172-179, 206 — store-docs/scripts/sync-store6-docs.mjs:148-167). ROADMAP.md and CONTRIBUTING.md sync with generic transforms only. Because STABILITY.md's transforms are 1-based line ranges, upstream STABILITY.md amendments must be append-only or the anchors break.
- None of the three sources contains a code block, so no code snippets are planned for any page in this section. The pages carry markdown tables instead (verified below). No MDX admonitions exist on these pages; any future callout must be authored upstream as Repo A prose/blockquote, never injected on the site.

---

## /docs/store6/stability

- **Title:** Stability policy
- **Disposition:** sync-owned (source of record: Repo A `STABILITY.md`; site copy `content/docs/store6/stability.mdx`)
- **Audience:** Adopters and library evaluators
- **Purpose:** The artifact-to-tier table, the three opt-in markers, the deprecation cycle, verification-from-a-released-tag mechanics, the mutations alpha posture, and the OVERLAY-vs-isStale consumer guidance.
- **Sources:** `STABILITY.md` (Repo A, pinned @ `a6a156e9`), `store-docs/evidence/T4-store6-source-lock.json:26-29`, `store-docs/scripts/sync-store6-docs.mjs:148-167` (locked transforms)

### Page skeleton (mirrors the source as it exists today; H2/H3 headings are the source's own)

- **(frontmatter)** — H1 "Store 6 stability policy" becomes `title` (verified in the generated mdx).
- **## 1. What this document is**
  - Scope statement: the `store6-*` artifacts, effective with the 6.0.0-alpha01 release; Store 5 continues under its own coordinates (STABILITY.md:12-13).
  - Names itself the standing answer to upstream issues on binary compatibility (#570) and a published roadmap (#534), with absolute GitHub links to MobileNativeFoundation/Store issues (STABILITY.md:9-10, 208-209).
  - House rule stated: where a promise is not yet earned, the document says so rather than rounding up (STABILITY.md:6-7).
- **## 2. API tiers**
  - Three-row marker table: `@ExperimentalStoreApi` (may change or be removed in any release), `@DelicateStoreApi` (stable but easy to misuse; opting in asserts you uphold the contract), `@InternalStoreApi` (never usable outside `org.mobilenativefoundation.store` artifacts) (STABILITY.md:22-26).
  - All three markers are `RequiresOptIn.Level.ERROR`; `Store` additionally carries `@SubclassOptInRequired(DelicateStoreApi::class)`, so implementing the interface is a deliberate act (STABILITY.md:28-30).
  - Two bolded policy rules: experimental code lives in separate artifacts, never annotation-gated inside a stable one; SemVer is scoped to the stable tier, so breaking an experimental surface in a minor is not a violation (STABILITY.md:32-38).
- **## 3. Artifacts and tiers, as of 6.0.0-alpha01**
  - Group coordinates unchanged (`org.mobilenativefoundation.store`); packages `org.mobilenativefoundation.store6.*` (STABILITY.md:42-43).
  - Nine-row artifact table: store6-core stable-track (**not frozen** until the beta01 freeze candidate); store6-testing experimental; the three adapters (sqldelight/room/compose) experimental, "alpha01, may slip one alpha", graduating stable at 6.0.0; store6-mutations experimental in its own artifact; store6-bom version alignment only; devtools + devtools-inspector experimental at alpha02 (target) (STABILITY.md:45-55).
  - Seam qualifier: the `org.mobilenativefoundation.store6.core.seam` package — 13 files users implement — is a freeze candidate, not frozen; today `@ExperimentalStoreApi`; CI enforces the 13-file list on every PR; `Overlay` and `StoreWriteHandle` freeze only once the ack-path atomicity work and its test matrix are green, else they ship experimental outside the frozen tier at beta01 (STABILITY.md:57-68).
  - Promised but not in the alpha01 line: `store6-store5-interop` and `store6-paging-androidx`, both tracking to 6.0.0; artifacts that miss a train get their target release named, never dropped silently (STABILITY.md:70-72).
- **## 4. Deprecation cycle**
  - Three stages for stable-tier removals: `WARNING` with `ReplaceWith` → `ERROR` no earlier than two minor releases later → `HIDDEN` at the next major, with binary compatibility preserved until then (STABILITY.md:80-83).
  - "No silent capability drops": a removed capability gets the same cycle and a migration note (STABILITY.md:85-86).
- **## 5. Release cadence**
  - Monthly alphas from 6.0.0-alpha01; governing rule "cut scope, never cadence" (STABILITY.md:92-94).
  - Two explicit anti-commitments: no repeat of a 30-month alpha line, no breaking API in beta again (STABILITY.md:96).
  - Each alpha closes at least one community issue with a link to the named guarantee — a conformance test, not a changelog line; each release states the next target month (STABILITY.md:98-100).
  - In-content link to the roadmap; the sync rewrites `./ROADMAP.md` to `/docs/store6/roadmap` (verified at stability.mdx:104).
- **## 6. Migrating from Store 5**
  - `store5.*` and `store6.*` coordinates live side by side for the whole 6.x major; migrate a screen at a time; no flag day (STABILITY.md:106-107).
  - `store6-store5-interop` is supported for all of 6.x; the 5→6 and 4→6 migration guides are launch gates for 6.0.0 — they block GA (STABILITY.md:109-110).
- **## 7. How stability is verified**
  - `explicitApi()` strict on every `store6-*` library module (STABILITY.md:118).
  - Binary-compatibility-validator 0.17.0 with klib validation; committed JVM `.api` and `.klib.api` dumps (example paths `store6-core/api/jvm/store6-core.api`, `store6-core/api/store6-core.klib.api`); check runs in `build` on every PR (STABILITY.md:119-122).
  - Generated-Swift dumps diffed on every PR (Obj-C export and SKIE, `store6-core/api/swift/objc` and `store6-core/api/swift/skie`). **Site-copy delta:** the locked transform replaces lines 123-126 so the site copy says "The supported bridge set may change, so read this as a commitment to the mechanism rather than to a fixed list of lanes" instead of referencing the disposition recorded at the alpha01 cut (store-docs/scripts/sync-store6-docs.mjs:163-167).
  - ABI dumps committed at every released tag, so any release's surface is diffable from the repository (STABILITY.md:127-128).
  - The conformance suite is public documentation of what is guaranteed; the sync rewrites the relative `store6-core/src/commonTest/...` link to the pinned GitHub tree URL `https://github.com/matt-ramotar/Store6/tree/main/store6-core/src/commonTest/kotlin/org/mobilenativefoundation/store6/core` (verified at stability.mdx:132; this exact destination is asserted by store-docs/scripts/t4-contract.test.mjs).
- **## 8. Mutations at 6.0.0-alpha01**
  - Framing: store6-mutations is in the alpha01 floor, not the may-slip list — an app that writes should not have to wait for a later alpha (STABILITY.md:139-140).
  - **### (a) The tier** — experimental, own artifact, every public symbol `@ExperimentalStoreApi`; graduation criteria published alongside the alpha01 release; first review at 6.1; target window roughly 6.3 as a target, not a schedule; criteria: API unchanged across two consecutive minors, crash-matrix and soak lanes green in production-representative apps, at least three external production adopters; "Nothing graduates because a date arrived" (STABILITY.md:144-151).
  - **### (b) The two-step durable ack posture** — the non-transactional alpha path adopts the server echo first and retires the journal row last; the transactional path does the opposite and is safe only because it is atomic; a crash before retire leaves a replayable pending intent, a crash after an early retire would lose the write (STABILITY.md:155-160). Stated consequence: a crash inside the ack window can re-send the same push, so server endpoints must be idempotent or keyed by mutation identity; making the ack path atomic is beta01 work (STABILITY.md:165-170). **Site-copy delta:** the transform rewrites lines 162-163 to "the same conservative crash-window stance used for reads" (drops the governance verb) (store-docs/scripts/sync-store6-docs.mjs:159-162).
  - **### (c)** — **Site-copy delta:** the transform replaces source lines 172-179 wholesale; the site heading is "The current surface stays experimental" (verified at stability.mdx:173) and the body states the surface facts without the dated review history: required-input `mutationStore` factory with an overlay-free builder, compile-time-required restart-safe key resolver, explicit presence algebra for value state, caller-installed persistence retained for the transactional ack-path decorator; the module remains experimental and the document deliberately freezes no mutations signature into policy prose (store-docs/scripts/sync-store6-docs.mjs:150-158).
- **## 9. Reading pending writes and staleness**
  - Two affordances distinguished: a pending-write affordance keys on `origin == OVERLAY`; a stale-cache affordance keys on `isStale` (STABILITY.md:186-187).
  - `isStale` is never set on an OVERLAY frame: overlay frames are stamped `age = Duration.ZERO` and `isStale = false` unconditionally; only `refreshing` is live; a spinner driven by `isStale` will never fire for a pending write, by design (STABILITY.md:189-193).
  - `Store.get` is unprojected — overlays apply only to `stream`, so an optimistic mutation is invisible to `get`; documented consequence of the read contract, not a defect (STABILITY.md:195-197).
- **## 10. Kotlin floor**
  - Kotlin 2.3, raised only in minor releases with notice; every published store6-core variant declares `org.jetbrains.kotlin:kotlin-stdlib:2.3.20` and no `apiVersion`/`languageVersion` pin lowers it (STABILITY.md:201-206). **Site-copy delta:** the transform truncates line 206 so the site copy omits the closing toolchain-rationale sentence (store-docs/scripts/sync-store6-docs.mjs:149).

### Cross-links

- In-content (exist today): `/docs/store6/roadmap` (§5); GitHub conformance-suite tree (§7); upstream issue links (§1).
- Related planned pages for surrounding nav/see-also (site-side, not injectable into the sync-owned body): `/docs/store6/concepts/api-tiers` (teaches when users hit each opt-in prompt; this page is the policy of record it cites), `/docs/store6/mutations` and `/docs/store6/mutations/server` (the two-step ack consequence in §8b is their normative source), `/docs/store6/mutations/pending-write-ui` (§9 is its normative source), `/docs/store6/migration/from-store5` (§6 commits to the side-by-side model that guide executes), `/docs/store6/guides/testing` (store6-testing tier row).

### Upstream edits wanted (Repo A only, then re-pin revision + sha256; append-only because of the line-range transform anchors)

- The §3 artifact table has no rows for `store6-mutations-sqldelight` or `store6-mutations-testing`, although both modules exist and are `@ExperimentalStoreApi` throughout — an explicit tier statement would close the gap.
- §6 could link the 5→6 migration guide once it exists on-site (today the section names the guides but links nothing).
- §9 could gain a pointer to a pending-write UI guide once one ships.

---

## /docs/store6/roadmap

- **Title:** Roadmap
- **Disposition:** sync-owned (source of record: Repo A `ROADMAP.md`; site copy `content/docs/store6/roadmap.mdx`)
- **Audience:** Adopters planning against the release line
- **Purpose:** Operating principles as commitments, the release train with target windows and confidence ranges, cut-scope-never-cadence, and the gated (never date-driven) mutations graduation.
- **Sources:** `ROADMAP.md` (Repo A, pinned @ `a6a156e9`), `store-docs/evidence/T4-store6-source-lock.json:31-34`. No locked line-range transforms apply; the sync applies only the generic H1/link transforms.

### Page skeleton (mirrors the source as it exists today)

- **(frontmatter)** — H1 "Store 6 roadmap" becomes `title`.
- **Intro (no heading)**
  - "Store 6's plan, with dates on it": some dates will move; what will not move is the rule governing how they move; wherever a window is an estimate, the page says so and gives the range (ROADMAP.md:3-5).
  - Identifies itself as the roadmap upstream issue #534 asked for, with an absolute link (ROADMAP.md:7, 113).
- **## Operating principles**
  - Framed as "commitments, not aspirations" (ROADMAP.md:11); five numbered principles:
  - 1. Cut scope, never cadence — a slip threatens a release's contents, never its date (ROADMAP.md:13).
  - 2. The read core never waits on an extension — paging, the Swift facade, or Store 5 interop can slip and 6.0 still ships; mutations are explicitly **not** an extension for this rule's purposes (writing is functionality Store 5 already shipped); the separate artifact is a packaging decision, not a dependency one (ROADMAP.md:14-18).
  - 3. Experimental code lives in separate artifacts, never annotation-gated inside a stable one (ROADMAP.md:19-20).
  - 4. Docs are launch gates, not follow-ups — a release without its documentation is not done; migration guides ship with the migration (ROADMAP.md:21-22).
  - 5. Gates are written down before the work starts (ROADMAP.md:23-24).
- **## Release train**
  - **### Foundation (Q3–Q4 2026)** — build, target matrix, CI lanes, API-review discipline proven end to end; binary-compatibility and generated-Swift dumps gated in CI from the first alpha; Store 6 is developed in a fork and lands in the MobileNativeFoundation repository under `store6.*` before the alpha01 cut (ROADMAP.md:30-33).
  - **### 6.0.0-alpha01 — target Q4 2026 (confidence range Q4 2026 – Q1 2027)** — Q1 2027 named as the honest outer bound (ROADMAP.md:37-38). The floor (a headerless two-column table, the only table on the page): `store6-core` + `store6-testing`; `store6-mutations` (journal, drain, rebase, conflict stack, restart replay — experimental artifact in the floor); STABILITY.md + this roadmap; Quickstart + Important Defaults (ROADMAP.md:42-48). May slip one alpha: the SQLDelight, Room, and Compose adapters, the devtools MVP, and the remaining documentation pages; anything that slips gets its target alpha named in the release notes (ROADMAP.md:49-50).
  - **### Mutations beta train + 6.0.0-beta01 (Q1–Q2 2027)** — ack-path atomicity and its crash matrix, the Paging 3 interop adapter, the Swift SPM facade, the outbox inspector demo, Store 5 interop with migration lint (ROADMAP.md:54-55). beta01 is the core API freeze candidate: from beta01 forward, no source-breaking core change without an RC reset (ROADMAP.md:57-58). The freeze-candidate vs frozen distinction spelled out: candidate once a real producer has exercised the seam end to end (the mutations work does, before alpha01); frozen only after ack-path atomicity and its test matrix are green; if that misses beta01, the overlay and write-handle surfaces ship experimental while the rest of core freezes on schedule (ROADMAP.md:60-66).
  - **### 6.0.0 GA — target Q3 2027 (confidence range Q3 – Q4 2027)** — core, testing, the adapters, Store 5 interop, and the BOM in the stable tier; the adapters having run the contract kit throughout the alpha line; paging ships alongside as a supported experimental artifact; the 5→6 and "Store 4 → 6 in an afternoon" migration guides both block GA; Store 5 moves to fixes-only maintenance with a dated end-of-life published at GA (ROADMAP.md:70-73).
  - **### After GA** — 6.1 brings the first mutations graduation review; 6.2 is gated rather than dated; 6.3 is the target window for mutations graduation to stable (ROADMAP.md:77-78).
- **## Cadence**
  - Monthly alphas from 6.0.0-alpha01; each release names the next release's target month and closes at least one community issue with a link to the named guarantee — a conformance test, not a changelog line (ROADMAP.md:82-84).
  - Full policy pointer; the sync rewrites `./STABILITY.md` to `/docs/store6/stability` (verified at roadmap.mdx:89).
- **## Mutations graduation**
  - Mutations stay experimental past GA; first review at 6.1; target window roughly 6.3; graduation requires API unchanged across two consecutive minors, crash-matrix and soak lanes green in production-representative apps, and at least three external production adopters reporting; if not met, it stays experimental and the review repeats; "There is no date-driven graduation" (ROADMAP.md:91-95).
- **## How to contribute**
  - Documentation: every page in this line names the source it was written from, and code blocks come from modules CI compiles; "if a page loses you, open an issue saying where" — named the most-wanted bug report (ROADMAP.md:99-101).
  - Semantics: the conformance suite under `store6-core/src/commonTest` **is the specification**; describing an expected behavior plus a test that would have caught it is a complete contribution before a line of implementation. The sync rewrites the relative link to the pinned GitHub tree URL (verified at roadmap.mdx:105).
  - Adapters and platforms: the source-of-truth seam is small on purpose; an adapter for an uncovered store is a self-contained contribution (ROADMAP.md:106-107).
  - Where to talk: the #store channel on Kotlin Slack (absolute link, untouched by the sync), or a repository issue; issues that name a concrete expectation get answered with a test (ROADMAP.md:108-111).

### Cross-links

- In-content (exist today): `/docs/store6/stability` (Cadence section); GitHub commonTest tree; Kotlin Slack; upstream issue #534.
- Related planned pages for surrounding nav/see-also: `/docs/store6/stability` (full policy), `/docs/store6/contributing` (workflow companion to "How to contribute"), `/docs/store6/mutations` (graduation gates govern that family), `/docs/store6/important-defaults` and `/docs/store6/quickstart` (the two doc deliverables named in the alpha01 floor), `/docs/store6/migration/from-store5` (the GA-blocking guide named in the GA section).

### Upstream edits wanted (Repo A only, then re-pin)

- None required for fidelity. Optional: the "How to contribute" section overlaps CONTRIBUTING.md's workflow content; a one-line pointer between them would remove the duplication ambiguity. ROADMAP.md has no locked line-range transforms, so edits here need only the revision + sha256 re-pin.

---

## /docs/store6/contributing

- **Title:** Contributing
- **Disposition:** sync-owned (source of record: Repo A `CONTRIBUTING.md`; site copy `content/docs/store6/contributing.mdx`)
- **Audience:** Contributors
- **Purpose:** Fork/clone workflow, issue and PR conventions. The stale fork link is corrected in Repo A and re-pinned, never patched on site.
- **Sources:** `CONTRIBUTING.md` (Repo A, pinned @ `a6a156e9`), `store-docs/evidence/T4-store6-source-lock.json:36-39`. No locked line-range transforms; all links in the source are absolute `https:` URLs, so the sync's link rewriter leaves every destination unchanged (verified in contributing.mdx:8,28,31).

### Page skeleton (mirrors the source as it exists today — a short, generic Store-era document)

- **(frontmatter)** — H1 "Contributing to Store" becomes `title`.
- **Intro (no heading)**
  - One sentence: thanks + document scope (guidelines and information about contributing) (CONTRIBUTING.md:2).
- **## Getting Started**
  - Fork the repository: the link targets `https://github.com/MobileNativeFoundation/Store` (CONTRIBUTING.md:5). Note: this is the upstream Store repository, while Store 6 development currently happens in a fork; ROADMAP.md:32-33 states Store 6 lands in the MobileNativeFoundation repository under `store6.*` before the alpha01 cut, so the link's correctness is a Repo A editorial decision (see Upstream edits wanted).
  - Clone the fork to work locally (CONTRIBUTING.md:6).
- **## Contribution Workflow**
  - **### Reporting Issues** — search existing issues before creating a new one; new issues need a clear title and detailed description (CONTRIBUTING.md:10-11).
  - **### Submitting Changes** — create a branch in the fork; clear, concise commit messages; write tests when adding features or fixing bugs; run the existing tests; submit a PR with a clear description and any relevant issue numbers (CONTRIBUTING.md:13-17).
  - **### Code Review Process** — maintainers review and may request changes; contributor updates the PR; a maintainer merges once approved (CONTRIBUTING.md:19-21).
- **## Community Guidelines**
  - Be respectful; welcoming and inclusive environment (CONTRIBUTING.md:24).
  - Code of Conduct link: `https://github.com/MobileNativeFoundation/Store/blob/main/CODE_OF_CONDUCT.md` (CONTRIBUTING.md:25).
- **## Getting Help**
  - Kotlin Slack channel link (`https://kotlinlang.slack.com/archives/C06007Z01HU`) (CONTRIBUTING.md:28).

### Cross-links

- In-content (exist today): none to site pages — every link is an absolute external URL (upstream repository, Code of Conduct, Slack).
- Related planned pages for surrounding nav/see-also: `/docs/store6/roadmap` (its "How to contribute" section carries the Store 6-specific on-ramp: conformance-test-shaped issues, docs-as-bug-reports, adapter contributions), `/docs/store6/stability` (tier and verification context a contributor needs before touching public API).

### Upstream edits wanted (Repo A only, then re-pin revision + sha256 in the lock; never patch the site copy)

- **Fork link correction:** the Getting Started fork target (CONTRIBUTING.md:5) predates the Store 6 line. Decide the canonical contribution repository for Store 6 work and correct the link in Repo A; the site copy then updates through the normal sync + re-pin. This is the one known stale token on the page.
- **Store 6-specific conventions:** the document contains no Store 6 content — no mention of the conformance-suite contribution model (ROADMAP.md:102-105), the `store6-*` module layout, or the API-dump checks a PR will hit (STABILITY.md:118-126). A short "Contributing to the Store 6 line" section upstream would let this page stand alone; until then, the roadmap's "How to contribute" section is the substantive guidance.
- **Code of Conduct link** should be re-verified when the fork-link decision is made, since it points into the same repository.


<!-- ================================================================ -->

# Section outlines — API reference (`reference`)

# Section: API reference (`reference`)

Both pages in this section are static HTML placeholders under `store-docs/public/reference/` that pin a
replacement contract: run the module's Dokka task in Repo A and drop the generated HTML into the same
public directory. "Revise" for these pages means executing that contract, not redesigning prose. The
outlines therefore cover (a) the placeholder structure as it stands today — which is guard-frozen and must
stay byte-stable until the swap — and (b) the structure and QA gates of the generated replacement.

Shared facts verified in Repo A at main `a6a156e9`:

- Dokka 1.9.20 is wired into every store6 library module: the `store6.multiplatform` convention plugin
  applies `org.jetbrains.dokka` (`tooling/plugins/src/main/kotlin/org/mobilenativefoundation/store/tooling/plugins/Store6Conventions.kt:35`)
  and configures `DokkaTask` with `reportUndocumented=false`, `skipDeprecated=true`, `jdkVersion=11`
  (`tooling/plugins/src/main/kotlin/org/mobilenativefoundation/store/tooling/plugins/KotlinMultiplatformConventionPlugin.kt:213-218`;
  version pin `gradle/libs.versions.toml:11`). Both `store6-core/build.gradle.kts:2` and
  `store6-mutations/build.gradle.kts:2` apply that plugin, so `:store6-core:dokkaHtml` and
  `:store6-mutations:dokkaHtml` are real tasks on main.
- The same convention plugin applies `com.android.library` unconditionally
  (`Store6Conventions.kt:33`), which is why the placeholder's build-status statement — the Dokka task graph
  needs a valid Android SDK location — is accurate, not historical.
- All three opt-in markers (`ExperimentalStoreApi`, `DelicateStoreApi`, `InternalStoreApi`) are declared
  `@MustBeDocumented` with `RequiresOptIn.Level.ERROR`
  (`store6-core/src/commonMain/kotlin/org/mobilenativefoundation/store6/core/Annotations.kt:22,44,64`),
  so generated Dokka output renders the marker on every annotated declaration — the tier is visible
  per-symbol without hand-authored badges.
- Site guards that freeze the current placeholders and must be revised in the same motion as the swap:
  `store-docs/scripts/test-t6b-reference.mjs` walks `public/reference` and asserts it contains exactly the
  two `index.html` files (:29, :362-364), asserts the placeholder body text and both contract grids
  verbatim (:454-459), pins the frozen stylesheet/anchor manifests (:31-117), bans script tags (:451),
  bans `data-unresolved-link` markers (:479), bans issue-tracker vocabulary in the HTML (:474-478), pins
  the top-nav Reference item in `lib/nav.ts` (:483-484), and asserts `next.config.mjs` adds no
  `redirects()` (:494-495). `store-docs/scripts/t8-verification.mjs` lists both pages in
  `FIXED_EXTRA_SOURCES` (:28-35) and requires the `public/reference` `.html` census to equal exactly those
  two files (:181-191). Dropping full Dokka output into these directories fails both harnesses as written;
  the swap PR must update them deliberately.
- Zero-redirect parity holds across the swap for free at the URL level: Dokka's HTML output places an
  `index.html` at its output root, so `/reference/store6-core/index.html` and
  `/reference/store6-mutations/index.html` keep serving 200 at their exact inventoried paths.

---

## /reference/store6-core/index.html

- **Title:** store6-core API reference
- **Disposition:** revise
- **Audience:** All users needing symbol-level docs
- **Purpose:** Today an honest placeholder stating that generated documentation is unavailable and pinning
  the replacement contract (`:store6-core:dokkaHtml` → `public/reference/store6-core/`). Revise by dropping
  real Dokka output into the directory per that contract; the top-nav Reference item already targets this
  page (`store-docs/lib/nav.ts:25`).
- **Sources:** `store-docs/public/reference/store6-core/index.html`, `store-docs/lib/nav.ts`,
  `store-docs/scripts/test-t6b-reference.mjs`

### Interim state (today's placeholder — keep byte-stable until the swap)

- **Header chrome** (no heading; site-shell substitute)
  - Brand link "Store Documentation" → `/docs`; nav links "Docs home" → `/docs` and "Store 6 overview" →
    `/docs/store6/overview`; skip link to `#main-content`. The full anchor set, classes, and order are
    frozen by the guard's anchor manifest (`test-t6b-reference.mjs:81-117`) — any edit fails
    `anchor manifest changed`.
- **H1: Store 6 Core API reference unavailable** (eyebrow "Reference")
  - Lede states verbatim: "This page is not generated API documentation. Generated API documentation is
    currently unavailable." Both sentences are asserted by the guard (`test-t6b-reference.mjs:454-455`).
- **H2: Build status**
  - States the local documentation build could not determine the Android SDK location needed to resolve
    the Dokka task dependencies, and that no generated output was copied into the directory
    (placeholder :139-143; guard asserts the Android SDK sentence at `test-t6b-reference.mjs:456`).
  - This statement stays true against Repo A main: the convention plugin applies `com.android.library`
    unconditionally (`Store6Conventions.kt:33`), so the Dokka task graph resolves Android variants.
- **H2: Future replacement contract**
  - One-paragraph contract: when the build environment provides a valid Android SDK location, generate
    each module and replace its placeholder directory with the complete Dokka output (placeholder
    :147-150).
  - Two contract grids (both appear on both pages): Core — task `:store6-core:dokkaHtml`, output
    `store6-core/build/dokka/html/`, destination `public/reference/store6-core/`; Mutations — task
    `:store6-mutations:dokkaHtml`, output `store6-mutations/build/dokka/html/`, destination
    `public/reference/store6-mutations/` (placeholder :151-164; guard asserts task/output/destination
    strings at `test-t6b-reference.mjs:457-459`).
- **Module links nav** (no heading)
  - "Core module" (aria-current="page") and "Mutations module" → `/reference/store6-mutations/index.html`
    (placeholder :166-171).
- **Footer**
  - "Use the Store 6 overview for the current public guides and examples." (placeholder :173).

### Revision: execute the replacement contract

- **Generate** — run `:store6-core:dokkaHtml` in a Repo A checkout with a valid Android SDK. No new
  wiring is needed: the task exists on main via the convention plugin (`Store6Conventions.kt:35,108`), with
  `reportUndocumented=false` / `skipDeprecated=true` already configured
  (`KotlinMultiplatformConventionPlugin.kt:213-218`).
- **Expected generated structure** (Dokka-owned; not hand-designed)
  - Module index listing exactly two packages: `org.mobilenativefoundation.store6.core` and
    `org.mobilenativefoundation.store6.core.seam`. The `core.internal` package contains no public
    declarations — the committed klib dump has zero `store6.core.internal` entries
    (`store6-core/api/store6-core.klib.api`) — so under Dokka's default public-visibility filter it does
    not appear.
  - Per-symbol pages carry the contract-bearing KDoc as written in source. Checkable examples the
    generated pages will show:
    - `Store.stream` KDoc states that fetcher and source-of-truth failures are emitted as
      `StoreResult.Error` values rather than thrown, and that only a `MustBeFresh` initial-cycle fetch or
      revalidation failure emits one error and completes the flow
      (`store6-core/src/commonMain/kotlin/org/mobilenativefoundation/store6/core/Store.kt:41`, KDoc at
      :19-39).
    - `store { }` KDoc documents `@throws IllegalArgumentException if no fetcher is configured`
      (`store6-core/src/commonMain/kotlin/org/mobilenativefoundation/store6/core/StoreBuilder.kt:31`,
      `@throws` at :30).
    - `Store` renders with `@SubclassOptInRequired(DelicateStoreApi::class)`
      (`store6-core/src/commonMain/kotlin/org/mobilenativefoundation/store6/core/Store.kt:16-17`), and
      every seam type renders with `@ExperimentalStoreApi` — all three markers are `@MustBeDocumented`
      (`Annotations.kt:21-22,43-44,63-64`), so Dokka includes them in signatures.
- **Planned admonition (stability tier), delivered upstream** — the module-level framing that
  `store6-core` is stable-track but not frozen until the beta01 freeze candidate, and that the
  `core.seam` package (13 files, all `@ExperimentalStoreApi`) is a freeze candidate rather than frozen
  (`STABILITY.md:47`, `STABILITY.md:57-68`; seam file count verified — 13 files in
  `store6-core/src/commonMain/kotlin/org/mobilenativefoundation/store6/core/seam/`). Because the
  reference is generated output, this text belongs in Repo A Dokka module documentation (a module-docs
  file wired via `dokkaSourceSets` `includes`), never hand-patched into `public/reference/`. See
  "Repo A coordination notes" below.
- **QA gates before copying output into `public/reference/store6-core/`**
  - Grep the generated HTML for `data-unresolved-link` and require zero hits — Dokka 1.9.20 does not
    reliably surface unresolved KDoc links in its build log, and the site guard already treats that marker
    as a failure vocabulary (`test-t6b-reference.mjs:479`); extend the same zero-marker requirement to the
    generated tree.
  - No issue-tracker or internal process vocabulary anywhere in served HTML — the guard bans tracker
    context patterns outright (`test-t6b-reference.mjs:474-478`), and Repo A's documentation discipline
    bans internal organizational context on published surfaces (`AGENTS.md:33-43`).
  - Confirm the output root contains `index.html` so `/reference/store6-core/index.html` keeps returning
    200 with no redirect (zero-redirect parity; `test-t6b-reference.mjs:494-495` separately forbids a
    `redirects()` block in `next.config.mjs`).
- **Site harness updates shipped in the same change**
  - `test-t6b-reference.mjs`: retire the exact-two-file census (:29, :362-364), the placeholder body-text
    assertions (:454-459), and the frozen stylesheet/anchor manifests (:31-117); keep (or port) the
    link-safety, no-script, no-tracker-context, and no-redirect assertions against the generated tree.
  - `t8-verification.mjs`: the `public/reference` `.html` census (:181-191) currently equals exactly the
    two placeholder files and must be redefined for a multi-file generated tree; the two
    `FIXED_EXTRA_SOURCES` entries (:28-35) remain valid because the entry URLs do not move.
  - `lib/nav.ts:25` needs no change: the Reference nav item already targets this page's exact URL.
- **Cross-links**
  - Sibling: `/reference/store6-mutations/index.html` (kept — required by the guard's module-links
    manifest today, and by reader need after the swap).
  - Back to guides: `/docs`, `/docs/store6/overview` (kept from placeholder chrome; after the swap this
    is the "guides vs reference" escape hatch).
  - Planned prose pages that will deep-link here once real output exists: `/docs/store6/concepts/api-tiers`
    (opt-in markers), `/docs/store6/guides/extending` (seam types), `/docs/store6/concepts/read-contract`
    (Store members), `/docs/store6/stability` (tier table).

### Repo A coordination notes (edits happen upstream, never in `public/reference/`)

- Wire Dokka module documentation (`includes.from(...)`) in the convention plugin or per-module build so
  the generated module page opens with the tier statement (stable-track, not frozen until the beta01
  freeze candidate; seam = freeze candidate) instead of a bare package list. `configureDokka` currently
  sets no `includes` (`KotlinMultiplatformConventionPlugin.kt:213-218`).
- Decide the versioning line the generated reference states. Both modules build as `6.0.0-SNAPSHOT`
  (`store6-core/gradle.properties:1`); nothing is published yet (`README.md:15`), and the reference must
  not imply installable coordinates before the alpha01 release.

---

## /reference/store6-mutations/index.html

- **Title:** store6-mutations API reference
- **Disposition:** revise
- **Audience:** Mutations users needing symbol-level docs
- **Purpose:** The mutations twin of the core placeholder, carrying the same replacement contract
  (`:store6-mutations:dokkaHtml` → `public/reference/store6-mutations/`). Revise by executing it,
  experimental banner intact; cross-links to core and back to the guides stay.
- **Sources:** `store-docs/public/reference/store6-mutations/index.html`,
  `store-docs/scripts/test-t6b-reference.mjs`

### Interim state (today's placeholder — keep byte-stable until the swap)

- **Header chrome** (no heading)
  - Identical to the core placeholder: brand → `/docs`, "Docs home" → `/docs`, "Store 6 overview" →
    `/docs/store6/overview`, skip link. The two placeholder files differ only in title/H1,
    `aria-current` placement, and nothing else load-bearing (verified by side-by-side read; the guard
    enforces the shared frozen stylesheet and anchor manifests on both, `test-t6b-reference.mjs:432-452`).
- **H1: Store 6 Mutations API reference unavailable** (eyebrow "Reference")
  - Same two-sentence lede as core, guard-asserted (`test-t6b-reference.mjs:454-455`).
- **H2: Build status**
  - Same Android SDK statement as core (placeholder :139-143). Accurate for this module too:
    `store6-mutations/build.gradle.kts:2` applies the same convention plugin, so its Dokka task graph also
    resolves Android variants.
- **H2: Future replacement contract**
  - Same contract paragraph and the same two contract grids as the core page; this page's own row is:
    task `:store6-mutations:dokkaHtml`, output `store6-mutations/build/dokka/html/`, destination
    `public/reference/store6-mutations/` (placeholder :158-163; guard asserts the strings at
    `test-t6b-reference.mjs:457-459`).
- **Module links nav** (no heading)
  - "Core module" → `/reference/store6-core/index.html`; "Mutations module" carries
    `aria-current="page"` (placeholder :166-171).
- **Footer**
  - "Use the Store 6 overview for the current public guides and examples." (placeholder :173).

### Revision: execute the replacement contract

- **Generate** — run `:store6-mutations:dokkaHtml` in a Repo A checkout with a valid Android SDK; the
  task exists on main via the shared convention plugin (`Store6Conventions.kt:35`).
- **Expected generated structure** (Dokka-owned)
  - Module index listing exactly two packages: `org.mobilenativefoundation.store6.mutations` and
    `org.mobilenativefoundation.store6.mutations.storage` — the only packages in the committed klib dump
    (`store6-mutations/api/store6-mutations.klib.api`).
  - Every public declaration renders with `@ExperimentalStoreApi`: the artifact's tier row states every
    public symbol carries the marker (`STABILITY.md:52`), and the marker is `@MustBeDocumented`
    (`store6-core/.../Annotations.kt:21-22`), so the experimental status is visible on each generated
    symbol page without hand-authored chrome.
  - Checkable contract-bearing KDoc the generated pages will show:
    - `mutationStore(...)` documents `@throws IllegalArgumentException if valueCodecVersion is not
      positive, or if configure installs no fetcher door`
      (`store6-mutations/src/commonMain/kotlin/org/mobilenativefoundation/store6/mutations/MutationStore.kt:492`,
      `@throws` at :488-489, `require(valueCodecVersion >= 1)` at :500-502).
    - `MutationStore` KDoc states the facade deliberately withholds the raw engine write handle and that
      `runtime()` on it returns `null` (`MutationStore.kt:46-47`; class at :60).
    - `MutationJournalStorage` and `MutationJournalTransaction` render with
      `@SubclassOptInRequired(DelicateStoreApi::class)` — implementing journal storage is a deliberate
      opt-in (`store6-mutations/src/commonMain/kotlin/org/mobilenativefoundation/store6/mutations/storage/MutationJournalStorage.kt:26,34`).
- **Planned admonition (experimental banner), delivered upstream** — module-level documentation stating
  the tier plainly: experimental, in its own artifact, every public symbol `@ExperimentalStoreApi`; first
  graduation review at 6.1 with a target window of roughly 6.3, gated on criteria rather than dates
  (`STABILITY.md:143-151`); shapes can change in any release and no mutations signature is frozen into
  policy prose (`STABILITY.md:172-179`). As with core, this text lives in Repo A Dokka module docs, not
  hand-patched HTML — generated output is never edited in place.
  - The banner must not soften the write-path consequence documented up front in Repo A: the
    non-transactional ack path adopts the server echo first and retires the journal row last, so a crash
    inside the ack window can re-send the same push — server endpoints must be idempotent or keyed by
    mutation identity (`STABILITY.md:154-170`, `README.md:17-26`).
- **QA gates before copying output into `public/reference/store6-mutations/`**
  - Zero `data-unresolved-link` hits in the generated HTML (same rationale and marker vocabulary as core;
    `test-t6b-reference.mjs:479`).
  - No issue-tracker/internal-process vocabulary in served HTML (`test-t6b-reference.mjs:474-478`;
    `AGENTS.md:33-43`).
  - Output root contains `index.html` so `/reference/store6-mutations/index.html` keeps returning 200
    with no redirect.
- **Site harness updates** — same set as the core page (shared guard scripts cover both modules in one
  pass): retire the two-file census and placeholder-text assertions in `test-t6b-reference.mjs`, redefine
  the `public/reference` census in `t8-verification.mjs`, leave `FIXED_EXTRA_SOURCES` URLs unchanged.
- **Cross-links**
  - Sibling: `/reference/store6-core/index.html` (kept — the mutations surface delegates to and extends
    core types such as `Store`, `StoreKey`, `Freshness`, and `StoreResult`, so readers need the core
    reference one hop away).
  - Back to guides: `/docs`, `/docs/store6/overview` (kept from placeholder chrome).
  - Planned prose pages that will deep-link here once real output exists: `/docs/store6/mutations`
    (write-path concept), `/docs/store6/mutations/quickstart` (factory inputs),
    `/docs/store6/mutations/journal-storage` (storage seam), `/docs/store6/mutations/server`
    (`MutationServer` protocol types), `/docs/store6/stability` (tier and ack posture).

### Repo A coordination notes (edits happen upstream, never in `public/reference/`)

- Same module-docs wiring as core, with the experimental banner content above.
- KDoc link hygiene sweep before the first published generation: the module's KDoc cross-references core
  types heavily (e.g., `[Store]`, `[SourceOfTruth]`, `[Bookkeeper]` in `MutationStore.kt`), and
  cross-module references are exactly the class of links Dokka 1.9.20 can leave unresolved without a
  loud build failure — hence the `data-unresolved-link` grep gate rather than trust in the log.


<!-- ================================================================ -->

# Section outlines — Store 5 — Legacy documentation (frozen) (`store5-legacy`)

# Section: Store 5 — Legacy documentation (frozen) (`store5-legacy`)

Every page in this section is `keep-frozen`: the outline below records the page's current
structure as it exists in Repo B today, plus a disposition rationale. No page in this section is
edited, redesigned, moved, or redirected. Successor linkage is carried by the Store 6 pages
(above all `/docs/store6/migration/component-map`), never by modifying these files. All 30 routes
must keep serving HTTP 200 at their exact paths (zero-redirect route parity).

Anchor convention: Repo B (docs site) anchors are prefixed `store-docs/`; bare paths are Repo A
(library) anchors. All anchors below were verified by reading the files.

---

## /docs/concepts/store5/overview

- **Title:** Store 5 concepts overview
- **Disposition:** keep-frozen
- **Audience:** Store 5 users (legacy)
- **Purpose:** Index of the eight Store 5 foundation components. Frozen; successors are
  /docs/store6/overview and /docs/store6/migration/component-map.
- **Sources:** store-docs/content/docs/concepts/store5/overview.mdx

### Current content structure (frozen)

- Frontmatter: title "Store foundations" (store-docs/content/docs/concepts/store5/overview.mdx:2)
- Eight linked H2 entries, one per component, each with a one-line definition (overview.mdx:5-35):
  - **Store** — "Typed repository that mediates data flow between network, memory cache, and local storage" (overview.mdx:5-7)
  - **Mutable Store** — mutable typed repository supporting C/R/U/D for local and network resources (overview.mdx:9-11)
  - **Source of Truth** — single authoritative local data source; consistency and offline support (overview.mdx:13-15)
  - **Fetcher** — how data is fetched over the network (overview.mdx:17-19)
  - **Updater** — how local changes are pushed to the network (overview.mdx:21-23)
  - **Bookkeeper** — tracks metadata of local changes and records synchronization failures (overview.mdx:25-27)
  - **Validator** — custom logic deciding whether local data is still valid or needs refresh via the Fetcher (overview.mdx:29-31)
  - **Converter** — converts items between network, local database, and domain representations (overview.mdx:33-35)

### Disposition rationale

This page is the entry point of the Store 5 mental model — eight separately assembled interfaces —
and it stays byte-frozen as the reference index for existing Store 5 users, who remain supported:
`store5.*` and `store6.*` coordinates live side by side for the whole 6.x major (STABILITY.md:106).
The navigational job it does for Store 6 readers is already done by /docs/store6/overview
(Start-here list, read-resolution table, module matrix), and the component-by-component
translation belongs in /docs/store6/migration/component-map, not in edits here.

### Cross-links (carried by Store 6 pages, not by editing this page)

- /docs/store6/overview — plays the equivalent index role for Store 6
- /docs/store6/migration/component-map — maps each of these eight components to its Store 6 seat

---

## /docs/concepts/store5/store

- **Title:** Store (Store 5)
- **Disposition:** keep-frozen
- **Audience:** Store 5 users (legacy)
- **Purpose:** Store 5 core interface and RealStore internals. Frozen; successor is
  /docs/store6/concepts/read-contract.
- **Sources:** store-docs/content/docs/concepts/store5/store.mdx

### Current content structure (frozen)

- **H2 Purpose of Store** (store-docs/content/docs/concepts/store5/store.mdx:6)
  - Four bullets: Data Orchestration, Efficient Caching, Data Consistency, Flexible Validation (store.mdx:10-13)
- **H2 APIs > H3 Store** (store.mdx:15-27)
  - Code block shows `stream(request): Flow<StoreReadResponse>`, `suspend clear(key)`, `suspend clearAll()` (store.mdx:21-27). In the Repo A legacy source the interface is composed from `Read.Stream`, `Clear.Key`, and `Clear.All` (store/src/commonMain/kotlin/org/mobilenativefoundation/store/store5/Store.kt:34-37) — the page shows the flattened display shape.
  - H4 `stream`, H4 `clear`, H4 `clearAll` with ParamLists; Note callouts on both clear methods: they remove from memory cache and source of truth only, never the remote source (store.mdx:64-68, 84-88)
- **H2 Key Components** (store.mdx:90)
  - RealStore composed of five parts: FetcherController (dedup, response sharing), SourceOfTruthWithBarrier, Memory Cache, Converter, Validator (store.mdx:92-114)
- **H2 Data Flow** (store.mdx:116)
  - H3 Reading Data — five StepsGroup steps with Kotlin excerpts: memory-cache check with validator gate (store.mdx:128-139), decide data source / NoNewData short-circuit (store.mdx:172-177), SoT read (store.mdx:185-191), network fetch with the callout that FetcherController ensures only one network call per key (store.mdx:228-234), combine and emit (store.mdx:254-261)
  - H3 Writing Data — three steps: memCache put, `sourceOfTruth.write(key, converter.fromOutputToLocal(value))` (store.mdx:288), error handling
- **H2 Best Practices** — six bullets (memory config, error handling, consistency, network usage, monitoring, key structure) (store.mdx:307-314)

### Disposition rationale

This is the deepest Store 5 architecture reference on the site (RealStore internals,
FetcherController, SourceOfTruthWithBarrier), frozen because that machinery is Store 5-specific
and remains accurate for the supported Store 5 line. Its successor role is split: the read
contract, origin taxonomy, and resolution order are taught by /docs/store6/concepts/read-contract;
the Store 5→6 vocabulary translation (StoreReadResponse origins Cache/SourceOfTruth/Fetcher →
Origin MEMORY/SOT/FETCHER/OVERLAY) is component-map material.

### Cross-links (carried by Store 6 pages, not by editing this page)

- /docs/store6/concepts/read-contract — successor for stream/get semantics and origins
- /docs/store6/migration/component-map — Store row (interface + RealStore internals mapping)

---

## /docs/concepts/store5/mutable-store

- **Title:** MutableStore (Store 5)
- **Disposition:** keep-frozen
- **Audience:** Store 5 users (legacy)
- **Purpose:** Store 5 write API and conflict machinery. Frozen; successor is the
  /docs/store6/mutations subtree.
- **Sources:** store-docs/content/docs/concepts/store5/mutable-store.mdx

### Current content structure (frozen)

- Tip callout up top linking the CRUD guide pair, listing the supported operation matrix (Insert/Find/Observe/Update/Upsert/Delete) (store-docs/content/docs/concepts/store5/mutable-store.mdx:6-15)
- **H2 Purpose of Mutable Store** — four bullets: Data Mutations, Synchronization, Conflict Resolution (with Bookkeeper + Updater), Offline Support (mutable-store.mdx:19-22)
- **H2 APIs > H3 MutableStore** (mutable-store.mdx:26-44)
  - Code block: `stream`, `suspend write(request: StoreWriteRequest<Key, Output, Response>): StoreWriteResponse`, `clear`, `clearAll` (mutable-store.mdx:30-44). In Repo A legacy source, `MutableStore` is annotated `@ExperimentalStoreApi` and composes `Read.StreamWithConflictResolution`, `Write`, `Write.Stream`, and `Clear` interfaces (store/src/commonMain/kotlin/org/mobilenativefoundation/store/store5/MutableStore.kt:5-11)
  - H4s for each member; Note callouts: clear/clearAll only remove from the delegate Store, never the remote source (mutable-store.mdx:102-106, 122-126)
- **H2 Key Components** (mutable-store.mdx:128)
  - RealMutableStore's six parts: delegate RealStore for reads, Updater, Bookkeeper, per-key Write Request Queue (processed requests removed after successful sync, mutable-store.mdx:138), thread-safety machinery (global Mutex + per-key ThreadSafety + Lightswitch, mutable-store.mdx:140-146), conflict-resolution logic (mutable-store.mdx:148-152)
- **H2 Data Flow**
  - H3 Reading Data — `safeInitStore`, eager conflict resolution via `tryEagerlyResolveConflicts` before delegating to RealStore (mutable-store.mdx:158-197)
  - H3 Writing Data — five steps: queue the request, immediate local write, `tryUpdateServer`, success → `updateWriteRequestQueue` + `bookkeeper?.clear` / failure → `bookkeeper?.setLastFailedSync` (mutable-store.mdx:242-259), emit StoreWriteResponse

### Disposition rationale

Frozen as the authoritative description of Store 5's hand-assembled write path. Store 6 replaces
this whole machine with the journalled write path (mutationStore facade, typed mutator intents,
overlay projection, drain/ack), which needs its own concept teaching in /docs/store6/mutations
rather than a rewrite of this page; the Updater/Bookkeeper/write-queue → journal mapping is the
component map's hardest row and is called out there.

### Cross-links (carried by Store 6 pages, not by editing this page)

- /docs/store6/mutations — successor concept page for the write path
- /docs/store6/mutations/quickstart — worked replacement for write-request assembly
- /docs/store6/migration/component-map — MutableStore row

---

## /docs/concepts/store5/source-of-truth

- **Title:** SourceOfTruth (Store 5)
- **Disposition:** keep-frozen
- **Audience:** Store 5 users (legacy)
- **Purpose:** Store 5 persistence interface. Frozen; successor is /docs/store6/guides/persistence
  plus the adapter pages.
- **Sources:** store-docs/content/docs/concepts/store5/source-of-truth.mdx

### Current content structure (frozen)

- **H2 Purpose of the Source of Truth** — four bullets: Data Consistency, Offline Support, Synchronization, Observability (store-docs/content/docs/concepts/store5/source-of-truth.mdx:10-13)
- **H2 APIs > H3 SourceOfTruth** (source-of-truth.mdx:17-28)
  - Code block: `reader(key): Flow<Output?>`, `suspend write(key, value)`, `suspend delete(key)`, `suspend deleteAll()`; three type parameters Key/Local/Output. Matches Repo A legacy source (store/src/commonMain/kotlin/org/mobilenativefoundation/store/store5/SourceOfTruth.kt:49-83)
  - H4 `reader` (cold Flow of the domain model), H4 `write` with Note: used by RealStore to persist fetched data AND by MutableStore for optimistic local updates (source-of-truth.mdx:88-92), H4 `delete`, H4 `deleteAll`
- **H2 Data Flow**
  - H3 Writing Data from Fetcher to Source of Truth — three steps (fetch, write, notify readers) (source-of-truth.mdx:114-144)
  - H3 Reading Data from Source of Truth — three steps (StoreReadRequest.cached, reader invocation, emission) (source-of-truth.mdx:146-179)
- **H2 Handling Write and Read Synchronization** — SourceOfTruthWithBarrier; barriers via MutableStateFlow block reads during writes; versioned operations (source-of-truth.mdx:181-186)
- **H2 Best Practices** — observable storage, graceful exceptions, type conversion (source-of-truth.mdx:188-194)

### Disposition rationale

Frozen: the three-type-parameter contract (Key/Local/Output with a Converter in the loop) and the
barrier machinery are Store 5-specific. Store 6's persistence contract is the two-parameter seam
`SourceOfTruth` (@ExperimentalStoreApi, delicate to implement,
store6-core/src/commonMain/kotlin/org/mobilenativefoundation/store6/core/seam/SourceOfTruth.kt:45)
with reader-liveness, read-your-writes, and exception-atomicity obligations — taught in
/docs/store6/guides/persistence, with Room/SQLDelight adapters as the concrete paths.

### Cross-links (carried by Store 6 pages, not by editing this page)

- /docs/store6/guides/persistence — successor seam-contract page
- /docs/store6/room, /docs/store6/sqldelight — concrete adapter walkthroughs
- /docs/store6/migration/component-map — SourceOfTruth row

---

## /docs/concepts/store5/fetcher

- **Title:** Fetcher (Store 5)
- **Disposition:** keep-frozen
- **Audience:** Store 5 users (legacy)
- **Purpose:** Store 5 Fetcher and FetcherResult hierarchy with fallback chains. Frozen; successor
  is /docs/store6/guides/fetchers.
- **Sources:** store-docs/content/docs/concepts/store5/fetcher.mdx

### Current content structure (frozen)

- **H2 Purpose of the Fetcher** — four bullets: Data Retrieval, Error Handling, Multiple Responses (HTTP and WebSockets), Fallback Mechanisms (store-docs/content/docs/concepts/store5/fetcher.mdx:8-11)
- **H2 APIs > H3 Fetcher** (fetcher.mdx:15-25)
  - Code block: `name: String?`, `fallback: Fetcher?`, `operator fun invoke(key): Flow<FetcherResult<Network>>`. Matches Repo A legacy source (store/src/commonMain/kotlin/org/mobilenativefoundation/store/store5/Fetcher.kt:25-33)
- **H3 FetcherResult** (fetcher.mdx:70-199)
  - H4 Data (`value`, optional `origin` string); H4 Error with H5 Exception(Throwable), H5 Message(String), H5 Custom<E> (noted as useful for non-exception error objects, e.g. a union type from gRPC, fetcher.mdx:168). Hierarchy matches legacy source (store/src/commonMain/kotlin/org/mobilenativefoundation/store/store5/FetcherResult.kt:3-11)
- **H2 Data Flow** — six steps (fetcher.mdx:201-304)
  - Step 1 includes two Tip callouts with `get` and `fresh` extension functions built over `stream` (fetcher.mdx:209-235)
  - Step 2's Note callout: fresh-data requests bypass the memory cache, source of truth, and validator and invoke the Fetcher immediately (fetcher.mdx:241-257); nested steps for cache check and validation
  - Steps 3-6: fetching, error emission as FetcherResult.Error, storage into SoT + memory cache, delivery as StoreReadResponse

### Disposition rationale

Frozen as the reference for the Store 5 fetcher shape (Flow-returning invoke, string-typed error
message variants, chained fallbacks). Store 6's successor is a different contract — a suspend
`fetch(key, etag)` seam interface where conditional fetch is engine-driven
(store6-core/src/commonMain/kotlin/org/mobilenativefoundation/store6/core/seam/Fetcher.kt:20) and
the result vocabulary is Success/NotModified/Error/Deleted — so the translation (including where
fallback chains and streaming sources go) belongs in /docs/store6/guides/fetchers and the
component map, not in edits here.

### Cross-links (carried by Store 6 pages, not by editing this page)

- /docs/store6/guides/fetchers — successor (results, errors, conditional fetch, fallback story)
- /docs/store6/migration/component-map — Fetcher/FetcherResult row

---

## /docs/concepts/store5/updater

- **Title:** Updater (Store 5)
- **Disposition:** keep-frozen
- **Audience:** Store 5 users (legacy)
- **Purpose:** Store 5 outbound-sync component. Frozen; its job is absorbed by
  /docs/store6/mutations/server and /docs/store6/mutations/drain-and-restart, mapped explicitly in
  the component map (no standalone analog).
- **Sources:** store-docs/content/docs/concepts/store5/updater.mdx

### Current content structure (frozen)

- **H2 Purpose of the Updater** — two bullets: Data Mutation Synchronization, Completion Handling (store-docs/content/docs/concepts/store5/updater.mdx:10-11)
- **H2 APIs > H3 Updater** (updater.mdx:15-24)
  - Code block: `suspend post(key, value): UpdaterResult` and `onCompletion: OnUpdaterCompletion<Response>?`. Matches Repo A legacy source (store/src/commonMain/kotlin/org/mobilenativefoundation/store/store5/Updater.kt:9-21)
  - H4 `post`, H4 `onCompletion` with ParamLists
- **H2 Data Flow > H3 Writing Data and Synchronization** — six steps (updater.mdx:75-166):
  - local mutation via `mutableStore.write`, per-key queueing, delegate local write, `updater.post`
  - Success: queue pruned, Bookkeeper records cleared, `onCompletion` executed if provided (updater.mdx:132-141)
  - Failure: Bookkeeper records the failed attempt; the write request stays in the queue for future retries (updater.mdx:144-149)
  - StoreWriteResponse emission
- **H2 Best Practices** — handle results via `onCompletion`; provide a Bookkeeper so RealMutableStore can retry failed operations (updater.mdx:170-171)

### Disposition rationale

Frozen: `Updater.post` has no standalone Store 6 analog, so this page's job is absorbed rather
than replaced one-for-one. In Store 6 the outbound push is the app-owned MutationServer driven by
idempotent drain passes, and the ack ordering is materially different — the non-transactional
path adopts the server echo first and retires the journal row last, so servers must be idempotent
(STABILITY.md:156). That is exactly the kind of contrast the component map must state explicitly,
which is why this page stays untouched and the mapping lives there.

### Cross-links (carried by Store 6 pages, not by editing this page)

- /docs/store6/mutations/server — where `post`'s job now lives (MutationServer push/retire)
- /docs/store6/mutations/drain-and-restart — where retry/sync scheduling now lives
- /docs/store6/migration/component-map — Updater row (absorbed, no standalone analog)

---

## /docs/concepts/store5/bookkeeper

- **Title:** Bookkeeper (Store 5)
- **Disposition:** keep-frozen
- **Audience:** Store 5 users (legacy)
- **Purpose:** Store 5 failed-sync bookkeeping. Frozen; the component map explains how the
  mutations journal and inspection surfaces replace it — the least obvious mapping, called out
  there as distinct from Store 6's engine-owned freshness Bookkeeper.
- **Sources:** store-docs/content/docs/concepts/store5/bookkeeper.mdx

### Current content structure (frozen)

- **H2 Relevant Context** — Tip linking Google's Offline First guide; versioning via failed-sync timestamps; conflict-resolution strategies including last-write-wins (store-docs/content/docs/concepts/store5/bookkeeper.mdx:8-17)
- **H2 Purpose of the Bookkeeper** — three bullets: Tracking Failed Synchronizations, Conflict Resolution, Data Consistency (bookkeeper.mdx:21-23)
- **H2 APIs > H3 Bookkeeper** (bookkeeper.mdx:27-44)
  - Code block: `getLastFailedSync(key): Long?`, `setLastFailedSync(key, timestamp = now()): Boolean`, `clear(key)`, `clearAll()`. Matches Repo A legacy source (store/src/commonMain/kotlin/org/mobilenativefoundation/store/store5/Bookkeeper.kt:12-22)
- **H2 Data Flow** — four steps: local change, sync attempt via Updater, success clears records / failure records a timestamp, and conflict resolution on read: before serving data the Store checks the Bookkeeper for unsynced changes and attempts to resolve them first (bookkeeper.mdx:105-113)
- **H2 Implementing a Bookkeeper** — `Bookkeeper.by` factory skeleton (bookkeeper.mdx:121-141; factory in legacy source at store/src/commonMain/kotlin/org/mobilenativefoundation/store/store5/Bookkeeper.kt:26-30); H3 Example: the Trails app's SQLDelight-backed implementation (bookkeeper.mdx:147-191)
- **H2 Best Practices** — persistent storage for records; error handling (bookkeeper.mdx:195-196)

### Disposition rationale

Frozen, and flagged in the component map as the trickiest name collision in the migration: Store 6
also has a `Bookkeeper`, but it is the engine-owned durable *freshness* bookkeeping seam (monotone
sequence, stale marks, watermarks —
store6-core/src/commonMain/kotlin/org/mobilenativefoundation/store6/core/seam/Bookkeeper.kt:35),
not a failed-write ledger. The failed-sync job this page documents moves into the mutations
journal (durable intent/attempt/failure records behind `mutationStore(...)`,
store6-mutations/src/commonMain/kotlin/org/mobilenativefoundation/store6/mutations/MutationStore.kt:492)
and its inspection surfaces. Editing this page cannot carry that disambiguation; the map does.

### Cross-links (carried by Store 6 pages, not by editing this page)

- /docs/store6/mutations/journal-storage — where durable write records now live
- /docs/store6/mutations/inspection — pending/deadLetters as the failed-sync visibility successor
- /docs/store6/migration/component-map — Bookkeeper row (the "same name, different job" callout)

---

## /docs/concepts/store5/validator

- **Title:** Validator (Store 5)
- **Disposition:** keep-frozen
- **Audience:** Store 5 users (legacy)
- **Purpose:** Store 5 custom-freshness hook. Frozen; absorbed by native freshness policies
  (/docs/store6/concepts/freshness, important-defaults), noted in the component map.
- **Sources:** store-docs/content/docs/concepts/store5/validator.mdx

### Current content structure (frozen)

- Info callout: the Validator is optional; without one the Store defaults to considering cached data valid (store-docs/content/docs/concepts/store5/validator.mdx:6-10)
- **H2 Purpose of the Validator** — three bullets: Data Freshness, Optimizing Network Usage, Consistency Control (validator.mdx:14-16)
- **H2 APIs > H3 Validator** (validator.mdx:20-28)
  - Code block: single member `suspend isValid(item: Output): Boolean`. Matches Repo A legacy source (store/src/commonMain/kotlin/org/mobilenativefoundation/store/store5/Validator.kt:9-15)
- **H2 Data Flow** — four steps; Note callout: the Validator operates only on Source of Truth data and does not validate data coming directly from the network (validator.mdx:55-63); isValid=false triggers a Fetcher call (validator.mdx:73-77)
- **H2 Implementing a Validator** — `Validator.by` factory (validator.mdx:92-96); H3 Examples with H4 Time-Based Validation (expiry timestamp), H4 Versioning (model version check), H4 User Authentication (token expiry) (validator.mdx:100-128)
- **H2 Best Practices** — lightweight logic, no side effects, explicit validity criteria (validator.mdx:132-134)

### Disposition rationale

Frozen: the user-supplied validity hook is a Store 5 design. Store 6 absorbs the same needs into
native per-call freshness — the sealed `Freshness` policy set with CachedOrFetch as the default
(store6-core/src/commonMain/kotlin/org/mobilenativefoundation/store6/core/Freshness.kt:12) plus
durable invalidation — so there is no isValid hook to port. The Validator → freshness-policy
mapping (time-based validation → MaxAge; deliberate invalidation → invalidate) is stated in the
component map, and the behavior detail lives in /docs/store6/concepts/freshness and
/docs/store6/important-defaults.

### Cross-links (carried by Store 6 pages, not by editing this page)

- /docs/store6/concepts/freshness — successor for validity/refresh decisions
- /docs/store6/important-defaults — the zero-config freshness behavior table
- /docs/store6/invalidate-vs-clear — deliberate invalidation as the other half of the job
- /docs/store6/migration/component-map — Validator row

---

## /docs/concepts/store5/converter

- **Title:** Converter (Store 5)
- **Disposition:** keep-frozen
- **Audience:** Store 5 users (legacy)
- **Purpose:** Store 5 type-bridging component. Frozen; the type-boundary story lives inside
  /docs/store6/guides/fetchers and /docs/store6/guides/persistence (no converter seam exists),
  mapped in the component map.
- **Sources:** store-docs/content/docs/concepts/store5/converter.mdx

### Current content structure (frozen)

- **H2 Purpose of the Converter** — bridge between network, local database, and domain representations (store-docs/content/docs/concepts/store5/converter.mdx:6-8)
- **H2 APIs > H3 Converter** (converter.mdx:12-21)
  - Code block: `fromNetworkToLocal(network): Local` and `fromOutputToLocal(output): Local` over three type parameters Network/Local/Output. Matches Repo A legacy source (store/src/commonMain/kotlin/org/mobilenativefoundation/store/store5/Converter.kt:12-15); a `Converter.Builder` exists in source for lambda construction (Converter.kt:21)
  - H4 `fromNetworkToLocal`, H4 `fromOutputToLocal` with ParamLists
- No Data Flow, examples, or Best Practices sections — this is the shortest concept page (76 lines)

### Disposition rationale

Frozen: the Converter exists because Store 5 threads three type parameters (Network/Local/Output)
through one pipeline. Store 6 deliberately has no converter seam — the store operates on one value
type, and network/database mapping happens inside the user's fetcher and persistence callbacks
(seam SourceOfTruth,
store6-core/src/commonMain/kotlin/org/mobilenativefoundation/store6/core/seam/SourceOfTruth.kt:45).
"Where did my Converter go?" is a predictable migrator question, answered by the component map and
the two guides, not by rewriting this page.

### Cross-links (carried by Store 6 pages, not by editing this page)

- /docs/store6/guides/fetchers — network→value mapping lives in the fetcher
- /docs/store6/guides/persistence — value→row mapping lives in the SoT implementation
- /docs/store6/migration/component-map — Converter row (no seam exists; mapping relocated)

---

## /docs/use-cases/store5/overview

- **Title:** Store 5 use cases overview
- **Disposition:** keep-frozen
- **Audience:** Store 5 users (legacy)
- **Purpose:** Index of mostly never-authored stubs (with one dead link). Frozen as-is; Store 6
  guide discovery lives in the revised overview and the guides subtree.
- **Sources:** store-docs/content/docs/use-cases/store5/overview.mdx

### Current content structure (frozen)

- Frontmatter: title "Guides to common use cases" (store-docs/content/docs/use-cases/store5/overview.mdx:2)
- 17 linked H2 guide entries, each with a one-to-two-sentence teaser (overview.mdx:6-82): Handling CRUD Operations (the only authored destination pair), Offline-First with SqlDelight, Data Synchronization and Conflict Resolution, Error Handling and Retry Strategies, Authentication and Secure Data Access, Real-Time Data Updates, Handling Complex Data Relationships, Advanced Caching Strategies, Testing Store, Integration with Jetpack Compose and SwiftUI, Migration from Existing Data Layers, Security and Data Encryption, Working with Non-Paginated Lists (StoreMultiCache), Ensuring Data Integrity and Freshness (Validator), Redux-style State Management, Fallback Mechanisms, Pagination and Infinite Scrolling
- One non-linked H2 "Multiplatform Implementation" whose source-authored destination (/docs/use-cases/store5/multiplatform-integration) is rendered with an UnavailableDestination component marked status 404 (overview.mdx:42-50)

### Disposition rationale

Frozen exactly as ported, dead link included: the page is a faithful record of the Store 5 site,
where 15 of the 17 linked destinations were never written (each is a "Coming soon" stub) and one
destination never existed. Editing it to hide that would misrepresent the frozen tree, and
porting it forward would index nothing. Store 6 guide discovery is served by the revised
/docs/store6/overview and the guides subtree, which grow from real pages.

### Cross-links (carried by Store 6 pages, not by editing this page)

- /docs/store6/overview — the live guide-discovery surface for Store 6

---

## /docs/use-cases/store5/setting-up-store-for-crud-operations

- **Title:** Setting up Store for CRUD (Store 5)
- **Disposition:** keep-frozen
- **Audience:** Store 5 users (legacy)
- **Purpose:** Part 1 of the Store 5 CRUD walkthrough. Frozen; successors are
  /docs/store6/mutations/quickstart and /docs/store6/mutations/mutators.
- **Sources:** store-docs/content/docs/use-cases/store5/setting-up-store-for-crud-operations.mdx

### Current content structure (frozen)

- **H2 Introduction** — two-part guide building a CRUD Store for the Trails app; prerequisite callout (Quickstart + concepts); code lives in the Trails repository (store-docs/content/docs/use-cases/store5/setting-up-store-for-crud-operations.mdx:6-23)
- **H2 Defining the Data Model**
  - H3 Creating a Generalized `Model` Interface — `Model<K, P, E>` with nested `Key`, `Properties`, `Edges`, `Node`, `Composite` (setting-up-store-for-crud-operations.mdx:31-54)
  - H3 Implementing the `Model` Interface in `Post` — sealed `Post` with Key/Properties/Edges/Node/Composite variants; Note callout on which shape each operation carries (setting-up-store-for-crud-operations.mdx:63-118)
- **H2 Defining Operations**
  - H3 Creating the `Operation` Sealed Class — `Operation` split into `Query` and `Mutation` subtrees (setting-up-store-for-crud-operations.mdx:128-147)
  - H3 Defining `Create` Operations — InsertOne/InsertMany over Properties, `Nothing` for absent Keys (setting-up-store-for-crud-operations.mdx:155-175)
  - H3 Defining `Read` Operations — `DataSources(memory, disk, remote)` with presets all/localOnly/remoteOnly (setting-up-store-for-crud-operations.mdx:181-189); FindOne/FindMany/FindAll/ObserveOne/ObserveMany each carrying a DataSources (setting-up-store-for-crud-operations.mdx:201-233)
  - H3 Defining `Update` Operations — UpdateOne/UpdateMany over Nodes, UpsertOne/UpsertMany over Properties (setting-up-store-for-crud-operations.mdx:239-286)
  - H3 Defining `Delete` Operations — DeleteOne/DeleteMany/DeleteAll (setting-up-store-for-crud-operations.mdx:292-329)
- **H2 Defining Output Types** — sealed `Output` with `Single` and `Collection` (setting-up-store-for-crud-operations.mdx:337-349)
- **H2 Conclusion** — typealiases: `PostStore = MutableStore<PostOperation, Output>`; pointer to Part 2 (setting-up-store-for-crud-operations.mdx:355-367)

### Disposition rationale

Frozen: the Operation/Model algebra is a workaround pattern for Store 5's single-key MutableStore
— keys are made to *be* operations so one store can express queries and mutations. Store 6's
mutator registry makes write intents first-class (named, typed, durable), so porting this design
would teach an obsolete pattern. The successor pages show what the same CRUD surface looks like
when the library owns the write vocabulary.

### Cross-links (carried by Store 6 pages, not by editing this page)

- /docs/store6/mutations/quickstart — the end-to-end CRUD successor walkthrough
- /docs/store6/mutations/mutators — update/create/delete/upsert as registry shapes

---

## /docs/use-cases/store5/implementing-crud-operations-in-store

- **Title:** Implementing CRUD in Store (Store 5)
- **Disposition:** keep-frozen
- **Audience:** Store 5 users (legacy)
- **Purpose:** Part 2 of the CRUD walkthrough — the clearest showcase of the assembly burden
  Store 6 removes. Frozen; the mutations quickstart shows what the four hand-assembled components
  collapsed into.
- **Sources:** store-docs/content/docs/use-cases/store5/implementing-crud-operations-in-store.mdx

### Current content structure (frozen)

- **H2 Introduction** — second part of the pair; prerequisites; Trails repository note (store-docs/content/docs/use-cases/store5/implementing-crud-operations-in-store.mdx:6-23)
- **H2 Implementing the `Fetcher`** — `PostFetcherFactory` over `Fetcher.ofFlow`; `require(operation is Operation.Query)` because the Fetcher runs only on reads (implementing-crud-operations-in-store.mdx:29-33, 44); per-operation dispatch into find/observe helpers; Tip: ofFlow enables ObserveOne/ObserveMany (implementing-crud-operations-in-store.mdx:114-118)
- **H2 Implementing the `Source of Truth`**
  - H3 Defining the `Reader` (queries only) and H3 Defining the `Writer` — the Writer handles Query AND Mutation operations because the SoT is written on both reads and writes (implementing-crud-operations-in-store.mdx:152-156)
  - H3 Setting Up the Factory — `SourceOfTruth.of(reader, writer, delete, deleteAll)` (implementing-crud-operations-in-store.mdx:174-198)
  - H3 Implementing the `Reader` — Note: emit `null` instead of an empty list so the Store does not consider the operation fulfilled and triggers a network fetch (implementing-crud-operations-in-store.mdx:202-206); SQLDelight query dispatch per operation (implementing-crud-operations-in-store.mdx:208-314)
  - H3 Implementing the `Writer` — create/query/update/delete dispatch into postQueries (implementing-crud-operations-in-store.mdx:318-399)
- **H2 Implementing the `Updater`** — Note: the Updater is invoked on reads when conflicts might exist, so query operations must push the latest local value before pulling (implementing-crud-operations-in-store.mdx:411-415); full operation dispatch (implementing-crud-operations-in-store.mdx:417-490)
- **H2 Implementing the `Bookkeeper`** — Note: failed syncs are checked on reads and set on writes (implementing-crud-operations-in-store.mdx:494-498); SQLDelight-backed factory with per-operation dispatch (implementing-crud-operations-in-store.mdx:500-710)
- **H2 Conclusion** — `PostStoreFactory` assembling everything via `MutableStoreBuilder.from(fetcher, sourceOfTruth, converter).build(updater, bookkeeper)` (implementing-crud-operations-in-store.mdx:716-747); Note: the Converter is a pass-through here (implementing-crud-operations-in-store.mdx:749-753)

### Disposition rationale

Frozen precisely because of what it demonstrates: supporting CRUD in Store 5 requires
hand-implementing four components (Fetcher, SourceOfTruth reader+writer, Updater, Bookkeeper),
each dispatching over the full operation algebra, plus non-obvious coupling rules (Updater runs on
reads; Bookkeeper reads on reads, writes on writes; readers must emit null, not empty). This is
the strongest before/after exhibit the migration story has — the mutations quickstart's
`mutationStore(...)` factory
(store6-mutations/src/commonMain/kotlin/org/mobilenativefoundation/store6/mutations/MutationStore.kt:492)
replaces this entire file. It must stay frozen so the contrast stays honest.

### Cross-links (carried by Store 6 pages, not by editing this page)

- /docs/store6/mutations/quickstart — the collapsed successor
- /docs/store6/mutations/mutators — where per-operation dispatch became registry shapes
- /docs/store6/migration/from-store5 — cites this walkthrough as the before-state

---

## /docs/use-cases/store5/advanced-caching-strategies

- **Title:** Advanced caching strategies (stub)
- **Disposition:** keep-frozen
- **Audience:** None (URL preservation only)
- **Purpose:** Never-authored stub. Frozen; territory delivered by /docs/store6/important-defaults
  and /docs/store6/concepts/memory-and-lifecycle.
- **Sources:** store-docs/content/docs/use-cases/store5/advanced-caching-strategies.mdx

### Current content structure (frozen)

- Frontmatter only: title "Advanced Caching Strategies", description "Coming soon" (store-docs/content/docs/use-cases/store5/advanced-caching-strategies.mdx:1-4). Empty body.

### Disposition rationale

Never authored; kept only so the URL keeps serving 200. The territory the index promised (cache
policies, eviction, size management — store-docs/content/docs/use-cases/store5/overview.mdx:36) is
delivered natively by Store 6: bounded quiescent-engine residency via maxIdleKeys (default 128,
eviction semantically invisible —
store6-core/src/commonMain/kotlin/org/mobilenativefoundation/store6/core/StoreBuilder.kt:116) and
the named-defaults page (single-flight sharing, docs/store6/important-defaults.md:68).

### Cross-links (successor coverage)

- /docs/store6/important-defaults, /docs/store6/concepts/memory-and-lifecycle

---

## /docs/use-cases/store5/authentication-and-secure-data-access

- **Title:** Authentication and secure data access (stub)
- **Disposition:** keep-frozen
- **Audience:** None (URL preservation only)
- **Purpose:** Never-authored stub; auth integration is orthogonal to the Store core. Frozen, no
  successor planned.
- **Sources:** store-docs/content/docs/use-cases/store5/authentication-and-secure-data-access.mdx

### Current content structure (frozen)

- Frontmatter only: title "Authentication and Secure Data Access", description "Coming soon" (store-docs/content/docs/use-cases/store5/authentication-and-secure-data-access.mdx:1-4). Empty body.

### Disposition rationale

Never authored, and auth flows are orthogonal to the Store core surface in both major lines. The
index promised auth flows, token refresh, and secure access
(store-docs/content/docs/use-cases/store5/overview.mdx:24); the closest Store 5 material that ever
existed is the Validator page's token-expiry example
(store-docs/content/docs/concepts/store5/validator.mdx:125). A Store 6 auth guide would be
net-new editorial scope, not a migration obligation — none is planned.

### Cross-links (successor coverage)

- None planned. Adjacent: /docs/store6/concepts/freshness (freshness-driven refetch is where
  validity hooks went).

---

## /docs/use-cases/store5/data-synchronization-and-conflict-resolution

- **Title:** Data synchronization and conflict resolution (stub)
- **Disposition:** keep-frozen
- **Audience:** None (URL preservation only)
- **Purpose:** Never-authored stub for territory core to Store 6 mutations. Frozen; successors are
  /docs/store6/mutations/server, /docs/store6/mutations/conflicts, and
  /docs/store6/mutations/drain-and-restart.
- **Sources:** store-docs/content/docs/use-cases/store5/data-synchronization-and-conflict-resolution.mdx

### Current content structure (frozen)

- Frontmatter only: title "Data Synchronization and Conflict Resolution", description "Coming soon" (store-docs/content/docs/use-cases/store5/data-synchronization-and-conflict-resolution.mdx:1-4). Empty body.

### Disposition rationale

Store 5 promised this guide and never shipped it, even though sync/conflict machinery
(Updater + Bookkeeper) was the MutableStore pitch. Store 6 treats this territory as core product
surface: the durable write path adopts the server echo first and retires the journal row last, so
a crash in the window can re-send a push and servers must be idempotent (STABILITY.md:156), and
pending writes surface on stream with origin OVERLAY while isStale is never set on an overlay
frame (STABILITY.md:189). The successor pages owe migrating MutableStore users the real guide
Store 5 never had.

### Cross-links (successor coverage)

- /docs/store6/mutations/server, /docs/store6/mutations/conflicts,
  /docs/store6/mutations/drain-and-restart

---

## /docs/use-cases/store5/ensuring-data-integrity-and-freshness

- **Title:** Ensuring data integrity and freshness (stub)
- **Disposition:** keep-frozen
- **Audience:** None (URL preservation only)
- **Purpose:** Never-authored stub. Frozen; delivered by /docs/store6/concepts/freshness and
  /docs/store6/invalidate-vs-clear.
- **Sources:** store-docs/content/docs/use-cases/store5/ensuring-data-integrity-and-freshness.mdx

### Current content structure (frozen)

- Frontmatter only: title "Ensuring Data Integrity and Freshness", description "Coming soon" (store-docs/content/docs/use-cases/store5/ensuring-data-integrity-and-freshness.mdx:1-4). Empty body.

### Disposition rationale

The index promised Validator-based freshness checks
(store-docs/content/docs/use-cases/store5/overview.mdx:70). In Store 6 that need is native: each
read is planned by a per-call sealed Freshness policy
(store6-core/src/commonMain/kotlin/org/mobilenativefoundation/store6/core/Freshness.kt:12) and
deliberate staleness is the invalidate operation — invalidate marks stale while the value keeps
serving and refreshes; clear removes (docs/store6/invalidate-vs-clear.md:9). Nothing existed here
to port; the successor pages carry the territory.

### Cross-links (successor coverage)

- /docs/store6/concepts/freshness, /docs/store6/invalidate-vs-clear

---

## /docs/use-cases/store5/error-handling-and-retry-strategies

- **Title:** Error handling and retry strategies (stub)
- **Disposition:** keep-frozen
- **Audience:** None (URL preservation only)
- **Purpose:** Never-authored stub. Frozen; successor is /docs/store6/concepts/errors (typed
  failures, servedStale rendering, retry-in-fetcher).
- **Sources:** store-docs/content/docs/use-cases/store5/error-handling-and-retry-strategies.mdx

### Current content structure (frozen)

- Frontmatter only: title "Error Handling and Retry Strategies", description "Coming soon" (store-docs/content/docs/use-cases/store5/error-handling-and-retry-strategies.mdx:1-4). Empty body.

### Disposition rationale

Never authored. Store 6's failure story is substantive and different enough to need its own page:
structured failures are a sealed StoreError whose messages state what was attempted, for which
key, and the likely fix
(store6-core/src/commonMain/kotlin/org/mobilenativefoundation/store6/core/StoreError.kt:10), and
the engine performs zero retries — one demand cycle invokes the fetcher exactly once and retry
policy belongs in the user's fetcher (docs/store6/important-defaults.md:38). The successor errors
page owes readers both halves (typed failures on stream/get; retry ownership).

### Cross-links (successor coverage)

- /docs/store6/concepts/errors; adjacent: /docs/store6/guides/fetchers (retry-in-fetcher recipes)

---

## /docs/use-cases/store5/handling-complex-data-relationships

- **Title:** Handling complex data relationships (stub)
- **Disposition:** keep-frozen
- **Audience:** None (URL preservation only)
- **Purpose:** Never-authored stub. Frozen; adjacent territory covered by /docs/store6/key-design;
  deeper work is net-new editorial scope, not a migration obligation.
- **Sources:** store-docs/content/docs/use-cases/store5/handling-complex-data-relationships.mdx

### Current content structure (frozen)

- Frontmatter only: title "Handling Complex Data Relationships", description "Coming soon" (store-docs/content/docs/use-cases/store5/handling-complex-data-relationships.mdx:1-4). Empty body.

### Disposition rationale

The index promised nested/relational data guidance — comments, ratings, profiles
(store-docs/content/docs/use-cases/store5/overview.mdx:32) — but nothing was written. Store 6's
adjacent published guidance is key design: canonicalId is identity and namespace is the
bulk-operation unit, and modeling related records is largely a keys-and-namespaces question
(docs/store6/key-design.md:9). Anything deeper (entity graphs, normalization) would be a new
editorial decision on the Store 6 side, not a port.

### Cross-links (successor coverage)

- /docs/store6/key-design

---

## /docs/use-cases/store5/implementing-fallback-mechanisms-to-enhance-resilience

- **Title:** Fallback mechanisms (stub)
- **Disposition:** keep-frozen
- **Audience:** None (URL preservation only)
- **Purpose:** Never-authored stub. Frozen; the fallback story lives inside
  /docs/store6/guides/fetchers.
- **Sources:** store-docs/content/docs/use-cases/store5/implementing-fallback-mechanisms-to-enhance-resilience.mdx

### Current content structure (frozen)

- Frontmatter only: title "Implementing Fallback Mechanisms to Enhance Resilience", description "Coming soon" (store-docs/content/docs/use-cases/store5/implementing-fallback-mechanisms-to-enhance-resilience.mdx:1-4). Empty body.

### Disposition rationale

Fallback is a real Store 5 Fetcher capability — the interface carries an optional `fallback`
Fetcher consulted when the primary fails
(store/src/commonMain/kotlin/org/mobilenativefoundation/store/store5/Fetcher.kt:28) and the index
promised primary/secondary chains (store-docs/content/docs/use-cases/store5/overview.mdx:78) —
but the guide was never written. In Store 6 there is no fallback field on the seam fetcher, so the
composition pattern (fallback inside your fetch function) belongs in the fetchers guide, not a
standalone page.

### Cross-links (successor coverage)

- /docs/store6/guides/fetchers

---

## /docs/use-cases/store5/integrating-store-with-state-management-libraries-like-redux

- **Title:** Store with Redux-style state management (stub)
- **Disposition:** keep-frozen
- **Audience:** None (URL preservation only)
- **Purpose:** Never-authored, niche stub. Frozen; reactive consumption is covered by
  /docs/store6/concepts/read-contract and /docs/store6/compose; no successor planned.
- **Sources:** store-docs/content/docs/use-cases/store5/integrating-store-with-state-management-libraries-like-redux.mdx

### Current content structure (frozen)

- Frontmatter only: title "Integrating Store with State Management Libraries Like Redux", description "Coming soon" (store-docs/content/docs/use-cases/store5/integrating-store-with-state-management-libraries-like-redux.mdx:1-4). Empty body.

### Disposition rationale

Never authored and niche. The underlying need — feeding a unidirectional state container from
Store — reduces to consuming the stream door of the Store interface
(store6-core/src/commonMain/kotlin/org/mobilenativefoundation/store6/core/Store.kt:17), and the
one framework integration Store 6 ships is Compose (`collectAsState` over Store.stream,
store6-compose/src/commonMain/kotlin/org/mobilenativefoundation/store6/compose/CollectAsState.kt:33).
No Redux-specific successor is planned.

### Cross-links (successor coverage)

- /docs/store6/concepts/read-contract, /docs/store6/compose

---

## /docs/use-cases/store5/integration-with-jetpack-compose-and-swift-ui

- **Title:** Compose and SwiftUI integration (stub)
- **Disposition:** keep-frozen
- **Audience:** None (URL preservation only)
- **Purpose:** Never-authored stub. Frozen; the Compose half is delivered by /docs/store6/compose
  and the Swift surface by /docs/store6/guides/swift.
- **Sources:** store-docs/content/docs/use-cases/store5/integration-with-jetpack-compose-and-swift-ui.mdx

### Current content structure (frozen)

- Frontmatter only: title "Integration with Jetpack Compose and SwiftUI", description "Coming soon" (store-docs/content/docs/use-cases/store5/integration-with-jetpack-compose-and-swift-ui.mdx:1-4). Empty body.

### Disposition rationale

The index promised reactive UI integration for both frameworks
(store-docs/content/docs/use-cases/store5/overview.mdx:54); neither half was written for Store 5.
Store 6 ships the Compose half as a real artifact —
`Store<K,V>.collectAsState(key, freshness)` with a CachedOrFetch default
(store6-compose/src/commonMain/kotlin/org/mobilenativefoundation/store6/compose/CollectAsState.kt:33)
— synced onto /docs/store6/compose, and the Swift-facing story is planned as
/docs/store6/guides/swift. Nothing to port; the stub stays for the URL.

### Cross-links (successor coverage)

- /docs/store6/compose, /docs/store6/guides/swift

---

## /docs/use-cases/store5/migrating-from-existing-data-layers

- **Title:** Migrating from existing data layers (stub)
- **Disposition:** keep-frozen
- **Audience:** None (URL preservation only)
- **Purpose:** Never-authored stub for the site's most in-demand missing page. Frozen; successor
  is the /docs/store6/migration subtree — the highest-priority successor page set in this plan.
- **Sources:** store-docs/content/docs/use-cases/store5/migrating-from-existing-data-layers.mdx

### Current content structure (frozen)

- Frontmatter only: title "Migrating from Existing Data Layers", description "Coming soon" (store-docs/content/docs/use-cases/store5/migrating-from-existing-data-layers.mdx:1-4). Empty body.

### Disposition rationale

Store 5 promised a migration guide and never delivered one; Store 6's stability policy makes the
successors binding rather than aspirational: `store5.*` and `store6.*` coordinates live side by
side for the whole 6.x major with no flag day (STABILITY.md:106), `store6-store5-interop` is
supported for all of 6.x, and the 5→6 and 4→6 migration guides are launch gates for 6.0.0
(STABILITY.md:109). This stub is the strongest single argument for prioritizing the
/docs/store6/migration subtree.

### Cross-links (successor coverage)

- /docs/store6/migration/from-store5, /docs/store6/migration/component-map,
  /docs/store6/migration/from-store4

---

## /docs/use-cases/store5/offline-first-data-access-with-store-and-sql-delight

- **Title:** Offline-first with SQLDelight (stub)
- **Disposition:** keep-frozen
- **Audience:** None (URL preservation only)
- **Purpose:** Never-authored stub. Frozen; delivered by /docs/store6/sqldelight and, for durable
  writes, /docs/store6/mutations/journal-storage.
- **Sources:** store-docs/content/docs/use-cases/store5/offline-first-data-access-with-store-and-sql-delight.mdx

### Current content structure (frozen)

- Frontmatter only: title "Offline-First Data Access with Store and SqlDelight", description "Coming soon" (store-docs/content/docs/use-cases/store5/offline-first-data-access-with-store-and-sql-delight.mdx:1-4). Empty body.

### Disposition rationale

The promised walkthrough exists on the Store 6 side as a real, measured page: the
store6-sqldelight adapter README delivers a 15-minute existing-schema walkthrough
(store6-sqldelight/README.md:7), synced onto /docs/store6/sqldelight. The durable-writes half of
"offline-first" (queueing writes across process death) belongs to the mutations family created via
`mutationStore(...)`
(store6-mutations/src/commonMain/kotlin/org/mobilenativefoundation/store6/mutations/MutationStore.kt:492),
documented in the journal-storage page.

### Cross-links (successor coverage)

- /docs/store6/sqldelight, /docs/store6/mutations/journal-storage

---

## /docs/use-cases/store5/pagination-and-infinite-scrolling

- **Title:** Pagination and infinite scrolling (stub)
- **Disposition:** keep-frozen
- **Audience:** None (URL preservation only)
- **Purpose:** Never-authored stub. Frozen; a Store 6 paging story is a roadmap-scoped feature
  (store6-paging-androidx tracks to 6.0.0), documented when the artifact ships — not a doc port.
- **Sources:** store-docs/content/docs/use-cases/store5/pagination-and-infinite-scrolling.mdx

### Current content structure (frozen)

- Frontmatter only: title "Pagination and Infinite Scrolling", description "Coming soon" (store-docs/content/docs/use-cases/store5/pagination-and-infinite-scrolling.mdx:1-4). Empty body.

### Disposition rationale

Never authored (index teaser at store-docs/content/docs/use-cases/store5/overview.mdx:82). On the
Store 6 side, paging is an artifact decision, not a documentation gap: `store6-paging-androidx`
is promised but not in the alpha01 line, tracking to 6.0.0 (STABILITY.md:70). Its documentation
ships when the artifact does; nothing exists here to carry forward.

### Cross-links (successor coverage)

- /docs/store6/roadmap — where the paging artifact's target is stated

---

## /docs/use-cases/store5/real-time-data-updates

- **Title:** Real-time data updates (stub)
- **Disposition:** keep-frozen
- **Audience:** None (URL preservation only)
- **Purpose:** Never-authored stub. Frozen; streaming-source patterns belong in
  /docs/store6/guides/fetchers; no dedicated successor planned.
- **Sources:** store-docs/content/docs/use-cases/store5/real-time-data-updates.mdx

### Current content structure (frozen)

- Frontmatter only: title "Real-Time Data Updates", description "Coming soon" (store-docs/content/docs/use-cases/store5/real-time-data-updates.mdx:1-4). Empty body.

### Disposition rationale

The index promised WebSocket/SSE patterns (store-docs/content/docs/use-cases/store5/overview.mdx:28),
and Store 5's Fetcher genuinely supports multi-emission sources — `invoke(key)` returns
`Flow<FetcherResult<Network>>`
(store/src/commonMain/kotlin/org/mobilenativefoundation/store/store5/Fetcher.kt:33) — but the
guide was never written. Store 6's seam fetcher is single-result (`suspend fetch`), so streaming
sources are a pattern question for the fetchers guide rather than a page of their own.

### Cross-links (successor coverage)

- /docs/store6/guides/fetchers

---

## /docs/use-cases/store5/security-and-data-encryption

- **Title:** Security and data encryption (stub)
- **Disposition:** keep-frozen
- **Audience:** None (URL preservation only)
- **Purpose:** Never-authored stub; encryption lives in the persistence implementation the user
  brings. Frozen, no successor planned.
- **Sources:** store-docs/content/docs/use-cases/store5/security-and-data-encryption.mdx

### Current content structure (frozen)

- Frontmatter only: title "Security and Data Encryption", description "Coming soon" (store-docs/content/docs/use-cases/store5/security-and-data-encryption.mdx:1-4). Empty body.

### Disposition rationale

The index promised local-data encryption and compliance practices
(store-docs/content/docs/use-cases/store5/overview.mdx:62). In both major lines, Store does not
own storage bytes — in Store 6 persistence is a user-implemented seam contract
(store6-core/src/commonMain/kotlin/org/mobilenativefoundation/store6/core/seam/SourceOfTruth.kt:45),
so encryption is a property of the SourceOfTruth implementation the user brings, not a Store
feature to document. No successor planned.

### Cross-links (successor coverage)

- None planned. Adjacent: /docs/store6/guides/persistence.

---

## /docs/use-cases/store5/testing-store-and-its-components

- **Title:** Testing Store and its components (stub)
- **Disposition:** keep-frozen
- **Audience:** None (URL preservation only)
- **Purpose:** Never-authored stub. Frozen; delivered concretely by /docs/store6/guides/testing
  over the real store6-testing artifact this stub never had, plus /docs/store6/mutations/testing.
- **Sources:** store-docs/content/docs/use-cases/store5/testing-store-and-its-components.mdx

### Current content structure (frozen)

- Frontmatter only: title "Testing Store and Its Components", description "Coming soon" (store-docs/content/docs/use-cases/store5/testing-store-and-its-components.mdx:1-4). Empty body.

### Disposition rationale

Store 5 never had a testing artifact to document; the page stayed a stub. Store 6 does:
`store6-testing` is an Experimental artifact in the alpha01 line (STABILITY.md:48) shipping fakes
and certification suites — e.g. custom SourceOfTruth implementations extend
SourceOfTruthContractKit
(store6-testing/src/commonMain/kotlin/org/mobilenativefoundation/store6/testing/SourceOfTruthContractKit.kt:36).
The successor guides document a real surface rather than reviving a promise.

### Cross-links (successor coverage)

- /docs/store6/guides/testing, /docs/store6/mutations/testing

---

## /docs/use-cases/store5/working-with-non-paginated-lists

- **Title:** Non-paginated lists / StoreMultiCache (stub)
- **Disposition:** keep-frozen
- **Audience:** None (URL preservation only)
- **Purpose:** Never-authored stub around a Store 5-only API. Frozen; whether Store 6's
  projection/alias machinery serves list decomposition is a roadmap design question, not a doc
  port.
- **Sources:** store-docs/content/docs/use-cases/store5/working-with-non-paginated-lists.mdx

### Current content structure (frozen)

- Frontmatter only: title "Working with Non-Paginated Lists", description "Coming soon" (store-docs/content/docs/use-cases/store5/working-with-non-paginated-lists.mdx:1-4). Empty body.

### Disposition rationale

The index promised StoreMultiCache guidance — caching collections while decomposing them into
individually cached singles (store-docs/content/docs/use-cases/store5/overview.mdx:66).
StoreMultiCache is a real Store 5 API in the legacy cache module
(cache/src/commonMain/kotlin/org/mobilenativefoundation/store/cache5/StoreMultiCache.kt:15), but
the guide was never written and the API has no Store 6 counterpart today; whether list
decomposition becomes a Store 6 feature is a design question tracked on the roadmap, not
something this documentation plan invents.

### Cross-links (successor coverage)

- /docs/store6/roadmap; adjacent: /docs/store6/key-design (per-item keys within one namespace)

---

## /docs/best-practices/store5/overview

- **Title:** Store 5 best practices overview
- **Disposition:** keep-frozen
- **Audience:** Store 5 users (legacy)
- **Purpose:** One-link index for the frozen best-practices tree. Frozen; a Store 6
  best-practices grouping grows from real guides on its own terms.
- **Sources:** store-docs/content/docs/best-practices/store5/overview.mdx

### Current content structure (frozen)

- Frontmatter: title "Best practices" (store-docs/content/docs/best-practices/store5/overview.mdx:2)
- One linked H2 entry: "Single or Multiple Stores" with the one-liner "Deciding between single or multiple stores." (best-practices/store5/overview.mdx:5-7). Nothing else on the page.

### Disposition rationale

A one-link index has no content to migrate; it exists to keep the frozen tree navigable and its
URL serving 200. A Store 6 best-practices grouping should be indexed when it has more than one
real guide to hold — creating a parallel empty index now would repeat the Store 5 pattern of
navigation ahead of content.

### Cross-links (carried by Store 6 pages, not by editing this page)

- /docs/store6/overview — Store 6's current guide-discovery surface

---

## /docs/best-practices/store5/single-or-multiple-stores

- **Title:** Single or multiple Stores (Store 5)
- **Disposition:** keep-frozen
- **Audience:** Store 5 users (legacy); architecture readers
- **Purpose:** The one substantive, largely version-agnostic architecture guide, frozen in its
  Store 5 form (Trails example, mintcdn flowchart). Its transferable reasoning is carried forward
  with Store 6 idioms (namespaces, per-call freshness, typed failure isolation) inside
  /docs/store6/key-design and the migration guide rather than by editing this page.
- **Sources:** store-docs/content/docs/best-practices/store5/single-or-multiple-stores.mdx

### Current content structure (frozen)

- **H2 Introduction** — the decision framing plus prerequisites callout (store-docs/content/docs/best-practices/store5/single-or-multiple-stores.mdx:6-19)
- **H2 Real-World Example** — Trails Trail Detail page combining three endpoints (`trails/{trailId}`, `resorts/{resortId}/status/trails/{trailId}`, `weather/{resortId}`) into one `TrailDetail` domain model (single-or-multiple-stores.mdx:23-29)
- **H2 Decision Factors**
  - H3 Overview — five factors with intra-page anchor links: Data Coupling, Caching Strategies, Error Handling, Complexity of Data Merging, Scalability and Extensibility (single-or-multiple-stores.mdx:35-41)
  - H3 Data Coupling — tightly coupled vs independent; atomic vs independent updates (single-or-multiple-stores.mdx:43-61)
  - H3 Caching Strategies — unique vs shared caching/validation needs (single-or-multiple-stores.mdx:63-72)
  - H3 Complexity of Data Merging — repository-layer merge vs in-store encapsulation (single-or-multiple-stores.mdx:74-83)
  - H3 Error Handling — independent vs unified handling, masking risk (single-or-multiple-stores.mdx:85-94)
  - H3 Scalability and Extensibility — future data sources (single-or-multiple-stores.mdx:96-105)
- **H2 Making the Decision** — yes/no flowchart with usage callout; the image is externally hosted on mintcdn (single-or-multiple-stores.mdx:109-122)
- **H2 Trails App Decision** — multiple Stores chosen, with five stated reasons (independent update frequencies, differing caching needs, value of partial functionality, straightforward merging, likely expansion) (single-or-multiple-stores.mdx:124-132)
- **H2 Implementation Tips** — one Tip callout each for the multiple-store and single-store paths (single-or-multiple-stores.mdx:134-155)
- **H2 Conclusion** — no universally right answer (single-or-multiple-stores.mdx:157-159)

### Disposition rationale

The reasoning here (coupling, cache-policy divergence, failure isolation, merge complexity,
extensibility) transfers across major versions, but every concrete element is Store 5-bound: the
links, the component vocabulary, and the externally hosted mintcdn flowchart
(single-or-multiple-stores.mdx:122). Editing it in place would break the frozen-tree guarantee and
still leave Store 5 readers without their original guide. Instead, the Store 6 pages restate the
transferable questions in Store 6 idioms — one namespace per record type with splits for smaller
invalidation blast radius (docs/store6/key-design.md:82), per-call freshness instead of per-store
caching config, and typed failure isolation — inside /docs/store6/key-design and
/docs/store6/migration/from-store5.

### Cross-links (carried by Store 6 pages, not by editing this page)

- /docs/store6/key-design — namespaces as the store-partitioning lever
- /docs/store6/migration/from-store5 — carries the architecture-decision translation


---

# 6. Keeping the site synced with the code

# Store 6 docs-sync plan — keeping the site true to the code

Repo A (library): `/Users/matt/src/matt-ramotar/Store6`, main @ `a6a156e9`.
Repo B (docs site): `/Users/matt/src/matt-ramotar/store-docs`.

Ground truth verified for this plan:

- The sync pipeline is `scripts/sync-store6-docs.mjs` (lock-driven, transactional, one-way A→B). The lock is `evidence/T4-store6-source-lock.json` (schemaVersion 1, `revision` = pinned Repo A SHA, 10 `sources` entries with per-file sha256; `llms.txt` also pins `markdownLinkCount: 7`). Revision is enforced by `git -C <source-root> rev-parse HEAD` at `scripts/sync-store6-docs.mjs:205-209`; per-file sha256 at `:220-224`. Locked publication transforms are 1-based line-range replacements at `:141-190` (quickstart 133–136; STABILITY.md 206, 172–179, 162–163, 123–126; compose README 37–45; sqldelight README 121).
- The write transaction is `scripts/generated-output-transaction.mjs` (`reconcileOwnedOutputs` / `verifyOwnedOutputs`) over the multi-owner ledger `evidence/T4-owned-targets.json`; hand edits to generated files fail `verifyOwnedOutputs` in --check mode as `<path>: generated output differs` (generated-output-transaction.mjs:217) and census drift as `OWNED_CENSUS_MISMATCH` (:213); `OWNED_STALE_MODIFIED` (:56) applies only at reconcile time to a hand-modified target being dropped from an owner's set; cross-owner writes fail as `OWNED_TARGET_COLLISION`, claims of pre-existing unowned files as `OWNED_TARGET_UNCLAIMED`.
- The hand-authored overview is byte-pinned: `T3_OVERVIEW_SHA256` at `scripts/t4-contract.test.mjs:33`, asserted at `:834`.
- Route census + extras: `scripts/t8-verification.mjs` (`FIXED_EXTRA_SOURCES` at `:24`, Node pin via `assertPinnedNode` at `:713`); `evidence/T8-extras.txt`; zero-redirect assertion in `scripts/test-t6b-reference.mjs:495`.
- Search-count pin: `scripts/verify-search-index.mjs:42` (`rawResults.length === 54` for "fetcher"), re-pinned by `scripts/t5-search-contract.test.mjs`.
- Repo B has **no `.github/workflows/` directory and no `test` script in `package.json`** — every harness runs via `node` directly. All Repo B CI below is new.
- Repo A Dokka wiring is **already on main**: PR #33 merged as squash `0373381` ("build(store6): wire Dokka into the store6 convention plugin"), applying `org.jetbrains.dokka` in `tooling/plugins/src/main/kotlin/org/mobilenativefoundation/store/tooling/plugins/Store6Conventions.kt:35`, Dokka 1.9.20 (`gradle/libs.versions.toml:11`). The branch `claude/angry-cerf-10ee7d` (tip `1280804`) still exists locally and on origin but its content is merged; it is stale and deletable.
- Repo A CI: `.github/workflows/store6.yml` (name `Store6`, on push + pull_request) compiles and runs the quickstart on every PR (`./gradlew :store6-quickstart:run` at `store6.yml:62`), plus samples, extension probe, compose demo, mutations, census guards. `store6-full-jvm.yml` is the scheduled full mutations JVM suite. There is **no docs-sync guard in Repo A today**.
- Repo A discipline: `AGENTS.md` — protected technical content (`:23-31`), no internal organizational context in published surfaces (`:33-41`), evidence before claims (`:43-48`), three-pass review (`:58-66`). Repo A's tracked publishable narrative set: `README.md`, `STABILITY.md`, `ROADMAP.md`, `CONTRIBUTING.md`, `llms.txt`, `docs/store6/{quickstart,important-defaults,key-design,invalidate-vs-clear}.md`.
- Reference placeholders: `public/reference/store6-core/index.html` and `public/reference/store6-mutations/index.html` each state the replacement contract verbatim: "When the build environment provides a valid Android SDK location, generate each module and replace its placeholder directory with the complete Dokka output," with grids `[:store6-core:dokkaHtml → store6-core/build/dokka/html/ → public/reference/store6-core/]` and `[:store6-mutations:dokkaHtml → store6-mutations/build/dokka/html/ → public/reference/store6-mutations/]`.

---

## 1. Ownership model

Three classes. Every page on the site is in exactly one, recorded structurally (sync lock, claims ledger, or owned-targets ledger) — never by convention alone.

**Class S — sync-owned (Repo A is the source of truth).** The page is the publication of a file Repo A already maintains for its own readers: a `docs/store6/*.md` guide, a module README, or a root policy doc. Content changes happen in Repo A under `AGENTS.md` discipline and reach the site only through a lock re-pin. Owner in `evidence/T4-owned-targets.json`: `sync-store6-docs`.

**Class H — hand-authored site pages.** Site-specific composition: entry points, concepts, guides, mutations subtree, migration. Authored in Repo B, but every normative claim about library behavior must be registered in the claims ledger (§5) with a Repo A code anchor, and every compiled snippet must pass the snippet check (§6). The overview keeps its existing byte-pin in addition.

**Class G — generated surfaces.** `public/llms.txt` (lock entry, owner `sync-store6-docs`) and the two `public/reference/store6-*/` Dokka trees (§4). Never hand-edited; regenerated only.

**The rule for choosing a class for a NEW page:** if every normative sentence of the page has a single natural authority file that Repo A maintains anyway (module README, policy doc, repo guide), the page is Class S — author or extend the file in Repo A and add a lock entry. Otherwise the page is Class H — Repo A is not asked to host site pedagogy, and the claims ledger carries the truth link instead. Do **not** create new Repo A markdown solely to make a site page sync-owned; Repo A's tracked doc set is deliberately small and every Class S file makes future Repo A edits heavier (re-pin cost, line-anchor fragility).

**Classification of every NEW page in the approved IA:**

| Page | Class | Authority |
|---|---|---|
| `/docs/store6/room` | **S** (new lock entry) | `store6-room/README.md` — exists in Repo A, same shape as compose/sqldelight siblings |
| `/docs/store6/concepts/read-contract` | H | `store6-core/src/commonMain/.../Store.kt`, `StoreResult.kt`, `Origin.kt` via claims ledger |
| `/docs/store6/concepts/freshness` | H | `Freshness.kt`, `StoreMeta.kt`, `seam/FreshnessValidator.kt`, `docs/store6/important-defaults.md` |
| `/docs/store6/concepts/errors` | H | `StoreError.kt`, `StoreException.kt` |
| `/docs/store6/concepts/memory-and-lifecycle` | H | `StoreBuilder.kt`, `docs/store6/important-defaults.md` |
| `/docs/store6/concepts/api-tiers` | H | `Annotations.kt`, `STABILITY.md` |
| `/docs/store6/guides/fetchers` | H | `seam/Fetcher.kt`, `seam/FetcherResult.kt`, `StoreBuilder.kt` |
| `/docs/store6/guides/persistence` | H | `seam/SourceOfTruth.kt`, `seam/TransactionalSourceOfTruth.kt`, adapter READMEs, contract kit |
| `/docs/store6/guides/testing` | H | `store6-testing/` sources |
| `/docs/store6/guides/devtools` | H | `store6-devtools/README.md` + `EVENTS.md` (synthesizes two sources → not S) |
| `/docs/store6/guides/extending` | H | `store6-extension-probe/` sources, `seam/StoreRuntime.kt`, `seam/KeyEvents.kt` |
| `/docs/store6/guides/performance` | H | `store6-benchmarks/README.md`, `store6-devtools/README.md` |
| `/docs/store6/guides/swift` | H | `STABILITY.md`, `store6-core/api/swift/`, `StoreError.kt` |
| `/docs/store6/mutations` + 9 subpages | H | `store6-mutations/`, `store6-mutations-sqldelight/`, `store6-mutations-testing/` sources, `STABILITY.md`, `README.md` |
| `/docs/store6/migration/from-store5`, `/component-map`, `/from-store4` | H | `STABILITY.md`, `ROADMAP.md`, Store 6 sources; frozen Store 5 pages referenced read-only |
| Revised `/`, `/docs`, `/docs/store6/overview` | H (existing dispositions) | overview stays byte-pinned; `/` stays under `t7-static-hero.test.mjs` pins |
| `/reference/store6-core/`, `/reference/store6-mutations/` | **G** | Dokka output (§4) |

Only one lock addition falls out of the IA today (`store6-room/README.md`). When `store6-devtools` ships alpha02 and its README stabilizes as the single authority for an adapter-style page, the same S-promotion is available; until then devtools stays H.

## 2. Change detection

### 2a. Extending the source lock

Add the 11th entry to `evidence/T4-store6-source-lock.json`:

```json
{ "path": "store6-room/README.md", "sha256": "<computed>", "target": "content/docs/store6/room.mdx" }
```

`deriveStore6OwnedTargets` (`sync-store6-docs.mjs:72-77`) and the ledger transaction pick it up automatically; the same change must add the target to the `sync-store6-docs` owner array in `evidence/T4-owned-targets.json` (the first reconcile run rewrites the ledger), add the route to `evidence/T8-extras.txt` sorted census, and update the two search-count pins if `store6-room/README.md` mentions "fetcher" (`verify-search-index.mjs:42` and its mirror in `t5-search-contract.test.mjs`). If the Room README needs publication softening (tag-specific prose), the transform goes into `applyLockedPublicationTransforms` under a new `sourceRelative === "store6-room/README.md"` branch — never into the generated `.mdx`.

### 2b. The re-pin flow when Repo A changes

One new helper in Repo B: **`scripts/repin-store6-lock.mjs --source-root <checkout>`**. It:

1. Reads Repo A `HEAD` and recomputes sha256 + `markdownLinkCount` for every lock-listed path; rewrites `evidence/T4-store6-source-lock.json` with the new revision and hashes.
2. Runs `node scripts/sync-store6-docs.mjs --source-root <checkout>` (the real transaction), regenerating all 10+1 targets and the ledger.
3. Prints a per-source unified diff of the regenerated `.mdx` and **hard-fails if any locked line-range transform produced output whose replaced region no longer begins/ends at markdown block boundaries** (blank-line or heading sanity check). This is the guard for the known fragility: transforms are keyed to 1-based line numbers of the *pinned* source, so they can never misfire against a stale pin (the sha256 gate at `sync-store6-docs.mjs:222` catches that first), but they *can* silently splice the wrong lines at re-pin time if Repo A inserted lines above an anchor. Repo A's append-only amendment discipline for `STABILITY.md`/`ROADMAP.md` makes this rare; the sanity check plus mandatory human review of the printed diff makes it non-silent.
4. Re-runs `node scripts/check-claims.mjs` (§5) and `node scripts/check-snippets.mjs` (§6) against the new revision, and prints the list of claims/snippets needing re-verification.

**Who bumps the lock:** nobody by hand. The Repo B scheduled drift workflow (§3) runs the helper and opens a PR; the docs maintainer reviews the diff (especially transform regions and flagged claims) and merges. A human can also run the helper locally for an urgent re-pin — the PR path is the same.

**What fails, exactly, when Repo A main moves and Repo B does nothing:** `sync-store6-docs.mjs --check` against a Repo A checkout at main fails with `Store6 revision mismatch: expected <lock>, got <head>` (`:208`); against a checkout pinned to `lock.revision` it stays green — that is why per-PR checks in Repo B check out Repo A **at `lock.revision`** (correctness of the pinned pipeline), while the scheduled drift job checks out Repo A **at main** (staleness detection). Nothing auto-updates without a PR.

### 2c. Drift on hand-authored surfaces

- `content/docs/store6/overview.mdx`: already caught — any byte change fails `t4-contract.test.mjs:834` against `T3_OVERVIEW_SHA256` (`:33`); editing it legitimately means updating that hash in the same commit, and `t8-verification.mjs` separately errors if it ever appears in the sync lock.
- All other Class H pages: drift relative to the *code* is caught by the claims ledger (§5) and snippet check (§6), not by byte-pinning — byte-pinning every hand-authored page would make ordinary editorial work fail closed with no signal about *what* became untrue. Drift relative to the *site contracts* (routes, search counts, frontmatter shape, link health) is already caught by `t4-contract.test.mjs` / `t8-verification.mjs` once the new routes are in the census.

## 3. CI enforcement on both repos

### Repo A — new job `docs-sync-guard` in `.github/workflows/store6.yml`

- **Trigger:** `pull_request` (job-level `if` on changed files, computed in-step via `git diff --name-only origin/main...HEAD`; no `paths:` filter so the check always reports a status).
- **Mechanism:** a committed mirror of the lock's source list at `.github/docs-sync-sources.txt` (one path per line: the 10 current paths + `store6-room/README.md` when added). Step logic: if any changed file is listed and the PR does not carry the label `docs-sync-ack`, fail.
- **Command:** `comm -12 <(sort .github/docs-sync-sources.txt) <(git diff --name-only origin/main...HEAD | sort)` — non-empty intersection + missing label ⇒ `exit 1`.
- **Failure message:** `This PR edits sources published to the docs site (listed in .github/docs-sync-sources.txt; pinned by store-docs evidence/T4-store6-source-lock.json). Merging makes the site stale until the docs repo re-pins. Add the 'docs-sync-ack' label to proceed; the docs repo's scheduled drift check will open the re-pin PR after merge. If your edit inserts or deletes lines in STABILITY.md, ROADMAP.md, store6-compose/README.md, or store6-sqldelight/README.md above an existing section, prefer appending — the site applies line-anchored publication transforms to these files.`
- **Failure semantics:** hard fail (required check). The label is per-PR acknowledgment, not automation — it exists so the author consciously accepts the staleness window and the transform-anchor risk. The mirror list itself is guarded by a second assertion in the same job: the file must be non-empty and sorted (cheap self-check), and the Repo B drift job (below) fails if the mirror disagrees with the lock's path set, closing the loop between the two repos.
- Existing steps already carry the snippet-integrity load (§6): `Run Store6 quickstart` (`store6.yml:62`) and the sample/probe/demo builds keep every extracted snippet compiling on every Repo A PR.

### Repo B — new `.github/workflows/` (none exists today)

**`verify.yml`** — on `pull_request` and `push` to main. Node 22 (the `t8-verification.mjs:713` pin makes any other choice fail anyway). Steps:

1. `actions/checkout` Repo B; `pnpm install`.
2. Read `lock.revision` from `evidence/T4-store6-source-lock.json`; `git clone --no-checkout https://github.com/matt-ramotar/Store6 ../Store6 && git -C ../Store6 checkout <revision>`.
3. `node scripts/sync-store6-docs.mjs --source-root ../Store6 --check` — fails on any byte drift in generated targets or ledger census (the failure names the hand-edited file via `<path>: generated output differs`; census drift fails as `OWNED_CENSUS_MISMATCH`).
4. `node --test scripts/t4-contract.test.mjs scripts/t5-search-contract.test.mjs scripts/t7-static-hero.test.mjs scripts/generated-output-transaction.test.mjs scripts/t8-verification.test.mjs`.
5. `node scripts/check-claims.mjs --source-root ../Store6` and `node scripts/check-snippets.mjs --source-root ../Store6` (§5, §6).
6. `pnpm build`; `node scripts/t8-verification.mjs`; `node scripts/verify-search-index.mjs`; `node scripts/test-t6b-reference.mjs`.

**`drift.yml`** — `schedule: cron "0 6 * * *"` + `workflow_dispatch`. Steps:

1. Checkout Repo B; clone Repo A at **main**.
2. Assert `.github/docs-sync-sources.txt` in the Repo A clone equals the lock's `sources[].path` set — mismatch fails with `docs-sync-sources.txt and T4-store6-source-lock.json disagree; update the Repo A mirror list in the same change that edits the lock.`
3. If Repo A `HEAD == lock.revision`: exit green (`docs in sync with Store6 main @ <sha>`).
4. Else run `node scripts/repin-store6-lock.mjs --source-root ../Store6`, then the full verify sequence, then open/refresh a single rolling PR (branch `docs-sync/repin`, `gh pr create --repo matt-ramotar/store-docs`) containing: lock, regenerated `.mdx` + `public/llms.txt`, ledger, and the claims/snippets re-verification report in the PR body. If only the revision moved and no locked source hash changed, the PR is a trivial revision fast-forward and says so.
5. **Failure semantics:** the job fails (surfacing in the repo's checks UI and notifications) only when re-pin or verification errors — e.g. a transform anchor sanity failure, an unresolved relative link (`rewriteRepoUrl` fatal at `sync-store6-docs.mjs:133`), or a claims-file hash mismatch that the helper cannot auto-carry. A clean re-pin produces a PR, not a failure.

## 4. API reference (Dokka)

**State:** the wiring is merged — Repo A main applies `org.jetbrains.dokka` to every store6 module via `Store6Conventions.kt:35` (PR #33, squash `0373381`); Dokka is 1.9.20. `claude/angry-cerf-10ee7d` is stale (its commit `1280804` is superseded by the merge) and should be deleted. So `:store6-core:dokkaHtml` and `:store6-mutations:dokkaHtml` exist on main today; the placeholders' stated blocker was only the missing local Android SDK.

**Execution path — satisfy the placeholders' contract literally, in Repo B's drift/repin PR flow:** a job `dokka-reference` appended to `drift.yml` (and runnable via `workflow_dispatch`):

1. Checkout Repo A at `lock.revision` (reference and prose always describe the same revision); `ubuntu-latest` runners provide `ANDROID_HOME`, JDK 17 via `setup-java` (zulu, matching `store6.yml`).
2. `./gradlew :store6-core:dokkaHtml :store6-mutations:dokkaHtml --stacktrace`.
3. `rsync -a --delete ../Store6/store6-core/build/dokka/html/ public/reference/store6-core/` and the mutations twin — exactly the contract grids on the placeholder pages: same public destinations, no new routes, no redirects (`test-t6b-reference.mjs:495` keeps enforcing the no-redirects rule; `lib/nav.ts:25` keeps pointing at `/reference/store6-core/index.html`, which Dokka emits).
4. **Dokka 1.9.20 silent-log caveat:** unresolved KDoc links do not error in the build log. Post-generation gate: `grep -rl 'data-unresolved-link' public/reference/ && exit 1` with message `Dokka emitted unresolved KDoc links; fix the KDoc in Store6 (grep the HTML for data-unresolved-link).`
5. Commit into the same rolling re-pin PR.

**Required Repo B contract updates in the first replacement PR (one motion):** `t8-verification.mjs` currently pins `public/reference` to exactly the two placeholder `index.html` files (derived from `FIXED_EXTRA_SOURCES`, `:24`, `:186`); relax that census to "each of exactly two module directories `store6-core`/`store6-mutations` exists and contains an `index.html`", keep the two routes in `FIXED_EXTRA_SOURCES`/`T8-extras.txt` unchanged, and update `test-t6b-reference.mjs`'s placeholder-content assertions to structural ones (title present, module cross-link present). The Dokka trees are Class G: add owner `dokka-reference` to `evidence/T4-owned-targets.json` only if per-file ledgering is wanted — recommended instead: exempt `public/reference/**` from the ledger (as today) and rely on the regeneration diff in the PR, because Dokka emits hundreds of files and hash-ledgering them buys nothing the `--delete` rsync doesn't.

**Versioning:** until `6.0.0-alpha01`, reference regenerates at every lock re-pin (main-tracking, matching the synced prose). From the first released tag onward, regenerate only at tags: the re-pin PR for a release pins `lock.revision` to the tag SHA and the reference is generated from that same SHA — this matches STABILITY.md's verify-from-a-released-tag posture. No multi-version reference until there are two releases worth documenting; when that day comes it is an additive `public/reference/<module>@<version>/` decision following the same pattern.

## 5. Claim ledger

**Format — `evidence/store6-claims.json` (Repo B, new):**

```json
{
  "schemaVersion": 1,
  "revision": "<must equal T4-store6-source-lock.json revision>",
  "claims": [
    {
      "id": "read-contract/four-result-kinds",
      "page": "/docs/store6/concepts/read-contract",
      "claim": "stream yields exactly four StoreResult kinds: Loading, Data, Revalidated, Error.",
      "anchors": [
        { "path": "store6-core/src/commonMain/kotlin/org/mobilenativefoundation/store6/core/StoreResult.kt", "sha256": "<file hash at revision>" }
      ]
    }
  ]
}
```

Anchors hash the **whole file at the pinned revision** — not line ranges. Line-level anchors rot on every unrelated edit and invite the same fragility the publication transforms already suffer; file-level hashing makes the check say exactly the right thing: "a file this claim depends on changed — re-verify the claim." An optional informative `lines` field may aid the human but is never checked.

**Check — `scripts/check-claims.mjs --source-root <checkout>` (new):**

1. Assert `claims.revision === lock.revision` (the two evidence files re-pin together; drift here fails with `store6-claims.json is pinned to a different Store6 revision than the source lock`).
2. For each anchor, recompute the file's sha256 in the checkout; mismatch (or missing file) fails listing `page`, `id`, `claim`, `path` — message: `claim <id> on <page> anchors <path>, which changed since <revision>; re-verify the claim, then run check-claims.mjs --reconcile <id>`.
3. `--reconcile <id>` / `--reconcile-all` rewrite the stored hashes after human re-verification; the drift PR body carries the flagged list so reconciliation happens in review, never silently.
4. Census: every Class H page under `/docs/store6/` (i.e., every `content/docs/store6/**/*.mdx` that is neither in the sync lock nor `overview.mdx`) must own at least one claim; a page with zero claims fails with `hand-authored page <route> has no entries in store6-claims.json`. This is what makes "hand-authored" a checked class rather than a habit.

The ledger lives in `evidence/` beside the other contract files, is hand-maintained (it is itself the authority record, so it is not ledger-owned), and is exercised in `verify.yml` (against Repo A at `lock.revision` — should always pass on a green tree) and in `drift.yml` (against main — this is where changes surface).

## 6. Snippet integrity

**One mechanism: verify-in-place extraction from CI-compiled Repo A code.** No copy step, no include machinery — the fenced block stays in the MDX where authors and reviewers read it, and a checker proves it byte-matches a compiled source region.

- **Repo A side:** snippet regions are marked in compiled code with `// docs:snippet:<name>` … `// docs:snippet:end` comment pairs — in `store6-quickstart/`, `store6-sqldelight-sample/`, `store6-extension-probe/`, the compose demo, and module `commonTest` sources, all of which `store6.yml` already builds or runs on every PR (e.g. `:store6-quickstart:run` at `store6.yml:62`). These markers are behavior-bearing comments, protected under `AGENTS.md:23-31`. Where the IA needs a snippet no current module contains — the mutations quickstart's full `mutationStore(...)` program is the main case — the code is added to a runnable sample (extend `store6-quickstart` with a mutations entry point or add `:store6-mutations-quickstart`) and wired into `store6.yml` as a `Run Store6 mutations quickstart` step, so the snippet is executed, not merely compiled.
- **Repo B side:** a hand-maintained manifest `evidence/store6-snippets.json` (`{ "name", "path", "pages": [routes] }`) plus a marker line immediately above each fenced block in MDX: `{/* snippet: mutations-quickstart */}`. New checker **`scripts/check-snippets.mjs --source-root <checkout>`**: for each manifest entry, extract the marked region from the Repo A checkout, dedent, and compare byte-for-byte with every referencing fenced block. Failure: `snippet <name> on <route> differs from <path> at <revision>` with a diff. Runs in `verify.yml` (pinned revision) and `drift.yml` (main — this catches code drift the moment Repo A changes an API used in a sample).
- Sync-owned pages need none of this: their snippets arrive via the lock, and Repo A's own provenance discipline (verbatim/parity-checked markers, `docs/store6/quickstart.md`) plus the sha256 pin already guarantee them. The `check-snippets` census therefore covers Class H pages only.

## 7. Cadence and responsibilities

| When | Repo | What runs | Who acts on failure |
|---|---|---|---|
| Every PR | A | `Store6` workflow (existing: quickstart run, samples, probes, censuses — keeps snippet sources compiling) + new `docs-sync-guard` | PR author (adds `docs-sync-ack` or reverts) |
| Every PR + push to main | B | `verify.yml`: sync `--check` @ lock revision, all `node --test` harnesses, claims, snippets, `pnpm build`, t8, search index, t6b | PR author |
| Daily 06:00 UTC + manual | B | `drift.yml`: Repo A main vs lock; re-pin helper → rolling PR `docs-sync/repin` incl. Dokka regen and claims/snippets re-verification report; mirror-list consistency check | Docs maintainer (Matt) reviews and merges the PR; failures in the job itself are pipeline bugs, fixed in Repo B |
| Every Repo A release tag | both | Repo A: normal release. Repo B: manual `workflow_dispatch` of `drift.yml` pointed at the tag SHA — lock pins to the tag, Dokka regenerates from the tag, overview support matrix + `T3_OVERVIEW_SHA256` updated in the same PR, release-notes surface at `/release-notes/overview` becomes an editorial decision | Docs maintainer |
| Per-merge to Repo B main | B | `verify.yml` re-runs; deploy follows only on green | Docs maintainer |

Division of responsibility in one line: **Repo A authors own truth and acknowledge publication impact (label); Repo B automation detects and stages every propagation (rolling PR); the docs maintainer is the only merge authority for content reaching the site.**

## 8. Compliance with Repo A documentation discipline on site surfaces

- **Protected technical content (`AGENTS.md:23-31`):** the locked publication transforms in `applyLockedPublicationTransforms` are the *only* sanctioned mutation of Repo A prose, and each one is a technical change reviewed as such — a re-pin PR that touches a transform block must say why in its body. Class H pages quote identifiers, signatures, versions, and test names verbatim from anchored sources; the claims ledger is the audit trail, and the three-pass review (`AGENTS.md:58-66`) applies to every Class H authoring PR (encode it in `.github/PULL_REQUEST_TEMPLATE.md` in Repo B as a checklist: accuracy / warrant / reader utility).
- **No internal organizational context (`AGENTS.md:33-41`):** new automated gate in `t4-contract.test.mjs` — a banned-token scan over `content/docs/**/*.mdx`, `public/llms.txt`, and `app/**/*.tsx` page content using a curated regex list committed at `evidence/banned-internal-tokens.txt`: `\bTD-\d+\b`, `\bFS-\d+\b`, `\bRISK-\d+\b`, `\bRD-\d+\b`, `\bD\d+\s*=\s*[A-Za-z]\b`, `docs/v6/`, `\bSTORE-\d+\b`, `\bIssue 0\d\d\b`. Failure message: `internal process vocabulary found on a published surface: <file>:<line> matched <pattern>; state the technical fact with durable attribution instead (AGENTS.md).` The list is curated, not clever — false-positive-prone words ("ratified", "ruled") stay out; the scan catches the token shapes that have actually leaked in the past.
- **Decision records:** `docs/v6/` is git-excluded in Repo A and must never be anchored — `check-claims.mjs` rejects any anchor path starting `docs/v6/` outright (`claims may not anchor private decision records; anchor the code or a tracked doc`).
- **Provenance:** sync preserves the Repo A "Last verified: date · main @ SHA" footers by construction (they are body content). Class H pages get the equivalent mechanically: the docs renderer (catch-all page at `app/(docs)/docs/[[...slug]]/page.tsx`) appends a footer for `/docs/store6/*` routes reading `Verified against Store6 <short-revision>` sourced from the claims ledger's `revision` — one implementation, no per-page hand-maintained dates to rot.
- **Pitfall guard:** the narrative pitfalls (never "published", never "frozen", never atomic-ack, never pinned grace windows, …) are enforced editorially via the claims ledger — each pitfall-adjacent page carries a claim whose anchor is the file that would change if the posture changed (e.g. the mutations pages anchor `STABILITY.md`, so the alpha-posture claims flag for re-verification the day STABILITY.md's §8 moves).

## Sequencing (first three PRs)

1. **Repo B bootstrap PR:** add `.github/workflows/verify.yml` + `drift.yml`, `scripts/repin-store6-lock.mjs`, `scripts/check-claims.mjs` + empty-but-valid `evidence/store6-claims.json`, `scripts/check-snippets.mjs` + empty manifest, banned-token scan in `t4-contract.test.mjs`, PR template. No content changes; everything green against `a6a156e9`.
2. **Repo A guard PR:** `docs-sync-guard` job + `.github/docs-sync-sources.txt`; delete stale branch `claude/angry-cerf-10ee7d`.
3. **First content motion:** Room lock entry + `T8-extras.txt` + search-pin updates in one Repo B PR (Class S template for all future additions); then the Dokka replacement PR executing the placeholder contract with the `t8-verification.mjs` census relaxation.


---

# 7. Verification record

## 7.1 Claim ledger

437 checkable factual claims with code anchors were extracted from the outlines (the full ledger ships as `2026-08-10-claims-ledger.json` beside this file; the sync plan's §5 mechanism consumes it). A 60-claim sample was adversarially verified against the pinned revision: **59 CONFIRMED, 1 REFUTED**.

The refuted claim (entry section, /docs/meet-store): the outline asserted hand edits to port-page-owned files are "detected and blocked"; in reality `reconcileOwnedOutputs` overwrites currently-owned outputs unconditionally — hand edits are *silently replaced*, not rejected (byte-verifying `--check` is wired only to the sync-store6-docs owner). The outline and ledger have been corrected; the practical rule (never hand-edit generated files) stands.

## 7.2 Constraint check

Adversarial constraint check run against Repo A /Users/matt/src/matt-ramotar/Store6 (main @ a6a156e99db29cebf7da238263b007802bff2bfb, matching the lock revision) and Repo B /Users/matt/src/matt-ramotar/store-docs. Check 1 (zero-redirect): PASS — all 37 evidence/live-url-inventory.txt URLs, all 47 content/docs routes, all app routes (/, /tokens-demo, /developer-newsletter/overview, /release-notes/overview), and all 15 evidence/T8-extras.txt census routes appear in the IA with keep-frozen/revise/sync-owned dispositions at their exact paths. Check 2 (slugs/crossLinks): PASS — 78 slugs all unique; every cross-link target in the nine outline files under the scratchpad outlines/ directory resolves to an IA page (the only non-member references are prose subtree/prefix mentions and the deliberately-preserved dead link /docs/use-cases/store5/multiplatform-integration inside the frozen use-cases overview record). Check 3 (sync-owned sources): PASS — every Repo A path cited anywhere in the IA (60 paths incl. all sync-owned sources) exists at the pinned revision; store6-room/README.md and Store6RoomSchema.kt exist for the planned new lock entry; live run of `node scripts/sync-store6-docs.mjs --source-root <RepoA> --check` exited 0 ('checked 10 locked Store6 outputs'). Check 4 (sync plan vs scripts): one violation reported (OWNED_STALE_MODIFIED misattribution); everything else verified against the code — revision gate at sync-store6-docs.mjs:205-209, sha256 gate :220-224, transforms :141-190 with exact ranges (quickstart 133-136; STABILITY 206/172-179/162-163/123-126; compose 37-45; sqldelight 121), deriveStore6OwnedTargets :72-77, unresolved-link fatal :133, OWNED_TARGET_COLLISION/:46 and OWNED_TARGET_UNCLAIMED/:48 accurate for reconcile mode, lock has 10 sources + llms.txt markdownLinkCount 7, T3_OVERVIEW_SHA256 at t4-contract.test.mjs:33 asserted :834, FIXED_EXTRA_SOURCES at t8-verification.mjs:24 with reference-census pin near :186, Node-22 pin :713, zero-redirect assertion test-t6b-reference.mjs:495, search pin 54 at verify-search-index.mjs:42 mirrored at t5-search-contract.test.mjs:738, no .github/ and no test script in Repo B package.json, Dokka wiring on Repo A main (0373381 is an ancestor of main; Store6Conventions.kt:35; Dokka 1.9.20 at libs.versions.toml:11; branch claude/angry-cerf-10ee7d stale as stated), placeholder pages carry the quoted replacement contract, lib/nav.ts anchors (:15 Start→/docs/intro, :25 Reference→/reference/store6-core/index.html, :30 Store5 switcher→/docs, belongsToVersion :83-86) all correct. Check 5 (stability): PASS — every STABILITY.md anchor cited in IA/outlines matches the file (tier markers :19-30, artifact table :45-55, seam freeze-candidate + Overlay/StoreWriteHandle contingency :57-68, side-by-side + GA launch gates :106-110, mutations §8 posture incl. adopt-then-retire and idempotency requirement :153-170, reviewed-but-experimental :172-179, OVERLAY-vs-isStale and get-unprojected :186-198, Kotlin floor :201-206); the known gap — no artifact-table rows for store6-mutations-sqldelight/store6-mutations-testing — is explicitly acknowledged in the mutations outline (store6-mutations.md:24-33, :709, :774-779) and grounded in code anchors instead (@ExperimentalStoreApi verified at SqlDelightMutationJournalStorage.kt:48 and MutationJournalStorageContractKit.kt:54, with @SubclassOptInRequired(DelicateStoreApi) on MutationJournalStorage.kt:26 supporting the journal-storage page's 'delicate opt-in' claim); StoreError has exactly six variants; MutationJournalRecords.kt has exactly nine *Record classes; important-defaults claims (CachedOrFetch, zero retries, in-memory SoT/bookkeeper, 128 idle keys, single-flight, per-kind conflation, Revalidated) all present in docs/store6/important-defaults.md; README.md:15 and :19-21 anchors correct. A stray background shell (ID bevf35m3u, a timed-out heredoc duplicate of the link check) may emit a late completion notice; its work was redone successfully in-session and it can be ignored.

The single violation found (sync-plan misnaming the hand-edit failure mode as `OWNED_STALE_MODIFIED`) has been corrected in §6 per the checker's exact fix.

## 7.3 Coverage audit

| Module / concept (library digest) | Covering page(s) in approved IA + outlines | Coverage |
|---|---|---|
| **store6-core** | | |
| Store interface, two read doors, one-failure-channel rule | /docs/store6/concepts/read-contract | Full |
| store DSL / StoreBuilder (fetcher required, 3 install points, maxIdleKeys) | /docs/store6/quickstart, /docs/store6/guides/fetchers, /docs/store6/concepts/memory-and-lifecycle | Full |
| StoreKey / canonicalId / StoreNamespace | /docs/store6/key-design (sync-owned) | Partial — .value-equality/no-equals pitfall absent (gap) |
| Freshness policies (5 variants, fetch/no-fetch table, SWR) | /docs/store6/concepts/freshness, /docs/store6/important-defaults | Full |
| StoreResult (4 kinds), conflation, servedStale | /docs/store6/concepts/read-contract | Full |
| Origin attribution (incl. OVERLAY freshness stamping) | /docs/store6/concepts/read-contract, /docs/store6/mutations/pending-write-ui | Full |
| StoreError / StoreException (6 frozen variants, message contract) | /docs/store6/concepts/errors | Full |
| Invalidate vs clear, durable watermarks | /docs/store6/invalidate-vs-clear (sync-owned), key-design payoff | Full |
| Single-flight dedup, maxIdleKeys/eviction, reader grace, close() | /docs/store6/concepts/memory-and-lifecycle, important-defaults | Full |
| SourceOfTruth + TransactionalSourceOfTruth contract | /docs/store6/guides/persistence | Full |
| seam Fetcher / FetcherResult / ETags / Revalidated / Deleted | /docs/store6/guides/fetchers | Full |
| StoreMeta, metadata-less conservative-stale rule | /docs/store6/concepts/freshness | Full |
| FreshnessValidator / FreshnessContext / FetchPlan | /docs/store6/concepts/freshness (advanced footnote) | Full (deliberately brief) |
| Bookkeeper seam + KeyStatus + durable staleness algebra | testing guide (FakeBookkeeper), component-map admonition, adapter pages — one-liners only | **Gap — no contract page (medium)** |
| StoreRuntime / StoreWriteHandle (apply, markStale, confirmFresh) | /docs/store6/guides/extending | Full |
| Overlay seam as an installable core capability (overlay(...) door, apply contract for implementers) | Taught only via mutations projector lens (mutators, pending-write-ui) | **Gap — low** |
| WallClock seam contract (age/bounds only, never ordering) | TestWallClock usage only (testing guide) | **Gap — low** |
| KeyEvents (open hierarchy, best-effort delivery, silent producer points) | /docs/store6/guides/extending | Full |
| StoreTelemetry contract + composition | /docs/store6/guides/devtools, /docs/store6/guides/extending | Full |
| StoreResults construction door | /docs/store6/concepts/errors, /docs/store6/guides/testing | Full |
| API tiers / opt-in annotations / seam freeze-candidate status | /docs/store6/concepts/api-tiers, /docs/store6/stability | Full |
| **Mutations family** | | |
| mutationStore factory (5 required inputs, configure doors, no overlay door) | /docs/store6/mutations/quickstart, /docs/store6/mutations | Full |
| MutationStore narrowed facade (runtime() null, Store by delegation) | /docs/store6/mutations, migration/from-store5 | Full |
| MutationStore.keyEvents public member | — | **Gap — low** |
| Mutator registry, 5 shapes, presence algebra, purity rules, ref ownership, codec versioning | /docs/store6/mutations/mutators | Full |
| Overlay projection / pending-write UI (origin==OVERLAY, get unprojected) | /docs/store6/mutations/pending-write-ui | Full |
| MutationServer contract (push/retire, idempotency, conflict throw, Present/Absent acks, deletion coherence) | /docs/store6/mutations/server | Full |
| Alias/canonical rekeying lifecycle (PENDING→ACTIVE edges, live-stream swap, key-op rerouting, tombstones vs replay) | server page covers ack-side rules only; inspection covers identity-pair following only | **Gap — high** |
| Two-step ack crash window / idempotency requirement | mutations landing, server, from-store5, quickstart pointers | Full |
| Conflict pipeline (precondition, merge, 3-receipt bound, server-wins terminal) | /docs/store6/mutations/conflicts | Full |
| Drain semantics, namespace ownership, resolver, restart hydration, internal backoff | /docs/store6/mutations/drain-and-restart | Full |
| Journal storage seam, 9 records, in-memory default, SqlDelight adapter | /docs/store6/mutations/journal-storage | Full |
| Effects (stales/StaleSet, APPLIED/SKIPPED) | mutators + conflicts + inspection | Full |
| Inspection vs advisory events, failure taxonomy, poisoned | /docs/store6/mutations/inspection | Full |
| Journal contract kit, kill points, purity kit | /docs/store6/mutations/testing | Full |
| Tier statements for -sqldelight / -testing (absent from STABILITY table) | /docs/store6/mutations landing admonition | Full |
| Unset wallClock split (core default vs engine system clock) | — | Gap — folded into WallClock gap (low) |
| **Persistence adapters** | | |
| store6-room walkthrough, sidecar tables, migration, generation-gated echoes, compatibility | /docs/store6/room (sync-owned, new lock entry) | Full |
| store6-sqldelight walkthrough, boundary rules, driver matrix | /docs/store6/sqldelight (sync-owned) | Full |
| Adapter comparison (atomicity boundary, reader semantics, targets) | /docs/store6/guides/persistence | Full |
| SQLDelight etag-nulled-on-write behavior | — (not in README or comparison table) | **Gap — low** |
| Contract-kit certification of adapters/custom SoTs | persistence + testing guides, adapter pages | Full |
| **DX modules** | | |
| store6-compose (entry points, recomposition discipline, stability conf, demo) | /docs/store6/compose (sync-owned) | Full |
| store6-devtools (logger, monitor, v0 vocabulary, projection caveats, cost framing) | /docs/store6/guides/devtools | Full |
| store6-devtools-inspector (hosts, tabs, 8-target subset, zero transport) | /docs/store6/guides/devtools | Full |
| store6-devtools-demo (run instructions, 6-step checklist) | — | **Gap — low** |
| store6-testing (FakeStore tier, seam-fake tier, contract kits, TestStoreResults, TestWallClock) | /docs/store6/guides/testing | Full |
| store6-quickstart runnable module | /docs/store6/quickstart (sync-owned) | Full |
| store6-benchmarks (ratio semantics, evidence grades, telemetry table) | /docs/store6/guides/performance | Full |
| store6-extension-probe (decorator, seam telemetry, KeyEvents, ack case study) | /docs/store6/guides/extending | Full |
| store6-swift-dumps / Swift surface (SKIE enums, ObjC bridging, Duration flattening, dump verification) | /docs/store6/guides/swift | Full |
| **Policy / project** | | |
| STABILITY.md, ROADMAP.md, CONTRIBUTING.md | /docs/store6/stability, /docs/store6/roadmap, /docs/store6/contributing (sync-owned) | Full |
| store6-bom, interop/paging futures | stability + roadmap sync pages | Full (policy-level) |
| Migration (5→6, component map, 4→6) | /docs/store6/migration/* | Full |
| Dokka reference (core, mutations) | /reference/store6-core, /reference/store6-mutations (revise-in-place) | Full |

### Gap dispositions

| Severity | Gap | Resolution |
|---|---|---|
| high | Alias/canonical rekeying lifecycle from the consumer's side: durable alias edges | CLOSED — new page `/docs/store6/mutations/aliases`, fully outlined in §5 (gap-fill) |
| medium | The core Bookkeeper seam contract | Scheduled as a named subsection: `/docs/store6/guides/persistence#the-bookkeeper-seam` (see §8.9) |
| low | The Overlay seam for direct core implementers: the builder's overlay | Scheduled as a named subsection: `/docs/store6/guides/extending#custom-overlay-projection` (see §8.9) |
| low | The WallClock seam contract | Scheduled as a named subsection: `/docs/store6/guides/extending#wallclock` (see §8.9) |
| low | The store6-devtools-demo reference app: run instructions for desktop | Scheduled as a named subsection: `/docs/store6/guides/devtools#reference-demo-app` (see §8.9) |
| low | The StoreNamespace equality rule: matching is normalized exclusively by namespace.value everywhere in bookkeeping, StoreNamespace defines no equals, and compari | Scheduled as a named subsection: `/docs/store6/key-design#the-two-jobs` (see §8.9) |
| low | MutationStore.keyEvents | Scheduled as a named subsection: `/docs/store6/mutations/inspection#keyevents` (see §8.9) |
| low | SQLDelight adapter etag lifecycle: every SoT write nulls the stored etag | Scheduled as a named subsection: `/docs/store6/sqldelight#drivers-and-current-limitations` (see §8.9) |


---

# 8. Addenda — resolutions to review findings

The completeness critic raised 8 findings against the assembled plan. Each is resolved here with a concrete decision; these addenda are part of the plan.

## 8.1 Search-pin churn (per-batch rule)

The search harness pins the raw result count for the probe query "fetcher" (54 today) in `scripts/verify-search-index.mjs:42` and `scripts/t5-search-contract.test.mjs`. **Rule:** every content-batch PR (§8.6) re-derives this count locally (build + run `verify-search-index.mjs`) and updates both pins in the same PR. `/docs/store6/guides/fetchers` will move it the most; treat any pin delta not explained by the batch's pages as a regression. This extends design principle 6 ("harness pins move in one motion") to name the search pin explicitly.

## 8.2 T8 route-census additions (per-batch rule)

`evidence/T8-extras.txt` censuses every content route and `t8-verification` fails on un-listed additions. **Rule:** each new route's census row lands in the same PR that adds the route — one row per page, all batches, no exceptions. The sync plan's room-page steps already model this; it now applies to all ~27 new routes.

## 8.3 llms.txt growth policy

**Decision:** `llms.txt` stays Repo A-owned and grows at batch boundaries, not per page. When a batch ships (§8.6), add links for its contract-bearing pages to Repo A `llms.txt`, then re-pin the source lock (`markdownLinkCount` + sha256) in the same re-pin PR that syncs the site copy. The concepts, guides, mutations, and migration trees become visible to llms.txt consumers at their batch's completion.

## 8.4 meta.json navigation inventory

Design principle 4 makes meta.json the sole navigation lever. The complete set to create (none exist today; meta.json files are not pages, so they sit outside the route census — verify with a local build + crawl in the PR that adds them):

| File | Order / content |
|---|---|
| `content/docs/meta.json` | Two-track root: Store 6 group first (`store6`), then a "Store 5 (legacy)" separator labeling `concepts/store5`, `use-cases/store5`, `best-practices/store5`, then the frozen top pages. Labels the legacy shelf without touching frozen files. |
| `content/docs/store6/meta.json` | Spine order: `overview`, `quickstart`, `important-defaults`, separator "Concepts", `concepts`, `key-design`, `invalidate-vs-clear`, separator "Guides", `guides`, `room`, `sqldelight`, `compose`, separator "Mutations (experimental)", `mutations`, separator "Migration", `migration`, separator "Project", `stability`, `roadmap`, `contributing` |
| `content/docs/store6/concepts/meta.json` | `read-contract`, `freshness`, `errors`, `memory-and-lifecycle`, `api-tiers` |
| `content/docs/store6/guides/meta.json` | `fetchers`, `persistence`, `testing`, `devtools`, `extending`, `performance`, `swift` |
| `content/docs/store6/mutations/meta.json` | Adoption order: `index`, `quickstart`, `mutators`, `pending-write-ui`, `server`, `conflicts`, `aliases`, `drain-and-restart`, `journal-storage`, `inspection`, `testing` |
| `content/docs/store6/migration/meta.json` | `from-store5`, `component-map`, `from-store4` |

## 8.5 Amendment to design principle 1 (the spine)

As written ("every Store 6 page ends with exactly one forward link"), principle 1 contradicts the outlines, which correctly give several pages a short "Where next" block. **Amended principle:** every *spine* page (overview → quickstart → important-defaults → concepts/read-contract → guides/fetchers → mutations) ends with exactly one *primary* Next callout; any page may additionally offer a compact "Where next" block of side links. The outlines as written comply; no rework needed.

## 8.6 Authoring sequencing (batches B0–B6)

| Batch | Content | Depends on |
|---|---|---|
| **B0 Infrastructure** | Sync-plan §sequencing PRs: re-pin helper, Repo B drift workflow, Repo A PR guard on lock-listed sources, claims-ledger check | nothing |
| **B1 Concepts** | 5 new concepts pages; upstream Repo A edits to `key-design.md` / `invalidate-vs-clear.md` (+ lock re-pin) | B0 |
| **B2 Guides** | 7 new guides pages; add `store6-room/README.md` to the lock → `/docs/store6/room` | B1 (guides link into concepts) |
| **B3 Mutations** | 11 new pages (incl. aliases) under the experimental banner | B1; parallel with B2 |
| **B4 Migration** | `from-store5`, `component-map`, `from-store4` | B1–B3 (successor targets must exist) |
| **B5 Entry revisions** | `/` hero CTAs (+T7 pin update), `/docs` two-track router, `lib/nav.ts` re-points (§8.7), root meta.json labels | B1–B4 (targets must exist) |
| **B6 Reference** | Dokka output replacing both placeholders per their stated contracts | Repo A Dokka wiring merged (open PR #33); independent of B1–B5 |

Per-batch checklist (every batch PR): T8-extras rows (§8.2) · search-pin re-derive (§8.1) · llms.txt + lock re-pin at batch close (§8.3) · meta.json updates (§8.4) · local production build + full crawl green.

## 8.7 Top-nav re-point decisions

`lib/nav.ts` primaryNavItems, after B5: **Start** → `/docs/store6/overview`; **Use Store** → `/docs/store6/guides/fetchers` (first page of the guides group); **Integrations** → `/docs/store6/room`; **Test** → `/docs/store6/guides/testing`; **Reference** and **Project** keep their targets. All former targets (Store 5 routes) keep serving 200 — this is a link re-point, not a move.

## 8.8 rx2 / Java scope note

`/docs/store6/migration/from-store5` gains an explicit scope statement: RxJava (`rx2`) and Java-first consumers are out of scope for the initial Store 6 migration guide; the rx2 module remains on Store 5 coordinates, which stay published for all of 6.x. Revisit on demand signal.

## 8.9 Remaining coverage-gap placements

The medium/low gaps from §7.3 are scheduled as named subsections of already-planned pages, in their owning batch: Bookkeeper seam → `guides/persistence#the-bookkeeper-seam` (B2); Overlay seam + WallClock → `guides/extending` (B2); devtools-demo run instructions → `guides/devtools#reference-demo-app` (B2); StoreNamespace equality → upstream edit to `key-design.md` (B1); `keyEvents` advisory flow → `mutations/inspection#keyevents` (B3); SQLDelight etag lifecycle → upstream edit to `store6-sqldelight/README.md` (B2).
