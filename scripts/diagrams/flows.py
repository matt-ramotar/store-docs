"""Authored architecture and lifecycle diagrams; content follows the MDX sources.

Fidelity ledger:
- Store 5 migration: all 3 nodes, 2 edges, and the One app container retained.
- Namespace ownership: all 4 nodes, 2 edges, and both namespace containers retained.
- Extension lifecycle: all 8 success steps and 4 rollback steps retained, split
  into two figures to respect the nine-node budget. No steps or edges dropped.
"""
from primitives import document, edge, legend, node, text, zone


def migration():
    slug = "store5-migration"
    body = zone(48, 80, 424, 416, "ONE APP")
    body += edge(slug, "M384 212 H520 Q528 212 528 220 V276 Q528 284 536 284 H640")
    body += edge(slug, "M384 396 H560 Q568 396 568 388 V332 Q568 324 576 324 H640")
    body += node(96, 152, 288, 120, "N screens", "Store 5 cache", kind="state")
    body += node(96, 336, 288, 120, "One migrated screen", "Store 6 cache", kind="focal")
    body += node(640, 244, 224, 120, "Same backend")
    body += legend(528, [(64, "Store 5 screens", "state"), (328, "Migrated screen", "focal"), (624, "Shared backend", "node")])
    return document(
        slug, "Migrate one complete screen at a time",
        "Store 5 screens and one migrated Store 6 screen live in one app, with independent caches connected to the same backend.",
        body,
        caption="Both versions can use the same backend. Until Store 5 interop ships, their cache residence and invalidation remain independent.",
    )


def namespace_ownership():
    slug = "namespace-ownership"
    body = zone(48, 64, 864, 200, "NAMESPACE A")
    body += zone(48, 304, 864, 200, "NAMESPACE B")
    body += edge(slug, "M360 176 H600")
    body += edge(slug, "M360 416 H600")
    body += node(88, 128, 272, 96, "Head generation", "acceptance uncertain", kind="focal")
    body += node(600, 128, 272, 96, "Later key", "blocked behind owner", kind="optional")
    body += node(88, 368, 272, 96, "Eligible head")
    body += node(600, 368, 272, 96, "Push and retire")
    body += legend(536, [(64, "Lane owner", "focal"), (328, "Blocked work", "optional"), (624, "Eligible work", "node")])
    return document(
        slug, "Namespace ownership prevents leapfrogging",
        "An uncertain head generation in Namespace A blocks a later key, while an eligible head in Namespace B can push and retire.",
        body,
        caption="Namespace A's arrow means the head blocks the later key; it is not a transport attempt. Namespace B remains eligible to progress independently.",
    )


def extension_success():
    slug = "extension-lifecycle"
    body = text(48, 64, "SUCCESS / FOLLOW STEPS 01–08", "tag", "start")
    for path in [
        "M224 168 H280", "M456 168 H512", "M688 168 H744",
        "M832 224 V352", "M744 408 H688", "M512 408 H456", "M280 408 H224",
    ]:
        body += edge(slug, path)
    body += node(48, 112, 176, 112, ["Transaction", "open"], tag="01")
    body += node(280, 112, 176, 112, "Retirement signal", "coalesced", tag="02")
    body += node(512, 112, 176, 112, "Commit", kind="focal", tag="03")
    body += node(744, 112, 176, 112, ["apply +", "confirmFresh"], tag="04")
    body += node(744, 352, 176, 112, ["Collection", "restart"], tag="05")
    body += node(512, 352, 176, 112, ["Authoritative", "first-row recapture"], kind="focal", tag="06")
    body += node(280, 352, 176, 112, "Row delivery", tag="07")
    body += node(48, 352, 176, 112, ["One retirement", "signal"], tag="08")
    body += legend(528, [(64, "Ordered operation", "node"), (392, "Commit and recapture boundaries", "focal")])
    return document(
        slug, "Transactional acknowledgement: success",
        "Open the transaction, coalesce retirement signals, commit, apply and confirmFresh, restart collection, recapture the authoritative first row, deliver it, then release one retirement signal.",
        body,
        caption="The successful path delivers the recaptured authoritative row before releasing one coalesced retirement signal. Step numbers preserve the complete sequence across the two rows.",
    )


def extension_rollback():
    slug = "extension-lifecycle-rollback"
    body = ""
    for path in ["M480 128 V168", "M480 248 V288", "M480 368 V408"]:
        body += edge(slug, path)
    body += node(260, 48, 440, 80, "Transaction rollback")
    body += node(260, 168, 440, 80, "Collection restart")
    body += node(260, 288, 440, 80, ["Authoritative", "first-row recapture"], kind="focal")
    body += node(260, 408, 440, 80, "Discard retirement signals")
    body += text(480, 520, "confirmFresh is not an observation step", "mono")
    body += legend(548, [(64, "Ordered operation", "node"), (392, "Authoritative recapture", "focal")])
    return document(
        slug, "Transactional acknowledgement: rollback",
        "After transaction rollback, restart collection, recapture the authoritative first row, and discard retirement signals; confirmFresh is not an observation step.",
        body,
        caption="Rollback still restarts each active collection and recaptures its authoritative first row. Retirement signal attempts are discarded.",
    )


def generate():
    return [migration(), namespace_ownership(), extension_success(), extension_rollback()]


if __name__ == "__main__":
    for generated in generate():
        print(generated)
