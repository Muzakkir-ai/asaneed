# Asaneed — guide for coding agents

Read this file, [current state](docs/CURRENT-STATE.md), and [next steps](docs/NEXT-STEPS.md) before making changes. Last handoff update: **30 October 2026, Asia/Riyadh**. This is an existing production application, not a starter project.

## Project and direction

- Repository: `Muzakkir-ai/asaneed` (public).
- Production: https://asaneed.vercel.app — authenticated workspace: `/studio`.
- Stack: Next.js, React, TypeScript, Supabase/Postgres, Vercel.
- Supabase project reference: `sqyookpdpymgpwpnicyp`.
- Vercel team: `halaqaat`; project: `asaneed`.
- Artwork/font repository: `Muzakkir-ai/fonts`.
- Goal: an independent replacement for the original Zite app, preserving certificate workflows and data. **Leave the original Zite app unchanged. Do not rebuild the application from scratch or create a separate turuq site.**
- Google logo/branding work and a custom authentication hostname are paused at the user's request. Do not resume them incidentally.

The user prefers direct implementation, brief plain-language updates and minimal repetitive confirmation. Follow the current request; this document is context, not blanket permission for future destructive changes or paid services.

## Start here

1. Inspect the current branch, remote head, working-tree changes and applicable instructions. Preserve unrelated user edits.
2. Read `docs/CURRENT-STATE.md`. Older documents are historical reports and may describe superseded scoping or UI behavior.
3. Trace the existing component, endpoint, data adapter and database policy before changing a workflow. Do not fix an authorization issue by merely hiding controls.
4. Reproduce the issue using a relevant test or a separate browser tab. Avoid reloading the user's tab if it may contain unsaved work.
5. Make the smallest coherent change, run appropriate checks, and report exactly what was verified.

## Architecture map

| Area | Main locations |
| --- | --- |
| Next.js shell, auth, public verification | `app/`, `lib/supabase/` |
| Migrated application workspace | `legacy/App.tsx`, `legacy/components/` |
| Existing typed workspace endpoints | `legacy/api/`, `legacy/lib/api.ts`, `legacy/compat/endpoints.ts` |
| Zite compatibility adapter over Supabase | `legacy/compat/database.ts`, `legacy/compat/rows.ts`, `legacy/compat/context.ts` |
| Account inspection and explicit issuance target | `lib/workspace-scope.ts`, `lib/issuance-target.ts`, `app/api/workspace/[endpoint]/route.ts` |
| Actual certificate rendering | `legacy/components/CertificatePrint.tsx`, `CertificateHeading.tsx`, `legacy/lib/certificateSnapshot.ts` |
| Shared chain construction | `legacy/lib/assembleIjazah.ts`, `qurra.ts`, `readingCatalog.json` |
| Book/route builder | `BookTariqBuilder.tsx`, `SavedRoutePicker.tsx`, `NarratorAutocomplete.tsx`, `legacy/lib/bookBuilder.ts`, `app/api/book-builder/route.ts` |
| UI primitives and styling | `legacy-ui/`, `legacy/index.css`, `legacy/workspace.css` |
| Database changes and types | `supabase/migrations/`, `lib/database.types.ts` |
| Tests | `tests/`, `database/*tests.sql` |

`@project/components/*` resolves to `legacy-ui/*`. Existing `zitejs/*` imports resolve to local compatibility modules; they do not mean this deployment should depend on the original Zite service. Check `tsconfig.json` before changing aliases.

## Data and permission invariants

- **Filtering is not authorization.** The issuing-shaykh dropdown belongs only to الطلاب والشهادات. Never make it a global workspace switch or a shared database query filter.
- Admins retain their authorized account, additional-shaykh, sanad and narrator administration access regardless of that dropdown.
- Account inspection is explicit and read-only by default. Do not bypass inspection boundaries.
- Login accounts, personal issuing-shaykh profiles, additional shaykhs and students are distinct entities. Both admins may also issue and receive ijazahs.
- `print_profile.personalAccount` references the **application account ID**, not the Supabase Auth user ID. Do not confuse the two.
- Pass an additional-shaykh ID or target account explicitly for each relevant operation. Never infer ownership from a certificate-page filter.
- Enforce access both server-side and through RLS. Use the authenticated client; do not use a service-role key to bypass a failing policy.
- Finalized certificates use immutable snapshots. Do not regenerate them from current library text, current colors or refreshed artwork.
- A received certificate becomes an editable personal sanad only after recipient validation, review and explicit saving. The source certificate remains immutable.
- Builder/library edits must not silently rewrite copied holdings or existing certificates.
- Preserve existing IDs, ownership and historical associations. Back up affected data before a migration or an explicitly requested destructive correction.

## Certificate, language and artwork conventions

