# Books and branched transmission builder

The existing Asaneed application exposes one shared `BookTariqBuilder` from My Asaneed, Sanad Management and a saved additional-shaykh profile’s readings section.

## Entry and reuse

1. Save a book title and author in the genitive form. Matching titles suggest existing books without automatically merging them.
2. Add one or more named book chains. Ibn al-Jazari and the book author are structural endpoints; intermediate narrator boxes retain their exact entered spelling.
3. Select a saved book chain, qiraah and rawi. Add intermediate route narrators and mark one or more route sources. Add or copy branches where the transmission diverges.
4. Load the current saved continuation from the rawi through the imam to the Companions. Review and confirm it; a saved text is not a claim of independent historical authentication.
5. Save, save-and-add-another, or copy a route. Copies receive new IDs and never overwrite their source.
6. Use a reviewed route in personal or additional-shaykh asaneed. Supply the personal chain ending at Ibn al-Jazari, review the full text, and explicitly confirm. This makes an independent complete-chain holding. Later library edits do not rewrite the copy or existing certificates.

The branch editor is also the visual preview. The text preview combines unsaved route nodes with the selected saved book chain. Each complete branch is rendered independently with an explicit `(ح)` switch. Adjacent shared author endpoints are not duplicated. No rawi-to-imam connection is invented: the saved continuation is offered for explicit review and may be corrected.

## Storage and permissions

- `builder_people`: stable identities, exact genitive names, optional display names, Arabic-normalized duplicate keys.
- `builder_books`: stable book IDs and author foreign keys.
- `builder_chains`: book chains and routes, explicit parent references, qari/rawi catalog keys, reviewed continuation, revision and stable numeric artwork code.
- `builder_nodes`: narrator foreign keys ordered by branch and position, with independent route-source roles.
- Active teachers manage their own library; active admins can administer authorized records. Students and anonymous clients have no access. Shared narrator suggestions contain only existing shared section text; private holdings are not used as autocomplete sources.
- `save_builder_chain` replaces nodes atomically and rejects stale revisions. `attach_builder_route` creates the holding and any additional-shaykh route/profile association in one transaction, with retry protection.
- The certificate-page issuer selector is never consulted. The additional-shaykh ID is passed explicitly; account inspection respects its edit/read-only mode.

Records are archived with confirmation. Referenced narrators and book sanads cannot be archived through the UI. No hard-delete action is exposed. Existing printed snapshots are untouched. Full backups include all four structured tables; restore imports parents first and advances the artwork sequence safely.

## Verification

- `tests/book-builder.test.ts`: ordered branches, multiple highlighted route sources, author deduplication, Arabic search and nonmutating preview.
- `database/book-builder-tests.sql`: transactional hosted tests for chain save, branch retention, stale edit rejection, atomic failure rollback, private-account isolation, student/anonymous denial, personal and additional-shaykh attachments, retry idempotency and full backup coverage. All fixtures are rolled back.
- Production build includes Next/TypeScript compilation. Browser verification uses a clearly named temporary book and never creates or publishes a certificate.

## Practical boundaries

The builder does not authenticate historical chains. Names remain editable, and the explicit continuation review is required before attachment. It does not migrate legacy unstructured chains automatically or silently reinterpret their branches. Existing manual editors remain usable. Per-request limits prevent oversized submissions (up to 30 branches and 499 intermediate names per branch); ordinary routes do not require fixed-length chains.
