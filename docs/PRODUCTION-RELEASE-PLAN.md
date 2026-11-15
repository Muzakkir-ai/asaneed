# Asaneed production release — two-chat execution plan

**Prepared:** 2026-11-15  
**Current release candidate:** `250da8d3a12a441a35cb91a6f05041f9e2fd433b`  
**PR:** [#121](https://github.com/Muzakkir-ai/asaneed/pull/121) (draft)  
**Current production branch:** `main` at `292dc0d5dbd27556b4004051b782cc369946c21d` (read-only comparison)  
**Status:** **PREPARATION ONLY — NOT AUTHORIZED TO DEPLOY**

The owner intends to target production within the next two conversations. This is a **goal**, not authorization to skip prerequisites or deploy immediately. Do not release until the owner explicitly approves the exact release after reviewing the gate results.

## Verified baseline

- Candidate `250da8d` GitHub CI: **3/3 PASS** — verification run 43700714397, sanad editor run 43700714368, PDF layout run 43700714350.
- `main...audit/chat12-integration-c1ae83cba1a2`: **ahead 16 / behind 0**, 52 changed files at review.
- Staging Supabase `tpomthcopeeyotthzpjs`: **45 recorded migrations**, guarded verification capability, cleanup cron execution PASS.
- Production Supabase `sqyookpdpymgpwpnicyp`: **42 recorded migrations**, latest `20261105213349_reviewed_narrator_aliases` (read-only SQL, Nov 15).
- Vercel production project `prj_hPBB1q3FGkYm4FYdGESF8DBGBBCj` has `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `USERNAME_LOOKUP_KEY`, `ARTWORK_REFRESH_CAPABILITY`. **No production `CERTIFICATE_LOOKUP_CAPABILITY` was listed**. Do not print or commit any secret.
- Staging-only Preview and existing production must remain distinct; preserve historical token/QR verification and immutable issued certificates.
- Other deferred checks and evidence: `docs/DEFERRED-RELEASE-CHECKS.md`.

## Chat 1 — finish release readiness (no production writes)

1. **Inventory migration differences precisely.** Compare both migration ledgers by name/content, not counts alone: staging migration versions include a staging-specific replay namespace. Determine the actual ordered SQL delta from production to candidate. Review every migration for idempotency, locks, grants, reversibility, and compatibility with the currently deployed app.
2. **Confirm required production environment keys by name and scope only.** Prepare secure provisioning of a unique production `CERTIFICATE_LOOKUP_CAPABILITY` and its matching database hash, coordinated with guarded RPC deployment. Never reuse staging credentials, log secrets, or commit them.
3. **Recheck exact SHA and CI**, candidate Preview deployment mapping, and all outstanding PR scope conflicts. Ensure new certificates use number-only verification and historical QR/token links remain functional.
4. **Prepare rollback and recovery.** Identify a concrete production data backup/restore path, backup location/retention and verification method. Free Supabase does not imply managed PITR. Preserve the pre-release deployment ID and document application rollback versus nonreversible database writes.
5. **Close or explicitly accept risks:** hosted POST security gate (401 Vercel protection), native A4/iOS printing, SVG asset warnings, and offsite restore. Deferred is not passed. Request explicit owner decision on any residual risk; never silently waive a security or recovery blocker.
6. Publish a concise GO/NO-GO matrix with exact tested SHA and all prerequisites. Do not merge or deploy.

## Chat 2 — controlled production release (only after explicit owner approval)

1. Reconfirm exact candidate SHA, `main`, CI, Vercel project/team and production Supabase project ID. Stop if any drift.
2. Obtain/verify an approved pre-change backup and a documented recovery route.
3. Apply only the reviewed, ordered production migration delta; verify ledger, grants, immutable snapshot compatibility, and historical verification before any app traffic switch.
4. Provision the **production-only** verification capability securely and its matching Supabase hash. Verify environment and database match without revealing values.
5. Stage a production-target Vercel build **without assigning the production domain**. Test synthetic smoke flows and number-only public lookup, legacy token links, access controls, print/PDF, and monitoring.
6. If all required gates PASS and the owner confirms, promote the tested production-target build; do not promote a staging Preview build as though it were production-equivalent.
7. Check public endpoints, authentication, issuer workflows, errors and historical links; retain rollback deployment and recovery instructions. If any check fails, stop promotion or perform the approved application rollback, noting that rollback does not automatically revert database migrations.
8. Update PR #121 and release notes with exact production SHA, deployment ID, migration ledger, PASS/FAIL results and any rollback action.

## Release blockers discovered 15 November

- **BLOCKER:** production migration ledger is behind staging (42 vs 45); precise mapping still requires review.
- **BLOCKER:** production `CERTIFICATE_LOOKUP_CAPABILITY` is not configured in Vercel production environment.
- **BLOCKER:** no independently verified offsite recovery copy or hosted restore.
- **DEFERRED / risk decision required:** hosted abuse-gate POST, native print, SVG artwork.
- **REQUIRED:** explicit final owner authorization before production writes, merge, or deployment.

## Hard boundaries

No production writes or deployment in Chat 1. No real issuance, invitations, changing historic snapshots, deleting legacy QR/token support, sharing secrets, or unapproved paid resources. Keep #121 draft until the final release decision.
