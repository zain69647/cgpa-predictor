DROP POLICY "Uploads are readable by their session" ON public.marksheet_uploads;
DROP POLICY "Marksheet files are readable" ON storage.objects;
REVOKE SELECT ON public.marksheet_uploads FROM anon;
REVOKE SELECT ON public.marksheet_uploads FROM authenticated;