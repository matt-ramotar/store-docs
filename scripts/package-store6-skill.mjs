import { readFile, writeFile } from 'node:fs/promises';
import { listPages } from '../skills/store6/scripts/retrieve.mjs';

const args = process.argv.slice(2);
if (args.length > 1 || (args.length === 1 && args[0] !== '--check')) {
  throw new Error('usage: node scripts/package-store6-skill.mjs [--check]');
}
const current = await readFile(new URL('../public/llms/store6-manifest.json', import.meta.url), 'utf8');
listPages(JSON.parse(current));
const destination = new URL('../skills/store6/references/docs-manifest.json', import.meta.url);
if (args[0] === '--check') {
  if (await readFile(destination, 'utf8') !== current) {
    throw new Error('SKILL_PAIR_MISMATCH: explicitly pair and revalidate this skill candidate');
  }
  process.stdout.write('checked Store6 skill/corpus pair\n');
} else {
  await writeFile(destination, current);
  process.stdout.write('paired Store6 skill candidate; validation is still required\n');
}
