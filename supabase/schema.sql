create extension if not exists pgcrypto;

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null default 'DRAFT'
    check (status in ('DRAFT','REGISTRATION','LIVE','PAUSED','ENDED')),
  registration_open boolean not null default false,
  hunt_start_time timestamptz,
  hunt_end_time timestamptz,
  total_questions integer not null default 8 check (total_questions > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  question_number integer not null,
  title text,
  question_text text not null,
  media_url text,
  accepted_answers text[] not null,
  validation_mode text not null default 'EXACT_NORMALIZED'
    check (validation_mode in ('EXACT_NORMALIZED','MULTIPLE_ACCEPTED','OPTIONAL_FUZZY')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(event_id, question_number)
);

create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  team_name text not null,
  leader_name text not null,
  leader_bits_id text not null
    check (leader_bits_id ~ '^202[0-9][A-Z]\d[A-Z]{2}\d{4}[A-Z]$'),
  login_code text not null check (login_code ~ '^\d{4}$'),
  members jsonb not null default '[]'::jsonb
    check (jsonb_array_length(members) between 2 and 4),
  contact_number text,
  current_question integer not null default 1,
  questions_completed integer not null default 0,
  registered_at timestamptz not null default now(),
  last_completed_at timestamptz,
  finished_at timestamptz,
  status text not null default 'ACTIVE'
    check (status in ('ACTIVE','FINISHED','DISQUALIFIED')),
  session_version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(event_id, leader_bits_id)
);

create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  team_id uuid not null references teams(id) on delete cascade,
  question_id uuid not null references questions(id) on delete cascade,
  question_number integer not null,
  submitted_answer text not null,
  normalized_answer text not null,
  correct boolean not null,
  submitted_at timestamptz not null default now()
);

create table if not exists admins (
  user_id uuid primary key,
  display_name text,
  created_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid,
  action text not null,
  team_id uuid references teams(id) on delete set null,
  question_id uuid references questions(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists teams_login_code_idx
  on teams(event_id, login_code);

create index if not exists teams_leader_bits_idx
  on teams(event_id, leader_bits_id);

create index if not exists teams_leaderboard_idx
  on teams(event_id, questions_completed desc, last_completed_at asc);

create index if not exists submissions_team_time_idx
  on submissions(team_id, submitted_at desc);

create index if not exists questions_event_number_idx
  on questions(event_id, question_number);

alter table events enable row level security;
alter table questions enable row level security;
alter table teams enable row level security;
alter table submissions enable row level security;
alter table admins enable row level security;
alter table audit_logs enable row level security;

-- Public/browser access should be minimal.
-- Server routes use the service-role key and therefore bypass RLS.
-- Keep direct anon access blocked unless you deliberately add policies.

create or replace function normalize_treasure_answer(v text)
returns text
language sql
immutable
as $$
  select regexp_replace(
    lower(trim(regexp_replace(v, '[[:punct:]]', '', 'g'))),
    '[[:space:]]+',
    ' ',
    'g'
  );
$$;

create or replace function submit_answer_atomic(
  p_team_id uuid,
  p_question_id uuid,
  p_answer text
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
  v_normalized text;
  v_correct boolean := false;
  v_total integer;
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
  where id = p_question_id
    and event_id = v_team.event_id
    and is_active = true;

  if not found or v_question.question_number <> v_team.current_question then
    return query select 'QUESTION_LOCKED', v_team.current_question, v_team.questions_completed, false;
    return;
  end if;

  v_normalized := normalize_treasure_answer(p_answer);

  select exists (
    select 1
    from unnest(v_question.accepted_answers) as accepted
    where normalize_treasure_answer(accepted) = v_normalized
  ) into v_correct;

  insert into submissions (
    event_id,
    team_id,
    question_id,
    question_number,
    submitted_answer,
    normalized_answer,
    correct
  ) values (
    v_team.event_id,
    v_team.id,
    v_question.id,
    v_question.question_number,
    p_answer,
    v_normalized,
    v_correct
  );

  if not v_correct then
    return query select 'WRONG_ANSWER', v_team.current_question, v_team.questions_completed, false;
    return;
  end if;

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

    return query select 'OK', current_question, questions_completed, true;
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

  return query select 'OK', current_question, questions_completed, false;
end;
$$;

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
  )
  select *
  from ranked
  order by rank
  limit greatest(1, least(p_limit, 100));
$$;
