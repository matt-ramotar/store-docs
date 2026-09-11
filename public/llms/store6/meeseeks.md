# Meeseeks

Canonical page: https\://store.mobilenativefoundation.org/docs/store6/meeseeks

Markdown: https\://store.mobilenativefoundation.org/llms/store6/meeseeks.md

Source kind: site-authored; source path: content/docs/store6/meeseeks.mdx

Connect Store6 mutation drains to Meeseeks scheduling.

How can an offline Store6 edit keep moving after the user leaves the app? The
[background-work guide](https://store.mobilenativefoundation.org/llms/store6/mutations/background-work.md) explains why a mutation drain needs
execution opportunities outside the call that recorded the mutation. `mutations-drain-meeseeks`
connects those opportunities to Meeseeks. The Store6 mutation journal remains the record of what must
be pushed and what has been acknowledged.

Consider one offline profile edit. `mutate` appends the edit to a durable journal, and the UI can show
the optimistic value. The user then leaves the app. A later host or OS grant lets a
Meeseeks worker run the coordinator, which drains the journal and adopts the server acknowledgement.
When the app opens again, the UI reads the journal-backed pending state and the confirmed value. The
worker finishing does not itself prove that the mutation was acknowledged.

> **Warning**
>
> `mutations-drain-meeseeks` is an optional experimental artifact targeted for `6.0.0-alpha02`.
> [Upstream JVM scheduling fixes remain required](https://github.com/matt-ramotar/Store6/blob/b123c95a373f3629c23e797cb97e2bca18bb260a/STABILITY.md#L60).
> The candidate README uses a `6.0.0-SNAPSHOT` coordinate. That line does not establish that an artifact
> is available, so this guide does not provide a dependency declaration.

## Before you start

Prepare the host-owned pieces before adding the adapter:

* A fully constructed `MutationStore` from the
  [mutations quickstart](https://store.mobilenativefoundation.org/llms/store6/mutations/quickstart.md), with
  [journal storage](https://store.mobilenativefoundation.org/llms/store6/mutations/journal-storage.md) that survives process death. The default
  in-memory journal loses pending intent when the process ends.
* One stable coordinator registration name, such as `com.example.users`. Meeseeks persists that name
  in `StoreDrainPayload`, so the host must register the reconstructed store under the same name on a
  later launch.
* An application-owned `CoroutineScope` whose lifetime covers the coordinator watch.
* One host-owned Meeseeks `BGTaskManager`. Reuse the manager already initialized by the application
  instead of creating an adapter-specific manager.
* The required Android or iOS host configuration described below.

The candidate module declares Android, JVM, `iosArm64`, `iosSimulatorArm64`, `iosX64`, and JS targets
in its [build configuration](https://github.com/matt-ramotar/Store6/blob/b123c95a373f3629c23e797cb97e2bca18bb260a/mutations-drain-meeseeks/build.gradle.kts#L8-L21).
A larger `commonMain` target matrix cannot resolve this artifact for targets it does not publish.
JVM consumers also need Java 17 because Meeseeks 1.1.1 publishes Java 17 bytecode and exposes a public
inline API. The candidate module sets `jvmToolchain(17)` for that reason. Its publication metadata
declares `mutations-drain-meeseeks` as the
[artifact id](https://github.com/matt-ramotar/Store6/blob/b123c95a373f3629c23e797cb97e2bca18bb260a/mutations-drain-meeseeks/gradle.properties#L1-L2)
under the repository's
[`org.mobilenativefoundation.store` group](https://github.com/matt-ramotar/Store6/blob/b123c95a373f3629c23e797cb97e2bca18bb260a/gradle.properties#L11).

## How the adapter fits

The adapter has one narrow job. It maps a scheduled activation onto a bounded mutation drain:

1. The host or operating system gives Meeseeks an execution opportunity.
2. Meeseeks dispatches `StoreDrainWorker` with a `StoreDrainPayload` containing the stable store name.
3. The worker passes that name through `MeeseeksDrainScheduler` to its attached
   `MutationDrainCoordinator`.
4. The coordinator invokes a bounded `MutationStore.drain` pass for the registered store.
5. The mutation engine writes acknowledgement progress and remaining intent to the Store6 journal.
   The coordinator then derives whether another activation is needed from that journal state.

`mutations-drain-meeseeks` never initializes Meeseeks and does not own the mutation transport or
connectivity monitoring. The host owns those concerns. Store6 owns mutation state in its journal,
while Meeseeks owns scheduling state. A successful worker result can mean that no nonterminal intent
remains, or that remaining work already received a follow-up schedule. Dead letters are terminal and
may still exist. Use journal inspection to decide whether the edit settled.

## Wire the host

Construct `MeeseeksDrainScheduler` before initializing Meeseeks, then return the same
`BGTaskManager` from its `manager` lambda for the scheduler's entire lifetime. Inside the host's one
`Meeseeks.initialize` block, register `StoreDrainPayload` with `StoreDrainWorker`. If the application
already has a manager and other workers, add this registration to that existing block.

The following is the candidate's compile-only JVM host wiring body. It expects host-provided
`appContext`, the fully constructed `users` store, and `scope`. The
[complete source fixture](https://github.com/matt-ramotar/Store6/blob/b123c95a373f3629c23e797cb97e2bca18bb260a/mutations-drain-meeseeks/src/jvmTest/kotlin/org/mobilenativefoundation/store6/mutations/drain/meeseeks/docs/MeeseeksWiringDocsSnippet.kt)
contains its exact imports. The function is not a runtime test and must not be invoked as one.

Apply `@OptIn(ExperimentalStoreApi::class)` to the enclosing host function, or use
`@file:OptIn(org.mobilenativefoundation.store6.core.ExperimentalStoreApi::class)` before the
file's package declaration. The source fixture supplies that file-level opt-in. The annotation
inside the copied region applies only to the following local declaration.

```kotlin
@OptIn(ExperimentalStoreApi::class)   // required: the whole module is experimental
lateinit var bgTaskManager: BGTaskManager
val drainScheduler = MeeseeksDrainScheduler(manager = { bgTaskManager })
bgTaskManager =
    Meeseeks.initialize(appContext) {
        register<StoreDrainPayload> { workerContext ->
            StoreDrainWorker(workerContext, drainScheduler)
        }
    }
val coordinator = mutationDrainCoordinator(drainScheduler)
coordinator.register(
    "com.example.users",
    users,
    DrainPolicy(
        constraints = DrainConstraints(
            requiresNetwork = false,
            requiresCharging = false,
        ),
    ),
)
val watch = scope.launch { coordinator.watch("com.example.users") }
scope.launch { coordinator.runActivation("com.example.users") }
```

The two constraint flags are `false` because Meeseeks does not support Store6 network or charging
constraints on JVM. The last launch represents a host-owned activation such as application start or
reconnect. It is separate from `watch`, so a foreground reconnect can retry pending work even when
no new mutation is enqueued.

Meeseeks 1.1.1 initializes on JVM, but the candidate records unresolved Quartz execution and
recovery failures. Scheduled tasks do not execute with its bundled Quartz store, and a recovery scan
can fail when the Meeseeks database contains a payload type that the current process did not
register. The candidate's
[`jvmTest` configuration](https://github.com/matt-ramotar/Store6/blob/b123c95a373f3629c23e797cb97e2bca18bb260a/mutations-drain-meeseeks/build.gradle.kts#L44-L58)
excludes the two integration suites that exercise these paths unless an opt-in Gradle property is
set. Use `InProcessDrainScheduler` for a JVM host until those upstream failures are resolved.

## Android setup

Place the manager and coordinator at application scope. The Android `Application` initializes
Meeseeks, registers `StoreDrainPayload`, implements WorkManager's `Configuration.Provider`, and adds
`MeeseeksWorkerFactory` to a `DelegatingWorkerFactory`. Register the reconstructed mutation store
before starting its coordinator watch.

The candidate README contains the
[full Android host example](https://github.com/matt-ramotar/Store6/blob/b123c95a373f3629c23e797cb97e2bca18bb260a/mutations-drain-meeseeks/README.md#L86-L122).
It follows the
[Meeseeks 1.1.1 Android guide](https://github.com/matt-ramotar/meeseeks/blob/171c1a1301f7486b53b881cdcfaac6767c273276/docs/platforms/android.md).
The candidate source documents that setup. It does not record an Android device run. Android
supports the adapter's `requiresNetwork` and `requiresCharging` constraints. WorkManager may still
defer an eligible request under Doze, App Standby, or other background restrictions. The durable
mutation journal is what lets a later execution opportunity resume from the same pending intent.

## iOS setup

Initialize one application-scoped manager and register `StoreDrainPayload` as shown in the
[candidate iOS setup](https://github.com/matt-ramotar/Store6/blob/b123c95a373f3629c23e797cb97e2bca18bb260a/mutations-drain-meeseeks/README.md#L124-L161).
Complete the host configuration in the
[Meeseeks 1.1.1 iOS guide](https://github.com/matt-ramotar/meeseeks/blob/171c1a1301f7486b53b881cdcfaac6767c273276/docs/platforms/ios.md),
including the app refresh and processing background modes. Add both Meeseeks identifiers to
`BGTaskSchedulerPermittedIdentifiers`:

```xml
<key>BGTaskSchedulerPermittedIdentifiers</key>
<array>
    <string>dev.mattramotar.meeseeks.task.refresh</string>
    <string>dev.mattramotar.meeseeks.task.processing</string>
</array>
```

iOS supports the adapter's network and charging constraints, but `BGTaskScheduler` decides when an
eligible task receives an execution opportunity. Those grants are best-effort, and force-quit can
suppress them until the next user open. Background activations also do not run while the app is in
the foreground. Connect an application-active or reachability signal to
`coordinator.runActivation("com.example.users")` so a reconnect without a new edit can make progress.
On the next user open, reconstruct the durable store, register the same name, then start the watch or
run reconciliation. No iOS device verification is recorded for this setup.

## Platform behavior

| Platform | Scheduler         | Store6 constraint handling                                                     | Practical boundary                                                                                                                                             |
| -------- | ----------------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Android  | WorkManager       | `requiresNetwork` and `requiresCharging` are supported.                        | WorkManager defers work until constraints and system background policy allow it. Doze and app restrictions can extend the delay.                               |
| iOS      | `BGTaskScheduler` | `requiresNetwork` and `requiresCharging` are supported.                        | The operating system grants best-effort execution opportunities. Foreground reconnect and recovery after force-quit need a host trigger or the next user open. |
| JVM      | Quartz            | Network and charging constraints are unsupported and fail during registration. | Meeseeks 1.1.1 has known scheduled-execution gaps and recovery gaps with foreign payloads. Prefer `InProcessDrainScheduler`.                                   |
| JS       | Meeseeks runner   | Network and charging constraints are unsupported and fail during registration. | There is no background lifetime beyond the live page or process. Prefer `InProcessDrainScheduler`.                                                             |

The adapter forwards the two properties exposed by Store6 `DrainConstraints`. It does not expose
every Meeseeks precondition or scheduling option. An iOS execution opportunity may be deferred or
never granted, and a platform activation may overlap with another host trigger. Do not treat this
candidate as a verified cross-platform at-least-once delivery guarantee or as proof that overlapping
activations are safe on every platform. The Store6 journal and an idempotent mutation endpoint remain
the correctness boundary.
The [server guide](https://store.mobilenativefoundation.org/llms/store6/mutations/server.md) defines that endpoint contract.

## Recovery and troubleshooting

### The worker reports an unknown registration

Reconstruct the `MutationStore`, construct the scheduler, and initialize Meeseeks with
`register<StoreDrainPayload>`. Then attach the coordinator and immediately register the store under
the persisted name before starting `watch`. Without the payload registration, Meeseeks cannot
dispatch `StoreDrainWorker`. Once the coordinator is attached, a worker that arrives before store
registration receives `DrainPassOutcome.Unavailable`, which maps to
`TaskResult.Failure.Transient`. An activation before coordinator attachment instead fails because
the scheduler is not attached. Complete host reconstruction before accepting activations, and
preserve the journal for a later attempt.

### An old task no longer finds its store

Registration names are persisted in `StoreDrainPayload`. Keep the name stable across releases. A
rename does not rewrite already persisted scheduler payloads.

### Foreground reconnect does nothing

`watch` reacts to a new `MutationEnqueued` event. A reconnect without another edit needs an explicit
`runActivation` from the host's application-active or reachability hook. Call it outside
`MutationServer`, mutator, conflict-policy, source-of-truth, and watch-handler code because the drain
path uses a non-reentrant per-store mutex.

### Registration rejects the default constraints

`DrainConstraints` defaults `requiresNetwork` to `true`. JVM and JS reject that constraint during
`coordinator.register` instead of silently dropping it. Set both flags to `false` only when that is
correct for the host, or use `InProcessDrainScheduler`.

### Pending work disappears after restart

The default mutation journal is in memory. Install durable journal storage before relying on process
restart, reboot, or a later OS grant. Meeseeks scheduling persistence cannot recreate
mutation intent that Store6 did not persist.

### JVM recovery fails while listing tasks

The candidate records a Meeseeks 1.1.1 failure when its database contains a payload type that the
current process has not registered. `listTasks` throws `IllegalArgumentException` with
`Unknown payload type id`, which prevents the adapter recovery scan from reaching its Store6 task.
This is unresolved. Use `InProcessDrainScheduler` rather than relying on JVM scheduled recovery.

### The worker succeeds while work remains

`TaskResult.Success` can mean the drain cleared or that the coordinator already scheduled a later
pass for remaining work. It can also coexist with dead letters because dead letters are terminal.
Read `pendingWrites()` and `deadLetters()` to determine the mutation state. A worker result is neither
a server receipt nor a settlement signal.

### Scheduling appears duplicated

The scheduler tracks a logical pending slot per store name, but recovery can find multiple platform
tasks for that name. A tracked slot does not establish one worker invocation per mutation. Keep the
server idempotent, inspect the Store6 journal after each pass, and verify overlapping activations on
each platform the application uses.

## Verify your host

Run the complete user journey in the application that owns the manager and mutation store:

1. Disable connectivity, enqueue an edit, and confirm that `pendingWrites()` contains the durable
   intent before ending the process.
2. Restore connectivity while the app is foregrounded without creating another edit. Trigger the
   application-active or reachability hook and confirm that the existing intent is drained.
3. Repeat the offline edit, leave the app, and reopen it. Confirm that reconstruction uses the same
   journal and registration name before the first activation.
4. Cancel or unregister while an activation is pending, then inspect its durable phase,
   `pendingWrites()`, and `deadLetters()`. Re-register and activate again to prove recovery without
   discarding intent. An in-flight pass may have advanced the journal before cancellation.
5. On an actual Android or iOS device, wait for a background execution opportunity under the intended
   network and charging conditions. A simulator command or compile check does not prove that the OS
   will grant background time in production.
6. After every activation, inspect `pendingWrites()` and `deadLetters()`. Backend receipts and the
   confirmed UI value should agree with those journal-backed facts.

The JVM fixture establishes the wiring shape only. Compilation does not establish scheduled
execution, process recovery, cancellation behavior on a device, or an OS background grant.

Use [Inspection and observability](https://store.mobilenativefoundation.org/llms/store6/mutations/inspection.md) to make journal-backed mutation
state the final check.
