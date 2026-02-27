

# Integrar Atividades Comerciais ao Kanban de Negociacoes

## Resumo do Fluxo

O kanban de /negociacoes tera duas fases distintas:

1. **Atendimento** (etapa inicial): Recebe atividades comerciais automaticamente. Nao exige proposta vinculada.
2. **Negociacao em diante**: So permite itens que tenham uma proposta gerada (numero_proposta preenchido).

```text
[Atividade criada] --> Auto-cria negociacao na etapa "Atendimento"
                              |
                              v
              [Usuario gera proposta] --> Move automaticamente para "Negociacao"
                              |
              [Drag para "Negociacao" sem proposta] --> Abre dialog de gerar proposta
                              |
              [Tenta mover para etapas apos Atendimento sem proposta] --> Bloqueado
```

## Alteracoes

### 1. Migration SQL: Adicionar coluna `atividade_origem_id` em `negociacoes`

A tabela `negociacoes` nao tem link direto com `atividades`. Adicionar:

- `atividade_origem_id uuid REFERENCES atividades(id)` -- vincula a negociacao a atividade de origem

### 2. Hook `useCreateAtividade` -- Auto-criar negociacao

Quando uma atividade de tipo comercial (`atendimento`, `negociacao`, `contra_proposta_atividade`) for criada, automaticamente criar uma negociacao na etapa "Atendimento" (is_inicial = true) com os mesmos dados (cliente, corretor, empreendimento, imobiliaria).

Isso substitui o fluxo manual de "Converter em Proposta" para esses tipos. A negociacao comeca sem proposta, apenas como um registro no Kanban.

### 3. Hook `useGerarProposta` -- Auto-mover para etapa "Negociacao"

Apos gerar proposta com sucesso, mover automaticamente a negociacao da etapa "Atendimento" para a etapa "Negociacao" (ordem = 1).

### 4. `FunilKanbanBoard` -- Bloquear movimentacao sem proposta

No `handleKanbanMove`, antes de permitir o drag-and-drop:

- Se a negociacao esta na etapa inicial (Atendimento) e o destino NAO e a etapa inicial:
  - Se `numero_proposta` nao existe: abrir o `PropostaDialog` em modo "gerar" em vez de mover
  - Se `numero_proposta` existe: permitir a movimentacao normalmente
- Se o destino e qualquer etapa apos Atendimento e nao tem proposta: bloquear com toast de erro

### 5. `NegociacaoCard` -- Indicador visual

Adicionar indicador visual no card para diferenciar itens na etapa Atendimento que ainda nao tem proposta (ex: badge "Sem Proposta" ou indicador sutil).

## Detalhes tecnicos

### Migration SQL

```text
ALTER TABLE negociacoes
ADD COLUMN atividade_origem_id uuid REFERENCES atividades(id);
```

### useCreateAtividade (src/hooks/useAtividades.ts)

Apos inserir a atividade com sucesso, verificar se o tipo e comercial. Se sim:

```text
const TIPOS_AUTO_NEGOCIACAO = ['atendimento', 'negociacao', 'contra_proposta_atividade'];

if (TIPOS_AUTO_NEGOCIACAO.includes(data.tipo)) {
  // Buscar etapa inicial do funil
  const { data: etapaInicial } = await db
    .from('funil_etapas')
    .select('id')
    .eq('is_inicial', true)
    .eq('is_active', true)
    .maybeSingle();

  if (etapaInicial) {
    await db.from('negociacoes').insert({
      cliente_id: data.cliente_id,
      corretor_id: data.corretor_id,
      empreendimento_id: data.empreendimento_id,
      imobiliaria_id: data.imobiliaria_id,
      funil_etapa_id: etapaInicial.id,
      atividade_origem_id: data.id,
      data_primeiro_atendimento: new Date().toISOString(),
      ordem_kanban: 0,
    });
  }
}
```

### useGerarProposta (src/hooks/useNegociacoes.ts)

Apos gerar proposta, mover para etapa "Negociacao":

```text
// Apos update bem-sucedido, mover para Negociacao se ainda esta em Atendimento
const { data: negAtual } = await db
  .from('negociacoes')
  .select('funil_etapa_id, funil_etapa:funil_etapas(is_inicial)')
  .eq('id', id)
  .single();

if (negAtual?.funil_etapa?.is_inicial) {
  const { data: etapaNegociacao } = await db
    .from('funil_etapas')
    .select('id')
    .eq('nome', 'Negociação')
    .eq('is_active', true)
    .maybeSingle();

  if (etapaNegociacao) {
    await db.from('negociacoes')
      .update({ funil_etapa_id: etapaNegociacao.id })
      .eq('id', id);
  }
}
```

### FunilKanbanBoard (src/components/negociacoes/FunilKanbanBoard.tsx)

No `handleKanbanMove`:

```text
const handleKanbanMove = (negociacao, sourceColumn, destinationColumn) => {
  if (sourceColumn === destinationColumn) return;
  const destEtapa = etapas.find(e => e.id === destinationColumn);
  const srcEtapa = etapas.find(e => e.id === sourceColumn);
  if (!destEtapa) return;

  // Bloqueio: nao pode sair de Atendimento sem proposta
  if (srcEtapa?.is_inicial && !destEtapa.is_inicial && !negociacao.numero_proposta) {
    // Abrir dialog de gerar proposta
    setSelectedNegociacao(negociacao);
    setPropostaMode('gerar');
    setPropostaOpen(true);
    toast.info('Gere uma proposta para avançar a negociação.');
    return;
  }

  // Bloqueio geral: nenhuma etapa apos Atendimento sem proposta
  if (!destEtapa.is_inicial && !negociacao.numero_proposta) {
    toast.error('É necessário gerar uma proposta antes de avançar.');
    return;
  }

  // ... logica existente de mover ...
};
```

### Arquivos modificados

- Migration SQL -- nova coluna `atividade_origem_id`
- `src/hooks/useAtividades.ts` -- auto-criar negociacao
- `src/hooks/useNegociacoes.ts` -- auto-mover ao gerar proposta
- `src/components/negociacoes/FunilKanbanBoard.tsx` -- bloquear drag sem proposta
- `src/components/negociacoes/NegociacaoCard.tsx` -- indicador visual (opcional)

