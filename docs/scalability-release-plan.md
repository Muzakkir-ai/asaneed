# Scalability releases

Base: verified live commit `23b7b28272375e60d44eb71e72d5991e3184af8f` on `audit/chat12-integration-c1ae83cba1a2`.

1. Certificate display-number allocation and duplicate submission safety. Display ordinal is distinct from official issuer/year/riwayah registration number. Existing production audit: 50 certificates, all have positive display numbers; historical display numbers overlap across issuers, no duplicates within issuer. Never renumber existing records. Confirm numbering scope, restore behavior and rolling deployment compatibility before enabling a database allocator. Test concurrent requests, batch issuance, authorization, deletion/retry, rollback, historical data equality and >2,000 rows. Do not mutate production before staging validation.
2. Server-side certificate list search/filter/sort and pagination; keep detail/print data fetched on demand. Preserve Arabic search and student grouping, issuer scope and exact filters. Test empty/large datasets and all role combinations.
3. Indexed narrator search with Arabic normalization, aliases and linked-narrator ranking; retain exact identity selection and graph completeness. Test existing name/alias and branching fixtures.
4. Lazy-load graph and shared library data; invalidate on changes, never cache across unauthorized scopes. Test all saved route and certificate assembly regressions.
5. Measure synthetic 10k/50k/100k datasets with representative queries; compare latency, bytes and database plans. No load tests on production data.

Every phase: isolated PR against live branch, full existing regression suite plus phase-specific checks; staging database migration and restore rehearsal when relevant; compare historic sanad, certificate and snapshot content; deploy the tested tree to production only after checks pass, verify production hostname and monitor logs. Retain rollback deployment. Do not apply unverified schema changes to production.
