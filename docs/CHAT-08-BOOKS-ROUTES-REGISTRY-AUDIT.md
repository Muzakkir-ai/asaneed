# Chat 08 · Books, routes and narrator registry

GitHub main and the READY production deployment both pointed to `292dc0d5dbd27556b4004051b782cc369946c21d` at the start of this audit. The review uses repository evidence and synthetic fixtures. Current hosted holdings and private learner records require a separate authorized read-only check.

## Registry finding and change

The directory selected the first additional shaykh whose normalized name contained «ذكاء الله». It then joined a certificate's displayed student name to the roster by normalized spelling, with draft and finalized rows both eligible. Two distinct roster IDs with the same name could supply each other's reading evidence. The historical builder then keyed the resulting pupil by normalized spelling, which could also collide with a historical narrator. RLS constrained the input by role, but did not make the inference reliable or provide consent to display certificate-derived pupil relationships in this directory.

The directory now queries shared historical sections only. It keeps the independently documented sanad of Sheikh Zakaullah and the existing historical IDs, graph direction and exact source text. Private certificate-derived pupil entries are no longer shown in this directory. Any future pupil index should require explicit visibility and relationship evidence keyed by student and issuer IDs. The existing auth gate continues to admit active staff and reject students, inactive accounts and anonymous requests. SQL policies still govern source visibility.

The prior compatibility call requested 2,000 sections but its underlying PostgREST read was unpaged. That could silently truncate the library before `hasMore` could detect it. The registry now reads ordered 1,000-row pages and filters for shared sections. The book library still has unpaged `workspace_records` queries for sections, reviewed readings and personal holdings. Its four builder-table queries paginate without an explicit order. These are separate follow-up candidates because they also feed issuance and require parity tests.

## Route provenance and readiness

- Books point to author IDs. Routes point to a book, its saved parent chain, catalog qari/rawi keys and ordered narrator IDs. The route code is an artwork identifier allocated when the record is created. It does not imply review or numbering readiness. Confirmation requires a resolved continuation or an explicit reviewed override. New attachments copy the current branch text and record its route/revision provenance. Issued snapshots stay frozen.
- The Shāṭibiyyah handoff records 14 confirmed library routes. Its attachment notes document earlier selections for Zakaullah and Sharaf, and record the Durrah drafts as unconfirmed at that review. They cannot prove current profile eligibility or that a personal prefix joins a continuation.
- The «أسانيد تحتاج مراجعة قبل الترقيم» indicator comes from the personal-diagram path resolver. A source can retain saved text or a shorter verified graph while the full narrator-ID sequence, selected continuation or junction remains unresolved. That indicator alone cannot identify a historically wrong chain.
- Al-Bazzī and Abū al-Ḥārith should be checked against the reported issuer's specific reading and variant records. Start from catalog keys `ibnkathir` and `kisai`, then collect the saved variant ID, selected continuation ID, final prefix narrator ID and exact reviewed onward path. A historical catalog entry is not proof that any personal prefix is linked.
- Use issuer codes 05 and 01 to locate the authorized Sharaf and Zakaullah profiles, then inspect their personal/shared prefixes and attached reading IDs. If a path ends at al-Ajhūrī, compare the final verified ID with the remaining saved text and the selected reviewed path. The present code supports partial graphs; the reason for those specific reported gaps remains unverified.

## Alias mapping proposals

| Source wording and evidence | Stable mapping and review status |
| --- | --- |
| «إبراهيم العُبيدي» in «من إبراهيم العُبيدي إلى ابن الجزري — فرعا السند» and «الشيخ إبراهيم العُبيدي» as the preferred display form | Continuation source ID `8d5d1878-f499-421a-9a32-867029920fb1`. `anchor:ubaidi` is the historical index key, not a builder person UUID. The bridge code currently accepts a unique active root match. Pin the reviewed builder UUID after checking active/archived candidates and aliases against the same source. Multiple matches stay unresolved. |
| «أبي العباس أحمد بن أسد الأُميُوطِيِّ» and «أبو العباس أحمد بن أسد الأُميُوطِيُّ» in the same bridge | Use the same reviewed person UUID for both occurrences. The source changes grammatical case and retains kunya, patronymic and nisba. Read the persisted bridge review to confirm the assigned UUID. |
| «شمس الدين محمد بن عمر بن قاسم البَقَرِيِّ» in the bridge review | The recorded match is `f14ff800-4b57-4067-b622-9f2686fe9a3c`. Preserve that ID. «أبي السَّماح أحمد بن رجب البَقَرِيِّ» has a different patronymic and remains a distinct person. |
| «أبي الحسن علي بن شجاع المعروف بـ صهر الشـاطبي» in the Ibn al-Jazarī → al-Dānī directory transcription | The explicit byname supports aliasing within this source. Confirm a unique builder UUID against the source and route before adopting it. The byname alone is insufficient to merge a stored identity. |

Remaining code risks include historical alias rules based on substring regexes, meeting-list deduplication by exact display name, and book-builder exact-name lookup with `limit(1)` despite uniqueness being scoped to owner. Reviewed alias lookup already rejects multiple candidates. Fixing the remaining joins requires explicit IDs or an ambiguity response and regression cases spanning owners and same-name people. Preserve source spellings and tashkīl separately from registry and short display labels.

## Verification

