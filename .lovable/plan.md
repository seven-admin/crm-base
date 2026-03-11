

# Permitir super admin confirmar/cancelar inscrições

## Problema
A política de RLS para UPDATE na tabela `evento_inscricoes` só permite que o próprio usuário atualize suas inscrições (`user_id = auth.uid()`). Super admins e admins não conseguem alterar o status de inscrições de outros usuários.

## Solução

### Migração SQL
Alterar a política de UPDATE para incluir admins e equipe Seven:

```sql
DROP POLICY "Users can update own inscricoes" ON public.evento_inscricoes;

CREATE POLICY "Users and admins can update inscricoes"
ON public.evento_inscricoes
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  OR is_admin(auth.uid())
  OR is_seven_team(auth.uid())
)
WITH CHECK (
  user_id = auth.uid()
  OR is_admin(auth.uid())
  OR is_seven_team(auth.uid())
);
```

### Código
Nenhuma alteração de código necessária — o `toggleStatusMutation` no `EventoInscritosTab.tsx` já implementa a lógica de confirmar/cancelar corretamente. O problema é exclusivamente de permissão no banco.

## Arquivo alterado
- Migração SQL (RLS policy)

