# Onboarding and workspace access review

GitHub main and the production deployment were both at `292dc0d5dbd27556b4004051b782cc369946c21d`. Verification used synthetic fixtures.

## Issuer assignment during inspection

As an active administrator, POST to `/api/workspace-scope` with the same origin, `x-workspace-account` set to another application account ID, and valid `accountId`, `issuerId` and `enabled` in the body. The baseline returned 200 and invoked the assignment RPC. The expected result is 403 before the RPC. The updated assignment UI sends workspace context and the handler blocks assignments in either inspection mode. The database assignment RPC independently requires an active administrator.

## Role matrix

| Actor or state | Workspace handler fixture | Setup and issuer assignment |
| --- | --- | --- |
| Anonymous | 401 | 401 |
| Missing application account, pending, or inactive | 403 | 403 |
| Restored | Restore retains inactive status | 403 |
| Active student | Dashboard allowed, staff issuance denied | 403 |
| Non-issuing shaykh | Dashboard allowed, issuance denied | 403 |
| Issuing shaykh | Issuance can reach its endpoint, subject to issuer scope and RLS | 403 |
| Administrator in own workspace | Dashboard allowed, issuance subject to its separate capability | Allowed after input and RPC checks |
| Administrator inspecting another workspace | Scoped reads allowed, writes denied in read-only mode | 403 even in inspection edit mode |

## Verification

- `node tests/onboarding-routes.test.cjs` exercises handlers with stubbed Auth and data responses. It covers signup, recovery, confirmation routing, stale session roles, inspection, exact actor and target IDs, oversized streams and safe error responses.
- `node tests/onboarding-rls.test.cjs` applies the foundational migrations through workspace relationship controls in local PGlite and runs rollback-only signup, approval, assignment and revocation checks. The later setup, deletion and issuance capability migrations are tested separately by the existing fixture suites.
- Setup and assignment responses mask unexpected database details. The workspace catch-all and both account routes limit streamed request bytes. Other legacy workspace exceptions still need a route-by-route review.

## Staging checks still open

Check actual delivery and confirmation templates with synthetic staging accounts. Request setup in browser A and open the link in browser B. The token-hash handler can establish a session without the setup cookie. The pending user then re-enters the setup code in browser B. The PKCE callback depends on the originating browser verifier and returns the expired-link screen if exchange fails. Test both activation and recovery with the actual template. Hosted RLS and authenticated browser behavior remain unverified.
