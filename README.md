# منصة الأسانيد والإجازات — independent foundation

Stage one only. Zite remains the live application; no production records have been migrated.

Foundation deployment: https://asaneed.vercel.app/ — homepage verified HTTP 200; unauthenticated `/manage` was verified in Chrome to redirect to `/login`.

The public home page is an Arabic ijazah-number checker with self-hosted Readex Pro and the original Zite theme. Arabic, Persian and English digits are normalized to XXYY-RRNN; display uses Arabic-Indic digits in left-to-right group order. `/api/verify` performs exact-number lookup against a frozen minimal verification projection. Drafts, account identifiers, notes and certificate snapshots are excluded. The page distinguishes loading, invalid input, unavailable service, empty/preparing register, missing record and verified result. There are currently no imported production certificates, so valid lookups show the register-preparing message.

## Created

The site supports Arabic, Urdu and English through the header language switcher. A validated, HTTP-only preference cookie remembers the selection for one year. HTML language/direction, page metadata, form feedback, dates and account screens follow the selected language; certificate names remain in their original form.

- Supabase project: `sqyookpdpymgpwpnicyp`, organization Muzakkir's Org, Mumbai region.
- Independent Next.js app with Arabic layout, password sign-in, refreshed server sessions, and account activation checks.
- PostgreSQL schema with separate login accounts and issuer identities, shared students, qiraat/riwayat catalog, sanads, certificates and immutable snapshots.
- Atomic registration allocation per issuer/completion year/riwayah with a 99 limit. Zakaullah is issuer 01.
- Deny-by-default RLS; private raw-record staging for preserving all 23 source tables during a later migration.

## Setup

Install with `npm ci`. Copy `.env.example` to `.env.local` and add the project's publishable key. Never add a secret/service-role key to browser configuration. `npm run build` builds the app and `npm start` serves the build. Use `npm run typecheck` for static checks.

The Supabase project already has the migrations applied. For a fresh project, apply the versioned files in `supabase/migrations` in order. Do not reapply them to the existing project. `database/access-tests.sql` is a transactional database-owner test that rolls back all fixtures. The `database/*.sql` files are readable source copies of the migrations.

No real login accounts have been activated. Create or activate the administrator through Supabase Auth, then link its UUID to an active `accounts` row using a trusted administrative session. Public signup alone grants no application privileges. Never derive roles from user-editable metadata. No invitation email has been sent.

## Verification completed

- Production build and TypeScript passed, including the generated database types.
- Database tests passed: issuer isolation, shared students, inactive-account denial, student certificate scope, finalization/registration format, snapshot and final-certificate immutability, referenced-student deletion prevention, vowel-insensitive Arabic normalization, anonymous/private-table denial.
- Security advisor: no warnings/errors. Two informational findings are expected because private staging/counters intentionally have no client-access policies. Performance advisor reports unused indexes on the new empty database; retain these foreign-key/access indexes.

## Remaining stage-one work

1. Code is published at `https://github.com/Muzakkir-ai/asaneed`. Vercel's existing GitHub installation now has access to Asaneed alongside turuq, approved by the user.
2. Vercel project `asaneed` was created in team Halaqaat (Hobby) through the browser. Its first production deployment succeeded: `dpl_9fB1bxYAjUFKTV4mFrS8n6kYNQah`, source commit `e6546c7e8dd8f8c66b932bbfcab0d32f8d9d4c95`. The connected API lacks access; the local CLI is logged out.
3. Both public Supabase variables are configured for production and preview. Configure final Auth site/redirect URLs, activate the administrator, and test sign-in end to end.
4. Complete the management interface and account activation. The public verification checker is implemented; live imported records remain pending.
5. Migrate with an export manifest, relationship and numbering reconciliation, asset copies and a restore rehearsal before cutover.

Browser setup resumed successfully after the user restored Chrome and completed GitHub and Vercel identity verification. No production Zite data has been moved.
