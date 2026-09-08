import { resolve } from 'node:path';

import { buildAgentDocs } from './agent-docs/bundle.mjs';
import { reconcileOwnedOutputs, verifyOwnedOutputs } from './generated-output-transaction.mjs';

const args = process.argv.slice(2);
if (args.length > 1 || (args.length === 1 && args[0] !== '--check')) {
  throw new Error('usage: node scripts/build-agent-docs.mjs [--check]');
}

const root = resolve(import.meta.dirname, '..');
const outputs = await buildAgentDocs({ root });
const options = {
  root,
  outputs,
  owner: 'build-agent-docs',
  ledgerRelativePath: 'evidence/T4-owned-targets.json',
};
await (args[0] === '--check' ? verifyOwnedOutputs(options) : reconcileOwnedOutputs(options));
process.stdout.write(`${args[0] === '--check' ? 'checked' : 'generated'} ${outputs.size} agent-doc outputs\n`);
