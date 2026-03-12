

# Diagnóstico: Negociações não aparecem no Portal do Incorporador

## Causa raiz identificada

Após consultar o banco de dados, encontrei o seguinte cenário:

| Etapa | Negociações | visivel_incorporador |
|---|---|---|
| Atendimento | **105** | false |
| Negociação | 1 | **true** |
| Retorno do incorporador | 1 | false |

O problema: quase todas as negociações (105 de 107) estão na etapa "Atendimento", que **não está marcada** como visível. Apenas "Negociação" está marcada, e tem somente 1 registro. Dependendo de qual incorporador faz login, pode não haver nenhuma negociação na etapa visível.

Além disso, as seções "Propostas Aguardando Aprovação" e "Em Preparação" filtram por `status_proposta`, e todas as negociações têm `status_proposta = null` -- logo essas seções também ficam vazias.

## Solução proposta

### 1. Marcar automaticamente as etapas relevantes como visíveis

Criar migration que marca "Negociação" e "Retorno do incorporador" como `visivel_incorporador = true` (caso o admin esqueça de configurar).

### 2. Tornar o portal mais resiliente

Alterar `PortalIncorporadorPropostas.tsx` para:

- Se **nenhuma etapa** estiver marcada como `visivel_incorporador`, mostrar **todas** as negociações dos empreendimentos do incorporador (fallback)
- Mostrar a seção "Negociações em Andamento" mesmo quando a lista está vazia, com mensagem informativa (igual à seção "Propostas Aguardando Aprovação" já faz)
- Remover a condição `{negociacoesEmAndamento.length > 0 && ...}` que esconde a seção inteira quando vazia

### 3. Adicionar RLS policy para funil_etapas para incorporadores

Verificar que incorporadores podem ler `funil_etapas` -- a policy atual de SELECT exige que a etapa pertença a um funil ativo, o que é correto, mas precisamos garantir que funcione para o role incorporador.

### Arquivos alterados
- **Migration**: UPDATE `funil_etapas` SET `visivel_incorporador = true` para etapas Negociação e Retorno do incorporador
- `src/pages/portal-incorporador/PortalIncorporadorPropostas.tsx` -- fallback quando nenhuma etapa visível configurada + seção sempre visível com empty state

