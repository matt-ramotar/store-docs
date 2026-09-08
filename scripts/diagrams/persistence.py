"""Faithful redraw of the persistence guide's ASCII read path."""
from primitives import document, edge, label, legend, node, text


def generate():
    s = 'persistence-read-path'
    body = text(40, 56, 'READ THROUGH THE PERSISTENCE SEAM', 'tag', 'start')
    body += edge(s, 'M136 168 V232')
    body += edge(s, 'M232 276 H320')
    body += edge(s, 'M584 276 H712')
    body += edge(s, 'M452 320 V400')
    body += edge(s, 'M584 444 H712')
    body += edge(s, 'M816 400 V320', dashed=True)
    body += label(276, 260, 'MISS', 64)
    body += label(648, 260, 'OBSERVE', 88)
    # Guard lives beside its vertical branch and stays clear of both boxes.
    body += label(576, 360, 'ABSENT + POLICY FETCHES', 232)
    body += label(648, 428, 'WRITE', 72)
    body += label(864, 360, 'NOTIFY', 80)
    body += node(40, 104, 192, 64, 'Read request')
    body += node(40, 232, 192, 88, 'Memory', 'May satisfy read', kind='state')
    body += node(320, 232, 264, 88, 'SourceOfTruth', 'reader(key)', kind='focal')
    body += node(712, 232, 208, 88, ['Stream', 'emissions'])
    body += node(320, 400, 264, 88, 'Fetcher', 'Successful value')
    body += node(712, 400, 208, 88, 'SourceOfTruth', 'write(key, value)', kind='state')
    body += legend(536, [(40, 'Persistence seam', 'focal'), (320, 'Stored value', 'state'), (592, 'Notification can emit', 'optional')])
    return [document(s, 'The persistence read path', 'Memory can satisfy a read; otherwise SourceOfTruth.reader feeds stream emissions, and a policy-permitted fetch writes through SourceOfTruth so reader notifications can emit later values.', body)]


if __name__ == '__main__':
    generate()
