

# Correção: Atividades criadas por Pedro não aparecem

## Diagnóstico

O INSERT na tabela `atividades` tem política permissiva (`WITH CHECK (true)`), então a criação sempre funciona. Porém a política de **SELECT** exige:

```
gestor_id = auth.uid() 
OR corretor_id IN (get_corretor_ids_by_user(auth.uid()))
```

Se Pedro cria uma atividade **sem se definir como gestor** (campo `gestor_id` vazio ou apontando para outro usuário) e não é corretor vinculado, o registro é inserido mas ele **não consegue lê-lo de volta**. O `.select().single()` no INSERT falha silenciosamente pelo RLS, e a atividade não aparece na listagem.

Além disso, não existe trigger `auto_set_gestor_id` para a tabela `atividades` (só existe para `clientes`).

## Correções

### 1. Migration SQL — Duas mudanças

**a) Adicionar `created_by` na política de SELECT e UPDATE de atividades:**

```sql
DROP POLICY IF EXISTS "Users can view own atividades" ON atividades;
CREATE POLICY "Users can view own atividades"
ON atividades FOR SELECT TO authenticated
USING (
  gestor_id = auth.uid() 
  OR created_by = auth.uid()
  OR corretor_id IN (SELECT get_corretor_ids_by_user(auth.uid()))
);

DROP POLICY IF EXISTS "Users can update own atividades" ON atividades;
CREATE POLICY "Users can update own atividades"
ON atividades FOR UPDATE TO authenticated
USING (
  gestor_id = auth.uid() 
  OR created_by = auth.uid()
  OR corretor_id IN (SELECT get_corretor_ids_by_user(auth.uid()))
);
```

Isso garante que quem criou a atividade sempre pode vê-la e editá-la.

**b) Criar trigger para auto-preencher `gestor_id` quando o criador é gestor_produto:**

```sql
CREATE OR REPLACE FUNCTION public.auto_set_gestor_id_atividades()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.gestor_id IS NULL AND public.has_role(auth.uid(), 'gestor_produto') THEN
    NEW.gestor_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_set_gestor_id_atividades
BEFORE INSERT ON public.atividades
FOR EACH ROW EXECUTE FUNCTION public.auto_set_gestor_id_atividades();
```

### 2. Sem alteração de código frontend

As políticas e o trigger resolvem o problema na camada do banco. O hook `useCreateAtividade` já usa `.select().single()` após o INSERT, que passará a funcionar corretamente com o `created_by` na política de SELECT.

### Resultado esperado
- Atividades criadas por Pedro (ou qualquer usuário) ficam visíveis imediatamente
- Se Pedro é `gestor_produto`, o `gestor_id` é preenchido automaticamente quando omitido
- Não há impacto em outros fluxos (a política é aditiva com OR)

