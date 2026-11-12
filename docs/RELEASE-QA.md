# Release QA and recovery

## Baseline

| Item | Evidence |
| --- | --- |
| GitHub main, 10 November 2026 Riyadh | `292dc0d5dbd27556b4004051b782cc369946c21d` (#110) |
| Production alias, checked through deployment metadata | READY, `dpl_5DsCbAEKSvZUEwNEVtTChLqTwybA`, same source SHA |
| Chat 12 checkout | `audit/chat12-release-c1ae83cba1a2` |
| Candidate | Pending. Open PRs #79 and #106 concern diagram text and screenshots. Neither supplies the required issuance or verification changes. |
| Source migration tip | `20261105213349_reviewed_narrator_aliases.sql`. Hosted history and schema parity pending. |

## Baseline test evidence

Clean checkout, Node 24.22.1, pinned lockfile, no hosted credentials.

| Check | Result |
| --- | --- |
| `npm ci`, `npm run typecheck`, `npm run build` | Pass |
| Registration normalization, issuance target, received transmission, certificate route choice | Pass, standalone TypeScript fixtures |
| `test:account-setup`, `test:personal-sanads`, `test:shared-bridge`, `test:certificate-layout` | Pass |
| `test:sanad:graph` | Pass, synthetic Chromium fixtures at desktop and mobile widths. |
| `test:sanad` | Fail. Layout fixture expects one fan-in and gets four single routes. The suite stops at that assertion. Chat 06 should reconcile the fixture and routing policy. |
| `test:matn-heading` | Fail at the certificate-format fixture. Its loader substitutes an empty object for the heading schema import, then hits `.nullable()` on an undefined schema. Running the downstream fixtures independently also found the same loader issue in draft Matn refresh. Other downstream Matn persistence, API and print fixtures passed. Chats 05/09 should coordinate fixture repair. |

## Integration order

Record each candidate's PR, reviewed head SHA, dependencies, test results and migration impact. Integrate on a dedicated branch after review. Use Chat 02 for activation and account scope, Chat 03 for ordered selection and assembly, Chat 04 for lifecycle and snapshot persistence, Chat 01 for public lookup, and Chat 05 for new output without QR and historical parity. Run the issuance-to-lookup scenario after all four issuance, verification and print changes land together. Bring in Chats 06–10 after reviewing conflicts in shared components and access code. Use Chat 11's pilot gates after QA sign-off.

## Synthetic scenario matrix

| Gate | Role and steps | Expected result | Status |
| --- | --- | --- | --- |
| Activation and recovery | Admin creates a setup code in staging. Synthetic user claims it via the test inbox, retries the code and exercises password recovery. Test expired and wrong-account codes. | One claim, correct account and role, existing active credentials and other accounts protected. | Pending staging |
| Access and inspection | Sign in as admin, two issuers, and a linked recipient. Inspect another account read-only. Replay writes with changed target/variant IDs. | Only authorized explicit issuer targets work. Read-only inspection cannot mutate. Recipient sees only linked issued records. | Pending staging |
| Multi-sanad draft | Save A and B for one issuer and riwāyah. Select B then A, save, close, reopen, and preview. Repeat with an older single-selection draft, a deleted variant, and a variant from another issuer or riwāyah. | B/A order survives; diagram and text show distinct branches, appropriate ح, exact tashkīl and reviewed continuation IDs. Legacy single selection loads. Invalid targets fail visibly. | Pending Chats 03/04 |
| Issuance and numbering | Finalize the two-branch draft twice concurrently, including with issuer serial above 99. Change the source afterward and reload issued output as issuer and recipient. | One immutable issued result; valid YYSS-NNRR; both branches frozen in order; no duplicate allocation on retry; stable issuer/student IDs. | Pending Chats 03/04 |
| Number-only verification | On empty staging, submit a valid-shaped number. After issuing the synthetic certificate, look it up in Western, Arabic-Indic, and Persian digits. Try malformed input, unknown number, and an unissued reserved draft number. | Preparing only for an empty register; eligible exact match, invalid input, and no match are distinct; only public projection fields and no-store. Historical links still resolve. | Audit observed preparing and invalid input on production. Issuance-to-lookup pending Chats 01/04. |
| Print/export | Open preview, print and export a new dense Qirāʾāt and short Matn certificate. Compare an existing issued QR-bearing fixture. | New output omits QR controls and block; registration number, spacing and typography remain usable; historical snapshot output is preserved. | Pending Chat 05 |
| Diagrams | Open comparative, personal, and Qurra-stage fixtures at desktop and mobile widths. Compare edge IDs, direction, routes, and generated text. | Clear ports and cards, eligible shared buses, correct stage and identities, and no changes to source relationships. | Pending integrated preview |
| Operational privacy | Trigger lookup errors and denied issuer writes in staging and inspect diagnostics. | Correlation ID, route/status and sanitized error category are enough to diagnose. No raw lookup numbers, student names, sanad contents, passwords, tokens, setup codes, or snapshots in logs. | Pending staging |

## Release and recovery gates

1. Pin the candidate SHA and compare ordered migration versions with the isolated staging database. Investigate missing, extra, and modified migrations and compare schema/RLS against a fresh migration replay. Record sanitized evidence before any production authorization.
2. Rehearse a backup and restore into a separate disposable database. Verify certificate, snapshot and verification-projection counts and hashes, linked IDs, issuer counters, and representative role-denial cases. Record backup timestamp, restore duration and verification result in private operational notes.
3. Verify the previous READY deployment SHA is compatible with the candidate schema. For rollback, rehearse reverting application code in staging while preserving issued records and reservations. For incompatible database changes, require a reviewed forward repair or a separately authorized restore plan with reconciliation of writes since backup. Record the recovery owner and decision before release.
4. Sign off only after the integrated role and issuance-to-lookup checks pass against a recorded candidate and isolated fixture set. Record the preview deployment SHA when available. The current baseline is not a release sign-off.

## Integrated candidate · 10 November 2026

Main was rechecked through GitHub at `292dc0d5dbd27556b4004051b782cc369946c21d`. The candidate branch is `audit/chat12-integration-c1ae83cba1a2`. The earlier baseline PR is [#111](https://github.com/Muzakkir-ai/asaneed/pull/111). This candidate has no deployment SHA.

| Source | Reviewed head | Integration |
| --- | --- | --- |
| [#113](https://github.com/Muzakkir-ai/asaneed/pull/113) | `c1783e8b8e7fe212d4e362407a6e1bf99511a680` | New number-only preview, print, export and frozen settings. Historical render modes retained. |
| [#114](https://github.com/Muzakkir-ai/asaneed/pull/114) | `5abb40bcb404a9746251e6255756382b095e99e6` | Ordered draft branches, reviewed continuation IDs, legacy single selection and snapshot provenance. |
| [#115](https://github.com/Muzakkir-ai/asaneed/pull/115) | `764d2b8ba31003643778ecf3f5575d020d5dbdb9` | Exact lookup and field allowlist. Projection grants restricted by `20261109221703`. |
| [#118](https://github.com/Muzakkir-ai/asaneed/pull/118) | `7ae075d1452e27ab5f33f30ce293d407f9b13666` | Issuer-first approval lock order and immutable retry via `20261110082014`. |
| [#119](https://github.com/Muzakkir-ai/asaneed/pull/119) | `65a55fbd6d51493bed360a83a21c66f437b0e86b` | Published shared Matn templates only. Personal and legacy sources retained. |

Finalization preserves both ordered provenance and the number-only setting, and returns the existing snapshot on authorized retry. The overlapping Matn fixtures now test stale QR settings, publication gating, catalog refresh with personal overrides, and retry immutability together. The README follows the annual issuer sequence and draft completion-date ordering implemented in migrations `20261101105550` and `20261101163930`. The earlier baseline used the superseded lifetime description.

| Candidate check | Result |
| --- | --- |
| Clean install, typecheck, production build | Pass |
| `node tests/public-verification.test.cjs` | Pass. Actual endpoint handlers use synthetic application storage and a disposable PGlite database for number reservation, approval, frozen snapshot reads and anonymous RPC. A two-sanad Ḥafṣ draft reloads in the selected order after a source is removed. Its reserved number is hidden before finalization. A stale QR request freezes number-only output with the original branch text and provenance. Retry returns the same number and stored snapshot. The anonymous HTTP response returns only public fields for that same certificate. |
| Historical compatibility | Pass in the same fixture. The pre-migration QR snapshot and token compare equal after both migrations. Anonymous and authenticated token RPC calls still resolve the issued certificate. Anonymous raw table and direct projection access are denied. |
| Matn heading, Matn catalog database, certificate layout, personal sanads, shared bridge, account setup | Pass. The Matn database fixture also exercises its backup and restore path. |
| Certificate layout Chromium/PDF | Blocked locally. The synthetic Next.js page served successfully, but Chromium could not start because its process socket was denied. The existing GitHub Actions workflow can run the fixture on a hosted runner. |
| `npm run test:sanad` | Same failure as main. The geometry fixture expects one fan-in and receives four single routes. The routing fix is outside this certificate candidate. |
| Integrated staging and recovery | Open. The local migration replay skips the production-only issuer correction and does not establish hosted schema parity. Separate-session concurrency on the combined candidate, authenticated browser role flows, physical print and native iOS export, and a full application backup/restore and previous-app rollback rehearsal remain release gates. The public exact lookup still needs a decision on abuse controls at both HTTP and direct RPC. |

The synthetic integration fixture runs in one process. Its local transport adapts fixture storage to SQL and does not validate the hosted workspace adapter or Supabase Auth. Chat 04's two-session concurrency evidence applies to its source PR. No hosted data or infrastructure was changed.

## PR #121 release QA follow-up · 10 November 2026

Reviewed the 41-file candidate at `fd36d957f5917bfb54db291583f4e0ada4fbfa92` against GitHub main `292dc0d5dbd27556b4004051b782cc369946c21d`. This follow-up adds evidence and a disposable database fixture. The app, migrations, and diagram geometry are unchanged.

| Check and command | Result |
| --- | --- |
| GitHub Actions `npm run test:personal-sanads`, `node tests/ordered-sanads.test.cjs`, `node tests/public-verification.test.cjs` | Pass at the reviewed candidate SHA, along with install and typecheck. [Sanad editor run](https://github.com/Muzakkir-ai/asaneed/actions/runs/42826676642) |
| GitHub Actions `npm run test:certificate-layout` and `node tests/certificate-layout-browser.test.cjs` | Pass. Chromium checks A4 landscape PDFs, draft save/reset, responsive preview, number-only draft output and historical QR/hidden/number render modes. The successful hosted runner resolves the local Chromium launch blocker for this fixture. [PDF run and synthetic artifacts](https://github.com/Muzakkir-ai/asaneed/actions/runs/42826676478) |
| `node tests/release-qa-postgres.test.cjs` — access and approval | Pass on local PostgreSQL 18.6. Assigned issuer can read and approve; linked recipient sees only the finalized certificate and snapshot. Unrelated issuer and recipient cannot read or approve; an assigned account without issuance capability cannot approve. A second session visibly waited on the first approval's database lock and returned the same registration number. Concurrent approvals of two other drafts allocated different numbers. The first snapshot won and stayed frozen. |
| Same fixture — migration parity | Pass. All 44 migrations applied in a fresh replay and in a main-to-candidate upgrade. The old issuer-code correction used synthetic prerequisite rows at the IDs specified in that migration. Compared public/private functions and grants, policies, relation privileges and RLS flags, and column definitions. The upgrade preserved the pre-existing QR snapshot, certificate ID and verification token. |
| Same fixture — backup and restore | The JSON restore initially failed atomically with `23505` because a fresh migration replay seeded issuer code `02` under a different ID. After removing only the empty target's synthetic placeholder and assignment, restore passed in the separate disposable database. Compared four certificates, snapshots, projections, annual allocations and counters, recipient isolation, anonymous number lookup and the historical token. A real recovery needs an approved plan to reconcile seeded issuer IDs in the restore target. |
| Same fixture — scoped database rollback | Pass. Restored main's finalization function in the disposable target while keeping the verification hardening. Main's function returned its expected already-finalized error on retry and the original number, snapshot, and projection stayed unchanged. Reapplying the candidate function restored successful retry behavior. Historical token and anonymous number lookup still passed. |
| `npm run test:sanad` at clean main | Reproduced the candidate's baseline failure in `sanad-path-layout.test.ts`: four single routes where the fixture expects one fan-in. Layout changes remain separate. |

### Reproduce the native database checks

Use PostgreSQL 18.6 binaries and a fresh local data directory. The fixture refuses servers whose data directory and disposable marker do not match. It creates and drops two uniquely named databases on the same loopback-only server, and uses a minimal synthetic Auth schema.

```sh
qa_dir="$(mktemp -d)"
npm install --prefix "$qa_dir/client" --no-save --no-audit --no-fund pg@8.23.1
initdb -D "$qa_dir/pg" -A trust --no-locale -E UTF8
pg_ctl -D "$qa_dir/pg" -l "$qa_dir/postgres.log" \
  -o "-h 127.0.0.1 -p 35432 -k '' -c asaneed.qa_disposable=release-qa" start
ASANEED_QA_DATA_DIR="$qa_dir/pg" NODE_PATH="$qa_dir/client/node_modules" \
  node tests/release-qa-postgres.test.cjs
pg_ctl -D "$qa_dir/pg" stop
```

### Remaining release gates

No authorized staging database was confirmed isolated from production. Hosted migration history and schema parity, browser sign-in through Supabase Auth, role-based Workspace and recipient flows, and the full previous-app rollback against the candidate schema remain open. The local restore rehearsed application JSON recovery only. Provider-level backup/PITR, restore timing at real scale, post-backup write reconciliation and the issuer seed collision need an operational plan. Physical print, native iOS export and abuse controls for public HTTP and RPC lookup are also pending.

## Hosted release gates · 10 November 2026

Read-only inventory against candidate `e441e609cfa6546959396982d60a1d013b786a20`. The Vercel team inventory returned one Asaneed project, zero deployments for the candidate branch and no custom staging environment. Project settings assign the same unscoped `NEXT_PUBLIC_SUPABASE_URL` entry to Production and Preview, with no candidate branch override returned. Existing Preview URLs therefore do not establish database isolation. Supabase project and branch inventory calls were unavailable, so no separate database was independently identified. No hosted application login, database query, migration, deployment or recovery action was performed.

| Hosted release gate | Status | Evidence or missing prerequisite |
| --- | --- | --- |
| Candidate app and database isolation | Blocked | Need a staging URL pinned to the candidate and a separately verified Supabase project or branch for Database and Auth, with synthetic-only data and test credentials. Verify runtime environment mapping and recovery scope before any write. |
| Hosted migration parity | Blocked | Need read-only access to the isolated migration ledger and schema catalogs to compare migration order, functions, grants and RLS with the repository replay. Local parity passed. |
| Signed-in issuer and recipient flow | Blocked | Need authorized synthetic issuer, linked recipient and unrelated control accounts in isolated Auth, plus two approved synthetic sanads for one riwāyah. Exercise ordered draft reload, approval and retry, recipient visibility and anonymous number lookup. |
| Full app rollback | Blocked | Need a staging-only routing or rollback control, candidate and previous app builds, and the isolated candidate schema. Verify both builds against the same issued snapshot and historical token. The local SQL function rollback passed. |
| Provider-level recovery | Blocked | Need confirmed backup or PITR coverage for the isolated project, recovery permissions, a separate disposable restore target and a plan to reconcile seeded issuer IDs. Measure restore and validate IDs, counters, snapshots, tokens and role boundaries. The local JSON restore is separate evidence. |

## Isolated staging rehearsal — 10 November 2026

Candidate Preview `asaneed-gb7t6dhuj-halaqaat.vercel.app` is READY at `ea8e3364094b67867d1d89a257901d8d760527a8`. Its branch-specific Preview URL and publishable key match the separate `asaneed-staging` Database and Auth project. The Preview login page returned HTTP 200 through Vercel-protected access. The live alias still resolved to `292dc0d5dbd27556b4004051b782cc369946c21d`. The first hosted inventory above records the earlier state.

| Hosted release gate | Status | Evidence or missing prerequisite |
| --- | --- | --- |
| Candidate app and database isolation | Pass | Vercel deployment metadata, scoped environment settings, and Supabase inventory show separate project references. The staging settings predate the Preview build. |
| Hosted migration parity | Blocked | 26 of 44 files applied in repository order through Supabase Apply Migration. The ledger matched the first 26 source filenames. The provider generated its own version timestamps and the repository filenames were recorded in the names. Migration 27 (`20261031152251_lifetime_issuer_certificate_numbers.sql`) awaited provider confirmation and expired twice. There are 18 files still pending and the migration 27 allocation relation is absent. Compare the complete ledger and schema, grants and RLS after replay. |
| Signed-in issuer and recipient flow | Blocked | The schema replay must finish first. The protected login page returned HTTP 200, but Chromium did not start in the disposable runner. The staging counts were zero certificates, zero snapshots and one synthetic Auth prerequisite. No authenticated flow or certificate issuance was attempted. |
| Full app rollback | Blocked | Finish candidate schema replay and synthetic issuance, then provision a baseline Preview scoped to the same staging database and rehearse switching a staging-only alias. The local SQL-function rollback is separate evidence. |
| Provider-level recovery | Blocked | The staging organization is on Supabase Free, which provides no managed daily backup or PITR. A recovery rehearsal needs managed backup coverage and a separate disposable restore target. The local application JSON restore is separate evidence. |

The foundation issuer seed used a synthetic name and no legacy ID. The earlier issuer-code correction used three synthetic placeholders at its fixed prerequisite IDs. Migration 27's backup requires an active administrator, so staging has one synthetic administrator with an unroutable email and no configured password. No production rows were copied.

### Resume and verify

1. Use Supabase `list_migrations` for staging only. Check that the 26 names match the sorted repository filename prefix. Read the zero certificate and snapshot counts and check `to_regclass('private.certificate_number_allocations')` before retrying.
2. Use Supabase `apply_migration` for `20261031152251_lifetime_issuer_certificate_numbers.sql`. Approve the provider confirmation in the client with the staging target displayed. Continue in filename order after it succeeds and record the final ledger and schema comparison.
3. Run the authenticated issuer and recipient browser flow, the staging-only app rollback, and the separate provider recovery rehearsal once their prerequisites are available.

## Batch follow-up and staging evidence, 12 November 2026

Production and GitHub `main` resolved to `292dc0d5dbd27556b4004051b782cc369946c21d`. The [candidate Preview](https://asaneed-gb7t6dhuj-halaqaat.vercel.app) ran `ea8e3364094b67867d1d89a257901d8d760527a8`. The PR head at the start of this follow-up was `8dc62a8a2b4554b2bc68c181d577a6f046a1fb73`, which differed from the Preview by QA documentation. This follow-up also changes documentation only. The checkpoint above reflects the earlier state.

### Before and after

| Scope | Production baseline | Unmerged candidate or workstream |
| --- | --- | --- |
| Certificates | Single saved sanad selection. Drafts could display or hide the registration number. Approval could deadlock under concurrent requests and could reject an already-issued retry. | Up to five ordered saved sanads, preserved source IDs and branches separated by (ح). New output always includes the registration number. Concurrent approval and retries preserve the first issued snapshot. |
| Verification and Mutūn | Exact-number lookup was present. The initial audit saw 48 drafts and zero issued records. Administrators could load some linked unpublished shared text into a draft. | Lookup uses a restricted projection and a six-field API response. Historical token and QR snapshots are supported. New certificate drafts and approval enforce shared template publication. |
| Formatting | Independent Qirāʾāt SVG controls and simplified Mutūn formatting were already deployed in [#110](https://github.com/Muzakkir-ai/asaneed/pull/110). | The certificate candidate enforces number-only presentation for new snapshots and preserves their formatting. |
| Accounts, routing, Qurra, and registry | Inspection could allow an issuer-assignment write. Skipped-rank edges could cause partial merges. Qurra route labels could collide and the registry inferred relationships from names. | Separate drafts address inspection permissions, graph layout, labels and source attribution. These are outside the validated certificate candidate. |

### Workstream status

| Chat | Draft PR and inspected head | Result and remaining work |
| --- | --- | --- |
| 01 | [#115](https://github.com/Muzakkir-ai/asaneed/pull/115) `764d2b8` | Exact lookup and privacy fixtures passed. Hosted issued/draft/unknown and historical-token checks passed. Shared abuse protection for HTTP and direct RPC remains open. |
| 02 | [#116](https://github.com/Muzakkir-ai/asaneed/pull/116) `077f7a7` | Inspection-write fix and local onboarding/RLS tests are reported. Hosted setup, recovery, role matrix, and assignment checks remain open. Diagram workflow fails on the baseline assertion. |
| 03 | [#114](https://github.com/Muzakkir-ai/asaneed/pull/114) `5abb40b` | Ordered selection and additional-shaykh reload fixes pass targeted CI. Hosted two-Ḥafṣ-sanad save, reload, approval and ordered snapshot passed. Complete hosted browser coverage for five selections remains open. |
| 04 | [#118](https://github.com/Muzakkir-ai/asaneed/pull/118) `7ae075d` | Approval locking and retries passed locally and in hosted requests. Stable-ID handling for same-name students and recipient import remain open. |
| 05 | [#113](https://github.com/Muzakkir-ai/asaneed/pull/113) `c1783e8` | Number-only output, historical QR fixture and Chromium PDF regression passed in CI. Hosted formatting save, reload and restore passed. Physical print and native iOS remain open. |
| 06 | [#117](https://github.com/Muzakkir-ai/asaneed/pull/117) `b9cf5f1` | Routing and graph workflows passed. The original signed-in comparative diagrams still need desktop and mobile review. |
| 07 | [#112](https://github.com/Muzakkir-ai/asaneed/pull/112) `dd5fb0e` | Route labels and stable IDs passed the visual workflow. The Qurra workflow failed on the same fan-in assertion as main. Live scholarly source fallbacks remain under review. |
| 08 | [#120](https://github.com/Muzakkir-ai/asaneed/pull/120) `2215adf` | Registry fixes and >2,000-row pagination tests are reported. Private record-level alias and continuation evidence, plus hosted RLS, remain open. |
| 09 | [#119](https://github.com/Muzakkir-ai/asaneed/pull/119) `65a55fb` | Publication restrictions and local Mutūn tests are reported. Signed-in catalog refresh, review and linked-draft permissions remain open. |
| 10 | None verified | Local accessibility fix reported at `378c54f`. Its branch, PR and visual browser results could not be verified. |
| 11 | None verified | Invite-only pilot plan and private reporting workflow were reported complete. Launch remains gated. No code commit or PR was reported. |
| 12 | [#121](https://github.com/Muzakkir-ai/asaneed/pull/121) `8dc62a8` | Certificate candidate remains a draft. Integration CI, isolated staging migration parity, hosted issuance, and application rollback passed. See remaining gates below. |

Drafts #111–121 were open and unmerged when reviewed. The cross-chat history search supplied earlier reports for Chats 10–11. Live access and outbound messages to the original chats were unavailable, so their current activity could not be confirmed.

### Release gates

| Gate | Status | Evidence |
| --- | --- | --- |
| Staging isolation | PASS | Preview-only branch settings matched the separate `asaneed-staging` URL and publishable key. The baseline rollback Preview used its own staging-scoped branch settings. |
| Hosted migration parity | PASS | Supabase approved and applied migration 27, then applied 28–44 in repository order. All 44 recorded names matched the source sequence. The connector assigns execution-time versions, with the original filenames preserved as migration names. A fresh replay of all 44 with pinned PGlite 0.5.15 matched the hosted catalog fingerprints for 200 columns, 89 function bodies and security settings, 89 function grant entries, 71 policies, 35 relation and RLS entries, and 33 relation grant entries. |
| Hosted issuer and recipient lifecycle | PASS | Three synthetic roles authenticated and reached hosted Studio. Workspace endpoints verified two ordered Ḥafṣ sources, (ح), draft save and reload, formatting save and reset, unpublished denial, simultaneous approval, stable registration allocation, immutable retry, linked recipient access and unrelated-account denial. The first draft fixture shared an issuer with a historical fixture that lacked a legacy sequence value. The application rejected numbering. A separate synthetic issuer let the new-certificate scenario run while preserving the historical fixture. |
| Public verification and legacy token | PASS | Anonymous hosted lookup returned the six allowed fields for the issued number, hid drafts and unknown numbers, and resolved the historical token. Direct projection SELECT was denied to both anonymous and authenticated roles. Anonymous finalization was denied. The historical snapshot kept QR mode and the new snapshot kept number-only mode. |
| Coordinated abuse controls | BLOCKED | Direct RPC and HTTP verification can still be called without a shared request budget. Chat 01 needs an approach covering both entry points with legacy links preserved. |
| Candidate Chromium PDF regression | PASS | [Certificate PDF workflow](https://github.com/Muzakkir-ai/asaneed/actions/runs/42852274810) and [sanad editor workflow](https://github.com/Muzakkir-ai/asaneed/actions/runs/42852274611) passed on the inspected PR head. The Preview commit also had green runs. |
| Hosted browser and physical print | FAIL | Browser sign-in and the recipient list passed at 1280 px and 390 px, with no horizontal overflow at 390 px. Opening the received certificate returned HTTP 200 for print authorization, then Chromium closed the page before the paper appeared. The same result reproduced on the previous staging build with the same snapshot. The cause is unresolved. Hosted PDF rendering, physical A4 printing and native iOS export remain unverified. |
| Diagram regression | FAIL | [#112](https://github.com/Muzakkir-ai/asaneed/actions/runs/42711082640) and [#116](https://github.com/Muzakkir-ai/asaneed/actions/runs/42741867295) each failed `test:sanad` at the baseline fan-in assertion, with four independent paths where the test expected one fan-in. [#117 routing](https://github.com/Muzakkir-ai/asaneed/actions/runs/42782027565) and [graph](https://github.com/Muzakkir-ai/asaneed/actions/runs/42782027277) workflows passed. Keep routing outside the certificate candidate. |
| Application backup and restore | PASS | The existing disposable local rehearsal compared IDs, snapshots, counters, allocations, tokens and role boundaries. Restore initially rolled back on a duplicate issuer code tied to different IDs. It passed after reconciling the empty target's synthetic placeholder and assignment. Any operational restore must preflight issuer codes against stable IDs before restoring. |
| Hosted app rollback | PASS | Moved the dedicated staging alias from candidate `ea8e336` to baseline `292dc0d` and back. All three requests through that alias returned the same authorized recipient snapshot hash, public number result, and historical token result. Both app versions used the same isolated candidate schema. Production alias still resolved to `292dc0d`. |
| Supabase-managed recovery | BLOCKED | The staging organization is on Free, which has no managed daily backups or PITR. To test managed recovery, use an isolated project with appropriate backup coverage and a separate disposable restore target. For a Free-plan operating procedure, use encrypted off-site logical dumps of schema, data and migration history, and rehearse restoration with the required Auth configuration and issuer-ID preflight. [Supabase backup guidance](https://supabase.com/docs/guides/platform/backups) |
| Production release approval | BLOCKED | Finish the open hosted browser and operational gates and obtain separate owner approval. The integration PR is still draft. |

### Integration and reproduction

- `git merge-tree --write-tree <candidate> <workstream-head>` found only `docs/CURRENT-STATE.md` conflicts for #112, #116, #117 and #120, tested individually against the certificate candidate. Preserve both handoff entries when reconciling. Verify combined CI if those scopes are later selected. The existing certificate PR already contains #111, #113, #114, #115, #118 and #119.
- For migration parity, use `list_migrations`, compare the ordered filename stems, replay the repository migrations in a disposable database using the synthetic prerequisites documented above, and compare normalized `pg_proc`, `pg_policies`, `pg_class`, `information_schema.columns`, and effective anonymous/authenticated grants. Exclude extension-owned objects when comparing the application catalog.
- For lifecycle, authenticate with the isolated Auth project and use the hosted `prepareIjazah`, `saveCertificate`, `certificateDraftPreview`, `certificateDraftFormatting`, `finalizeCertificate`, `myCertificates` and `certificatePrintAuthorization` endpoints. Send two simultaneous approvals with different formatting, retry once, then check `/api/verify` and the historical token endpoint anonymously. Keep credentials, cookies and token values out of evidence.
- For rollback, assign a dedicated staging alias to the two verified Preview deployments in sequence and repeat the recipient, number and historical token checks at each switch. Compare the issued chain and formatting hash. The rehearsal ended on the candidate.

### Continuation messages for the existing Work chats

These messages are ready to paste. Each chat should preserve stable IDs, privacy, historical verification links and issued snapshots, use synthetic fixtures, and update its existing PR or handoff with evidence. Production changes, real issuance, and invitations are outside this follow-up.

- **Chat 01.** Propose a shared abuse-control design for HTTP verification and direct RPC. Test anonymous exact-number lookup and unpublished denial without breaking historical token or QR links.
- **Chat 02.** Use the isolated staging schema to verify setup, activation, expiry, recovery and issuer-assignment RLS with synthetic accounts. Confirm inspection-mode writes return 403. Avoid sending invitations or activation email.
- **Chat 03.** Use the hosted two-Ḥafṣ-sanad pass as evidence. Finish browser coverage for selection, reorder, removal and reload up to five, stable source and continuation IDs, tashkīl and the additional-shaykh reload regression.
- **Chat 04.** Use the hosted concurrency and recipient evidence. Reproduce same-name student ambiguity using distinct stable IDs and fix it or record the exact limitation. Verify recipient import separately.
- **Chat 05.** Reproduce the recipient print-page closure on both staging builds and capture the browser cause. Then verify the hosted A4 PDF. Complete physical A4 print and native iOS checks if available. Confirm historical QR output and heading, sanad, خاتمة and issuer footer positioning.
- **Chat 06.** Keep #117 separate from certificate changes. Review the original signed-in diagrams at desktop and mobile widths. Verify card clearance and graph identity, and document the old four-lines-versus-fan-in fixture.
- **Chat 07.** Use #117’s green routing checks to reconcile the baseline fan-in failure in a disposable checkout. Complete source fallback and stage-scope review while preserving route IDs and the الدوري and حفص الدوري labels.
- **Chat 08.** Verify the historical-source-only registry, pagination and remaining identity evidence for al-Bazzī, Abū al-Ḥārith, Sharaf and Zakāʾullāh. Record unresolved evidence by stable ID without merging identities.
- **Chat 09.** Finish authenticated catalog refresh, review, linked-draft and publication-role checks. Verify personal copies and issued snapshots on synthetic data.
- **Chat 10.** Recover the local accessibility change reported at 378c54f. Produce a draft PR or reviewable diff and verify mobile navigation, RTL, keyboard and focus, language and theme in Chromium.
- **Chat 11.** Update the one-issuer/one-recipient pilot plan with the hosted evidence and outstanding gates. Keep the pilot in planning and retain the private reporting workflow.
- **Chat 12.** Use the updated QA matrix. Keep #121 a draft, resolve remaining release gates, and reconcile only the documented overlap when integrating approved scopes. Keep diagram routing separate and leave production untouched.

### Chat 12 approval checkpoint

Candidate reviewed at `70e938767b6dc9ac4894ee856476f0d0aaf89bc3`. Production and GitHub main were independently checked at `292dc0d5dbd27556b4004051b782cc369946c21d`. The [Chromium PDF workflow](https://github.com/Muzakkir-ai/asaneed/actions/runs/43216698465) and [sanad editor workflow](https://github.com/Muzakkir-ai/asaneed/actions/runs/43216698487) passed on the reviewed head, including browser PDF, ordered sanad and public verification steps. The staging PASS results above come from the recorded rehearsal.

| Workstream | Integration decision |
| --- | --- |
| #112 Qurra labels and route IDs | Independent UI change. Keep its visual evidence and source-fallback review with #112. Recheck its combined graph suite if paired with #117. |
| #116 onboarding and issuer assignments | Independent permission change. Its shared workspace request parsing can affect certificate calls, so repeat the certificate request and role matrix if the PRs are later combined. Hosted setup, recovery and assignment evidence belongs to #116. |
| #117 shared-bus routing | Independent geometry change. Its passing routing and graph checks address the known baseline failure. Review the comparative diagrams in that workstream. |
| #120 narrator registry | Independent provenance and privacy change. Review hosted RLS, pagination and the removed private pupil overlay in #120. |

The recorded merge-tree rehearsals found only current-state documentation conflicts for these four PRs. The certificate status now appears once at the top of `CURRENT-STATE.md`. When a neighboring scope is approved, preserve its dated entry alongside the certificate handoff and rerun CI on the combined tree.

| Remaining gate | Status | Acceptance evidence |
| --- | --- | --- |
| Hosted certificate print and export · Chat 05 / #113 | FAIL | Reproduce the recipient window closure after print authorization on candidate and baseline. Capture sanitized console, popup/page-close and browser-exit evidence. Verify hosted A4 PDF for the new number-only and historical QR fixtures. Record physical A4 and native iOS export separately. |
| Verification abuse controls · Chat 01 / #115 | BLOCKED | Review a design that applies a shared request budget or removes bypassable public direct-RPC access while keeping exact lookup and historical tokens working. Test direct calls, HTTP limits, unpublished denial and legitimate retry with synthetic data. |
| Supabase Free recovery | BLOCKED | Managed daily backups and PITR are unavailable on Free. Rehearse encrypted off-site logical export and restore in a separately confirmed disposable project. Capture CLI role, schema and data dumps plus migration history. Inventory Auth configuration and any custom Auth/Storage schema changes and stored objects separately. Preflight issuer codes against stable IDs before restore. Compare access policies, identifiers, snapshots, number allocations and historical links, and measure recovery time and the recoverable data window. Follow provider confirmations before any restore. [Backup guidance](https://supabase.com/docs/guides/platform/backups) and [CLI restore guidance](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore) |
| Owner approval | BLOCKED | Review the hosted print and abuse-control evidence, decide the accepted recovery procedure, and approve a pinned candidate and rollout scope separately. |

Chat 01 and Chat 05 handoffs are recorded above for their existing workstreams. Delivery to the original chats was unavailable in this session.
