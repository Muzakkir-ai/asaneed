## Branch review — 6 November 2026

Open the shared personal-sanad editor and inspect the shortest/alternate highlighted paths. The complete personal sanad is already visible; confirm the prepared narrator boxes, then save when satisfied. The reviewed alternate spellings reuse one saved identity; no source was silently corrected or confirmed. Verify on a physical iPhone; local Chromium checks cover 320/390px.

## Shared Sughra and mobile narrator review — 5 November 2026

Review the requested shaykh's prepared shared prefix on the first detail page, confirm its narrator boxes and save once. Shared mode covers all selected original Sughra riwayat; numbered routes remain independent and old individual sources are retained. Switch shared mode off to edit exceptions. Verify the stacked connected-branch layout on a physical phone; Chromium 320/390px checks pass.

## Previously entered narrator boxes awaiting user confirmation — 5 November 2026

The requested additional-shaykh profile's four riwayat and existing route-specific sources are staged for narrator review. Open a riwayah, inspect the prepared prefix and full preserved source, choose «تأكيد الرواة من النص السابق», then «حفظ السند». Repeated names and joint-teacher wording intentionally remain as entered; no scholarly correction or branch simplification was inferred. None was confirmed during implementation. Unsupported/ambiguous sources or identities need review rather than guessed links.

## Meeting-point search and theme follow-up — 5 November 2026

Check the compact searchable meeting selector on a physical iPhone. Choose an existing reviewed continuation or a saved Quran narrator, review/save a new continuation if needed, adopt the narrator order and save. No connection is inferred from selecting a name. Review the teal left-to-right gradients and outline-button touch hover in a real session; local Chromium touch/desktop checks pass.

## Mobile feedback / personal-sanad follow-up — 5 November 2026

Check the deployed effects on a physical iPhone and Android device: one tap opens cards, scrolling cancels the highlight, and reduced motion stays calm. The local Chromium desktop/touch fixture passes; no real signed-in mobile issuance was performed. In a real riwayah editor, add narrator cards through the chosen meeting point, choose its reviewed continuation under the last card, adopt/review, then save. Existing saved text remains available as a preview; redundant manual-entry panels are removed.

## Account setup follow-up — 5 November 2026

Use a real administrator-created invitation when ready: optional profile email → username/setup code → native email verification → user-chosen password → active workspace. Test on desktop/mobile, including opening confirmation in another browser and re-entering the unconsumed code. No real invitation or email was created during development. Existing active accounts use normal management/password recovery; setup never overwrites them. Linked shaykh holdings are independent copies of current sources, and historical issuer/certificate IDs stay fixed.

## Personal sanad follow-up — 5 November 2026

Review the narrator picker and named personal sanad flow in authenticated desktop/mobile sessions. Save two variants of one riwayah, choose each explicitly in issuance, and review a merged copy. Local API/DOM/PostgreSQL checks cover ownership, stable identities and source retention; no real certificate was issued for testing. Existing pasted prefixes require deliberate narrator entry or an explicitly reviewed private continuation; they are not automatically split into identities. Merged paths preserve full branches separated by (ح), without automatic common-tail compression.

## Text layout and recoverable user deletion — 5 November 2026

Review point/percent sizing, centered matn text width and overall scaling in authenticated desktop/mobile sessions. Local editor/render/save tests pass; automatic approval rejected creating a protected-preview sharing link, so no new browser verification is claimed for this release. Physical print remains unverified.

Recoverable user removal is available only to active admins for non-admin accounts, with exact-name confirmation and restore. The additive migration is applied; hosted fixture rolled back and zero accounts are marked deleted. Restore leaves the user inactive. Permanent Auth erasure is not implemented.

## Draft source refresh follow-up — 5 November 2026

Review an existing draft after editing its original personal/additional-shaykh matn. Reopen preview to resolve the latest saved text; finalization resolves it again. Old drafts with missing or ambiguous source links retain their copied content for safe review. A real hosted certificate was not published for testing.

## Matn layout release follow-up — 4 November 2026

- Upload the user's border artwork as numbered `svg/borders/NN/frame.svg`, refresh artwork, then review a real draft and frozen finalized snapshot. Current default/no-border and synthetic numbered-border tests pass; no new artwork was uploaded in this change.
- Review the admin matn asaneed panel in an authenticated admin session with personal and additional-shaykh records. API role/inspection and exact-link fixture tests pass.
- Check physical A4 landscape output and long-content overflow with the new section boundary controls. Existing finalizations remain immutable.

