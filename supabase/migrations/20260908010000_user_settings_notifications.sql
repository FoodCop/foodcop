-- Settings redesign: the new drill-down "Notifications" panel needs real
-- columns to read/write instead of more uncontrolled checkboxes. Appended to
-- the existing 1:1 user_settings table rather than a new one - same pattern
-- as every other toggle already there.
alter table public.user_settings
  add column if not exists notify_messages boolean not null default true,
  add column if not exists notify_social boolean not null default true,
  add column if not exists notify_recommendations boolean not null default true;
