-- Resources used by the app that are not created by table migrations alone.
-- Uploads use <auth user ID>/<knowledge base ID>/<timestamp>-<filename>.
-- Knowledge routes currently authorize the owner, so these policies preserve that
-- boundary without granting teammates new access to knowledge data.
INSERT INTO storage.buckets (id, name, public)
VALUES ('knowledge-docs', 'knowledge-docs', false)
ON CONFLICT (id) DO UPDATE SET public = false;

CREATE POLICY "Knowledge owners can read their files"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'knowledge-docs'
  AND (storage.foldername(storage.objects.name))[1] = (SELECT auth.uid())::text
);

CREATE POLICY "Knowledge owners can upload to their bases"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'knowledge-docs'
  AND (storage.foldername(storage.objects.name))[1] = (SELECT auth.uid())::text
  AND EXISTS (
    SELECT 1 FROM public.knowledge_bases kb
    WHERE kb.user_id = (SELECT auth.uid())
      AND kb.id::text = (storage.foldername(storage.objects.name))[2]
  )
);

CREATE POLICY "Knowledge owners can update their files"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'knowledge-docs'
  AND (storage.foldername(storage.objects.name))[1] = (SELECT auth.uid())::text
)
WITH CHECK (
  bucket_id = 'knowledge-docs'
  AND (storage.foldername(storage.objects.name))[1] = (SELECT auth.uid())::text
  AND EXISTS (
    SELECT 1 FROM public.knowledge_bases kb
    WHERE kb.user_id = (SELECT auth.uid())
      AND kb.id::text = (storage.foldername(storage.objects.name))[2]
  )
);

-- Keep owner cleanup possible even after the knowledge base row was removed.
CREATE POLICY "Knowledge owners can delete their files"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'knowledge-docs'
  AND (storage.foldername(storage.objects.name))[1] = (SELECT auth.uid())::text
);

-- Publication membership enables the existing subscriptions. RLS on each table
-- remains the source of truth for which authenticated users receive each row.
DO $$
DECLARE
  table_name text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  FOREACH table_name IN ARRAY ARRAY['messages', 'notifications', 'contacts', 'bookings']
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = table_name
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', table_name);
    END IF;
  END LOOP;
END $$;
