
# Plano: Metas de Atividades + Migrar Temperatura para Atividades de Negociacao

## Parte 1: Selecao de tipo de meta em /metas-comerciais

Ao criar uma nova meta, o formulario passara a ter uma selecao inicial entre dois modos:

- **Metas Comerciais**: fluxo atual (meta de valor, unidades, propostas)
- **Metas de Atividades**: nova opcao focada em metas operacionais (visitas, atendimentos, ligacoes, treinamentos)

### Alteracoes

**`src/pages/MetasComerciais.tsx`**
- Adicionar estado `metaTipo` com valores `'comercial' | 'atividades'`
- No dialog de criacao, antes dos campos, renderizar dois botoes/cards de selecao para o tipo
- Quando `comercial`: exibir campos atuais (meta_valor, meta_unidades, meta_propostas)
- Quando `atividades`: exibir campos de atividades (meta_visitas, meta_atendimentos, meta_treinamentos, meta_ligacoes)
- O salvamento usa a mesma tabela `metas_comerciais` - os campos ja existem (meta_visitas, meta_atendimentos, meta_treinamentos)

**Banco de dados**: adicionar coluna `tipo` (text, default 'comercial') na tabela `metas_comerciais` para diferenciar e filtrar os dois tipos.

---

## Parte 2: Migrar Temperatura de Clientes para Atividades de Negociacao

O conceito de temperatura (frio/morno/quente) sera removido do cadastro de clientes e passara a existir exclusivamente nas atividades vinculadas a negociacoes (tipos: Atendimento e Assinatura). A temperatura ja existe no campo `temperatura_cliente` da tabela `atividades`.

### O que muda

**Remover temperatura do modulo de Clientes:**
- `src/pages/clientes/ClientesTable.tsx`: remover coluna "Temperatura" e o select inline
- `src/pages/clientes/ClientesMobileCards.tsx`: remover select de temperatura
- `src/components/clientes/ClienteQuickViewDialog.tsx`: remover badge de temperatura
- `src/pages/PortalClientes.tsx`: remover badge de temperatura
- `src/hooks/useClientes.ts`: remover filtro por temperatura, remover `useAtualizarTemperatura`, remover default `temperatura: 'frio'` na criacao
- `src/types/clientes.types.ts`: manter os tipos/labels (sao reutilizados pelas atividades), mas remover `temperatura` do `ClienteFilters`

**Remover propagacao atividade -> cliente:**
- `src/components/atividades/AtividadeForm.tsx`: remover o trecho que faz `updateClienteMutation` para propagar temperatura ao cliente

**Manter temperatura nas atividades de negociacao:**
- O campo `temperatura_cliente` na tabela `atividades` e no formulario de atividades permanece inalterado
- `AtividadeForm.tsx`: manter o campo de selecao de temperatura (ja existe)
- `ConcluirAtividadeDialog.tsx`: manter campo de temperatura ao concluir
- `AtividadeDetalheDialog.tsx`: manter exibicao da temperatura
- `AtividadeCard.tsx`: continua exibindo temperatura do `atividade.temperatura_cliente` (ajustar para nao depender de `cliente.temperatura`)

**Ajustar Funil de Temperatura (Forecast):**
- `src/hooks/useForecast.ts` (`useFunilTemperatura`): alterar para buscar temperatura de `atividades.temperatura_cliente` ao inves de `clientes.temperatura`. Agrupar pela temperatura mais recente da ultima atividade de negociacao do cliente.
- `src/components/forecast/FunilTemperatura.tsx`: sem alteracoes visuais, apenas os dados mudam.

**Banco de dados:**
- Nao remover a coluna `temperatura` da tabela `clientes` imediatamente (evitar breaking change). Apenas parar de usa-la no frontend.

### Resumo dos arquivos afetados

| Arquivo | Acao |
|---|---|
| `src/pages/MetasComerciais.tsx` | Adicionar selecao comercial/atividades no form |
| `src/pages/clientes/ClientesTable.tsx` | Remover coluna e select de temperatura |
| `src/pages/clientes/ClientesMobileCards.tsx` | Remover select de temperatura |
| `src/components/clientes/ClienteQuickViewDialog.tsx` | Remover badge temperatura |
| `src/pages/PortalClientes.tsx` | Remover badge temperatura |
| `src/hooks/useClientes.ts` | Remover filtro, hook e default de temperatura |
| `src/types/clientes.types.ts` | Remover temperatura de ClienteFilters |
| `src/components/atividades/AtividadeForm.tsx` | Remover propagacao para cliente |
| `src/components/atividades/AtividadeCard.tsx` | Usar `temperatura_cliente` da atividade |
| `src/hooks/useForecast.ts` | Buscar temperatura de atividades ao inves de clientes |
| Migration SQL | Adicionar coluna `tipo` em `metas_comerciais` |

### Detalhes tecnicos

```text
Funil de Temperatura (novo fluxo):
  atividades (tipo IN negociacao, status != cancelada)
    -> agrupar por cliente_id
    -> pegar temperatura_cliente da atividade mais recente
    -> contar frio/morno/quente
```

A coluna `temperatura` no banco de clientes sera preservada mas ignorada pelo frontend, permitindo rollback se necessario.
