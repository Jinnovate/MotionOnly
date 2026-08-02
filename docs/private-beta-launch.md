# Motion Only private beta launch

This is the practical path for letting around 30 invited people test Motion Only with real accounts.

## What is ready

- Invite-only registration through single-use invite codes
- Email and password login
- Optional magic-link login
- Secure member sessions
- Admin-controlled invitations, roles, rooms, members and moderation
- PostgreSQL database for real data
- Redis for sessions, real-time tickets and reliability
- Private file storage support for evidence and project media
- WebSocket support for live rooms and messages

The web app now has two modes:

- Demo mode: if `VITE_API_URL` is not set, the app opens straight into the clickable prototype.
- Private beta mode: if `VITE_API_URL` is set, members must sign in or accept an invite before they can enter.

## What is still prototype-led

The front end now has the correct private beta gate, but not every page is fully live-data connected yet. Some areas still use polished demo data after login. That is fine for an early 30-person walkthrough if the goal is product feedback, flow, vibe and feature testing.

Before people rely on it daily, connect the main screens to the API in this order:

1. Today, goals, habits and Momentum
2. Network rooms and messages
3. Project workspaces, pinned messages and media
4. Schedule and notifications
5. Operations admin controls

## Local private beta test

### 1. Start the API

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

For a real external test, use:

- Render for the API, PostgreSQL and Redis using `render.yaml`
- Netlify, Vercel or another static host for the web app
- Resend for email delivery
- Cloudflare R2 or another S3-compatible private bucket for uploads

Production environment settings:

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

1. Deploy the API.
2. Deploy the web app with `VITE_API_URL` pointing at the API.
3. Bootstrap your admin account.
4. Sign in as admin.
5. Create invite codes for the 30 testers.
6. Send each person their own invite link.
7. Ask them to test on phone and desktop.

## Feedback questions for testers

Ask for feedback on these first:

- Did the invite and login process feel clear?
- Did the app feel private and trustworthy?
- Did Today, goals, habits and Momentum make sense?
- Did Network and Messages feel like a shared space?
- Did Projects feel useful for collaboration?
- What felt confusing or unnecessary?
- What would make them come back tomorrow?

## Honest launch note

For 30 people, this can absolutely be done. The main risk is not scale. Thirty people is easy from a technical point of view. The real risk is expectation: if testers think this is a finished daily-use product, they will notice the demo-led screens quickly. Position it as a private beta walkthrough and early product test, then connect the highest-value features to live data next.