# Editor workflow follow-up — 4 November 2026

The current user requested consistent full-page editing and authorized publication. See CURRENT-STATE.md and EDITOR-WORKFLOW.md. Verify normal/admin/additional-shaykh workflows in authenticated production sessions, native mobile typing/selection and physical printing. Do not infer that older production-approval requirements below revoke this explicit session authorization.

# Release update — 4 November 2026

PR #6 is merged and live at main 22c983c. The approved unified-sanad migration is applied; Jazarīyah is published under المتون العلمية / التجويد and its existing personal entry is linked without text/formatting changes. The nine unmatched route comparisons remain pending. Earlier migration-pending notes below are historical; do not reapply the migration. See CURRENT-STATE.md.

# Suggested next steps and remaining checks

Updated 30 October 2026. These are **suggestions and verification gaps**, not claims of completed work or authorization to change production data. Ask the user which product improvement they want when starting a new task; do not reopen paused branding work.

## Active PR #6 — sanad unification review

- Review the new additive sanad migration before applying it. Then regenerate hosted types/check advisors and exercise authenticated admin/issuer flows in preview. Do not merge or deploy production without approval.
- Review the 23-route comparison: all 14 Shatibiyyah seven-name prefixes match, while 9 general route comparisons need manual review. Do not silently confirm routes or infer missing identities/branches.
- Back up affected records privately and review exact before/after mappings before conversion. Existing builderRouteId alone does not identify the personal boundary. Preserve all 45 uncertain older snapshots, including the 30 carrying issue dates.
- Retire the old CHAIN lookup adapter only after old holdings/preparations/additional-shaykh copies have approved mappings. New route selections use the same core with explicit references. See [SANAD-UNIFICATION.md](SANAD-UNIFICATION.md).

## Useful next user-facing improvements

1. **Make library-versus-personal ownership even clearer.** The saved-route picker now connects the ijazah form to the shared library. Future polish could label the source book/sanad and explain that a saved holding is an independent copy. If adding refresh-from-library, show a diff and require explicit review; never rewrite certificates silently.
2. **Improve managing large libraries.** Add route search, qiraah/rawi filters, pagination or lazy loading, and an archived-record view with restore controls. The main listing already collapses route details. Avoid expanding hundreds of chains by default.
3. **Numeric artwork directory for books/routes.** Issuer directory/codes and numbered artwork exist. Clarify book IDs versus book-sanad IDs versus route artwork codes in an admin view, and connect upload guidance to the actual selected entity. Do not renumber existing route codes or reuse retired identifiers merely to make them look consecutive.
4. **More custom turuq with reviewed data.** Let the user enter real books/chains through the builder, then compare the generated sanad and heading with their supplied source. Preserve multiple branches and multiple أصحاب الطريق. Never invent a missing link or apply Shatibiyyah/Durrah fragments to a different complete route.
5. **Better identity reuse.** Existing normalized-name matching and stable builder person IDs avoid simple duplicates. A reviewed alias/merge interface could help variant titles and spellings. It must show references, avoid automatic merging of distinct people, and preserve saved snapshots/copies.
6. **Continue mobile polish through real use.** Test long names, large libraries, onscreen keyboards and both color modes. The newly themed name suggestions are done; other native select menus remain candidates if the user asks for them.

## Next feature — intelligent narrator selection (راوٍ بعده)

**Goal:** When inserting a narrator after another person in the existing Asaneed book/ṭarīq builder, search **all existing people available to the user**, not just those already connected by an `أخذ عن / أخذ عنه` relationship. Existing connections improve ranking, but must never become a restriction on selection. The first implementation is released in production at `6d4a488d56aeedaf8ed0c9ac37f0d28d0bf1664b` (30 October 2026), verified READY. See CURRENT-STATE.md for behavior and verification limits. Observed adjacency never constitutes historical verification.

