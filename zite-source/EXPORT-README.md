# Zite source snapshot

This folder preserves the current saved Asaneed application source from Zite, copied on 28 October 2026. It is the starting point for migrating the full application while the existing Zite app continues operating.

- Source Zite commit: `f8cec60603d96bdbf0a6e0b4d9a6de99ee4cb002`.
- 171 original tracked files, with per-file SHA-256 checksums in `SOURCE-MANIFEST.json`.
- Includes the application, backend endpoints, certificate editor and print styles, shared UI components, tests, dependency lockfile, generated type bindings, and database schema.
- Excludes local environment variables, registry credentials, installed dependencies, build output, and platform session files.
- Database records, user accounts/passwords, certificate snapshots stored in the database, and uploaded files are not part of this source-only copy. Referenced external SVG/font URLs remain references.

## Repository layout

This snapshot is stored under `zite-source/` on the `zite-source` branch of `Muzakkir-ai/asaneed`. The repository's existing independent checker source is retained outside this folder. The production `main` branch is unchanged by this export.

## Runtime requirements

The original app uses the proprietary `zitejs` framework (pinned to 0.9.144). Its database client, authentication, endpoint execution and uploads still depend on Zite. Copying the source does not make those services portable or move any data. Those integrations must be replaced with the independent app's Supabase and server implementation before the complete app can run independently on Vercel.

This export did not edit, commit or publish the Zite app, and did not change its database or access settings. It represents the saved editor source; the published Zite version may differ.

Future changes made in Zite are not automatically synchronized to GitHub. Export a fresh snapshot when needed until migration is complete.
