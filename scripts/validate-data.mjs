import { readFile } from 'node:fs/promises';
import { validateFrontierData } from '../lib/frontier-schema.mjs';

const fileUrl = new URL('../data/frontier.json', import.meta.url);
const data = JSON.parse(await readFile(fileUrl, 'utf8'));
validateFrontierData(data);
console.log(`Validated ${data.projects.length} projects, ${data.updates.length} updates, ${data.bottlenecks.length} bottleneck signals, ${data.claims.length} claims, and ${data.runs.length} runs.`);
