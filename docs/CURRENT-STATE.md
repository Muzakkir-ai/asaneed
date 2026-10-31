# Current Asaneed state

Updated **30 October 2026 (Asia/Riyadh)**. Read together with root `AGENTS.md`. This document supersedes older progress reports where they conflict with the newer behavior described here; inspect the implementation when in doubt.

## Where we are now

Asaneed is running independently on Next.js/Vercel with Supabase authentication and database storage. The original Zite application remains unchanged. The active development objective is improving the migrated application in place, especially authentic certificate rendering, usable account/shaykh relationships and reusable books/طرق entry.

Latest verified application release before this documentation handoff:

- Commit `30f1945bf93879f06066ad233a148cdce36ed6c5`.
- Production deployment READY at https://asaneed.vercel.app.
- Change: themed Arabic narrator autocomplete, including matching the suggestion list to its input width.

There is no unfinished code task from the last request. Suggested follow-ups and known verification gaps are in `NEXT-STEPS.md`; they are not automatically authorized new work.

## Inline route editing — 30 October 2026

- In the saved-route list, a pencil expands the existing route editor directly inside that route/riwayah card, below its controls. Only one route editor is displayed; the selected pencil exposes its expanded state and can close it. New/copy forms remain in the separate creation area. Save and library APIs are unchanged. Production build checked; authenticated visual browser verification not claimed.

## Shatibiyyah author-boundary correction — 30 October 2026

- The initial importer incorrectly selected صهر الشاطبي by matching the word الشاطبي within his affiliation. Corrected the book author reference to the existing person إِمَامِ القُرَّاءِ أَبِي مُحَمَّدٍ القَاسِـمِ بنِ فِيرُّهْ الشَّاطِبِيِّ. صهر الشاطبي remains a distinct narrator before the author in the book sanad; no person was renamed or merged.
- A backed-up, authenticated RPC transaction moved the boundary for the parent and 14 unconfirmed routes, preserving their IDs, full ordered person/source-role sequences and continuation text. A before/after equality assertion passed in both rollback and committed runs. No copied holdings were present. Draft revision counters were advanced normally.
- The importer now requires the explicit القاسم / فيره / الشاطبي identity and rejects ambiguous/missing authors. A regression fixture includes صهر الشاطبي before the actual author; import and builder tests passed. This correction is not scholarly approval of the remaining drafts.

## Separate Shatibiyyah and Durrah import — 30 October 2026

- User authorized separate العشر الصغرى books. Created الشاطبية with 14 route entries across 7 qiraat, and الدرة with 6 across 3 qiraat. Each has a book sanad and reusable narrator IDs. Both books remain separate from the existing المصباح library.
- Import used the existing shared CHAIN sections and the saved Ibn al-Jazari → al-Dani text. Shatibiyyah's common chain is split at its explicitly named author. Al-Durrah's author is Ibn al-Jazari himself; the preview avoids repeating that junction after the personal prefix. Ishaq retains two explicitly stated initial-teacher paths; Idris retains both al-Qati‘i/al-Mutawwi‘i paths and both source roles. Branch prose from the rawi onward remains in the preserved continuation.
- **All 20 imported routes are unconfirmed review drafts.** Upper/branch levels remain unclassified. These entries are organization of the user's stored text, not historical verification. The saved-route picker shows unconfirmed entries with a review label, disabled until reviewed through the library pencil editor. No shaykh holdings or certificates were created by this import.
- Import ran under authenticated admin RLS/RPC scope after a private backup, with source-body hash checks, an advisory lock, exact normalized-name reuse and no updates to existing books/person names/chains. Private import provenance stores source IDs/hashes and book IDs. Dry-run rollback and a second rollback-only idempotency run passed; live counts verified 14/6, 7/3 qiraat, and two branches for Ishaq/Idris. Certificate/sanad fingerprints remained unchanged. Source exports and import SQL stay outside the public repository.
- Validation: strict import-planning/branch tests, builder/prefix tests and production build passed. A transient Turbopack cache failure was resolved by moving only the generated cache and rebuilding. No authenticated browser review or scholarly approval is claimed.

## Book / upper / branch methodology — 30 October 2026

