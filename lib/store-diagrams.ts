import { readFile } from "node:fs/promises";
import { join } from "node:path";

/** Only reviewed, repository-authored HTML can be embedded in documentation. */
export const storeDiagramIds = [
  "store5-migration",
  "namespace-ownership",
  "alias-activation",
  "server-outcomes",
  "server-recovery",
  "extension-lifecycle",
  "extension-lifecycle-rollback",
  "persistence-read-path",
  "single-or-multiple-stores",
  "independent-stores",
] as const;

export type StoreDiagramId = (typeof storeDiagramIds)[number];

export async function loadStoreDiagram(id: StoreDiagramId) {
  if (!storeDiagramIds.includes(id)) throw new Error(`Unknown Store diagram: ${id}`);
  const html = await readFile(join(process.cwd(), "public", "diagrams", `${id}.html`), "utf8");
  const svg = html.match(/<svg\b[\s\S]*?<\/svg>/)?.[0];
  const title = svg?.match(/<title\b[^>]*>([\s\S]*?)<\/title>/)?.[1];
  const description = svg?.match(/<desc\b[^>]*>([\s\S]*?)<\/desc>/)?.[1];
  if (!svg || !title || !description) throw new Error(`Invalid Store diagram: ${id}`);
  return { svg, title, description };
}
