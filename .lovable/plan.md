

# Tela de seleção de empreendimento antes do Forecast (super_admin)

## Objetivo
Quando o super_admin acessa `/negociacoes`, exibir primeiro uma tela de seleção de empreendimento, ocultando todos os dados até que um empreendimento seja escolhido. Isso evita exposição de dados sensíveis quando o admin está ao lado de um cliente.

## Implementação

### 1. Criar componente `NegociacoesEmpreendimentoGate`
Novo arquivo `src/pages/negociacoes/NegociacoesEmpreendimentoGate.tsx`:
- Tela com `MainLayout`, título "Forecast", e um grid de cards com os empreendimentos ativos (usando `useEmpreendimentosSelect`)
- Ao clicar em um empreendimento, seta o filtro `empreendimento_id` nos search params e mostra o conteúdo normal

### 2. Alterar `src/pages/Negociacoes.tsx`
- Importar `useAuth` para checar `role === 'super_admin'`
- Se for super_admin **e** não houver `empreendimento_id` nos filtros, renderizar o `NegociacoesEmpreendimentoGate` em vez do conteúdo do forecast
- Quando o empreendimento é selecionado, adicionar `empreendimento_id` aos search params e renderizar o forecast normalmente
- Adicionar botão "Trocar empreendimento" no toolbar para voltar à seleção (limpar o filtro)

### Fluxo
```text
super_admin acessa /negociacoes
  → Sem empreendimento_id? → Tela de seleção (cards com empreendimentos)
  → Com empreendimento_id? → Forecast normal (Kanban/Lista filtrado)

Outros roles acessam /negociacoes
  → Forecast normal (sem gate)
```

### Arquivos alterados
- **Criar**: `src/pages/negociacoes/NegociacoesEmpreendimentoGate.tsx`
- **Editar**: `src/pages/Negociacoes.tsx`

