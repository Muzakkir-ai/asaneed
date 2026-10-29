# Numbered artwork and separate routes

The fonts repository supports `svg/mashaykh/NN/name.svg`, optional `line-02.svg` and `line-03.svg`, plus `svg/books/NN/heading.svg` and `svg/turuq/NN/heading.svg`. Folder numbers use ASCII digits. Issuer numbers are displayed alongside names in the administrator asset-source panel. Current issuer mapping: 01 Zakaullah, 02 Owais, 03 Muzakkir, 04 Umar, 05 Sharaf.

`svg/catalog.json` maps book and route numbers to exact Arabic labels: `{"books":{"01":"تحفة الأطفال"},"turuq":{"03":"اسم الطريق"}}`. Book preview names and route labels match ignoring Arabic vowel marks. A new route number must identify one route consistently. Refresh discovers recognized paths, validates viewBox dimensions, and stores the catalog with its immutable Git commit. Existing root artwork is retained. New finalized certificates save their catalog, source revision and issuer number; existing snapshots are not rewritten.

Personal holdings can save a reading/riwayah separately for each custom route number. Additional-shaykh individual-riwayah editors likewise save a separate custom route without overwriting the original route. A custom route requires its own complete sanad; the default Shatibiyyah/Durrah shared segments are never appended. Route selection in the certificate form controls both individual and paired-riwayah issuance. The text is supplied and checked by the issuing scholar; this feature does not establish scholarly authenticity or manufacture a route chain.

Book artwork appears in the existing matn preview through its catalog label. This does not add a new book-certificate publication workflow. Existing reading SVG filenames remain supported by the canonical reading catalog. The numbered discovery added here covers shaykh footer lines, book headings and route headings.

Draft previews have a PDF action without finalization. Desktop uses native print-to-PDF; iOS uses the existing PDF fallback. The published Qalun test 2601-0102 was removed at the user's explicit request after a private full application backup. Normal finalized-record protections remain enabled.

The local fonts checkout is Documents/Codex/Asaneed-Fonts. Upload-Changes.cmd invokes a PowerShell script that fetches, refuses to overwrite newer upstream work, stages only fonts/ and svg/, creates a dated automatic commit message, and pushes without force. Its successful real upload was verified on 2026-10-29.

Validation: production build; numbered-path and viewBox validation; route SVG selection and fallback; complete custom chain isolation; original Qalun/Warsh heading tests; local filter/permission and registration tests. Live UI checks are recorded in the task report. New routes still require the scholar's real chain and artwork before a real route-specific certificate can be checked end-to-end.
