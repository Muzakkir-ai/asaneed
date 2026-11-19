# Asaneed — production migration and verification credential preflight

**Date:** 2026-11-15  
**Status:** **TWO PREPARATION TASKS COMPLETE; PRODUCTION EXECUTION NOT STARTED**  
**Candidate branch:** `audit/chat12-integration-c1ae83cba1a2`  
**Production Supabase:** `sqyookpdpymgpwpnicyp`  
**Staging Supabase:** `tpomthcopeeyotthzpjs`

## Task 1 — reconcile migration delta: PREPARATION PASS

Read-only database inspection confirms production ledger **42** entries and staging **45**. The staging ledger replays historical migrations with rewritten `20261112120xxx` versions, so **do not copy the staging ledger or apply all 45 migrations to production**. The three new functional SQL changes to review/apply in this order are:

1. `supabase/migrations/20261109221703_restrict_verification_projection_reads.sql` — creates `private.verify_ijazah_number(text)`, makes `public.verify_ijazah(text)` delegate to it, revokes direct SELECT on private verification projection.
2. `supabase/migrations/20261110082014_serialize_certificate_finalization.sql` — replaces `private.finalize_certificate(uuid,jsonb)` to serialize number reservation before draft-row lock. Preserve issued snapshots and historical tokens.
3. `supabase/migrations/20261112122627_guard_certificate_number_lookup.sql` — creates private capability/budget tables, guarded lookup and public RPC, and revokes direct legacy number verification access.

Production read-only schema confirms `private.finalize_certificate(uuid,jsonb)` and `public.verify_ijazah(text)` already exist, but `private.verify_ijazah_number(text)`, `public.lookup_certificate_number(text,text,text)`, and `private.verification_lookup_capability` are absent. Historical `public.verify_certificate_token(text)` remains present.

**Before execution:** review the exact SQL against production dependencies, compare historical ledger names and checksums, capture a verified recovery copy, choose a maintenance/rollback window, and apply via reviewed migration mechanism only. Check transactional locks and RLS/grants after each migration. The last migration **revokes public legacy number lookup**, so coordinate with production app switch and credential setup to avoid a verification outage. Do not run any of these migrations as part of this preflight.

## Task 2 — production verification credential: CONFIGURATION PLAN PASS

Vercel production environment inventory contains `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `USERNAME_LOOKUP_KEY`, and `ARTWORK_REFRESH_CAPABILITY`, but **does not contain `CERTIFICATE_LOOKUP_CAPABILITY`**. This is an application-blocking dependency for the new number-only verification endpoint.

Provisioning procedure (at approved production release window only):

1. Generate a **new production-only cryptographically random 32-byte value encoded as 64 lowercase hexadecimal characters** in a trusted secret-management environment. **Never reuse the staging value.**
2. Store it as Vercel **production-only** sensitive environment variable `CERTIFICATE_LOOKUP_CAPABILITY`; do not target Preview, put it in GitHub, or print it.
3. Store only the SHA-256 digest in `private.verification_lookup_capability.secret_hash` using a secure authenticated database channel. The table has `singleton boolean primary key default true check(singleton)` and `secret_hash bytea not null`. The migration creates the table but does **not** populate it. Use parameterized secret transport and do not put the cleartext in SQL logs.
4. Verify digest equality using a private controlled comparison without returning secret/digest to logs. Deploy the production-target build with the matching env setting and check exact-number lookup with **synthetic nonexistent** numbers.
5. Test 10/client/min and 60/global/min limits, direct RPC denial with invalid credentials, and historical token verification. Never test against real certificate numbers or exhaust live public rate limits.
6. Schedule or provision budget cleanup (staging uses pg_cron hourly minute 17); production must have an approved equivalent with monitored execution.
7. On any failure, **do not promote**. Rolling back only the app may not restore old direct-number access because migration 3 revokes it; plan explicit compatible rollback SQL and validate recovery.

**No production secret has been generated, stored, or displayed in this preparation. No production SQL changes or Vercel env writes.**

## Release gate after these two tasks

- Migration mapping/preflight: **PASS** (execution **PENDING**).
- Credential dependency/secure setup plan: **PASS** (provisioning **PENDING**).
- Recovery backup/restore: **BLOCKED** until an approved, verified recovery copy exists.
- Hosted POST security: **DEFERRED**, not passed.
- Native print and SVG fidelity: **DEFERRED**, not passed.
- Final production approval: **NOT GRANTED**.

**No production release, main merge, issuance, invitation, or paid infrastructure is authorized by this document.**
