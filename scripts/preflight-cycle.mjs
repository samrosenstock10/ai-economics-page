import { appendFile, readdir, readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

export const EXPECTED = {
  title: 'AI Project Tracker',
  sourceSpreadsheet: 'https://docs.google.com/spreadsheets/d/1Q7_v1KKXj9a4Crt5kQxDOki1BxrO0b7xcfByqqWMmPM/edit',
  timezone: 'America/New_York',
  schemaVersion: '2.0',
};

const COLLECTIONS = ['projects', 'updates', 'bottlenecks', 'claims', 'runs'];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function validateDate(value, path) {
  invariant(typeof value === 'string' && DATE_RE.test(value), `${path}_invalid:${value}`);
  const parsed = new Date(`${value}T00:00:00Z`);
  invariant(!Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value, `${path}_invalid:${value}`);
}

export function validateFrontier(frontier) {
  invariant(frontier && typeof frontier === 'object' && !Array.isArray(frontier), 'frontier_not_object');
  const meta = frontier.meta;
  invariant(meta && typeof meta === 'object' && !Array.isArray(meta), 'frontier_meta_missing');
  invariant(meta.title === EXPECTED.title, `frontier_title_invalid:${meta.title}`);
  invariant(meta.sourceSpreadsheet === EXPECTED.sourceSpreadsheet, 'frontier_source_spreadsheet_invalid');
  invariant(meta.timezone === EXPECTED.timezone, `frontier_timezone_invalid:${meta.timezone}`);
  invariant(meta.schemaVersion === EXPECTED.schemaVersion, `frontier_schema_version_invalid:${meta.schemaVersion}`);
  invariant(typeof meta.generatedAt === 'string' && Number.isFinite(Date.parse(meta.generatedAt)), `frontier_generated_at_invalid:${meta.generatedAt}`);
  validateDate(meta.logicalDate, 'frontier_logical_date');
  invariant(typeof meta.latestRun === 'string' && meta.latestRun.trim().length > 0, 'frontier_latest_run_invalid');
  invariant(meta.counts && typeof meta.counts === 'object' && !Array.isArray(meta.counts), 'frontier_counts_missing');

  const counts = {};
  for (const collection of COLLECTIONS) {
    invariant(Array.isArray(frontier[collection]), `frontier_${collection}_not_array`);
    invariant(Number.isInteger(meta.counts[collection]) && meta.counts[collection] >= 0, `frontier_${collection}_count_invalid`);
    invariant(meta.counts[collection] === frontier[collection].length, `frontier_${collection}_count_mismatch:${meta.counts[collection]}:${frontier[collection].length}`);
    counts[collection] = frontier[collection].length;
  }

  return {
    logicalDate: meta.logicalDate,
    generatedAt: meta.generatedAt,
    latestRun: meta.latestRun,
    counts,
  };
}

export async function findPendingDeltas(dataDirectory = 'data') {
  const entries = await readdir(dataDirectory, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && /^\.frontier-delta-.+\.json$/.test(entry.name))
    .map((entry) => entry.name)
    .sort();
}

export function classifyCycle({ frontier, logicalDate, pendingDeltas = [] }) {
  try {
    validateDate(logicalDate, 'requested_logical_date');
    const validated = validateFrontier(frontier);
    if (pendingDeltas.length > 0) {
      return { status: 'PUBLICATION_PENDING', reason: 'pending_frontier_deltas', pendingDeltas, ...validated };
    }
    if (validated.logicalDate > logicalDate) {
      return { status: 'INVALID_STATE', reason: 'frontier_ahead_of_requested_logical_date', pendingDeltas, ...validated };
    }
    if (validated.logicalDate < logicalDate) {
      return { status: 'STALE_LOGICAL_DATE', reason: 'frontier_older_than_requested_logical_date', pendingDeltas, ...validated };
    }
    const expectedRunPrefix = `${validated.logicalDate} `;
    if (!validated.latestRun.startsWith(expectedRunPrefix) || !/end-to-end verified/i.test(validated.latestRun)) {
      return { status: 'PUBLICATION_PENDING', reason: 'latest_run_not_end_to_end_verified', pendingDeltas, ...validated };
    }
    return { status: 'GITHUB_COMPLETE', reason: 'frontier_verified_for_logical_date', pendingDeltas, ...validated };
  } catch (error) {
    return {
      status: 'INVALID_STATE',
      reason: error instanceof Error ? error.message : String(error),
      pendingDeltas,
    };
  }
}

export function buildAutomationStatus(frontier, pendingDeltas = []) {
  const validated = validateFrontier(frontier);
  return {
    schemaVersion: '1.0.0',
    frontier: {
      logicalDate: validated.logicalDate,
      generatedAt: validated.generatedAt,
      latestRun: validated.latestRun,
      counts: validated.counts,
    },
    pendingDeltas,
    githubComplete:
      pendingDeltas.length === 0 &&
      validated.latestRun.startsWith(`${validated.logicalDate} `) &&
      /end-to-end verified/i.test(validated.latestRun),
  };
}

export function validateAutomationStatus(status, frontier, pendingDeltas = []) {
  invariant(status?.schemaVersion === '1.0.0', 'automation_status_schema_version_invalid');
  const expected = buildAutomationStatus(frontier, pendingDeltas);
  invariant(JSON.stringify(status.frontier) === JSON.stringify(expected.frontier), 'automation_status_frontier_mismatch');
  invariant(JSON.stringify(status.pendingDeltas) === JSON.stringify(expected.pendingDeltas), 'automation_status_pending_deltas_mismatch');
  invariant(status.githubComplete === expected.githubComplete, 'automation_status_completion_mismatch');
  return { logicalDate: status.frontier.logicalDate, githubComplete: status.githubComplete, pendingDeltas: status.pendingDeltas.length };
}

function argValue(args, name, fallback = null) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : fallback;
}

