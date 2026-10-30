# Suggested next steps and remaining checks

Updated 30 October 2026. These are **suggestions and verification gaps**, not claims of completed work or authorization to change production data. Ask the user which product improvement they want when starting a new task; do not reopen paused branding work.

## Useful next user-facing improvements

1. **Make library-versus-personal ownership even clearer.** The saved-route picker now connects the ijazah form to the shared library. Future polish could label the source book/sanad and explain that a saved holding is an independent copy. If adding refresh-from-library, show a diff and require explicit review; never rewrite certificates silently.
2. **Improve managing large libraries.** Add route search, qiraah/rawi filters, pagination or lazy loading, and an archived-record view with restore controls. The main listing already collapses route details. Avoid expanding hundreds of chains by default.
3. **Numeric artwork directory for books/routes.** Issuer directory/codes and numbered artwork exist. Clarify book IDs versus book-sanad IDs versus route artwork codes in an admin view, and connect upload guidance to the actual selected entity. Do not renumber existing route codes or reuse retired identifiers merely to make them look consecutive.
4. **More custom turuq with reviewed data.** Let the user enter real books/chains through the builder, then compare the generated sanad and heading with their supplied source. Preserve multiple branches and multiple أصحاب الطريق. Never invent a missing link or apply Shatibiyyah/Durrah fragments to a different complete route.
5. **Better identity reuse.** Existing normalized-name matching and stable builder person IDs avoid simple duplicates. A reviewed alias/merge interface could help variant titles and spellings. It must show references, avoid automatic merging of distinct people, and preserve saved snapshots/copies.
6. **Continue mobile polish through real use.** Test long names, large libraries, onscreen keyboards and both color modes. The newly themed name suggestions are done; other native select menus remain candidates if the user asks for them.

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
