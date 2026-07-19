-- Group 1 item 6 of the profile/social backlog: real profile picture +
-- banner upload storage. users.avatar_url already exists (was already read
-- for *other* users' avatars in Chat/Notifications, just never had a real
-- upload path); banner_url does not exist yet.

alter table public.users add column if not exists banner_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-media',
  'profile-media',
  true,
  10485760, -- 10MB - plenty for a profile photo/banner, keeps upload fast
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- Same per-user-folder ownership model as food-card-media: first path
-- segment must be the uploader's own auth.uid().
create policy "Profile media is publicly readable"
on storage.objects for select
using (bucket_id = 'profile-media');

create policy "Users can upload their own profile media"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'profile-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can update their own profile media"
on storage.objects for update
to authenticated
using (
  bucket_id = 'profile-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can delete their own profile media"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'profile-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);
