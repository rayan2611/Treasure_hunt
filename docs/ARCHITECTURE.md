# Architecture Notes

## Public flow

`/` → `/register` or `/login` → `/hunt` → `/finish`

Leaderboard is public at `/leaderboard`.

## Team session

A successful login (team name / mobile / BITS ID + the team's chosen 4-digit PIN) creates an HTTP-only JWT cookie containing:
- teamId
- sessionVersion
- role=TEAM

Each protected team route re-reads the team from the database and confirms the stored `session_version` still matches.

## Question gating

The browser never asks for `questionNumber = N`.

`GET /api/question/current`:
1. reads team session
2. loads authoritative team row
3. reads `team.current_question`
4. returns only that question

Future questions and `accepted_answers` are therefore never part of the client payload.

## Correct-answer progression

`POST /api/answer/submit` calls PostgreSQL RPC `submit_answer_atomic`.

The function:
1. locks team row (`FOR UPDATE`)
2. checks event is LIVE
3. checks team is active
4. checks submitted question is exactly the current question
5. normalizes and validates answer inside PostgreSQL
6. logs the attempt
7. advances team once
8. uses server timestamps
9. marks final completion atomically

This prevents double-submit from skipping questions.

## Leaderboard

`get_public_leaderboard` ranks:
1. questions_completed DESC
2. teams with a real `last_completed_at` before null ones
3. last_completed_at ASC
4. registered_at ASC

Disqualified teams are excluded.

Only public-safe fields are returned.

## Admin

Admin auth uses Supabase Auth.

The caller supplies a Supabase access token to admin APIs.
`requireAdmin()` verifies:
1. token belongs to a real Supabase Auth user
2. user UUID exists in `admins`

The included dashboard is intentionally minimal; APIs are scaffolded for extending controls.

## Production improvements

- Replace in-memory rate limiter with Redis/Upstash or DB rate limiting.
- Add stronger audit handling around all admin mutation endpoints.
- Add optimistic locking to admin team overrides if multiple organizers will use the panel.
- Consider a dedicated `question_completions` table if you need richer per-stage timing analytics.
- Add a proper admin question editor.
- Add CSV export routes.
- Add a media-upload/storage policy.
- Add a second organizer-only factor or Google SSO.
