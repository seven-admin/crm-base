## Objetivo
Adicionar em `/nexa/disponibilidade` a mesma exportação em PDF de "Unidades Disponíveis" que existe em Empreendimentos › aba Unidades, disponível para todos os usuários Nexa.

## Escopo

### 1. Extrair a lógica de exportação para um util compartilhado
Criar `src/lib/exportUnidadesDisponiveisPdf.ts` contendo a função `exportUnidadesDisponiveisPdf({ empreendimento, unidades, isLoteamento })` — mesma implementação de `handleExportarDisponiveis` hoje em `src/components/empreendimentos/UnidadesTab.tsx` (logo Nexa, marca d'água, colunas, boxes vinculados, rodapé customizado, paginação, nome do arquivo).

### 2. Refatorar `UnidadesTab.tsx`
Substituir o corpo de `handleExportarDisponiveis` por uma chamada ao novo util, mantendo o item de menu "Exportar Disponíveis (PDF)" idêntico.

### 3. Botão de exportação em `NexaDisponibilidade.tsx`
- Adicionar botão "Exportar PDF" ao lado de "Atualizar", habilitado somente quando um empreendimento estiver selecionado.
- No clique: buscar o empreendimento (por id, via `seven_empreendimentos`) e as unidades com status `disponivel` do empreendimento (com joins de bloco e tipologia em `seven_unidades`) e chamar `exportUnidadesDisponiveisPdf`.
- Sem restrição de role — visível a qualquer usuário Nexa que acessa a página (a rota já é protegida pelo grupo Nexa).

## Fora de escopo
- Não altera permissões, RLS, layout da tabela nem o fluxo de edição de status.
- Não cria exportação em Excel/CSV; mantém o mesmo formato PDF do módulo Empreendimentos.