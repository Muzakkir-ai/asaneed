# Received certificates and editable personal sanads

`شهاداتي` lists only finalized certificates explicitly received by the account. `أسانيدي` contains editable personal holdings used when issuing further certificates. Issuer management permissions, recipient links and personal holdings remain separate concepts.

A staff account can choose “استخدام في أسانيدي” on one of its own finalized received certificates. The server verifies actual recipient ownership (including student-account links), loads its immutable snapshot, and proposes `كما أخذته عن الشيخ [direct issuer]، [the issuer's transmission chain]`. The recipient must review the editable text and explicitly save. The original certificate is never updated. The new holding retains its source certificate ID, teacher name, registration number and snapshot hash; a repeated save returns the existing copy instead of overwriting edits.

Future finalized snapshots contain a structured transmission segment. Historical snapshots use cautious extraction at the original `كما أخذته` phrase and known conclusion boundaries. Unsupported or incomplete old chains require manual entry, rather than guessing. This is a drafting aid, not a new attestation of scholarly authority.

Imported holdings use `chainMode: complete`, so the original Shatibiyyah/Durrah shared segments are not appended again. The heading still respects the actual reading and route. Complete holdings remain editable, alongside the existing junction-based mode. Multiple received chains for one riwayah are individually selectable by source teacher; a paired-qiraah shortcut is disabled when the source is ambiguous.

Admin issuer selectors use a verified directory of active issuing accounts. Explicit issuance targets are resolved for that operation only; they do not change the global workspace. Administrative certificate visibility reflects existing database administrator permissions for all issuer profiles. Normal-user and read-only inspection restrictions remain enforced. Canonical personal issuer names prefer an explicitly saved printed name, then the current account name; blank fallbacks are synchronized when an administrator updates a user name.

Paired rawis are displayed as one qiraah in profile counts; unmatched rawis remain individual riwayat. Coverage banners report the total complete readings and explain that a completed Durrah subset does not exclude other saved readings.

Certificate layout balances the entire heading/body/footer composition at 72% of the full geometric-center adjustment, bounded by 12 mm safety margins. Calculations convert preview coordinates back to print pixels; long certificates retain overflow protection rather than shrinking.

Umar's new line-02/03 files initially existed only in the local fonts checkout. They were uploaded with his edited name.svg in fonts commit bf3b892c76424fbf1959bffe3f75fd54cc6950bb. The application refresh successfully discovered nine numbered artwork files. Local file edits require Upload-Changes.cmd before refreshing the website.

Validation includes complete-chain extraction, Arabic vowel-insensitive matching, direct-issuer prefix, unchanged source text, no duplicate shared segments, canonical names, paired counts, explicit administrator targets, read-only boundaries, and scale-independent/no-drift/restrained balancing. Production build and existing heading/workspace suites pass. Browser verification is described in the final task update; no real certificate was published or imported solely as a test.
