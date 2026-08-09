# Zeke browser push notification setup

Zeke already has realtime in-app notifications while a dashboard tab is open. Browser push is the next layer: it can alert a signed-in user when Zeke is closed.

## Recommended first release

Use OneSignal Web Push for the first release. It handles browser subscriptions, delivery, Safari differences, and invalid endpoints while Zeke keeps Supabase as the source of truth for notification records.

1. Create a OneSignal app and add the Web platform.
2. Choose the custom-code setup and use the canonical origin `https://zekesolution.com`. Do not split subscriptions between the `www` and non-`www` domains.
3. Download the generated `OneSignalSDKWorker.js` and place it in Zeke's `public` directory at the exact path OneSignal gives you.
4. Add `NEXT_PUBLIC_ONESIGNAL_APP_ID` in local development and Vercel. Add the OneSignal REST API key only as a server-side Vercel secret, never as a `NEXT_PUBLIC_` variable.
5. Add an `Enable notifications` button in the signed-in dashboard. Ask for browser permission only after the user clicks it. Never request permission automatically on page load.
6. After subscription, associate the OneSignal external user ID with the authenticated Supabase user ID. This prevents sending to the wrong account on shared devices.
7. Add a server-side delivery worker that reacts to a new row in `public.notifications`, loads that user's push subscription, and sends the same title/body and relevant deal URL through OneSignal.
8. Add per-user preferences for deal updates, chat messages, payment updates, and Shield/dispute alerts. Keep critical account-security notices separate from marketing messages.
9. When the user signs out, remove the external user association on that browser. Do not delete the notification history in Supabase.
10. Test Chrome and Edge on desktop and Android, Safari on macOS, and an iPhone Home Screen install. iPhone/iPad web push requires the web app to be installed on the Home Screen.

## Release checks

- HTTPS is active on the canonical domain.
- The service worker URL loads directly with status 200 and JavaScript content.
- Permission is requested only from a user click.
- Clicking a notification opens the correct role-specific deal or chat URL.
- A logged-out browser cannot receive another user's private notification.
- Duplicate Supabase events do not produce duplicate pushes.
- Revoked or expired subscriptions are removed automatically.
- Notification content never includes sensitive dispute evidence or private documents on the lock screen.

Do not enable the permission prompt until the OneSignal App ID, server key, service worker, user association, and delivery worker are all ready.
