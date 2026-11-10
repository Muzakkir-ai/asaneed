## Mutūn publication audit — 10 November 2026

A shared introduction or conclusion moved back to draft could still enter a certificate when the current administrator could read its record. Certificate draft creation, preview and approval now treat unpublished shared templates as unavailable. Personal templates and legacy shared templates without a status remain eligible. Issued snapshots are unaffected. No migration is required.

Reproduce with a synthetic certificate draft linked to a published shared introduction. Move that introduction back to draft and reopen the certificate preview as an administrator. The previous resolver incorporated the unpublished text. The branch reports the template as unavailable until it is published again or replaced on the holding.

Synthetic coverage includes request approval and rejection, ownership, normalized duplicates, atomic rollback, review replay, template changes, personal overrides and frozen snapshots. Simultaneous database sessions and authenticated browser coverage remain open. The personal editor currently offers its general template list regardless of the catalog's saved template associations.

## Certificate PDF tanseeq, adaptive footer and per-certificate draft save — 9 November 2026

The landscape A4 PDF viewer now lets issuers edit matn SVG/heading measurements, spacing between introduction, wording, sanad and khatima, line and paragraph spacing, and move the khatima up/down within the document flow. For non-matn ijazahs the conclusion offset is a separate certificate typography setting. A negative khatima shift triggers an overlap check before saving, printing or final approval. The body remains in its original vertical position; on short certificates only the pinned mujeez footer gently rises by at most 10 mm, always leaving at least 12 mm between body and footer. Print and preview use the same measurement logic.

**حفظ تنسيق هذه الشهادة** writes only the authenticated issuer's *draft* PDF settings to the existing `certificates.draft.certificatePrintStyle` JSON object, preserving other draft keys and leaving all shared sanad templates and immutable published snapshots unchanged. **استعادة تنسيق النظام** writes a certificate-only system-default marker and reloads the source document with default local typography and matn heading; it does not modify shared matn templates or create a finalized certificate. Final approval continues to freeze the selected client settings into the immutable issued snapshot.

Tests: `npm run typecheck` and `npm run test:certificate-layout` in the certificate PDF CI workflow. These tests validate the footer's scale independence, 10 mm cap, minimum gap, stable remeasurement, new matn schema bounds, and compile-time API/schema compatibility. Authenticated visual print review is still needed for real user templates. No database migration was needed.

## Mixed-rank incoming sanad arrows — 9 November 2026

In historical and comparative narrator graphs, two genuine transmissions entering the same narrator used to render as separate arrows if one teacher's connection skipped a diagram rank. The coordinated planner now reserves **all incoming links** for any destination with a skipped-rank parent, before allocating ordinary shared buses. Feeder lines from earlier rows bypass intervening narrator cards through safe outer corridors, meet on one horizontal bus directly above their common student, and enter through exactly one final arrow. This is a presentation-only change: no narrator identity, saved edge, route membership, certificate, or sanad text was edited. Other complete fan-outs, fan-ins, crossings, and the legacy rollback toggle remain available.

Validation: GitHub Chromium **Sanad graph regression** run `42524071988` passed, including a two-row-to-one narrator fixture resembling the reported al-Sa'igh al-Misri screenshot, a three-rank staggered fan-in fixture, and existing full-edge and obstacle checks. A Vercel preview for the routing-code commit `9a6209f` built successfully. The actual authenticated narrator paths in the screenshot were not browser-tested; production visual confirmation remains necessary.

## Coordinated sanad routing: preserve safe shared buses — 8 November 2026

In certain dense historical narrator diagrams, one skipped-rank edge colliding with a card made the complete coordinated plan invalid, silently switching the whole graph back to the older independently routed lines. The planner now tries a card-clear outer bypass for the *single* problematic long edge without dismantling otherwise safe shared fan-in and fan-out buses. Shared complete bipartite buses are permitted only when they cover all adjacent-rank incoming and outgoing relationships of their member narrators; incomplete graphs prioritize complete incoming merges into each child to avoid multiple confusing arrows. All original edge IDs, route membership and sanad text remain unchanged. The emergency routing switch is retained.

Validation: GitHub Sanad graph regression workflow `42522533103` passed, including new Chromium fixtures for partial bicliques and skipped-rank detours at desktop and mobile widths; Vercel preview `dpl_BMDt9axXQYwGQEfQZt1TNienYtgi` is READY. Actual production authenticated sanad paths from the reported screenshots were not inspected using browser credentials; user visual review is still required. No database migration.

## Certificate footer clearance correction — 8 November 2026

The first bottom-anchored footer release placed the date/registration baseline too close to the certificate's inner ornamental border (user screenshot). Corrected the bottom content inset from **8 mm to 16 mm** in both live preview and native print/PDF rules. This lifts the entire 30 mm mujeez/signing block by 8 mm while retaining its bottom anchor, 6 mm content separation, existing QR layout and limited historical balancing. Never let footer text or issuer artwork touch the ornamental border; keep overflow protection active. No certificate or sanad data changed.

Validation: pending Vercel preview/production build; full authenticated certificate print inspection remains necessary.

## Certificate issuer footer anchored to bottom safe area — 8 November 2026

The landscape A4 certificate reserves a 30 mm bottom signing area for the mujeez, signature/date, and registration information, with a separate 6 mm gap before the actual footer contents. The footer rests approximately 8 mm above the paper bottom (about 6 mm inward from the ornamental border); older QR-mode certificates reserve 36 mm for the QR. Short ijazah texts no longer pull the footer upward through auto-centering. For historical unfixed headers, restrained composition balancing may raise the footer at most 4 mm and never lower it. Preview and native print use the same bottom padding. Certificate data, typography settings, and snapshot content remain unchanged.

Validation: Vercel preview build for commit `344bcaa7` became READY (deployment `dpl_9xhtd6GSu8PnJAfEVQ5p2QcnjnaE`). Pinned-footer unit regression assertions were added; no authenticated visual print preview, Safari test, or physical printer test was performed. Production release should be verified separately.

## Shared sanad diagrams — 6 November 2026

The sanad screens use one RTL narrator card and path renderer for personal and per-reading sanads, book and route editors, saved route previews and the additional-shaykh diagram. The reading editor loads the selected shaykh reading record or the shared profile source. The personal editor reads the holding or shared profile source. The books/routes builder and linked previews use structured book and route segments from the builder library. Saved text remains available for comparison.

Numbering starts at the first visible narrator on each explicit path. A common narrator shows every applicable position in the all-path view. Parallel lanes have individual downward arrows into and out of their cards on wide screens. Narrow screens stack labeled lanes. While drafting a parallel shaykh, choosing the shared meeting narrator displays the branch inline. Complex overlapping choices that cannot be drawn without implying extra routes appear as separate paths. Ambiguous legacy prose stays available for review.

Chromium fixtures matched card and arrow geometry across adapters at desktop and mobile widths, and exercised path selection, collapse, editing and draft parallel arrows. The sanad and personal-sanad suites pass. The change needs no migration or updates to saved records.

## Library-linked Kubrā and additional personal sanads — 6 November 2026

Additional shaykh profiles can select the full Ṣughrā, individual Ṣughrā riwāyāt and library-linked Kubrā. Issuer 01 defaults to the Kubrā link, with an explicit profile setting to change it. Confirmed, active Kubrā library routes are resolved at read and issuance time using the shaykh’s saved personal prefix. Manually attached complete routes remain available when there is no matching catalog route.

Named alternative personal sanads are separate records for a riwāyah. Issuance can select one explicitly for Ṣughrā or a library-linked Kubrā route. The API validates that the selected alternative belongs to the shaykh and riwāyah. Tests exercise automatic discovery of a newly confirmed route, the default shared prefix, and alternative selection in both groups. The production profile was inspected read-only. Issuer 01 has 20 Ṣughrā riwāyāt and a shared prefix to Ibn al-Jazarī.

## Shared personal sanad for additional shaykhs — 6 November 2026

A shaykh with any configured qiraat can enable one personal sanad for all their standard riwayat. Issuance uses that sanad automatically. Numbered routes use their own complete chains. Turning the setting off restores individual-riwayah selection. Standard cards display the book pair from the reading catalog. Advanced book and route management opens on demand from the readings settings.

