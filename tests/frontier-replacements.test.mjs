import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeFrontierDelta } from '../lib/frontier-delta.mjs';
import { validateFrontierData } from '../lib/frontier-schema.mjs';

function fixture() {
  return {
    meta: {
      schemaVersion: '2.0', sourceSpreadsheet: 'https://example.com/sheet',
      logicalDate: '2026-09-01', generatedAt: '2026-09-01T21:00:00-04:00',
      latestRun: '2026-09-01 end-to-end verified',
      counts: { projects: 1, updates: 0, bottlenecks: 0, claims: 1, runs: 0 }
    },
    projects: [{
      'Project ID': 'P-1', 'First Seen': '2026-08-01', 'Last Updated': '2026-09-01',
      Entity: 'Example', Country: 'US', Domain: 'Software & Coding',
      'Use Case': 'Code review', 'Project Summary': 'Deploy code review assistants.',
      Stage: 'Pilot', 'Primary Bottleneck': 'Reliability', 'Source Quality': 5,
      'Primary Source': 'https://example.com/pilot', Status: 'Active'
    }],
    claims: [{
      'Claim ID': 'C-1', 'Project ID': 'P-1', 'Claim Date': '2026-08-01',
      Claimant: 'Example', 'Claim Type': 'Scale target', Baseline: 10, Target: 100,
      Unit: 'teams', 'Target Date': '2026-09-02', 'Original Claim': 'Reach 100 teams.',
      'Source Quality': 5, 'Source URL': 'https://example.com/target',
      'Next Review': '2026-09-02', 'Resolution Status': 'Open', 'Resolution Date': '',
      'Actual Result': '', 'Actual Unit': '', 'Realization %': '', 'Delay Days': '',
      'Resolution Source': '', Notes: ''
    }],
    updates: [], bottlenecks: [], runs: []
  };
}

function projectDelta(base) {
  return {
    meta: { logicalDate: '2026-09-02', generatedAt: '2026-09-02T21:00:00-04:00', latestRun: '2026-09-02 end-to-end verified' },
    updates: [{
      'Update ID': 'U-1', 'Project ID': 'P-1', Date: '2026-09-02',
      Summary: 'Code review assistants reached production.', 'Source Quality': 5,
      'Primary Source': 'https://example.com/production'
    }],
    replacements: [{
      changeId: 'CH-P-1-20260902', table: 'projects', updateId: 'U-1',
      before: structuredClone(base.projects[0]),
      after: { ...base.projects[0], Stage: 'Production', 'Last Updated': '2026-09-02', 'Primary Source': 'https://example.com/production' }
    }]
  };
}

function claimDelta(base) {
  return { replacements: [{
    changeId: 'CH-C-1-20260902', table: 'claims', before: structuredClone(base.claims[0]),
    after: { ...base.claims[0], 'Resolution Status': 'Validated', 'Resolution Date': '2026-09-02', 'Actual Result': 100, 'Actual Unit': 'teams', 'Resolution Source': 'https://example.com/result' }
  }] };
}

test('a project refresh publishes its current state, linked Update, and before/after history', () => {
  const base = fixture();
  const delta = projectDelta(base);
  const unchanged = structuredClone(base);
  const merged = mergeFrontierDelta(base, delta);
  assert.equal(merged.projects[0].Stage, 'Production');
  assert.equal(merged.projects.length, 1);
  assert.equal(merged.updates.length, 1);
  assert.equal(merged.meta.counts.updates, 1);
  assert.deepEqual(merged.changeHistory, delta.replacements);
  assert.deepEqual(base, unchanged);
  assert.equal(validateFrontierData(merged), true);
  delta.replacements[0].before.Stage = 'Changed by caller';
  assert.equal(merged.changeHistory[0].before.Stage, 'Pilot');
});

test('claim resolution preserves original terms and records the prior unresolved claim', () => {
  const base = fixture();
  const merged = mergeFrontierDelta(base, claimDelta(base));
  assert.equal(merged.claims[0]['Resolution Status'], 'Validated');
  assert.equal(merged.claims[0]['Original Claim'], 'Reach 100 teams.');
  assert.equal(merged.claims[0].Target, 100);
  assert.equal(merged.claims[0]['Source URL'], 'https://example.com/target');
  assert.equal(merged.changeHistory[0].before['Resolution Status'], 'Open');
  assert.equal(validateFrontierData(merged), true);
});

