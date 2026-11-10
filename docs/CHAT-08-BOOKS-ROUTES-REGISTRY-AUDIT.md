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
