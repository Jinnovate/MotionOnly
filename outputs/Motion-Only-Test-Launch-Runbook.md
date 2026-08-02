# Motion Only — 15-person test-launch runbook

Prepared 24 July 2026

## Launch decision

Use a controlled two-week test with Joel plus 14 invited members. Start with
three trusted testers for 48 hours, fix any account or data problems, then invite
the remaining 11. Do not publicly promote the app or open registration during
this test.

The beta should test one proposition: does Motion Only help members choose
meaningful actions, complete them consistently, and feel measurable progress?

## Easier pilot route: installable private web app

For the first 15-person test, use the installable web app before native app
store distribution. Testers open the private Motion Only link, accept their
single-use invite, then add the app to their iPhone or Android home screen.

This is the quickest route because it avoids TestFlight review, Apple device
lists, Android APK warnings and app-store admin while the product shape is still
being tested. It still requires the hosted API, PostgreSQL, Redis, email and
private storage because accounts, invitations, privacy, chat and progress must
not be faked for a real group test.

What this route tests well:

- Invite-only registration and password login
- Guided onboarding and member privacy defaults
- Goals, habits, daily motions, XP, levels and weekly Momentum
- Library progress, chat rooms, direct messages, private projects and admin
- Whether members actually return and feel useful personal progress

What it does not properly test yet:

- Native push notifications
- TestFlight or Play Store distribution
- Offline-first native behaviour
- Native file picker edge cases on older phones

Use the native iPhone and Android builds after the first group proves the core
experience is worth tightening further.

## What is ready

- Installable web app shell with Motion Only branding and mobile home-screen
  metadata
- Native iPhone and Android application with Motion Only branding
- Password-first login, optional magic link, password reset and secure sessions
- Single-use, email-bound invitations
- Guided onboarding and member profiles
- Private-by-default goals, habits, daily motions, progress and weekly reviews
- Permanent XP and levels, plus conditional weekly Momentum bonus XP
- 21 complete library resources across business, trading, fitness and performance
- Topic rooms, real-time chat, direct messages and private project workspaces
- Private achievements and owner-only evidence uploads
- Notifications, privacy controls, blocking, moderation and administration
- Automated database migrations and a repeatable hosting blueprint

## Verification completed

- Web production build passed.
- Installable web app manifest, service worker and invite/magic/reset routes
  build into the hosted bundle.
- API type checking passed.
- All four database migrations passed an isolated migration test.
- Privacy-default, XP idempotency, daily cap and weekly Momentum settlement
  invariants passed.
- Expo's native project checker passed all 20 checks.
- Clean Android and iPhone production bundles were generated from version 0.2.0.
- Web and API production dependency audits found no vulnerabilities.
- No high or critical native dependency vulnerabilities were found.

The native dependency audit reports a moderate issue in Expo's transitive iOS
build tooling (`xcode`/`uuid`). It is not part of the app's API or member-facing
runtime. The automated forced fix would incorrectly downgrade the project from
Expo 57 to Expo 46, so it has deliberately not been applied. Recheck this before
each signed release and take Expo's compatible upstream fix when available.

## Accounts required before distribution

Joel needs ownership of these accounts:

1. A GitHub account/repository for the private source code.
2. A Render account for the API, PostgreSQL and persistent Key Value service.
3. A Cloudflare account with one private R2 bucket for evidence files.
4. A Resend account with a verified sending domain for invitations and sign-in links.
5. An Expo account for signed Android and iPhone builds.
6. An Apple Developer membership for TestFlight distribution to iPhone testers.

Google Play Console is not required for this first Android test because testers
can install a signed APK directly. It will be required for closed Play testing
and a public Android release.

## Safe launch order

### 1. Put the service online

- Keep the source repository private.
- Create the Render Blueprint from `render.yaml`.
- Use the paid Starter API and Key Value services and Basic PostgreSQL database
  already specified in the blueprint; free sleeping or disposable services are
  inappropriate for authentication and sessions.
- Enter the Resend and private R2 values when Render asks for the protected
  environment settings.
- Confirm the API health check reports healthy.
- Confirm point-in-time recovery is visible on the paid PostgreSQL service's
  Recovery page.
- Run the administrator bootstrap once to create Joel Gilbert's account.
- Remove the bootstrap password from the service settings immediately afterward.

### 2. Confirm the private storage boundary

- The R2 bucket must remain private with no public development URL or custom
  public domain.
- Give the service a bucket-specific Object Read & Write token, not an
  account-wide token.
- Upload one test achievement image, open it as Joel, then confirm another test
  account cannot retrieve it.

### 3. Produce signed app builds

For the easier pilot route, skip this step until after the 15-person web-app
test. Instead, share the private hosted web app link and ask testers to install
it to their home screen.

On iPhone: open the link in Safari, tap Share, then Add to Home Screen.

On Android: open the link in Chrome, tap Install when prompted, or use the menu
and choose Add to Home screen.

When you later move to native distribution:

- In Expo, set `EXPO_PUBLIC_API_URL` in the `preview` environment to the new
  Render HTTPS API address.
- Build the Android preview APK and install it on Joel's phone.
- Build and upload the iPhone version to TestFlight. External TestFlight testers
  require beta information and the first external build to pass TestFlight
  review.
- Confirm the installed build shows the supplied Motion Only logo and connects
  to the hosted service, not localhost.

