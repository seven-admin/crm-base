

# Plano de Alteracoes - Clientes, Metas, Atividades e Planejamento

Este plano cobre 6 alteracoes distintas solicitadas, organizadas por modulo.

---

## 1. Ocultar "Comprador Historico" das listagens de clientes

O sistema cria automaticamente um cliente chamado "COMPRADOR HISTORICO (PRE-SISTEMA)" ao registrar vendas historicas. Esse cliente nao deve aparecer nas listagens.

### Alteracoes:
- **`src/hooks/useClientes.ts`**: Adicionar filtro `.neq('nome', 'COMPRADOR HISTORICO (PRE-SISTEMA)')` (nome fica em uppercase por causa do trigger) nas queries de `useClientes`, `useClientesPaginated` e `useClienteStats`.
- O mesmo filtro sera aplicado tambem no `useClientesSelect` se existir.

---

## 2. Temperatura no formulario de atividade - trocar Select por botoes

Atualmente (linhas 715-741 do `AtividadeForm.tsx`), a temperatura do cliente e um `<Select>`. Sera substituido por botoes inline coloridos (mesmo padrao visual dos botoes de tipo/categoria da Etapa 1).

### Alteracoes:
- **`src/components/atividades/AtividadeForm.tsx`**: Substituir o bloco do `<Select>` de temperatura por 3 botoes inline:
  - Frio (azul)
  - Morno (laranja)
  - Quente (vermelho)
- Clicar novamente no botao ja selecionado desmarca a selecao (toggle).

---

## 3. Metas Comerciais - diagnostico e correcao dos graficos

### Diagnostico
Ao criar uma meta, o `useCreateMeta` invalida as queries `metas-comerciais`, `historico-metas` e `todas-metas`. No entanto, os graficos do dashboard (vendas realizadas, forecast, ranking) usam queries separadas (`vendas-realizadas`, `forecast-fechamento`, `ranking-corretores-mes`, `metas-vs-realizado-empreendimento`) que **nao sao invalidadas** apos criar uma meta.

Alem disso, o dashboard filtra por `empreendimentoId` e o hook `useMetasPorMes` filtra por `empreendimento_id IS NULL` quando nao ha empreendimento selecionado - entao se voce criou a meta com escopo "empreendimento", ela nao aparecera no dashboard com filtro "Todos os empreendimentos".

### Correcao:
- **`src/hooks/useMetasComerciais.ts`**: No `onSuccess` do `useCreateMeta`, adicionar invalidacao de `vendas-realizadas`, `forecast-fechamento`, `ranking-corretores-mes` e `metas-vs-realizado-empreendimento`.
- Verificar se o dashboard "geral" (sem empreendimento) agrega corretamente metas de todos os empreendimentos - atualmente o `useMetasPorMes` busca meta com `empreendimento_id IS NULL`, o que significa que so busca a meta "geral". Isso e o comportamento esperado, mas sera documentado para o usuario entender.

---

## 4. Meta Comercial atribuida ao Gestor de Produto

Atualmente a tabela `metas_comerciais` tem `empreendimento_id` e `corretor_id`, mas nao tem campo para gestor de produto. Precisamos adicionar um campo `gestor_id` e atualizar o formulario.

### Alteracoes no banco:
- **Migracao SQL**: Adicionar coluna `gestor_id UUID REFERENCES profiles(id)` na tabela `metas_comerciais`.
- Atualizar a constraint unique para incluir `gestor_id`: `UNIQUE (competencia, empreendimento_id, corretor_id, gestor_id, periodicidade)`.

### Alteracoes no frontend:
- **`src/hooks/useMetasComerciais.ts`**: 
  - Atualizar `MetaComercial` para incluir `gestor_id`.
  - Atualizar `useCreateMeta` para aceitar `gestor_id`.
  - Atualizar `useTodasMetas` para fazer join com `profiles` para exibir nome do gestor.
  - Atualizar `onConflict` no upsert.
