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
