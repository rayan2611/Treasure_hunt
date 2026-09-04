# Janmashtami Treasure Hunt — Boilerplate

A mobile-first Next.js + Supabase starter matching the two design/engineering specs:
- cinematic Janmashtami × BITS public frontend
- team registration + resume
- server-authoritative question gating
- server-side answer validation
- live Top-10 leaderboard
- event state controls
- admin starter dashboard
- audit logs and admin team overrides

## 1. Install

```bash
npm install
```

## 2. Create Supabase project

1. Create a new Supabase project.
2. Open the SQL editor.
3. Run `supabase/schema.sql`.
4. Then run `supabase/seed.sql`.
5. Copy project keys into `.env.local` based on `.env.example`.

Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.

## 3. Admin account

Create an admin user in Supabase Auth, then insert its user UUID into `admins`:

```sql
insert into admins (user_id, display_name)
values ('SUPABASE-AUTH-USER-UUID', 'Organizer');
```

The `/admin` starter screen uses Supabase email/password auth.

## 4. Run

```bash
npm run dev
```

Open http://localhost:3000

## Important production TODOs

This is deliberately a boilerplate, not a finished production deployment.

Before event day:
- replace dummy questions
- replace placeholder visuals with approved BITS/Janmashtami assets
- tighten BITS ID validation to your campus format
- review Supabase RLS policies
- add CAPTCHA only if public registration abuse becomes a concern
- test last-4 collision flow
- load-test concurrent submissions
- add image/media upload workflow
- add real admin question editor UI
- add CSV export UI
- decide member-count constraints
- verify final tie-break rules
- run a full dry run on mobile data and campus Wi-Fi

## Key security decisions

- accepted answers never go to the browser
- future clues are never returned before unlock
- team progress is controlled by the server/database
- ranking uses server timestamps
- correct-answer progression is atomic in PostgreSQL
- team session is an HTTP-only signed JWT cookie
- admin authentication is separate from team login
