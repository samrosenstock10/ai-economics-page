# Scheduled refresh instructions

## Canonical sources and targets

- Spreadsheet: https://docs.google.com/spreadsheets/d/19t28pwSb8CqnT80fhOwhBkUgGhiAW_kUrYPFlKTeJtk/edit
- GitHub: https://github.com/samrosenstock10/ai-economics-page
- Production: https://ai-economic-reality-ledger.vercel.app
- Snapshot file: `data/ledger.json`

## Each run

1. Read the Methodology tab and all four research logs before writing.
2. Research the newest unprocessed period using the current geography/domain rotation.
3. Append only genuinely new, traceable Evidence and Perception rows. Do not force observations.
4. Review every due claim. Add an Outcome row only when later evidence can responsibly judge the original claim.
5. Always append one Run Log row, including zero-result runs.
6. Regenerate `data/ledger.json` from the exact Sheet rows and refresh its metadata.
7. Run `npm run validate`.
8. Update the GitHub repository only after validation passes.
9. Confirm the Vercel deployment is ready and the live counts match the Sheet.

Do not add new charts or AI-generated summaries merely because more rows exist. Keep the current single-chart design until the dataset has enough observations and sufficiently balanced coverage to support another specific analytical question.

