import { readFile } from 'node:fs/promises';
import { listPages, retrieveDocs } from './retrieve.mjs';

function usage(message) {
  throw Object.assign(new Error(message), { code: 'USAGE' });
}

try {
  const args = process.argv.slice(2);
  const pinned = JSON.parse(await readFile(
    new URL('../references/docs-manifest.json', import.meta.url), 'utf8'));

  if (args.length === 1 && args[0] === '--list') {
    process.stdout.write(`${JSON.stringify(listPages(pinned), null, 2)}\n`);
  } else {
    let target;
    const ids = [];

    for (let index = 0; index < args.length; index++) {
      const argument = args[index];
      if (argument === '--source-revision' || argument === '--coordinate') {
        const value = args[++index];
        if (target || !value || value.startsWith('--')) {
          usage('Provide exactly one target identity.');
        }
        target = {
          kind: argument === '--coordinate' ? 'artifact' : 'revision',
          value,
        };
      } else if (argument.startsWith('--')) {
        usage(`Unknown flag: ${argument}`);
      } else {
        ids.push(argument);
      }
    }

    if (!target) usage('Provide exactly one target identity.');
    const result = await retrieveDocs({ pinned, ids, target });
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  }
} catch (error) {
  process.stderr.write(`${JSON.stringify({
    code: error.code ?? 'READ_ERROR',
    message: error.message,
  })}\n`);
  process.exitCode = 1;
}
