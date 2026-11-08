# Qurra rāwī identity audit — November 2026

## Scope and result

The Supabase `builder_people` library was inspected for historical narrator
identity overlap with the **20 riwāyah entries / 19 distinct rāwīs**.

- **Two previously existing people were retained by their original person IDs:**
  Qālūn (`قالون`) and Idrīs al-Ḥaddād (`إدريس`). Qālūn's previous shorter
  form `قالون عيسى بن مينا` remains searchable as an alias, while his current
  full historical name stays in the main record. Idrīs's original full name
  remains unchanged.
- **Seventeen other full-name records had been added in the prior release.**
  At audit time none had a saved `builder_nodes` reference. A comparison
  against the original narrator library found no **confirmed same-person**
  duplicates requiring a merge.
- **No narrator records were merged or deleted by this audit.** Avoiding an
  unsupported merge is a correctness outcome, not an unfinished merge.
- Updated alternative search aliases (without changing preferred full names):
  `حفص الدوري` on the existing al-Dūrī person, `خلف البزار` and
  `خلف العاشر` on the existing Khalaf person, and the fuller form
  `أبي عمر عبد الله بن أحمد بن ديزويه الدمشقي` on an existing older narrator.
- Al-Dūrī **must be one person** for Abū ʿAmr and al-Kisāʾī, although there
  are two riwāyah slots. Likewise, Khalaf as Hamzah's rāwī and as the tenth
  reader is one historical person.

## Important false-positive identity matches

1. **Qālūn ≠ Ibn Wardān.** The names `عيسى` and `وردان` appear in both
   biographies, but the people and their transmission roles are different.
   Never merge on token overlap alone.
2. **Ibn Dhakwān ≠ Ibn Dīzawayh.** The original name
   `أبي عمر عبد الله بن أحمد الدمشقي` appears in a saved al-Kisāʾī / al-Dūrī
   chain. The surrounding saved path is
   `عبد الرحمن بن عمر المصري ← عبد الله بن أحمد الدمشقي ← جعفر بن محمد النصيبي`.
   In *al-Nashr*, this very path identifies the person as
   `عبد الله بن أحمد بن ديزويه الدمشقي`, who transmitted through
   Jaʿfar al-Naṣībī, **not** `عبد الله بن أحمد بن بشير بن ذكوان`.
   His original database `name` and person ID remain unchanged; the
   fuller `بن ديزويه` name is now an alias.

References:
- *al-Nashr*, al-Kisāʾī, al-Dūrī, route via Jaʿfar al-Naṣībī:
  https://www.islamweb.net/ar/library/content/70/32/
- *Taḥbīr al-Taysīr*, commentary identifies Ibn Dīzawayh:
  https://ablibrary.net/book_content/b/8349/175
- *Tahdhīb al-Kamāl*, Ibn Dhakwān biography:
  https://www.islamweb.net/ar/library/content/1001/3419/

## Application guardrails

The renderer/editor should prefer `builder_people.name` for a uniquely
matched saved full historical identity, falling back to the historical catalog
only when no saved person is uniquely identified. Match by exact full name or
verified full-name alias first; a unique exact short label can be used as a
fallback. **Never match from partial names or shared tokens.**

When multiple possible person records remain, display an unresolved identity
and require a deliberate reviewed merge. Never invent a rāwī → imam edge
from a text label or identity match. Use the existing `merge_builder_people`
review/snapshot mechanism for any future confirmed same-person merge so all
references are preserved.
