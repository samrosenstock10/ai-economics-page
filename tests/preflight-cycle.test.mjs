import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAutomationStatus, classifyCycle, logicalDateForMostRecentAnchor, validateAutomationStatus, validateFrontier } from '../scripts/preflight-cycle.mjs';

function frontier(overrides = {}) {
  const value = {
    meta: {
      title: 'AI Project Tracker',
      sourceSpreadsheet: 'https://docs.google.com/spreadsheets/d/1Q7_v1KKXj9a4Crt5kQxDOki1BxrO0b7xcfByqqWMmPM/edit',
      generatedAt: '2026-09-01T22:17:41-04:00',
      timezone: 'America/New_York',
      schemaVersion: '2.0',
      latestRun: '2026-09-01 end-to-end verified',
      counts: { projects: 1, updates: 0, bottlenecks: 1, claims: 1, runs: 1 },
      logicalDate: '2026-09-01',
    },
    projects: [{}],
    updates: [],
    bottlenecks: [{}],
    claims: [{}],
    runs: [{}],
  };
  if (overrides.meta) Object.assign(value.meta, overrides.meta);
  for (const key of ['projects', 'updates', 'bottlenecks', 'claims', 'runs']) {
    if (key in overrides) value[key] = overrides[key];
  }
  return value;
}

test('classifies a verified same-date frontier as complete', () => {
  const result = classifyCycle({ frontier: frontier(), logicalDate: '2026-09-01' });
  assert.equal(result.status, 'GITHUB_COMPLETE');
});

test('prioritizes pending delta inputs over a complete frontier', () => {
  const result = classifyCycle({ frontier: frontier(), logicalDate: '2026-09-01', pendingDeltas: ['.frontier-delta-2026-09-01-2200.json'] });
  assert.equal(result.status, 'PUBLICATION_PENDING');
  assert.equal(result.reason, 'pending_frontier_inputs');
});

test('prioritizes pending part inputs over a complete frontier', () => {
  const result = classifyCycle({ frontier: frontier(), logicalDate: '2026-09-01', pendingDeltas: ['.frontier-part-2026-09-01-01'] });
  assert.equal(result.status, 'PUBLICATION_PENDING');
  assert.equal(result.reason, 'pending_frontier_inputs');
});

test('classifies an older frontier as stale', () => {
  const result = classifyCycle({ frontier: frontier(), logicalDate: '2026-09-02' });
  assert.equal(result.status, 'STALE_LOGICAL_DATE');
});

test('requires the latest run to be end-to-end verified for the same date', () => {
  const value = frontier({ meta: { latestRun: '2026-09-01 research complete' } });
  const result = classifyCycle({ frontier: value, logicalDate: '2026-09-01' });
  assert.equal(result.status, 'PUBLICATION_PENDING');
});

test('rejects a count mismatch as invalid state', () => {
  const value = frontier({ meta: { counts: { projects: 2, updates: 0, bottlenecks: 1, claims: 1, runs: 1 } } });
  assert.throws(() => validateFrontier(value), /projects_count_mismatch/);
  assert.equal(classifyCycle({ frontier: value, logicalDate: '2026-09-01' }).status, 'INVALID_STATE');
});

test('builds and validates a compact status snapshot', () => {
  const value = frontier();
  const status = buildAutomationStatus(value, []);
  assert.equal(status.githubComplete, true);
  assert.deepEqual(validateAutomationStatus(status, value, []), { logicalDate: '2026-09-01', githubComplete: true, pendingDeltas: 0 });
});

test('resolves the prior date before the 9 PM New York anchor', () => {
  assert.equal(logicalDateForMostRecentAnchor(new Date('2026-09-02T14:00:00Z')), '2026-09-01');
});

test('resolves the current date after the 9 PM New York anchor', () => {
  assert.equal(logicalDateForMostRecentAnchor(new Date('2026-09-03T02:00:00Z')), '2026-09-02');
});
