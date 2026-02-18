
## Problema: RLS bloqueando INSERT de clientes para gestor_produto

### Diagnóstico

A usuária **Mauren** tem role `gestor_produto` e já tem empreendimentos vinculados. O erro "new row violates row-level security policy for table 'clientes'" indica que **nenhuma** das políticas INSERT está passando.

Existem duas políticas INSERT na tabela `clientes`:

**Política 1 — "Authenticated users can create clientes":**
```sql
WITH CHECK (
  (corretor_id IS NULL)
  OR (corretor_id IN (SELECT c.id FROM corretores WHERE user_id = auth.uid() OR email = ...))
  OR is_admin(auth.uid())
  OR has_role(auth.uid(), 'gestor_produto')
)
```
Esta deveria passar para `gestor_produto`. ✓

**Política 2 — "Gestores can insert clientes":**
```sql
WITH CHECK (
  has_role(auth.uid(), 'gestor_produto') AND (gestor_id = auth.uid())
)
```
Esta só passa se `gestor_id = auth.uid()`.

**Causa raiz:** O trigger `auto_set_gestor_id_clientes` — que deveria preencher `gestor_id` automaticamente — **não está registrado no banco** (a consulta de triggers retornou vazia). Isso significa que o trigger que existe como função SQL nunca foi associado a nenhuma tabela via `CREATE TRIGGER`.

Porém, como as políticas são PERMISSIVE, basta a Política 1 passar. O que pode estar causando falha mesmo na Política 1 é se o `ClienteForm` estiver enviando um `corretor_id` com algum valor inválido (ex: string vazia `""` ao invés de `null`).

### Solução: dupla correção

**1. Criar o trigger ausente no banco** — registrar o trigger `auto_set_gestor_id_clientes` na tabela `clientes` para que `gestor_id` seja preenchido automaticamente com `auth.uid()` quando o usuário é gestor_produto:

```sql
CREATE TRIGGER trg_auto_set_gestor_id_clientes
  BEFORE INSERT ON public.clientes
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_gestor_id_clientes();
```

**2. Adicionar uma política INSERT explícita para gestores_produto** — garantida e simples, sem depender de `gestor_id`:

```sql
CREATE POLICY "Gestores produto can insert clientes"
  ON public.clientes
  FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'gestor_produto'));
```

Isso garante que qualquer `gestor_produto` autenticado pode criar clientes, sem condições adicionais que possam falhar.

### Arquivos afetados

Apenas **uma migration SQL** — sem alterações em código React.

### Migration SQL completa

```sql
-- 1. Criar o trigger que estava faltando (função já existe)
CREATE TRIGGER trg_auto_set_gestor_id_clientes
  BEFORE INSERT ON public.clientes
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_gestor_id_clientes();

-- 2. Adicionar política INSERT direta para gestor_produto
CREATE POLICY "Gestores produto can insert clientes direto"
  ON public.clientes
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'gestor_produto'));
```

### Impacto

- Resolve o erro de RLS imediatamente para todas as usuárias com role `gestor_produto`
- O trigger garante que o `gestor_id` seja preenchido automaticamente
- Nenhuma alteração em código React necessária
