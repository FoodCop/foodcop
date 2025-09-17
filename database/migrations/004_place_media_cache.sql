create table if not exists place_media_cache (
  place_id text primary key,
  photo_name text,
  photo_uri text,
  attributions jsonb,
  updated_at timestamptz default now()
);

alter table place_media_cache enable row level security;

create policy "read cache" on place_media_cache for select to anon, authenticated using (true);
