# Administration, recipient links and route typography

Administration has separate Users, Issuing shaykhs and Students views. The Students view explicitly links an entered student identity to any application account, including an administrator. A named confirmation dialog shows the account and email before saving. Issuing-shaykh permissions remain independent.

`student_accounts` stores this recipient association without changing an immutable published certificate. RLS permits administrators to manage links and allows each active linked recipient to read only their own published certificates and snapshots. An explicit certificate recipient takes precedence; the link RPC rejects a conflicting recipient. Unrelated users cannot read the link or linked student identity. Backups and restores include associations. The database test uses only rollback fixtures, leaving real links for administrators to choose.

The original proposed linked-student policy was rejected by automatic review because its account restriction was not explicit enough. The applied policy explicitly joins the signed-in account and requires it to be active; isolation and mutation-denial tests pass.

Route editors now offer `bookAuthor` (Sakkal Kitab, primary) and `routeSource` (KSA Regular bold, primary). Names match saved Arabic text ignoring vowels and tatweel; original text offsets are retained. Names must be entered as they occur in the chain. The application does not infer scholarly relationships from a book title. These settings travel through prepared sanads and are frozen in publication formatting. Existing Shatibi/Dani emphasis remains when not overridden for a specified route source.

The actual GSUB and naming tables of both SakkalKitab-Regular.ttf and SakkalKitab-Bold.ttf were inspected locally. Both identify `ss16` as “Tatweel Extension 1”. Certificate Sakkal text enables that feature. It affects the font's supported existing glyph forms; it does not insert new tatweel characters into the source chain.

Default-route coverage across all ten imams (each full qiraah or both rawis) displays القراءات العشر الصغرى. Custom-route holdings do not contribute to that particular label. All seven or all three yield the narrower Shatibiyyah or Durrah summary. Duplicate holdings do not inflate coverage; individual sanad records stay available.

Footer row height is reduced from 24 mm to 20 mm and its heading gap from 2 mm to 1 mm. Native select arrows use one inset RTL/LTR chevron. Text-footer controls are retained as a collapsed optional fallback because missing SVG lines still use those text settings.

Validation: production build, coverage/name-offset tests, adapter recipient-link tests, hosted rollback RLS/link/backup/snapshot tests, and existing route/artwork/heading/workspace suites. Security advisors report no new findings beyond the existing private deny-all tables and previously disabled leaked-password protection.
