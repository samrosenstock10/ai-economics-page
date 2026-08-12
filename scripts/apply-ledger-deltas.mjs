import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const ledgerPath = new URL("../data/ledger.json", import.meta.url);
const dataDir = new URL("../data/", import.meta.url);
const ledger = JSON.parse(await readFile(ledgerPath, "utf8"));

const configs = [
  ["evidence", "Evidence ID"],
  ["perceptions", "Perception ID"],
  ["outcomes", "Outcome ID"],
  ["runs", "Run Date"],
];

for (const [key] of configs) {
  if (!Array.isArray(ledger[key])) throw new Error(`Expected ${key} to be an array`);
}

const filenames = (await readdir(dataDir))
  .filter((name) => name.startsWith(".ledger-delta-") && name.endsWith(".json"))
  .sort();

if (!filenames.length) {
  console.log("No ledger deltas found.");
  process.exit(0);
}

let changed = false;
let latestMeta = null;

for (const filename of filenames) {
  const delta = JSON.parse(await readFile(new URL(filename, dataDir), "utf8"));
  latestMeta = delta.meta || latestMeta;

  for (const [key, idField] of configs) {
    const incoming = delta[key] || [];
    if (!Array.isArray(incoming)) throw new Error(`${filename}: ${key} must be an array`);

    const byId = new Map(ledger[key].map((row) => [row[idField], row]));
    for (const row of incoming) {
      const id = row[idField];
      if (!id) throw new Error(`${filename}: ${key} row missing ${idField}`);
      const existing = byId.get(id);
      if (existing) {
        if (JSON.stringify(existing) !== JSON.stringify(row)) {
          throw new Error(`${filename}: conflicting existing ${idField} ${id}`);
        }
        continue;
      }
      ledger[key].push(row);
      byId.set(id, row);
      changed = true;
    }
  }
}

if (latestMeta) {
  ledger.meta.generatedAt = latestMeta.generatedAt || ledger.meta.generatedAt;
  ledger.meta.latestRun = latestMeta.latestRun || ledger.meta.latestRun;
  ledger.meta.rubricVersion = latestMeta.rubricVersion || ledger.meta.rubricVersion;
}

ledger.meta.counts = Object.fromEntries(configs.map(([key]) => [key, ledger[key].length]));

await writeFile(ledgerPath, JSON.stringify(ledger, null, 2) + "\n", "utf8");
console.log(`Applied ${filenames.length} delta file(s); changed=${changed}.`);