- Shared texts are collapsed under **النصوص المشتركة — إعدادات متقدمة**. CHAIN lookup keys retain their persisted values but display Arabic reading/riwayah labels. Administrator pencil editing and version history remain available; no source text was deleted or renamed.
- Additional-shaykh reading dialogs offer the saved book/route picker first, filtered to that qari/rawi and carrying the explicit additional-shaykh target. Author/source names and complete text load from the chosen route; old manual route/font-oriented fields are collapsed under advanced settings. This works for newly reviewed structured Sughra entries as well as Kubra entries; existing legacy Sughra texts were not automatically parsed or converted.
- Additive metadata distinguishes book, upper route, branch route and optional reading scope (Sughra/Kubra/unclassified). Each source narrator occurrence may be marked upper or branch; the same person may have different roles in different chains/branches. Existing source flags retain an unclassified level until reviewed. Optional route names default to names of explicitly marked source narrators; no historical level is inferred from ordering or spelling.
- Administration → Books/routes → Manage narrators shows the selected stable person's book/route memberships, reading scope and source roles, including membership through a book author or book sanad. Derived text-directory identities are not silently merged with builder person IDs.
- Migrations `20261030130111_route_hierarchy.sql` and `20261030131010_route_hierarchy_backup_compat.sql` were approved/applied. Affected tables and the previous save function were backed up privately. Original chain fields and narrator nodes compared unchanged against that backup. Authenticated invoker/RLS boundaries, revision checks and finalized snapshots remain intact. Backup restore defaults absent hierarchy keys for older exports; existing builder overwrite semantics are still conflict-do-nothing.
- Validation: production build, TypeScript and hierarchy/prefix/builder/narrator/route-source tests passed. Hosted rollback-only SQL passed for per-occurrence levels, old-client metadata preservation, invalid-level atomic rollback, old-format backup restore and existing ownership/role/attachment tests. Temporary jsdom mocked-request checks covered Sughra selection for an additional shaykh, automatic name reuse, complete prefix composition, collapsed manual/shared settings, Arabic labels and reopening saved role values. No genuine holding/certificate was created. Browser/mobile/physical-print coverage is not claimed. Security advisors retain the previously documented notices only.

## Saved route selection and al-Ubaydi completion — 30 October 2026

- Selecting a saved book or book sanad shows its saved طرق first. Existing book sanads/routes open for editing through pencil controls; adding a book, book sanad or route uses explicit add actions. Choosing a route opens the independent-copy review panel, without opening its editor.
- Personal prefixes may reach either إبراهيم العبيدي or ابن الجزري. The authenticated library exposes the existing shared `من إبراهيم العُبيدي إلى ابن الجزري — فرعا السند` section; one available continuation is reused, multiple continuations require selection, and unavailable/incomplete continuations block attachment with an explanatory message. The stored text, including both textual branches, is retained verbatim. Already complete Ibn al-Jazari prefixes do not receive the continuation again.
- Builder attachment and the ijazah saved-route picker use the same prefix resolver. Additional-shaykh profiles reuse the supplied personal chain. The attachment endpoint composes the chain server-side under existing RLS/target checks and rejects changed text when it differs from the reviewed preview supplied by the new client. Saving still requires explicit review; existing holdings and finalized certificates are not rewritten.
- Verification: production build, final TypeScript check, prefix/builder/narrator/standard-route-source suites passed. Prefix tests cover missing/ambiguous sources, invalid selection, duplicate-anchor rejection, branch preservation and full route assembly. A read-only test against the actual shared continuation passed. A temporary jsdom integration harness with mocked requests passed for personal and additional-shaykh targets: browse first, pencil editing, explicit blank add, complete preview, confirmation and target payload. No real holdings/certificates were created. Hosted authenticated browser/mobile/physical-print checks remain unperformed for this release.

## Intelligent narrator selection — development change (30 October 2026)

