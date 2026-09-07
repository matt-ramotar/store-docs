"""The original Store 5 decision tree, split at its coupling branch."""
from html import escape
from primitives import document, edge, label, legend, node, text


def decision(cx, cy, lines):
    points = f'{cx},{cy-80} {cx+240},{cy} {cx},{cy+80} {cx-240},{cy}'
    out = f'<g data-node="{escape(" ".join(lines))}"><polygon points="{points}" class="dd-node"/>'
    first = cy + 4 - (len(lines)-1)*10
    first = round(first/4)*4
    for i, line in enumerate(lines):
        out += text(cx, first + i*20, line)
    return out + '</g>'


def generate():
    s = 'single-or-multiple-stores'
    body = text(40, 40, '01 / START WITH COUPLING', 'tag', 'start')
    body += edge(s, 'M360 224 V304')
    body += edge(s, 'M600 144 H832 Q840 144 840 152 V284')
    body += edge(s, 'M360 464 V544')
    body += edge(s, 'M120 384 H80 Q72 384 72 392 V868 Q72 876 80 876 H200')
    body += edge(s, 'M360 704 V832')
    body += edge(s, 'M600 624 H712 Q720 624 720 632 V832')
    body += label(408, 268, 'YES', 80)
    body += label(716, 128, 'NO', 64)
    body += label(408, 508, 'NO', 80)
    body += label(120, 456, 'YES', 80)
    body += label(408, 772, 'YES', 80)
    body += label(660, 608, 'NO', 64)
    body += decision(360, 144, ['Are your data sources', 'tightly coupled?'])
    body += decision(360, 384, ['Do you require atomic updates', 'across data sources?'])
    body += decision(360, 624, ['Is combining data within', 'a single store less complex?'])
    body += '<a class="font-medium text-accent-strong underline decoration-separator decoration-1 underline-offset-4" href="/diagrams/independent-stores.html" aria-label="Continue with independent data sources">' + node(720, 284, 200, 88, ['Independent sources', 'Continue in part 2'], kind='optional') + '</a>'
    body += node(200, 832, 240, 88, 'Use a single store', kind='focal')
    body += node(600, 832, 240, 88, 'Use multiple stores', kind='focal')
    body += legend(960, [(40, 'Question', 'node'), (320, 'Outcome', 'focal'), (600, 'Continue in part 2', 'optional')])
    first = document(s, 'Single or multiple stores: coupled sources', 'Tightly coupled data sources favor one store when atomic updates are required or combining data in one store is less complex; otherwise use multiple stores, and evaluate independent sources in part 2.', body, height=1024)

    s = 'independent-stores'
    body = text(40, 40, '02 / WHEN DATA SOURCES ARE NOT TIGHTLY COUPLED', 'tag', 'start')
    for cy, rail in [(144, 880), (384, 840), (624, 800), (864, 760)]:
        body += edge(s, f'M600 {cy} H{rail-8} Q{rail} {cy} {rail} {cy+8} V1120')
        body += label(680, cy-16, 'YES', 64)
        if cy != 864:
            body += edge(s, f'M360 {cy+80} V{cy+160}')
            body += label(408, cy+124, 'NO', 80)
    body += edge(s, 'M360 944 V1120')
    body += label(408, 1036, 'NO', 80)
    body += decision(360, 144, ['Do sources need different', 'caching strategies', 'or validation rules?'])
    body += decision(360, 384, ['Is independent', 'error handling important?'])
    body += decision(360, 624, ['Do you anticipate adding', 'more data sources', 'in the future?'])
    body += decision(360, 864, ['Is combining data in', 'the repository layer feasible?'])
    body += node(200, 1120, 280, 88, 'Use a single store', kind='focal')
    body += node(600, 1120, 320, 88, 'Use multiple stores', kind='focal')
    body += legend(1248, [(40, 'Question', 'node'), (320, 'Outcome', 'focal')])
    second = document(s, 'Single or multiple stores: independent sources', 'For independent sources, use multiple stores if caching or validation differs, error isolation matters, more sources are expected, or repository-level composition is feasible; otherwise use a single store.', body, height=1312)
    return [first, second]


if __name__ == '__main__':
    generate()
