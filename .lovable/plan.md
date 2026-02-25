

# Sistema de Aprovacao de Propostas pelo Incorporador

## Resumo

Criar um fluxo de aprovacao onde, ao enviar uma proposta (status `enviada`), ela entra automaticamente em "Analise" (`em_analise`). O incorporador recebe notificacao via webhook/n8n e pode aprovar ou negar pelo Portal do Incorporador. Se negada, a proposta vai para "Contra Proposta" (`contra_proposta`), permitindo edicao das condicoes antes de reenviar.

---

## 1. Novos Status de Proposta

Adicionar dois novos status ao fluxo existente de `status_proposta` na negociacao:

```text
Fluxo atual:  rascunho -> enviada -> aceita/recusada/expirada -> convertida
Fluxo novo:   rascunho -> em_analise -> aprovada_incorporador/contra_proposta -> enviada -> aceita/recusada -> convertida
                                          ^                                        |
                                          |________________________________________|
                                            (reenvio apos ajuste de contra proposta)
```

### Novos valores para `status_proposta`:
- `em_analise` - Proposta enviada para analise do incorporador
- `aprovada_incorporador` - Incorporador aprovou, pode ser enviada ao cliente
- `contra_proposta` - Incorporador negou, requer ajustes nas condicoes

### Dados adicionais no banco (colunas na tabela `negociacoes`):
- `motivo_contra_proposta` (text, nullable) - Justificativa do incorporador ao negar
- `aprovada_incorporador_em` (timestamptz, nullable) - Data/hora da aprovacao
- `aprovada_incorporador_por` (uuid, nullable) - ID do incorporador que aprovou/negou

---

## 2. Migration SQL

Adicionar colunas e atualizar tipos/labels no frontend:

```sql
ALTER TABLE public.negociacoes 
  ADD COLUMN IF NOT EXISTS motivo_contra_proposta text,
  ADD COLUMN IF NOT EXISTS aprovada_incorporador_em timestamptz,
  ADD COLUMN IF NOT EXISTS aprovada_incorporador_por uuid;
```

Nenhuma constraint necessaria pois `status_proposta` ja e campo `text` livre.

---

## 3. Webhook ao Enviar para Analise

### Alteracao no hook `useEnviarProposta` (ou novo hook `useEnviarParaAnalise`)

Quando o gestor clicar em "Enviar Proposta", o `status_proposta` muda para `em_analise` (em vez de `enviada` direto). Apos o update, disparar webhook:

```text
dispararWebhook('proposta_em_analise', {
  negociacao_id, codigo, numero_proposta,
  cliente_nome, empreendimento_nome,
  valor_proposta, valor_tabela,
  corretor_nome, gestor_nome,
  link_portal: URL do portal incorporador
})
```

O n8n recebe esse evento e envia mensagens WhatsApp para o incorporador e outros numeros configurados externamente.

---

## 4. Portal do Incorporador - Tela de Aprovacao

### Nova pagina: `src/pages/portal-incorporador/PortalIncorporadorPropostas.tsx`

Lista todas as propostas `em_analise` dos empreendimentos vinculados ao incorporador. Cada proposta mostra:
- Codigo/numero da proposta
- Cliente, empreendimento, corretor
- Valor tabela vs valor proposta (destaque no desconto)
- Condicoes de pagamento resumidas
- Botoes: **Aprovar** e **Contra Proposta**

### Dialog de Contra Proposta
- Campo de justificativa obrigatorio (motivo_contra_proposta)
- Ao confirmar: `status_proposta = 'contra_proposta'`, salva motivo e dispara webhook `proposta_contra_proposta`

### Dialog de Aprovacao
- Confirmacao simples com observacao opcional
- Ao confirmar: `status_proposta = 'aprovada_incorporador'`, salva data/usuario e dispara webhook `proposta_aprovada_incorporador`

---

## 5. Fluxo de Contra Proposta (lado gestor)

Quando uma proposta esta em `contra_proposta`:
- Exibir motivo do incorporador no card/dialog da negociacao
- Permitir edicao das condicoes de pagamento e valores
- Botao "Reenviar para Analise" que volta o status para `em_analise` (novo ciclo)
- Webhook `proposta_em_analise` e disparado novamente

---

## 6. Atualizacao dos Types e Labels

### `src/types/negociacoes.types.ts`

```text
StatusProposta = 'rascunho' | 'em_analise' | 'aprovada_incorporador' | 'contra_proposta' | 'enviada' | 'aceita' | 'recusada' | 'expirada' | 'convertida'

Labels:
  em_analise: 'Em Analise'
  aprovada_incorporador: 'Aprovada pelo Incorporador'
  contra_proposta: 'Contra Proposta'

Colors:
  em_analise: 'bg-yellow-500'
  aprovada_incorporador: 'bg-teal-500'
  contra_proposta: 'bg-orange-500'
```

---

## 7. Atualizacao dos Cards e Menus

### `KanbanCard.tsx` e `NegociacaoCard.tsx`
- Status `rascunho`: mostrar "Enviar para Analise" (em vez de "Enviar Proposta")
- Status `em_analise`: mostrar badge "Em Analise" (sem acoes do gestor, aguardando incorporador)
- Status `aprovada_incorporador`: mostrar "Enviar ao Cliente" (muda para `enviada`)
- Status `contra_proposta`: mostrar motivo + "Editar Proposta" + "Reenviar para Analise"
- Status `enviada`: manter fluxo atual (Aceitar/Recusar)

### `PropostaDialog.tsx`
- Adicionar modo para exibir motivo de contra proposta
- Permitir edicao quando status = `contra_proposta`
- Botao "Reenviar para Analise"

---

## 8. Hooks novos/alterados

| Hook | Descricao |
|---|---|
| `useEnviarParaAnalise()` | Muda status para `em_analise` + dispara webhook |
| `useAprovarPropostaIncorporador()` | Muda para `aprovada_incorporador` + dispara webhook |
| `useNegarPropostaIncorporador()` | Muda para `contra_proposta` + salva motivo + webhook |
| `useReenviarParaAnalise()` | Volta de `contra_proposta` para `em_analise` + webhook |
| `useEnviarProposta()` (alterado) | Agora so funciona a partir de `aprovada_incorporador` -> `enviada` |

---

## 9. Rota do Portal Incorporador

Adicionar rota `/portal-incorporador/propostas` no router e item no menu lateral do portal.

---

## Resumo de arquivos

| Arquivo | Acao |
|---|---|
| Migration SQL | Adicionar 3 colunas na tabela `negociacoes` |
| `src/types/negociacoes.types.ts` | Novos status + labels + cores |
| `src/hooks/useNegociacoes.ts` | Novos hooks de analise/aprovacao/contra proposta |
| `src/pages/portal-incorporador/PortalIncorporadorPropostas.tsx` | Nova pagina de aprovacao |
| `src/components/negociacoes/KanbanCard.tsx` | Atualizar menu de acoes |
| `src/components/negociacoes/NegociacaoCard.tsx` | Atualizar menu de acoes |
| `src/components/negociacoes/PropostaDialog.tsx` | Suportar contra proposta e reenvio |
| `src/components/negociacoes/FunilKanbanBoard.tsx` | Conectar novos handlers |
| Router + Menu lateral do portal | Adicionar rota de propostas |

