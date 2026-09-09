# The read contract: stream, get, and origins

Canonical page: https\://store.mobilenativefoundation.org/docs/store6/concepts/read-contract

Markdown: https\://store.mobilenativefoundation.org/llms/store6/concepts/read-contract.md

Source kind: site-authored; source path: content/docs/store6/concepts/read-contract.mdx

One failure rule, four result kinds, honest origin attribution, and the lifecycle of a Store stream.

A Store has exactly two read operations (`stream` and `get`) and one failure rule:
`stream` emits failures as values and never throws them at your collector. `get` returns a value or
throws, and never emits partial states. Everything on this page is the contract of the `Store`
interface in `store6-core`. It holds for every store you build, from a five-line memory-only store
to one backed by persistence and optimistic writes.

```kotlin
public fun stream(key: K, freshness: Freshness = Freshness.CachedOrFetch): Flow<StoreResult<V>>

public suspend fun get(key: K, freshness: Freshness = Freshness.CachedOrFetch): V
```

> **Note**
>
> `store6-core` is stable-track, but the API is **not frozen** until the beta01 freeze candidate.
> Nothing on this page needs an experimental opt-in. `stream`, `get`, `close`, `StoreResult`, and
> `Origin` are plain public API. Implementing `Store` yourself is different: the interface requires a
> `DelicateStoreApi` opt-in to subclass, because an implementation must uphold every semantic this
> page describes.

## The one-failure-channel rule

**`stream` never throws retrieval failures.** Fetcher and source-of-truth failures encountered
while retrieving a key are emitted as `StoreResult.Error` values rather than thrown to the
collector. Your collector sees the failure as data, decides how to render it, and (with one
exception covered below) keeps collecting a live flow.

**`get` never emits.** It returns the resolved value or throws `StoreException`. There is no
partial state on this path: `get` throws when fetching or source-of-truth access failed, when a
concurrent `clear` removed the key while its fetch was in flight, when `Freshness.LocalOnly` found
no local value, or when the server reported deletion.

