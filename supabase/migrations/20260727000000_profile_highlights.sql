-- Profile "Highlights" - user-curated, permanently-pinned collections shown
-- as circles on the profile hero (the Instagram-highlights idea, minus the
-- ephemeral-story infrastructure that would take to build real Stories).
-- Items are stored denormalized as a jsonb array rather than a join table:
-- a highlight can mix food_cards and saved_items, two unrelated tables with
-- no shared foreign key, and the access pattern is always "read the whole
-- highlight" (never joined against by ID from elsewhere), so a jsonb list of
-- {kind, id, image, title} refs is simpler than a polymorphic join table.

create table if not exists public.profile_highlights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  cover_image_url text,
  items jsonb not null default '[]'::jsonb,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profile_highlights_user_id_idx on public.profile_highlights(user_id, position);

alter table public.profile_highlights enable row level security;

-- Public read, same as the users table itself ("Users are viewable by
-- everyone") - highlights are meant to show on a profile anyone can visit.
create policy "Highlights are viewable by everyone." on public.profile_highlights
  for select using (true);

create policy "Users can insert their own highlights." on public.profile_highlights
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own highlights." on public.profile_highlights
  for update using (auth.uid() = user_id);

create policy "Users can delete their own highlights." on public.profile_highlights
  for delete using (auth.uid() = user_id);
