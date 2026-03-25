

# Correção: RLS INSERT na tabela clientes para Corretores e Gestores de Imobiliária

## Diagnóstico

O corretor **Marcelo Teixeira Galvão** (user `d6cc2f1a`, corretor `25839574`, role `corretor`) e gestores de imobiliária estão recebendo erro de RLS ao cadastrar clientes no Portal.

**Dados confirmados no banco:**
- Marcelo tem `user_id` corretamente vinculado ao corretor
- Sua role é `corretor` (via `user_roles`)
- Sua imobiliária é PANTANAL NEGÓCIOS (user_id da imobiliária: `35df4259`, diferente do user_id do Marcelo)

**Policies de INSERT atuais na tabela `clientes`:**

| Policy | WITH CHECK |
|--------|-----------|
| Admins can manage | `is_admin()` |
| Authenticated users can create | `corretor_id IS NULL OR corretor_id IN (subquery por user_id/email) OR is_admin() OR has_role('gestor_produto')` |
| Gestores can insert | `has_role('gestor_produto') AND gestor_id = auth.uid()` |
| Gestores produto direto | `has_role('gestor_produto')` |

**Problema identificado**: A policy "Authenticated users can create clientes" deveria cobrir o cenário do corretor, MAS o `.insert().select().single()` do Supabase faz um SELECT implícito após o INSERT. O SELECT para imobiliárias usa join por `email` (`imobiliarias.email = profiles.email`), e **todas as imobiliárias têm `email = NULL`**. Isso significa que mesmo que o INSERT passe, o SELECT falha para gestores de imobiliária. Para corretores, o SELECT policy (`corretor_id IN get_corretor_ids_by_user()`) deveria funcionar, mas pode haver edge cases.

**Solução**: Tornar as policies mais robustas, adicionando cobertura explícita para `corretor` e `gestor_imobiliaria` no INSERT, e corrigindo o SELECT/UPDATE de imobiliárias para usar `user_id` em vez de `email`.

## Plano -- Migration SQL

### 1. Corrigir INSERT policy para cobrir explicitamente corretor e gestor_imobiliaria

```sql
DROP POLICY IF EXISTS "Authenticated users can create clientes" ON public.clientes;

CREATE POLICY "Authenticated users can create clientes"
ON public.clientes FOR INSERT TO authenticated
WITH CHECK (
  corretor_id IS NULL
  OR corretor_id IN (
    SELECT c.id FROM public.corretores c
    WHERE c.user_id = auth.uid()
  )
  OR public.is_admin(auth.uid())
  OR public.has_role(auth.uid(), 'gestor_produto')
  OR public.is_gestor_imobiliaria(auth.uid())
  OR public.has_role(auth.uid(), 'corretor')
);
```

### 2. Corrigir SELECT policy de imobiliárias (email → user_id)

```sql
DROP POLICY IF EXISTS "Imobiliárias can view linked clientes" ON public.clientes;

CREATE POLICY "Imobiliárias can view linked clientes"
ON public.clientes FOR SELECT TO authenticated
USING (
  imobiliaria_id IN (
    SELECT i.id FROM public.imobiliarias i
    WHERE i.user_id = auth.uid()
  )
);
```

### 3. Corrigir UPDATE policy de imobiliárias (email → user_id)

```sql
DROP POLICY IF EXISTS "Imobiliárias can update linked clientes" ON public.clientes;

CREATE POLICY "Imobiliárias can update linked clientes"
ON public.clientes FOR UPDATE TO authenticated
USING (
  imobiliaria_id IN (
    SELECT i.id FROM public.imobiliarias i
    WHERE i.user_id = auth.uid()
  )
);
```

### Sem alterações no frontend

O código de `useClientes.ts` e `PortalClientes.tsx` já está correto. A normalização de FKs já funciona. O fix é 100% no banco.

### Resultado esperado
- Corretores podem cadastrar clientes vinculando seu `corretor_id` sem erro
- Gestores de imobiliária podem cadastrar e visualizar clientes sem erro (SELECT agora usa `user_id`)
- Admins e gestores de produto continuam funcionando normalmente

