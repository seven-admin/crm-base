

# Webhook + Notificacoes ao Incorporador Interagir com Proposta

## Contexto atual

- **Webhooks**: Ja existem disparos de `proposta_aprovada_incorporador` e `proposta_contra_proposta` nos hooks `useAprovarPropostaIncorporador` e `useNegarPropostaIncorporador`. Porem, o payload nao inclui todas as informacoes relevantes (faltam dados do cliente, condicoes de pagamento, unidades detalhadas, e dados do incorporador que interagiu).

- **Notificacoes internas**: O sistema tem tabela `notificacoes` e componente `NotificacaoBell`, mas nenhuma notificacao e criada quando o incorporador aprova ou envia contra proposta.

- **Mensagem do incorporador (contra proposta)**: O campo `motivo_contra_proposta` ja e gravado na negociacao. Ele ja aparece em dois lugares:
  1. No `PropostaCard.tsx` do portal do incorporador (para o proprio incorporador ver)
  2. No `PropostaDialog.tsx` do Kanban interno (alerta laranja no topo do dialog quando o gestor abre a proposta)

  **Ou seja, a mensagem do incorporador ja e visivel para o time interno ao abrir a negociacao no Kanban.** O que falta e a notificacao alertando que houve interacao.

---

## Plano de implementacao

### 1. Enriquecer payload dos webhooks existentes

Nos hooks `useAprovarPropostaIncorporador` e `useNegarPropostaIncorporador`, expandir o payload dos webhooks `proposta_aprovada_incorporador` e `proposta_contra_proposta` para incluir:

- Dados completos do cliente (nome, CPF, email, telefone)
- Dados do incorporador que interagiu (nome, ID)
- Unidades detalhadas (bloco, numero, valor tabela, valor proposta)
- Valores financeiros (valor tabela, valor proposta, desconto %)
- Dados do corretor e empreendimento
- Motivo (no caso de contra proposta)
- Link direto para a negociacao no sistema

### 2. Criar notificacoes internas apos interacao

Apos cada acao do incorporador (aprovar ou contra proposta), inserir registros na tabela `notificacoes` para:

- **Gestor do empreendimento** (campo `gestor_id` da negociacao ou busca via `get_gestor_empreendimento`)
- **Corretor vinculado** (via `corretor_id` da negociacao, buscando `user_id` da tabela `corretores`)
- **Todos os super_admins** (busca na tabela `user_roles`)

Dados da notificacao:
- `tipo`: `proposta_aprovada` ou `proposta_contra_proposta`
- `titulo`: "Proposta PROP-00001 aprovada pelo incorporador" / "Contra proposta recebida - PROP-00001"
- `mensagem`: Resumo com cliente, empreendimento e valor
- `referencia_id`: ID da negociacao
- `referencia_tipo`: `negociacao`

### 3. Atualizar NotificacaoBell para novos tipos

Adicionar icones para os novos tipos de notificacao (`proposta_aprovada`, `proposta_contra_proposta`) no mapa `TIPO_ICONS` do componente `NotificacaoBell.tsx`.

### 4. RLS para escrita de notificacoes pelo incorporador

Verificar se a policy de INSERT na tabela `notificacoes` permite que o incorporador insira registros para outros usuarios. Se nao, criar nova policy ou usar o service role via edge function. A abordagem mais simples: inserir via client-side usando o user autenticado (incorporador), criando policy que permita INSERT quando `is_incorporador(auth.uid())`.

---

## Sobre "onde a mensagem do incorporador sera exibida"

A mensagem de contra proposta **ja aparece** no sistema interno:
- No **PropostaDialog** (Kanban de negociacoes): alerta laranja destacado no topo do dialog quando a proposta esta em status `contra_proposta`
- No **PropostaCard** do portal: texto do motivo exibido no card

Com as notificacoes, o gestor e corretor serao **alertados** de que ha uma interacao pendente e poderao navegar diretamente para ver a mensagem.

---

## Arquivos impactados

| Arquivo | Mudanca |
|---------|---------|
| `src/hooks/useNegociacoes.ts` | Enriquecer payload dos webhooks + criar notificacoes apos aprovar/contra proposta |
| `src/components/layout/NotificacaoBell.tsx` | Adicionar icones para novos tipos de notificacao |
| Migration SQL (se necessario) | Policy de INSERT em `notificacoes` para incorporador |

