

# Two Changes: Fix Conversion Dialog + New Empreendimentos Layout

## 1. Conversão de Tarefas do Planejamento

### Problema encontrado
O `ConverterTarefaDialog` (linha 101) exibe a aba como **"Atividade (Forecast)"**, mas permite selecionar **todos** os tipos de atividade (ligacao, meeting, reuniao, etc.) sem distinção entre Diário de Bordo e Forecast. Isso significa que o usuário pode criar uma atividade de tipo "Ligação" (Diário de Bordo) através de uma aba rotulada "Forecast".

Além disso, não existe uma aba dedicada para "Diário de Bordo" -- apenas "Atividade (Forecast)" e "Ticket Marketing".

### Solução
Alterar o `ConverterTarefaDialog` para ter **3 abas**: Forecast, Diário de Bordo e Ticket Marketing.

- **Aba Forecast**: Filtrar tipos apenas para `TIPOS_FORECAST` (atendimento, fechamento, assinatura). Categoria fixa como `cliente`.
- **Aba Diário de Bordo**: Filtrar tipos para `TIPOS_DIARIO` (ligacao, meeting, reuniao, visita, acompanhamento, treinamento, administrativa). Permitir seleção de categoria.
- **Aba Marketing**: Manter como está.

### Arquivo alterado
- `src/components/planejamento/ConverterTarefaDialog.tsx`

---

## 2. Nova exibição de Empreendimentos agrupada por Estado (UF)

### Situação atual
A página `/empreendimentos` exibe cards em grid sem agrupamento. Todos os empreendimentos aparecem em ordem de criação.

### Solução
Agrupar os empreendimentos por `endereco_uf` (estado), exibindo seções colapsáveis com o nome do estado como cabeçalho. Dentro de cada grupo, manter os cards existentes (`EmpreendimentoCard`). Empreendimentos sem UF ficam em grupo "Sem estado definido".

### Arquivo alterado
- `src/pages/Empreendimentos.tsx` -- adicionar lógica de agrupamento por UF com `useMemo`, renderizar seções com `Collapsible` ou accordion simples.