1. **All-person search with ranked suggestions.** On `إضافة راوٍ بعده` (and equivalent insert-before/between controls), search the entire authorized people registry. List recorded neighboring transmitters first under `صلة مسجلة سابقًا` or `الأسماء المقترحة`, followed by other matching saved people. Include a clear `عرض جميع الأسماء` option. Permit selecting any existing person, even without a recorded link. Avoid an excessively large initial dropdown: prioritize suggestions and search results with sensible result limits/pagination.
2. **Truthful connection indicators.** Mark people with a previously recorded adjacent chain connection as `صلة مسجلة سابقًا`. Mark others `لم يُعثر على صلة مسجلة`—**not** `صلة غير صحيحة`. Distinguish a link merely **observed in an existing sanad** from one supported by separately reviewed source evidence. Never imply that the application has verified the historical correctness of a chain just because two names appear together. The warning should not block selection.
3. **Search name variants before creating a person.** Match canonical/display names, stored **صيغة الجر**, kunyas, titles, aliases and alternative spellings. Normalize Arabic for searching (e.g., optional tashkīl, hamzah/alif variations, whitespace) without overwriting the original forms or blindly equating different people. Search the existing رجال الأسانيد/migrated sanad sources as well as `builder_people` where appropriate; first establish which sources already have stable identities.
4. **Reuse identity; review possible duplicates.** Selecting a result must store its existing stable person ID (`builder_nodes.person_id`), not create a duplicate row. If no match is chosen, show likely existing matches before offering `إنشاء شخص جديد`. Let a user explicitly create a distinct person when names coincide. For ambiguous cases, provide review rather than automatic merging; preserve existing references, snapshots, and original spellings.
5. **Lightweight new-person entry.** Ask for `اسم الراوي بصيغة الجر` as required; allow an optional familiar/display name or alias. Do not demand dates, biography, teacher lists, or other historical metadata for normal ṭarīq entry. Provide an inline add flow that returns to the current chain without losing its book/riwāyah/ṭarīq selections.
6. **Learn observed links without declaring verification.** On saving a chain, ordered adjacent narrator pairs can become **observed** suggestions for subsequent entry. Keep the chain/source reference and direction of transmission; don't infer the reverse link automatically or promote the pair to verified status. Optionally offer `إضافة مصدر لهذه الصلة` for later review.
7. **Use existing architecture safely.** Inspect and reuse `builder_people`, `builder_nodes`, `builder_chains`, `builder_books`, and the current رجال الأسانيد source. Add minimal alias/relationship-evidence storage only if necessary after checking existing schema and UI behavior. Respect ownership/RLS; the selected issuing shaykh filter on الطلاب والشهادات must not inadvertently narrow the shared narrator picker. No automatic rewrite of old asānīd or published certificates.
8. **Keep the builder fast on mobile.** In an RTL searchable selector, show the name prominently and a subtle link-status label/icon. Make the all-people list searchable, touch-friendly, and keyboard-accessible; keep insert-between controls compact. Do not force a user through a separate person-management screen simply to enter one new name.

**Remaining release checks:** Authenticated desktop/mobile browser sessions for normal and additional-shaykh workflows, pointer/keyboard selection, all-people paging, inline creation with draft preservation, and observed suggestions after saving. Browser execution was blocked by the unavailable Chromium download. Multiple structured aliases and independently reviewed relationship evidence remain deferred; current search uses genitive/display names and text-directory candidates.

**Acceptance checks:** Search a previously connected narrator; select an existing unconnected narrator; search by kunyah and alternate/genitive spellings; search without tashkīl; warn on a near-duplicate and reuse the selected person ID; create a genuinely new person; save a chain and confirm the pair is suggested as *observed*, not *verified*; test both a normal sanad and an additional-shaykh sanad; confirm existing records and permissions remain intact.

## Follow-up for structured Sughra and route levels

- Review the 20 imported Shatibiyyah (14) and Durrah (6) drafts in the library. They are unconfirmed and not attached to any shaykh. Preserve both Ishaq/Idris paths and review the صاحب الطريق selections.
- The user removed upper/branch classification controls; keep the simple صاحب الطريق selection. Existing level metadata is preserved for compatibility. Review a real source before converting further old text into stable person nodes.
- Check the new additional-shaykh saved-route flow and simplified route controls in authenticated desktop/mobile sessions; mocked DOM checks and rollback-only SQL do not substitute for those sessions.

## Verification to prioritize before claiming full coverage

