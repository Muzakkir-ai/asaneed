# Asaneed independent foundation

Status: Supabase foundation provisioned and permission tests passed. Independent app source prepared. Hosting, repository publication and real-account activation are pending. No live Zite data moved or Zite changes made.

## Ownership and hosting

- Code: the user-approved public GitHub repository `Muzakkir-ai/asaneed`.
- Hosting: the connected Vercel team `Halaqaat`.
- Database and authentication: Supabase project `sqyookpdpymgpwpnicyp` in the approved Muzakkir's Org.
- One independent Next.js application can serve public verification and private administration against the same database.
- Keep standard PostgreSQL migrations and portable backups in the repository so hosting can be changed later.

## Access model

Login accounts and issuing mashaykh are different entities. An issuer can exist without a login. Explicit account-to-issuer assignments grant management access. Zakaullah remains issuer code 01 independently of any account ID.

Administrators manage accounts and assignments. Active assigned shaykhs manage their own issuer records. Active staff can select students from a shared name directory; this does not grant access to other issuers' private certificates. Student access is limited to explicitly linked certificates. Public visitors can retrieve only a minimal published verification result through a controlled lookup, never enumerate private tables.

## Migration contract

The source schema is archived in `source-reference/zite.schema.json` (23 source tables). Preserve legacy record IDs, verification tokens, registration numbers, relationships, completion dates, print profiles and certificate snapshots. Old Zite auth IDs remain external identity references; they must not be cast to Supabase auth UUIDs. Passwords and sessions require a separate account activation process.

Keep all source tables in the migration inventory, including numbering ledgers, versions, templates, assets and extra-shaykh reading sanads. A database export alone is insufficient: include locally owned font/SVG binaries, configuration without secrets, storage files and restore instructions. Test restoring into a separate database before switching traffic.

## Data integrity requirements

- Registration format: XXYY-RRNN, using completion year and a counter per issuer, year and riwayah. Display Arabic-Indic digits in left-to-right group order.
- Allocate numbers atomically in PostgreSQL with uniqueness constraints; reject exhausted two-digit counters.
- Finalized snapshots are immutable. Editing shared sanads must only refresh drafts.
- Enable row-level security on every exposed table and test anonymous, inactive, student, shaykh and administrator access separately.
- Keep original Arabic names; maintain a normalized search representation that ignores vowel marks and tatweel.

## Stage-one acceptance checks

1. A dedicated repository and Vercel project exist under the user's accounts.
2. Supabase project ownership and any cost are confirmed before provisioning.
3. Versioned schema, least-privilege permissions and account activation work in isolation.
4. Public and private access boundaries pass database tests.
5. A preview deployment works; Zite remains operational until a later verified cutover.
