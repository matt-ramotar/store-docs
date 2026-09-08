"""Authored sequence layouts for Store's mutation transport and alias contracts.

Source: the Mermaid blocks formerly embedded in aliases.mdx and server.mdx.
The 14-message server trace is split at the nested acceptance boundary so each
result has one two-region alternative and preserves every source message/note.
"""
from html import escape

from primitives import document, edge, node, rect, text


def lines(x, baseline, values, anchor="middle", width=None):
    """Opaque multiline label; its last baseline is 16px above a message.

    A 12px glyph plus 8px below-baseline padding leaves the required 8px
    visible margin between a horizontal message and its label mask.
    """
    width = width or ((max(map(len, values)) * 8 + 16 + 7) // 8 * 8)
    left = x - width / 2 if anchor == "middle" else x - 8
    content = rect(left, baseline - 16, width, 24 + 20 * (len(values) - 1), "paper", 4)
    content += "".join(text(x, baseline + index * 20, value, "label", anchor)
                       for index, value in enumerate(values))
    return '<g data-label="' + escape(" ".join(values), quote=True) + '">' + content + '</g>'


def message(slug, start, end, y, values, *, center=None, returned=False, kind="default", thrown=False):
    center = center if center is not None else (start + end) / 2
    if thrown:
        # Preserve Mermaid's --x failure endpoint: a dashed return terminating
        # in a cross rather than a successful acknowledgement arrowhead.
        arrow = (f'<path d="M{start} {y} H{end + 8}" class="dd-edge" stroke-dasharray="4 4"/>'
                 f'<path d="M{end - 4} {y - 4} L{end + 4} {y + 4} M{end - 4} {y + 4} L{end + 4} {y - 4}" class="dd-edge"/>')
    else:
        arrow = edge(slug, f"M{start} {y} H{end}", kind, returned)
    baseline = y - 16 - 20 * (len(values) - 1)
    return '<g data-message="true">' + arrow + lines(center, baseline, values) + '</g>'


def local_work(slug, x, y, values, kind="default"):
    # Two rounded 90-degree elbows; the label mask starts 8px to the right
    # of the vertical stroke. Incoming and outgoing points are 32px apart.
    path = f"M{x} {y} H{x + 40} Q{x + 48} {y} {x + 48} {y + 8} V{y + 24} Q{x + 48} {y + 32} {x + 40} {y + 32} H{x}"
    return ('<g data-message="true">' + edge(slug, path, kind)
            + lines(x + 64, y + 4, values, "start") + '</g>')


def lifelines(actors, bottom):
    return "".join(f'<path d="M{x} 104 V{bottom}" class="dd-lifeline"/>' for x, _, _ in actors)


def actor_boxes(actors):
    return "".join(node(x - width / 2, 40, width, 64, name) for x, name, width in actors)


def alternative(top, bottom, divider):
    return (rect(40, top, 880, bottom - top, "zone", 4)
            + f'<path d="M48 {divider} H912" class="dd-rule" stroke-dasharray="4 4"/>')


def guard(top, baseline, value):
    tab = rect(40, top, 48, 24, "paper", 4) + text(64, top + 16, "ALT", "tag")
    return tab + lines(64, baseline, [f"[{value}]"], "start")


def note(x, y, width, values):
    content = rect(x, y, width, 20 + 20 * len(values), "paper", 4)
    content += f'<path d="M{x} {y + 4} V{y + 12 + 20 * len(values)}" class="dd-rule"/>'
    content += "".join(text(x + 16, y + 24 + index * 20, value, "legend", "start")
                       for index, value in enumerate(values))
    return '<g data-note="true">' + content + '</g>'


def sequence_legend(y, *, failure=False):
    out = f'<path d="M40 {y} H920" class="dd-rule"/>'
    out += f'<path d="M40 {y + 28} H80" class="dd-edge"/>'
    out += text(92, y + 32, "Call / local work", "legend", "start")
    out += f'<path d="M320 {y + 28} H360" class="dd-edge" stroke-dasharray="4 4"/>'
    out += text(372, y + 32, "Acknowledgement / return", "legend", "start")
    if failure:
        out += f'<path d="M688 {y + 24} L696 {y + 32} M688 {y + 32} L696 {y + 24}" class="dd-edge"/>'
        out += text(708, y + 32, "Sanctioned throw", "legend", "start")
    return out


def alias_activation():
    slug = "alias-activation"
    actors = [(96, "App", 112), (336, "MutationStore", 184),
              (576, "MutationServer", 184), (840, "Durable journal", 160)]
    body = lifelines(actors, 776)
    body += message(slug, 96, 336, 192, ["mutate(", "provisionalKey,", "createRef, args)"])
    body += message(slug, 336, 576, 256, ["push(provisional", "identity)"])
    body += message(slug, 576, 336, 320, ["PresentAck(", "canonicalKey)"], returned=True)
    body += message(slug, 336, 840, 408, ["transaction:", "ACKED receipt +", "PENDING alias"], center=708)
    body += local_work(slug, 336, 448, ["adopt authoritative", "echo"])
    body += local_work(slug, 336, 528, ["finish declared", "invalidation effects"])
    body += message(slug, 336, 840, 648, ["transaction:", "retire intent +", "alias ACTIVE"], center=708, kind="accent")
    body += message(slug, 336, 96, 744, ["existing stream", "collection swaps to", "canonical delegate"], returned=True)
    body += actor_boxes(actors) + sequence_legend(800)
    return document(slug, "When a canonical alias becomes active",
                    "MutationStore persists an ACKED receipt and PENDING alias before adopting the echo, finishes declared invalidation effects, then retires the intent and activates the alias before the existing stream changes delegate.",
                    body, height=880,
                    caption="The alias becomes ACTIVE during retirement finalization, after declared invalidation effects finish. The app keeps the same stream collection.")


def server_outcomes():
    slug = "server-outcomes"
    actors = [(160, "Mutation engine", 200), (480, "MutationServer", 200), (800, "Backend", 160)]
    body = alternative(280, 616, 456) + lifelines(actors, 632)
    body += guard(280, 320, "backend accepts")
    body += lines(64, 488, ["[precondition conflict]"], "start")
    body += message(slug, 160, 480, 184, ["push(generation g,", "idempotencyKey k)"])
    body += message(slug, 480, 800, 248, ["deterministic request", "for g and k"])
    body += message(slug, 800, 480, 360, ["authoritative result"], returned=True)
    body += message(slug, 480, 160, 424, ["Present or Absent", "acknowledgement"], returned=True)
    body += message(slug, 800, 480, 528, ["conflict response"], returned=True)
    body += message(slug, 480, 160, 592, ["sanctioned throw:", "StoreResults.conflict"], thrown=True)
    body += actor_boxes(actors) + sequence_legend(648, failure=True)
    return document(slug, "Backend acceptance or precondition conflict",
                    "MutationServer sends a deterministic request for generation g and idempotency key k, returns a Present or Absent acknowledgement after backend acceptance, or throws a sanctioned StoreResults.conflict after a precondition conflict.",
                    body, height=728,
                    caption="After the backend accepts, receipt durability determines whether a later drain can replay generation g. That continuation is shown in the next diagram.")


def server_recovery():
    slug = "server-recovery"
    actors = [(160, "Mutation engine", 200), (480, "MutationServer", 200), (800, "Backend", 160)]
    body = alternative(128, 920, 404) + lifelines(actors, 944)
    body += guard(128, 168, "receipt and ACKED transaction commits")
    body += lines(64, 436, ["[failure or death before commit]"], "start")
    body += local_work(slug, 160, 208, ["persist complete receipt", "and ACKED"], kind="accent")
    body += local_work(slug, 160, 272, ["adopt echo, apply effects,", "retire intent"])
    body += note(72, 328, 360, ["Recovery may repeat local work,", "never push g"])
    body += note(72, 456, 360, ["Last durable phase remains INFLIGHT"])
    body += message(slug, 160, 480, 560, ["later drain replays", "generation g and key k"])
    body += message(slug, 480, 800, 624, ["duplicate request", "for g and k"])
    body += message(slug, 800, 480, 688, ["same authoritative result"], returned=True)
    body += message(slug, 480, 160, 752, ["same acknowledgement"], returned=True)
    body += local_work(slug, 160, 792, ["persist complete receipt", "and ACKED"])
    body += local_work(slug, 160, 864, ["resume adoption, effects,", "and retirement"])
    body += actor_boxes(actors) + sequence_legend(960)
    return document(slug, "Recovery after backend acceptance",
                    "A committed receipt and ACKED phase prevent another push of generation g; failure before that transaction commits leaves INFLIGHT, so a later drain replays g and k, receives the same result, persists the receipt, and resumes local work.",
                    body, height=1040,
                    caption="This sequence starts after backend acceptance. Once ACKED is durable, recovery can repeat adoption, effects, and retirement but never re-pushes generation g.")


def generate():
    return [alias_activation(), server_outcomes(), server_recovery()]


if __name__ == "__main__":
    for slug in generate():
        print(slug)
