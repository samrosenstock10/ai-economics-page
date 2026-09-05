# AI Project Tracker

A prospective, project-first database of real-world AI deployment.

The purpose is not to archive AI news. It is to preserve information that becomes hard to reconstruct later: what organizations were trying to do with AI, when projects moved from announcement to deployment and scale, what bottlenecks constrained them, and whether explicit claims were eventually realized.

## Active v2 system

The canonical research database is the Google Sheet:

- https://docs.google.com/spreadsheets/d/1Q7_v1KKXj9a4Crt5kQxDOki1BxrO0b7xcfByqqWMmPM/edit

The public read model is:

- `data/frontier.json`

The v2 schema contains five longitudinal datasets:

- **Projects** — the underlying real-world deployment or initiative; this is the atomic object.
- **Updates** — material changes in stage, scale, economics, or state.
- **Bottlenecks** — evidence-backed constraints at the project or broader-domain level.
- **Claims** — testable promises, targets, deadlines, or operating milestones that can later be resolved.
- **Runs** — the collection denominator, including days with zero qualifying findings.

The public site is intentionally only a searchable/filterable Projects database. It does not publish charts, rankings, synthetic progress scores, or AI-generated takeaways yet. Those outputs should be added only when the longitudinal dataset is mature enough to support them.

## Historical v1 archive

The previous AI Economic Reality Ledger remains preserved unchanged at:

- `data/ledger.json`

V1 mixed deployments with policy, research, financing, perception, and other evidence. V2 does not bulk-copy those rows. Only legacy records that clearly meet the Project definition are migrated, and their original `Evidence ID` is retained as provenance.

## Collection rules

A new Project requires a named organization plus a concrete AI deployment, operating initiative, or clearly scoped build with a defined workflow/use case.

Generic AI news, broad policy discussion, standalone forecasts, financing chatter, and research scenarios do not become Projects unless they directly create or materially change a tracked deployment.

Primary sources should dominate new collection: filings, earnings calls, investor materials, official company/customer disclosures, regulators, official statistics, and academic research. High-quality journalism is useful for discovery and corroboration, but should not be the default primary source when an original source exists.

## Local verification

```bash
npm test
npm run validate
npm run serve
```

Then open http://localhost:4173.

The app is static HTML/CSS/JavaScript; Vercel serves the repository directly.

## Publishing

Routine scheduled collection writes the canonical Google Sheet first, then publishes new rows and explicit existing-Project/Claim replacements as `data/.frontier-delta-*.json`. Replacements require the expected prior row and a stable change ID; the snapshot retains their before/after history. See `AUTOMATION.md` for the delta contract. GitHub Actions merges deltas into `data/frontier.json`, validates the result, removes the temporary deltas, and commits the reviewed snapshot. Vercel deploys from `main`.

Production:

- https://ai-economic-reality-ledger.vercel.app
