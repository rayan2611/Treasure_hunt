-- Run schema.sql first, then all files under supabase/migrations/, then this.
--
-- Question content is participant-facing location guidance ONLY — no accepted
-- answers, hints, or physical locations are stored (see
-- supabase/migrations/004_real_riddle_content.sql for why).

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
    '2026-09-06 17:15:00+05:30'
  )
  returning id
)
insert into questions (
  event_id,
  question_number,
  question_text,
  accepted_answers,
  validation_mode
)
select id, 1, $q1$Where Lakshmi's grace met Durga's might,
A queen rose to a fight,
Her throne was lost but her name reigned,
can you find the place that honours her flame?$q1$, '{}', 'EXACT_NORMALIZED' from inserted_event
union all
select id, 2, $q2$I hold a king who bowed to Vishnu's stride,
Where giant serpents and deep illusions hide.
To save his brother, Krishna walked my floor,
And brought his light where shadows ruled before.$q2$, '{}', 'EXACT_NORMALIZED' from inserted_event
union all
select id, 3, $q3$No crown, no sword, just strings in hand —
behind every act, every scene he'd stand,
unseen but running the whole grand plan.$q3$, '{}', 'EXACT_NORMALIZED' from inserted_event
union all
select id, 4, $q4$There came a day when Surya Dev,
whose radiance made even the heavens shine,
became a burden to the one closest to him.
His wife Sanjna, unable to bear his blazing splendour,
left him and sought refuge with her father.
But the father was no ordinary man.
He was the divine craftsman,
the one who shaped celestial wonders
and fashioned weapons for the gods.
When Surya came before him,
the craftsman did something no one else could dare —
he worked upon the Sun himself,
lessening his unbearable brilliance
so that Sanjna could once again behold her husband.
Where did Surya Dev come to seek this extraordinary remedy?$q4$, '{}', 'EXACT_NORMALIZED' from inserted_event
union all
select id, 5, $q5$स कालः परमाणुवै भङ्गुरो गोचरो नृणाम् ।
यः सर्वं ग्रसते लोकं अनिमिषोऽव्ययः प्रभुः ॥

Meaning: This eternal time is the ultimate master, completely undecaying and sleepless. It silently and gradually swallows up the lifespans of all living entities in this universe, moving imperceptibly from the smallest unit (an atom) to the entire life of Brahma.$q5$, '{}', 'EXACT_NORMALIZED' from inserted_event
union all
select id, 6, $q6$They saw a spark in empty space,
And built a dream to take its place.
With steady hands and quiet grace,
They paved a path for all the rest.

Rest in his presence and claim a quiet seat,
To learn from the lifetime that made his soul complete.$q6$, '{}', 'EXACT_NORMALIZED' from inserted_event
union all
select id, 7, $q7$He is like Ravana, but maybe he isn't,
He's someone who can not die,
Even being scattered like pieces, his fear reigns.
Who is he?$q7$, '{}', 'EXACT_NORMALIZED' from inserted_event
union all
select id, 8, $q8$Fingers that never lost, though the cubes weren't fair — a kingdom slipped away, and none saw the trick in the air.

No crown, no sword, just strings in hand — behind every act, every scene he'd stand, unseen but running the whole grand plan.

A step behind the throne, never wearing the crown — yet every wise move was his, not the king's own.

No sword, no shield — just bare arms and might, when a mace met a fist, only one man won that fight.

Risen from a churning sea, mane like foam, heads too many to name — the first of its kind, no rider could ever tame.

These 5 men, they chose to meet one day... but where could such striking company share a lair?$q8$, '{}', 'EXACT_NORMALIZED' from inserted_event;

-- After running, copy the event UUID:
select id, name, status from events order by created_at desc limit 1;

-- Put that UUID in:
-- NEXT_PUBLIC_EVENT_ID=<uuid>
