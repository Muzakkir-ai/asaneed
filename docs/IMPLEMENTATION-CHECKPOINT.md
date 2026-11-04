# Asaneed unified redesign — resume checkpoint

Saved: 2026-11-04. **Implementation is in progress; this is not a completed or released feature.**

## User intent and authorization

Implement the complete unified management/editor redesign from the attached specification, preserving existing Arabic text, fonts, artwork, sanad formatting, personal data and published certificate snapshots. Reuse the existing implementation. Finish validation, create a draft PR and preview. Do not merge or deploy this redesign to production without approval.

The full request is at `C:/Users/Admin/.codex/attachments/996a94cf-9610-47ed-a86b-d810b0344ec9/Pasted text.txt`. Read it before continuing. It is the authoritative scope.

Automatic approval review originally rejected applying the migration to hosted Supabase because it changes permissions, RLS and issuance behavior. **The user subsequently explicitly approved that migration**, quoting the rejection and saying “u have my approval”. This approval persists. Do not ask for the same approval again. Validate and fix the migration before applying it; there is a known restore defect below. No migration has been applied yet. This approval does not authorize merging/deploying the new app or modifying published certificate data.

Latest user instruction: save a Markdown checkpoint of progress and next steps because the session limit is approaching; do not lose work or restart implementation.

## Repository and release baseline

- Checkout: `C:/Users/Admin/Documents/Codex/2026-11-04/referenced-chatgpt-conversation-this-is-an/work/asaneed`
- Active branch: `feat/unified-management-redesign`.
- Base main: `7743ecf7386b544dd0cb13749e3513c9857e5cdc`, merged PR #5 (compact editor/shared SVG heading/viewer). That earlier release was authorized and deployed successfully. Do not reopen/reimplement PR #5.
- First redesign commit: `47b2605 Embed existing books/routes manager in compact management tabs`.
- The remaining implementation is saved locally and will be included in a WIP checkpoint commit. No redesign PR or hosted preview exists yet.
- Read `AGENTS.md`, `docs/CURRENT-STATE.md`, `docs/NEXT-STEPS.md`, and `docs/UNIFIED-REDESIGN.md` for repository guidance.
- Live import graph: `/studio/client.tsx` dynamically loads `legacy/App.tsx`; legacy components are live.

## Completed implementation, pending full review/testing

1. **Books/routes:** reused the actual BookTariqBuilder with inline mode in compact tabs, books/routes as default and shared qiraat text as second tab. The original modal entry remains compatible. SanadSectionEditor has a reusable textsOnly mode.
2. **Catalog and requests:** new `legacy/api/contentManagement.ts` endpoint and `MatnCatalogPage.tsx`. Admin catalog editing/publication/artwork/default headings/template associations; published browsing/search/category for issuers; canonical catalog references on personal holdings; missing-work requests with transactional approve/link/create/reject, actor/time/reason and own decision notices. Duplicate detection normalizes Arabic marks/forms and uses SQL locks.
3. **Shared text administration:** `SharedContentPage.tsx` manages shared intro/conclusion/wording templates with draft/published state; existing qiraat editor reused. Personal template selection creates a personal copy instead of editing the shared master. Additional-shaykh qualification page no longer exposes general template-management UI.
4. **Navigation:** distinct catalog, requests, shared text and personal appearance entries in App/WorkspaceNavigation. Existing sidebar keys preserved. Admin issuance toggles integrated beside existing UsersManager.
5. **Personal appearance:** new `CertificateAppearance.tsx` and `legacy/lib/certificateAppearance.ts`: compact theme swatches/preset, collapsed advanced font/size/paragraph options, live existing heading renderer. Stored under own workspace_records; applied to future draft snapshots only where no explicit certificate settings exist.
6. **Heading precedence:** shared catalog defaults → personal matn preference → explicit certificate override. Same MatnHeading renderer/artwork association flows through editor, composed preview and certificate. Catalog artwork number is frozen into certificate documents. Existing saved/published snapshots remain authoritative.
7. **Capabilities:** additive accounts.can_issue, independent from admin role. Existing admin/shaykh capability preserved by backfill. Active server account authorization and SQL enforcement added. Existing last-admin safeguards unchanged.
8. **Migration and tests:** migration and a synthetic local PostgreSQL fixture/test added; PGlite pinned as a dev dependency because Docker daemon is unavailable. No hosted schema/data mutation has occurred.

Principal new files:

- `legacy/api/contentManagement.ts`
- `legacy/components/MatnCatalogPage.tsx`
- `legacy/components/SharedContentPage.tsx`
- `legacy/components/CertificateAppearance.tsx`
- `legacy/lib/certificateAppearance.ts`
- `supabase/migrations/20261104125019_unified_matn_catalog.sql`
- `tests/fixtures/catalog-database.sql`
- `tests/matn-catalog-database.test.cjs`

Other edits span MutoonEditor, holdings/templates/certificate APIs, snapshot collector, MatnHeading/CertificatePrint, account/session types, endpoint registry, workspace scope and navigation. Use git diff/status for the exact list.

## Database facts and migration

Supabase project `asaneed`, ref `sqyookpdpymgpwpnicyp`.

Existing personal holdings/templates live in `public.workspace_records(kind,id,payload,created_at)`, not dedicated SQL tables. Preserve IDs and owners. Personal scope uses auth user UUID; account IDs are different. Additional guests use guest:issuer scope. Shared records have no owner.

