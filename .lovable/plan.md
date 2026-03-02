
# Correcao de filtros e atividades no Kanban de Negociacoes

## Problema 1 — Filtros resetam ao abrir/fechar modal

### Causa raiz

Na pagina `/negociacoes` (`src/pages/Negociacoes.tsx`), o estado dos filtros esta armazenado em `useState` local:

```text
const [filters, setFilters] = useState<NegociacoesFilters>({});
```

Quando o usuario clica em "Editar" no card do Kanban (`NegociacaoCard.tsx` linha 161), o sistema navega para `/negociacoes/editar/:id`. Ao voltar, o componente `Funil` remonta do zero e o `useState` inicializa como `{}`, perdendo todos os filtros selecionados.

O mesmo ocorre ao clicar "Nova Ficha de Proposta" (navega para `/negociacoes/nova`).

### Solucao

Persistir os filtros nos **query params da URL** usando `useSearchParams` do React Router. Assim, ao navegar e voltar, os filtros sao restaurados automaticamente.

**Arquivo:** `src/pages/Negociacoes.tsx`

- Substituir `useState<NegociacoesFilters>({})` por um estado derivado de `useSearchParams`
- Na funcao `handleFiltersChange`, atualizar os search params da URL (sem navegacao, apenas `setSearchParams`)
- Ao montar, ler os params da URL e popular o estado inicial dos filtros
- Manter a view (kanban/lista) tambem nos search params para consistencia

**Arquivo:** `src/pages/negociacoes/NegociacoesToolbar.tsx` — sem alteracao necessaria, ja recebe `filters` como prop.

---

## Problema 2 — Atividades comerciais devem aparecer na etapa Atendimento do Kanban

### Estado atual

O hook `useCreateAtividade` em `src/hooks/useAtividades.ts` (linha 225-251) ja cria automaticamente uma negociacao na etapa inicial quando o tipo da atividade e `atendimento`, `negociacao` ou `contra_proposta_atividade`. A negociacao fica vinculada ao `funil_etapa_id` da etapa inicial (Atendimento).

### Problema identificado

O codigo atual so cria a negociacao ao **cadastrar** a atividade. Se a atividade for **editada** para mudar o tipo para um dos tipos comerciais, nenhuma negociacao e criada. Alem disso, nao ha validacao de duplicidade — se o usuario cria multiplas atividades para o mesmo cliente/empreendimento, multiplas negociacoes sao geradas.

### Solucao

**Arquivo:** `src/hooks/useAtividades.ts`

- No hook de **update** de atividade (`useUpdateAtividade` ou equivalente), adicionar a mesma logica de auto-criacao de negociacao quando o tipo muda para um dos tipos comerciais
- Adicionar verificacao de duplicidade: antes de criar, checar se ja existe uma negociacao ativa para o mesmo `cliente_id` + `empreendimento_id` na etapa inicial
- Se ja existir, nao criar duplicata

---

## Resumo de arquivos a alterar

| Arquivo | Mudanca |
|---------|---------|
| `src/pages/Negociacoes.tsx` | Persistir filtros em search params da URL |
| `src/hooks/useAtividades.ts` | Adicionar auto-criacao de negociacao no update + check de duplicidade |
