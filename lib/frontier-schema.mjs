const REQUIRED_ARRAYS = ['projects', 'updates', 'bottlenecks', 'claims', 'runs'];
const STAGES = new Set(['Announced', 'Prototype', 'Pilot', 'Production', 'Scaled', 'Measured', 'Paused / Abandoned']);
const CLAIM_STATUSES = new Set(['Open', 'Validated', 'Partially validated', 'Unverified', 'Contradicted', 'Abandoned', 'Too early']);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function unique(rows, field, label) {
  const seen = new Set();
  for (const row of rows) {
    const value = row[field];
    assert(value, `${label} row missing ${field}`);
    if (seen.has(value)) throw new Error(`Duplicate ${field}: ${value}`);
    seen.add(value);
  }
}

function validateSourceQuality(row, label) {
  const value = Number(row['Source Quality']);
  assert(Number.isInteger(value) && value >= 1 && value <= 5, `${label} has invalid Source Quality`);
}

export function validateFrontierData(data) {
  assert(data && typeof data === 'object', 'Snapshot must be an object');
  assert(data.meta && typeof data.meta === 'object', 'Snapshot missing meta');
  assert(data.meta.schemaVersion === '2.0', 'Expected schemaVersion 2.0');
  assert(data.meta.sourceSpreadsheet, 'Snapshot missing sourceSpreadsheet');

  for (const key of REQUIRED_ARRAYS) {
    assert(Array.isArray(data[key]), `Expected ${key} to be an array`);
  }

  unique(data.projects, 'Project ID', 'Project');
  unique(data.updates, 'Update ID', 'Update');
  unique(data.bottlenecks, 'Signal ID', 'Bottleneck');
  unique(data.claims, 'Claim ID', 'Claim');
  unique(data.runs, 'Run ID', 'Run');

  const projectIds = new Set(data.projects.map((row) => row['Project ID']));

  for (const row of data.projects) {
    for (const field of ['First Seen', 'Last Updated', 'Entity', 'Domain', 'Use Case', 'Project Summary', 'Stage', 'Primary Bottleneck', 'Status']) {
      assert(row[field] !== undefined && row[field] !== null && row[field] !== '', `Project ${row['Project ID']} missing ${field}`);
    }
    assert(STAGES.has(row.Stage), `Project ${row['Project ID']} has invalid Stage ${row.Stage}`);
    validateSourceQuality(row, `Project ${row['Project ID']}`);
    assert(row['Primary Source'] || row['Discovery Source'], `Project ${row['Project ID']} missing a source URL`);
  }

  for (const row of data.updates) {
    assert(projectIds.has(row['Project ID']), `Update ${row['Update ID']} references unknown Project ID ${row['Project ID']}`);
    assert(row.Date && row.Summary, `Update ${row['Update ID']} missing date or summary`);
    validateSourceQuality(row, `Update ${row['Update ID']}`);
    assert(row['Primary Source'], `Update ${row['Update ID']} missing Primary Source`);
  }

  for (const row of data.bottlenecks) {
    if (row['Linked Project IDs']) {
      for (const id of String(row['Linked Project IDs']).split(';').map((x) => x.trim()).filter(Boolean)) {
        assert(projectIds.has(id), `Bottleneck ${row['Signal ID']} references unknown Project ID ${id}`);
      }
    }
    assert(row.Date && row.Domain && row.Bottleneck && row['Evidence Summary'], `Bottleneck ${row['Signal ID']} missing required fields`);
    validateSourceQuality(row, `Bottleneck ${row['Signal ID']}`);
    assert(row['Source URL'], `Bottleneck ${row['Signal ID']} missing Source URL`);
  }

  for (const row of data.claims) {
    assert(projectIds.has(row['Project ID']), `Claim ${row['Claim ID']} references unknown Project ID ${row['Project ID']}`);
    for (const field of ['Claim Date', 'Claimant', 'Claim Type', 'Original Claim', 'Resolution Status']) {
      assert(row[field] !== undefined && row[field] !== null && row[field] !== '', `Claim ${row['Claim ID']} missing ${field}`);
    }
    assert(CLAIM_STATUSES.has(row['Resolution Status']), `Claim ${row['Claim ID']} has invalid Resolution Status`);
    validateSourceQuality(row, `Claim ${row['Claim ID']}`);
    assert(row['Source URL'], `Claim ${row['Claim ID']} missing Source URL`);
  }

  for (const row of data.runs) {
    assert(row['Logical Date'], `Run ${row['Run ID']} missing Logical Date`);
  }

  const counts = data.meta.counts || {};
  for (const key of REQUIRED_ARRAYS) {
    assert(counts[key] === data[key].length, `Meta count for ${key} does not match the dataset`);
  }

  return true;
}

export const FRONTIER_STAGES = [...STAGES];
export const CLAIM_RESOLUTION_STATUSES = [...CLAIM_STATUSES];
