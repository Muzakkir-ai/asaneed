# Unified sanad architecture — PR #6

Date: 4 November 2026, Asia/Riyadh. Continues `feat/unified-management-redesign`; no production release or stored-chain conversion has been performed for this change.

## Authoritative paths

`legacy/lib/unifiedSanad.ts` supplies structured branch composition, segment composition, approved-continuation resolution, read-only comparison and reversible holding conversion proposals. `bookBuilder.builderPreview` delegates to it. `assembleIjazah` remains a compatibility adapter for certificate headings, wording and old saved section references; its chain composition delegates to this core. It is no longer a separate concatenation implementation.

`assembleHoldingIjazah` resolves new explicit route references before invoking that adapter. It is used by personal preparation, full-qiraah issuance, additional-shaykh issuance and the certificate snapshot collector's current/draft resolution. The client holding preview uses the same pure adapter/core. SavedRoutePicker and direct builder attachment preserve explicit route/personal-boundary references for newly selected routes. Manually editing a copied full chain clears its reference rather than silently ignoring the edit. Existing copies are not silently rebound.

New references resolve only the selected qari/rawi; a changed scope or unavailable route is an error. Book authors are joined by explicit IDs at boundaries. Legitimate repeated names inside segments remain intact. Existing branched topology/rendering, Arabic artwork/fonts, certificate colors and rich print flow remain in place.

Shared saves no longer call `syncSharedSanads`. Its compatibility export performs zero writes. Shared edits cannot propagate into prepared personal copies or certificate snapshots. Explicit draft preparation/preview may resolve current approved referenced content; finalized preview guards and immutable snapshots remain authoritative. Additional-shaykh older copies remain preserved; new linked drafts use the shared core.

## Interface

The shared-text landing page has four responsive icon cards: تتمات الروايات, أسانيد الأئمة, الصحابة والنبي ﷺ, نصوص الإجازة. Wordings and matn templates remain separate from narrator connections. Icons retain Arabic labels/tooltips, keyboard focus and active states.

Continuations reuse `workspace_records(kind='sanadSections')` with optional versioned `continuation` metadata: segment kind, qari, optional rawi, variant, approval status, reviewer and time. The old CHAIN records are read-only reference sources in the new ordinary interface. No regular-expression splitting or historical identity guessing is used. An administrator may explicitly select exact source offsets and review the new continuation. Selected rich formatting is intersected/rebased to the selected text. Original source body and offsets are retained for review; originals are never overwritten by the continuation RPC.

Routes automatically resolve one approved segment of each kind. Multiple variants require selection. Missing/revoked segments prevent confirmation. A separate advanced override requires deliberate review. Administrator writes are checked in HTTP handlers and through restrictive RLS; issuers browse/attach and manage personal holdings, without shared editing controls. Correction requests are personal sections with authenticated ownership, visible to their requester and administrators under existing RLS; they remain pending for manual review.

The comparison tool shows source/output, matched/missing names per branch, known extra names outside the builder portion, source identifiers and status. Extra-name detection is limited to existing person identities; comparison is not full historical authentication or exhaustive prose parsing. Explicit approval requires a note and is audited. Route/parent revisions and exact source bodies are rechecked under transaction locks. Approval records evidence, not a data conversion.

## Read-only live audit

- 23 active routes: Shatibiyyah 14, Durrah 6, Mustanir 2, Misbah 1. Two archived Rawdat al-Muaddil books are excluded from automatic coverage claims.
- All **14/14 Shatibiyyah** routes reproduce the seven-name Ibn al-Jazari → al-Dani source segment after Arabic search normalization. Both saved shared reference bodies agree. This is agreement of database representations, not historical authentication.
- General ordered-name comparison: 14 routes contain every builder name in order; 9 have names/branches needing review. This is not a claim of exact complete-prose equality. The detailed private report lists every route, source IDs and unmatched names.
- 47 core certificates are marked draft and all link to existing core sanads. No core finalized snapshots were found.
- **45 older workspace snapshots remain uncertain; 30 have nonempty issuedAt. Preserve all of them.** A core draft flag does not make their historical copies disposable.
- 60 personal holdings, 22 carrying builderRouteId; 46 additional-shaykh reading sanads, 22 carrying builderRouteId; 29 prepared ijazahs; 34 older workspace sanad records. Existing IDs/owners/student links/selected readings are unchanged.
- The database contained 25 private backups at audit time. No backup payload or personal source export is committed. Fresh affected-record backups are still required immediately before any approved conversion.