- A real received finalized certificate → recipient account → reviewed editable holding → subsequent draft issuance flow, with the user's explicit approval for any real publication. Current extraction/permission tests do not substitute for that complete live story.
- Full browser sessions as a normal shaykh, student and second administrator. RLS/role tests exist, but recent interactive checks used the primary admin session.
- Physical A4 landscape print and actual draft PDF export on desktop/iOS, including very long custom branches, long names, colored artwork and overflow cases. Browser DOM measurements alone are not a physical print test.
- Multiple historical finalized snapshot versions, especially old entries without structured transmission/artwork/font metadata. Preserve their fallbacks.
- End-to-end custom route SVG upload → fonts Git commit → website refresh → draft preview → finalized frozen snapshot. Local file presence alone is insufficient.
- Full backup/restore of the structured builder in an isolated or rollback-only test. Backup inclusion and missing-row restore ordering were implemented. **Audit overwrite mode:** the builder-table extension currently uses conflict-do-nothing imports, so do not promise it overwrites edited existing builder records until that behavior is deliberately implemented and tested.
- Concurrency/revision cases for shared book/person edits. Chain replacement has a revision check; all scalar library edits do not yet have the same optimistic-concurrency behavior.

## Technical limits to remember

- Builder continuations are editable saved text with explicit confirmation; the app does not independently verify historical authority.
- The visual builder permits branched paths. Its textual preview repeats each complete path separated by `(ح)`; it does not yet compress arbitrary shared branch segments into scholarly prose automatically.
- API safety limits exist (including 30 branches / 499 intermediate names per branch and request-size limits). Improve large-entry UX without removing reasonable request bounds.
- Archive is the safe UI removal path. A dedicated archive recovery screen is not implemented yet.
- Existing legacy sanads are not automatically parsed/migrated into fully structured book/person/route records. A future importer should be previewed, backed up, idempotent and explicitly reviewed.
- Suggestions from existing chain text still need human review of spelling and grammatical form before saving. Stable IDs do not make ambiguous historical names automatically identical.

## Paused / do not resume incidentally

- Google logo and branding verification.
- Replacing the default Supabase authentication hostname with a custom hostname.
- Paid infrastructure upgrades, provider swaps or another full migration.
- Changes to the original Zite application.

## How to leave the next handoff

Update `CURRENT-STATE.md` after a meaningful completed change. Record the deployed commit, exact verified flows, any test-data cleanup and remaining limits. Keep private artifacts outside this public repository. If a proposed feature remains incomplete, say so explicitly rather than marking the entire backlog complete.

## Current registration numbering

YYSS-NNRR is now live: NN is a permanent lifetime serial per issuer across years and riwayat. Do not restore per-year/riwayah allocation or assume an eight-digit upper bound. Existing finalized identifiers remain immutable unless a future explicit correction is separately authorized and backed up.

## Scope-first reading workflow follow-up

Verify Sughra/Kubra selection in authenticated additional-shaykh, personal-holding and issuance sessions, including automatic original-route selection and full-qiraah issuance. Review the six Durrah drafts before enabling their attachment; do not silently confirm them. Requested Shatibiyyah attachments were limited to existing issuer riwayat (14/4/1), not expanded ijazah eligibility. Short route-source labels are edited on the source narrator; full sanad names remain independent.


## Compact editor branch release checks — 4 November 2026

- Review the compact editor PR in authenticated desktop and mobile sessions; exercise native Arabic composition, touch selection, mixed-script dates/URLs and variable insertion.
- Verify actual PDF export and physical A4 landscape output with configured fonts, including multi-paragraph scoped section formatting and historical finalized fixtures.
- Production deployment requires explicit user approval. No database migration or bulk rewrite accompanies this branch.


PR #5 correction validation update: Chrome desktop (1280px), mobile viewports (320/390px), Arabic/tashkil entry and a rendered one-page A4 PDF fixture have now been checked. Remaining release checks concern authenticated end-to-end certificate workflows, native IME/iOS behavior and physical printing. Run `npm run test:editor:browser` with installed Google Chrome (or `CHROME_PATH`); its fixture uses no hosted data and is removed automatically. Artifacts default to `.vercel/editor-browser`, configurable with `EDITOR_ARTIFACT_DIR`.


Matn heading follow-up: shared independent SVG sizing, legacy/current/default precedence and real two-line artwork/PDF zoom invariance are checked on PR #5. Review saved defaults in an authenticated account before any release. Existing per-certificate legacy overrides intentionally remain effective; choose «استخدام إعدادات المتن» to inherit changed matn defaults. Physical print and native mobile export still require device review. Production approval is still required.
