# Google authentication setup

Google is an additional Supabase Auth provider. It does not replace email and
password login, the Zeke role/profile database, or Resend SMTP.

## Safety order

1. Apply migration `0019_google_oauth_onboarding.sql`.
2. Configure the Google OAuth client and Supabase provider.
3. Verify the callback and redirect allow-list.
4. Set `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true` in Vercel and redeploy.

Do not enable the public flag before the migration and provider configuration
are both live.

## Google Auth Platform

Create a Web application OAuth client with the minimum scopes:

- `openid`
- `.../auth/userinfo.email`
- `.../auth/userinfo.profile`

Configure the Zeke name, logo, privacy policy, terms, and production domain on
the consent screen. Use these production web origins:

- `https://zekesolution.com`
- `https://www.zekesolution.com`

Use the Supabase Auth callback as the authorized redirect URI:

- `https://fslthsbjtgmdbabwcubs.supabase.co/auth/v1/callback`

The Google client secret belongs only in Google/Supabase provider settings. It
must never be added to a `NEXT_PUBLIC_` variable or committed to this repo.

## Supabase Auth

In Supabase Dashboard > Authentication > Sign In / Providers > Google:

1. Enable Google.
2. Save the Google Web client ID and client secret.
3. Keep email/password enabled.

In Authentication > URL Configuration, keep the production Site URL and allow
the Zeke callback routes:

- `https://zekesolution.com/auth/callback`
- `https://www.zekesolution.com/auth/callback`
- `http://localhost:3000/auth/callback` for local development

The app sends `next` and optional `role` query parameters on those callbacks.
If the dashboard uses exact-match redirect URLs, add the matching callback
patterns so those query parameters remain allowed.

## App flag

Set this only after the provider test succeeds:

```text
NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true
```

Set it for Vercel Production and Preview only when their corresponding callback
origins are allow-listed. Redeploy after changing a `NEXT_PUBLIC_` value because
it is embedded at build time.

## Expected behavior

- Existing Zeke user with the same verified Google email: account identities
  link through Supabase and the existing Zeke role/profile remains unchanged.
- New Google user: the database creates only a restricted `pending` profile.
  `/onboarding` requires the user to choose Creator or Brand and validates all
  normal profile fields before the role-specific row is created atomically.
- Pending users cannot enter creator, brand, or admin dashboards.
- Google can never create or select an admin role.
- Resend continues sending confirmation and password-recovery email from
  `no-reply@zekesolution.com`; Gmail SMTP is not used.

## Release test

Test with one new Google address and one existing Zeke address:

1. Canceling the Google consent screen returns no Zeke session.
2. A new address reaches `/onboarding`, not a dashboard.
3. Direct dashboard URLs reject the pending user.
4. Creator completion creates one `profiles` and one `influencer_profiles` row.
5. Brand completion creates one `profiles` and one `brand_profiles` row.
6. The same onboarding submission cannot change the role again.
7. An existing Zeke email retains its existing role and data.
8. Email/password login and Resend password recovery still work.