`scripts/compare-saved-sanads.cjs` consumes a private read-only shared-library export and writes a report outside the repository. Compile the unified tests first. The export is not part of Git. Do not claim all records matched or approve the nine unmatched routes.

## Schema migration prepared, not applied

`20261104164423_unified_sanad_continuations.sql` adds nullable `continuation_ids` and `continuation_override` to builder chains; no tables are added. It reuses shared sections and content_audit. Public RPCs are invoker wrappers over narrowly guarded private administrative operations. Original save/attachment/restore function definitions are privately backed up during application.

The original revision-aware builder save function is retained privately, wrapped with reference validation; direct confirmed writes also receive a trigger guard. Existing attachment ownership checks are retained and referenced continuations are checked. Approved library routes become readable to staff; shared relationship mutations are administrator-only. Draft continuation metadata and administrative consolidation evidence are hidden from issuers by restrictive RLS.

Existing backups already serialize all builder columns and workspace payloads. Restore compatibility supplies missing old fields and labels old complete confirmed continuations as legacy overrides. Weak/incomplete confirmed legacy content fails validation for explicit review rather than being silently approved. New referenced backups require their workspace sections to be restored first, as in the existing restore ordering.

Apply this schema only after review/approval for this new sanad migration. The earlier approval concerned the matn-management migration; it is not authorization to convert existing sanad records. A preview can show the interface, but new continuation/review saves require the prepared migration. No hosted writes were performed during these tests.

## Record migration protocol

1. Re-audit current certificate states and dependencies immediately before conversion. Exclude finalized/uncertain snapshots, including all 45 older workspace copies unless individually reviewed.
2. Back up every affected original payload, builder/section version and link privately. Retain original IDs and owners.
3. An administrator provides an explicit personal prefix and chosen route. `planHoldingReference` / the admin `planConversion` action produces before/after/mapping without writes. It requires the exact reconstructed text to equal the original, matching qari/rawi and a confirmed route; otherwise after is null and status is review.
4. Review each proposed mapping and grant separate approval before a persistence runner is added/executed. No bulk update or conversion runner is shipped. A prior builderRouteId alone is insufficient evidence of the personal boundary.
5. Apply approved payload mappings transactionally with before-value/revision checks. Do not change personalChain, original IDs, owner, selected reading, prepared/certificate links or snapshots.
6. Roll back a converted payload only if its current value still equals that conversion's recorded after value; restore the recorded before payload. Abort on concurrent edits. No global snapshot restore.
7. Preserve original CHAIN sections and source formatting. Common three-node Shatibiyyah route prefixes are a verified consolidation candidate, but no narrator nodes or source-role occurrences have been deleted/deduplicated in this phase. Book-parent references are already reused.

Legacy adapter retirement has a concrete dependency: old unconverted holdings/preparations/additional-shaykh copies and the nine unmatched route comparisons. New route selection uses explicit references; no new junction-mode legacy holdings are created without a selected route. Full manual/received chains remain supported as advanced complete input. Remove the old section lookup adapter only after these records have approved mappings.

## Verification and limits

- TypeScript and production build pass.
- Unified core, branch/junction, Arabic punctuation, source formatting slicing, legacy adapter and actual workflow-adapter regressions pass.
- Local PGlite tests execute the actual migrations: admin/issuer/anonymous allow-deny, direct-write guards, approved segment references, repeated IDs, wrong rawi, review evidence races, exact source selection, old backup restore and audit.
- Existing editor and matn heading/snapshot/API/persistence/format-setting/render suites pass.
- Chrome checks actual shared-library and builder components with synthetic API data at 1280/390/320 pixels: icon categories, no page overflow, read-only originals, Arabic/tashkil typing, draft saves, central continuation preview and issuer controls hidden. No browser errors.
- Chrome's existing certificate fixture verifies real fonts, independent SVG sizes/centering/gaps, mobile zoom, overflow detection and A4 landscape PDFs at multiple viewer zooms. The print fixture includes structured branch composition through the unified core.
- These are synthetic component/API fixtures plus local SQL permission tests, not authenticated hosted mutation tests or a physical printer/iOS/native IME test. Hosted migration/advisor validation remains pending its approved application. Security advisors currently include pre-existing private no-policy notices, artwork-refresh and matn-RPC definer warnings, and disabled leaked-password protection; no unrelated settings were changed.

Keep PR #6 in draft. Do not merge or deploy production. The detailed comparison report and browser/PDF artifacts are delivered outside the public repository.
