# Workspace migration — 29 October 2026

The existing application components remain in use. The original Zite application and source-export branch were not modified.

## Data and ownership

- A complete application-data baseline is stored in `private.application_backups`, protected by RLS with no client grants. It contains account profiles, issuer assignments, shared students, reading catalog, sanads, certificates, immutable snapshots, workspace records, registration counters, original source archive and public verification index. Authentication passwords, sessions and integration secrets are deliberately excluded.
- Verified legacy aliases are retained in a private migration audit. Operational ownership uses the current account/authentication UUID and `issuer_accounts`; no legacy alias is required to authenticate or load the migrated workspace.
- The audited migration corrected three remaining personal sanad references and created two explicitly verified issuer assignments. Other accounts were unchanged, including their names, roles, activation state and historical identifiers.
- Before/after counts: 33 certificates, 27 normalized sanads, 2 shared students, 417 workspace records and 30 legacy snapshot records. Certificate, frozen-snapshot and legacy-snapshot checksums matched the baseline.
- A rollback-only test cleared the historical account alias and confirmed that the current account retained 8 holdings, 2 assigned issuers and access to 33 certificates. The alias was restored by transaction rollback.
- `private.ownership_migration_audit` records the original affected rows, verified aliases, account and baseline backup. It has no application-client access.

The baseline is an application-data rollback source, not an automatic destructive database reset. Standard restore keeps newer records and immutable certificate history. To undo a particular ownership migration, inspect its private audit and restore only its affected rows/assignments from that baseline.

## Personal and administrative access

- The workspace API defaults every account, including admins, to its own issuer assignments.
- The server authorizes against all assigned issuer profiles. The certificate page applies its remembered issuing-shaykh filter locally; it is never transmitted as a global request header.
- Admin inspection resolves the target account on the server, opens read-only, and requires an explicit editing flag for changes. Record lookups and mutations are checked against the resolved scope.
- User management and complete backup remain separate admin operations. Ordinary users cannot select another account or change assignments. Supabase RLS remains enabled; no service key is used by the application.
- Shared student selection remains available to authorized staff. Only the students/certificates list is filtered by its local selected issuer. Additional-shaykh, user and shared-sanad administration uses existing admin/RLS authorization independently of that filter. Personal holdings and received certificates remain account-specific.

## Interface

Right sidebar with saved collapse preference, accessible mobile navigation drawer, certificate-page issuer selector, separate administration cards with counts and assignments, student summaries, mobile certificate cards, desktop certificate table, incremental narrator list, and larger mobile dialogs.

The riwayah color editor provides 38 × 38 px native swatches beside 128 px HEX inputs, immediate rendering, validation, dirty indicators and reset to saved colors. The controls stack on narrow cards and sit side by side where space permits. It saves only when explicitly requested. The compact heading now shares the actual SVG renderer with the print view; the full preview opens an existing matching draft with unsaved colors in read-only mode. Historical finalized snapshots retain their own settings.

Readex Pro is self-hosted for the application. Certificate fonts, metrics, templates, registration numbering, verification tokens and print overflow checks are retained.

The obsolete `QurraPicker` and `SanadTitleText` components were removed after repository-wide searches found no references. Active sanad and certificate editors remain in use. Legacy account choices now deduplicate the same historical identity across differing old email/profile rows without deleting source records.

## Validation

- Production build and TypeScript checks passed.
- Auth, management, registration and workspace-scope tests passed, including forged issuer/account rejection and prevention of read-only mutation endpoints masquerading as reads.
- Rollback-only hosted SQL suites passed for access control, finalization/verification, backup restore, legacy identity linking and issuer assignments.
- Signed-in production checks confirmed personal issuer selection, separate admin counts, read-only inspection, disabled creation in inspection, return to own workspace, mobile drawer navigation, live palette changes, invalid HEX rejection, reset, and rendering of an existing draft certificate without publishing.
- Browser measurements at 320, 375, 390, 430, 768 and 1440 pixels confirmed the expected card/table/sidebar breakpoints, Readex Pro, and no page-wide horizontal overflow.
- New student/certificate writes and finalization are exercised using rollback-only fixtures, not artificial permanent certificates in the live registry.

Google branding review/custom auth hostname is a separate provider-side process. A deployed application or saved branding form alone does not prove Google's verification is complete.

## Certificate list and authentic preview follow-up

- Advanced filters are collapsed on desktop and mobile. Search, result count, active-filter count, removable chips, Clear All and all existing sort modes remain available. Filters are versioned, scoped by acting account/target account/issuer, expire after four hours, and discard unavailable choices with a notice. Editing state remains separate from filtering state.
- Personal certificate cards and table rows prioritize the student name and show a 13 px concise reading/route summary, one completion date and a small status. Issuer identity remains in details, print and administrative inspection. Preview and Edit stay visible; draft deletion is under a keyboard-accessible menu and confirmation.
- `CertificateHeading` is shared by print and compact previews, including the original basmalah, ijazah, imam, rawi and route masks and original millimetre dimensions. The compact frame scales the complete heading uniformly. Full-qiraah selection previews both rawis because the existing issuance workflow creates two certificates.
- Draft previews resolve current text without persisting a refreshed sanad. Unsaved palette preview cannot finalize. Published rendering prioritizes its snapshot heading and preserves historical route behavior. A custom route without matching artwork uses the existing formal text fallback rather than displaying an incorrect standard-route SVG.
- Automated tests passed for filter persistence/expiry/stale choices, selected-route summaries, Qalun/Warsh SVG selection and dimensions, paired rawis, palette changes and historical-route selection. The production build and TypeScript check passed.
- Signed-in production checks confirmed filter collapse/chips/count/navigation persistence; Qalun and Warsh full SVG previews; unsaved palette colors with disabled approval; reset; paired qiraah previews before saving; and the deletion confirmation cancelled without deleting. Matching compact/print glyph dimensions were measured in the browser. No physical printer or PDF export was exercised in this follow-up.
- Responsive checks covered 320, 390, 430, 768 and 1440 px. Readex Pro and 13 px summaries were confirmed; compact headings and controls remained within the viewport. Swatches measured 38 × 38 px and HEX inputs 128 × 38 px; controls stacked on narrow mobile and shared a row on tablet/desktop. Live SVG color changes and reset were verified after deployment.
- Certificate checksum remains `5e94aefd83bb5d4bc63d681678897f97` for all 33 records; the frozen-snapshot table remains empty. No certificates were created, deleted, published or renumbered during these checks. Published-snapshot cases are covered by fixtures because there are no finalized certificates in the live dataset.
- Application releases: `f9ad06b970de954944d80017be0b66cdedda26c2` (filters/cards/shared heading) and `a7ab0f831ab4913917ebaf35fc4209c190e3de98` (compact color toolbar), both confirmed successful by Vercel.

