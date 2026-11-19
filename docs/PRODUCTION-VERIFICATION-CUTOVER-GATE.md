# Asaneed — production verification cutover acceptance gate

**Prepared:** 2026-11-15  
**Status:** READ-ONLY SECURITY PREFLIGHT PASS; PRODUCTION CUTOVER NOT STARTED  
**Production:** `sqyookpdpymgpwpnicyp`  
**Staging:** `tpomthcopeeyotthzpjs`

## Verified permissions (read-only SQL)

| Function | Production anon/authenticated | Staging anon/authenticated | Release expectation |
| --- | --- | --- | --- |
| `public.verify_ijazah(text)` | YES / YES | NO / NO | Revoke direct access at coordinated cutover |
| `public.lookup_certificate_number(text,text,text)` | ABSENT | YES / NO | Provision guarded anonymous lookup |
| `private.verify_ijazah_number(text)` | ABSENT | NO / NO | Private only |
| `private.guard_certificate_number_lookup(text,text,text)` | ABSENT | YES / NO | Capability-gated; reject invalid/missing capability |
| `public.verify_certificate_token(text)` | YES / YES | YES / YES | Preserve historical token/QR behavior |

Staging: one capability singleton with 32-byte SHA-256 digest, zero budget rows, one active cron cleanup job, one successful cron execution.

## Mandatory coordinated cutover

1. **Stop** unless verified encrypted recovery and rollback-compatible SQL exist, owner explicitly approves, and the exact release SHA has passing CI.
2. Confirm production Vercel environment has a production-only `CERTIFICATE_LOOKUP_CAPABILITY`, and private Supabase singleton stores its matching hash. Never display either.
3. Apply reviewed SQL migration deltas in the documented order, taking special care with the final revocation of `public.verify_ijazah(text)`. Old application clients may rely on this direct RPC.
4. Confirm the production-target build can call the guarded RPC using the matching secret **before** shifting public traffic. Ensure protection bypass is used only for authenticated release tests.
5. Test anonymous/signed-in direct RPC denial, valid synthetic nonexistent-number responses, spoofed ingress headers, both rate limits in an isolated authorized window, and historical token verification.
6. Confirm cleanup scheduling and counter persistence. Production lacks `pg_cron` as of preflight, so setup and monitoring are still required.
7. If tests fail, stop promotion; restoring the old app alone will **not** restore revoked legacy RPC permissions. Follow reviewed compatible SQL recovery.
8. After explicit owner approval, promote the tested production-target deployment and monitor live errors and public verification.

## Read-only validation SQL

The following queries do not modify database state and can be rerun against production and staging:

```sql
select n.nspname, p.proname,
       pg_get_function_identity_arguments(p.oid) as args,
       has_function_privilege('anon',p.oid,'EXECUTE') as anon_exec,
       has_function_privilege('authenticated',p.oid,'EXECUTE') as auth_exec
from pg_proc p
join pg_namespace n on n.oid=p.pronamespace
where n.nspname in ('public','private')
  and p.proname in ('verify_ijazah','verify_ijazah_number',
                   'lookup_certificate_number','verify_certificate_token',
                   'guard_certificate_number_lookup')
order by n.nspname,p.proname;
```

**Never mistake preflight permission checks for a successful HTTP or production cutover test.** Deferred hosted abuse tests and recovery remain open.
