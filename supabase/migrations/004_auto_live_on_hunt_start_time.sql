-- 004_auto_live_on_hunt_start_time.sql
-- The event auto-transitions from DRAFT/REGISTRATION to LIVE once
-- hunt_start_time passes, without an admin needing to manually flip status
-- at the exact moment. PAUSED/ENDED remain explicit admin decisions and take
-- priority over the clock (mirrors lib/event-status.ts on the app side).
-- Run this manually in the Supabase SQL editor.

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

  v_effective_status := v_event.status;
  if v_event.status in ('DRAFT', 'REGISTRATION')
     and v_event.hunt_start_time is not null
     and now() >= v_event.hunt_start_time then
    v_effective_status := 'LIVE';
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
