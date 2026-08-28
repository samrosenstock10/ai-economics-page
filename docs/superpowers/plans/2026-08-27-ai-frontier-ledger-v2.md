# AI Frontier Ledger v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the broad v1 evidence archive as the active system with a project-centric AI Frontier Ledger, while preserving v1 as a read-only archive.

**Architecture:** Google Sheets is the canonical research database. A validated GitHub snapshot (`data/frontier.json`) is the public read model. A static Vercel site renders only a searchable/filterable Projects database. The scheduled ChatGPT task maintains Projects, Updates, Bottlenecks, Claims, and Runs, publishes deltas, and verifies production.

**Tech Stack:** Google Sheets API, GitHub Actions, Node.js 24, static HTML/CSS/JavaScript, Vercel.

**Spec:** `docs/superpowers/specs/2026-08-27-ai-frontier-ledger-v2.md`

## Global Constraints

- Preserve `data/ledger.json` unchanged as the v1 archive.
- Do not migrate generic policy/news/research solely to preserve counts.
- Primary sources should dominate new collection.
- Public site is database-only: no charts, synthetic scores, rankings, or AI-generated takeaways.
- Top-level taxonomy remains stable; emergent use-case tags may be added over time.
- Zero-result collection runs are valid and must be recorded.

---

### Task 1: Create v2 canonical spreadsheet

**Files:** Google Sheet `AI Frontier Ledger`

**Interfaces:**
- Produces canonical tabs: Projects, Updates, Bottlenecks, Claims, Runs, Taxonomy, Methodology, Legacy Index.
- Produces the source URL stored in `data/frontier.json.meta.sourceSpreadsheet`.

- [ ] Rename the default sheet to `Projects` and add the remaining seven tabs.
- [ ] Add stable v2 headers and freeze header rows.
- [ ] Add taxonomy values for domains, project stages, bottleneck categories, source quality, and claim resolution status.
- [ ] Add methodology/inclusion rules and a Legacy Index pointing to the v1 GitHub archive.
- [ ] Seed only clearly qualifying v1 project records.
- [ ] Verify the key sheet ranges contain the expected headers and seed rows.

### Task 2: Add schema validation tests first

**Files:**
- Create: `tests/frontier.test.mjs`
- Modify: `package.json`
- Create: `lib/frontier-schema.mjs`
- Modify: `scripts/validate-data.mjs`

**Interfaces:**
- `validateFrontierData(data)` throws on malformed snapshots and returns `true` on valid snapshots.

- [ ] Write failing tests for missing required v2 arrays, duplicate IDs, invalid project stages, and broken project references.
- [ ] Run tests and verify they fail against the v1 implementation for the expected reason.
- [ ] Implement `lib/frontier-schema.mjs` with strict but stable validation.
- [ ] Update `scripts/validate-data.mjs` to validate `data/frontier.json` using the shared validator.
- [ ] Add `npm test` and run both tests and validation until green.

### Task 3: Create v2 snapshot and delta assembler

**Files:**
- Create: `data/frontier.json`
- Create: `scripts/apply-frontier-deltas.mjs`
- Modify: `.github/workflows/assemble-ledger.yml`

**Interfaces:**
- Delta keys: `projects`, `updates`, `bottlenecks`, `claims`, `runs`.
- Unique IDs: Project ID, Update ID, Signal ID, Claim ID, Run ID.

- [ ] Write a failing test that requires append-only delta merging and rejects conflicting existing IDs.
- [ ] Implement `apply-frontier-deltas.mjs` with append-only merge semantics.
- [ ] Create an initial v2 snapshot with seed projects and metadata.
- [ ] Update the GitHub workflow to assemble `.frontier-delta-*.json`, validate, remove deltas, and commit the snapshot.
- [ ] Run tests and validation.

### Task 4: Simplify public site to database browser

**Files:**
- Modify: `index.html`
- Modify: `app.js`
- Modify: `styles.css`

**Interfaces:**
- Site loads `./data/frontier.json`.
- Search input: `#project-search`.
- Filters: `#domain-filter`, `#stage-filter`, `#bottleneck-filter`.
- Table body: `#projects-body`.

- [ ] Write failing static/UI tests requiring database controls and forbidding the old chart section.
- [ ] Replace dashboard/analysis markup with a restrained Projects database layout.
- [ ] Render project rows, source links, and empty states.
- [ ] Implement text search and domain/stage/bottleneck filtering.
- [ ] Make the table usable on mobile with horizontal scrolling and compact controls.
- [ ] Run tests and validation.

### Task 5: Update documentation and scheduled collector

**Files:**
- Modify: `README.md`
- Modify: `AUTOMATION.md`

**Interfaces:**
- Scheduled collector writes to the new Google Sheet and publishes v2 deltas to GitHub.

- [ ] Rewrite documentation around project-centric collection and the v1 archive.
- [ ] Update the active ChatGPT automation prompt to the v2 methodology and new Sheet URL.
- [ ] Preserve the existing recovery cadence and idempotent logical-run behavior.
- [ ] Include a one-time conservative v1 migration instruction.

### Task 6: Review, merge, and verify production

**Files:** Git branch / Vercel deployment

- [ ] Run `npm test` and `npm run validate` on the final branch state.
- [ ] Review the branch diff for accidental deletion or exposure of v1 archival data.
- [ ] Merge the branch to `main`.
- [ ] Confirm Vercel creates a READY production deployment.
- [ ] Fetch the production homepage and confirm it loads the v2 database, has no chart output, and exposes the new Sheet link.
