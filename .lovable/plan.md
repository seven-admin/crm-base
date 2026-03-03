

# Webhooks Dinâmicos — Criar Eventos via Sistema com Seleção de Variáveis

## Situação Atual

Hoje os webhooks funcionam assim:
- **Eventos fixos** (`WEBHOOK_EVENTS` em `useWebhooks.ts`): lista hardcoded com ~20 eventos como `atividade_comentada`, `negociacao_movida`, etc.
- **Payloads fixos**: cada `dispararWebhook()` no código envia um conjunto pré-definido de dados — não configurável pelo usuário.
- **Formulário de criação** (em `Configuracoes.tsx`): permite apenas selecionar um evento da lista fixa, informar URL e descrição.
- **Edge function `webhook-dispatcher`**: busca webhooks ativos para o evento e faz POST com o payload recebido.

O usuário **não pode criar eventos novos** nem **escolher quais variáveis** enviar.

## Proposta

Permitir que o admin crie webhooks customizados via interface, escolhendo:
1. **Evento** — selecionar de uma lista existente OU criar um nome de evento personalizado
2. **Variáveis do payload** — selecionar quais campos/variáveis serão incluídos no disparo (usando checkboxes)
3. **URL destino** e **descrição** (já existente)

### Arquitetura

**Banco de dados:**
- Adicionar coluna `variaveis_selecionadas` (tipo `text[]` ou `jsonb`) na tabela `webhooks` para armazenar quais variáveis o webhook deve enviar
- Criar tabela `webhook_variaveis_disponiveis` com as variáveis disponíveis por evento (chave, label, categoria, evento)

**Edge function `webhook-dispatcher`:**
- Ao montar o payload de saída, filtrar os `dados` recebidos para incluir apenas as chaves presentes em `variaveis_selecionadas` do webhook (se configurado). Se vazio/null, envia tudo (comportamento atual).

**Frontend:**
- No formulário de criação/edição de webhook (`Configuracoes.tsx`):
  - Permitir digitar um evento customizado além da lista fixa
  - Ao selecionar um evento, carregar as variáveis disponíveis para aquele evento
  - Exibir checkboxes agrupados por categoria para o admin selecionar quais variáveis incluir
  - Salvar a seleção na coluna `variaveis_selecionadas`

### Variáveis por Evento (exemplos)

Para cada evento existente, mapear as variáveis disponíveis com base no que já é enviado no código:

| Evento | Variáveis disponíveis |
|---|---|
| `corretor_aprovado` | user_id, email, nome, creci, imobiliaria, empreendimentos |
| `negociacao_movida` | negociacao_id, codigo, etapa_anterior, etapa_nova, cliente, empreendimento |
| `comentario_proposta` | negociacao_id, codigo, autor, comentario, origem, link |
| etc. | ... |

Essas variáveis seriam seed na tabela `webhook_variaveis_disponiveis`.

### Detalhes Técnicos

**1. Migração SQL:**
```sql
-- Coluna para armazenar variáveis selecionadas por webhook
ALTER TABLE webhooks ADD COLUMN variaveis_selecionadas text[] DEFAULT NULL;

-- Tabela de variáveis disponíveis por evento
CREATE TABLE webhook_variaveis_disponiveis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evento text NOT NULL,
  chave text NOT NULL,
  label text NOT NULL,
  categoria text DEFAULT 'geral',
  tipo text DEFAULT 'text',
  created_at timestamptz DEFAULT now(),
  UNIQUE(evento, chave)
);

-- RLS: leitura para autenticados, escrita para admins
ALTER TABLE webhook_variaveis_disponiveis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_webhook_vars" ON webhook_variaveis_disponiveis FOR SELECT TO authenticated USING (true);
CREATE POLICY "manage_webhook_vars" ON webhook_variaveis_disponiveis FOR ALL TO authenticated USING (public.is_admin(auth.uid()));
```

Seed com INSERT de todas as variáveis mapeadas a partir dos eventos existentes.

**2. Edge function `webhook-dispatcher`:**
- Ao buscar webhooks, incluir `variaveis_selecionadas`
- Antes de enviar, se `variaveis_selecionadas` não for null/vazio, filtrar o objeto `dados` para incluir apenas essas chaves

**3. Frontend (`Configuracoes.tsx` + novo hook):**
- Hook `useWebhookVariaveis(evento)` para carregar variáveis disponíveis
- No formulário, após selecionar evento, exibir lista de variáveis com checkboxes
- Salvar array de chaves selecionadas junto com o webhook
- Permitir input livre no campo "evento" (combobox) para eventos customizados

**4. Hook `useWebhooks.ts`:**
- Atualizar interface `Webhook` para incluir `variaveis_selecionadas: string[] | null`
- Atualizar `useCreateWebhook` e `useUpdateWebhook` para persistir as variáveis

### Resumo de Arquivos Alterados

- **Nova migração SQL** — coluna + tabela + seed
- **`supabase/functions/webhook-dispatcher/index.ts`** — filtro de variáveis
- **`src/hooks/useWebhooks.ts`** — tipos + novo hook de variáveis
- **`src/pages/Configuracoes.tsx`** — formulário com seleção de variáveis

