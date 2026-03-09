

# Corrigir exclusão de inscritos — RLS policy faltando

## Problema
A tabela `evento_inscricoes` não possui política RLS para DELETE. O Supabase silenciosamente ignora o DELETE sem erro, mas não remove nenhuma linha.

## Solução
Criar uma política RLS de DELETE que permita:
- Admins e equipe Seven excluírem qualquer inscrição
- Usuários excluírem suas próprias inscrições

**Migration SQL**:
```sql
CREATE POLICY "Admins and seven team can delete inscricoes"
ON public.evento_inscricoes
FOR DELETE
TO authenticated
USING (is_admin(auth.uid()) OR is_seven_team(auth.uid()) OR user_id = auth.uid());
```

**Arquivo afetado**: Nenhum arquivo de código — apenas migration SQL.

