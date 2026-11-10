# منصة الأسانيد والإجازات — Asaneed

[Asaneed](https://asaneed.vercel.app/) is a Next.js and Supabase application for managing asānīd and preparing, issuing, and verifying ijāzahs. The signed-in workspace is at `/studio`. The original Zite app remains separate. The [import report](docs/IMPORT-REPORT.md) describes the preserved legacy drafts and relationships.

## Certificate verification and numbering

The public checker supports Arabic, Urdu, and English and accepts Western, Arabic-Indic, and Persian digits. It looks up the exact normalized certificate number through `/api/verify` and shows the status of the public register. The public projection excludes draft records, account IDs, notes, and certificate snapshots.

New allocations use `YYSS-NNRR`: two digits for the completion year, two for the issuer code, an annual serial for that issuer, and two for the riwāyah code. The serial has at least two digits and expands after 99. Draft serials can be reassigned in completion-date order within the issuer and year. Finalized certificates keep their issued numbers and frozen snapshots.

## Local setup

1. Install dependencies with `npm ci`.
2. For authenticated local testing, set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.local` for an isolated test project. Apply the ordered files in `supabase/migrations` there and use synthetic fixtures.
3. Run `npm run dev` for development, `npm run typecheck` for static checks, or `npm run build` and `npm start` to exercise the production build locally.

See [AGENTS.md](AGENTS.md) for data and access rules, [current state](docs/CURRENT-STATE.md) for the handoff history, [next steps](docs/NEXT-STEPS.md) for open verification, and the [release QA matrix](docs/RELEASE-QA.md) for integration and recovery.
