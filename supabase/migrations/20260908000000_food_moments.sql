-- "My Food Moments" - a small curated grid on the profile (redesign per the
-- new Profile mockup) distinct from profile_highlights: a highlight points
-- at existing food_cards/saved_items, while a moment is its own freestanding
-- photo + one-line title + type (favorite food / favorite place / a plain
-- memory) - there's no existing record to point at for "the dish I ate on
-- vacation that was never a food_card".

create table if not exists public.food_moments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  moment_type text not null check (moment_type in ('food', 'place', 'memory')),
  title text not null,
  image_url text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists food_moments_user_id_idx on public.food_moments(user_id, position);

alter table public.food_moments enable row level security;

-- Public read, same as profile_highlights - shown on any profile a visitor opens.
create policy "Food moments are viewable by everyone." on public.food_moments
  for select using (true);

create policy "Users can insert their own food moments." on public.food_moments
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own food moments." on public.food_moments
  for update using (auth.uid() = user_id);

create policy "Users can delete their own food moments." on public.food_moments
  for delete using (auth.uid() = user_id);

-- Storage bucket for moment photos - same per-user-folder ownership model as
-- profile-media/food-card-media.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'food-moments',
  'food-moments',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

create policy "Food moment media is publicly readable"
on storage.objects for select
using (bucket_id = 'food-moments');

create policy "Users can upload their own food moment media"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'food-moments'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can delete their own food moment media"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'food-moments'
  and (storage.foldername(name))[1] = auth.uid()::text
);
