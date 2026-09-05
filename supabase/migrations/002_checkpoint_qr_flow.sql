-- 002_checkpoint_qr_flow.sql
-- Replaces free-text answer submission with a physical QR-checkpoint scan flow.
-- Additive only: no existing tables/columns/data are dropped or altered destructively.
-- Run this manually in the Supabase SQL editor.

-- 1. New columns on questions -------------------------------------------------

alter table questions
  add column if not exists checkpoint_secret text unique not null
    default encode(gen_random_bytes(24), 'hex');

alter table questions
  add column if not exists latitude double precision;

alter table questions
  add column if not exists longitude double precision;

comment on column questions.checkpoint_secret is
  'Non-guessable token embedded in the printed QR code for this checkpoint. Never expose to team-facing APIs.';
comment on column questions.latitude is
  'Unused future extension point for GPS/location verification. Not read by any current logic.';
comment on column questions.longitude is
  'Unused future extension point for GPS/location verification. Not read by any current logic.';

-- 2. checkpoint_codes table ---------------------------------------------------

create table if not exists checkpoint_codes (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references teams(id) on delete cascade,
  question_id uuid references questions(id) on delete cascade,
  code text not null,
  issued_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz,
  status text not null check (status in ('ACTIVE', 'USED', 'EXPIRED', 'SUPERSEDED')),
  created_at timestamptz not null default now()
);

create index if not exists checkpoint_codes_team_question_status_idx
  on checkpoint_codes(team_id, question_id, status);

alter table checkpoint_codes enable row level security;

-- Public/browser access should be minimal.
-- Server routes use the service-role key and therefore bypass RLS.
-- Keep direct anon access blocked unless you deliberately add policies.

-- 3. Shared "advance progress" helper ----------------------------------------
-- Factored out of submit_answer_atomic's tail so redeem_checkpoint_code can
-- reuse identical finish-handling behavior without duplicating it.

create or replace function advance_team_after_checkpoint(
  p_team_id uuid
)
returns table (
  current_question integer,
  questions_completed integer,
  finished boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_team teams%rowtype;
  v_event events%rowtype;
  v_total integer;
begin
  select * into v_team from teams where id = p_team_id for update;

  select * into v_event from events where id = v_team.event_id;
  v_total := v_event.total_questions;

  if v_team.questions_completed + 1 >= v_total then
    update teams
    set
      questions_completed = v_total,
      current_question = v_total,
      last_completed_at = now(),
      finished_at = now(),
      status = 'FINISHED',
      updated_at = now()
    where id = v_team.id
    returning teams.current_question, teams.questions_completed
      into current_question, questions_completed;

    finished := true;
    return next;
    return;
  end if;

  update teams as t
  set
    questions_completed = t.questions_completed + 1,
    current_question = t.current_question + 1,
    last_completed_at = now(),
    updated_at = now()
  where t.id = v_team.id
  returning t.current_question, t.questions_completed
    into current_question, questions_completed;

  finished := false;
  return next;
end;
$$;

-- 4. redeem_checkpoint_code RPC -----------------------------------------------

create or replace function redeem_checkpoint_code(
  p_team_id uuid,
  p_code text
)
returns table (
  code text,
  current_question integer,
  questions_completed integer,
  finished boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_team teams%rowtype;
  v_event events%rowtype;
  v_question questions%rowtype;
  v_checkpoint checkpoint_codes%rowtype;
  v_advance record;
begin
  select * into v_team
  from teams
  where id = p_team_id
  for update;

  if not found then
    return query select 'TEAM_NOT_FOUND', 0, 0, false;
    return;
  end if;

  if v_team.status = 'DISQUALIFIED' then
    return query select 'TEAM_DISQUALIFIED', v_team.current_question, v_team.questions_completed, false;
    return;
  end if;

  if v_team.status = 'FINISHED' then
    return query select 'ALREADY_COMPLETED', v_team.current_question, v_team.questions_completed, true;
    return;
  end if;

  select * into v_event
  from events
  where id = v_team.event_id;

  if v_event.status = 'PAUSED' then
    return query select 'EVENT_PAUSED', v_team.current_question, v_team.questions_completed, false;
    return;
  end if;

  if v_event.status = 'ENDED' then
    return query select 'EVENT_ENDED', v_team.current_question, v_team.questions_completed, false;
    return;
  end if;

  if v_event.status in ('DRAFT', 'REGISTRATION') then
    return query select 'EVENT_NOT_STARTED', v_team.current_question, v_team.questions_completed, false;
    return;
  end if;

  if v_event.status <> 'LIVE' then
    return query select 'EVENT_NOT_STARTED', v_team.current_question, v_team.questions_completed, false;
    return;
  end if;

  select * into v_question
  from questions
  where event_id = v_team.event_id
    and question_number = v_team.current_question
    and is_active = true;

  if not found then
    return query select 'QUESTION_LOCKED', v_team.current_question, v_team.questions_completed, false;
    return;
  end if;

  select * into v_checkpoint
  from checkpoint_codes
  where team_id = p_team_id
    and question_id = v_question.id
    and checkpoint_codes.code = p_code
    and status = 'ACTIVE';

  if not found then
    insert into submissions (
      event_id, team_id, question_id, question_number,
      submitted_answer, normalized_answer, correct
    ) values (
      v_team.event_id, v_team.id, v_question.id, v_question.question_number,
      p_code, p_code, false
    );

    return query select 'WRONG_CODE', v_team.current_question, v_team.questions_completed, false;
    return;
  end if;

  if v_checkpoint.expires_at < now() then
    update checkpoint_codes
    set status = 'EXPIRED'
    where id = v_checkpoint.id;

    return query select 'CODE_EXPIRED', v_team.current_question, v_team.questions_completed, false;
    return;
  end if;

  update checkpoint_codes
  set status = 'USED', used_at = now()
  where id = v_checkpoint.id;

  insert into submissions (
    event_id, team_id, question_id, question_number,
    submitted_answer, normalized_answer, correct
  ) values (
    v_team.event_id, v_team.id, v_question.id, v_question.question_number,
    p_code, p_code, true
  );

  select * into v_advance from advance_team_after_checkpoint(v_team.id);

  return query select 'OK', v_advance.current_question, v_advance.questions_completed, v_advance.finished;
end;
$$;
