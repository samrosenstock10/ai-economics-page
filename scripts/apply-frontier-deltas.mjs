import { readFile, readdir, writeFile } from 'node:fs/promises';
import { mergeFrontierDelta } from '../lib/frontier-delta.mjs';
import { validateFrontierData } from '../lib/frontier-schema.mjs';

const frontierPath = new URL('../data/frontier.json', import.meta.url);
const dataDir = new URL('../data/', import.meta.url);
let frontier = JSON.parse(await readFile(frontierPath, 'utf8'));

const filenames = (await readdir(dataDir))
  .filter((name) => name.startsWith('.frontier-delta-') && name.endsWith('.json'))
  .sort();

if (!filenames.length) {
  console.log('No frontier deltas found.');
  process.exit(0);
}

for (const filename of filenames) {
  const delta = JSON.parse(await readFile(new URL(filename, dataDir), 'utf8'));
  frontier = mergeFrontierDelta(frontier, delta);
}

validateFrontierData(frontier);
await writeFile(frontierPath, JSON.stringify(frontier, null, 2) + '\n', 'utf8');
console.log(`Applied ${filenames.length} frontier delta file(s).`);
