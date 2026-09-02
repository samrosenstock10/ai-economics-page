# ChatGPT scheduled task — AI Project Tracker

## Scheduled Task instructions

Use the following as the task's authoritative operating contract. This fast path overrides any older instruction to read every Sheet tab at the start of every recovery invocation.

```text
Maintain the AI Project Tracker without user supervision.

At the beginning of every invocation, use the connected GitHub app to read the latest `main` revision of `samrosenstock10/ai-economics-page`. First read this file, `docs/automation/chatgpt-scheduled-task.md`. Treat the complete section titled `Scheduled Task instructions` as authoritative. For substantive research and publication rules, then obey the current `AUTOMATION.md` from the same revision.

FAST PATH — COMPLETE BEFORE EXPENSIVE READS OR RESEARCH
1. Resolve `logical_date` as the calendar date of the most recent 9:00 PM America/New_York anchor. From midnight through 8:59 AM, it is the prior calendar date.
2. Read only `data/automation-status.json`, the `Runs` tab row or rows for `logical_date`, any open publication incident, current Vercel production status, and the stable production URL. Do not initially read Methodology, Projects, Updates, Bottlenecks, Claims, Taxonomy, the full frontier snapshot, or public research sources.
3. The GitHub status file is valid only when its schema is 1.0.0, `pendingDeltas` is empty, `githubComplete` is true, and its frontier logical date equals `logical_date`. The matching Sheet Run must truthfully state end-to-end completion, and production must be READY/HTTP 200 and current.
4. When all three layers pass, stop silently. Do not repeat research, reread the complete database, append another Run row, commit, deploy, change a timestamp, notify, or email merely because a recovery invocation fired.
5. If GitHub reports pending deltas or an unverified latest run while the Sheet is complete, perform publication recovery only. Do not redo research or recreate rows.
6. If GitHub's logical date is older than `logical_date`, the Sheet Run is absent/incomplete, or an unresolved prior-48-hour cycle exists, read the full current `AUTOMATION.md` and only then load the Sheet tabs and source context needed for substantive work or exact partial-write recovery.
7. If GitHub is complete but production is stale, perform production recovery only against the existing Vercel project. Do not touch the Sheet or create another GitHub data commit.
8. A malformed or internally inconsistent status is a system invariant failure. Preserve the last valid production state and inspect current `data/frontier.json` plus GitHub workflows before any mutation.

For a substantive logical run, follow `AUTOMATION.md` exactly: review due Projects and Claims before discovery; use stable project-first identities; prefer primary evidence; update the canonical Sheet first; submit one small verified frontier delta; let GitHub assemble and validate; verify the existing Vercel production; and treat the cycle as complete only after Sheet, GitHub, and production agree. Zero findings is valid. Never create replacement Sheets, repositories, Vercel projects, automations, guessed data, duplicate records, or a second logical cycle from a recovery wake.

Earlier transient failures remain silent while later recovery slots remain. Only the final 8:00 AM wake may leave one concise blocker for a genuinely unresolved cycle. The next 9:00 PM anchor must repair that cycle before new research.
```