The synthetic registry API test exercises the real workspace route and Supabase client request serialization with mocked transport. It checks active admin and shaykh, student and anonymous denial, inactive denial, a private source with the same narrator name, unchanged historical IDs and shared sources past 2,000 rows. No hosted write, record inspection, issuance or deployment was part of this audit. Hosted RLS behavior and the reported private record-level gaps remain open.

## Historical source follow-up · 14 November 2026

Reviewed application head `2215adf7f85b0a47167ac7023386aac901a1eaaa`. GitHub returned no workflow runs or combined commit statuses for that SHA. The follow-up changes this handoff only. Chat 12 already consolidated the release handoff in [PR #121](https://github.com/Muzakkir-ai/asaneed/pull/121) and tracks #120 independently. Preserve its consolidated certificate entry alongside the existing dated registry entry when integrating.

The passage references below use *Zite Asaneed Recheck*, the 18 October shared-text transcription. Its page numbers and CHAIN keys identify the passages in that copy. The checks establish what the transcription says and how the application identifies those readings. Primary-edition citations and current record linkages require separate evidence.

| Case | PASS · independently verified | BLOCKED · evidence still needed |
| --- | --- | --- |
| Al-Bazzī | Page 3, `CHAIN:ibnkathir:البزّي`, names Abū Rabīʿah before al-Bazzī and records multiple intermediary teachers between al-Bazzī and Ibn Kathīr. The application identifies the slot as `ibnkathir\|البزّي`, rāwī key `bazzi`, subject code `03`. The recognized route-source name agrees with the passage. | A reviewed edition and exact passage for the intermediary branches and their assignments. For the personal numbering report, privately compare the saved reading/variant ID, final prefix narrator UUID and selected approved onward paths. |
| Abū al-Ḥārith | Page 6, `CHAIN:kisai:أبو الحارث`, records Muḥammad b. Yaḥyā al-Kisāʾī al-Ṣaghīr, al-Layth b. Khālid, then ʿAlī b. Ḥamzah al-Kisāʾī in that order. The slot is `kisai\|أبو الحارث`, rāwī key `abu-harith`, subject code `13`. Ibn Wardān has a distinct catalog key and full name despite the shared kunya. | A reviewed edition reference for the passage and the saved reading/variant ID, registry UUID for the junction, and continuation UUIDs for the reported personal chain. |
| Zakāʾullāh | Pages 1–2 give an independent shared reference ending at Ibrāhīm al-ʿUbaydī. Page 2 begins the onward text with al-Ajhūrī before the two al-Baqarīs. These headings and passages supply textual evidence for the junction at al-ʿUbaydī. | The selected private prefix, its last narrator UUID, and the persisted source selection. If numbering stops at al-Ajhūrī, compare the last rendered narrator UUID with the first unresolved step and the ordered IDs in the exact reviewed source. |
| Sharaf | The earlier Shāṭibiyyah attachment handoff documents one eligible historical Ḥafṣ attachment. The shared transcription supplies historical source passages. | The current private variant/attachment ID, its saved personal prefix and last narrator UUID, the selected continuation ID, and the reason returned by the resolver. The earlier attachment does not establish the present link or the cause of a missing diagram. |

### Alias and continuation evidence

- Page 2 supports one source identity for the two grammatical forms of Aḥmad b. Asad al-Umyūṭī. The 16-spelling review maps three exact historical registry UUIDs and proposes 12 further identities for the other 13 spellings. The two al-Umyūṭī occurrences should resolve to one UUID in the persisted review. The inspected handoff does not supply that assigned UUID.
- Page 2 gives «علي بن شجاع المعروف بـ صهر الشـاطبي» explicitly. This supports the byname in that chain. A registry alias still needs the candidate UUID and source-bound evidence. The same passage distinguishes the two al-Baqarīs by patronymic. The reviewed UUID for Shams al-Dīn is already recorded above.
- The al-ʿUbaydī onward source UUID is `8d5d1878-f499-421a-9a32-867029920fb1`. The historical index key `anchor:ubaidi` and the source UUID have different meanings from the root narrator UUID. The code requires a unique active root candidate and a review tied to the exact source body. Ambiguous, archived, stale and mismatched links require review. Confirming the current link needs the active root UUID and persisted alias and bridge review. The transcription and the earlier backfill plan do not prove their current values.
- For catalog continuations, verify the exact approved source IDs for the rāwī, qārī and Prophet ﷺ segments in order. For personal bridges, verify the selected source ID and the final prefix narrator UUID against the approved graph at the exact text boundary. A legacy CHAIN title alone provides no reviewed continuation metadata.

### Test evidence

**PASS** · Recompiled and ran `standard-route-sources.test.ts`, `shared-bridge.test.ts` and `unified-sanad.test.ts`. The fixtures cover exact ID junctions, ambiguous and archived roots, stale or missing choices, legitimate repeats, and verbatim source spelling. Ran `shared-bridge-backfill.test.cjs` in disposable PGlite. It passed exact-source persistence, repeated execution, archive and stale-source guards, and wording preservation. Additional synthetic assertions on the same application tree checked both slot codes, the distinct Ibn Wardān key, duplicate-name ambiguity, explicit approved continuation IDs, rejection of a wrong ID, and rejection of legacy text without approved metadata.

**BLOCKED** · Current private holdings, hosted registry visibility, persisted identity assignments for the unresolved aliases, and primary-edition verification of the disputed historical branches. No source record or identity was modified during this follow-up.
