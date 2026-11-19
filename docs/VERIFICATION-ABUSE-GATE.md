# Public number lookup abuse gate

The public website calls `lookup_certificate_number` using the publishable key and a separate server-side capability. The older `verify_ijazah` RPC and its private helper lose execution grants for API roles. The new RPC checks the capability before using its input or touching the budget. Historical token and QR lookups keep their existing function and URL.

## Limits and privacy

PostgreSQL admits up to 10 valid lookups per client IP and 60 total per UTC minute. Hits, misses and an empty register all consume budget. A per-client denial does not spend the shared budget. The global row lock coordinates concurrent requests across regions and app versions using this gate. The app responds with HTTP 429 and `Retry-After: 60` when either budget is exhausted. Missing configuration or a database failure returns 503. These are initial pilot limits. Shared network users share a client budget, distributed traffic can exhaust the global budget, and a fixed window permits a burst across the minute boundary.

The website accepts one valid IP from the Vercel-managed `x-vercel-forwarded-for` header and uses its HMAC as the client key. The request body, cookies and caller-supplied forwarding headers do not select the bucket. The database budget contains only a minute, a keyed digest and an attempt count. No certificate number, raw IP, response or student data enters that table. The database stores only the capability hash. Disable request-body and SQL-parameter logging for this path because the upstream RPC body contains both the exact number and the server credential.

## Integration and isolated staging

1. Apply the follow-up commit from PR #115 to the current #121 candidate. Keep the existing projection migration first. Run `node tests/public-verification.test.cjs` and the integration suite. Update any #121 probes that expect anonymous `verify_ijazah` to succeed. Use the app route for a positive number probe and assert denial of the old RPC and of the new RPC without a valid credential. Keep the historical token probe.
2. Reconfirm staging Vercel and Supabase isolation before provisioning. Generate a distinct 32-byte random capability as 64 lowercase hex characters. Store it in the staging Vercel server environment as `CERTIFICATE_LOOKUP_CAPABILITY`. Insert its SHA-256 digest of the UTF-8 hex string into `private.verification_lookup_capability(secret_hash)` using a privileged, parameterized database connection. Keep the value out of logs, Git, and browser code. Verify the Vercel system environment exposes `VERCEL=1`. Configure app and database together. Applying the migration while the old app serves traffic stops number lookup until the new app and matching capability are ready. Historical token lookup continues throughout.
3. Verify the actual ingress overwrites a submitted `x-vercel-forwarded-for` value and rejects attempts to change the observed client budget through alternate forwarding headers. Test the deployment URL and staging alias. Confirm PostgREST commits the RPC transaction and does not permit transaction rollback via client preferences. Check that the private schema and tables are unavailable through REST and GraphQL.
4. With synthetic records, drive parallel independent HTTP connections in one minute, including hits and misses, and verify 429, its retry header, and recovery next minute. Try anonymous and authenticated direct RPC calls with arbitrary capabilities and spoofed client keys. Check the historical token before and during exhaustion. Confirm correct certificate details and the same issued snapshot hash before and after.
5. Schedule a privileged cleanup, for example hourly, using the environment's approved scheduler. Retain at most the last 60 minutes of budget rows with `delete from private.verification_lookup_budget where minute < floor(extract(epoch from now()) / 60)::bigint - 60`. Monitor aggregated 429 and 503 counts, database latency and cleanup age. Review cap settings with the pilot owner. Public traffic can still attempt denied requests, so use provider ingress protections if this creates a capacity problem.
6. Rehearse rollback on staging. Keep the database gate and revocations in place. Roll back to a gate-compatible app build, or accept a temporary 503 for number lookups while repairing. Restoring anonymous execution of the old RPC reopens the bypass. Rotate a leaked capability by replacing its database hash and server environment value as one coordinated operation. Expect temporary 503s during a mismatch.

## Evidence

- **PASS local** · Synthetic PostgreSQL fixtures and the HTTP handler cover exact lookup, direct RPC denial for both roles, forged and missing credentials, shared budgets, response privacy, publication, historical token compatibility and later finalization.
- **PASS concurrent database admission** · Disposable PostgreSQL 18.6 with 16 independent connections admitted 10 of 16 requests for one client, then 50 of 64 requests from distinct clients before reaching the shared cap of 60.
- **BLOCKED hosted** · The new gate needs a staged deployment and capability provisioning. Hosted evidence in #121 at `70e9387` validates the earlier lookup and historical token behavior. The new ingress, PostgREST transaction behavior, end-to-end limit and cleanup still need rehearsal.

## Release checklist

- **PASS locally** · The same fixture exhausts the website client budget, tries the old RPC, the guarded public RPC and the private wrapper as both public roles, and verifies each returns permission denied. Subsequent legitimate requests can still spend the remaining shared budget. The historical token resolves during exhaustion and the issued snapshot and token are byte-for-byte identical.
- **BLOCKED hosted** · Chat 12 still needs an authorized isolated deployment of the gate, matching staging credentials, ingress and REST verification, and the cleanup and rollback rehearsal above.
- **OPEN / deferred** · Chat 05's hosted A4 print and PDF check remains open in #121.

## Staging counter-retention operator runbook (15 November 2026)

Read-only staging inspection on project `tpomthcopeeyotthzpjs` confirmed migration count 45, one capability-hash record, zero budget rows, and `pg_cron` **available** (version 1.6.4) but **not installed**. This is not evidence that scheduled cleanup is running. The isolated candidate Preview at `e9fae46d` is READY; hosted POST rate-limit tests are still pending.

The preferred database-local scheduler is `pg_cron`, if the project owner approves enabling the extension and the hosting plan permits it. **Do not apply the following to production as part of staging rehearsal.** Execute only as a privileged operator on the confirmed staging project, with the migration/extension policy reviewed:

```sql
-- Staging only: requires a privileged role and explicit operational approval.
create extension if not exists pg_cron with schema pg_catalog;
select cron.schedule(
  'asaneed-verification-budget-cleanup',
  '17 * * * *',
  $$delete from private.verification_lookup_budget
    where minute < floor(extract(epoch from now()) / 60)::bigint - 60$$
);
```

Before scheduling, confirm `cron.schedule` has the necessary privileges to delete from the private table in its execution role; a successful schedule registration is not proof of successful execution. Verify without exposing secrets:

```sql
select jobid, jobname, schedule, active
from cron.job
where jobname = 'asaneed-verification-budget-cleanup';

select jobid, status, start_time, end_time, return_message
from cron.job_run_details
where jobid in (select jobid from cron.job
                where jobname = 'asaneed-verification-budget-cleanup')
order by start_time desc limit 5;

select count(*) as stale_rows
from private.verification_lookup_budget
where minute < floor(extract(epoch from now()) / 60)::bigint - 60;
```

If the extension or scheduler is unavailable, choose a separately authenticated, privileged external scheduler and document its execution identity, schedule, retry behavior, monitoring and revocation procedure before release. Do **not** expose a public unauthenticated cleanup HTTP endpoint. Keep the 60-minute retention window and record a successful execution and zero stale rows as the acceptance evidence. During rollback, retain the guarded lookup grants and this cleanup job; do not restore public execution of the legacy number-lookup RPC.
