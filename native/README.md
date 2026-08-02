# Motion Only native app

The member application is built with Expo SDK 57 and React Native for iPhone
and Android.

## Included

- Secure invitation registration and password-first sign-in
- Optional magic-link sign-in and password recovery
- Guided onboarding, member profile and privacy controls
- Goals, habits, today's motions, XP, levels and weekly Momentum
- Full searchable 21-resource library with saved and completed progress
- Real-time rooms and direct messages
- Invitation-only project workspaces
- Private achievements with image or PDF evidence
- Notifications and a protected mobile administration area

## Local verification

```bash
npm install
npm run typecheck
npm start
```

`EXPO_PUBLIC_API_URL` must be set to the deployed HTTPS API origin in the EAS
`preview` environment before a test build is produced. It is a public address,
not a secret.

## Test distribution

- Android: `eas build --profile preview --platform android` produces an installable APK.
- iPhone: use TestFlight for the 15-person group, or an internal iOS build when every test device is registered.
- Store releases use the `production` profile after the private test succeeds.
