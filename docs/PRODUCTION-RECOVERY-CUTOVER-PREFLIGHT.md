# Asaneed — recovery and production cutover preflight

**Date:** 2026-11-15  
**Branch:** `audit/chat12-integration-c1ae83cba1a2`  
**Reviewed candidate SHA:** `d3979a056098e73042771d88e009d897cfb1e6bc`  
**Status:** **TWO PREFLIGHT TASKS COMPLETE — PRODUCTION RELEASE NOT AUTHORIZED**

## Task 3 — recovery readiness inventory: PREPARATION PASS, RESTORE BLOCKED

Read-only Supabase project inspection:

| Environment | Project | State | Region | Postgres | Migration count |
| --- | --- | --- | --- | --- | --- |
| Production | `sqyookpdpymgpwpnicyp` | ACTIVE_HEALTHY | `ap-south-1` | 17.11 | 42 |
| Staging | `tpomthcopeeyotthzpjs` | ACTIVE_HEALTHY | `ap-south-1` | 17.11 | 45 |

Production extension inventory: `pgcrypto` installed; **`pg_cron` absent**. Staging cleanup job 1 passed and is scheduled hourly at minute 17; production cleanup must be explicitly provisioned and tested (or use an approved alternative).

**Known current production deployment / application rollback candidate:**
- Vercel deployment ID: `dpl_5DsCbAEKSvZUEwNEVtTChLqTwybA`
- URL: `https://asaneed-3xmx2rb60-halaqaat.vercel.app`
- Target/state: production / READY
- Git SHA: `292dc0d5dbd27556b4004051b782cc369946c21d`
- Vercel reports `isRollbackCandidate=true`.

**Important:** App rollback is **not** database rollback. Migration 45 revokes direct public number verification; reverting the app without restoring a compatible SQL surface can cause an outage. An app deployment candidate is not a database backup.

**Recovery release blocker:** no independently verified offsite encrypted logical backup or successful disposable restore. Before any production migration:
1. Choose an approved encrypted backup destination and secure export path that includes schema, data, roles/auth dependencies and storage references. Never print private data in chat or CI logs.
2. Verify backup integrity and a disposable restore, including issued snapshot hashes, stable narrator/source IDs, historical verification links, and auth mapping.
3. Record exact recovery point, responsible operator, restore steps, acceptable recovery window and test result.
4. Approve rollback-compatible SQL and stop conditions; do not assume managed PITR on Supabase Free.

## Task 4 — production cutover readiness: PREPARATION PASS, EXECUTION BLOCKED

Latest candidate `d3979a0` GitHub Actions:
- Public certificate verification regression **PASS**
- Sanad editor regressions **PASS**
- Certificate PDF layout regression **PASS**

Production-specific execution order, **only after backup and explicit owner approval**:

1. Freeze/recheck reviewed SHA, `main`, production project, Vercel team/project, and staging isolation.
2. Confirm backup/restore evidence, rollback plan, release window and monitoring.
3. Apply the three reviewed SQL deltas in dependency order (see `docs/PRODUCTION-MIGRATION-CREDENTIAL-PREFLIGHT.md`). Review lock/grant behavior. Coordinate last revocation with app cutover.
4. Provision the unique production `CERTIFICATE_LOOKUP_CAPABILITY` securely and insert only its SHA-256 digest into the private singleton table. Do not reuse staging credential.
5. Enable and test production budget cleanup (production currently lacks `pg_cron`).
6. Stage a production-target Vercel deployment **without domain assignment**. Do not promote a Preview build. Validate synthetic nonexistent-number lookup, denial of direct RPC bypass, historical token/QR links, privacy, user access, draft lifecycle and PDF/print.
7. Promote only after checks PASS and explicit owner approval. Monitor errors and live verification; retain old deployment ID and approved SQL recovery procedure.
8. Document final SHA, deployment ID, migration ledger, production smoke evidence, owner approval and rollback status in PR #121.

## Release decision

**NO-GO as of this preflight.** These two tasks complete **inventory and planning**, not recovery execution or production cutover. The unresolved gates are actual backup/restore, production migrations, production secret provisioning, cleanup scheduler, authenticated hosted security tests or explicit documented risk decision, native print/SVG acceptance, and final owner authorization.

Do not change production database, production Vercel env, production domain, or `main` until release approval.