The one exception on both doors is not a retrieval failure at all: any operation on a closed store
throws `IllegalStateException` with the message `Store is closed.` That is a usage error in your
code (you kept a reference past `close()`), not something a fetcher did. The structured error
vocabulary behind `StoreResult.Error` and `StoreException` has its own page:
[Errors and failure handling](https://store.mobilenativefoundation.org/llms/store6/concepts/errors.md).

## The four result kinds

`StoreResult` is a sealed interface with exactly four kinds. There is no fifth case, so an
exhaustive `when` is safe to write and will stay safe:

* **`Loading`**: the store has no servable resident value under the policy in effect. This is
  policy-relative, not merely "empty cache": a resident value that `Freshness.MustBeFresh` withholds
  produces `Loading` even though bytes are sitting in memory.
* **`Data(value, origin, age, isStale, refreshing)`**: a value, with the source it came from, the
  elapsed time since it was committed, whether it was invalidated or exceeds the age bound of the
  freshness policy in effect, and whether a fetch was in flight for the key when the result was
  emitted.
* **`Revalidated(age)`**: the not-modified signal of a conditional fetch. The server confirmed the
  current value is still fresh, metadata was refreshed, and `age` is the elapsed time since the last
  commit, measured at revalidation. No new `Data` frame is produced, because no new value exists.
* **`Error(error, servedStale)`**: a retrieval failure, carrying a structured `StoreError` and
  whether a stale value was served alongside it.

Collectors that only handle `Loading`/`Data`/`Error` silently miss the "nothing changed" signal.
After a conditional fetch returns not-modified, the store emits one `Revalidated`, not a redundant
`Data`. Handle all four. This is the exhaustive `when` from the quickstart program that compiles
and runs in CI:

```kotlin
users.stream(UserKey("1")).take(2).collect { result ->
    when (result) {
        is StoreResult.Loading -> println("Loading…")
        is StoreResult.Data -> println("Data(name=${result.value.name}, origin=${result.origin})")
        is StoreResult.Revalidated -> println("Revalidated(age=${result.age})")
        is StoreResult.Error -> println("Error(${result.error})")
    }
}
```

## Origins: attribution is honest

Every `Data` frame names the source it came from. `Origin` is an enum with four values:

| Origin    | Meaning                                                         |
| --------- | --------------------------------------------------------------- |
| `MEMORY`  | The value was served from in-memory resident state.             |
| `SOT`     | The value was read from the store's persistent source of truth. |
| `FETCHER` | The value was produced by the store's configured fetcher.       |
| `OVERLAY` | The value reflects an overlay applied above stored data.        |

Attribution honesty is a tested contract, not a debugging aid: a network commit is attributed
`FETCHER`, an external durable change is attributed `SOT`, an optimistic write is attributed
`OVERLAY`, and each of those claims is pinned by a named conformance test on
[Important defaults](https://store.mobilenativefoundation.org/llms/store6/important-defaults.md). If this page and a test ever disagreed, the
test would be right and this page would be a bug.

Two rules govern `OVERLAY` frames on the write path:

* **Overlay frames are fresh by definition.** They are stamped `age = Duration.ZERO` and
  `isStale = false` unconditionally, because an optimistic value genuinely is new. The user just
  wrote it. Only `refreshing` is live on an overlay frame. A pending-write affordance therefore
  keys on `origin == Origin.OVERLAY`, never on `isStale`. A spinner driven by `isStale` will never
  fire for a pending write, and that is intended. The full consumer guidance lives in
  [the stability policy](https://store.mobilenativefoundation.org/docs/store6/stability#9-reading-pending-writes-and-staleness), and the
  [pending-write UI guide](https://store.mobilenativefoundation.org/llms/store6/mutations/pending-write-ui.md) covers the consumer pattern in
  depth.
* **`get` is never projected by a configured overlay.** Overlays apply only to `stream`, so an
  optimistic write is invisible to `get`. It is a point read of committed truth. To observe your
  own optimistic write, observe `stream`.

## Conflation: lifecycle signals are never dropped

A slow collector never blocks a fast one, and never blocks the engine. When a collector falls
behind, the store conflates, but conflation is **per result kind**:

* A newer `Data` supersedes an older queued `Data`. The slow collector skips intermediate values
  and observes the latest row.
* A queued `Loading`, `Error`, or `Revalidated` is **never displaced by another kind**. Lifecycle
  signals survive backpressure. Only a newer signal of the same kind can supersede an older queued
  one, so the kind itself is never lost.

In UI code, you may not see every intermediate value, but you will never miss the
fact that a load started, a fetch failed, or the server confirmed freshness, and every collector
eventually observes the latest row. Each of these claims is pinned by a named conformance test on
[Important defaults](https://store.mobilenativefoundation.org/llms/store6/important-defaults.md).

## Errors on the stream: servedStale

`StoreResult.Error` carries `servedStale`, and its meaning is exact: `true` when an invalidated
resident value was served and its refresh failed under `Freshness.CachedOrFetch` or
`Freshness.StaleIfError`. `false` when no resident was served or the policy withheld it.

The rendering rule follows directly. When `servedStale` is `true`, the user is still looking at
usable content. The stale value was emitted before the failure arrived. Show an error affordance
over that content. Do not blank the screen. When `servedStale` is `false`, there is nothing on
screen to preserve, and a full error state is honest. The `StoreError` vocabulary that tells you
*what* failed is covered in [Errors and failure handling](https://store.mobilenativefoundation.org/llms/store6/concepts/errors.md).

## Failure trace: invalidated persisted data

This trace has four qualifying conditions: a first cold subscription after restart, a durably
invalidated persisted row, the default freshness validator, and `Freshness.CachedOrFetch`.
Wall-clock age alone does not trigger this fetch. A custom `FreshnessValidator` can plan
differently.

1. Store hydrates the persisted row into resident state and requests an unconditional fetch with
   `etag=null`. The durable record may still retain its stored ETag.
2. The initial public result is
   `Data(origin=Origin.SOT, isStale=true, refreshing=true)`.
3. A queued stale `Data` replay may occur before the error, without an intervening `Loading`.
4. `Bookkeeper.recordFailure` completes before the public error is emitted.
5. The failed refresh produces `Error(StoreError.Fetch, servedStale=true)`, and the stream remains
   live.

After hydration populates memory, a later resident replay may carry `Origin.MEMORY`.

## The one stream-terminating case

Exactly one failure completes a stream: a `Freshness.MustBeFresh` initial-cycle fetch or
revalidation failure emits one `Error` and completes the flow. `MustBeFresh` promises never to
serve residence, so when the fresh fetch fails there is nothing left for the stream to do. Every
other failure, under every other policy, leaves the flow live: the error arrives as a value and
collection continues.

> **Tip**
>
> Do not wrap stream collection in `try`/`catch` expecting thrown retrieval errors. Errors arrive as
> `StoreResult.Error` values, and the stream usually stays live after one. A `catch` block around
> `collect` sees the closed-store `IllegalStateException` and cancellation, never retrieval
> failures. Handling failures there means your UI never renders them.

## Streams are unbounded

A stream has no natural end. The flow remains active until its collector is cancelled or the store
is closed, and it continues to report later values:

* **Refetches triggered by invalidation.** After `invalidate(key)`, an active stream observes the
  refetched data.
* **The absent-value transition after a clear.** After `clear(key)`, an active stream observes
  `Loading` (the value is gone) and then refetched data.

What each maintenance verb makes streams observe is the subject of
[Invalidate or clear](https://store.mobilenativefoundation.org/llms/store6/invalidate-vs-clear.md).

Concurrent collectors and callers for one key share a single fetch. Fifty getters and fifty
collectors of one key cost one fetch, and all of them observe its outcome. How sharing, eviction, and
collector lifecycle interact is covered in
[Memory, eviction, and store lifecycle](https://store.mobilenativefoundation.org/llms/store6/concepts/memory-and-lifecycle.md).

## Closing the store

`close()` releases the resources the store owns and cancels its in-flight work. Collectors and
value requests waiting on in-flight work are cancelled. Every subsequent call to any operation
fails with `IllegalStateException` and the exact message `Store is closed.` Calling `close()` more
than once has no additional effect.

## Read resolution at a glance

Every data result names the boundary that supplied the value. Origin and freshness are independent:
read `origin` to identify provenance, then read `isStale` and `refreshing` for lifecycle state.

| Origin           | Resolution boundary | Meaning                                                                         |
| ---------------- | ------------------- | ------------------------------------------------------------------------------- |
| `Origin.MEMORY`  | Resident replay     | The collector receives a value already resident in this engine.                 |
| `Origin.SOT`     | Source of truth     | A source-of-truth read or write supplied the confirmed value.                   |
| `Origin.FETCHER` | Fetcher             | The configured fetcher produced or revalidated the authoritative value.         |
| `Origin.OVERLAY` | Stream projection   | An overlay projected over confirmed residence or confirmed absence for streams. |

> **Info: Important default**
>
> With Store 6's default freshness validator, wall-clock age alone never makes` Freshness.CachedOrFetch` fetch. It fetches when no resident value exists, freshness metadata is missing, the resident is invalidated, or durable status marks it stale. Use `Freshness.MaxAge` when elapsed age should participate. A custom` FreshnessValidator` may plan differently, and` Freshness.MustBeFresh` follows different serving and failure rules.

With Store 6's default freshness validator and` Freshness.CachedOrFetch`, the first cold stream after restart serves a durably invalidated persisted row as` Data(origin=Origin.SOT, isStale=true, refreshing=true)`. If its refresh fails, the stream emits `Error(StoreError.Fetch, servedStale=true)` without an intervening `Loading`, and the stream stays live.

`Bookkeeper.recordFailure` completes before that fetch error is emitted. Hydrated resident metadata does not reuse the persisted ETag, so a fetch planned from that state sees `etag=null`. After the first hydrated emission, a later resident emission may use `Origin.MEMORY`.

Read the [read contract](https://store.mobilenativefoundation.org/llms/store6/concepts/read-contract.md) for the complete stream and point-read semantics. Use the [freshness policies](https://store.mobilenativefoundation.org/llms/store6/concepts/freshness.md) to choose when a fetch participates.

## Where next

* [Freshness policies](https://store.mobilenativefoundation.org/llms/store6/concepts/freshness.md): how each read is planned, and what does
  and does not trigger a fetch.
* [Errors and failure handling](https://store.mobilenativefoundation.org/llms/store6/concepts/errors.md): the structured `StoreError`
  vocabulary behind `Error` and `StoreException`.
* [Invalidate or clear](https://store.mobilenativefoundation.org/llms/store6/invalidate-vs-clear.md): what streams observe after each
  maintenance verb.
* [Compose integration](https://store.mobilenativefoundation.org/llms/store6/compose.md): collecting this contract in UI.
* [Quickstart](https://store.mobilenativefoundation.org/llms/store6/quickstart.md): the runnable program this page's snippet comes from.

***

Source recorded 2026-08-12 · [`main@539614c0`](https://github.com/matt-ramotar/Store6/commit/539614c06be1a8f20dead562585e47394551ebae) · pre-6.0.0-alpha01
