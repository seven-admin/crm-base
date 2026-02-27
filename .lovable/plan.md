
# Aprovacao/Rejeicao de Propostas pelo Incorporador com Transicao Automatica + Webhook em Toda Movimentacao

## Resumo

Quando o incorporador **aprovar** uma proposta, a negociacao transita automaticamente para a etapa **"Ganho"** (final sucesso). Quando **rejeitar** (contra proposta), transita para a etapa **"Contra Proposta"**. Alem disso, toda movimentacao de etapa no kanban passa a disparar webhook com dados completos. Tambem sera criada a funcionalidade de **comentarios** na proposta pelo incorporador.

---

## 1. Tabela de Comentarios de Negociacao (migration)

Criar `negociacao_comentarios` seguindo o padrao de `atividade_comentarios`:

```sql
CREATE TABLE public.negociacao_comentarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  negociacao_id UUID NOT NULL REFERENCES public.negociacoes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  comentario TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.negociacao_comentarios ENABLE ROW LEVEL SECURITY;

-- Policies: qualquer usuario autenticado pode ler/criar comentarios das negociacoes que tem acesso
CREATE POLICY "Authenticated users can read comments"
  ON public.negociacao_comentarios FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert comments"
  ON public.negociacao_comentarios FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
```

## 2. Hook: `useAprovarPropostaIncorporador` - Adicionar transicao de etapa

Apos atualizar `status_proposta = 'aprovada_incorporador'`, tambem:
- Atualizar `funil_etapa_id` para o ID da etapa "Ganho" (`9f3b1157-9fc9-4873-a323-4bd89e58f193`)
- Atualizar `data_fechamento`
- Marcar unidades como `vendida`
- Registrar no `negociacao_historico`

## 3. Hook: `useNegarPropostaIncorporador` - Adicionar transicao de etapa

Apos atualizar `status_proposta = 'contra_proposta'`, tambem:
- Atualizar `funil_etapa_id` para o ID da etapa "Contra Proposta" (`0ce3c47e-b603-4f62-8205-8ff9931452c1`)
- Registrar no `negociacao_historico`

## 4. Webhook em TODA movimentacao de etapa

Atualmente o webhook so dispara para etapas finais (sucesso/perda). Alterar `useMoverNegociacao` para disparar webhook `negociacao_movida` em **toda** transicao, com payload completo (dados da negociacao, cliente, empreendimento, corretor, unidades, etapa anterior e nova).

## 5. Comentarios no Portal do Incorporador

Na pagina `PortalIncorporadorPropostas.tsx`:
- Adicionar campo de comentario no card da proposta (input + botao)
- Listar comentarios existentes
- Hook `useNegociacaoComentarios` (query) e `useAddNegociacaoComentario` (mutation)

## 6. Webhook nos hooks de aprovacao/rejeicao

Os hooks `useAprovarPropostaIncorporador` e `useNegarPropostaIncorporador` ja disparam webhooks de proposta. Agora tambem dispararao webhook `negociacao_movida` com a transicao de etapa.

---

## Arquivos modificados

| Arquivo | Mudanca |
|---------|---------|
| Migration SQL | Criar tabela `negociacao_comentarios` |
| `src/hooks/useNegociacoes.ts` | Alterar `useAprovarPropostaIncorporador`, `useNegarPropostaIncorporador`, `useMoverNegociacao` |
| `src/hooks/useNegociacaoComentarios.ts` | **Novo** - hooks para comentarios |
| `src/pages/portal-incorporador/PortalIncorporadorPropostas.tsx` | Adicionar secao de comentarios nos cards |

## Detalhes tecnicos

### Etapas mapeadas (IDs do banco):
- **Contra Proposta**: `0ce3c47e-b603-4f62-8205-8ff9931452c1`
- **Ganho** (final sucesso): `9f3b1157-9fc9-4873-a323-4bd89e58f193`

### Webhook `negociacao_movida` - payload:
```json
{
  "negociacao_id": "...",
  "codigo": "NEG-00001",
  "etapa_anterior": "Analise de Proposta",
  "etapa_nova": "Ganho",
  "cliente_nome": "...",
  "empreendimento_nome": "...",
  "corretor_nome": "...",
  "valor_negociacao": 500000,
  "unidades": [...],
  "observacao": "..."
}
```
