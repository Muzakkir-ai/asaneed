# منصة الأسانيد والإجازات — independent foundation

Stage one only. Zite remains the live application; no production records have been migrated.

## Created

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

1. Publish the standalone project to the user-approved public GitHub repository `Muzakkir-ai/asaneed` (repository created).
2. Create/link Vercel project `asaneed` in team Halaqaat. The connector returned 403 (no project-creation permission); the local CLI is logged out.
3. Configure the two public Supabase environment variables in Vercel, configure the final Auth site/redirect URLs, activate the administrator, and test sign-in end to end.
4. Add public verification lookup and the full management interface during the next implementation stage. The current home page clearly marks verification as pending.
5. Migrate with an export manifest, relationship and numbering reconciliation, asset copies and a restore rehearsal before cutover.

Computer-use fallback ended because its policy check could not confidently determine the current browser URL. No browser changes were made.