Migration adds matn_catalog, matn_requests, content_audit, generated normalized title keys, indexes, RLS and guarded mutation RPCs. Adds accounts.can_issue with compatibility defaults, restrictive certificate-write policies and finalize guard. Extends existing backup/restore functions and preserves their original definitions in private.application_backups. Adds unique personal catalog association index. Shared template drafts are hidden through restrictive RLS, while old shared templates without status stay visible.

**Do not apply yet: local backup-restore regression currently fails.**

Latest local run reaches restoration of a full new backup and fails with:

`cannot insert a non-DEFAULT value into column "title_key"` (SQLSTATE 428C9), generated column.

Fix the restore extension to insert explicit writable columns for matn_catalog and matn_requests, excluding generated title_key. Review corresponding account/default handling and foreign-key restoration order. Do not suppress this error or remove the assertion. Full log: `../catalog-test-checkpoint.log` relative to checkout; synthetic data only. Test currently prints a large error object; reduce reporting to error.message/detail to avoid excessive output.

## Validation status at checkpoint

- **PASS:** `npm run typecheck`, freshly rerun on the current code immediately before checkpoint.
- **PARTIAL/FAIL:** `node tests/matn-catalog-database.test.cjs`. Actual migration compiles locally; assertions before the final new-backup restore completed. Final restore fails as described above. No full database-suite pass yet.
- **NOT YET RERUN on redesign:** production build, editor unit regressions, heading/snapshot/API suites, browser desktop/mobile workflows and real A4 PDF checks.
- Prior PR #5 checks passed before redesign, but that is not evidence these new changes pass.
- No live migration, role toggles, requests or certificates created for testing.

Local SQL test covers role visibility/ownership, direct-write denial, normalized duplicates, invalid heading rejection, request review atomicity/replay, own acknowledgments, independent admin issuance restriction, old holding/snapshot preservation, legacy backup compatibility and anonymous denial. All must pass after the restore fix.

## Next steps in order

1. Read the full pasted spec and current diff. Fix the generated-column restore bug and run the local database suite to completion. Review all permission/backup changes before applying the approved migration.
2. Finish backend correctness: require a published catalog reference for **new** personal holdings, while allowing edits to legacy unlinked holdings. Update persistence fixtures accordingly. Review catalog association in additional-shaykh qualifications (currently the old manual qualification-name input remains). Add audit coverage for shared-template admin updates if missing.
3. Review UI states/typing and backend schemas. Catalog selectedMatn effect depends on fetched rows; check it does not reset unsaved edits. Shared template writes must stay admin-only. Remove obsolete template-editor state/functions from AdditionalShaykhsPage as appropriate.
4. Update regression mocks: `tests/matn-heading-snapshot.test.cjs` now encounters personalAppearance/context; stub or exercise that explicitly. Holdings tests need catalog fixtures for new creates. Add shared-default/personal/certificate precedence, frozen snapshot, capability and request API tests.
5. Add actual component browser fixtures for administrator and issuer flows with synthetic API data, both desktop and mobile. Avoid creating real published certificates or exposing private records in test artifacts.
6. Run `npm run typecheck`, `npm run test:editor`, `npm run test:matn-heading`, database suite and `npm run build`. Resolve failures; do not claim old results as current.
7. Run browser checks and real PDF output. Existing `tests/editor-browser.test.cjs` creates a temporary local review route, runs Next dev on port 3105 and uses installed Chrome via pinned Playwright. Run with appropriate escalation so browser/server share network access. Set `EDITOR_ARTIFACT_DIR` to the outputs directory. It cleans its temporary route/generated files. Verify A4 landscape 297×210 mm, continuous sanad flow, Arabic typing/tashkil, two SVG lines, viewer zoom and responsive layout. Poppler pdfinfo/pdftoppm are installed.
8. After validation, apply the **user-approved** additive hosted migration through Supabase tools, inspect resulting schema/advisories and run safe role/read checks. Do not mutate published certificate data. If automatic review rejects despite the new explicit approval, report the exact rejection and do not bypass it.
9. Commit remaining phases, push the existing redesign branch, create a **draft** PR and Vercel preview. Do not merge or deploy production. Verify preview points to the latest commit and report schema changes, compatibility/authorization decisions, tests, screenshots/PDF and remaining limitations honestly.

## Operational notes

- No subagents: current developer instruction prohibits unsolicited delegation.
- Tools for GitHub/Supabase/Vercel can be discovered through ALL_TOOLS filtering in functions.exec. Prefer connected tools when sufficient.
- Network git fetch previously required escalation. GitHub API publication is a fallback if normal push auth is unavailable. Preserve full local tree and compare hashes when using that fallback.
- Hosted preview currently cannot use the new features until migration: session/account reads select can_issue and new APIs require new tables. Do not claim the old preview contains this redesign.
- Do not export private Supabase data into git, screenshots or fixtures. Synthetic fixture IDs/data only.
- User-facing deliverables directory: `C:/Users/Admin/Documents/Codex/2026-11-04/referenced-chatgpt-conversation-this-is-an/outputs`.
- Preserve authorization across continuation. The next assistant should resume work, not ask the user to repeat scope or approve the same migration again.
