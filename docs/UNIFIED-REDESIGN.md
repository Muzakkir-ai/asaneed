# Unified management redesign — compatibility plan

Base: main 7743ecf (PR #5 merged and deployed). Branch: feat/unified-management-redesign.

Reuse the existing book/route builder, narrator identity graph, compact Arabic editor, MatnHeading renderer, CertificateViewport and certificate APIs. Preserve existing sidebar keys/deep links. The default books/routes tab embeds the same builder without its modal trigger; shared qiraat text records stay in their existing editor.

Existing personal holdings/templates are workspace_records payloads, not separate SQL tables. Preserve their IDs, ownership and certificate references. Add an optional catalogId to holdings; do not automatically classify or merge legacy works. Reuse personal heading envelopes; resolve shared defaults before personal preferences and explicit draft overrides. Frozen snapshots remain authoritative.

Add catalog and request storage with authenticated RLS; approve/link/reject requests transactionally, recording actor/time/reason. Reuse existing template storage and preserve user-owned wording. Keep administrator capability separate from permission to issue; preserve existing assignments during additive capability migration. No destructive migration or production release is authorized.

Validate role allow/deny, duplicate/race handling, rollback-only database fixtures, legacy adapters and actual desktop/mobile browser/PDF flows before opening a draft PR.