- Arabic RTL and Readex Pro for application UI. Keep the current teal theme and secondary `#D4A75B`; retain dark-mode support. Certificate palettes are independent and user-configurable.
- Respect existing Urdu typography and use Readex for Arabic spans within Urdu text where appropriate.
- Arabic search should ignore harakat/tatweel and supported alif/ya variants while preserving the exact original text for display and print.
- Registration format: **YYSS-RRNN** — completion year, issuer code, riwayah code, per-issuer/year/riwayah sequence. Display Arabic-Indic digits with correct left-to-right group order. Finalized numbers do not change retroactively.
- Stable issuer codes currently assigned: 01 Zakaullah, 02 Owais, 03 Muzakkir, 04 Umar, 05 Sharaf; future issuer allocation starts at 06. Check the live directory rather than guessing ownership from a name.
- Use real `ijazah.svg`, `basmalah.svg` and the existing imam/rawi/route artwork pipeline. Do not substitute emojis or generic headings.
- Numbered issuer artwork: `svg/mashaykh/04/name.svg`, `line-02.svg`, `line-03.svg`. ASCII digits in filenames. Name and line 02 use primary color; line 03 uses secondary. Preserve linked scaling and aspect ratios.
- Book/route artwork uses numbered folders and `svg/catalog.json`; see `docs/NUMBERED-ARTWORK-AND-TURUQ.md`. Missing artwork retains the real text fallback.
- Refresh discovers assets at a pinned Git commit. Local files must be uploaded before website refresh. New finalized certificates freeze their artwork source.
- صاحب الكتاب, مُجيز, مُجاز and now صاحب الطريق use the appropriate Sakkal Kitab treatment. Route sources in drafts/new finalizations are Sakkal Kitab bold in primary color. Old finalizations without the new font setting retain their historical fallback.
- Sakkal Kitab Tatweel Extension 1 is OpenType `ss16`; do not insert tatweel characters to imitate it.
- Keep whole-certificate balancing and overflow warnings. Do not conceal overflow with clipping or silently shrink scholarly text.

## Build, tests and migrations

Use the pinned lockfile (`npm ci` on a fresh checkout). `npm run build` builds the studio CSS and performs the production Next.js/TypeScript build. `npm run typecheck` is available. Test commands depend on the installed pinned TypeScript version.

Example for the existing standalone TypeScript suites:

```sh
node_modules/.bin/tsc --ignoreConfig tests/book-builder.test.ts tests/standard-route-sources.test.ts --outDir .vercel/agent-tests --module commonjs --target es2022 --resolveJsonModule --esModuleInterop --skipLibCheck --types node --noEmitOnError
node .vercel/agent-tests/tests/book-builder.test.js
node .vercel/agent-tests/tests/standard-route-sources.test.js
```

Choose additional suites appropriate to the change: workspace visibility, issuance targets, received transmission, certificate heading, typography, numbering and balance. Avoid superficial tests that merely mirror a small style change.

Database suites such as `database/book-builder-tests.sql` are rollback-only. Review them before running on hosted production. They temporarily simulate roles within the transaction; do not remove their rollback. Never create or publish a real certificate solely to test a feature.

Inspect the current schema before changing it. Generate migration filenames with `supabase migration new`, apply reviewed migrations through the authorized Supabase workflow, regenerate types, test allow/deny cases, and check advisors. Make owner/role predicates explicit in child-table policies, even where parent RLS also protects them.

`app/studio/studio.css` is generated by `scripts/build-studio.cjs`. Edit the source styles. The release process rebuilds CSS; do not include unrelated regenerated CSS noise. Only discard generated changes if you know they are your own.

## GitHub and deployment

**Special case for this existing Windows checkout:** its local Git history is independent of GitHub's history. Do **not** push it to `main`, force-push, merge the unrelated histories or reset away local user work. Earlier releases used GitHub MCP `create_tree` → `create_commit` → `update_ref`, based on the inspected remote head, with `expected_sha` and `force:false`. The local commits are a separate record of the same edits.

For a normal fresh clone with matching GitHub history, use its normal branch/PR workflow. The independent-history restriction is specific to the existing checkout; verify before choosing a workflow.

The local ignored helper `.vercel/prepare-delta.cjs` prepares changed source files for the MCP workflow. It is not guaranteed to exist on a new machine. Review every tree entry; do not publish private files. Inspect the current remote head before publishing and handle a changed head without force. A successful GitHub ref update alone is not proof of a working deployment: verify the matching Vercel commit is READY and check the changed flow.

The repository is public. Never commit `.env` contents, keys, OAuth/SMTP credentials, cookies, sessions, data exports, backups, private logs or user datasets. Project references and source code are not secrets; credentials and application data are.

## Local machine notes (optional context)

- Existing app checkout: `C:/Users/Admin/Documents/Codex/2026-10-26/let-s-open-my-zite-app/asaneed-independent`.
- Fonts checkout: `C:/Users/Admin/Documents/Codex/Asaneed-Fonts`.
- The fonts checkout uses ordinary Git and has a local `Upload-Changes.cmd` / PowerShell helper with automatic commit messages. Unlike the app checkout, its push workflow is normal. Inspect status before running it; upload only intended artwork/font changes.
- Screenshots and temporary verification artifacts live outside the public app repository under the surrounding workspace's `outputs/` directory.
- Private application backups are retained in Supabase's `private.application_backups`; do not export them to public GitHub.

## Handoff discipline

After meaningful changes, update `docs/CURRENT-STATE.md` with the resulting behavior, deployment commit and verification limits. Mark suggestions as suggestions, not completed work. Keep `docs/NEXT-STEPS.md` honest. Do not claim all possible historical certificates, account roles or physical printers were tested when only fixtures or a single browser account were used.
