

# Plano: Historico de Atividades + Seletor Inline de Temperatura

## 1. Tabela de Historico de Atividades

Criar uma tabela `atividade_historico` para registrar automaticamente toda alteracao feita em uma atividade (status, campos, temperatura, etc.), permitindo filtros e consulta posterior.

### Estrutura da tabela

```text
atividade_historico
  - id (uuid, PK)
  - atividade_id (uuid, FK -> atividades)
  - user_id (uuid, referencia profiles)
  - tipo_evento (text): 'criacao' | 'edicao' | 'status_alterado' | 'temperatura_alterada' | 'concluida' | 'cancelada' | 'reaberta'
  - campo_alterado (text, nullable): nome do campo (ex: 'titulo', 'status', 'temperatura_cliente')
  - valor_anterior (text, nullable)
  - valor_novo (text, nullable)
  - observacao (text, nullable): justificativa ou contexto adicional
  - created_at (timestamptz, default now())
```

### Trigger automatico

Criar um trigger `AFTER UPDATE` na tabela `atividades` que registra automaticamente alteracoes nos campos principais: `status`, `temperatura_cliente`, `titulo`, `tipo`, `categoria`, `gestor_id`, `cliente_id`, `empreendimento_id`, `data_inicio`, `data_fim`, `resultado`, `motivo_cancelamento`.

Criar tambem um trigger `AFTER INSERT` para registrar o evento de criacao.

### RLS

- Usuarios autenticados podem ler historico das atividades que tem acesso
- Insercao apenas via trigger (SECURITY DEFINER)

### Frontend

**Novo hook**: `src/hooks/useAtividadeHistorico.ts`
- Query para buscar historico de uma atividade, com join em `profiles` para nome do usuario

**Exibicao no detalhe**: `src/components/atividades/AtividadeDetalheDialog.tsx`
- Adicionar uma aba/secao "Historico" abaixo dos comentarios, listando os eventos em ordem cronologica com icones, usuario e descricao legivel

**Futuramente filtravel**: a estrutura da tabela permite filtrar por `tipo_evento`, `campo_alterado`, `atividade_id` e periodo.

---

## 2. Seletor Inline de Temperatura (Labels Clicaveis)

Substituir o conceito de dropdown/select por um grupo de labels/badges clicaveis (estilo toggle group) para alterar a temperatura diretamente. O usuario clica em "Frio", "Morno" ou "Quente" e a alteracao e salva imediatamente.

### Componente reutilizavel

**Novo arquivo**: `src/components/atividades/TemperaturaSelector.tsx`

Renderiza 3 badges lado a lado (Frio, Morno, Quente) com cores distintas. O selecionado fica com fundo preenchido, os demais ficam com borda outline. Ao clicar, chama `onValueChange(temperatura)`.

```text
[ Frio ]  [ Morno ]  [ Quente ]
  ^outline   ^filled     ^outline
```

### Onde sera usado

1. **AtividadeDetalheDialog.tsx**: Abaixo do badge de temperatura atual, renderizar o `TemperaturaSelector` para atividades de negociacao. Ao alterar, chamar `useUpdateAtividade` para salvar e o trigger registra no historico.

2. **AtividadeKanbanCard.tsx**: Substituir o badge estatico de temperatura pelo `TemperaturaSelector` compacto (tamanho menor). Ao clicar, `e.stopPropagation()` para nao abrir o detalhe.

3. **AtividadeCard.tsx**: Na linha que exibe `cliente.temperatura`, substituir pelo `TemperaturaSelector` usando `atividade.temperatura_cliente`. Tambem com `e.stopPropagation()`.

4. **ConcluirAtividadeDialog.tsx**: Substituir o `Select` de temperatura pelo `TemperaturaSelector`.

### Hook de atualizacao

Reutilizar o `useUpdateAtividade` existente, passando apenas `{ temperatura_cliente: novaTemp }`. O trigger de historico registra a mudanca automaticamente.

---

## Resumo de arquivos

| Arquivo | Acao |
|---|---|
| Migration SQL | Criar tabela `atividade_historico` + triggers INSERT/UPDATE |
| `src/hooks/useAtividadeHistorico.ts` | Novo hook para buscar historico |
| `src/components/atividades/TemperaturaSelector.tsx` | Novo componente de labels clicaveis |
| `src/components/atividades/AtividadeDetalheDialog.tsx` | Adicionar secao historico + seletor temperatura |
| `src/components/atividades/AtividadeKanbanCard.tsx` | Trocar badge por seletor inline |
| `src/components/atividades/AtividadeCard.tsx` | Trocar badge por seletor inline |
| `src/components/atividades/ConcluirAtividadeDialog.tsx` | Trocar Select por seletor inline |

