-- Run schema.sql first.

with inserted_event as (
  insert into events (
    name,
    status,
    registration_open,
    total_questions,
    hunt_start_time
  )
  values (
    'Janmashtami Treasure Hunt 2026',
    'DRAFT',
    false,
    8,
    '2026-09-06 17:00:00+05:30'
  )
  returning id
)
insert into questions (
  event_id,
  question_number,
  title,
  question_text,
  accepted_answers,
  validation_mode
)
select
  id,
  q.question_number,
  q.title,
  q.question_text,
  q.accepted_answers,
  'EXACT_NORMALIZED'
from inserted_event,
lateral (
  values
    (1, 'The First Trail', 'Dummy clue 1: Who is at the heart of Janmashtami?', array['krishna','lord krishna']),
    (2, 'A Note in the Night', 'Dummy clue 2: What instrument is closely associated with Krishna?', array['flute','bansuri']),
    (3, 'The Feather', 'Dummy clue 3: Which bird feather is famously associated with Krishna?', array['peacock']),
    (4, 'The Hidden Pot', 'Dummy clue 4: Name the traditional clay pot motif.', array['matki','handi']),
    (5, 'The Companion', 'Dummy clue 5: Name Krishna''s beloved companion.', array['radha']),
    (6, 'The Childhood Trail', 'Dummy clue 6: Name a place associated with Krishna''s childhood.', array['gokul']),
    (7, 'The Stolen Treat', 'Dummy clue 7: What food is Krishna famously said to steal?', array['butter','makhan']),
    (8, 'The Final Grove', 'Dummy clue 8: Name the sacred town strongly associated with Krishna and Radha.', array['vrindavan'])
) as q(question_number, title, question_text, accepted_answers);

-- After running, copy the event UUID:
select id, name, status from events order by created_at desc limit 1;

-- Put that UUID in:
-- NEXT_PUBLIC_EVENT_ID=<uuid>
