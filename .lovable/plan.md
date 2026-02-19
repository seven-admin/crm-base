
# Problema: has_role() retorna false para 48 usuários

## Diagnóstico Definitivo

A tabela `user_roles` evoluiu e hoje tem duas colunas:
- `role` (enum `app_role`) — coluna antiga, **nullable**, usada pela função `has_role()`
- `role_id` (UUID → tabela `roles`) — coluna nova, usada pelo sistema de permissões moderno

A função `has_role(_user_id, _role text)` que é usada nas políticas RLS consulta apenas a coluna `role` (enum):
```sql
SELECT EXISTS (
  SELECT 1 FROM public.user_roles
  WHERE user_id = _user_id AND role::text = _role
)
```

O usuário `comercial_sm_axis01` tem `role = NULL` e `role_id = <uuid do gestor_produto>`, então `has_role()` sempre retorna `false`, bloqueando o INSERT mesmo com a política nova.

**48 de 59 usuários** estão nessa situação — ou seja, o problema afeta quase todos os usuários cadastrados pelo sistema moderno.

## Solução

### Passo 1 — Corrigir a função `has_role(uuid, text)`

Atualizar a função para consultar **ambas** as colunas: a enum `role` (legada) E o `role_id` via join na tabela `roles` (moderna):

```sql
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND (
        ur.role::text = _role
        OR EXISTS (
          SELECT 1 FROM public.roles r
          WHERE r.id = ur.role_id AND r.name = _role AND r.is_active = true
        )
      )
  )
$$;
```

### Passo 2 — Sincronizar a coluna `role` para os 48 usuários

Preencher a coluna `role` (enum) a partir do `role_id` para os usuários que têm `role = NULL`, quando o nome do role bate com valores do enum `app_role`:

```sql
-- Quais roles do enum existem?
-- Verificar: SELECT unnest(enum_range(NULL::app_role));

UPDATE public.user_roles ur
SET role = r.name::app_role
FROM public.roles r
WHERE ur.role_id = r.id
  AND ur.role IS NULL
  AND r.name IN (SELECT unnest(enum_range(NULL::app_role))::text);
```

Isso sincroniza os registros onde o nome do role existe no enum (ex: `admin`, `super_admin`, etc.).

### Passo 3 — Criar trigger para manter sincronizado automaticamente

Para que inserções futuras não voltem a ter `role = NULL`:

```sql
CREATE OR REPLACE FUNCTION public.sync_user_role_enum()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_role_name text;
BEGIN
  IF NEW.role IS NULL AND NEW.role_id IS NOT NULL THEN
    SELECT name INTO v_role_name FROM public.roles WHERE id = NEW.role_id AND is_active = true;
    BEGIN
      NEW.role := v_role_name::app_role;
    EXCEPTION WHEN invalid_text_representation THEN
      -- role_name não existe no enum, mantém NULL (roles customizados como gestor_produto)
      NULL;
    END;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_user_role_enum
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_role_enum();
```

### Por que o Passo 1 é o mais importante

Roles como `gestor_produto` **não existem no enum `app_role`** (que provavelmente contém apenas `admin`, `user`, etc.), então o UPDATE do Passo 2 não os cobre. O Passo 1 (corrigir a função) garante que qualquer role — seja do enum ou via role_id — seja reconhecido corretamente pelas políticas RLS.

## Impacto

- Resolve imediatamente o erro de RLS para `comercial_sm_axis01` e outros 47 usuários afetados
- Não altera nenhuma política RLS existente
- Não quebra nenhuma funcionalidade atual
- A correção da função afeta todas as tabelas que usam `has_role()` nas suas políticas — todas se beneficiam

## Arquivos

Apenas uma migration SQL — zero alterações em código React.
