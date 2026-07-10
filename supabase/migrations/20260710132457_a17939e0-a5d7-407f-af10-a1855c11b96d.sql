
CREATE POLICY "nexa contratos pdf select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'nexa-contratos-pdf' AND (public.is_nexa_user(auth.uid()) OR public.is_admin(auth.uid())));
CREATE POLICY "nexa contratos pdf insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'nexa-contratos-pdf' AND (public.is_nexa_user(auth.uid()) OR public.is_admin(auth.uid())));
CREATE POLICY "nexa contratos pdf update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'nexa-contratos-pdf' AND (public.is_nexa_user(auth.uid()) OR public.is_admin(auth.uid())));
CREATE POLICY "nexa contratos pdf delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'nexa-contratos-pdf' AND (public.is_nexa_user(auth.uid()) OR public.is_admin(auth.uid())));
