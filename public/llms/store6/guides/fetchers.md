# Fetchers: results, errors, and conditional fetch

Canonical page: https\://store.mobilenativefoundation.org/docs/store6/guides/fetchers

Markdown: https\://store.mobilenativefoundation.org/llms/store6/guides/fetchers.md

Source kind: site-authored; source path: content/docs/store6/guides/fetchers.mdx

A fetcher connects Store to a backend. It accepts a key and produces either a
value or a result describing the outcome. Store owns residence, persistence, freshness,
and result delivery around that call. Your fetcher owns the backend request and any retry or
fallback policy inside it.

## The fetcher is the one required input

Every store must register a fetcher before it is built. Calling `store<K, V> { }` without one
throws `IllegalArgumentException` with this message:

`store<K, V> { } requires a fetcher { }, fetcherOfResult { }, or fetcher(Fetcher) block.`

Installing persistence does not satisfy this requirement. Even
[`Freshness.LocalOnly`](https://store.mobilenativefoundation.org/llms/store6/concepts/freshness.md), which never invokes the fetcher, still
requires one at build time. `LocalOnly` can read a resident value or probe the configured source of
truth once, but an absent local value becomes `StoreError.Missing` without a fetch.

The compiled [quickstart](https://store.mobilenativefoundation.org/llms/store6/quickstart.md) uses the smallest registration form:

```kotlin
val users = store<UserKey, User> {
    fetcher { key -> FakeApi.getUser(key.id) }
}
```

## Three install points, last registration wins

`StoreBuilder` exposes three ways to install the one fetcher a store will use:

* `fetcher { key -> value }` is success-or-throw sugar. A returned value becomes
  `FetcherResult.Success`. A thrown exception follows the store's fetch-failure path.
* `fetcherOfResult { key -> result }` lets the lambda return any `FetcherResult`. Its name follows
  the Store 5 `Fetcher.ofResult` form.
* `fetcher(fetcher)` installs the regular-interface `Fetcher<K, V>` seam. This overload is
  experimental and is the only form that receives a conditional-request ETag from Store.

An application with an API and a seam fetcher can use these call shapes:

```kotlin
val plainUsers = store<UserKey, User> {
    fetcher { key -> api.getUser(key.id) }
}

val resultUsers = store<UserKey, User> {
    fetcherOfResult { key ->
        FetcherResult.Success(api.getUser(key.id))
    }
}

@OptIn(ExperimentalStoreApi::class)
val conditionalUsers = store<UserKey, User> {
    fetcher(conditionalUserFetcher)
}
```

Each registration replaces the previously registered fetcher. If a builder calls two or all
three forms, only the last one is installed. Registrations do not compose a fallback chain.

> **Note**
>
> The lambda `fetcher` and `fetcherOfResult` members are stable builder surface. The regular-interface
> overload and `Fetcher` itself are `@ExperimentalStoreApi`. Calling that overload requires the
> experimental opt-in. Implementing `Fetcher` also requires the `DelicateStoreApi` subclass opt-in.
> See [API tiers](https://store.mobilenativefoundation.org/llms/store6/concepts/api-tiers.md) and the
> [stability policy](https://store.mobilenativefoundation.org/llms/store6/stability.md) before adopting the seam.

`Fetcher` is deliberately a regular interface rather than a `fun interface`. A lambda passed to
`fetcher(...)` therefore keeps resolving to the stable success-or-throw overload instead of the
experimental seam overload.

## The FetcherResult vocabulary

`FetcherResult` is a sealed interface with exactly four kinds:

| Result                 | Meaning                                                                                                  |
| ---------------------- | -------------------------------------------------------------------------------------------------------- |
| `Success(value, etag)` | A fetched value and an optional ETag. `etag` defaults to `null`.                                         |
| `NotModified(etag)`    | The resident value is still current. `etag` defaults to `null`, which keeps the previously recorded tag. |
| `Error(cause)`         | The fetch failed. It is equivalent to throwing `cause` from the fetcher.                                 |
| `Deleted`              | The server reports that the value no longer exists.                                                      |

The result type carries no experimental annotation because the stable `fetcherOfResult` member
returns it. It is the seam result vocabulary that callers can use without opting into the
regular-interface `Fetcher`.

Fetch failures become `StoreError.Fetch` on the read paths. See
[Errors and failure handling](https://store.mobilenativefoundation.org/llms/store6/concepts/errors.md) for how `stream` and `get` deliver that
error differently.

## Conditional fetch: ETags and the Revalidated frame

The seam fetcher is one suspend call with a nullable ETag:

```kotlin
public suspend fun fetch(
    key: K,
    etag: String?,
): FetcherResult<V>
```

Store passes a non-null `etag` if and only if its freshness validator selected a conditional fetch
plan. Otherwise the argument is `null`. Returning `FetcherResult.NotModified` tells Store that the
resident value remains current. Store refreshes its metadata and uses the returned ETag, or keeps
the previously recorded tag when `NotModified.etag` is `null`.

A successful not-modified response emits exactly one `StoreResult.Revalidated(age)` frame and
clears durable staleness. It does not emit a redundant `Data` frame because no new value was
fetched. If there is no resident value to revalidate, `NotModified` produces
`StoreError.Missing`. The [read contract](https://store.mobilenativefoundation.org/llms/store6/concepts/read-contract.md) shows why consumers
must handle `Revalidated` alongside `Loading`, `Data`, and `Error`.

The two builder lambdas accept only a key. Neither `fetcher { }` nor `fetcherOfResult { }` receives
the ETag selected by a conditional plan. Use the seam interface when the backend request itself
needs Store's conditional-request ETag.

## Deleted: server-reported deletion

Return `FetcherResult.Deleted` when the server says the requested value no longer exists. Store
destructively clears the resident value, forgets its freshness metadata, and reports
`StoreError.Missing` to streams and waiters. The deletion does not schedule an automatic refetch.

`Deleted` is a statement from the backend. Caller-driven removal uses `clear`, whose race and
stream behavior are covered in [Invalidate or clear](https://store.mobilenativefoundation.org/llms/store6/invalidate-vs-clear.md).

## Where retry policy lives

The engine performs zero retries and zero backoff. One demand cycle invokes the configured fetcher
exactly once. A failure schedules no background retry, and a later Store call is new demand rather
than a continuation of the failed call.

Put retries, backoff, circuit breaking, and fallback endpoints inside the fetcher body. The
following pattern is illustrative. `BackendFailure` and its `retryable` property are application
types, not Store APIs. Coroutine cancellation must remain outside that exception hierarchy so it
continues to propagate.

```kotlin
fetcherOfResult { key ->
    try {
        FetcherResult.Success(primaryApi.getUser(key.id))
    } catch (primaryFailure: BackendFailure) {
        if (!primaryFailure.retryable) {
            FetcherResult.Error(primaryFailure)
        } else {
            try {
                FetcherResult.Success(secondaryApi.getUser(key.id))
            } catch (terminalFailure: BackendFailure) {
                FetcherResult.Error(terminalFailure)
            }
        }
    }
}
```

From Store's perspective, that entire policy is still one fetcher invocation for the demand cycle.
The application decides which backend failures are retryable, how long to wait, and when a
fallback is safe.

## Fetcher boundaries

A fetcher implementation must cooperate with coroutine cancellation. It must not write Store
residence, persistence, or bookkeeping directly. Return one `FetcherResult` from the suspend call
and let the engine apply the result.

There is no multi-emission fetcher. If a push or streaming source produces later values, write
those values through the configured source-of-truth instance instead. Its active readers observe
changes made through that instance, and the resulting `Data` is attributed `Origin.SOT`. The
[persistence guide](https://store.mobilenativefoundation.org/llms/store6/guides/persistence.md) covers the source-of-truth contract. Reactivity
to changes made through another source-of-truth instance is implementation-specific.

For conditional-fetch tests, `FakeFetcher` records every invocation, including the nullable `etag`
that the engine passed. This makes unconditional and conditional plans directly assertable. The
[testing guide](https://store.mobilenativefoundation.org/llms/store6/guides/testing.md) covers its scripted result queues and invocation
records.

> **Tip**
>
> **Next:** [Mutations](https://store.mobilenativefoundation.org/llms/store6/mutations.md) builds on this fetch contract with optimistic, durable
> writes.

***

Source recorded 2026-08-12 · [`main@539614c0`](https://github.com/matt-ramotar/Store6/commit/539614c06be1a8f20dead562585e47394551ebae) · pre-6.0.0-alpha01
