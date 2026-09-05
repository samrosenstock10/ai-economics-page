import { isDeepStrictEqual } from 'node:util';
import { validateFrontierChange, validateFrontierHistory } from './frontier-schema.mjs';

const CONFIGS = [
  ['projects', 'Project ID'],
  ['updates', 'Update ID'],
  ['bottlenecks', 'Signal ID'],
  ['claims', 'Claim ID'],
  ['runs', 'Run ID']
];

export function mergeFrontierDelta(base, delta) {
  if ('changeHistory' in delta) throw new Error('changeHistory is generated from replacements, not supplied in a delta');
  validateFrontierHistory(base);
  const merged = structuredClone(base);
  const history = merged.changeHistory || [];
  let changed = false;

  for (const [key, idField] of CONFIGS) {
    if (!Array.isArray(merged[key])) throw new Error(`Expected ${key} to be an array`);
    const incoming = delta[key] || [];
    if (!Array.isArray(incoming)) throw new Error(`${key} delta must be an array`);

    const byId = new Map(merged[key].map((row) => [row[idField], row]));
    for (const row of incoming) {
      const id = row[idField];
      if (!id) throw new Error(`${key} row missing ${idField}`);
      const existing = byId.get(id);
      if (existing) {
        // Previously consumed append rows can predate a later replacement.
        const archived = history.some((change) => change.table === key && change.before[idField] === id
          && (isDeepStrictEqual(change.before, row) || isDeepStrictEqual(change.after, row)));
        if (!isDeepStrictEqual(existing, row) && !archived) {
          throw new Error(`conflicting existing ${idField} ${id}`);
        }
        continue;
      }
      merged[key].push(structuredClone(row));
      byId.set(id, row);
      changed = true;
    }
  }

  const replacements = delta.replacements === undefined ? [] : delta.replacements;
  if (!Array.isArray(replacements)) throw new Error('replacements must be an array');
  const byChangeId = new Map(history.map((change) => [change.changeId, change]));
  for (const change of replacements) {
    const { table, idField, id } = validateFrontierChange(change);
    const previous = byChangeId.get(change.changeId);
    if (previous) {
      if (!isDeepStrictEqual(previous, change)) throw new Error(`conflicting changeId ${change.changeId}`);
      // A consumed change stays a no-op even if a later change has advanced this row.
      continue;
    }
    const index = merged[table].findIndex((row) => row[idField] === id);
    if (index < 0) throw new Error(`replacement missing existing ${idField} ${id}`);
    if (!isDeepStrictEqual(merged[table][index], change.before)) {
      throw new Error(`stale replacement for ${idField} ${id}; re-read current state`);
    }
    merged[table][index] = structuredClone(change.after);
    const archived = structuredClone(change);
    history.push(archived);
    byChangeId.set(change.changeId, archived);
    changed = true;
  }
  if (history.length) merged.changeHistory = history;
  validateFrontierHistory(merged);

  const staleMeta = delta.meta && (
    (delta.meta.logicalDate && merged.meta.logicalDate && delta.meta.logicalDate < merged.meta.logicalDate)
    || Date.parse(delta.meta.generatedAt) < Date.parse(merged.meta.generatedAt)
  );
  if (staleMeta && changed) throw new Error('stale delta metadata; re-read current state');
  if (delta.meta && !staleMeta) {
    merged.meta = { ...merged.meta, ...delta.meta, counts: merged.meta?.counts || {} };
  }
  merged.meta.counts = Object.fromEntries(CONFIGS.map(([key]) => [key, merged[key].length]));
  return merged;
}
