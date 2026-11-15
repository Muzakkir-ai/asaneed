# Asaneed — deferred release checks and handoff

**Status: DEFERRED / NOT RELEASE-APPROVED**  
**Recorded:** 2026-11-15  
**Integration:** [draft PR #121](https://github.com/Muzakkir-ai/asaneed/pull/121)  
**Last reviewed branch SHA:** `06d8452141b8114fa57a9c74993f4eec85ff78db`  
**Estimated readiness:** 93% (informal estimate, not a test result)

This document records work deliberately postponed at the owner's request. **Deferred does not mean PASS, and does not authorize a production release.** Resume these checks before promoting to production.

## Deferred gates

| Gate | Status | Evidence / required next action |
| --- | --- | --- |
| Hosted HTTP verification abuse controls | **BLOCKED / DEFERRED** | GitHub Actions synthetic POST reached protected Vercel Preview but got HTTP 401 from deployment protection (run 43700307671). Use authorized `vercel curl` or short-lived OIDC access; verify HTTP ingress spoofing, PostgREST persistence, per-client/global limits, direct RPC denial for anonymous and authenticated users, and historical token/QR behavior under exhaustion. Do not disable protection or expose secrets. |
| Physical/native iOS A4 printing | **DEFERRED** | Automated PDF layout browser test **PASS** (run 43700375840; screenshot artifact 14156058160). Verify native iOS and physical A4 output for Matn and Qirāʾāt, including fonts, borders, headings, sanad, footer, number-only verification and artwork. |
| PDF SVG artwork fidelity | **OPEN / DEFERRED** | Browser export logs contained missing-resource warnings for `basmalah.svg` and riwāyah SVG assets despite passing automated layout assertions. Inspect generated PDFs/screenshots and correct asset loading before final artwork sign-off. |
| Offsite backup + restore | **OPEN / DEFERRED** | Staging migration replay and synthetic rollback passed, but no independently verified encrypted offsite backup and disposable restore destination. Follow `docs/RELEASE-RECOVERY.md`; do not provision paid resources without approval. |
| Final release decision | **NOT APPROVED** | Review all deferred results, exact tested SHA, staging/production separation, rollback plan, and obtain explicit owner approval before any production write, deploy, or merge. |

## Passed and retained evidence

- Staging Supabase `tpomthcopeeyotthzpjs`: 45 migrations present, verification capability provisioned; no production changes.
- Staging `pg_cron` cleanup job ID 1: **PASS**, successful execution 2026-11-15 09:38 UTC, `DELETE 0` because there were no expired counters. Original active hourly schedule restored to `17 * * * *`. Synthetic retention-boundary cleanup previously passed.
- Public certificate verification regression **PASS** (run 43700375828).
- Sanad editor regression **PASS** (run 43700375936).
- Certificate PDF layout regression **PASS** (run 43700375840); **does not** establish native printing or SVG asset completeness.
- Protected Preview GET homepage and login **200**, GET `/api/verify` **405** (expected).
- New certificates: number-only verification; preserve historical QR/token links and immutable issued snapshots.

## Resume checklist

1. Recheck branch SHA, PR #121 CI, and staging isolation.
2. Complete the hosted POST security gate using authenticated Preview access; save exact HTTP results and rate-limit evidence.
3. Inspect exported A4 PDF artwork and confirm native iOS/physical print output.
4. Perform an approved encrypted offsite backup and disposable restore; document integrity and recovery time.
5. Update PR #121 with PASS/FAIL/BLOCKED evidence for every gate and request explicit release approval.

**Hard boundaries:** Keep PR #121 in draft. No production deployment/writes, main merge, real certificate issuance, invitations, secrets in GitHub/chat, or unapproved paid resources.