### 4. Run a three-person gate

Invite two members in addition to Joel and complete every item below on both
iPhone and Android where possible:

- Invitation opens the installed app and pre-fills the correct email and code.
- The invitation can be used only once and only by its intended email.
- Password sign-in, magic-link sign-in, password reset and logout work.
- Onboarding saves name, focuses, timezone and private defaults.
- A goal, habit and daily motion survive closing and reopening the app.
- Ordinary XP is awarded immediately and cannot be duplicated by repeated taps.
- The Momentum bar advances, shows its deadline and does not award weekly bonus
  XP before the target is filled and settled.
- Library saving, checklist progress and completion survive a restart.
- Rooms and direct messages arrive on the second device in real time.
- A private project is invisible until its member is invited.
- Achievement evidence is visible only to its owner.
- Privacy changes alter member discovery and messaging as expected.
- Joel can invite, suspend and restore a member; change roles; create or archive
  a room; and resolve a moderation report.

If any account, privacy, storage or messaging test fails, stop and fix it before
inviting the remaining members.

Create a manual logical database export after this gate succeeds. Create another
at the end of the two-week test for longer-term recovery outside the live
service.

### 5. Invite the remaining group

- Invite 11 more people, one email per single-use invitation.
- Keep everyone as `member` except one deliberately chosen backup moderator.
- Never send administrator invitations casually.
- Ask every tester to enable automatic app updates through TestFlight where
  available.

## Two-week test rhythm

### Day 1

Ask members to finish onboarding, create one serious goal in their main focus,
choose no more than three habits, and complete their first daily motion.

### Days 2–6

Observe whether members return to complete meaningful work without artificial
login rewards. Use rooms for useful accountability and introductions, not
generic motivational posting.

### Day 7

Check whether Momentum is understood before the first settlement. Members who
fill the bar receive bonus XP after the week closes; members who do not fill it
retain their normal XP but their weekly Momentum resets.

### Days 8–13

Release only fixes for serious confusion, access, privacy or reliability
problems. Keep feature ideas in a separate list so the test can measure a stable
experience.

### Day 14

Review the evidence and decide whether to continue, revise or pause.

## Measures that matter

Record these without creating a public leaderboard:

- Invitation acceptance rate
- Successful onboarding rate
- Members completing at least one meaningful motion on three different days
- Members creating and updating a goal
- Members reaching the weekly Momentum target
- Week-two return rate
- Useful room or direct-message participation
- Number and severity of failed logins, crashes, privacy problems and support requests
- Short member answer: “What helped you move forward?” and “What got in your way?”

Avoid using raw screen time, daily logins or message volume as success metrics.
Those reward app consumption rather than progress.

## Privacy and moderation rules

- Goals, progress, weekly reviews, project content, achievements and evidence
  stay private unless the member deliberately changes an available sharing setting.
- Do not ask members to upload brokerage statements, identity documents, medical
  records or other highly sensitive evidence during the test.
- Motion Only should not present trading content as financial advice, promise
  returns or use “get rich quick” claims.
- One moderator should check reports daily. Suspend first when safety or privacy
  is uncertain; investigate before deleting records.
- Export or deletion requests should be handled manually and logged during the
  test until self-service account deletion is added.

## Incident response

For a suspected privacy or account incident:

1. Suspend affected accounts or invitations.
2. Revoke all sessions for affected members.
3. Preserve audit information; do not delete evidence while investigating.
4. Rotate any exposed API, storage or email key.
5. Tell affected members what happened, what information was involved and what
   has been done.
6. Do not reopen the test until the cause is understood and the relevant
   privacy checks pass.

## Go/no-go checklist

Launch to all 15 only when every statement is true:

- [ ] Joel can administer the hosted app from his phone.
- [ ] For the PWA pilot, the hosted web app is connected to the Render API URL.
- [ ] Invitations, password login, magic links and password resets work.
- [ ] Android/iPhone home-screen install works, or signed native builds are
      available if choosing the native route.
- [ ] Database and Key Value services are persistent and privately networked.
- [ ] PostgreSQL point-in-time recovery is active and one logical export has been tested.
- [ ] Evidence bucket is private and owner-only access has been tested.
- [ ] All data and Momentum migration checks pass.
- [ ] One backup moderator is chosen.
- [ ] A support email or private feedback channel is monitored daily.
- [ ] The three-person gate has run for 48 hours without a critical issue.

## Information needed from Joel

- Administrator email address
- A strong initial administrator password, entered privately into the hosting
  account rather than sent in chat
- The domain to use for member emails, for example `members@yourdomain`
- Confirmation of which required accounts already exist
- The 14 tester email addresses, retained in the administration area rather than
  committed to source code

## Reference links

- Render Blueprint specification: https://render.com/docs/blueprint-spec
- Render private networking: https://render.com/docs/private-network
- Cloudflare R2 private S3 API: https://developers.cloudflare.com/r2/get-started/s3/
- Cloudflare bucket-specific tokens: https://developers.cloudflare.com/r2/api/tokens/
- Expo internal distribution: https://docs.expo.dev/build/internal-distribution/
- Expo build environments: https://docs.expo.dev/eas/environment-variables/
- Apple TestFlight: https://developer.apple.com/testflight/
- Resend email API: https://resend.com/docs/api-reference/emails/send-email
