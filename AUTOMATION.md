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
- Historical v1 archive: `data/ledger.json`
- Schema version: 2.0
- Timezone: America/New_York

## Scheduler-level recovery loop

The 9:00 PM ET invocation is the single daily anchor. The 10 PM, 11 PM, midnight, 1 AM, 2 AM, 3 AM, 4 AM, 5 AM, 6 AM, 7 AM, and 8 AM invocations are recovery checks for that same logical cycle, not separate research days.

At the start of every invocation:

1. Compute `logical_date` from the most recent 9 PM ET anchor. From midnight through 8:59 AM, the logical date is the prior calendar date.
2. Before expensive research, inspect the `Runs` tab, all v2 rows for that logical date, GitHub `main`, `data/frontier.json`, relevant GitHub Actions state, and stable production.
3. A cycle is complete only when research/review is complete, intended Sheet rows exist exactly once, the GitHub snapshot is assembled and validated, temporary deltas are no longer required, Vercel production is `READY`, and the stable URL serves the current Projects database.
4. If all gates pass, stop silently. Do not repeat research, append rows, commit, deploy, or modify timestamps merely because a recovery invocation fired.
5. If the Sheet is complete but GitHub publication is incomplete, resume publication only from verified Sheet rows. Do not redo research.
6. If GitHub is current but production is stale/unverified, recover production only. Do not touch the Sheet or create another data commit.
7. Reconcile partial writes by stable ID, underlying project identity, source URL/date, and parent Project ID before adding anything.
8. After a timeout, stale SHA, 404, or network error, re-read fresh state before another write. Never blindly repeat the same failed mutation.
9. Before beginning a newer logical date, repair any incomplete cycle from the prior 48 hours first.
10. Never disable, clone, pause, or reschedule this automation as a recovery action. Never create a replacement spreadsheet, repository, Vercel project, or automation.

The 8:00 AM invocation is the final same-cycle recovery slot. Earlier transient failures remain silent while later recovery slots remain. If the 8 AM run still cannot complete after fresh safe retries, preserve the last valid state and leave a concise blocker; the next 9 PM anchor must repair that unfinished cycle before new research.

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
5. If new evidence refers to an existing initiative, append an Update and refresh the current Project state rather than creating a duplicate Project.
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
2. Create one small `data/.frontier-delta-<logical_date>-<time>.json` containing only genuinely new v2 rows plus refreshed metadata. On recovery, reconstruct any needed delta from exact verified Sheet rows rather than re-researching.
3. Let the GitHub `Assemble AI Project Tracker` workflow merge, validate, and clean the delta into `data/frontier.json`.
4. Fetch GitHub `main` again and verify snapshot counts, stable IDs, linked Project IDs, schema version, source Sheet, and generated timestamp.
5. Verify the connected Vercel production deployment is `READY`, the stable URL returns HTTP 200, and it loads the current searchable Projects database.
6. Only after Sheet + GitHub + production pass may the logical cycle be treated as complete. The final Run audit row should represent that completed end-to-end state.

Routine GitHub changes should deploy through the existing Git integration. If GitHub is current but production is demonstrably stale or broken, recover using only the existing Vercel project; never create another project.

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
