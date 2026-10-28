# Authentication setup

The independent app has email/password login, registration, pending approval, password recovery, and Google OAuth callback handlers. Zite accounts and data are unchanged.

## Supabase URL configuration

Set Site URL to `https://asaneed.vercel.app` and allow these exact redirect URLs:

- `https://asaneed.vercel.app/auth/callback`
- `https://asaneed.vercel.app/auth/callback?flow=recovery`

Keep email confirmation enabled. Configure a production SMTP sender before opening email registration and recovery to general users. Supabase's default sender is restricted and intended for testing.

Default Supabase confirmation/recovery templates work with the PKCE callback in the same browser that requested the email. For cross-device email links, templates may use `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup` for signup, and `type=recovery` for recovery. The app validates these types and redirects only to fixed local destinations.

## Google

Create a Google OAuth web client for this app, request only basic identity scopes, and set its authorized redirect URI to `https://sqyookpdpymgpwpnicyp.supabase.co/auth/v1/callback`. Set the application's origin to `https://asaneed.vercel.app`. Store the client ID and secret only in the Supabase Google provider settings. The login page checks whether the provider is enabled and does not offer a working Google button before setup is complete.

## First administrator

The owner creates their account and verifies the email. A trusted operator then promotes only that verified identity to an active administrator. Do not use a public signup role field or user-editable metadata to grant access. No administrator email or credential is stored in this public repository.

All other signups create an inactive student account through a private database trigger. A login account is separate from an issuer; no issuer permissions are granted by signup. Account approval controls and full management screens remain later migration work.

## Verification

- `npm run build`
- `node --experimental-strip-types tests/auth.test.ts`
- Run `database/auth-tests.sql` and `database/access-tests.sql` as the database owner; both roll back their fixtures.
- Test the delivered signup/confirmation/recovery email links after URL, sender and Google settings are configured. UI and database tests alone do not confirm external email delivery or Google consent.
