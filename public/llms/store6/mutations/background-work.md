# Background work

Canonical page: https\://store.mobilenativefoundation.org/docs/store6/mutations/background-work

Markdown: https\://store.mobilenativefoundation.org/llms/store6/mutations/background-work.md

Source kind: site-authored; source path: content/docs/store6/mutations/background-work.mdx

Schedule pending mutation work across connectivity and application lifetimes.

A user edits a record while the device is offline. The application can keep that edit visible and
queue it locally, but the screen may disappear before connectivity returns. The queued intent needs
two things to make progress later: storage that survives the required lifetime and a new execution
opportunity after the network or application state changes.

> **Note**
>
> **Experimental integration.** This guide describes `mutations-drain` in the Store6
> source revision linked below. The artifact targets alpha02 and is outside the
> alpha01 publication roster. The target does not establish artifact availability.

Source: [Store6 `b123c95a373f3629c23e797cb97e2bca18bb260a`](https://github.com/matt-ramotar/Store6/tree/b123c95a373f3629c23e797cb97e2bca18bb260a/mutations-drain).

## What background work means here

Store separates the work that notices demand from the work that advances pending mutations. The
three execution paths have different triggers and lifetimes:

| Work                          | Trigger                                                                                             | Lifetime and boundary                                                                                                                                                                                         |
| ----------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cache revalidation            | A read or stream creates new demand under its read policy.                                          | Runs in the Store engine's coroutine lifecycle and may continue after a stale read returns. It does not install an operating-system job or survive the process by itself.                                     |
| One explicit mutation drain   | Application code calls a drain for one key or all durable identities.                               | A bounded foreground call. It may run in a screen-independent application scope or inside a worker, but the call does not create a later wake-up by itself.                                                   |
| Scheduled mutation activation | A scheduler later invokes a coordinator pass, which runs a mutation drain for the registered store. | The scheduler supplies the execution opportunity. An in-process scheduler ends with its process and scope. A platform scheduler may receive a later operating-system grant, subject to that platform's rules. |

Calling a drain a foreground pass describes the bounded API call, not the visual state of the app.
A worker can invoke the same pass while the app has no active screen.

## Follow an offline edit

The full path from a local edit to confirmed state is:

1. A user edits while offline. The mutation store records the intent in its journal and can project
   the change into the UI.
2. If that intent must survive process death, the application uses durable journal storage. The
   default in-memory journal survives only while its object and process remain alive. A scheduler
   cannot reconstruct intents that were lost with that memory.
3. The user leaves the app. Any collection, timer, or coroutine owned by the departed screen can end
   with it.
4. On reconstruction, the host opens the same durable journal, rebuilds the mutation store, and
   registers the same stable store name. A foreground launch or reconnect hook, or a supported
   background grant, then supplies an execution opportunity.
5. The coordinator invokes one bounded mutation drain.
6. The mutation engine adopts the server acknowledgement according to its durable receipt contract.
   A worker invocation completing successfully does not by itself mean that a mutation was
   acknowledged or that no work remains.
7. The UI reads confirmed data and durable pending-write state. See [Pending-write UI](https://store.mobilenativefoundation.org/llms/store6/mutations/pending-write-ui.md)
   for the distinction between an optimistic projection and confirmed state.

The [journal storage guide](https://store.mobilenativefoundation.org/llms/store6/mutations/journal-storage.md) covers the durable storage
requirement. [Draining, offline, and restart](https://store.mobilenativefoundation.org/llms/store6/mutations/drain-and-restart.md) defines the
mutation engine's drain and replay behavior.

## Choose a trigger

Choose triggers for the lifetimes in which work must progress. More than one trigger can point to
the same registered store, but each has a different source of execution:

| Trigger                                     | Use it for                                                                                       | Boundary                                                                                                                                                                                             |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Explicit foreground or reconnect activation | Application launch, return to the foreground, or a host-observed reachability change.            | The host supplies the signal and calls `runActivation(storeName)`. Connectivity monitoring is outside `mutations-drain`.                                                                             |
| Launch and enqueue watching                 | Recovery when a store is registered and immediate handling of later journal enqueues.            | Launch `watch(name)` in an application-owned scope. It performs an unconditional launch pass, then observes enqueues only while that coroutine and process remain alive.                             |
| `InProcessDrainScheduler`                   | Tests and hosts whose delayed activations need only the current process.                         | Timers run in the supplied `CoroutineScope`. Cancellation or process death ends them. The scheduler accepts but does not evaluate `DrainConstraints`.                                                |
| Meeseeks-backed activation                  | A supported Android or iOS scheduling grant that may arrive after the original process lifetime. | The host initializes the platform scheduler and reconstructs the registered store before work can run. JVM and JS do not gain post-process execution from this adapter. Platform limits still apply. |

The host owns application-active and reachability signals. Meeseeks is optional. Use the
[Meeseeks integration](https://store.mobilenativefoundation.org/llms/store6/meeseeks.md) when the host needs platform-backed activations.

## Register and run a store

Start with a fully constructed mutation store. The [mutation quickstart](https://store.mobilenativefoundation.org/llms/store6/mutations/quickstart.md)
builds that store, while [Journal storage](https://store.mobilenativefoundation.org/llms/store6/mutations/journal-storage.md) shows how to give
its pending intents a durable lifetime. In this example, `users` is that `MutationStore` and
`scope` is the host's application-owned `CoroutineScope`. The scope must outlive any screen whose
departure should not stop the watch or its in-process timers.

The relevant source imports are `kotlinx.coroutines.CoroutineScope`,
`kotlinx.coroutines.launch`,
`org.mobilenativefoundation.store6.core.ExperimentalStoreApi`,
`org.mobilenativefoundation.store6.mutations.MutationStore`,
`org.mobilenativefoundation.store6.mutations.drain.InProcessDrainScheduler`, and
`org.mobilenativefoundation.store6.mutations.drain.mutationDrainCoordinator`.

Place this body inside a suspending function or coroutine because `runActivation` suspends.
Apply `@OptIn(ExperimentalStoreApi::class)` to the enclosing function, or use
`@file:OptIn(org.mobilenativefoundation.store6.core.ExperimentalStoreApi::class)` before the
file's package declaration. The source fixture supplies that file-level opt-in. The annotation
inside the copied region applies only to the following local declaration.

```kotlin
@OptIn(ExperimentalStoreApi::class)   // required: the whole module is experimental
val coordinator = mutationDrainCoordinator(InProcessDrainScheduler(scope))
coordinator.register("com.example.users", users)
val watch = scope.launch { coordinator.watch("com.example.users") }
coordinator.runActivation("com.example.users")
```

`watch` is a long-running suspending operation, so launch it as a coroutine. The explicit
`runActivation` supplies one immediate pass without waiting for another enqueue.

Registration names are persisted in scheduler payloads. Choose a stable package-like name that
matches `[A-Za-z0-9._-]{1,64}` and reuse it across application launches and updates. Renaming a
registration leaves old payloads unable to find the store under their original name. The new
registration can still recover journal work through its launch pass or `reconcile()`.

Keep the returned `watch` job so the host can cancel it. `unregister(name)` cancels that
registration's active watch and tracked pending activation. `coordinator.close()` cancels active
watches, but it does not close registered mutation stores or cancel pending scheduler activations,
including persisted activations that may outlive the process. Cancel the application scope and
close the mutation store according to their separate owners.

## Recover pending work

Startup recovery begins by reconstructing the mutation store over the same journal. Register it
under the same name before accepting scheduler activations. Starting `watch(name)` subscribes to
enqueue events before running an unconditional launch pass, so work already present in the journal
does not need a new enqueue to be noticed.

If the host does not start a watch for every store, `reconcile()` makes one unconditional pass over
each registered store that is not already mid-pass. This includes retirement-checkpoint work that
is invisible to `pendingWrites()`. A queue that appears empty can therefore still need a
reconciliation pass.

A reconnect can also happen without a new write. Call `runActivation(storeName)` from the host's
application-active or reachability hook to supply that missing pass. Call it outside the drain
stack. Invoking it from a `MutationServer`, mutator, conflict policy, `SourceOfTruth`
implementation, or watch event handler deadlocks on the coordinator's non-reentrant per-store
mutex.

## Retries, cancellation, and progress

`DrainPolicy.drainOnEnqueue` defaults to `true`. In that mode, `watch` responds to observed enqueues
with immediate in-process passes. Enqueues that arrive during a pass are conflated and cause at
most one further pass. This fast path omits the pre-pass persisted safety activation. It therefore
does not establish that every enqueue has a durable wake-up. With `drainOnEnqueue = false`, the
watcher requests a scheduled activation with zero initial delay.

Three separate responsibilities determine when pending work runs and whether replay is safe:

| Responsibility                   | What it controls                                                                                                                                                     |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Coordinator scheduling backoff   | When the scheduler should provide another activation after a pass leaves journal work.                                                                               |
| Mutation eligibility             | Whether a pending identity is eligible for a transport attempt during a global drain. The mutation engine owns this pacing.                                          |
| Replay and transport idempotency | What happens when remote acceptance is uncertain and the same immutable generation must be sent again with the same `idempotencyKey`. The server owns this contract. |

Do not use scheduling backoff as a substitute for an idempotent endpoint. If the backend accepts a
push but the local acknowledgement receipt does not commit, cancellation or process death can
leave the durable generation `INFLIGHT`. A later drain may replay it. The
[MutationServer guide](https://store.mobilenativefoundation.org/llms/store6/mutations/server.md) defines this acknowledgement crash window.

Cancellation propagates from a drain pass. When a safety activation was successfully persisted
before that pass, it remains a hint for later execution. A scheduling request can still fail, and
an operating system can defer or suppress work. Treat neither scheduling nor worker completion as
settlement proof. A platform activation can overlap with a host trigger. Keep the mutation endpoint
idempotent and derive completion from the journal.

Inspect `pendingWrites()` for nonterminal intents and `deadLetters()` for terminal failures. Those
journal-backed snapshots are the state to use for recovery and UI decisions. Coordinator and
mutation `events` are advisory in-process feeds. They have no replay and may drop old entries, so
event delivery is not acknowledgement, retry, or settlement truth. See
[Inspecting mutations](https://store.mobilenativefoundation.org/llms/store6/mutations/inspection.md) for the complete inspection surface.

## Verify the integration

Exercise each trigger and lifetime that the application depends on:

1. Queue a mutation before starting the coordinator, then launch the watch. Confirm that the
   unconditional launch pass finds the existing intent.
2. Leave work pending, restore connectivity without enqueueing another mutation, and invoke the
   host reconnect hook. Confirm that a pass runs.
3. Cancel a pass at the transport and local receipt boundaries. Reopen inspection and confirm that
   the next trigger resumes from the durable phase instead of assuming settlement.
4. Close the store, reopen a new store over the same durable storage, register the same name, and
   confirm recovery after a launch pass. Repeat this on real platform storage and through actual
   process termination when process-death recovery is a requirement.
5. After the backend acknowledgement and local completion, confirm that `pendingWrites()` is empty
   and inspect `deadLetters()` rather than inferring completion from a worker result or event.

The candidate source contains an executable
[quickstart fixture](https://github.com/matt-ramotar/Store6/blob/b123c95a373f3629c23e797cb97e2bca18bb260a/mutations-drain/src/commonTest/kotlin/org/mobilenativefoundation/store6/mutations/drain/docs/DrainQuickstartDocsSnippet.kt)
and an executable
[restart replay fixture](https://github.com/matt-ramotar/Store6/blob/b123c95a373f3629c23e797cb97e2bca18bb260a/mutations-drain/src/commonTest/kotlin/org/mobilenativefoundation/store6/mutations/drain/RestartReplayTest.kt).
The restart fixture closes and reopens a store over the same `InMemoryMutationJournalStorage`
object in the same test process. It does not prove physical disk recovery, operating-system process
death, a later device wake-up, or host constraint enforcement. Those behaviors require platform
and device evidence.

For a platform-backed implementation of these execution opportunities, continue to
[Meeseeks](https://store.mobilenativefoundation.org/llms/store6/meeseeks.md).
