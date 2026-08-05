-- Acesso a Propostas: passa a ser exclusivo de super_admin.
-- 1) Remove as permissões de módulo de nexa_admin/nexa_gestor (some da nav/rota deles).
DELETE FROM public.sistema_role_permissions rp
USING public.sistema_modules m, public.roles r
WHERE rp.module_id = m.id AND rp.role_id = r.id
  AND m.name = 'nexa_propostas_acesso'
  AND r.name IN ('nexa_admin', 'nexa_gestor');

-- 2) Escrita (atribuir acesso) só super_admin. Mantém o SELECT do próprio acesso
--    (o feed precisa que cada usuário leia os empreendimentos atribuídos a ele).
DROP POLICY IF EXISTS "Admins gerenciam acesso" ON public.nexa_propostas_acesso;
CREATE POLICY "Super admin gerencia acesso" ON public.nexa_propostas_acesso FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));