async function main() {
  const args = process.argv.slice(2);
  const frontierPath = argValue(args, '--frontier', 'data/frontier.json');
  const statusPath = argValue(args, '--status', 'data/automation-status.json');
  const dataDirectory = argValue(args, '--data-directory', 'data');
  const logicalDate = argValue(args, '--logical-date');
  const writeStatus = args.includes('--write-status');
  const validateOnly = args.includes('--validate-only');

  const frontierText = await readFile(frontierPath, 'utf8');
  const frontier = JSON.parse(frontierText);
  const pendingDeltas = await findPendingDeltas(dataDirectory);

  if (writeStatus) {
    const status = buildAutomationStatus(frontier, pendingDeltas);
    await writeFile(statusPath, `${JSON.stringify(status, null, 2)}\n`, 'utf8');
    console.log(JSON.stringify({ status: 'STATUS_WRITTEN', path: statusPath, logicalDate: status.frontier.logicalDate, githubComplete: status.githubComplete }));
    return;
  }

  if (validateOnly) {
    const status = JSON.parse(await readFile(statusPath, 'utf8'));
    const result = validateAutomationStatus(status, frontier, pendingDeltas);
    console.log(JSON.stringify({ status: 'VALID', ...result }));
    return;
  }

  invariant(logicalDate, 'logical_date_required');
  const result = classifyCycle({ frontier, logicalDate, pendingDeltas });
  if (process.env.GITHUB_OUTPUT) {
    await appendFile(
      process.env.GITHUB_OUTPUT,
      `status=${result.status}\nreason=${String(result.reason).replaceAll('\n', ' ')}\nlogical_date=${result.logicalDate ?? ''}\npending_deltas=${result.pendingDeltas?.length ?? 0}\n`,
    );
  }
  console.log(JSON.stringify(result));
  if (result.status === 'INVALID_STATE') process.exitCode = 2;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
