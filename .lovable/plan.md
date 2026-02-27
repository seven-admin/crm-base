
Objetivo: corrigir a visibilidade das mensagens do incorporador para superadmin no sistema interno.

Diagnóstico confirmado:
- As mensagens existem no banco (há comentários na negociação NEG-00024, status `em_analise`).
- Permissão não é o problema: as policies atuais permitem leitura para usuários autenticados (incluindo superadmin).
- O bloqueio é de fluxo de tela: no card interno (`NegociacaoCard`), quando a proposta está em `em_analise`, o menu mostra apenas “Aguardando Incorporador” desabilitado e não oferece ação para abrir o `PropostaDialog` (onde está a aba de comentários).

Implementação proposta:

1) Tornar o `PropostaDialog` acessível em todos os status com proposta
- Arquivo: `src/components/negociacoes/NegociacaoCard.tsx`
- Ajuste:
  - Adicionar uma ação de menu “Ver proposta / comentários” (ou “Abrir proposta”) para qualquer negociação com `numero_proposta`.
  - Essa ação deve chamar `onEditarProposta(negociacao)` (modo `view`), inclusive quando `status_proposta === 'em_analise'`.
  - Manter “Aguardando Incorporador” apenas como status informativo, sem bloquear abertura do dialog.

2) Garantir consistência no Kanban interno
- Arquivo: `src/components/negociacoes/FunilKanbanBoard.tsx`
- Ajuste:
  - Reutilizar o fluxo já existente `handleEditarProposta` + `PropostaDialog mode="view"` para a nova ação.
  - Confirmar que o estado `selectedNegociacao` é preenchido corretamente para abrir diretamente na negociação selecionada.

3) Corrigir sinalização visual de comentários no card realmente usado
- Arquivo: `src/components/negociacoes/NegociacaoCard.tsx`
- Ajuste:
  - Adicionar indicador de comentários neste componente (não no `KanbanCard`, que hoje não é o card renderizado pelo funil).
  - Exibir ícone + contagem quando houver comentários, para o superadmin localizar rapidamente cards com interação do incorporador.

4) Otimização de busca de contagem (sem sobrecarregar o front)
- Arquivos: hooks/board de negociações
- Ajuste técnico:
  - Evitar query por card para contagem de comentários.
  - Opção recomendada: incluir contagem agregada junto dos dados de negociações (campo derivado/consulta agregada), e passar como prop para `NegociacaoCard`.
  - Se preferir fase 1 rápida: mostrar apenas ícone “tem comentário” usando cache do dialog; depois otimizar para contagem agregada.

5) Validação funcional pós-ajuste
- Cenários de teste:
  - Superadmin abre uma negociação em `em_analise` e consegue entrar no `PropostaDialog`.
  - Aba “Comentários” exibe histórico do incorporador.
  - Superadmin responde e o comentário aparece no portal do incorporador.
  - Card no kanban mostra indicador de comentário.
  - Fluxos de outros status (`rascunho`, `contra_proposta`, `enviada`) continuam sem regressão.

Impacto esperado:
- Superadmin volta a encontrar as mensagens no sistema sem depender de status específico.
- Comentários deixam de ficar “escondidos” por bloqueio de navegação.
- Melhor rastreabilidade visual no kanban interno.

Se aprovado, implemento exatamente esses pontos em sequência (primeiro acessibilidade do dialog em `em_analise`, depois indicador visual no card usado pelo funil).
