-- 006_team_test_access.sql
-- Lets an admin flag a specific team (e.g. the organizers' own dry-run team)
-- with early access to checkpoints/questions before hunt_start_time, while
-- every other team stays gated by the normal auto-live clock. Test-access
-- teams are also excluded from the public leaderboard so they don't confuse
-- real participants. Run manually in the Supabase SQL editor.

alter table teams add column if not exists test_access boolean not null default false;

comment on column teams.test_access is
  'Bypasses the hunt_start_time gate for this team only (organizer dry-run/testing). Excluded from the public leaderboard.';

-- redeem_checkpoint_code: skip the event-status/time gate entirely for a
-- test_access team (still respects DISQUALIFIED/FINISHED/sequential gating).
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
  v_effective_status text;
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

  if v_team.test_access then
    v_effective_status := 'LIVE';
  else
    v_effective_status := v_event.status;
    if v_event.status in ('DRAFT', 'REGISTRATION')
       and v_event.hunt_start_time is not null
       and now() >= v_event.hunt_start_time then
      v_effective_status := 'LIVE';
    end if;
  end if;

  if v_effective_status = 'PAUSED' then
    return query select 'EVENT_PAUSED', v_team.current_question, v_team.questions_completed, false;
    return;
  end if;

  if v_effective_status = 'ENDED' then
    return query select 'EVENT_ENDED', v_team.current_question, v_team.questions_completed, false;
    return;
  end if;

  if v_effective_status <> 'LIVE' then
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

-- Leaderboard: exclude test-access teams (dry-run teams shouldn't appear
-- alongside real participants), in addition to the existing DISQUALIFIED exclusion.
create or replace function get_public_leaderboard(
  p_event_id uuid,
  p_limit integer default 10
)
returns table (
  rank bigint,
  team_name text,
  questions_completed integer,
  total_questions integer,
  status text
)
language sql
security definer
set search_path = public
as $$
  with ranked as (
    select
      row_number() over (
        order by
          t.questions_completed desc,
          case when t.last_completed_at is null then 1 else 0 end asc,
          t.last_completed_at asc,
          t.registered_at asc
      ) as rank,
      t.team_name,
      t.questions_completed,
      e.total_questions,
      t.status
    from teams t
    join events e on e.id = t.event_id
    where t.event_id = p_event_id
      and t.status <> 'DISQUALIFIED'
      and t.test_access = false
  )
  select *
  from ranked
  order by rank
  limit greatest(1, least(p_limit, 100));
$$;
