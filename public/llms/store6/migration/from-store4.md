# Migrating from Store 4

Canonical page: https\://store.mobilenativefoundation.org/docs/store6/migration/from-store4

Markdown: https\://store.mobilenativefoundation.org/llms/store6/migration/from-store4.md

Source kind: site-authored; source path: content/docs/store6/migration/from-store4.mdx

> **Note**
>
> **In progress.** This page ships thin and will grow before GA. The Store 4 to Store 6 guide is a
> launch gate for 6.0.0, and the roadmap names a “Store 4 → 6 in an afternoon” guide as a GA
> deliverable. Until that worked port lands, this page identifies the supported starting point,
> routes the applicable work through the Store 5 migration material, and names what remains.

## Where you are starting from

Store 4 used `com.dropbox` packages. That history remains visible in Store 5's own
`StoreReadRequest` KDoc, which references
`com.dropbox.android.external.store4.impl.SourceOfTruth`.

Two release facts keep this path bounded:

* Store 5's early multiplatform release says concepts and usage were unchanged from Store 4.
* The Store 5 stable release describes its additions over Store 4 as having no breaking changes.

That means the Store 5 to Store 6 component map applies to a Store 4 codebase. You skip the Store
5-only rows instead of first migrating the application to Store 5.

## Rows of the Store 5 map that do not apply to you

Store 5 added `MutableStore`, `Validator`, fallback mechanisms, write-conflict resolution, and
`NoNewData` after Store 4. A Store 4 application has none of those additions to translate.

For a Store 4 holdout, per-call freshness policies and the journalled mutation path are new
capabilities to evaluate, not existing behaviors that must be ported. Use the
[component map](https://store.mobilenativefoundation.org/llms/store6/migration/component-map.md) for the rows that remain: Store, Fetcher,
SourceOfTruth, and Converter.

## The mapping that does apply

| Store 4-era responsibility | Store 6 path                                                                                   | Detail                                                                                                                                                                                                                                                     |
| -------------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fetcher                    | `fetcher { }`, `fetcherOfResult { }`, or the experimental seam `Fetcher`                       | A fetcher is the one required Store 6 builder input. See [Fetchers](https://store.mobilenativefoundation.org/llms/store6/guides/fetchers.md).                                                                                                              |
| Persister / SourceOfTruth  | The two-parameter persistence seam or a Room/SQLDelight adapter                                | See [Persistence](https://store.mobilenativefoundation.org/llms/store6/guides/persistence.md), [Room](https://store.mobilenativefoundation.org/llms/store6/room.md), and [SQLDelight](https://store.mobilenativefoundation.org/llms/store6/sqldelight.md). |
| Converter                  | No direct Store 6 analog. Conversion lives in the fetcher and persistence adapter callbacks.   | See the [component map](https://store.mobilenativefoundation.org/llms/store6/migration/component-map.md).                                                                                                                                                  |
| Read sites                 | `get(key, freshness)` for a point read, or `stream(key, freshness)` for an ongoing result flow | The request and response tables are in [Migrating from Store 5](https://store.mobilenativefoundation.org/llms/store6/migration/from-store5.md).                                                                                                            |

Store 5's KDoc preserves two Store 4-era read spellings: `store.fresh(key)` and
`store.cached(key, refresh = true)`. In Store 6:

* `store.fresh(key)` maps to `get(key, Freshness.MustBeFresh)` when the caller needs one fresh
  value.
* `store.cached(key, refresh = true)` maps to an ongoing `stream(key)` plus deliberate
  `invalidate(key)` when the caller requests a refresh. It is not a one-call mechanical rename.

The Store 6 builder side starts with the compiled quickstart shape:

```kotlin
val users = store<UserKey, User> {
    fetcher { key -> FakeApi.getUser(key.id) }
}
```

Inside the quickstart's stream collector, the result is handled exhaustively:

```kotlin
when (result) {
    is StoreResult.Loading -> println("Loading…")
    is StoreResult.Data -> println("Data(name=${result.value.name}, origin=${result.origin})")
    is StoreResult.Revalidated -> println("Revalidated(age=${result.age})")
    is StoreResult.Error -> println("Error(${result.error})")
}
```

A compilable Store 4 example remains pending until the worked migration is available. The two
Store 4-era spellings above come from the retained Store KDoc. Both Store 6 fences come
from the repository's executable quickstart.

## Coordinates and coexistence

Store 6 artifacts use the existing group `org.mobilenativefoundation.store` and packages under
`org.mobilenativefoundation.store6.*`. Nothing is published until 6.0.0-alpha01.

Store 4 has no equivalent coexistence guarantee. If the existing Store 4 dependency still resolves
in your build, keep it in place while adding the needed `store6-*` artifacts and moving one
complete screen at a time.

The formal 6.x coexistence and interop promise begins with Store 5: `store5.*` and `store6.*`
coordinates live side by side for the whole 6.x major, and `store6-store5-interop` is supported for
all of 6.x. No Store 4 artifact availability or Store 4 interop artifact is guaranteed. Plan each
Store 4 to Store 6 move as a complete screen boundary.

## What this page will grow into

Before GA, this page still needs three concrete artifacts:

1. A worked port of a small Store 4 setup covering its fetcher, persister, and read sites, sized to
   the roadmap's “in an afternoon” promise.
2. A symbol-level rename table verified against a real Store 4 project.
3. A migration checklist that can be completed without consulting release history.

Documentation is part of the GA gate. Until these items are complete, this page remains a thin
migration path.

Continue with [Migrating from Store 5](https://store.mobilenativefoundation.org/llms/store6/migration/from-store5.md), the
[component map](https://store.mobilenativefoundation.org/llms/store6/migration/component-map.md), and the
[Store 6 quickstart](https://store.mobilenativefoundation.org/llms/store6/quickstart.md).

***

Source recorded 2026-08-12 · [`main@c67a94ed`](https://github.com/matt-ramotar/Store6/commit/c67a94ed30460a35161c2cbc3e725f127caf055e) · pre-6.0.0-alpha01