## Local certificate filter correction

The global selected-issuer state, context field and request header were removed. Assigned issuer IDs remain authorization boundaries, not UI filter state. Administrative directory endpoints resolve their existing admin/RLS access independently; normal users and read-only inspection retain their restrictions. The certificate-only dropdown, count and chips persist across navigation. Creating a certificate can use that local choice as its initial issuer, passed explicitly to the form.

Verified in production: select Zakaullah (33 certificates), navigate to all 3 additional profiles and both application accounts, then return to the same selected filter. The shared narrator registry loads 194 names; shared sanad management loads independently. The current database has 35 certificates and 29 sanads after intervening application use; all 35 certificates had matching before/after checksum `cd62aaf7ee7701492c6b8c48ad06061a` during this correction. No ownership, assignments, RLS policies or data were changed. Build, auth, management, numbering, filter, scope and database-adapter regression checks passed. Release: `e1b94913055ff7c51a81ef5d41f74f9a75635ca7`.

## Personal mujeez profiles and year-first numbering

A later explicit user request approved changing existing draft registration numbers as well as future numbers. A complete private data backup was taken before the migration. All 35 drafts changed from issuer/year to year/issuer in the first group (for example `0126-1002` → `2601-1002`); their suffixes, completion dates, issuer relationships, status and every other certificate field were unchanged. Finalized rows are excluded. Reservation/finalization and the standalone SQL fixtures now use the same year-first rule, with the same annual counter key and exhaustion limit. The private backup retains the old/new mapping.

Active administrators now have separate personal issuer profiles, assigned only to themselves. Existing administrators were backfilled using their saved print names/account names; future own-name/footer saves synchronize the same personal profile idempotently. Personal codes are allocated without changing existing codes. No certificates were moved to these profiles. Account cards distinguish personally issued counts from records under management, and the certificate selector includes the personal profile. Login roles and activation states remain unchanged.

The migration and rollback-only tests passed for numbering, repeated reservation, annual sequence reset, finalization snapshot, personal-profile idempotence, spoofed owner rejection and non-admin rejection. Earlier issuer-isolation, immutable snapshot and shared-student SQL suites also passed. Build and database-adapter tests passed. Security advisors reported only the existing private deny-all tables and existing leaked-password-protection configuration. Production checks showed zero personally issued certificates for both administrators, all managed records retained, the personal issuer selectable/defaulted in its own creation form, and `٢٦٠١-١٠٠٢` in the actual draft print renderer with the original Zakaullah artwork. No test certificate was retained.

## Requested code order and GitHub SVG refresh

The user requested Zakaullah 01, Owais 02, Muzakkir 03, Umar 04 and Sharaf 05. A new complete private backup preceded the transactional swap. Only Sharaf had a draft affected by the changed codes; that number was updated to the year-first YY05 prefix based on its completion year. Comparing all 36 current certificates with the backup found no other field changes. Active administrator roles already authorize management of every additional profile, so their assignment lists/buttons and managed-record counts were removed from account cards; personal mujeez codes are shown instead. Normal-user assignment controls remain available.

New profile allocation follows the highest code with a minimum next code of 06. Rollback tests verified 06/07 and confirmed management access for every active administrator without retaining fixtures. GitHub artwork now loads by a stored exact commit revision, while the configured branch remains main. The admin source panel has an explicit refresh action that resolves the latest public GitHub commit and saves it only after a successful lookup. Refresh/save remains forbidden in read-only account inspection. This avoids stale branch-based CDN SVGs and includes the revision in normal application-data backups.

Production verification confirmed the simplified admin cards show personal codes 03/04 without extra-shaykh assignment controls. The actual certificate preview loads all three Zakaullah masks from the latest GitHub commit revision and visibly renders the updated SVGs. Build and read-only refresh/save regression checks passed; Vercel confirmed the production deployment ready.

A subsequent certificate-list visibility fix includes every additional-shaykh profile already authorized by the administrator role in the admin certificate workspace. Explicit account assignments still govern normal users, personal issuer profiles and account inspection. This resolves a newly issued Sharaf draft being saved successfully but excluded from the issuing administrator’s list. There is no selected issuer in global context or requests; the dropdown remains a local list filter. Tests cover both administrator identities, exclusion of an unrelated personal issuer, unchanged normal-user access and read-only inspection. No database ownership or permission rows changed.

Production certificate-list verification showed Sharaf available in the local selector and both existing drafts visible (2505-1001 and 2505-1002, completion year 2025). The total authorized additional/personal workspace contains 37 certificates after the user’s intervening creation activity.

