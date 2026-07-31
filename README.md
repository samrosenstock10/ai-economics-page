# AI Economic Reality Ledger

A restrained public evidence ledger for a prospective record of real-world AI claims, deployments, constraints, and measured results.

## Design principle

The site should not imply that a small, coverage-biased dataset can answer more than it can. It therefore contains:

- one chart: evidence records by deployment stage, with average evidence-strength scores;
- the full source-backed evidence log;
- a plain disclosure that perception and outcome samples are not yet mature enough to chart.

The private Google Sheet remains the canonical research database. The public site reads a reviewed snapshot from `data/ledger.json`, so it does not expose Sheet credentials or edit access.

## Local use

```bash
npm run validate
npm run serve
```

Then open [http://localhost:4173](http://localhost:4173).

There is no build step or client framework. Vercel serves the static files directly.

## Publishing

The canonical site repository is:

- https://github.com/samrosenstock10/ai-economics-page

The production deployment is:

- https://ai-economic-reality-ledger.vercel.app

Routine updates should:

1. maintain the append-only Google Sheet;
2. regenerate `data/ledger.json`;
3. run `npm run validate`;
4. update this repository;
5. confirm the connected Vercel production deployment is ready and matches the Sheet counts.

