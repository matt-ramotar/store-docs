# Mutations: the journalled write path

Canonical page: https\://store.mobilenativefoundation.org/docs/store6/mutations

Markdown: https\://store.mobilenativefoundation.org/llms/store6/mutations.md

Source kind: site-authored; source path: content/docs/store6/mutations/index.mdx

> **Note**
>
> **Experimental tier.** `store6-mutations` is a separate artifact, and every public symbol carries
> `@ExperimentalStoreApi`. Its shapes may change or be removed in any release.
> `store6-mutations-sqldelight` and `store6-mutations-testing` are experimental too, with
> `@ExperimentalStoreApi` on their public declarations. The SQLDelight adapter also opts into
> `@DelicateStoreApi` because it implements the mutation-journal storage seam.
>
> Graduation is gated, not scheduled. The first review is at 6.1 and the target window is roughly
> 6.3. Graduation requires an unchanged API across two consecutive minors, green crash-matrix and
> soak lanes in production-representative apps, and reports from at least three external production
> adopters. See [Stability](https://store.mobilenativefoundation.org/llms/store6/stability.md) and the [roadmap](https://store.mobilenativefoundation.org/llms/store6/roadmap.md).

## Two facts before anything else

First, this write path is experimental. The factory, protocol, storage records, and inspection
shapes can change in any release.

> **Note**
>
> **Remote acceptance and durable `ACKED` are separate boundaries.** If the server accepts a push but
> Store fails or dies before the local acknowledgement-receipt transaction commits, the last durable
> phase remains `INFLIGHT`. A later explicit drain may replay the same immutable generation and
> `idempotencyKey`. Replay after process death requires journal storage that survives restart. Once
> `ACKED` is durable, recovery may repeat adoption, invalidation effects, and retirement, but it never
> re-pushes that acknowledged generation. The server endpoint must remain idempotent.

## A MutationStore is a Store

`mutationStore(...)` returns a `MutationStore<K, V>`, which implements `Store<K, V>` by delegation.
Its `stream`, `get`, invalidation, clearing, and `close` behavior therefore follows the core
[read contract](https://store.mobilenativefoundation.org/llms/store6/concepts/read-contract.md).

The mutation facade adds:

* `mutate(key, ref, args)`, which appends a typed intent and returns its opaque mutation id.
* `drain(key)` and `drain()`, which run foreground passes over pending work.
* `pending(key)`, `pendingWrites()`, and `deadLetters()` for durable inspection.
* `poisoned` and `events`, two advisory flows for observing failures and lifecycle activity.

The facade withholds the raw engine write handle. Calling `runtime()` on a
`MutationStore` returns `null`, so consumer writes cannot bypass the journal through a second write
path.

The factory takes five required inputs. Optional core Store configuration stays inside the builder,
which exposes no overlay door because the mutation engine installs the Store's sole overlay.

```kotlin
@OptIn(ExperimentalStoreApi::class)   // required: the whole module is experimental
val users = mutationStore(
    registry = registry,
    server = server,
    // Restart-safe key recovery is compile-time required. For keys reconstructible from the
    // identity pair, the resolver is one line:
    keyResolver = MutationKeyResolver { identity -> UserKey(identity.canonicalId) },
    valueCodecVersion = 1,
    valueCodec = userJsonCodec,
) {
    fetcher { key -> api.load(key) }
}

users.mutate(key, renameRef, Rename("new name"))   // journalled — the only write path
users.drain(key)                                   // push pending intents and adopt each ack
```

`mutate` appends but does not push. `drain(key)` makes one scheduler-agnostic foreground pass for
the effective key. It pushes the pending FIFO prefix once and has no retry or backoff policy of its
own.

## The model, end to end

1. **Register typed intents.** Build a `MutatorRegistry` once. Every durable operation has a name,
   argument codec, projection, and invalidation set. A call-site closure never becomes a durable
   intent. See [Authoring mutators](https://store.mobilenativefoundation.org/llms/store6/mutations/mutators.md).
2. **Append to the journal.** `mutate` records the intent and returns its opaque id. The default
   `InMemoryMutationJournalStorage` does not provide restart durability. Install the
   SQLDelight-backed storage, or another conforming durable implementation, when queued writes must
   survive process death. See [Journal storage](https://store.mobilenativefoundation.org/llms/store6/mutations/journal-storage.md).
3. **Observe the optimistic projection.** `stream` applies pending intents through the Store's sole
   overlay. When projection changes the value, the frame has `origin == Origin.OVERLAY`,
   `age = Duration.ZERO`, and `isStale = false`. `get` remains deliberately unprojected, so observe
   `stream` when the UI must see its own write. See
   [Pending-write UI](https://store.mobilenativefoundation.org/llms/store6/mutations/pending-write-ui.md).
4. **Push one foreground pass.** `drain(key)` sends pending work to the app-owned `MutationServer`.
   Each attempt generation carries an idempotency key that stays stable across transport retries.
   See [Implementing a MutationServer](https://store.mobilenativefoundation.org/llms/store6/mutations/server.md) and
   [Draining, offline, and restart](https://store.mobilenativefoundation.org/llms/store6/mutations/drain-and-restart.md).
5. **Record, adopt, apply effects, then retire.** Store atomically records the complete
   acknowledgement receipt and `ACKED` phase before local adoption. It then adopts the authoritative
   presence, completes the intent's invalidation effects, and retires the journal row. Recovery from
   `ACKED` or a later phase may repeat those local steps, but never the push. A later retirement
   checkpoint lets the server confirm how much history the journal may prune. A stream opened after
   the drain completes sees the confirmed value. Convergence for a collector that was already active
   across acknowledgement is not yet a promised behavior.

Conflict handling is optional. Without a registered merge, server-wins is the non-removable
terminal. With one, the policy can retry a new generation or accept server-wins. See
[Conflict resolution](https://store.mobilenativefoundation.org/llms/store6/mutations/conflicts.md).

## Where each piece is documented

The mutations family has eleven subpages, in adoption order:

| Page                                                                                                                  | Scope                                                                                                                                    |
| --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| [Mutations quickstart](https://store.mobilenativefoundation.org/llms/store6/mutations/quickstart.md)                  | Configure the five required factory inputs, enqueue the first intent, and drain it.                                                      |
| [Authoring mutators](https://store.mobilenativefoundation.org/llms/store6/mutations/mutators.md)                      | Register the generic mutator plus typed update, create, delete, and upsert operations; define presence, purity, and codec-version rules. |
| [Pending-write UI](https://store.mobilenativefoundation.org/llms/store6/mutations/pending-write-ui.md)                | Render `Origin.OVERLAY` state and respect the distinction between `stream` and `get`.                                                    |
| [Implementing a MutationServer](https://store.mobilenativefoundation.org/llms/store6/mutations/server.md)             | Implement push and retirement transport, idempotency, conflicts, and present or absent acknowledgements.                                 |
| [Conflict resolution](https://store.mobilenativefoundation.org/llms/store6/mutations/conflicts.md)                    | Select preconditions, retry merged generations, and understand the server-wins terminal.                                                 |
| [Aliases and canonical rekeying](https://store.mobilenativefoundation.org/llms/store6/mutations/aliases.md)           | Follow a provisional identity through its durable alias edge to the server's canonical identity.                                         |
| [Draining, offline, and restart](https://store.mobilenativefoundation.org/llms/store6/mutations/drain-and-restart.md) | Choose keyed or global drains and reconstruct durable identities after restart.                                                          |
| [Background work](https://store.mobilenativefoundation.org/llms/store6/mutations/background-work.md)                  | Schedule pending mutation work across connectivity and application lifetimes.                                                            |
| [Journal storage](https://store.mobilenativefoundation.org/llms/store6/mutations/journal-storage.md)                  | Choose the in-memory default, install SQLDelight storage, or implement the storage seam.                                                 |
| [Inspection and observability](https://store.mobilenativefoundation.org/llms/store6/mutations/inspection.md)          | Read pending work and dead letters, and separate durable truth from advisory flows.                                                      |
| [Testing mutations](https://store.mobilenativefoundation.org/llms/store6/mutations/testing.md)                        | Certify storage behavior and exercise projector purity and crash boundaries.                                                             |

> **Note**
>
> Settlement logic belongs on durable inspection, not telemetry. Use `pending`, `pendingWrites`, and
> `deadLetters` as truth. `events` is best-effort, has no replay, and can drop older entries under
> pressure. The [inspection page](https://store.mobilenativefoundation.org/llms/store6/mutations/inspection.md) defines both surfaces.

## Coming from Store 5 MutableStore

Store 6 collapses the Store 5 write assembly into one factory and one journalled path:

| Store 5 responsibility                              | Store 6 mutation path                                                      |
| --------------------------------------------------- | -------------------------------------------------------------------------- |
| Per-request write lambdas on `MutableStore`         | Named, typed intents registered once in a `MutatorRegistry`                |
| `Updater.post`-driven transport                     | An app-owned `MutationServer`, invoked by `drain`                          |
| Hand-assembled failed-sync bookkeeping or an outbox | The mutation journal plus `pendingWrites()` and `deadLetters()` inspection |

Detailed migration steps are in [Migrating from Store 5](https://store.mobilenativefoundation.org/llms/store6/migration/from-store5.md) and
the [Store 5 component map](https://store.mobilenativefoundation.org/llms/store6/migration/component-map.md). The mutation path remains
experimental even when it replaces a stable Store 5 write assembly.

> **Tip**
>
> **Next:** [Mutations quickstart](https://store.mobilenativefoundation.org/llms/store6/mutations/quickstart.md) builds a complete write path from
> intent registration through acknowledgement.

***

Source recorded 2026-08-12 · [`main@c67a94ed`](https://github.com/matt-ramotar/Store6/commit/c67a94ed30460a35161c2cbc3e725f127caf055e) · pre-6.0.0-alpha01
