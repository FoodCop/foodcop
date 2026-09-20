-- Let the food-card-media bucket hold photos as well as videos.
--
-- Card photos are stored inside food_cards.image_url as base64 data URLs, which
-- is fine for the app's own screens but cannot be sent in a chat message (a
-- single photo is megabytes). When a card is shared, the chat now uploads its
-- photo here once and sends the resulting link instead. Uploads stay scoped to
-- the uploader's own folder by the existing per-user storage policy.
UPDATE storage.buckets
SET allowed_mime_types = (
  SELECT ARRAY(SELECT DISTINCT unnest(COALESCE(allowed_mime_types, ARRAY[]::text[]) || ARRAY['image/jpeg', 'image/png', 'image/webp']))
)
WHERE id = 'food-card-media';
