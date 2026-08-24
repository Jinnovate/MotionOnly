# Motion Only

Motion Only is a privacy-first, invite-only performance network for consistent
progress in business, trading and focused execution.

## Test-launch application

- `app/` — the live Netlify web app and product prototype
- `supabase/` — Supabase private-beta account and invite setup
- `native/` — the future iPhone and Android application work
- `api/` — archived custom API route for later backend expansion

## Included in the 15-person release

- Invitation-gated registration, password login, magic links and password recovery
- Roles, guided onboarding, profiles and member-controlled privacy
- Goals, habits, daily motions, XP and progress tracking
- 21 complete business, trading, fitness and performance library resources
- Rooms, direct messaging and private project workspaces
- Private achievements and evidence files, notifications, blocks and moderation reports
- Administration for members, invitations, roles, rooms and moderation

Goals, progress, reviews, project content, achievements and evidence are private
by default. The mobile client never contains storage, database or email secrets.

## Validation

From this directory:

```bash
npm run build
cd api && npm run typecheck && npm run test:migrations
cd ../native && npm run typecheck
```

The launch handoff is in `outputs/Motion-Only-Test-Launch-Runbook.md`.

The current live test route is Netlify + GitHub + Supabase. The web private-beta
setup guide is in `docs/private-beta-launch.md`.