test('exact retries preserve rows, history, and metadata without duplicate writes', () => {
  const base = fixture();
  const delta = projectDelta(base);
  const once = mergeFrontierDelta(base, delta);
  assert.deepEqual(mergeFrontierDelta(once, delta), once);
  // Sheet serializers may return the same cells in another object-key order.
  delta.updates[0] = Object.fromEntries(Object.entries(delta.updates[0]).reverse());
  delta.replacements[0].before = Object.fromEntries(Object.entries(delta.replacements[0].before).reverse());
  assert.deepEqual(mergeFrontierDelta(once, delta), once);
});

test('an old successful retry cannot roll back a later project refresh or its metadata', () => {
  const base = fixture();
  const first = projectDelta(base);
  const once = mergeFrontierDelta(base, first);
  const second = {
    meta: { logicalDate: '2026-09-03', generatedAt: '2026-09-03T21:00:00-04:00', latestRun: '2026-09-03 end-to-end verified' },
    updates: [{ ...first.updates[0], 'Update ID': 'U-2', Date: '2026-09-03', Summary: 'Scaled to 100 teams.' }],
    replacements: [{ changeId: 'CH-P-1-20260903', table: 'projects', updateId: 'U-2',
      before: { ...once.projects[0] }, after: { ...once.projects[0], Stage: 'Scaled', 'Last Updated': '2026-09-03' } }]
  };
  const twice = mergeFrontierDelta(once, second);
  assert.equal(twice.projects[0].Stage, 'Scaled');
  assert.equal(twice.changeHistory.length, 2);
  assert.deepEqual(mergeFrontierDelta(twice, first), twice);
});

for (const [table, replacementDelta] of [['projects', projectDelta], ['claims', claimDelta]]) {
  test(`a consumed ${table} append remains a no-op after a later replacement`, () => {
    const seed = fixture();
    const base = fixture();
    base[table] = [];
    base.meta.counts[table] = 0;
    if (table === 'projects') {
      base.claims = [];
      base.meta.counts.claims = 0;
    }
    const appendedDelta = { [table]: seed[table], meta: seed.meta };
    const appended = mergeFrontierDelta(base, appendedDelta);
    const replacement = replacementDelta(appended);
    replacement.meta = { logicalDate: '2026-09-02', generatedAt: '2026-09-02T21:00:00-04:00', latestRun: '2026-09-02 end-to-end verified' };
    const refreshed = mergeFrontierDelta(appended, replacement);
    assert.deepEqual(mergeFrontierDelta(refreshed, appendedDelta), refreshed);
    assert.equal(validateFrontierData(refreshed), true);
    const unknownRow = { ...seed[table][0], Notes: 'A state that was never consumed' };
    assert.throws(() => mergeFrontierDelta(refreshed, { [table]: [unknownRow] }), /conflicting existing/);
    const newRow = { ...seed[table][0], [table === 'projects' ? 'Project ID' : 'Claim ID']: 'NEW-ID' };
    assert.throws(() => mergeFrontierDelta(refreshed, {
      ...appendedDelta, [table]: [...seed[table], newRow]
    }), /stale delta metadata/);
  });

  test(`a mixed ${table} append and replacement delta is safe to replay`, () => {
    const seed = fixture();
    const base = fixture();
    base[table] = [];
    base.meta.counts[table] = 0;
    if (table === 'projects') {
      base.claims = [];
      base.meta.counts.claims = 0;
    }
    const mixed = { [table]: seed[table], ...replacementDelta(seed) };
    const once = mergeFrontierDelta(base, mixed);
    assert.equal(once.changeHistory.length, 1);
    assert.deepEqual(mergeFrontierDelta(once, mixed), once);
    assert.equal(validateFrontierData(once), true);
  });
}

test('stale expected rows and missing target IDs reject the entire delta without changing input', () => {
  for (const mode of ['stale', 'missing']) {
    const base = fixture();
    const delta = projectDelta(base);
    if (mode === 'stale') base.projects[0].Notes = 'A concurrent edit';
    else base.projects = [];
    const unchanged = structuredClone(base);
    assert.throws(() => mergeFrontierDelta(base, delta), /stale|missing/i);
    assert.deepEqual(base, unchanged);
  }
});

test('reusing a change ID for different content is a conflict', () => {
  const base = fixture();
  const delta = projectDelta(base);
  const once = mergeFrontierDelta(base, delta);
  delta.replacements[0].after.Scale = 'Different evidence';
  assert.throws(() => mergeFrontierDelta(once, delta), /conflicting changeId/);
});

test('an unapplied delta with stale publication metadata must be reconciled first', () => {
  const base = fixture();
  const delta = projectDelta(base);
  delta.meta.generatedAt = '2026-08-31T21:00:00-04:00';
  assert.throws(() => mergeFrontierDelta(base, delta), /stale.*meta/i);
});

