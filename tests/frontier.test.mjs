import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);

async function optionalImport(relativePath) {
  try {
    return await import(pathToFileURL(path.join(root, relativePath)).href + `?t=${Date.now()}`);
  } catch {
    return null;
  }
}

function validFixture() {
  return {
    meta: {
      title: 'AI Frontier Ledger',
      sourceSpreadsheet: 'https://docs.google.com/spreadsheets/d/example/edit',
      generatedAt: '2026-08-27T20:10:00-04:00',
      timezone: 'America/New_York',
      schemaVersion: '2.0',
      counts: { projects: 1, updates: 0, bottlenecks: 0, claims: 0, runs: 1 }
    },
    projects: [{
      'Project ID': 'P-1',
      'First Seen': '2026-08-27',
      'Last Updated': '2026-08-27',
      Entity: 'Example',
      Domain: 'Software & Coding',
      'Use Case': 'Coding agent',
      'Project Summary': 'A concrete deployment.',
      Stage: 'Pilot',
      'Primary Bottleneck': 'Reliability',
      'Source Quality': 4,
      'Discovery Source': 'https://example.com/source',
      Status: 'Active'
    }],
    updates: [],
    bottlenecks: [],
    claims: [],
    runs: [{ 'Run ID': 'R-1', 'Logical Date': '2026-08-27' }]
  };
}

test('schema module exports validateFrontierData', async () => {
  const mod = await optionalImport('lib/frontier-schema.mjs');
  assert.equal(typeof mod?.validateFrontierData, 'function');
});

test('valid frontier fixture passes schema validation', async () => {
  const mod = await optionalImport('lib/frontier-schema.mjs');
  assert.equal(mod?.validateFrontierData(validFixture()), true);
});

test('duplicate project IDs are rejected', async () => {
  const mod = await optionalImport('lib/frontier-schema.mjs');
  const data = validFixture();
  data.projects.push({ ...data.projects[0] });
  data.meta.counts.projects = 2;
  assert.throws(() => mod?.validateFrontierData(data), /Duplicate Project ID/);
});

test('claims may only reference known projects', async () => {
  const mod = await optionalImport('lib/frontier-schema.mjs');
  const data = validFixture();
  data.claims.push({
    'Claim ID': 'C-1',
    'Project ID': 'P-MISSING',
    'Claim Date': '2026-08-27',
    Claimant: 'Example',
    'Claim Type': 'Scale target',
    'Original Claim': 'Reach 100 units',
    'Resolution Status': 'Open',
    'Source Quality': 4,
    'Source URL': 'https://example.com/claim'
  });
  data.meta.counts.claims = 1;
  assert.throws(() => mod?.validateFrontierData(data), /unknown Project ID/);
});

test('delta module merges new rows and rejects conflicting existing IDs', async () => {
  const mod = await optionalImport('lib/frontier-delta.mjs');
  assert.equal(typeof mod?.mergeFrontierDelta, 'function');
  const base = validFixture();
  const added = mod.mergeFrontierDelta(base, {
    projects: [{ ...base.projects[0], 'Project ID': 'P-2', Entity: 'Second' }],
    updates: [], bottlenecks: [], claims: [], runs: []
  });
  assert.equal(added.projects.length, 2);
  assert.throws(() => mod.mergeFrontierDelta(base, {
    projects: [{ ...base.projects[0], Entity: 'Changed' }]
  }), /conflicting existing Project ID P-1/);
});

test('public site is a database browser, not an analysis dashboard', async () => {
  const html = await readFile(path.join(root, 'index.html'), 'utf8');
  assert.match(html, /id="project-search"/);
  assert.match(html, /id="domain-filter"/);
  assert.match(html, /id="stage-filter"/);
  assert.match(html, /id="bottleneck-filter"/);
  assert.match(html, /id="projects-body"/);
  assert.doesNotMatch(html, /stage-chart|chart-section/);
});