Released to production at commit `6d4a488d56aeedaf8ed0c9ac37f0d28d0bf1664b` (PR #1), deployment `dpl_4t4yEMsg88e7jnA8GK1B9hfM452r`, verified READY with `asaneed.vercel.app` assigned on 30 October 2026. The user explicitly requested production release. A cloud-browser smoke check reached the login page; authenticated narrator interactions remain unverified in this session.

- Book and route chain fields retain the selected `builder_people.id` through editing, copying, reordering and saving. Unresolved text requires an explicit saved-person selection or inline creation; chain save no longer creates people by matching text.
- All non-archived people returned by the authenticated, RLS-protected library remain searchable/selectable. Directed neighbors from saved active chains rank first, with `صلة مسجلة سابقًا — ملاحظة في سند`; other people show `لم يُعثر على صلة مسجلة`. These are observations, never historical verification. Chain references are retained and source titles appear in the indicator tooltip. Book-author boundaries are included; reverse edges are not inferred.
- Search covers stored genitive names and the optional display name/kunyah, normalizes Arabic tashkīl/alif/ya and Abu/Abi search forms, and offers a bounded all-people list with more results. A review panel suggests possible duplicates without merging identities. Inline new-person entry accepts a genitive name and optional familiar name/alias.
- Explicit same-name distinct people use an internal UUID suffix in `search_key`, retaining the existing `(owner_id, search_key)` uniqueness constraint. Original name/display text is unchanged. Editing preserves that discriminator. No schema migration or historical-data rewrite is needed.
- رجال الأسانيد remains a derived text directory, not a database person registry. Its extracted names supplement review candidates; choosing one does not assert identity or transmission and requires explicit creation/reuse review. No automatic migration or alias merging was performed. Multiple structured aliases and reviewed relationship evidence remain future work.
- Verification: production build and standalone narrator-selection/builder/route-source suites passed; final TypeScript check passed. Hosted rollback-only builder SQL passed, including same-name distinct identity/alias retention, personal/additional-shaykh attachment, stale revision rejection, atomic replacement, private-account isolation and student/anonymous denial. All fixtures and role changes rolled back. Security advisors showed only the previously documented notices.
- Browser verification remains outstanding: no browser executable was installed and Chromium download failed. A temporary local UI harness was removed. No claim is made for pointer/keyboard/mobile behavior in an authenticated deployed session, or full normal/additional-shaykh browser flows. No certificate was issued/finalized and no permanent database writes were made.

## Working functionality

### Independent accounts and administration

- Supabase login, Google sign-in and configured email confirmation/recovery delivery exist. Keep keys in their configured services/environment only.
- Account administration, personal issuer profiles, additional shaykhs, students and recipient-account links are distinct.
- Both administrators can manage authorized additional-shaykh profiles. Their personal issuance is distinguished from records they administer.
- Admin account inspection is read-only by default, with an explicit edit context. It is separate from the local certificate filter.
- Students can be linked to login accounts, including administrators who are also receiving ijazahs. Recipient links do not change issuer ownership.

### Certificates and workspace UI

- ألوان شهادات الروايات is collapsed by default; click its native disclosure heading to open/close the search, color controls and previews. Toggling keeps unsaved palette edits mounted. Production build checked; authenticated browser interaction not exercised in this release session.

- الطلاب والشهادات has a local issuer filter, search, collapsible advanced filters, counts/chips/reset and compact student-first results. The filter is not a global authorization scope.
- Native compact color pickers sit beside hex fields; real SVG heading previews use the same heading renderer as printing.
- Draft PDF preview does not publish a certificate. Finalization preserves content, settings, colors, numbering and artwork through snapshots.
- Arabic-Indic registration display uses year-first YYSS-RRNN numbering. Existing finalized identifiers are preserved.
- Printed certificates use actual artwork, separate certificate fonts and configurable palettes, gentle whole-page balancing and overflow protection.
- Shared students, Arabic vowel-insensitive search, loading/error/empty distinctions and responsive navigation are implemented. Further polishing can follow actual use.

### Received certificates versus personal asaneed

`شهاداتي` contains finalized received certificates. `أسانيدي` contains editable holdings used for subsequent issuance. A staff recipient can explicitly use a received certificate as the basis of a personal sanad. The system checks actual recipient ownership, proposes the direct teacher plus preserved transmission, and saves an independent reviewed copy with provenance. Publication alone does not automatically create a holding.

Future snapshots have a structured transmission field; older snapshots use cautious extraction and refuse incomplete/unsupported cases. See `RECEIVED-SANAD-FLOW.md`.

### Shared book and branched-route builder

One builder is available from:

- أسانيدي → الكتب والطرق.
- إدارة الأسانيد → الكتب والطرق.
- A saved additional-shaykh profile → إجازات القراءات → الكتب والطرق.

Stage 1 stores a book, author and one or more book sanads from Ibn al-Jazari. Stage 2 selects the existing qari/rawi catalog and stores route branches with reusable narrator references. Names are entered in the genitive form. Narrator insertion, removal, ordering, branch copying, route copying and save-and-add-another are implemented. New narrator identities are saved in batches rather than one request per name.

The library uses `builder_people`, `builder_books`, `builder_chains` and `builder_nodes`, with foreign keys, ordering, RLS and archival flags. `save_builder_chain` is atomic and revision-checked; `attach_builder_route` is atomic and protects against duplicate retries. Full backups include these tables. The builder does not independently authenticate historical transmission.

The current add-ijazah form now offers **اختيار طريق محفوظ** as its main route option. It reads the same library as administration. Selecting a route and supplying the personal prefix to Ibn al-Jazari loads the complete chain, qari/rawi, route code/name and emphasized people into the open form. **It does not save the ijazah until the user presses Save.** Manual route fields remain under collapsed **إدخال طريق يدوي / متقدم**. Typing a number in that manual section is not a library lookup.

Narrator and book-author suggestions now use `NarratorAutocomplete`: a themed Radix popover with Readex Pro, RTL, gold active selection, input-matched width, Arabic-normalized search, pointer selection, arrow keys, Enter, Escape and support for freely typing a new name. Native browser datalists were removed from these builder fields. Other native selects elsewhere in the app were not globally replaced by this change.

Details: `BOOK-TARIQ-BUILDER.md` and the original `BOOK-TARIQ-BUILDER-REQUIREMENTS.md`.

### Route-source typography and SVGs

- The user supplied route-source names for all twenty rawis. They are stored in `legacy/lib/standardRouteSources.json` and are display roles, not replacements for preserved chains.
- Idris has **two** marked route sources: al-Mutawwi‘i and al-Qati‘i. Preserve both branches and roles.
- Custom routes can mark more than one source. Drafts and new finalizations render صاحب الطريق in **Sakkal Kitab bold, primary color**, matching the other emphasized personal names. `routeSourceFont` is frozen for new snapshots; old finals without it keep the prior fallback.
- The actual Sakkal fonts' Tatweel Extension 1 feature is `ss16`. No tatweel characters were injected.
- Numbered artwork discovery, commit-pinned URLs and finalized artwork snapshots are implemented. Issuer folders use numeric codes, with `name.svg`, `line-02.svg`, `line-03.svg` and linked aspect-ratio scaling.
- The user's local artwork files must be committed/uploaded before refreshing the website. A local-only file is not available to production.

## Recent release landmarks

| GitHub commit | Result |
| --- | --- |
| `732eaa856e02898afb377edf176335de7ad2f2c1` | User-reviewed route sources for twenty rawis, including both Idris sources. |
| `30d7732e3f338696a0d35083dd1e81e934e0d060` | Shared two-stage book/route builder and protected library. |
| `4ffd7d3c40dc22e61f2205660fea4c22a8473e9d` | Save-state preservation and archived-library restore safeguards. |
| `3dc6dee40fc821930f226ae9bf1e8cab84e78013` | Batched narrator saving. |
| `0e41c27631fd735a99aefab32640e66a22e69bc4` | Saved library route picker in ijazah forms; Sakkal route-source names. |
| `8e570496c03e7b7f7ba6d75c2ef98a56021ada4a` | Themed editable narrator combobox. |
| `30f1945bf93879f06066ad233a148cdce36ed6c5` | Suggestion width matched to its name field. |

## Verification evidence and limits

- Production builds passed, including Next.js/TypeScript checking.
- Relevant standalone tests passed: builder branching/author deduplication, Arabic search, input preservation and all twenty rawi role mappings.
- Hosted rollback-only SQL tests passed for builder save, branch retention, stale edit rejection, failed replacement rollback, personal/additional-shaykh attachment, retry idempotency, private-account isolation, student/anonymous denial and backup key coverage.
- Signed-in browser tests exercised creating/reselecting a temporary book, multiple book sanads, narrator reuse, insertion/reordering/removal, branch/route copying, save-and-add-another and batch narrator creation. Fixtures were removed without changing real library records.
- Saved-route selection was tested with a temporary route: the form received the reading and complete chain without saving a new holding or certificate. The temporary library rows were removed.
- Actual draft print DOM reported Sakkal Kitab, weight 700 and the current primary color for the route sources, including ‘Ubayd ibn al-Sabbah in Hafs.
- Autocomplete pointer and keyboard selection worked; Escape left the editor open. Settled desktop input/menu widths were both 820 px. At a 390 px mobile viewport, the menu stayed between x=30 and x=360, with no page-width overflow. Temporary viewport overrides were reset.
- Before/after comparison during the builder rollout found zero changed certificate or sanad rows. The last certificate count checked was **39**; this is historical evidence, not a fixed invariant for future work.
- No real certificate was finalized, issued or imported solely to test these changes. The received-certificate import/save flow still needs a genuine user-approved end-to-end case. Physical print/PDF and diverse historical finalized snapshots are not exhaustively validated by the latest UI checks.
- The last database security-advisor check showed only pre-existing private-table deny-all policy INFO entries and the existing leaked-password-protection warning. Do not claim the entire application has had a comprehensive security audit.

## Documentation cautions

`TASK-STATUS.md`, `WORKSPACE-MIGRATION.md` and other dated reports remain useful historical context. Some earlier text predates admin visibility corrections, the builder, the saved-route picker or the new source font. Prefer this handoff and verified current behavior. Never use a historical record count or old user name as a reason to delete or reassign live data.

### Simplified route-source entry (30 October 2026)

Removed upper/branch name inputs and per-person level selectors at user request. The صاحب الطريق checkbox remains; existing stored metadata is preserved when editing. Person membership shows صاحب الطريق without level labels. Missing narrator selection now identifies the typed name and the selection/creation action; empty rows explain how to fill or delete them. Production build verified; authenticated browser verification remains outstanding.

### Connected narrators first on opening (30 October 2026)

Narrator picker opening now ignores the current field text for its initial list, so recorded adjacent connections appear first. Typing applies all-person search as before. Groups distinguish connected suggestions from other saved names; removed repetitive no-connection wording and internal ID display. Stable IDs and directed saved-chain evidence remain unchanged; no inferred identity merges or new historical connections. Narrator ranking tests and production build checked; authenticated browser verification remains outstanding.

### Requested Ali ibn Shuja identity merge (30 October 2026)

User explicitly identified the short and «المعروف بـ صهر الشاطبي» names as the same person. Backed up the full application privately, tested the transaction with rollback, then repointed the single short-name builder node to the existing full-name identity under authenticated RLS. Preserved ordering, source roles and levels; incremented the affected chain revision and archived the now-unreferenced duplicate. Three nodes now share the surviving identity. Existing copies/certificates were not rewritten. No source deployment was needed for this data correction.

### Book-first certificate route choices (30 October 2026)

Certificate form groups saved custom routes by the book prefix of their saved label. Selecting المستنير shows its individual riwayah + route choices in the riwayah field, preserving each holding ID or additional-shaykh route number for issuance. Custom book choices select one explicit riwayah/route; the original Shatibiyyah/Durrah complete-reading option remains. Switching book or issuer clears the selection. Live saved mappings inspected; grouping/route parsing tests and production build pass. No certificate issued for testing; authenticated browser verification remains outstanding.

### Book-only custom route heading (30 October 2026)

Newly assembled custom headings use the book prefix only, dropping the saved label’s dash suffix. Explicitly identified kubra books المستنير and المصباح append وهي من طرق طيبة النشر; unknown books are not automatically classified as kubra. Updated holding and certificate previews consistently. SVG route selection can use a matching numbered book asset, whose artwork must contain the complete route wording. Existing saved route identifiers, sanads and finalized snapshots are unchanged. Route wording/artwork tests and production build checked; authenticated browser verification outstanding. Fonts catalog inspected: books 01/02 occupied; 03 available for المستنير.

### Heading versus ijazah wording correction

User clarified: heading contains only من طريق المستنير. Only the words substituted into كلمات الإجازة append وهي إحدى طرق طيبة النشر for the identified kubra books. Artwork is the route heading at svg/turuq/01/heading.svg with catalog label المستنير; it should contain only من طريق المستنير. Earlier book/03 and full-clause artwork instructions are superseded. Existing finalized snapshots remain unchanged.

### Certificate list label polish

List-only certificate summaries replace a dash before طريق with من: المستنير من طريق ابن الخشنام. Certificate headings, stored text and finalized snapshots are unchanged. Production build checked.

### Mustanir SVG upload repair

The uploaded filename was heading.svg.svg, skipped by exact-path discovery. Renamed the existing blob without changing SVG content to svg/turuq/01/heading.svg in fonts commit 4ca05d176e538091ea38c68e07758883c7ec02e3. Catalog label المستنير was already correct. Validated viewBox 95.98 x 28.35 and backed up/refreshed the asset-source catalog under authenticated RLS, retaining its nine existing assets and adding the route. No finalized snapshot changed. Full automated discovery fetch timed out; pinned SVG checked through GitHub tool instead.

### Preserved additional-shaykh draft wording fix

Root cause: getCurrentSanadForIssuance returned additional-shaykh preserved chains verbatim, bypassing new assembly wording. It now applies a narrow custom-route presentation correction to the marker and opening before كما أخذته, using that sanad’s own route metadata. The narrator-chain suffix is preserved byte-for-byte, and no stored sanad is rewritten. Finalized snapshots bypass this path. Missing opening boundary leaves preserved text unchanged. Tests cover heading/body separation, Arabic harakat, idempotence and unchanged chain suffix; build verified. Authenticated browser verification remains outstanding.

### Automatic route-book artwork catalog and punctuation

Each builder book now has a globally unique permanent artwork_number, allocated by a database sequence/trigger. المستنير retains 01; existing archived books retain reserved numbers. The builder and asset administration display svg/turuq/NN/heading.svg. Asset-source GET/refresh obtains catalog labels from authorized builder_books by number, so new route books need no manual svg/catalog.json entries. Upload SVG then use تحديث ملفات GitHub. The asset panel refresh now updates its displayed directory too. Internal route codes remain stored, but no longer appear in ordinary builder/picker/certificate choices; old manual fields remain under advanced settings. Wording now appends «، وهي من طرق طيبة النشر».

Backed up builder books before additive migrations; tested authenticated allocation, attempted duplicate folder override, immutable numbering, rename/archive stability in a rollback transaction. Old privileged backup restore may retain recorded numbers; normal authenticated book creation always allocates its own. Generated database types inspected. Wording/artwork tests and production build passed; authenticated browser check outstanding.

### Automatic fonts repository update checks

An authenticated administrator in the normal workspace now checks the linked asset repository on opening, every visible minute, and tab focus/visibility return. The assetSource checkForUpdates action verifies the current Git commit, skips discovery/database writes when unchanged, and uses existing admin authorization for changed-revision discovery/save. The client replaces current assets only after successful validation. It skips inspection, hidden tabs and overlapping requests; errors keep the last working revision. This is open-website polling, not a GitHub webhook or background job when all admin tabs are closed. Finalized artwork snapshots remain pinned. Production build verified; authenticated browser verification outstanding.

### GitHub-triggered artwork refresh replaces polling

Removed admin minute/focus polling at user request. The fonts repository workflow refresh-asaneed-artwork.yml obtains a short-lived GitHub OIDC token and POSTs /api/artwork-refresh. Vercel verifies RS256 against GitHub JWKS, issuer/audience/lifetime and exact repository/main/workflow/event claims, fetches current main artwork, then calls a narrowly scoped capability-guarded database function. No service-role key or GitHub-held shared secret is used. The production capability is encrypted in Vercel; only its hash is in a deny-all private table. RPC can update only the existing fixed fonts asset-source catalog, mapping book labels by artwork number. Validation errors preserve the previous catalog; repeated revisions are no-ops. Finalized snapshots stay pinned. Signature/claim denial tests, anonymous bad-capability rollback test and build pass.

Fixed the remaining إحدى text: preserved sanad metadata still held the full path name, but the stored opening was already shortened to the book name. Matching now accepts both representations and replaces the prior clause once, preserving everything from كما أخذته onward. Regression covers the exact shortened-book + prior clause case.

GitHub live workflow verification exposed the newer ID-qualified OIDC subject format (owner@ID/repo@ID). Verifier now accepts that exact subject and the legacy subject, while requiring immutable repository ID 1420583732, repository name, main ref and workflow path. Regression tests cover both subject formats and wrong repository-ID denial.

Live verification: fonts GitHub Actions run 41110410974 attempt 2 completed successfully against production Vercel deployment 0381b91127099316e9f6c22afbdd8084b08b0159. Anonymous unsigned HTTP refresh returns 401. All three live saved Mustanir sanads tested locally produce the corrected clause without إحدى while preserving the transmission suffix. No real certificate was finalized for testing.

### Homepage login and language hover (31 October 2026)

Added a prominent localized /login link next to the homepage language controls. Excluded language buttons from the general dark hover rule, preserving their gold selected state and header hover styling. Responsive wrapping retained. Production build checked.

### Homepage button text clarification (31 October 2026)

User clarified the dark lettering itself was unwanted. Header login and selected/hovered language controls now use white lettering on teal with gold borders/selection outlines. Future-date report investigated: no future completion_date rows were found; latest draft is saved as 2026-02-07. No dates changed without identifying the intended record/date.
