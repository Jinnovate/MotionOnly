# Motion Only API

The API is a privacy-first TypeScript modular monolith for the Motion Only
iPhone and Android application.

## Included

- Single-use invitations, Argon2 passwords, optional magic links and password recovery
- Opaque Redis sessions, session revocation and single-use real-time tickets
- Profiles, onboarding, privacy preferences, roles and audit events
- Goals, habits, daily motions, library progress and private weekly reviews
- Server-authoritative XP, levels and timezone-aware weekly Momentum settlement
- Topic rooms, direct messages, projects, notifications, blocks and moderation
- Private S3-compatible evidence storage with owner-only signed downloads
- Protected administration for members, invitations, roles, rooms and reports

## Local use

1. Copy `.env.example` to `.env`.
2. Start `compose.yaml` with a Docker-compatible runtime.
3. Run `npm install`.
4. Run `npm run dev`.

Database migrations run automatically under a database advisory lock. Before a
release, run:

```bash
npm run typecheck
npm run test:migrations
```

`render.yaml` in the repository root provisions an always-on API, private
PostgreSQL database and persistent private Key Value service. Production also
requires a verified Resend sender and a private S3-compatible bucket such as
Cloudflare R2.
