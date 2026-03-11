-- Allow authenticated users to view saved items for public profile rendering.
DROP POLICY IF EXISTS "Users can view their own saved items" ON public.saved_items;

CREATE POLICY "Authenticated users can view saved items"
  ON public.saved_items
  FOR SELECT
  TO authenticated
  USING (true);
