# AI Project Tracker — scheduled collector

## Purpose

Maintain a prospective record of real-world AI projects that will be materially harder to reconstruct later. This is not a general AI-news dashboard.

The core question is:

> What are organizations actually trying to do with AI, which projects move from experiment to deployment to scale, what blocks them, and what economic value eventually appears?

## Canonical sources and targets

- Canonical spreadsheet: https://docs.google.com/spreadsheets/d/1Q7_v1KKXj9a4Crt5kQxDOki1BxrO0b7xcfByqqWMmPM/edit
- GitHub: https://github.com/samrosenstock10/ai-economics-page on `main`
- Production: https://ai-economic-reality-ledger.vercel.app
- Vercel project: `prj_39ATqq1AzAUk0Hu6cfTEcv5P3g1e`
- Active snapshot: `data/frontier.json`
- Compact recovery state: `data/automation-status.json`
- Historical v1 archive: `data/ledger.json`
- Schema version: 2.0
- Timezone: America/New_York

## Mandatory cheap preflight

This section overrides any older instruction to read every Sheet tab at the start of every recovery invocation.

1. Resolve `logical_date` from the most recent 9:00 PM America/New_York anchor. From midnight through 8:59 AM, the logical date is the prior calendar date.
2. Before loading the full database or doing public research, read only `data/automation-status.json`, the `Runs` row or rows for `logical_date`, any open exact-title parity incident, current Vercel production status, and the stable production URL.
3. Treat GitHub as complete only when the compact status has schema `1.0.0`, `pendingDeltas` is empty, `githubComplete` is true, and its frontier logical date equals `logical_date`. The matching Sheet Run must truthfully state end-to-end completion, and production must be `READY`, HTTP 200, and current.
4. If all three layers pass, stop silently. Do not read `Methodology`, `Projects`, `Updates`, `Bottlenecks`, `Claims`, `Taxonomy`, the full frontier snapshot, or public sources. Do not repeat research, append a Run row, commit, deploy, change a timestamp, notify, or email merely because a recovery invocation fired.
5. If GitHub reports pending publication inputs or an unverified latest run while the Sheet is complete, perform publication recovery only. Do not redo research or recreate Sheet rows.
6. If GitHub's logical date is older than `logical_date`, the Sheet Run is absent/incomplete, or a prior-48-hour cycle is unresolved, then load the full current context required for substantive work or precise partial-write recovery.
7. If GitHub is complete but production is stale, perform production recovery only against the existing Vercel project. Do not touch the Sheet or create another GitHub data commit.
8. A malformed or internally inconsistent compact status is a system invariant failure. Preserve the last valid production state and inspect current `data/frontier.json` plus GitHub workflows before any mutation.

## Scheduler-level recovery loop

The 9:00 PM ET invocation is the single daily anchor. The 10 PM, 11 PM, midnight, 1 AM, 2 AM, 3 AM, 4 AM, 5 AM, 6 AM, 7 AM, and 8 AM invocations are recovery checks for that same logical cycle, not separate research days.

After the mandatory cheap preflight, continue only when a layer is incomplete:

1. A cycle is complete only when research/review is complete, intended Sheet rows exist exactly once, the GitHub snapshot and compact status are assembled and validated, temporary publication inputs are gone, Vercel production is `READY`, and the stable URL serves the current Projects database.
2. If the Sheet is complete but GitHub publication is incomplete, resume publication only from verified Sheet rows. Do not redo research.
3. If GitHub is current but production is stale/unverified, recover production only. Do not touch the Sheet or create another data commit.
4. Reconcile partial writes by stable ID, underlying project identity, source URL/date, and parent Project ID before adding anything.
5. After a timeout, stale SHA, 404, or network error, re-read fresh state before another write. Never blindly repeat the same failed mutation.
6. Before beginning a newer logical date, repair any incomplete cycle from the prior 48 hours first.
7. Never disable, clone, pause, or reschedule this automation as a recovery action. Never create a replacement spreadsheet, repository, Vercel project, or automation.

