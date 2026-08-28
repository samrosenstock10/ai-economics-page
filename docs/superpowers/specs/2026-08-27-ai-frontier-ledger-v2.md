# AI Frontier Ledger v2 — Design Spec

## Purpose

Replace the broad article-centric AI Economic Reality Ledger with a prospective, project-centric AI Frontier Ledger that preserves information that is difficult to reconstruct later.

The core question is: **What are humans actually trying to do with AI, which projects move from experiment to real deployment to scale, what blocks them, and what economic value eventually appears?**

## Core design

The atomic unit is a **Project**, not an article. New observations attach to an existing project when they describe the same underlying deployment or initiative.

The system has four longitudinal layers:

1. **Projects** — concrete real-world AI deployments or initiatives.
2. **Updates** — material state changes for tracked projects.
3. **Bottleneck signals** — project-level or broader constraints and how they change over time.
4. **Claims** — testable promises with targets/deadlines that can later be resolved.

A fifth table, **Runs**, records the collection denominator, including zero-result runs.

## Inclusion rules

Include a new project only when it represents a concrete deployment, operating initiative, or clearly scoped build with a named organization and workflow/use case. Generic AI news, broad policy discussion, standalone forecasts, financing chatter, and research scenarios are not projects unless they directly create or materially change a tracked project.

A new observation should update an existing project rather than create a duplicate whenever the underlying initiative is the same.

Claims require a testable promise: a measurable target, deadline, scale target, or explicit operating milestone.

Bottleneck signals require evidence that a constraint is actually limiting or shaping deployment, not generic commentary.

Zero useful findings are acceptable.

## Stable taxonomy

Use durable top-level domains and allow emergent use-case tags beneath them:

- Software & Coding
- Enterprise & Back Office
- Sales & Customer Service
- Finance, Legal & Professional Work
- Healthcare & Life Sciences
- Science & R&D
- Education
- Media & Creativity
- Consumer & Personal Agents
- Manufacturing, Robotics & Logistics
- Transportation & Autonomy
- Government & Defense
- AI Infrastructure & Energy

Do not create a rigid 100-category taxonomy. New use-case tags may emerge over time while top-level domains remain stable.

## Source policy

Primary sources should dominate: filings, earnings calls, investor materials, official company announcements, customer disclosures, regulators, official statistics, and peer-reviewed/academic work. High-quality journalism can discover or corroborate a candidate but should not become the default primary source when an original source is available.

## Historical migration

Preserve `data/ledger.json` as the v1 archive. Do not rewrite or delete it.

The new v2 database starts clean. Seed only legacy records that clearly fit the new Project definition. On the first v2 scheduled run, inspect v1 once and migrate additional qualifying records conservatively, storing their original `Evidence ID` as `Legacy Evidence ID`. Do not port generic policy/news/research merely to preserve row counts.

## Canonical storage

Canonical Google Sheet: `AI Frontier Ledger`.

Tabs:
- Projects
- Updates
- Bottlenecks
- Claims
- Runs
- Taxonomy
- Methodology
- Legacy Index

The public GitHub snapshot is `data/frontier.json`. The v1 `data/ledger.json` remains archival.

## Public site

For now the site is a **database browser only**. No charts, synthetic scores, trend claims, rankings, or AI-generated takeaways.

The homepage shows a searchable/filterable Projects table with source links. Analytical outputs such as frontier trees, bottleneck migration, claim-resolution rates, and project funnels should be added only after the dataset has matured.

## Schedule behavior

One ChatGPT scheduled task keeps the system current. Each logical daily run:

1. Reads Methodology plus all current v2 tables.
2. Reviews due project/claim follow-ups first.
3. Searches for genuinely new projects and material updates using primary-first sourcing.
4. Adds bottleneck signals when supported.
5. Captures testable claims.
6. Writes a Run row even when there are zero substantive findings.
7. Publishes a validated delta/snapshot to GitHub.
8. Verifies the Vercel production site.

Recovery executions must be idempotent and must not create duplicate logical runs.
