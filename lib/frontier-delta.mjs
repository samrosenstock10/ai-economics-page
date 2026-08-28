const CONFIGS = [
  ['projects', 'Project ID'],
  ['updates', 'Update ID'],
  ['bottlenecks', 'Signal ID'],
  ['claims', 'Claim ID'],
  ['runs', 'Run ID']
];

export function mergeFrontierDelta(base, delta) {
  const merged = structuredClone(base);

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
        if (JSON.stringify(existing) !== JSON.stringify(row)) {
          throw new Error(`conflicting existing ${idField} ${id}`);
        }
        continue;
      }
      merged[key].push(row);
      byId.set(id, row);
    }
  }

  if (delta.meta) {
    merged.meta = { ...merged.meta, ...delta.meta, counts: merged.meta?.counts || {} };
  }
  merged.meta.counts = Object.fromEntries(CONFIGS.map(([key]) => [key, merged[key].length]));
  return merged;
}
