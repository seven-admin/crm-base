# Fluxo de Caixa - Manual do Contador

Este documento descreve o funcionamento do módulo financeiro do sistema, explicando os conceitos, fluxos de trabalho e funcionalidades disponíveis para gestão de entradas e saídas.

---

## 1. Introdução

O módulo **Fluxo de Caixa** é responsável pela gestão financeira da operação, permitindo:
- Registro de lançamentos de entrada (contas a receber) e saída (contas a pagar)
- Controle de status de pagamento
- Processo de conferência e aprovação
- Lançamentos recorrentes automáticos
- Organização por categorias e centros de custo
- Vinculação com empreendimentos e contratos

---

## 2. Conceitos Básicos

### 2.1 Tipos de Lançamentos

| Tipo | Código Interno | Descrição |
|------|----------------|-----------|
| **Entrada** | `receber` | Valores a receber (receitas, vendas, comissões) |
| **Saída** | `pagar` | Valores a pagar (despesas, fornecedores, custos) |

### 2.2 Status de Lançamento

Indica o estado do pagamento:

| Status | Descrição |
|--------|-----------|
| `pendente` | Aguardando pagamento/recebimento |
| `pago` | Quitado - pagamento realizado |
| `cancelado` | Lançamento anulado (não será processado) |
| `vencido` | Passou da data de vencimento sem pagamento |

### 2.3 Status de Conferência

Indica o estado de verificação/aprovação do lançamento:

| Status | Descrição |
|--------|-----------|
| `pendente` | Aguardando conferência/validação |
| `conferido` | Verificado pela equipe financeira |
| `aprovado` | Liberado para execução/pagamento |

---

## 3. Fluxo de Trabalho

### 3.1 Criação de Lançamentos

```
[Usuário cria lançamento]
        ↓
[Sistema verifica categoria]
        ↓
    ┌───────────────────────────────────┐
    │ Categoria tem auto-aprovação?     │
    └───────────────────────────────────┘
        ↓ SIM                    ↓ NÃO
[Status: aprovado]       [Status: pendente]
        ↓                        ↓
[Pronto para pagamento]  [Aguarda conferência]
```

**Campos obrigatórios:**
- Descrição
- Valor
- Data de Vencimento
- Tipo (entrada/saída)

**Campos opcionais:**
- Centro de Custo
- Categoria de Fluxo
- Empreendimento
- Observações
- Configuração de recorrência

### 3.2 Processo de Conferência

O fluxo de conferência permite que lançamentos sejam validados antes de serem processados:

1. **Lançamento criado** → Status conferência: `pendente`
2. **Equipe financeira revisa** → Acessa aba "Conferência"
3. **Seleção em lote** → Marca múltiplos lançamentos
4. **Aprovação** → Clica em "Aprovar Selecionados"
5. **Status atualizado** → `aprovado`

> **Atalho:** Categorias com "Aprovação Automática" ativada pulam a conferência.

### 3.3 Registro de Pagamento

**Individual:**
1. Localizar lançamento na lista
2. Clicar em "Pagar" ou "Receber"
3. Informar data do pagamento
4. Opcionalmente informar número da NF
5. Confirmar

**Em Lote:**
1. Acessar aba "Movimentações"
2. Marcar checkbox dos lançamentos pendentes desejados
3. Clicar em "Pagar Selecionados"
4. Informar data única do pagamento
5. Confirmar

### 3.4 Lançamentos Recorrentes

O sistema permite criar séries de lançamentos automáticos:

| Frequência | Intervalo | Código |
|------------|-----------|--------|
| Mensal | 1 mês | `mensal` |
| Bimestral | 2 meses | `bimestral` |
| Trimestral | 3 meses | `trimestral` |
| Semestral | 6 meses | `semestral` |
| Anual | 12 meses | `anual` |

**Comportamento:**
- Ao criar um lançamento recorrente, o sistema gera automaticamente todas as parcelas até dezembro do ano corrente
- O primeiro lançamento é o "pai" e os demais são "filhos" vinculados
- Alterações em série atualizam todos os lançamentos pendentes
- Exclusão em série remove todos os lançamentos pendentes da série

---

## 4. Configurações

### 4.1 Categorias de Fluxo

Organizam os lançamentos por natureza:

**Categorias de Entrada (exemplos):**
- Vendas de Unidades
- Comissões
- Receitas Financeiras
- Outras Receitas

**Categorias de Saída (exemplos):**
- Folha de Pagamento
- Marketing
- Infraestrutura
- Fornecedores
- Impostos

**Propriedades da Categoria:**
| Campo | Descrição |
|-------|-----------|
| Nome | Identificação da categoria |
| Tipo | `entrada` ou `saida` |
| Categoria Pai | Para subcategorias (hierarquia) |
| Aprovação Automática | Se ativado, lançamentos desta categoria são aprovados automaticamente |

### 4.2 Centros de Custo

Permitem classificar lançamentos por área ou projeto:

- Cada centro de custo pode ser vinculado a um ou mais empreendimentos
- Útil para análise de custos por unidade de negócio
- Exemplos: "Administrativo", "Comercial", "Obra X", "Marketing Digital"

### 4.3 Aprovação Automática

Categorias marcadas com "Aprovação Automática":
- Lançamentos criados já nascem com status `aprovado`
- Não aparecem na fila de conferência
- Útil para despesas recorrentes e previsíveis (ex: aluguel, salários)

