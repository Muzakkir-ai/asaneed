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
- The selected issuer is checked on the server for every request; the browser's remembered choice grants no permissions.
- Admin inspection resolves the target account on the server, opens read-only, and requires an explicit editing flag for changes. Record lookups and mutations are checked against the resolved scope.
- User management and complete backup remain separate admin operations. Ordinary users cannot select another account or change assignments. Supabase RLS remains enabled; no service key is used by the application.
- Shared student selection remains available to authorized staff. Primary workspace lists are scoped to the selected issuer.

## Interface

Right sidebar with saved collapse preference, accessible mobile navigation drawer, explicit issuer selector, separate administration cards with counts and assignments, student summaries, mobile certificate cards, desktop certificate table, incremental narrator list, and larger mobile dialogs.

The riwayah color editor provides native swatches, complete HEX inputs, immediate sample rendering, validation, dirty indicators and reset to saved colors. It saves only when explicitly requested. Historical finalized snapshots retain their own settings. The sample is not the actual certificate renderer.

Readex Pro is self-hosted for the application. Certificate fonts, metrics, templates, registration numbering, verification tokens and print overflow checks are retained.

## Validation

- Production build and TypeScript checks passed.
- Auth, management, registration and workspace-scope tests passed, including forged issuer/account rejection and prevention of read-only mutation endpoints masquerading as reads.
- Rollback-only hosted SQL suites passed for access control, finalization/verification, backup restore, legacy identity linking and issuer assignments.
- Signed-in production checks confirmed personal issuer selection, separate admin counts, read-only inspection, disabled creation in inspection, return to own workspace, mobile drawer navigation, live palette changes, invalid HEX rejection, reset, and rendering of an existing draft certificate without publishing.
- Browser measurements at 320, 375, 390, 430, 768 and 1440 pixels confirmed the expected card/table/sidebar breakpoints, Readex Pro, and no page-wide horizontal overflow.
- New student/certificate writes and finalization are exercised using rollback-only fixtures, not artificial permanent certificates in the live registry.

Google branding review/custom auth hostname is a separate provider-side process. A deployed application or saved branding form alone does not prove Google's verification is complete.
