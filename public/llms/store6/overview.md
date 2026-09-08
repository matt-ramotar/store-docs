# Introduction

Canonical page: https\://store.mobilenativefoundation.org/docs/store6/overview

Markdown: https\://store.mobilenativefoundation.org/llms/store6/overview\.md

Source kind: site-authored; source path: content/docs/store6/overview\.mdx

Typed Kotlin Multiplatform reads with explicit origins, freshness, and failure states.

[Build your first store](https://store.mobilenativefoundation.org/llms/store6/quickstart.md)

[Review Important Defaults](https://store.mobilenativefoundation.org/llms/store6/important-defaults.md)

Store 6 coordinates network, persistence, and memory through one read contract. Start with a fetcher, then add only the persistence and projections your application needs.

**Fetcher-only Store**

```kotlin
val users = store<UserKey, User> {
  fetcher { key -> FakeApi.getUser(key.id) }
}
```

This store block is verbatim from the executable Quickstart module.

## Why Store 6?

Data that lives in more than one place (a network, a local database, and memory) has to be
coordinated: which copy is fresh, which boundary failed, and what a screen should render while a
fetch is in flight. Store 6 standardizes that coordination behind one typed read contract, so
application code stops re-implementing it around every endpoint.

You describe a key and a fetcher. Store handles single-flighting concurrent demand, staleness,
invalidation, and bounded memory. Every zero-config behavior is named and covered by a conformance
test. The `store6-*` coordinates publish side by side with Store 5 for the whole 6.x major, so you
can migrate one screen at a time.

Store 6 has these primary areas:

* **Core reads** (`store6-core`): the `stream` and `get` read contract, with explicit
  [origins, freshness, and failure states](https://store.mobilenativefoundation.org/llms/store6/concepts/read-contract.md).
* **Mutations** (`store6-mutations`, experimental): the
  [journalled write path](https://store.mobilenativefoundation.org/llms/store6/mutations.md) with optimistic overlays and acknowledgements.
* **Integrations**: [Room](https://store.mobilenativefoundation.org/llms/store6/room.md) and [SQLDelight](https://store.mobilenativefoundation.org/llms/store6/sqldelight.md)
  persistence adapters, and the [Compose](https://store.mobilenativefoundation.org/llms/store6/compose.md) extensions.
* **Migration**: [Store 5 interop and screen-by-screen migration](https://store.mobilenativefoundation.org/llms/store6/migration/from-store5.md)
  while both coordinate lines coexist.

## Start here

Choose the guide for what you need to add next.

* **Build your first store**

  Build a fetcher-backed Store and make the first read.

  [Quickstart](https://store.mobilenativefoundation.org/llms/store6/quickstart.md)

* **Important Defaults**

  See the freshness and failure behavior you get with zero configuration.

  [Important Defaults](https://store.mobilenativefoundation.org/llms/store6/important-defaults.md)

* **Read contract**

  Choose stream or point reads and interpret origins and lifecycle state.

  [Read contract](https://store.mobilenativefoundation.org/llms/store6/concepts/read-contract.md)

* **Fetchers and persistence**

  Add the two seams most applications need after the first store.

  [Fetchers](https://store.mobilenativefoundation.org/llms/store6/guides/fetchers.md) · [Persistence](https://store.mobilenativefoundation.org/llms/store6/guides/persistence.md)

* **Mutations** (Experimental)

  Adopt the journalled write path and its acknowledgement contract.

  [Mutations](https://store.mobilenativefoundation.org/llms/store6/mutations.md)

* **Migrate from Store 5**

  Move one Store 5 screen at a time while both major lines coexist.

  [Migration guide](https://store.mobilenativefoundation.org/llms/store6/migration/from-store5.md)

## Modules and targets

API tier and target coverage are separate. Experimental modules can still publish broad target
matrices, while adapter execution depends on the database runtime available on each target.

Read the [Stability](https://store.mobilenativefoundation.org/llms/store6/stability.md) policy and [API tiers](https://store.mobilenativefoundation.org/llms/store6/concepts/api-tiers.md) guidance for these classifications.

| Module                      | API tier     | Release target              | Targets                                                                                                       | Notes                                                    |
| --------------------------- | ------------ | --------------------------- | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `store6-core`               | Stable track | alpha01                     | Canonical 12                                                                                                  | The API is not frozen until the beta01 freeze candidate. |
| `store6-testing`            | Experimental | alpha01                     | Canonical 12                                                                                                  |                                                          |
| `store6-mutations`          | Experimental | alpha01                     | Canonical 12                                                                                                  |                                                          |
| `store6-compose`            | Experimental | alpha01, may slip one alpha | Canonical 12                                                                                                  |                                                          |
| `store6-sqldelight`         | Experimental | alpha01, may slip one alpha | Canonical 12 artifacts. Drivers run on Android, JVM, Apple, Linux, and Windows. JS and Wasm are compile-only. |                                                          |
| `store6-room`               | Experimental | alpha01, may slip one alpha | Android, JVM, iosArm64, iosSimulatorArm64, macosArm64, watchosArm64, tvosArm64, and linuxX64.                 |                                                          |
| `store6-devtools`           | Experimental | alpha02 (target)            | Canonical 12                                                                                                  |                                                          |
| `store6-devtools-inspector` | Experimental | alpha02 (target)            | Inspector 8                                                                                                   |                                                          |

Canonical 12: Android, JVM, iosArm64, iosSimulatorArm64, iosX64, macosArm64, watchosArm64, tvosArm64, JS, WasmJS, linuxX64, and mingwX64.

Inspector 8: Android, JVM, iosArm64, iosSimulatorArm64, iosX64, macosArm64, JS, and WasmJS.

Browse the [store6-core API reference](https://store.mobilenativefoundation.org/reference/store6-core/index.html) for the core surface.

## Community

* [Community resources](https://store.mobilenativefoundation.org/docs/community/overview): Talks and interviews spanning both Store
  generations.
* [GitHub](https://github.com/MobileNativeFoundation/Store): Issues and discussions for the Store
  project.

## llms.txt

[/llms.txt](https://store.mobilenativefoundation.org/llms.txt) is an index of the Store6 documentation. Individual Markdown pages and the
[complete Store6 guide corpus](https://store.mobilenativefoundation.org/llms-full.txt) provide context with recorded source information.
See [Agents and LLMs](https://store.mobilenativefoundation.org/llms/store6/agents/overview.md) to choose context or install the Store6 skill.

***

Source recorded 2026-08-12 · [`main@c67a94ed`](https://github.com/matt-ramotar/Store6/commit/c67a94ed30460a35161c2cbc3e725f127caf055e) · pre-6.0.0-alpha01
