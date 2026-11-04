# Asaneed resume checkpoint — 4 November 2026

Continue draft PR #6 on feat/unified-management-redesign. Do not start over. Read [SANAD-UNIFICATION.md](SANAD-UNIFICATION.md), [CURRENT-STATE.md](CURRENT-STATE.md) and [NEXT-STEPS.md](NEXT-STEPS.md) for the implementation and remaining work.

## Current work

The original management redesign and PR #6 follow-up fixes are retained. This continuation adds one sanad composition core, approved shared continuations, explicit route references across certificate workflows, four compact icon cards, comparison/audited review, correction requests and zero automatic snapshot propagation. Existing Arabic fonts, artwork, palettes and scholarly text remain intact.

The Windows branch was reconciled with remote PR #6 head b19482b before edits. Windows and connector commit hashes may differ, but publication must verify complete Git tree equality. Do not force-push or overwrite newer remote work.

## Data safety and approval

The user approved the earlier matn-management migration after automatic review rejected it. Its tables are now present in the inspected hosted schema. No schema/record changes were applied by this sanad continuation.

The new request requires review and approval before persisted sanad conversion. Migration 20261104164423_unified_sanad_continuations.sql is prepared and locally tested, **not applied**. It is separate from the earlier approval. No conversion runner is shipped; the admin proposal endpoint returns before/after/mapping without writes. Preserve finalized and uncertain records. Keep PR #6 in draft and do not deploy production.

## Audit and verification

- 23 active routes: Shatibiyyah 14, Durrah 6, Mustanir 2, Misbah 1. All 14 seven-name Shatibiyyah prefixes match the source. Nine general route comparisons still need review.
- 47 core certificates are drafts and all link to core sanads; zero finalized core snapshots. Preserve all 45 old workspace snapshots, including 30 with issuedAt.
- 60 personal holdings (22 with builderRouteId), 46 additional-shaykh sanads (22 with builderRouteId), 29 prepared ijazahs. No ID/ownership/reading/link changes.
- Typecheck, build, test:sanad, test:editor, test:matn-heading, local catalog SQL, test:sanad:browser and test:editor:browser passed. Browser tests use synthetic APIs and temporary local routes, never hosted writes. A one-page A4 landscape PDF was rendered and visually reviewed.
- Private read-only audit input is outside the repo at ../sanad-readonly-audit.json; never commit it. Detailed report/screenshots/PDF are in ../../outputs/. No historical authentication or hosted mutation coverage is claimed.

## Resume next

1. Inspect PR #6/current remote head and preserve subsequent changes.
2. Review/apply the new schema only with the required approval; recheck hosted RLS/function grants/backup compatibility/advisors and regenerate types. Preview marks continuation saves unavailable until the migration is enabled.
3. Review nine unmatched comparisons and explicit personal boundaries. Use dry-run conversion proposals and fresh private affected-record backups. Do not guess or split CHAIN records with regular expressions.
4. Obtain separate approval for exact mappings before adding/executing a transactional conversion runner. Restore only before values whose current value still equals the recorded after value. Never bulk-restore snapshots.
5. Verify authenticated admin/issuer flows after schema activation. Production release remains a separate approval step.
