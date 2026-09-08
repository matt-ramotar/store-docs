import * as cheerio from 'cheerio';

import { storeDiagramIds } from '../../lib/store-diagrams.ts';
import { parseRecordedSource } from '../../lib/source-recorded.ts';

const text = value => ({ type: 'text', value });

export function semanticContext(diagramInputs) {
  const diagrams = new Map();
  for (const [id, html] of diagramInputs) {
    if (!storeDiagramIds.includes(id)) throw new Error(`Unknown Store diagram: ${id}`);
    const $ = cheerio.load(html);
    const svg = $('svg').first();
    const title = svg.children('title').text().trim();
    const description = svg.children('desc').text().trim();
    const labels = svg.find('text').map((_, node) => $(node).text().trim()).get();
    if (!title || !description || !labels.length || labels.some(label => !label)) {
      throw new Error(`Incomplete Store diagram: ${id}`);
    }
    diagrams.set(id, { title, description, labels });
  }

  const flatten = node => typeof node.value === 'string'
    ? node.value
    : (node.children ?? []).map(flatten).join('');

  return {
    diagram(id) {
      const diagram = diagrams.get(id);
      if (!diagram) throw new Error(`Unloaded or unknown Store diagram: ${id}`);
      return diagram;
    },
    recordedSource(node) {
      const record = parseRecordedSource(flatten(node).trim());
      if (!record) return undefined;
      const revision = { type: 'inlineCode', value: `${record.branch}@${record.hash}` };
      return [
        text(`Source recorded ${record.date} · `),
        record.commitUrl
          ? { type: 'link', url: record.commitUrl, children: [revision] }
          : revision,
        text(` · ${record.status}`),
      ];
    },
  };
}