- **`src/pages/MetasComerciais.tsx`**: 
  - Adicionar opcao "Por Gestor" no escopo da meta (alem de "Geral" e "Por Empreendimento").
  - Adicionar select de gestores de produto quando escopo = gestor.
  - Na tabela de gerenciamento, exibir coluna "Gestor" quando aplicavel.

---

## 5. Planejamento - Inserir novas fases e atividades apos criacao

### Analise
A funcionalidade **ja existe parcialmente**:
- **Adicionar tarefas**: O botao "Adicionar tarefa" ja existe em cada fase na planilha (linhas 293-341 do `PlanejamentoPlanilha.tsx`).
- **Adicionar fases**: So e possivel pelo menu Configuracoes do Planejamento (`/planejamento/configuracoes`).

### Alteracao necessaria:
- **`src/components/planejamento/PlanejamentoPlanilha.tsx`**: Adicionar um botao "Adicionar Fase" no final da tabela (apos todas as fases) que permite criar uma nova fase diretamente na planilha, sem precisar ir ate as configuracoes.
  - Ao clicar, exibir um input inline para digitar nome da fase + seletor de cor.
  - Usar o `usePlanejamentoFases().createFase` ja existente.

---

## 6. Converter tarefa do Planejamento em Atividade (Forecast ou Marketing)

Esta e a funcionalidade mais complexa. A ideia e permitir que, a partir de um item do planejamento, o usuario crie rapidamente uma atividade do forecast (tabela `atividades`) ou um ticket de marketing (tabela `projetos_marketing`).

### Abordagem pratica:
Adicionar um botao de contexto (menu dropdown) em cada item da planilha de planejamento com opcoes:
- "Converter em Atividade" - abre o dialog de criacao de atividade pre-preenchido
- "Converter em Ticket Marketing" - abre o dialog de criacao de ticket pre-preenchido

### Alteracoes:
- **`src/components/planejamento/PlanejamentoPlanilha.tsx`** (componente `ItemRow`): 
  - Adicionar opcoes "Criar Atividade" e "Criar Ticket Marketing" no menu de acoes de cada item.
  - Ao clicar, abrir um Dialog com o formulario correspondente, pre-preenchendo:
    - **Atividade**: titulo = nome do item, empreendimento_id = empreendimento do planejamento, datas = datas do item
    - **Ticket Marketing**: titulo = nome do item, empreendimento_id = empreendimento do planejamento
  
- **Novo componente `src/components/planejamento/ConverterTarefaDialog.tsx`**:
  - Dialog que encapsula a logica de conversao
  - Permite escolher o destino (Atividade ou Marketing)
  - Mostra o formulario simplificado com campos pre-preenchidos
  - Salva no banco e fecha

### Dados pre-preenchidos na conversao:
Para Atividade (Forecast):
- `titulo`: nome da tarefa
- `empreendimento_id`: do planejamento
- `data_inicio` e `data_fim`: datas da tarefa (se existirem)
- `tipo`: "administrativa" (default, editavel)
- `categoria`: "seven" (default, editavel)

Para Ticket Marketing:
- `titulo`: nome da tarefa
- `empreendimento_id`: do planejamento
- `data_solicitacao`: hoje
- `categoria`: a ser selecionada pelo usuario

---

## Resumo dos arquivos afetados

| Arquivo | Alteracao |
|---------|-----------|
| `src/hooks/useClientes.ts` | Filtrar "Comprador Historico" |
| `src/hooks/useClientesSelect.ts` | Filtrar "Comprador Historico" |
| `src/components/atividades/AtividadeForm.tsx` | Temperatura: Select para botoes |
| `src/hooks/useMetasComerciais.ts` | Invalidar queries + gestor_id |
| `src/pages/MetasComerciais.tsx` | Escopo gestor + exibicao |
| `src/components/planejamento/PlanejamentoPlanilha.tsx` | Botao nova fase + opcoes de conversao |
| `src/components/planejamento/ConverterTarefaDialog.tsx` | Novo componente |
| Migracao SQL | Coluna gestor_id em metas_comerciais |