The 8:00 AM invocation is the final same-cycle recovery slot. Earlier transient failures remain silent while later recovery slots remain. If the 8 AM run still cannot complete after fresh safe retries, preserve the last valid state and leave one concise blocker; the next 9 PM anchor must repair that unfinished cycle before new research. The independent GitHub parity heartbeat is a detector, not a substitute for the scheduled worker.

## Idempotency and stable identity

- The unit of observation is the underlying project, not an article.
- Repeated evidence about one initiative becomes an Update or Claim resolution, not a duplicate Project.
- Re-read the Sheet immediately before writes.
- Reuse existing stable IDs on retries for the same underlying record.
- Project identity uses named organization + concrete initiative/workflow + geography/site when needed.
- Updates, Claims, and Bottlenecks must link to the relevant Project ID and source evidence.
- Never overwrite a conflicting stable ID without fresh diagnosis.
- Zero substantive findings are valid. A completed zero-result cycle may record one Run row after all verification gates pass.

## Each substantive logical run

1. Read `Methodology`, `Projects`, `Updates`, `Bottlenecks`, `Claims`, `Runs`, and `Taxonomy` before writing.
2. Review due Projects and open Claims first. Search for evidence that changes stage, scale, bottlenecks, measured economics, or claim resolution.
3. Then search for genuinely new real-world AI projects. Favor primary sources and concrete operating evidence over general news volume.
4. Add a new Project only for a named organization with a concrete deployment, operating initiative, or clearly scoped build and a specific workflow/use case.
5. If new evidence refers to an existing initiative, append an Update and refresh that Project's current state rather than creating a duplicate Project.
6. Add a Bottleneck signal only when evidence shows a constraint is actually limiting, gating, delaying, changing economics, or shaping a project/domain.
7. Add a Claim only when it is testable later: a measurable target, scale target, deadline, economic result, or explicit operating milestone.
8. Prefer filings, earnings calls, investor materials, official company/customer disclosures, regulators, official statistics, and academic sources. Use high-quality journalism mainly for discovery/corroboration when a primary source can be found.
9. Do not force findings.

## One-time v1 migration

If the conservative migration has not yet been completed, inspect `data/ledger.json` once for additional legacy records that clearly satisfy the new Project definition. Migrate only concrete real-world deployments/builds. Do not migrate generic policy, macro research, forecasts, financing chatter, perception, or unrelated news merely to preserve row counts. Store the original `Evidence ID` in `Legacy Evidence ID`.

After that pass, treat `data/ledger.json` as read-only history.

## Stable taxonomy

Keep the top-level domains in `Taxonomy` stable. Create emergent use-case labels underneath them as new workflows appear.

Project stages:

- Announced
- Prototype
- Pilot
- Production
- Scaled
- Measured
- Paused / Abandoned

Use the defined bottleneck taxonomy when possible. Add a genuinely new recurring bottleneck deliberately rather than creating near-duplicate wording.

## Claim resolution

For due Claims, record later status using the defined resolution vocabulary. A passed target date with no adequate public verification may be recorded as `Unverified` when responsible to do so. Never rewrite the original claim to match later reality; add resolution evidence separately.

## Publication and resume pipeline

1. Update and verify the canonical Sheet first.
2. Create one small `data/.frontier-delta-<logical_date>-<time>.json` containing genuinely new v2 rows, explicit replacements for changed existing Projects or Claims, and refreshed metadata. Use the existing-row contract below. On recovery, reconstruct any needed delta from exact verified Sheet rows rather than re-researching.
3. Let the GitHub `Assemble AI Project Tracker` workflow merge, validate, clean the delta into `data/frontier.json`, and atomically regenerate `data/automation-status.json`.
4. Fetch GitHub `main` again and verify snapshot counts, stable IDs, linked Project IDs, schema version, source Sheet, generated timestamp, compact status parity, and absence of temporary publication inputs.
5. Verify the connected Vercel production deployment is `READY`, the stable URL returns HTTP 200, and it loads the current searchable Projects database.
6. Only after Sheet + GitHub + production pass may the logical cycle be treated as complete. The final Run audit row should represent that completed end-to-end state.