test('stable project identity and original claim fields cannot be rewritten', () => {
  const cases = [
    ['projects', 'Project ID', 'P-OTHER'], ['projects', 'First Seen', '2026-07-01'],
    ['projects', 'Entity', 'Other'], ['projects', 'Country', 'UK'],
    ['projects', 'Use Case', 'Another initiative'], ['projects', 'Legacy Evidence ID', 'E-NEW'],
    ['claims', 'Claim ID', 'C-OTHER'], ['claims', 'Project ID', 'P-OTHER'],
    ['claims', 'Claim Date', '2026-08-02'], ['claims', 'Claimant', 'Other'],
    ['claims', 'Claim Type', 'Other'], ['claims', 'Original Claim', 'Reach 50 teams.'],
    ['claims', 'Target', 50], ['claims', 'Baseline', 0], ['claims', 'Unit', 'users'],
    ['claims', 'Target Date', '2027-09-02'], ['claims', 'Source URL', 'https://example.com/new'],
    ['claims', 'Source Quality', 1], ['claims', 'Unknown Original Field', 'new']
  ];
  for (const [table, field, value] of cases) {
    const base = fixture();
    const delta = table === 'projects' ? projectDelta(base) : claimDelta(base);
    delta.replacements[0].after[field] = value;
    assert.throws(() => mergeFrontierDelta(base, delta), /immutable|identity/i, `${table}.${field}`);
  }
});

test('a project refresh must link an Update for the same project', () => {
  for (const mode of ['absent', 'unknown', 'wrong-project']) {
    const base = fixture();
    const delta = projectDelta(base);
    if (mode === 'absent') delete delta.replacements[0].updateId;
    if (mode === 'unknown') delta.updates = [];
    if (mode === 'wrong-project') delta.updates[0]['Project ID'] = 'P-OTHER';
    assert.throws(() => mergeFrontierDelta(base, delta), /linked Update|updateId/i);
  }
});

test('project refreshes cannot move Last Updated backward', () => {
  const base = fixture();
  const delta = projectDelta(base);
  delta.replacements[0].after['Last Updated'] = '2026-08-01';
  assert.throws(() => mergeFrontierDelta(base, delta), /Last Updated/);
});

test('verified claim outcomes need a resolution date and separate evidence', () => {
  for (const field of ['Resolution Date', 'Resolution Source']) {
    const base = fixture();
    const delta = claimDelta(base);
    delta.replacements[0].after[field] = '';
    assert.throws(() => mergeFrontierDelta(base, delta), /Resolution Date|Resolution Source/);
  }
});

test('an Unverified claim can document absence of evidence without inventing a source', () => {
  const base = fixture();
  const delta = claimDelta(base);
  Object.assign(delta.replacements[0].after, {
    'Resolution Status': 'Unverified', 'Actual Result': '', 'Actual Unit': '',
    'Resolution Source': '', Notes: 'Due-date review found no public confirmation.'
  });
  const merged = mergeFrontierDelta(base, delta);
  assert.equal(merged.claims[0]['Resolution Status'], 'Unverified');
  assert.equal(validateFrontierData(merged), true);
});

test('only explicit well-formed Project and Claim replacements are accepted', () => {
  for (const replacements of [null, {}, [{ table: 'runs' }], [{ table: 'projects' }]]) {
    assert.throws(() => mergeFrontierDelta(fixture(), { replacements }), /replacement|changeId|table/i);
  }
  assert.throws(() => mergeFrontierDelta(fixture(), { changeHistory: [] }), /changeHistory/);
});

test('snapshot validation rejects corrupt or detached change history', () => {
  const base = fixture();
  const delta = projectDelta(base);
  for (const corrupt of [
    (data) => { data.changeHistory = {}; },
    (data) => { data.changeHistory.push(structuredClone(data.changeHistory[0])); },
    (data) => { data.changeHistory[0].after.Stage = 'Scaled'; },
    (data) => { data.changeHistory[0].before.Entity = 'Other entity'; },
    (data) => { data.changeHistory[0].updateId = 'U-MISSING'; }
  ]) {
    const data = structuredClone(base);
    data.projects[0] = structuredClone(delta.replacements[0].after);
    data.updates = structuredClone(delta.updates);
    data.meta.counts.updates = 1;
    data.changeHistory = structuredClone(delta.replacements);
    corrupt(data);
    assert.throws(() => validateFrontierData(data), /changeHistory|changeId|history|immutable|linked Update/i);
  }
});
