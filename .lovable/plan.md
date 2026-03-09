

# Evento CONECTA não aparece — Problema de RLS

## Causa
A tabela `eventos` tem RLS ativo com apenas 3 políticas de acesso:
- Admins
- supervisor_relacionamento
- Marketing supervisors

O usuário do portal (role `gestor_imobiliaria`) **não tem permissão de SELECT** na tabela `eventos`, por isso a query retorna vazio e aparece "Nenhum evento disponível".

O evento CONECTA existe e está ativo (`is_active = true`), mas com `inscricoes_abertas = false`.

## Solução

### 1. Migração SQL — Nova política RLS
Adicionar uma política que permita qualquer usuário autenticado **visualizar** eventos ativos:

```sql
CREATE POLICY "Authenticated users can view active eventos"
ON public.eventos
FOR SELECT
TO authenticated
USING (is_active = true);
```

Isso permite que corretores e gestores de imobiliária vejam os eventos no portal sem comprometer a segurança (somente leitura de eventos ativos).

### 2. Ativar inscrições do evento CONECTA
O evento CONECTA tem `inscricoes_abertas = false`. Após a correção de RLS, ele vai aparecer na listagem mas com badge "Fechado". Para que os corretores possam se inscrever, será necessário atualizar o campo `inscricoes_abertas` para `true` via painel administrativo.

### Arquivo afetado
- Apenas migração SQL (nenhum arquivo de código precisa mudar)

