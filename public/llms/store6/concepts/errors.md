# Errors and failure handling

Canonical page: https\://store.mobilenativefoundation.org/docs/store6/concepts/errors

Markdown: https\://store.mobilenativefoundation.org/llms/store6/concepts/errors.md

Source kind: site-authored; source path: content/docs/store6/concepts/errors.mdx

The six StoreError variants, the StoreException get path, rendering served-stale failures, and why retries belong in your fetcher.

Store has one failure vocabulary and two delivery channels. On the observation path, `stream`
never throws: failures arrive in the flow as `StoreResult.Error` values carrying a structured
`StoreError`. On the value path, `get` throws a `StoreException` wrapping the same `StoreError`.
That is the one-failure-channel rule of [the read contract](https://store.mobilenativefoundation.org/llms/store6/concepts/read-contract.md).
`stream` emits and never throws. `get` throws and never emits. The maintenance operations
(`invalidate`, `clear`, and their namespace and global forms) use the same exception for their own
persistence failures. One vocabulary to learn, delivered the way each call shape demands.

## The six variants, and no seventh

`StoreError` is a sealed class with exactly six variants:

| Variant                  | When you see it                                                   |
| ------------------------ | ----------------------------------------------------------------- |
| `Fetch`                  | The configured fetcher failed to produce a value.                 |
| `Persistence`            | A persistence operation against the store's durable state failed. |
| `Conversion`             | A value could not be converted between representations.           |
| `FreshnessUnsatisfiable` | The requested freshness policy could not be satisfied.            |
| `Conflict`               | A write conflicted with authoritative server state.               |
| `Missing`                | No value exists for the key and none could be produced.           |

The variant set is frozen for the 6.x major. New failure kinds map into these categories through
their structured detail payloads rather than as new subclasses, which lets the hierarchy
bridge to an exhaustive Swift enum. An exhaustive `when`
over `StoreError` is safe to write, with no `else` branch, on Kotlin and on the bridged Swift side.
(The [Swift bridge guide](https://store.mobilenativefoundation.org/llms/store6/guides/swift.md) covers that side.)

```kotlin
users.stream(UserKey("42")).collect { result ->
    when (result) {
        is StoreResult.Loading -> showSpinner()
        is StoreResult.Data -> render(result.value)
        is StoreResult.Revalidated -> markFresh(result.age)
        is StoreResult.Error -> when (val error = result.error) {
            is StoreError.Fetch -> showRetry(error.message)
            is StoreError.Persistence -> showRetry(error.message)
            is StoreError.Conversion -> reportBug(error.message, error.cause)
            is StoreError.FreshnessUnsatisfiable -> showRetry(error.message)
            is StoreError.Conflict -> showConflict(error.message, error.serverMeta)
            is StoreError.Missing -> showEmpty(error.key)
        }
    }
}
```

The compiler verifies both matches cover every case, and the frozen variant set means a 6.x
upgrade will not break them.

One stream nuance to know before writing that collect: an `Error` frame terminates the observed
flow only in the `Freshness.MustBeFresh` initial cycle. Every other failure leaves the flow live,
and later results, including a successful refetch after invalidation, keep arriving. See
[Freshness policies](https://store.mobilenativefoundation.org/llms/store6/concepts/freshness.md).

## The message contract

Every `StoreError` message states three things: what was attempted, for which key or namespace,
and the likely fix. That contract is written into the API documentation of the hierarchy itself,
so a message that reaches your logs is designed to be actionable without reproducing the failure.

Two variants carry structure beyond the message:

* `Conflict.serverMeta` is the server-side `StoreMeta` describing the conflicting state, when the
  server provided one, and `null` otherwise.
* `Missing.key` is the `StoreKey` for which no value exists.

Match on those properties rather than parsing message text. The messages are for humans. The
structure is for code.

## The get path: StoreException

`StoreException` is a `RuntimeException` with two guarantees: its message is the wrapped error's
message, and its `error` property exposes the structured `StoreError`. Catch it, match on
`.error`, and never parse strings.

```kotlin
try {
    render(users.get(UserKey("42"), Freshness.MustBeFresh))
} catch (e: StoreException) {
    when (val error = e.error) {
        is StoreError.Missing -> showEmpty(error.key)
        else -> showRetry(e.message)
    }
}
```

The method contract on `get` names the cases in which it throws `StoreException`: fetching or
source-of-truth access failed, a concurrent `clear` removed the key while its fetch was in flight
(its waiters observe `StoreError.Missing`), `Freshness.LocalOnly` found no local value, or the
server reported deletion (`StoreError.Missing`).

One boundary deliberately sits outside this vocabulary: calling any operation on a closed store
fails with `IllegalStateException` and the message `Store is closed.`, not a `StoreError`. A
closed store is a lifecycle bug in the caller, not a data failure, and Store keeps the two
categories separate. See [Memory, eviction, and store lifecycle](https://store.mobilenativefoundation.org/llms/store6/concepts/memory-and-lifecycle.md).

## Where Missing comes from

`StoreError.Missing` has four producers, each pinned by the API contracts:

1. **`Freshness.LocalOnly` with nothing local.** `LocalOnly` never invokes the fetcher. When no
   value is resident and the source-of-truth probe finds nothing, the read fails `Missing`,
   without a `Loading` frame and without a fetcher call.
2. **A `clear` racing an in-flight fetch.** After `clear(key)` returns, an in-flight fetch that
   started before the clear can no longer commit. Its waiters observe `Missing`.
3. **A fetcher returning `FetcherResult.Deleted`.** A destructive remote deletion: the resident
   value is cleared, its freshness forgotten, streams and waiters receive `Missing`, and the
   deletion does not trigger an automatic refetch.
4. **An expert validator returning `Skip` with no resident value.** If you install a custom
   `FreshnessValidator` through the seam (an experimental surface), a `FetchPlan.Skip` decision
   with no resident value yields `Missing`: `get` throws, `stream` emits `Error`.

The first is a policy choice, the second a race resolved conservatively, the third a server
statement of fact, and the fourth an expert configuration. In every case the meaning is the same:
no value exists and none could be produced.

## Rendering `servedStale` errors

`StoreResult.Error` carries a second field, `servedStale`. It is `true` when an invalidated
resident value was served and its refresh failed under `Freshness.CachedOrFetch` or
`Freshness.StaleIfError`. It is `false` when no resident was served or the policy withheld it.

`servedStale = true` means your user still has usable content on screen. Render an error
affordance over that content (a banner, a toast, a retry chip). Do not blank the screen. The
stale value was served precisely so you would not have to.

```kotlin
// The Error branch of the collect above:
is StoreResult.Error -> {
    if (result.servedStale) {
        // The last-good value is still on screen. Layer the failure over it.
        showErrorBanner(result.error)
    } else {
        // Nothing was served alongside this failure.
        showErrorState(result.error)
    }
}
```

This is the visible half of the stale-while-revalidate asymmetry: after `invalidate`, a failed
refresh leaves the old content plus an error. After `clear`, it leaves an empty screen plus an
error, because you declared the old value unsafe to show. The full decision guide is
[Invalidate or clear](https://store.mobilenativefoundation.org/llms/store6/invalidate-vs-clear.md).

## Retries are yours, deliberately

The engine does not retry your fetcher. Zero retries, zero backoff, at zero configuration. One
demand cycle invokes the fetcher exactly once. A failure schedules no background retry. A later
call is new demand, not a continuation of the failed one.
[Important defaults](https://store.mobilenativefoundation.org/llms/store6/important-defaults.md) names the conformance test that pins all
three of those statements.

If you want retries (backoff, jitter, a circuit breaker), build them inside your fetcher, where
you control the policy and can see the transport-level failure that Store deliberately does not
interpret. From the engine's perspective a retrying fetcher is still exactly one fetch per demand
cycle, so deduplication and single-flighting are unaffected. The
[fetchers guide](https://store.mobilenativefoundation.org/llms/store6/guides/fetchers.md) collects retry patterns.

## Constructing errors in tests and extensions

> **Note**
>
> The constructors of `StoreError`, `StoreResult`, and `StoreException` are `internal`. The
> sanctioned construction door is the seam's `StoreResults` object, marked `@ExperimentalStoreApi`.
> For tests, `store6-testing` wraps the same door in `TestStoreResults` with test-friendly
> defaults. See [API tiers](https://store.mobilenativefoundation.org/llms/store6/concepts/api-tiers.md) for what the experimental marker
> commits to.

```kotlin
val error = TestStoreResults.fetchError(
    message = "GET /users/42 failed: HTTP 503. Check connectivity and retry.",
    cause = Exception("HTTP 503"),
)
val result = TestStoreResults.error(error, servedStale = false)
```

Both objects cover every `StoreResult` state and every `StoreError` variant: `loading()`,
`data(...)`, `revalidated(...)`, `error(...)`, and `exception(...)`, plus one factory per error
variant (`fetchError`, `persistenceError`, `conversionError`, `freshnessUnsatisfiable`,
`conflict`, and `missing`). The [testing guide](https://store.mobilenativefoundation.org/llms/store6/guides/testing.md) shows them at work
alongside the fakes and contract kits.

***

Source recorded 2026-08-10 · [`main@be470620`](https://github.com/matt-ramotar/Store6/commit/be47062070eba8f8a327279e9c5a68caa0ef06ca) · pre-6.0.0-alpha01
