# Motion Only

Motion Only is a privacy-first, invite-only performance network for consistent
progress in business, trading and fitness.

## Test-launch application

- `native/` — the iPhone and Android application
- `api/` — the secure API, real-time messaging service and database migrations
- `render.yaml` — the private-beta hosting configuration
- `app/` — the original responsive prototype and visual reference

## Included in the 15-person release

- Invitation-gated registration, password login, magic links and password recovery
- Roles, guided onboarding, profiles and member-controlled privacy
- Goals, habits, daily motions, XP, levels, weekly Momentum and weekly reviews
- 21 complete business, trading, fitness and performance library resources
- Rooms, direct messaging, private projects and real-time WebSocket delivery
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

The web private-beta setup guide is in `docs/private-beta-launch.md`.
