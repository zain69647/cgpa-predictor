CREATE TABLE public.marksheet_uploads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  parsed JSONB,
  parse_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX marksheet_uploads_session_idx ON public.marksheet_uploads (session_id, created_at DESC);

GRANT SELECT, INSERT ON public.marksheet_uploads TO anon;
GRANT SELECT, INSERT ON public.marksheet_uploads TO authenticated;
GRANT ALL ON public.marksheet_uploads TO service_role;

ALTER TABLE public.marksheet_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create an upload record"
  ON public.marksheet_uploads FOR INSERT TO anon, authenticated
  WITH CHECK (char_length(session_id) BETWEEN 8 AND 64);

CREATE POLICY "Uploads are readable by their session"
  ON public.marksheet_uploads FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can upload a marksheet file"
  ON storage.objects FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'marksheets');

CREATE POLICY "Marksheet files are readable"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'marksheets');