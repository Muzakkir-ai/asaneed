# Editor workflow and teaching guide

## The workflow to teach

1. Open the relevant list and select the person, matn, book or route.
2. Check the item and owner named at the top of the editor.
3. For mutoon, use السند → كلمات الإجازة → تنسيق العنوان → المعاينة.
4. Save using the header button. Back/Cancel returns to the parent list/profile, with a discard warning if tracked form values changed.

A three-step Arabic help disclosure is included in every EditorPage. Personal holdings, additional-shaykh holdings and shared catalog/text records remain different entities with explicit context. Shared edits do not propagate into historical certificate snapshots.

## Entry points reviewed

| Entry point | Result |
| --- | --- |
| Added shaykh card | Full detail view with edit, qiraat and matn actions |
| Added shaykh profile | Page editor; returns to the same shaykh |
| Added shaykh reading sanad | Page editor; existing route picker/target checks |
| Added shaykh matn | Common matn section editor; returns to that shaykh's matn list |
| Personal matn from catalog or saved list | Same matn section editor, clearly personal |
| Personal qiraat holding | Page editor, existing composition and validation |
| Shared matn metadata | Page editor, original admin save/duplicate checks |
| Shared matn wording/templates | Page editor, original scoped save API |
| Shared sanad wording and continuations | Page editor, original formatting and approval checks |
| Book library from personal or added shaykh | Page frame, original explicit target |
| Book metadata/book sanad/route | Page editing within the library; original graph editor and save functions |
| Reading/riwayah selection | Small selection dialogs retained |
| Certificate preview | Existing print preview retained |
| Riwayah palette | Collapsed name and two live colour circles; expands to existing controls/preview/save |

## What has not been claimed

Navigation remains inside the existing studio; no new URL router or browser-history model was introduced. Dirty guards cover shared-frame Back/Cancel and browser unload, not every pre-existing sidebar or internal tab transition. Selection controls retain state; a full global navigation guard needs a separate app-level design if requested. Some specialized add-another and archive actions remain within book editing. Request/review dialogs are workflow decisions, not document editors.

No hosted records were created or modified for testing. Mocked DOM tests and existing local SQL suites do not replace real authenticated role sessions, native iOS composition or physical print checks.