---

## 5. Funcionalidades em Lote

### 5.1 Aprovar em Lote

**Localização:** Aba "Conferência"

1. Visualizar lista de lançamentos pendentes de conferência
2. Marcar checkbox de cada item ou "Selecionar Todos"
3. Clicar no botão "Aprovar Selecionados"
4. Sistema atualiza todos para status `aprovado`

### 5.2 Pagar em Lote

**Localização:** Aba "Movimentações"

1. Visualizar lista de lançamentos
2. Marcar checkbox dos lançamentos pendentes que deseja pagar
3. Clicar no botão "Pagar Selecionados"
4. Informar a data do pagamento (única para todos)
5. Confirmar operação
6. Sistema atualiza todos para status `pago`

---

## 6. Visão Geral e Dashboard

### 6.1 Indicadores Principais

| Indicador | Descrição |
|-----------|-----------|
| **Total a Receber** | Soma de todas as entradas do período |
| **Total a Pagar** | Soma de todas as saídas do período |
| **Pendente Receber** | Entradas ainda não recebidas |
| **Pendente Pagar** | Saídas ainda não pagas |
| **Saldo Projetado** | Total a Receber - Total a Pagar |

### 6.2 Filtros Disponíveis

- **Mês de Referência:** Selecionar mês para visualização
- **Empreendimento:** Filtrar por empreendimento específico
- **Status:** Pendente, Pago, Cancelado, Vencido
- **Tipo:** Entrada ou Saída

---

## 7. Estrutura de Dados

### 7.1 Tabela Principal: `lancamentos_financeiros`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único |
| `tipo` | String | `receber` ou `pagar` |
| `descricao` | String | Descrição do lançamento |
| `valor` | Decimal | Valor monetário |
| `data_vencimento` | Date | Data de vencimento |
| `data_pagamento` | Date | Data efetiva do pagamento |
| `status` | String | `pendente`, `pago`, `cancelado`, `vencido` |
| `status_conferencia` | String | `pendente`, `conferido`, `aprovado` |
| `categoria_fluxo` | String | Nome da categoria |
| `centro_custo_id` | UUID | Referência ao centro de custo |
| `empreendimento_id` | UUID | Referência ao empreendimento |
| `is_recorrente` | Boolean | Se é lançamento recorrente |
| `recorrencia_frequencia` | String | Frequência da recorrência |
| `recorrencia_pai_id` | UUID | Referência ao lançamento pai (para recorrentes) |
| `nf_numero` | String | Número da nota fiscal |
| `nf_quitada` | Boolean | Se a NF foi quitada |
| `observacoes` | Text | Observações adicionais |
| `created_by` | UUID | Usuário que criou |
| `conferido_por` | UUID | Usuário que aprovou |
| `conferido_em` | Timestamp | Data/hora da aprovação |

### 7.2 Tabelas Auxiliares

**`categorias_fluxo`** - Categorias de classificação
**`centros_custo`** - Centros de custo
**`centro_custo_empreendimentos`** - Vínculo centro de custo ↔ empreendimento

---

## 8. Papéis e Permissões

| Papel | Criar | Editar | Aprovar | Excluir |
|-------|-------|--------|---------|---------|
| Financeiro | ✅ | ✅ | ✅ | ❌ |
| Gestor | ✅ | ✅ | ✅ | ❌ |
| Admin | ✅ | ✅ | ✅ | ❌ |
| Super Admin | ✅ | ✅ | ✅ | ✅ |

> **Nota:** Apenas `super_admin` pode excluir lançamentos permanentemente.

---

## 9. Glossário

| Termo | Definição |
|-------|-----------|
| **Lançamento** | Registro de uma entrada ou saída financeira |
| **Conferência** | Processo de validação de lançamentos |
| **Recorrência** | Lançamentos que se repetem automaticamente |
| **Centro de Custo** | Classificação por área ou projeto |
| **Categoria de Fluxo** | Classificação por natureza da operação |
| **NF** | Nota Fiscal |
| **Quitação** | Ato de marcar como pago/liquidado |

---

## 10. Fluxograma Completo

```
┌─────────────────────────────────────────────────────────────────┐
│                    CRIAÇÃO DE LANÇAMENTO                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  É recorrente?                                                   │
│  ├── SIM → Gerar série até Dez/Ano                              │
│  └── NÃO → Criar lançamento único                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Categoria tem auto-aprovação?                                   │
│  ├── SIM → Status Conferência: APROVADO                         │
│  └── NÃO → Status Conferência: PENDENTE                         │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌──────────────────────┐        ┌──────────────────────┐
│  APROVADO            │        │  PENDENTE            │
│  Pronto p/ pagamento │        │  Aba "Conferência"   │
└──────────────────────┘        └──────────────────────┘
              │                               │
              │                               ▼
              │                 ┌──────────────────────┐
              │                 │  Aprovação em Lote   │
              │                 │  ou Individual       │
              │                 └──────────────────────┘
              │                               │
              └───────────────┬───────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     REGISTRO DE PAGAMENTO                        │
│  ├── Individual: Botão "Pagar/Receber"                          │
│  └── Em Lote: Seleção + "Pagar Selecionados"                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Status: PAGO | Data Pagamento: Informada                        │
└─────────────────────────────────────────────────────────────────┘
```

---

**Última atualização:** Janeiro/2026
