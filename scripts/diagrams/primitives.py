"""Editorial SVG primitives for the Store Docs diagram-design sources.

Run `python3 scripts/diagrams/generate.py` to rebuild the standalone HTML.
Coordinates are authored, never calculated by a graph layout engine.
"""
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def text(x, y, value, cls="name", anchor="middle"):
    return f'<text x="{x}" y="{y}" class="dd-{cls}" text-anchor="{anchor}">{escape(value)}</text>'


def rect(x, y, w, h, cls="node", radius=8):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{radius}" class="dd-{cls}"/>'


def node(x, y, w, h, name, sub="", kind="node", tag=""):
    names = name if isinstance(name, list) else [name]
    out = rect(x, y, w, h, "paper") + rect(x, y, w, h, kind)
    if tag:
        out += text(x + 12, y + 20, tag, "tag", "start")
    baseline = y + h / 2 + 4 - (len(names) - 1) * 10 - (8 if sub else 0)
    baseline = round(baseline / 4) * 4
    for i, name in enumerate(names):
        out += text(x + w / 2, baseline + i * 20, name)
    if sub:
        out += text(x + w / 2, baseline + (len(names)-1)*20 + 24, sub, "mono")
    return f'<g data-node="{escape(" / ".join(names), quote=True)}">{out}</g>'


def edge(slug, path, kind="default", dashed=False):
    return f'<path d="{path}" class="dd-edge dd-edge-{kind}" marker-end="url(#{slug}-arrow-{kind})"' + (' stroke-dasharray="4 4"' if dashed else '') + '/>'


def label(x, y, value, w=None, cls="label"):
    """y is baseline; a horizontal edge at y+16 leaves an 8px mask gap."""
    w = w or ((len(value) * 8 + 16 + 3) // 4 * 4)
    return f'<g data-label="{escape(value, quote=True)}">' + rect(x-w/2, y-16, w, 24, "paper", 4) + text(x, y, value, cls) + '</g>'


def zone(x, y, w, h, name):
    return rect(x, y, w, h, "zone") + text(x+16, y+24, name, "tag", "start")


def legend(y, items, width=960):
    out = f'<path d="M40 {y} H{width-40}" class="dd-rule"/>'
    for x, name, kind in items:
        out += rect(x, y+20, 12, 12, kind, 4) + text(x+24, y+32, name, "legend", "start")
    return out


def document(slug, title, desc, body, width=960, height=600, caption=""):
    defs = '<defs>'
    for kind in ['default', 'accent', 'link']:
        defs += f'<marker id="{slug}-arrow-{kind}" markerWidth="8" markerHeight="8" refX="8" refY="4" orient="auto" markerUnits="userSpaceOnUse"><path d="M0 0 L8 4 L0 8 Z" class="dd-arrow-{kind}"/></marker>'
    defs += '</defs>'
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" class="dd-svg" role="img" aria-labelledby="{slug}-title {slug}-desc" viewBox="0 0 {width} {height}"><title id="{slug}-title">{escape(title)}</title><desc id="{slug}-desc">{escape(desc)}</desc>{defs}' + rect(0, 0, width, height, "paper", 0) + body + '</svg>'
    css = (ROOT / 'components/docs/diagrams/styles.css').read_text()
    theme = (ROOT / 'scripts/diagrams/standalone.css').read_text()
    html = f'<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>{escape(title)} | Store Docs</title><style>{theme}\n{css}</style></head><body><main><header><p class="eyebrow">STORE DOCS / DIAGRAMS</p><h1>{escape(title)}</h1></header><figure class="store-designed-diagram"><div class="store-designed-diagram-viewport" tabindex="0" role="region" aria-label="{escape(title)}; scroll horizontally on small screens">{svg}</div><figcaption>{escape(caption or desc)}</figcaption></figure></main></body></html>\n'
    target = ROOT / 'public/diagrams' / f'{slug}.html'
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(html)
    return slug
