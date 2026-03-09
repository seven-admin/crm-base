
# Fix: Gestor não atualiza nas Atividades

## Problema raiz
Existe um trigger `trigger_prevent_gestor_id_change` na tabela `atividades` que **impede qualquer alteração** do campo `gestor_id`, revertendo silenciosamente o valor para o original. Por isso, mesmo com o Select funcionando no modal, o banco nunca aceita a mudança.

## Solução

### 1. Migration: Alterar trigger para permitir super_admin
Modificar a função `prevent_gestor_id_change` para verificar se o usuário é `super_admin` antes de bloquear. Se for super_admin, permite a alteração; caso contrário, mantém o bloqueio.

```sql
CREATE OR REPLACE FUNCTION public.prevent_gestor_id_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.gestor_id IS NOT NULL 
     AND NEW.gestor_id IS DISTINCT FROM OLD.gestor_id 
     AND NOT public.is_super_admin(auth.uid()) THEN
    NEW.gestor_id := OLD.gestor_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

### 2. Invalidação correta no `useUpdateAtividade`
Verificar que após o update, as queries `['atividades']` e `['atividade', id]` são invalidadas para que a lista e o modal reflitam a mudança. O hook atual já invalida `['atividades']` — adicionar invalidação de `['atividade']` individual se necessário.

### Arquivos afetados
- Nova migration SQL (alterar função do trigger)
- Verificar `useUpdateAtividade` em `src/hooks/useAtividades.ts` para garantir invalidação completa
