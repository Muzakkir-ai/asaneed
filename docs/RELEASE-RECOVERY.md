# Asaneed release recovery gate — staging first

Status: **OPEN**. This runbook is a reviewable recovery procedure, not evidence of an offsite restore. It is deliberately separate from production changes.

## Current constraints

- Production Supabase project: `sqyookpdpymgpwpnicyp`. **Never use for rehearsal writes.**
- Isolated staging Supabase project: `tpomthcopeeyotthzpjs`. Staging has 45 applied migrations and the verification abuse-gate schema.
- The Supabase Free plan does not provide an assumed managed PITR or daily-backup guarantee. Do not claim a restore point exists without verifying it with the provider.
- No approved disposable recovery destination or offsite encrypted backup has been demonstrated. Do not provision paid resources without explicit consent.
- Draft PR #121 must remain draft; production release requires owner approval.

## Data that must survive a restore

1. Users, roles and account ownership, preserving Supabase Auth identities and application references.
2. Narrators, source/continuation IDs, personal asānīd and multi-sanad ordering.
3. Published Mutūn and immutable linked certificate snapshots, including issuance numbers and finalized output.
4. Historical verification token/QR compatibility and new exact-number verification index.
5. RLS policies, function grants, migrations and private verification-abuse capability/guard tables. **Never export plaintext capability secrets into backup artifacts.**
6. Storage objects/artwork/fonts and application environment configuration, handled separately from database-only logical backups.

## Recovery preparation (no production writes)

- Inventory all migration IDs and deployed app SHA; record the environment-specific Vercel Preview SHA.
- Export a **consistent** logical database backup with a privileged operator using an approved client and encrypted offsite storage. Keep storage-object backups and Auth-related dependencies in scope. Restrict access and define retention.
- Record artifact size, SHA-256, creation time, PostgreSQL version, storage location and decryption/access custodian. Never paste credentials, connection strings, tokens, or private data into PRs.
- Restore to an **authorized disposable destination**, not staging or production, using a least-privilege recovery identity.
- Reapply secrets out-of-band, verify schema/function grants and role isolation, and connect a non-public test deployment only after destination isolation is proven.

## Required acceptance checks

- Compare migration count and ordered migration ledger, schema objects, table row counts, storage inventory and critical FK/unique constraints.
- Validate issued certificate snapshot hashes, number uniqueness, historical token lookup and exact-number lookup with synthetic test identities. Ensure snapshots remain immutable.
- Validate 1–5 ordered asānīd survive save/reload, and Mutūn catalog links remain intact.
- Verify RLS and direct RPC denial for `anon` and `authenticated` on privileged verification paths.
- Confirm a synthetic finalization transaction is atomic, and rollback does not mutate historical snapshots.
- Capture the restoration elapsed time (RTO), data loss window (RPO), tested source SHA, destination and exact PASS/FAIL/BLOCKED outcomes.

## Rollback rules

- Keep the public number-lookup abuse guard and legacy-RPC revocations. Rolling back to a gate-incompatible app may temporarily return 503; **do not re-grant public legacy RPC access**.
- Keep historical QR/token lookup operational. Do not regenerate existing certificate numbers or rewrite finalized certificates.
- Use a separately approved production change window only after owner acceptance of evidence, offsite recovery plan, and hosted print/security checks.

## Evidence ledger

| Gate | Status | Evidence / blocker |
| --- | --- | --- |
| 45-migration staging baseline | PASS | Read-only staging SQL inspection, 15 Nov 2026 |
| Local migration replay, upgrade and rollback | PASS (prior synthetic rehearsal) | PR #121 release handoff |
| Offsite encrypted backup artifact | BLOCKED | No artifact verified |
| Disposable isolated restore | BLOCKED | No authorized recovery destination |
| Snapshot, Auth, storage and verification validation after restore | BLOCKED | Requires actual restore |
| Measured RTO/RPO | BLOCKED | Requires timed restore |

Do not close the recovery gate based only on this runbook or the local synthetic rehearsal.
