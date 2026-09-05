-- 003_relax_registration_constraints.sql
-- Organizer decisions: (1) no format restriction on leader_bits_id — teams may
-- enter it however they like; (2) team size relaxed from 3-5 to 2-5 (leader +
-- 1-4 additional members instead of 2-4).
-- Run this manually in the Supabase SQL editor. Additive/relaxing only —
-- existing rows already satisfy both new, looser constraints.

alter table teams drop constraint if exists teams_leader_bits_id_check;

alter table teams drop constraint if exists teams_members_check;
alter table teams add constraint teams_members_check
  check (jsonb_array_length(members) between 1 and 4);
