-- Closes the "uploaded video has no real storage pipeline yet" gap flagged in
-- STATUS_REPORT.md's Food Card Creation section: VideoCardStudio's upload
-- path was setting media_url to a local URL.createObjectURL() blob, which
-- never persists past the current page/session. This adds a real Supabase
-- Storage bucket for Create Card media uploads (currently just video, since
-- photo uploads already persist fine as data URLs in food_cards.image_url).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'food-card-media',
  'food-card-media',
  true,
  104857600, -- 100MB
  array['video/mp4', 'video/webm', 'video/quicktime']
)
on conflict (id) do nothing;

-- Public read (bucket is public, but storage.objects still needs an explicit
-- policy for the row to be visible/servable) - matches this app's existing
-- "published content is publicly viewable" convention (see food_cards' own
-- SELECT policy).
create policy "Food card media is publicly readable"
on storage.objects for select
using (bucket_id = 'food-card-media');

-- Uploads are scoped to a per-user folder (first path segment = auth.uid())
-- so a client can only ever write into their own prefix, same ownership
-- model as every other user-scoped table's RLS in this app.
create policy "Users can upload their own food card media"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'food-card-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can delete their own food card media"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'food-card-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);
