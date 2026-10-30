# Asaneed task status — 29 October 2026

> Historical report. For the latest handoff, read [AGENTS.md](../AGENTS.md), [current state](CURRENT-STATE.md), and [next steps](NEXT-STEPS.md). Later builder, picker, typography and visibility changes supersede older details here.

| Task | Status and evidence |
| --- | --- |
| 1. Permanent migration and ownership | Implemented. Private full baseline and ownership audit retained; verified aliases migrated to current ownership; separate administrator preserved; unlink rollback test passed. |
| 2. Color settings | Implemented. Native 38 px swatches beside full HEX values, validation, unsaved state, reset, actual SVG heading and read-only full draft preview. Responsive layout and live colors checked. |
| 3. Mobile lists | Implemented for the main record workflows, with compact cards, search/incremental loading, RTL and mobile dialogs. Responsive checks passed; further visual polish can still follow real use. |
| 4. Personal versus admin access | Implemented and corrected: the issuing-shaykh choice filters only students/certificates. Admin directories retain all authorized records; account inspection remains explicit and read-only by default. Production navigation and permission regression checks passed. |
| 5. Right sidebar | Implemented. Saved collapse preference, active links and mobile drawer checked. |
| 6. Theme and forms | Implemented. Self-hosted Readex Pro, teal/gold UI, dark mode, RTL, validation and responsive controls checked. Certificate fonts remain separate. |
| 7. Certificate preservation | Implemented safeguards. Numbers, dates, immutable snapshots, QR and print renderer retained; database checksum checks passed. Physical printing/PDF export has not been rechecked in this follow-up; finalized snapshot cases use fixtures because live certificates remain drafts. |
| 8. Testing and deployment | Implemented. Production builds, role/scope and data-adapter regressions, earlier rollback-only SQL suites and signed-in production checks passed. Normal-user permission checks are automated; this follow-up did not sign into a separate normal-user browser account. |
| 9. Filters and real SVG previews | Implemented. Collapsible advanced filters, persistent local issuer choice, chips/count/reset, shared compact/print heading renderer, Qalun/Warsh and paired-qiraah previews checked. Unknown custom routes retain formal text fallback when matching SVG artwork is unavailable. |
| 10. Compact certificate cards | Implemented. Student-first cards, 13 px reading/route summary, single date, small status, visible Preview/Edit and menu-based Delete with cancelled confirmation test. Issuer remains in details/print/admin inspection. |

Additional completed foundation work includes independent Supabase authentication, Google sign-in, configured domain email delivery, the multilingual public verification page, full application-data backup/restore workflow, Arabic name search, student selection/deletion controls, print overflow detection and removal of confirmed unreferenced editor components.

Google logo/branding verification and a custom authentication hostname are **paused at the user's request**. The original Zite app remains unchanged. A deployed implementation does not imply every possible account, historical certificate or physical printer has been exhaustively tested; the specific verification limits above remain open.

Follow-up: approved draft renumbering now uses YY + shaykh code, with Arabic display. Both administrators have separate personal mujeez profiles; account cards label personal issuance separately from managed records. All 35 draft certificates changed only their number field, verified against a private full backup.
