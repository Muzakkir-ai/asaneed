# Migration history reconciliation — 2026-11-27

Production release: 4867f44073bb5e48f4ac0d5d2b16268d01258be5.

All 50 migration filenames were matched by logical name to one recorded migration in each environment. SQL was compared to the repository, preserving original applied statements even when formatting, transaction wrappers, the historical Mustanir guard, or staging-only fixture seeds differ. See [the exact mapping and hashes](migration-history-reconciliation-20261127.json).

## Result

- Production: 45 versions corrected; 50/50 canonical versions and names verified.
- Staging: 45 versions and 44 names corrected; 50/50 canonical versions and names verified.
- No migration DDL or DML was replayed. The available database connection updated only version and name columns in the history table, in guarded transactions, first rolled back for a dry run in each environment.
- Original statements and every other history column were retained. All nine protected data-table digests, schema function/policy/index/trigger fingerprints, and the certificate numbering sequence floor were unchanged in each transaction.
- A separate post-commit query confirmed all 50 version/name pairs and original statement hashes in each environment. Production's nine protected tables also still exactly match the pre-release recovery backup.

## Future migration procedure

1. Work against the actual production branch, and confirm the project target (staging or production) before using CLI commands. Never run a reset against a remote database.
2. Generate a single canonical migration file and test its exact content on staging first. Use the same version in production; do not independently generate another version by manually applying the same SQL twice.
3. Consult the installed Supabase CLI help and run its migration-list command against the intended project. Before deploying, compare applied versions and names with repository filenames; investigate any remote-only or unexpectedly pending versions.
4. Use the CLI's dry-run database push option (check its installed version's help) before applying pending files. Do not use an include-all or repair option merely to bypass drift. Confirm that only the intended new migrations are pending.
5. Use a verified recovery backup, reviewed migration, and one deployment operator. Verify schema, permissions and protected data afterward. If a manual SQL migration was genuinely applied under another timestamp, audit the original statements, then reconcile tracking metadata without replaying SQL.
6. The scheduled backup job, environment configuration and manually managed operational settings are separate from migration-file history. Identical migration versions alone do not prove full schema or operational parity.

## Reversal of this metadata repair

The mapping JSON preserves each original version and name and the original row and statement hashes. If reversal is actually necessary, compare the current history with the manifest and reject collisions/new or changed rows before changing only the version/name fields back in a guarded transaction. Verify original row hashes and data/schema preservation. Do not execute down migrations to reverse this bookkeeping correction.

Official reference: https://supabase.com/docs/guides/deployment/database-migrations
