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
