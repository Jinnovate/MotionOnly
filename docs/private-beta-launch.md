# Motion Only private beta launch

This is the practical path for letting around 30 invited people test Motion Only with real accounts.

## What is ready

- Invite-only registration through single-use invite codes
- Email and password login
- Optional magic-link login
- Secure member sessions
- Supabase Auth sessions
- Supabase PostgreSQL tables for profiles and invitations
- Row-level security on profile and invite data
- Netlify hosting with automatic deploys from GitHub

The web app now has two modes:

- Demo mode: if neither Supabase nor custom API settings are present, the app opens straight into the clickable prototype.
- Supabase private beta mode: if `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set, members must sign in or accept an invite before they can enter.
- Custom API mode: if `VITE_API_URL` is set, the archived backend route can be used later.

## What is still prototype-led

The front end now has the correct private beta gate, but not every page is fully live-data connected yet. Some areas still use polished demo data after login. That is fine for an early 30-person walkthrough if the goal is product feedback, flow, vibe and feature testing.

Before people rely on it daily, connect the main screens to persistent Supabase data in this order:

1. Today, goals, habits and XP
2. Network rooms and messages
3. Project workspaces, pinned messages and media
4. Schedule and notifications
5. Operations admin controls

## Archived custom API route

You do not need this path for the current Netlify + Supabase live test. Keep it for later if Motion Only needs its own custom backend, Redis sessions, deeper real-time controls or private file-processing jobs.

### 1. Start the custom API

In the `api` folder:

```bash
copy .env.example .env
npm install
npm run dev
```

The API runs on:

```text
http://localhost:4000
```

For the database and Redis, start the included `api/compose.yaml` with Docker or another compatible container app before running the API.

### 2. Create your admin account

Set these in `api/.env`:

```text
BOOTSTRAP_ADMIN_EMAIL=your@email.com
BOOTSTRAP_ADMIN_PASSWORD=choose-a-strong-password
BOOTSTRAP_ADMIN_NAME=Joel Gilbert
```

Then run:

```bash
npm run bootstrap
```

### 3. Connect the web app to the API

In the project root, create `.env`:

```text
VITE_API_URL=http://localhost:4000
```

Then run the app:

```bash
npm run dev
```

The browser preview should now show the Motion Only private membership login screen instead of opening straight into demo mode.

## Hosted 30-person beta

Current recommended setup:

- Netlify for the web app
- GitHub for code updates
- Supabase for accounts, invites and database
- Supabase Storage or another private storage provider later for uploaded files

## Supabase beta route

This gives Motion Only real accounts without deploying the custom API yet.

1. Create a Supabase project.
2. In Supabase, open the SQL editor.
3. Run `supabase/motion-only-beta.sql`.
4. In Supabase Auth settings, set the site URL to:

```text
https://motiononly.netlify.app
```

5. For the simplest test, disable email confirmation while you create the first few accounts, or keep it enabled if you want every user to confirm by email.
6. Add invite codes manually in the SQL editor:

```sql
insert into public.motion_invites (code, email, role)
values ('MO-TEST-001', 'tester@example.com', 'member');
```

7. In Netlify, add these environment variables:

```text
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
```

8. Leave `VITE_API_URL` empty unless you are intentionally using the custom API.
9. Redeploy Netlify.

The live app will then show the private membership login screen. Members can create accounts only with a valid invite code.

Future custom API environment settings:

```text
VITE_API_URL=https://your-motion-only-api-url
WEB_APP_ORIGIN=https://your-motion-only-web-url
PUBLIC_APP_URL=https://your-motion-only-web-url
RESEND_API_KEY=your-resend-key
EMAIL_FROM=Motion Only <members@yourdomain.com>
STORAGE_ENDPOINT=your-r2-or-s3-endpoint
STORAGE_BUCKET=your-private-bucket
STORAGE_ACCESS_KEY=your-storage-access-key
STORAGE_SECRET_KEY=your-storage-secret-key
```

## Beta invite process

1. Deploy the web app on Netlify.
2. Run `supabase/motion-only-beta.sql` in the Supabase SQL editor.
3. Add the Supabase URL and publishable key to Netlify environment variables.
4. Redeploy Netlify.
5. Create invite codes in Supabase for the testers.
6. Send each person their own invite code.
7. Ask them to test on phone and desktop.

## Feedback questions for testers

Ask for feedback on these first:

- Did the invite and login process feel clear?
- Did the app feel private and trustworthy?
- Did Today, goals, habits and XP make sense?
- Did Network and Messages feel like a shared space?
- Did Projects feel useful for collaboration?
- What felt confusing or unnecessary?
- What would make them come back tomorrow?

## Honest launch note

For 30 people, this can absolutely be done. The main risk is not scale. Thirty people is easy from a technical point of view. The real risk is expectation: if testers think this is a finished daily-use product, they will notice the demo-led screens quickly. Position it as a private beta walkthrough and early product test, then connect the highest-value features to live data next.