The personal-sanad suite verifies partial coverage, shared issuance, numbered routes and restoration of separate sanads. Production build passed. Previous live release: 8180a12 (PR #33).

## View sanad first, edit explicitly — 6 November 2026

Existing personal sanads open in viewing mode, with narrator cards, arrows, ranks and All/individual-route selection. «تعديل السند» reveals narrator pencils, building instructions, meeting-point controls, preparation/adoption and add/reorder tools; «عرض السند» returns to the viewing layout. Existing source prose without saved narrator structure is shown verbatim instead of a fake empty card. Blank new drafts still start in editing mode.

Shared profile mode/checkbox/save controls and individual-riwayah reuse/route/save controls follow the same editing state. The riwayah page frame hides editing help/cancel actions in its viewing state. Simply opening a prepared source does not mark it pending; entering edit mode retains the existing review/confirmation guard. View switches preserve the narrator draft and active card state; they neither adopt nor save it. Source wording, identities and certificate data are unchanged.

Validation: personal-sanad/API/React/navigation suites and typecheck pass. Chromium desktop and 320/390px checks use PersonalSanadInput itself and verify clean default view, explicit building/pencil controls, hiding an open editor, preserving active edits and all existing route/rank/mobile checks. Physical Safari remains unverified. Previous release PR #32: 6aeb68c, deployment dpl_2afV1HrwcGxQ5gJAwZTgfp3zh2GV READY. Production build passes; this release is tracked by its PR/deployment commit.

## Highest rank only in All view — 6 November 2026

«عرض الكل» now shows one rank per narrator: the minimum narrator count along its saved paths back to the meeting point (the highest/shortest sanad). Peer letters in this view group narrators by those displayed highest ranks. Selecting an individual route still shows its actual distance, including longer routes. Full branch visibility, the default All view and the full-width All button below individual routes remain. No source, identity, database or certificate data changes are involved.

Helper and mobile-browser regression checks cover the single highest badge, peer letters, longer-route rank and highest-rank restoration. Previous release PR #31: 31f3eaa, deployment dpl_4MiDF1JqvR3bS5iP4vrEYmgErZgz READY. This release is tracked by its PR/deployment commit.

## Narrator ranks counted from the meeting point — 6 November 2026

Resolved personal-sanad diagrams number the meeting-point narrator as 1 and count back along each transmission path. Different narrator identities at the same rank share the numeral and receive stable Arabic letter suffixes (أ، ب، ج، د…). The same badges appear in shared and individual editors; identity-backed ordered chains also use this renderer while retaining their add/reorder controls. Source-order editor positions remain separate from scholarly ranks.

All view retains each actual rank for a narrator whose paths to the junction have different lengths. A selected route shows only its own rank, preserving the same peer letters used in All view. No shortest/longest distance is silently chosen. Parallel routes of equal length receive distinct selector labels. «عرض الكل» occupies its own full-width row beneath the individual route buttons. This is display-only; original wording, saved identities, branch edges and certificate data are unchanged.

Validation: helper tests cover parallel teachers, junction rank 1, multiple route distances, selected-route rank and source immutability. Personal-sanad/API/React/navigation suites and typecheck pass. Chromium desktop and 320/390px checks verify actual badge labels, compact joint-teacher cards, route switching and mobile bounds. Production build passes. Physical Safari remains unverified. Previous release PR #30: a15d482, deployment dpl_Gd1vswwqbUzDQ7mqBvy4Zx6cX1LW READY. This release is tracked by its PR/deployment commit.

## Optional shared Sughra editor and reusable per-riwayah sanads — 6 November 2026

The first-page shared Sughra editor appears only when all ten original qiraat are covered. Profiles without that coverage receive no missing-coverage prompt or replacement notice. Server-side shared-mode resolution and save validation use the same coverage rule; a historical flag alone cannot block independent riwayah editing or override its saved source. Full-coverage shared issuance and independent numbered routes retain their existing behavior.

An original-riwayah editor can explicitly reuse another complete original personal sanad from the same selected shaykh, retaining its narrator IDs, source wording, preparation/review state and junction. The meeting selector restores a saved identity-backed endpoint only when its exact reviewed continuation matches. The copy is reviewed and saved as that target riwayah; the source is untouched and route/book metadata is not copied. Numbered, route-linked, incomplete and current-riwayah sources are excluded from this prefix chooser. «إنشاء سند جديد» opens a fresh narrator/meeting-point draft. No bulk overwrite or automatic copy occurs.

The shared and individual editors now use one saved-text preparation action inside PersonalSanadInput. Prepared narrator cards start compact and open individually via the pencil. Simple prepared chains share the graph/card/arrow renderer; resolved branches retain All/single-route views, and ambiguous source structures retain literal review. Joint-teacher graph tests verify parallel transmission rather than consecutive teacher edges. A separately requested source correction was privately backed up and verified to change only its joint-teacher clause; saved metadata, the preceding teacher and historical certificates were retained.

Validation: personal-sanad/helper/API/React/navigation suites and typecheck pass. Tests cover coverage gating, stale flags, shared issuance, independent save/numbered routes, explicit prefix reuse and new drafts, source immutability and joint teachers. Chromium desktop and 320/390px checks use the actual prepared-person editor and verify compact cards, one-card editing, branch views and mobile bounds. Production build passes. Physical Safari and authenticated hosted issuance remain unverified. Previous release PR #29: 28b0e51, deployment dpl_3SWYjmpRVQDWXPBGANV5vvbhY4be READY. This release is tracked by its PR/deployment commit.

## All-sanad default and isolated route views — 6 November 2026

Prepared branch review opens with «عرض الكل» selected. Every node and branch is shown equally, with no individual route focused. Selecting the shorter or an alternate sanad now renders only that path's narrators in transmission order, with consecutive arrows and numbering. Other branch cards/connectors and ح transition badges are absent in the single-path view. «عرض الكل» restores every branch and its connectors. The personal sanad remains visible through its meeting point without any tail-reveal step.

This is display state only: switching views does not adopt a route, discard source occurrences or alter confirmation/saving. An explicit shared-node name edit still updates its source occurrences; adoption preserves all source branches even when one path is displayed. No database or certificate data changes are required.

Validation covers neutral default, six/seven/eight-node path selection, exact shortest-path order, connector counts, full-view restoration and adoption preserving hidden branches. Local personal-sanad/helper/API/React suites, typecheck, production build and Chromium desktop/320/390px checks pass. Physical Safari remains unverified. Previous release PR #28: c64d428, deployment dpl_DD38gTJSYm8HwBHDnprGDYWGp7Ey READY. This release is tracked by its PR/deployment commit.

## Flexible name search, narrator creation and full mobile sanad — 6 November 2026

Corrected the reviewed-alias lookup introduced in PR #27: the PostgREST contains filter now receives a serialized JSONB array, rather than a JavaScript array that the client encodes as a PostgreSQL array literal. New narrator creation no longer fails with invalid JSON on this lookup; existing reviewed aliases still reuse a single identity and ambiguous matches are denied. No database migration or user source mutation is involved in this correction.

Arabic search now requires every query word in any order, ignoring tashkeel, tatweel and supported letter variants. The same matching serves narrator pickers, saved aliases, suggestions, meeting points, narrator directory/management and existing shared Arabic-search consumers. Original spellings and exact identity matching remain unchanged.

Duplicate-review suggestions now form a bounded, scrollable list. Long names wrap inside the narrator card, and internal UUID fragments are removed from button labels. Prepared branch diagrams show every personal-sanad node through its meeting point immediately; the common-tail reveal/collapse button is removed. Route highlighting and connecting arrows remain.

Validation: a regression test exercises the real Supabase/PostgREST client serialization through the actual authenticated route with mocked transport, covering empty lookup/new-person insertion, existing-alias reuse and ambiguity denial. Personal-sanad suites and typecheck pass. Chromium desktop and 320/390px checks cover full nodes/arrows, no reveal step, bounded long duplicate choices and existing-person selection. Physical Safari and authenticated hosted creation remain unverified. Prior release PR #27: production 0054bfe, deployment dpl_8CFP5kW2btfMYhacgBoy1vasnGPx READY. This correction is tracked by its PR/deployment commit.

## Approved ح branch view and reviewed narrator spellings — 6 November 2026

Prepared personal/shared-sanad review now shows explicitly resolved ح branches as connected narrator cards. Route buttons highlight the shortest sanad or alternate paths; saved repeated identities meet at one node, with the common lower tail expandable. Mobile cards retain readable widths. Ambiguous branch origins, unlinked repeated names, cycles and dangling branches retain the literal source editor. Displaying or selecting a path does not rewrite the source. An explicit shared-node edit updates all its occurrences; review/adoption retains the full connecting wording and lower sanad, and page saving remains explicit.

builder_people now has a bounded aliases JSON array with a GIN index (migration 20261105213349_reviewed_narrator_aliases). Search, prepared-name matching and authenticated person creation reuse reviewed alternate spellings. Ambiguous alias matches are rejected. A requested spelling consolidation was privately backed up: only one matching saved narrator existed, so alternate source spellings were attached to that stable identity and its short display label updated. The similar brother record, source prose, chain references and finalized snapshots were retained. No user sanad was confirmed during implementation.

Validation: local source/helper/React/API suites pass, including stable-ID convergence, three routes, source round-trip, branch-wide explicit edits, cycle/ambiguity fallback and confirmation guards. Chromium desktop and 320/390px checks cover arrows, route highlighting, common-tail expansion and mobile card bounds. A private live-source check resolves three paths without changing the source. Production build/typecheck pass. Physical Safari and authenticated hosted confirmation remain unverified. Previous release: PR #26, main b5c5bff, deployment dpl_CzFm4jzeCpf4YnNg9F6NfTj9PFnh READY. This release is tracked by its GitHub PR/Vercel commit.

## One shared Sughra prefix, first-page narrator editor and mobile branches — 5 November 2026

The shaykh detail page contains one shared personal-sanad editor using the same numbered narrator/pencil cards as Kutub/Turuq. The old general-prose disclosure, duplicate source textarea and junction selectors are removed from profile/qiraat editing. A single saveShared action updates only the selected issuer's shared prefix, junction, narrator identities and mode; ordinary profile saves preserve these fields. Shared mode applies the prefix to every selected original Sughra riwayah while preserving its per-riwayah metadata. Numbered routes keep their own sources. Stored individual sources are retained and become available again if shared mode is switched off. Original-riwayah cards identify the shared source instead of opening redundant per-riwayah editors; server-side saves to those originals are blocked while shared mode is on.

The requested profile's 20 original entries were verified to have exactly the same personal prefix and no unified source overrides. Its original profile/37 reading records are privately backed up. Only shared mode/preparation/review markers were added to the issuer; source/profile content and all reading records remain unchanged. The previous prefix is prepared into 14 boxes, with both explicit branch transitions preserved verbatim, awaiting the user's confirmation. No real person was created, no sanad confirmed and no certificate issued to test this flow.

Opt-in preparation recognizes the prior explicit «وأخذ … أيضًا عن» and «وهو تلقى ذلك عن أخيه» connectors, retaining them literally rather than inferring new links. Personal and shared narrator entry reuse ChainNarratorRow; prepared source layouts retain locked positions and exact branch connectors. Mobile connected branches now stack with branch labels, and card headers wrap controls while keeping names readable.

Validation: live source round-trip is exact and hosted backup comparison shows no source/reading-record changes. Local API tests cover shared-original selection, independent numbered routes, stale-reference exclusion, retained per-riwayah metadata, mode reversal, ordinary profile preservation, individual-save denial and role denial. Existing narrator/API/React suites pass. Chromium checks at 320/390px verify one mobile column and bounded name height in real connected-branch cards, alongside existing theme/touch/keyboard checks. Typecheck/production build pass. Authenticated hosted/physical-device confirmation remains unverified. No finalized snapshots were rewritten.

## Explicit preparation of previous sanad prose for narrator review — 5 November 2026

An opt-in per-record prepareNarratorBoxes marker returns a preparedPeople review layout from the record's current saved text. Only the requested target profile's reading records were staged. Its four original-riwayah cards are covered; two previously inherited fallback prefixes were copied verbatim into explicit per-riwayah records. Existing route-specific sources remain separate. No records were confirmed by the agent. A private database backup retains the original issuer/records, and hosted verification confirms original source payloads and issuer fields were unchanged outside the two review markers. Historical certificate/snapshot tables were not modified.

The bounded preparation helper recognizes the prior source prefix through al-Ubaydi, retains each source connector, repeated occurrence and the explicit joint-teacher clause, and keeps the entire lower sanad verbatim as a suffix. It is never invoked for arbitrary unflagged pasted prose. Unsupported structures return no prepared layout. No inferred narrator edges or private dataset are committed to source control.

The narrator editor opens prepared names in individual boxes and blocks saving until explicit review/adoption. Confirmation reuses unique exact saved identities or creates the names through the existing authenticated person endpoint. Repeated occurrences share an identity but stay separate source occurrences. Ambiguous existing identities require selection. Prepared positions cannot be inserted/reordered/removed as a linear chain; name edits keep the original connectors. The full saved-text preview remains available. Applying does not save the sanad until the page save action; successful save marks that record reviewed and reopens with saved identities and the same source layout.

Validation: live sources round-trip exactly through preparation, including their joint/repeated clauses; all staged records remain unconfirmed. Local API/React/helper tests cover no writes on open, pending-save guard, explicit confirmation/name creation, duplicate identity reuse, same-record persistence, source retention and role denial. Personal-sanad and navigation suites, typecheck and production build pass. Authenticated hosted and physical-mobile confirmation were not performed; no real confirmation, certificate issuance or account mutation was used for testing. Released in PR #25, production b91dad3, deployment dpl_43MzbhmpGLFPYHXazEeZh2LWoqA4 verified READY.

## Themed meeting-point search, Quran people and teal gradients — 5 November 2026

The meeting-point selector is now a searchable themed popover instead of a native select, including on iOS-style touch layouts. Names/descriptions wrap, Arabic search ignores harakat/alif variants, and keyboard/touch selection closes the popup. It remains below the narrator cards. The shared Popover primitive is marked separately from modal dialogs; mobile full-height dialog rules no longer stretch popover content or indent its search row.

The library response includes read-only meeting-point candidates from the shared Quran narrator directory and identities used by confirmed Quran routes/their book chains. Private text sections, unrelated people and draft-only routes do not populate this shared list. Existing reviewed continuations remain direct choices. Selecting another saved person pre-fills the anchor and opens reviewed continuation creation, with saved-source references visible; selection alone does not infer a continuation, modify the chain or make it ready for issuance. Existing source/endpoint validation and pending-save guards remain in force. No migration or real source data changes were needed.

Main filled controls/header/selected navigation use a subtle physical left-to-right gradient: current teal at the left, darker teal at the right. Workspace accent/sidebar tokens and outline/ghost hover classes now use teal, eliminating the old gold touch-hover fallback. Certificate palette/artwork/print settings remain independent.

Validation: local Chromium desktop and emulated touch checks pass for themed popup search, keyboard/touch choice, compact mobile bounds, teal accent, gradient direction and existing card interactions, dark contrast, disabled/destructive and reduced motion. Personal-sanad tests cover new-person selection requiring review; loader fixtures cover source provenance, confirmed-chain inclusion, draft/unrelated exclusion and private-source isolation. Typecheck and production build pass. Released via PR #24, production main 5179788, deployment dpl_EsMCsYehKD2o3e9fvbAa2HB5foL5 verified READY. Physical iOS Safari and signed-in hosted issuance remain unverified.

## Mobile card feedback and simplified personal-sanad entry — 5 November 2026

Clickable navigation, book, matn, riwayah and additional-shaykh cards use a teal top accent, glow, small lift, filled/tilted icon and the existing reveal arrow. Desktop hover and keyboard focus share the language; passive delegated pointer feedback adds touch/pen support without intercepting or delaying clicks. Release feedback clears after 380ms, on scroll/drag/cancel/blur and on unmount. Layout panels do not activate descendant cards. Reduced motion retains colour feedback without transforms/transitions. Effects are screen-only and use the existing theme.

Personal-sanad narrator cards now place the meeting-point selector after the last narrator and before the adoption button. A point must be chosen explicitly for new card adoption. Options include direct Ibn al-Jazari and reviewed saved continuations for al-Ubaydi/other shuyukh; a missing al-Ubaydi continuation is labelled unavailable. Selecting a point does not invent a connection or trim the entered chain. The existing continuation and endpoint checks still block mismatches and missing sources. Full-chain mode retains its existing endpoint requirements.

Removed the redundant manual text adoption/editor and manual route-metadata panels from personal/additional-shaykh riwayah entry. Existing saved prose, route metadata, holdings and certificate snapshots are preserved. The saved-text preview, discard, saved book/route picker and separately reviewed continuation creation remain available.

Validation: local Chromium fixture covers isolated hover/focus, real emulated touch, single-tap activation, no sticky hover, scroll/cancel, disabled cards, keyboard navigation, dark button contrast and reduced motion at 390/320px. Personal-sanad API/React/helper suites and additional-shaykh navigation tests pass. Production build checked without the temporary review route. No live account/certificate data changed. Physical iOS Safari and signed-in hosted flows remain unverified. Released in PR #23, production main 17bdea5; Vercel deployment dpl_BcMQihbcUokSAZPWpGuscZ5b8NMg was verified READY with the production alias.

## Username and one-time account setup — 5 November 2026

Admins can create a username and a one-time setup code from an additional shaykh's بيانات الشيخ panel or the users manager. Email is optional during provisioning; role is Student or Shaykh, with an explicit issuance-capability checkbox. Codes are generated server-side from 20 random bytes, shown once, stored only as SHA-256 hashes, expire after 72 hours and can be rotated/revoked. Pending usernames are reserved across existing setters. No account/invitation was created for a real person during implementation.

Entering the username/code on the normal login page (or /activate-account) opens setup. The user must verify a real email via native Supabase email OTP/magic link, then choose/confirm a new password before the single atomic claim grants workspace access. Known administrator-supplied email addresses are locked; missing addresses are collected from the user. A private HttpOnly/SameSite cookie resumes setup through the existing confirmation callback. The setup code is never a permanent Supabase password and is not placed in URLs or localStorage. Existing username/email/password/Google login and recovery continue to use native Auth.

The server uses the existing USERNAME_LOOKUP_KEY for the private setup bridge; creation fails closed if its configuration is unavailable. Native auth.user identity, verified email, password presence, inactive Student account state and the unconsumed invitation are checked independently. User metadata never determines roles. Active, deleted or already-bound accounts require normal administrator management rather than being overwritten. Roles cannot be provisioned as Admin through setup.

For an invited additional shaykh, activation links the same issuer ID/code/artwork and marks the login owner with the application account ID. Personal holdings and matn copies are prepared from that profile's current sources; private matn templates needed by those copies are cloned to the new owner. Source records and historical snapshots are retained. Source copies are independent afterwards, following the existing holdings model. The additional-shaykh entry remains visible to admins. Explicit guest records and pre-link drafts retain guest resolution; new personal records resolve the new owner's holdings. Personal issuer selection now requires the exact personalAccount owner instead of the first assigned personal issuer.

The additive migration is applied and public types regenerated. Hosted checks confirm private RLS, no direct anonymous/authenticated table reads, and anonymous/server-key denial. Security advisor warning counts are unchanged; the extra no-policy INFO is intentional default-deny on the private invitation table. Local PostgreSQL tests cover code rotation/expiry/revoke/replay, username reservation, email/password/role/account checks, stable issuer linkage, source/snapshot preservation and private-template copying. Server/UI tests cover secret-cookie/code lifecycle, verified-email → password → claim sequencing and one-time display. Existing auth/workspace/username tests, app typecheck and production build pass. Authenticated hosted end-to-end email delivery, real-person onboarding and mobile interactions remain unverified. No real user, login code or email was created/sent for testing.

## Direct personal-sanad narrator editor — 5 November 2026

The user's correction identifies the extra-shaykh riwayah editor's legacy textarea as the intended entry point. Personal holdings and additional-shaykh riwayah editors now put the saved narrator cards directly in the primary form. Add/remove/reorder/search/create reuses the same NarratorPicker and builder_people endpoint as Kutub/Turuq. The route composer is a separate collapsed choice; pasted text is a deliberate collapsed legacy fallback.

Standalone personalPersonIds are persisted beside personal/additional-reading prose and reopen as ordered cards. They are independent of unified route prefix IDs. Changing text without corresponding IDs clears stale standalone identities. Existing copied prose is preserved until the user explicitly adopts a new card order; no names are inferred from old prose. Direct personal prefixes can also supply exact reviewed meeting-point suffixes through their stored identities.

Unadopted card edits and route choices mark the outer form pending and block a stale save. Users can explicitly discard narrator changes or cancel a route choice and retain the current saved sanad. Choosing another route after adopting a direct prefix reloads that current prefix. Existing ownership/admin rules, immutable certificate snapshots and additional-reading upsert scope remain intact.

Validation: TypeScript, production build, existing additional-shaykh navigation tests and personal-sanad API/React suites pass. Tests exercise visible primary cards, collapsed text fallback, saved ID reopening, new-name reuse/creation, bridge composition, pending-save/discard behavior, standalone save/reopen and stale-ID clearing, plus non-admin additional-reading denial. No database migration or real record mutation was required. Authenticated hosted desktop/mobile and real issuance remain unverified.

## Basmalah offset, bordered heading previews and personal section sizes — 5 November 2026

Matn presentation adds optional basmalahOffsetMm (0–30mm). This inserts space above the basmalah from its established position, moving the title/body down in normal flow while retaining the existing basmalah-to-title gap. Missing/zero offset retains default positioning. The option uses the existing source/default/override/snapshot schemas; finalized snapshots are not rewritten.

Heading controls now preview physical 297 × 210mm paper and its selected pinned border, uniformly scaled to a compact maximum height. Qiraah heading previews in the form and palette editor also show the default border. Preview paper uses the certificate header's 14.993mm top coordinate. Normal body previews remain inside their existing A4 border and do not receive a second border.

Personal and additional-shaykh matn editors add المقدمة and الخاتمة tabs. Each offers an optional whole-section size in points (6–72) and return-to-template sizing. Sizes live in the matn's presentation settings, not in the reusable template. Applying an override preserves source colours/bold/other layout while overriding every range in that section; whole-body percentage still scales it. Existing template selection and editing remain available. Joined sections rebase these generated ranges, and print uses the same rendering.

Validation: typecheck, production build, local React section-tab interactions, saved heading/section-size round-trip, pinned border/geometry fixtures, bare print rendering, actual print-style/finalization schemas, draft-refresh/owner/isolation and immutable snapshot suites pass. No database migration, template mutation or real issuance. Authenticated hosted desktop/mobile and physical printing remain unverified.

## Personal sanad meeting points, narrator entry and named variants — 5 November 2026

Personal saved-route entry shares the existing narrator picker: search/reuse a stable person ID, review duplicates before creating, insert/remove/reorder people, then explicitly apply the generated prefix. New names use builder_people. Active shaykhs can insert their own narrator rows; updates/deletes and shared book/route editing remain administrator-only. Stored ordered prefixPersonIds survive save/reopen; existing pasted text remains available and is never automatically parsed or migrated.

Meeting-point selection accepts reviewed personal continuations from any shaykh to Ibn al-Jazari, including before Ibrahim al-Ubaydi. Users explicitly save these private continuations once. Existing structured personal prefixes also offer each exact saved narrator boundary with its remaining text; any mismatch/missing person or unsafe branch boundary suppresses the derived option. Shared Ubaydi and direct Jazari fallbacks remain. Complete sanad review is required before route attachment; private source filtering is explicit even for admin-readable rows.

Holdings support multiple sanads for the same riwayah/route, distinguished by shortName. Add/edit is by holding ID and never implicitly updates/deletes another riwayah holding. Route attachment retains its transactional lock and idempotency for the same prefix/name, while different personal prefixes/names get independent records. Additional-shaykh attachment is unchanged. The certificate selector keeps every named variant and shows short names only in the app; full-qiraah issuance rejects ambiguous alternatives instead of silently choosing one.

In أسانيدي, select 2–5 holdings for the same specific riwayah and route, then «دمج الأسانيد المختارة». The authenticated endpoint prepares a read-only merge preview of complete paths separated by (ح), omitting repeated introduction/wording/conclusion. A normal editor opens for review and saving as a new named copy; original holdings remain untouched. The combined holding can be selected for issuance like a single holding. No automatic scholarly connection or shared-tail compression is inferred.

Validation: typecheck, production build, sanad composition/workflow/local PostgreSQL suites and personal-sanad API/React interaction tests pass. Tests cover arbitrary junctions, exact identity-backed boundaries, private-owner isolation, separate saves/reopen, complete-path merge, no source overwrite, mismatched riwayah/owner denial, narrator ID reuse/creation, attachment idempotency and staff/student RLS. The hosted migration is applied; a transaction verified independent attachment IDs, retry idempotency and unchanged original data, then rolled back every synthetic holding. Scoped person-insert policy was verified on the hosted schema. Authenticated hosted desktop/mobile and real certificate issuance remain unverified; no real certificate was issued for testing.

## Basmalah sizing and print-safe issuer artwork — 5 November 2026

Matn certificate heading controls add independent basmalah width (15–80mm) with linked proportional height. The optional setting flows through existing saved presentation/override/snapshot paths; old records retain the original 34.18 × 4.4mm default and existing top position.

The user's physical print shows a horizontal rule between the issuer teaching/location lines, distinct from the diacritic initially discussed. The inspected numbered source SVGs contain no such rule. Numbered issuer artwork now prints as transparent 600dpi PNGs tinted from source alpha, replacing CSS masks after preparation. Original source SVGs, colours, physical dimensions and pinned snapshot asset URLs are retained. Print/PDF/finalize actions wait for all image loads; failures show a retry action. A bounded client cache avoids repeated rasterization. Other certificate text/heading vectors remain unchanged.

Validation: tests cover native image output/readiness, pinned source, colour/proportion metadata, stale-colour handling, failure/retry and basmalah setting save/render/bounds. TypeScript, matn save/reopen/print suites and build pass. The physical-printer artifact cannot be confirmed resolved without another physical print; no authenticated browser/physical print verification is claimed.

## Linked matn footer width — 5 November 2026

Matn draft certificates now give the centered lower issuer/signature/date/verification table the same effective width as the main text box. Its three existing percentage columns contract together. Date insets decrease proportionally and date tokens can wrap at narrow widths; text font sizes remain independent of width. New finalizations store `footerWidthLinked:true`, freezing this behavior with their saved heading/width settings. Older finalized snapshots keep their original footer geometry.

Validation: TypeScript, build and actual draft/finalization fixture pass, including the new frozen layout flag. No record migration or historical rewrite. Physical printing and authenticated browser review remain unverified.

## Preview controls and permissions polish — 5 November 2026

The issuance-capability panel uses the app card/background/teal tokens, compact correctly aligned checkboxes, role badges and a responsive grid. Saving logic and access checks are unchanged.

## Simpler deletion confirmation — 5 November 2026

User deletion now asks for the word `confirm` (case-insensitive, surrounding spaces ignored), rather than the account name. The server enforces the same confirmation; administrator protection and recoverable removal remain in place.

## Live text layout on the matn preview — 5 November 2026

Personal and additional-shaykh matn editors now show width and overall text scale directly above the bordered A4 page on the «المعاينة» tab. These reuse the same saved presentation values and update the preview immediately. The duplicate layout group is hidden from their heading tab; shared catalog defaults and per-certificate controls retain access to it. Editing width preserves heading/border settings and text formatting, and the existing Save action persists it.

Validation: shared-editor interaction test changes width from preview, switches tabs and verifies retention of width, border and heading values. Existing layout/render tests and production build pass. No database or finalized-record changes. Authenticated browser and physical-print review remain unverified.

## Recoverable user deletion — 5 November 2026

Active administrators can remove non-admin users with exact-name confirmation. Removal sets the application account inactive and marks it in a private deletion registry. The default users list hides removed accounts; «المستخدمون المحذوفون» offers restore. Restoration leaves access inactive until separately activated. Certificates, scholarly records and login identities are retained; this is not permanent Supabase Auth erasure.

Database RPCs reject self/admin deletion and non-admin callers. An account trigger prevents reactivation or promotion while deleted. Private marker storage has RLS and no direct client grants; invoker API wrappers call narrowly granted private functions with explicit admin checks. Inspection remains read-only; user-management edits require restoring deleted accounts first.

Validation: real local PostgreSQL migration tests cover admin allow/deny, protected accounts, private-table denial, reactivation guard, inactive restoration and unchanged certificate fixtures. A hosted transactional fixture verified the deployed RPC and rolled back; zero accounts are marked deleted. UI tests cover exact-name confirmation, hiding and restore; backend tests cover confirmation, inspection denial and mutation guards. Types regenerated. Private-table default-deny RLS advisor information is expected. No actual user was deleted.

## Point sizing and matn text layout — 5 November 2026

Editor toolbar shows point size; relative selection sizing remains under More to keep the primary row compact. A size change without selected text applies to the current paragraph instead of silently affecting only future typing. Selected text retains its precise range. Absolute `sizePt` is optional and survives the rich adapter, section schema, editor repaint, source saves, matn preview and rich certificate rendering. Existing percentage-only records retain their relative behavior. Clear/presets reset absolute sizing.

Matn presentation settings add optional centered text-box width (100–265mm) and overall body scale (50–200%) under a collapsed «مساحة النص وحجمه» group. Text scaling includes source point-sized spans and certificate phrase overrides; the SVG heading/basmalah stays independent. Missing settings retain the old layout, and existing finalized snapshots are not rewritten. Width/scale participate in existing matn defaults/overrides and snapshot persistence. The editor tab is now labeled «تنسيق الشهادة».

Validation: compact editor tests cover selection/current-paragraph resizing, point-size adapter/schema/render persistence and rich print size. Matn layout fixtures cover centered width and overall scaling, including absolute point sizes. Hosted authenticated use and physical printing remain unverified.

## Draft matn source refresh and shaykh cards — 5 November 2026

Draft matn preview and finalization now resolve the current saved matn source, including sanad, wording, introduction/conclusion templates and formatting, for personal holdings and additional mashaykh. Both paths pass the same resolved document into snapshot formatting so the visible document and frozen chain agree. No read-time source rewrite or bulk migration. Finalized certificates continue to use their immutable snapshots.

Additional-shaykh mutoon acquire persistent UUIDs on ordinary saves. New draft references use those IDs; old positional references resolve only a unique matching catalog/name within the same shaykh. Missing or ambiguous legacy sources retain copied text; they never silently attach to a replacement or another owner. Reordering and renaming a source with a stable link preserve that link.

Shaykh mutoon and riwayat use the same book-card theme as the shared matn library. Clicking a card opens the relevant editor, including the specific saved route. Matn remove actions remain separate from the card. Additional-shaykh save responses reload their extension data so just-saved text and generated IDs are immediately returned.

Dialog footers use a 12px flex gap in both RTL and LTR, including the issuer picker and save-draft buttons. The decorative top strip on action cards is removed; teal hover/selection feedback remains.

Chrome synthetic preview confirmed the 12px RTL dialog-button gap, absent top accent, card theme and card callbacks. Temporary review route removed before merge. Basmalah-to-title spacing remains unchanged. Drafts and new finalizations keep the heading at its established top coordinate (14.993mm); automatic balancing no longer translates it downward. New finalizations store `headerPosition:fixed`; older finalizations keep their prior balancing behavior.

Validation: actual preview/finalize fixture covers changed personal/additional matn text, templates, source formatting, reorder/rename, deleted/other-owner links and immutable finalized content. Existing matn heading/save/reopen/print tests pass. Hosted multi-user and physical printing remain unverified.

## Matn layout and latest-completed default — 4 November 2026

Release branch `feat/matn-preview-borders`: dimension-mode selectors now have full readable widths and separate numeric/range controls; switching units rounds to half units. Optional saved presentation settings add basmalah-to-title spacing, three paragraph boundary switches and a border choice. Joining sections preserves source formatting ranges by rebasing them; old records without these settings retain their existing rendering. Shared personal/additional-shaykh preview uses a fixed 297 × 210 mm A4 landscape paper with external zoom and an overflow warning.

Administrators can expand saved asaneed by owner from a shared matn's edit page. Exact catalog IDs link holdings; both personal and additional-shaykh records are included, with read-only text, authenticated RLS queries and inspection restrictions. No data migration or record rewrite.

Certificate lists default to latest completion date, including reset/invalid filters. The filter-storage namespace was advanced so old remembered defaults do not override this release. Explicit choices persist thereafter.

Numbered matn borders are discovered through the existing pinned artwork pipeline. Upload `svg/borders/01/frame.svg` (then 02, 03, etc.) to the fonts repository; optional names use `"borders":{"01":"اسم الإطار"}` in `svg/catalog.json`. Refresh artwork in the app after uploading. Default and no-border choices are available immediately; additional choices appear after discovery. Borders are monochrome masks using the certificate's border color, proportionally contained. New finalizations freeze the catalog/revision; old snapshots retain their fallbacks.

Chrome synthetic preview verified readable width/height choices, half-unit numeric conversion, basmalah spacing, joined paragraphs, compact checkboxes and fixed A4 dimensions. The temporary route was removed before merge.

Validation: production build and TypeScript pass; matn heading/save/reopen/print suites, layout/joined-format/border tests, certificate filter tests, editor tab tests and admin allow/deny API tests pass. No real hosted certificate was created. Authenticated multi-user browser flows, future uploaded borders and physical printing remain unverified.

# Current Asaneed state

## Consistent editor pages — 4 November 2026

User authorized automatic publication. Profile, additional-shaykh reading sanad, personal holdings, shared matn metadata, shared text, continuation, book and route editing now use the reusable EditorPage frame rather than large editing dialogs. Personal and added-shaykh mutoon share MatnDocumentEditor tabs for sanad, wording, heading and preview. Context/owner, Back/Cancel and Save actions are visible; Back/Cancel and browser unload warn for dirty tracked forms. Small pickers and certificate print-preview dialogs remain dialogs. Existing server/RLS ownership and historical snapshot logic are unchanged. See EDITOR-WORKFLOW.md for the coverage map and limits.

Matn catalog cards match Kutub/Turuq cards. Section tabs have a neutral container with teal active state. Each riwayah palette is collapsed by default with name and two live colour dots; hidden controls remain mounted to preserve unsaved changes.

Validation: TypeScript, build, shared-page cancel/save/unload tests, added-shaykh navigation tests, shared matn tab/template/formatting tests, compact editor tests, matn save/reopen/heading/print suites and sanad composition/adapter/local SQL suites pass. A temporary Chrome preview also verified Arabic/tashkil input, tab preservation, composed preview, Back warning/continue-editing, saved state and light/dark layout. Its synthetic route was removed before release. Hosted authenticated account flows, native mobile IME and physical printing remain unverified.


## Interface polish — 4 November 2026

Review branch `feat/interface-polish`: replaces gold button fills with teal/neutral treatments, compacts language selection, adds a translated expandable certificate-number illustration, clarifies email-or-username login, adds password visibility and a page-specific login title, and separates verification details into readable fields. Workspace controls share 44/36/48px sizes and 8px radii; card lift is reduced to 2px, icon rotation removed, and coloured hover feedback retained. Certificate artwork, snapshots and database records are unchanged.

Username login already exists via server-only alias resolution; no new auth flow or schema was added. Existing email/username lookup tests and production build pass. Successful sign-in with real credentials and signed-in workspace visual checks have not been performed. Hosted preview review pending.


Updated **30 October 2026 (Asia/Riyadh)**. Read together with root `AGENTS.md`. This document supersedes older progress reports where they conflict with the newer behavior described here; inspect the implementation when in doubt.

## Nested-card hover correction — PR #7

The user recording exposed a broad outer Card hover/focus selector that filled every nested book icon. Removed generic layout-card hover/focus decoration and limited icon filling to explicit leaf shaykh cards and the existing individual action-card states. Entering a container no longer fills sibling icons or highlights its border. Regression browser checks now cover parent hover, sibling isolation and focus elsewhere inside the panel, in addition to the existing mobile/dark/accessibility checks.

## Workspace-wide primary-color treatment — PR #7 follow-up

The review branch now applies the same primary-color interaction language through shared button/card/tab primitives, desktop/collapsed/mobile navigation, certificate actions/menus, scientific-matn and account records, shaykh cards and certificate-section choices. Navigation uses tinted icon tiles with filled hover/current/focus states. Outline/ghost actions use primary icons and hover/focus feedback; destructive actions retain red, primary/secondary button semantics remain, and headers retain their white controls. The matn toolbar keeps its compact dimensions and gets consistent primary active states. All new theme rules are screen-only; no artwork, typography, certificate snapshot or database changes.

Added npm run test:workspace-theme: isolated real-component browser fixture with mocked APIs, desktop/mobile navigation, keyboard tab behavior, disabled/destructive actions, dark filled-icon contrast (5.20:1), focus and reduced motion. Passed at 1280/390/320px. Existing Arabic typing/tashkil, selection/undo, heading geometry, overflow and two-paragraph print browser checks also passed; production build passed. Screenshots reviewed on desktop, dark and mobile. These are representative component fixtures, not a claim to inspect every production account/page. Pending preview review; production is unchanged.

## Primary-color cards — review branch, 4 November 2026

Branch feat/primary-color-cards adapts Telawah card feedback to Asaneed's existing teal theme. Shared-text categories and saved-book cards use tinted icon tiles, primary hover/focus borders, white icons on filled tiles, directional arrows and subtle lift. Touch remains responsive and reduced-motion disables transforms. No certificate, artwork, database or print styles changed. Verified typecheck, production build and actual browser checks at 1280/390/320px, including dark contrast, Arabic typing, keyboard focus, touch and reduced motion. This styling is pending review and is not released to production.

## Production release — 4 November 2026

User explicitly approved the exact production schema migration, merge and Jazarīyah move. PR #6 is merged; production main commit is 22c983c31ce973c3cbbb7ceb7642bb8928b449b7. Vercel production is READY and asaneed.vercel.app points to this commit. The unified-sanad schema migration is applied.

Migration fingerprints verified unchanged certificates, snapshots, old workspace records and original builder-chain fields. Existing security advisor counts did not increase. A private application backup was created before release.

المقدمة الجزرية is published in the shared المتون العلمية catalog, category التجويد, author الإمام ابن الجزري, original artwork 02. Creation was performed through the signed-in administrator workspace. Its one existing additional-shaykh personal entry was backed up and linked by catalogId. Assertions verified every other personal field, exact scholarly text, wording, formatting and ownership remained unchanged. Certificates, all legacy snapshots, original chains and every other workspace record compare unchanged after the move.

Nine route comparisons still require review. No bulk sanad conversion, historical approval or certificate rewrite was performed. Older draft/migration-pending sections below are historical and superseded by this release note.

## Unified sanad architecture — draft PR #6, 4 November 2026

Continued the existing management branch after fetching PR #6 follow-up fixes. One shared composition core serves builder previews and legacy holding/certificate adapters. New explicit route references flow through personal preparation, qiraah issuance, additional-shaykh issuance and draft snapshot resolution. Shared saves no longer rewrite copied holdings, prepared sanads or snapshots.

Shared texts use four responsive icon categories, approved continuation metadata in existing sections, read-only CHAIN sources, explicit selection/style preservation, central route continuation selection and a separate advanced override. Admin-only HTTP/RLS guards, audited comparison review and reversible conversion proposals are prepared. See [SANAD-UNIFICATION.md](SANAD-UNIFICATION.md) for paths, migration protocol and limitations.

Read-only audit: 23 active routes; 14/14 Shatibiyyah seven-name prefixes match the saved Ibn al-Jazari → al-Dani segment. General ordered-name comparison leaves 9 routes needing review. There are 47 core drafts and no finalized core snapshots, but all 45 older workspace snapshots (30 carrying issue dates) remain uncertain and excluded from conversion.

TypeScript, production build, unified/legacy workflow and local SQL migration tests, editor/matn suites, desktop/mobile Chrome Arabic typing and real A4 landscape print fixtures passed. Dark theme and mobile cards were visually reviewed. No authenticated hosted mutation, physical printer or historical-authentication coverage is claimed.

**Not merged or deployed to production.** Migration 20261104164423_unified_sanad_continuations.sql is prepared, not applied. No stored-chain conversion occurred. Production remains the merged PR #5 main release 7743ecf. The earlier matn migration already exists in the inspected hosted schema; it is separate from this new migration.

## Compact editor PR #5 correction — 4 November 2026

The same `feat/compact-formatting-editor` branch and draft PR #5 were corrected after review. The primary toolbar now contains only preset, size, bold, Lucide alignment icons, palette and ellipsis. Save/status are in the header. The More disclosure contains selection/reset/history/variables/font/paragraph controls, supports Escape and outside-pointer dismissal, and does not permanently expose secondary rows. Native disclosures expose expanded state; icons have Arabic names/tooltips and alignment/bold/color controls reflect the selection. The preset selector retains the applied preset.

Pending typing marks now survive capture events at the same caret and subsequent typing; actual caret movement clears them. Scoped section metadata is rebased alongside rich spans on editing, including unambiguous surrounding-text edits. Rich print source scopes produce inline runs inside paragraphs rather than separate wrapper blocks; only explicit newlines split the rich flow. The old phrase-only and historical finalized-matn rendering paths remain intact.

Verification: DOM regressions cover pending marks across keyup, caret changes, scoped rebasing and continuous/multi-paragraph print boundaries. `npm run test:editor:browser` runs the actual components in installed Chrome with a local-only synthetic fixture: Arabic/tashkil input `بَارَكَ اللّٰهُ فِيهِ`, applied preset/active alignment, More disclosure, 1280px desktop and 320/390px mobile with no horizontal page overflow, configured KSA/Sakkal fonts and no browser page errors. Screenshots were visually reviewed. Chrome produced a real one-page A4 landscape PDF using the certificate print-area stylesheet; Poppler rendering was inspected for continuous source/prefix/suffix flow and the explicit second paragraph. The fixture route is created and removed by the browser test and is not shipped.

Limits: this is a browser/PDF fixture check of the actual components, not a live account/certificate issuance, native Arabic IME session, iOS browser or physical printer test. No hosted data mutation or production deployment was performed. The earlier preview Google-login redirect investigation remains separate and was not changed in this correction.

## Compact formatting editor — review branch, 4 November 2026

Implemented on `feat/compact-formatting-editor`; **not deployed**. `/studio/client.tsx` dynamically imports `legacy/App.tsx`; the matn and section editors in `legacy/components` are active. Both now share the compact editor, six semantic presets, selection actions, semantic colors, variable insertion, collapsed advanced font/paragraph controls and responsive toolbar styling.

Collapsed clear resets typing marks; inline clear preserves paragraph settings. Explicit paragraph alignment wins over the default justification; paragraph actions retain the original selection. Transactions handle insert/delete/paste, undo/redo, grapheme boundaries and atomic placeholders. New section edits save exact scoped ranges in an optional `rich` member of the existing formatting JSON; original phrase metadata remains available. Legacy phrase-only records retain their historical all-occurrence behavior until intentionally edited. Boundary whitespace trimming rebases the new spans.

The version-2 paragraph/run adapter is in-memory and round-trips untouched legacy metadata with a backup; storage remains compatible JSON in the existing columns. No SQL migration, hosted database mutation, bulk data rewrite or snapshot rewrite was performed. Existing finalized matn documents retain historical alignment rendering; newly created documents carry `editorVersion:2`. Existing Arabic font definitions, artwork and certificate palette settings were retained.

Validation: `npm run test:editor` (DOM interaction plus real certificate render helpers), `npm run typecheck`, production build, existing matn rich-text/recovery/assembly/render/API/persistence and certificate format-settings suites passed. Tests cover repeated vocalized names, clear/typing, undo/redo, selection preservation, atomic variables, mixed Latin identifiers, scoped/multiline section print rendering, legacy conversion and saved whitespace offsets. The React checklist was reviewed for selection listeners, controlled values, toolbar labels and composition guards.

Limits: DOM tests do not establish mobile browser layout, touch selection behavior, font loading or physical A4/PDF parity. Authenticated desktop/mobile review and physical printing remain release checks. Ambiguous or changed scoped source text refuses to guess another occurrence. No production deployment is authorized by this change.

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

### Reference-matched homepage buttons and language pills

Homepage sign-in now uses the user’s reference gold fill, white text, rounded corners and subtle shadow. Public/auth language selector is a compact borderless teal capsule with a gold selected pill and teal selected text, matching the supplied fourth image. Removed the preceding outlined treatment. Production build checked; language action semantics unchanged.

### Compact right-corner sign-in and white selected pills

Selected public/auth language pill text is white as requested. Homepage sign-in is a compact gold icon/text action in the physical right header corner; language controls occupy their own slot and move to a second row on narrow screens. Production build checked.

### Lifetime issuer numbering — YYSS-NNRR (31 October 2026)

User confirmed NN continues across all years, across all riwayat, per issuer, and explicitly authorized updating unprinted finalized numbers. Live inspection found 44 drafts, zero finalized Qur’an certificates and zero snapshots; only drafts needed renumbering. An exclusive-lock migration took a private full backup and recorded an old/new mapping, allocated initial issuer serials in created_at/id order, and changed only registration_number (preimage equality asserted). New private lifetime counters and per-certificate allocations retain deleted serials. Reservations remain idempotent across year/riwayah changes; finalization uses the same reservation. The counter expands after 99 without truncation. Old per-year counters remain as historical backup data. Full backup/restore now includes the lifetime counters/allocations and preserves maximum counters.

Verified rollback-only authenticated tests for 99→100, cross-year retention, deletion/no-reuse, cross-riwayah continuation, finalization retaining the reserved number, longer-number public lookup and finalized mutation protection. No test certificate remains; 44 allocations/certificates and zero snapshots remain. Registration normalization and validation support extended NN; build checked. A PostgreSQL snapshot guard initially used the wrong key and failed atomically; corrected to certificate_id before the successful migration. Authenticated browser verification remains outstanding.

### Account settings and eight-character passwords (31 October 2026)

Changed shared server password validation and signup/reset browser minimums to eight characters, with matching Arabic/Urdu/English hints and errors. Settings now group account name/email, password/security, certificate appearance and collapsed admin artwork/backup tools. Password action links directly to the existing authenticated /reset-password form, which updates the same user and signs out after success; Google identity remains linked. Seven-character rejection/eight-character acceptance, auth redirect/translation suite and production build pass. No real user password was changed for testing. Authenticated browser/password submission remains unverified.

### Settings display-first editing (31 October 2026)

Username now reads اسم المستخدم with a labeled pencil action; input/save/cancel appear only during editing and successful saving closes it. Certificate profile defaults to a teal/gold illustrative preview with actual personal issuer numbered artwork where present, matching text fallbacks/visibility and saved text sizes/weights. A pencil opens fields and save/cancel; cancel restores saved values. Removed optional center-stamp text control without deleting existing stored content or historical snapshots. Load failures disable editing to avoid overwriting unloaded profiles. Build/type checks passed; authenticated browser visual checks remain outstanding.

### Additional-shaykh view/edit separation (31 October 2026)

Additional-shaykh cards now expose separate عرض and تعديل actions. View opens a display-only mini profile with qualification/school/email, shared two-color certificate-footer preview (issuer code resolved by stable ID), readings/saved route labels, collapsible general sanad and formatted mutoon. An explicit edit action opens the existing editor; no builder or save controls are rendered in the read-only profile. Editor profile tab also includes the preview. Extracted shared IssuerProfilePreview from personal settings to keep artwork/text visibility and sizing consistent. Save now refreshes the displayed list from the returned result. No data migration or certificate snapshot changes. Production build/type checks pass; authenticated browser interaction/visual verification remains outstanding.

### Riwayah-first shared text and route controls (31 October 2026)

Advanced shared texts now have a single riwayah selector. Selection filters technical CHAIN keys to that imam/rawi and its shared sahaba/prophet tails; non-CHAIN general ijazah sections remain available. Changing selection closes the current editor; unsaved edits require save/cancel first. Stored section keys and ownership are unchanged. Book route editing uses one imam-qualified riwayah option that updates both stable qari/rawi keys and reloads the matching continuation, resetting confirmation. Removed the historical-verification disclaimer sentence while retaining the explicit sanad-review checkbox and existing validation. Production build/type checks passed; authenticated browser checks remain outstanding.

### Simpler mutoon text editing (31 October 2026)

Personal and additional-shaykh mutoon now use a compact text toolbar with primary/secondary/default color, bold, select-all, apply/clear and formatted preview. Alignment/indent controls are collapsed. Introduction/conclusion selection offers explicit edit of the selected own template, reusing the existing authorized update-by-ID endpoint; the UI notes that edits affect other holdings using that template. Additional-shaykh wording has its own labeled editor before the sanad; personal wording also supports the toolbar. Wording styles are tagged within existing sanadFormatting arrays, retaining compatibility for old untagged sanad ranges. Preview separates wording/sanad styles and intersects multiline selections with each line after verifying the full source range. Editing text clears that section’s stale styles. Build/type checks and server-rendered multiline/color/bold/range-isolation checks passed. No real template or certificate changed during testing. Authenticated selection/save/reload and final-print checks remain outstanding.

### Requested Shatibiyyah attachments and scope-first selection (31 October 2026)

User requested saving Shatibiyyah routes for Uwais, Zakaullah and Muhammad Sharaf. Inspection found confirmed 14 Shatibiyyah routes; Durrah routes remain unconfirmed. Attached only each issuer's existing eligible selections: Zakaullah 14, Uwais 4 (Ibn Kathir/Kisai), Sharaf 1 (Hafs). Preserved specific saved per-riwayah prefixes (including Uwais/Qunbul), falling back to issuer general prefix, merged the saved Ubaydi bridge and used the same builderPreview assembly as the app. Took a private full backup, passed a rollback trial, then committed via authenticated attach_builder_route under existing RLS. Idempotent RPC preserves existing holdings. Verified 19 attached route identities, 44 existing certificates and zero snapshots; no certificates issued or renumbered. Private attachment plans are outside the public repository.

Saved-route picker and issuance form now ask Sughra/Kubra first. Sughra automatically selects its unique original library route after riwayah selection and hides book/route selectors; unconfirmed Durrah cannot be applied. Kubra picker offers confirmed non-Sughra saved routes only. Additional-shaykh reading chooser asks scope first and filters Kubra riwayat by confirmed library availability; manual/legacy options remain available separately. Personal Sughra issuance deduplicates original/numbered holdings and prefers the saved original route; guest individual Sughra choice uses its attached route when present.

Compact list-only labels show الشاطبية والتيسير or الدرة والتحبير; Kubra shows book plus عن and the route source short name when supplied, otherwise book alone. Full stored route/chain names remain unchanged. New explicit الاسم المختصر لصاحب الطريق control saves builder_people.display_name through authenticated/RLS update; no schema or permission changes. Shared compact labels used in saved picker, additional profiles and issuance choices. Build/type checks, compact-label and bridge/branch tests pass. Authenticated browser and every issuance variant still require interactive verification.

### Complete Sughra grouping and truthful shared-prefix labels (31 October 2026)

Additional-shaykh profile/edit reading lists now collapse complete 20-riwayah coverage into القراءات العشر الصغرى, with individual riwayah editing inside and other saved routes below. Partial coverage remains individual. Existing catalog/storage IDs and sanads are unchanged. Compact names centralized in qurra.ts: ورش عن نافع, الدوري with Abu Amr, حفص الدوري with Kisai, خلف as Hamza's rawi and خلف البزار as qari. Applied to route/shared-text selectors, additional reading cards and short issuer group headings; documented in AGENTS.md.

User queried Zakaullah's misleading السند الخاص للرواية label. Live comparison confirmed all 20 no-route sanad records equal the general prefix (trimmed trailing punctuation/space), zero distinct overrides. Removed record-existence-as-special display rule; shared prefix is explained once, and genuinely different per-riwayah prefixes still receive a distinct indicator in the editor. Preserved all stored rows and route continuations. No DB writes needed. Server-rendered checks passed complete20 vs partial19 grouping, other routes below, and reader/rawi naming. Production build/type checks pass after clearing a failed generated Next cache; authenticated browser checks outstanding.

### Insert recipient name in mutoon editors (31 October 2026)

Added إدراج اسم المُجاز to shared MatnFormatting, so introduction/conclusion, sanad and wording editors can insert {{mujaaz}} at the textarea caret or replace the selected name. Restores caret/focus after insertion and clears that text section’s range formatting so offsets cannot attach to different text. Saves through existing template/holding flow; no real content modified during testing. Production build/type checked; real pointer/keyboard save/reload remains outstanding.

### Inline rich mutoon editor with preserved formatting (31 October 2026)

Replaced shared MatnFormatting textarea/separate per-text preview with an RTL contenteditable surface whose DOM is built exclusively from text nodes and controlled style spans. Bold/color apply immediately to the selected text. Selection/caret is retained across controlled updates, plain-text paste/newline insertion and name-token insertion. Input composition is deferred until compositionend; paragraph/line-break beforeinput is intercepted for mobile newline consistency. Added local undo/redo including formatting, keyboard shortcuts and the three name-token buttons. Removed personal editor's obsolete textarea-ref token path. No HTML is persisted or injected; existing plain text + range JSON storage and template APIs are reused. Legacy alignment/indent metadata remains stored and used by the composed preview.

New pure range helpers retain unaffected spans, shift ranges after edits, inherit nearby formatting on inserted/replaced text and split only the selected styled interval. Regression checks cover Arabic repeated names, insertion/deletion/replacement, unrelated-range preservation, style splitting/merging and no-op edits. Build/type checks pass. No actual template was changed during verification; authenticated pointer/keyboard, browser undo/IME and save/reopen checks remain outstanding.


PR #5 follow-up: More → ضبط الفقرة now offers combined «ضبط — آخر سطر وسط» and «ضبط — آخر سطر يمين» actions, with active state. Both set paragraph justification and last-line alignment together; selection and rendered CSS regression checks passed. Production remains unchanged.


## Matn heading presentation and PDF viewer — PR #5, 4 November 2026

The same draft branch now has `تنسيق عنوان المتن` in MutoonEditor. A real, centered two-line SVG/basmalah preview, numeric/sliding main and secondary heights, line gap and text gap share `MatnHeading` with the composed preview and CertificateHeading. Each SVG keeps its own aspect ratio; secondary height is independent. Missing artwork retains the established text fallback and only the applicable text-gap control. Reset uses safe defaults: main 42pt, secondary 24pt, line gap 2mm, text gap 4mm. The focused editor artwork preview scales uniformly to available space without changing its physical settings.

Persistence uses an optional version-2 envelope `{version:2,formats,heading}` inside the existing `sanadFormatting` JSON string. Old arrays remain arrays until heading settings are deliberately saved; the adapter reads both and additional-shaykh text edits preserve the envelope. No SQL schema changes or hosted writes were performed. Newly created matn documents bind their source ID; draft presentation resolution reads current issuer-owned defaults without refreshing copied scholarly text. Older drafts resolve only an unambiguous same-name/same-text source. Existing saved certificate SVG fields remain a legacy override until explicitly reset or migrated by saving.

Precedence: explicit per-certificate `settings.matnHeading` → saved legacy per-certificate SVG settings → current matn heading defaults → safe defaults. `matnHeading:null` explicitly inherits matn defaults and suppresses legacy overrides. Saving new certificate settings removes legacy SVG height/gap/scale fields to avoid competing sizes. Finalization freezes the resolved matn defaults plus any override in the existing snapshot. Previously finalized documents without the new heading member retain their original renderer, geometry, palette and pinned artwork; no published data is rewritten.

CertificateViewport defaults to fit-page and offers fit-width, zoom presets/buttons and existing touch pan/pinch. Controls remain outside the physical 297×210mm paper; print ignores viewer transforms. The certificate settings panel is collapsed and height-limited, with the single old SVG field replaced by the shared four-setting controls and an explicit «استخدام إعدادات المتن» action. Header measurement includes the shared after-gap once, and the existing overflow/balance logic remains enabled.

Validation: independent dimension/aspect/centering/gap/fallback and serialization/precedence tests; real endpoint save/reopen/finalization-schema compatibility; in-memory draft source refresh/owner isolation/ambiguity/published guard tests. Chrome loaded the pinned real two-line المقدمة الجزرية artwork (`ac3a0a0f6e5f8fb96d84dc1bb7be41fc021f31a8`), KSA and Sakkal fonts. At main 60pt / secondary 30pt all three rendering contexts computed 80px / 40px; measured line gap was 3.998mm and text gap 8.099mm for requested 4mm/8mm. Overflow detection was exercised with oversized synthetic content. Desktop/mobile fit/zoom checks passed. Real one-page A4 landscape PDFs at 50% and 200% viewer zoom produced identical Poppler-rendered images, proving that viewer zoom does not alter print scale. Screenshots and the rendered PDF were visually reviewed. No live account/certificate issuance or physical printer was used, and no production deployment was performed.

إعدادات الشيخ تفصل تغطية القراءات عن اختيار السند المشترك أو المستقل، وتدعم سندًا مشتركًا مستقلًا للكبرى المرتبطة بالمكتبة.