Routine GitHub changes should deploy through the existing Git integration. If GitHub is current but production is demonstrably stale or broken, recover using only the existing Vercel project; never create another project.

### Existing-row delta contract

The normal `projects`, `updates`, `bottlenecks`, `claims`, and `runs` arrays remain append-only. An exact existing row is a harmless retry. A Project or Claim row that exactly matches a before/after state already archived for the same table and stable ID is also a consumed retry; it never replaces the current row. Any other different row with the same stable ID is rejected. Put changed existing Projects or Claims in the optional `replacements` array instead.

Each replacement contains:

- `changeId`: one stable, unique ID for this change, reused unchanged on retries (for example `CH-P-EXAMPLE-20260905-01`).
- `table`: `projects` or `claims`.
- `before`: the complete expected current row from fresh GitHub `data/frontier.json`.
- `after`: the complete replacement row, verified against the canonical Sheet. Preserve original values and types; do not send a partial patch.
- `updateId`: required for Projects, pointing to an Update for that same Project ID. Append the verified Update through `updates` in this delta, or reference an already published Update.

For example, construct the publication input from the rows already read and verified:

```js
const delta = {
  meta: verifiedMetadata,
  updates: [verifiedUpdate],
  replacements: [{
    changeId: 'CH-P-EXAMPLE-20260905-01',
    table: 'projects',
    before: currentGitHubProject,
    after: verifiedSheetProject,
    updateId: verifiedUpdate['Update ID']
  }]
};
```

Project replacements preserve `Project ID`, `First Seen`, `Entity`, `Country`, `Use Case`, and `Legacy Evidence ID`; `Last Updated` must be a calendar date and cannot move backward. Identity corrections require fresh diagnosis outside routine collection.

Claim replacements may change only `Next Review`, `Resolution Status`, `Resolution Date`, `Actual Result`, `Actual Unit`, `Realization %`, `Delay Days`, `Resolution Source`, and `Notes`. Every other field, including the original claim, target, deadline, claimant, and original source, remains unchanged. A non-Open resolution needs a calendar `Resolution Date`; `Validated`, `Partially validated`, `Contradicted`, and `Abandoned` also need separate `Resolution Source` evidence. `Unverified` and `Too early` may lack a source; explain the review in `Notes` without inventing evidence.

The assembler archives each consumed replacement, including its complete before/after rows, in the optional snapshot `changeHistory`. Never supply or rewrite `changeHistory` in a delta. History does not alter the five dataset counts or require migration of existing snapshots.

A replacement is applied only if the current row exactly matches `before` (object-key order does not matter). A recorded `changeId` with identical content is a no-op even after later changes; reusing it for different content is a conflict. Replaying a fully consumed older delta also preserves newer publication metadata. An unapplied delta with older metadata is rejected.

After a stale-row, history, or metadata conflict, re-read GitHub and the Sheet and reconcile the intended change against current evidence. Never simply substitute a new `before` value to force an old `after` through. Do not change the original claim or create a duplicate Project to evade a conflict. The assembly script validates the whole batch before writing the snapshot, so a failed batch leaves the published snapshot intact.

## Public-site scope

Do not publish charts, synthetic scores, sector rankings, trend conclusions, AI summaries, decorative outputs, or a synthetic global progress metric during routine runs. The public site remains a clean searchable project database until an explicit later redesign after the dataset has matured.

## What this dataset should eventually enable

Without computing these routinely yet, preserve data needed for future analysis of:

- new use-case emergence and category acceleration;
- announced → pilot → production → scale transitions;
- time to production/scale;
- measured economic mechanisms and ROI;
- bottleneck migration over time;
- claim validation and management credibility;
- repeated enabling vendors/platforms across successful projects.
