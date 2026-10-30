# Suggested next steps and remaining checks

Updated 30 October 2026. These are **suggestions and verification gaps**, not claims of completed work or authorization to change production data. Ask the user which product improvement they want when starting a new task; do not reopen paused branding work.

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

- Review the 20 imported Shatibiyyah (14) and Durrah (6) drafts in the library. They are unconfirmed and not attached to any shaykh. Preserve both Ishaq/Idris paths; review upper/branch assignments before classifying them.
- Review a real source with the user before classifying existing records as upper/branch or converting old Sughra text into stable person nodes. The structured editor now supports both scopes, but no bulk historical conversion was performed.
- Check the new additional-shaykh saved-route flow and hierarchy controls in authenticated desktop/mobile sessions; mocked DOM checks and rollback-only SQL do not substitute for those sessions.

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
