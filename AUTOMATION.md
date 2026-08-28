# AI Frontier Ledger — scheduled collector

## Purpose

Maintain a prospective record of real-world AI projects that will be materially harder to reconstruct later. This is not a general AI-news dashboard.

The core question is:

> What are humans actually trying to do with AI, which projects move from experiment to deployment to scale, what blocks them, and what economic value eventually appears?

## Canonical sources and targets

- Canonical spreadsheet: https://docs.google.com/spreadsheets/d/1Q7_v1KKXj9a4Crt5kQxDOki1BxrO0b7xcfByqqWMmPM/edit
- GitHub: https://github.com/samrosenstock10/ai-economics-page
- Production: https://ai-economic-reality-ledger.vercel.app
- Active snapshot: `data/frontier.json`
- Historical v1 archive: `data/ledger.json`
- Schema version: 2.0
- Timezone: America/New_York

## Logical-run and recovery behavior

The 9 PM ET execution is the daily anchor. The later 10 PM, 11 PM, midnight, 2 AM, 4 AM, and 6 AM executions are recovery checks for the same logical daily cycle, not separate research days.

Before researching, inspect the `Runs` tab for the applicable logical date. If a completed logical run already exists, do not repeat research or append duplicate rows. Only repair incomplete publication/verification work if needed. Every write must be idempotent by stable IDs.

## Each substantive logical run

1. Read the `Methodology`, `Projects`, `Updates`, `Bottlenecks`, `Claims`, `Runs`, and `Taxonomy` tabs before writing.
2. Review due Projects and open Claims first. Search for later evidence that changes stage, scale, bottlenecks, measured economics, or claim resolution.
3. Then search for genuinely new real-world AI projects. Favor primary sources and concrete operating evidence over general news volume.
4. Add a new Project only for a named organization with a concrete deployment, operating initiative, or clearly scoped build and a specific workflow/use case.
5. If new evidence refers to an existing underlying initiative, append an Update and refresh the current Project state rather than creating a duplicate Project.
6. Add a Bottleneck signal only when evidence shows a constraint is actually limiting, gating, or shaping a project/domain. Do not log generic commentary merely mentioning a possible constraint.
7. Add a Claim only when it is testable later: a measurable target, scale target, deadline, economic result, or explicit operating milestone.
8. Prefer filings, earnings calls, investor materials, official company/customer disclosures, regulators, official statistics, and academic sources. Use Reuters and other high-quality journalism mainly for discovery/corroboration when a primary source can be found.
9. Do not force findings. A zero-result day is valid. Always append one `Runs` record for a completed logical run.

## One-time v1 migration

On the first v2 substantive collection cycle only, inspect `data/ledger.json` conservatively for additional legacy records that clearly satisfy the new Project definition. Migrate only concrete real-world deployments/builds. Do not migrate generic policy, macro research, forecasts, financing chatter, perception, or unrelated news to preserve row counts. Store the original `Evidence ID` in `Legacy Evidence ID`.

After this one-time pass, treat `data/ledger.json` as read-only history.

## Stable taxonomy

Keep the top-level domains in the `Taxonomy` tab stable. Create emergent use-case labels underneath them as new workflows appear; do not invent a rigid 100-category structure today.

Project stage values are:

- Announced
- Prototype
- Pilot
- Production
- Scaled
- Measured
- Paused / Abandoned

Use the defined bottleneck taxonomy when possible. If a genuinely new recurring bottleneck appears, add it to `Taxonomy` deliberately rather than creating near-duplicate wording per project.

## Claim resolution

For due Claims, explicitly record later status using the defined resolution vocabulary. A passed target date with no adequate public verification is itself useful information and should be recorded as `Unverified` when responsible to do so; do not silently leave missed deadlines open forever.

Never rewrite the original claim to match later reality. Preserve the claim and add resolution evidence separately.

## Publication

After the Sheet is updated:

1. Create one small `data/.frontier-delta-<logical-date>-<time>.json` file containing only the newly appended v2 rows plus refreshed metadata.
2. Let the GitHub `Assemble AI Frontier Ledger` workflow merge the delta into `data/frontier.json` using append-only ID checks.
3. Confirm the workflow validation passes and the temporary delta is removed.
4. Verify `data/frontier.json` counts match the canonical Sheet rows represented in the public snapshot.
5. Verify the connected Vercel production deployment is `READY` and the live site loads the current Projects database.

Do not publish charts, synthetic scores, sector rankings, trend conclusions, AI summaries, or decorative outputs during routine runs. The current public site should remain a clean database until an explicit later redesign is approved after the dataset has matured.

## What this dataset should eventually enable

Without computing these routinely yet, preserve data needed for future analysis of:

- new use-case emergence and category acceleration;
- announced → pilot → production → scale transitions;
- time to production/scale;
- measured economic mechanisms and ROI;
- bottleneck migration over time;
- claim validation and management credibility;
- repeated enabling vendors/platforms across successful projects.
