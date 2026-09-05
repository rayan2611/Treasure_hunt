-- 004_real_riddle_content.sql
-- Replaces the 8 placeholder seed riddles with the real event content.
-- Content-only: does not touch checkpoint_secret, checkpoint_codes logic,
-- or any gating/scanning mechanic. Run manually in the Supabase SQL editor.
--
-- CRITICAL: question_text is the ONLY participant-facing content here.
-- No accepted_answers, hints, or physical locations are stored anywhere —
-- those stay entirely offline with the organizing team.

update questions set title = null, question_text = 'Where Lakshmi''s grace met Durga''s might,
A queen rose to a fight,
Her throne was lost but her name reigned,
can you find the place that honours her flame?', accepted_answers = '{}', updated_at = now()
where question_number = 1;

update questions set title = null, question_text = 'I hold a king who bowed to Vishnu''s stride,
Where giant serpents and deep illusions hide.
To save his brother, Krishna walked my floor,
And brought his light where shadows ruled before.', accepted_answers = '{}', updated_at = now()
where question_number = 2;

update questions set title = null, question_text = 'No crown, no sword, just strings in hand —
behind every act, every scene he''d stand,
unseen but running the whole grand plan.', accepted_answers = '{}', updated_at = now()
where question_number = 3;

update questions set title = null, question_text = 'There came a day when Surya Dev,
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
Where did Surya Dev come to seek this extraordinary remedy?', accepted_answers = '{}', updated_at = now()
where question_number = 4;

update questions set title = null, question_text = 'स कालः परमाणुवै भङ्गुरो गोचरो नृणाम् ।
यः सर्वं ग्रसते लोकं अनिमिषोऽव्ययः प्रभुः ॥

Meaning: This eternal time is the ultimate master, completely undecaying and sleepless. It silently and gradually swallows up the lifespans of all living entities in this universe, moving imperceptibly from the smallest unit (an atom) to the entire life of Brahma.', accepted_answers = '{}', updated_at = now()
where question_number = 5;

update questions set title = null, question_text = 'They saw a spark in empty space,
And built a dream to take its place.
With steady hands and quiet grace,
They paved a path for all the rest.

Rest in his presence and claim a quiet seat,
To learn from the lifetime that made his soul complete.', accepted_answers = '{}', updated_at = now()
where question_number = 6;

update questions set title = null, question_text = 'He is like Ravana, but maybe he isn''t,
He''s someone who can not die,
Even being scattered like pieces, his fear reigns.
Who is he?', accepted_answers = '{}', updated_at = now()
where question_number = 7;

update questions set title = null, question_text = 'Fingers that never lost, though the cubes weren''t fair — a kingdom slipped away, and none saw the trick in the air.

No crown, no sword, just strings in hand — behind every act, every scene he''d stand, unseen but running the whole grand plan.

A step behind the throne, never wearing the crown — yet every wise move was his, not the king''s own.

No sword, no shield — just bare arms and might, when a mace met a fist, only one man won that fight.

Risen from a churning sea, mane like foam, heads too many to name — the first of its kind, no rider could ever tame.

These 5 men, they chose to meet one day... but where could such striking company share a lair?', accepted_answers = '{}', updated_at = now()
where question_number = 8;
