

# Padronizar Tabelas em Todo o Sistema

## Problema

Existem **7 padroes diferentes** de wrapper ao redor do componente `<Table>` no sistema. Isso causa inconsistencia visual -- algumas tabelas tem bordas arredondadas, outras nao; algumas tem fundo de card, outras ficam "soltas" na pagina.

## Solucao

Adotar um **unico padrao** para todas as tabelas: `<div className="rounded-lg border">`. Este padrao:
- Tem bordas arredondadas (consistente com o design system)
- E leve (sem card/shadow desnecessario)
- O overflow ja e tratado pelo proprio componente `Table` internamente

Tabelas que estao **dentro de Cards com outros conteudos** (ex: titulo + tabela) serao mantidas dentro do Card, mas com `CardContent className="p-0"` para evitar padding duplo.

## Arquivos a alterar

### Grupo 1: Tabelas sem wrapper (adicionar `rounded-lg border`)

| Arquivo | Situacao Atual |
|---------|---------------|
| `src/pages/Usuarios.tsx` | `<Table>` sem wrapper |
| `src/pages/Atividades.tsx` | `<Table>` sem wrapper |
| `src/pages/MetasComerciais.tsx` | `<Table>` sem wrapper |
| `src/pages/Auditoria.tsx` | `<Table>` sem wrapper |
| `src/pages/TiposParcela.tsx` | `<Table>` sem wrapper |
| `src/pages/Relatorios.tsx` | Multiplas tabelas sem wrapper |
| `src/pages/PortalEmpreendimentoDetalhe.tsx` | `<Table>` sem wrapper |
| `src/components/empreendimentos/BlocosTab.tsx` | `<Table>` sem wrapper |
| `src/components/clientes/ClienteTelefonesEditor.tsx` | `<Table>` sem wrapper |
| `src/components/negociacoes/NegociacaoForm.tsx` | `<Table>` sem wrapper |
| `src/components/propostas/PropostaForm.tsx` | `<Table>` sem wrapper |

### Grupo 2: Trocar `rounded-md` para `rounded-lg` (padronizar raio)

| Arquivo | Atual |
|---------|-------|
| `src/pages/negociacoes/NegociacoesTable.tsx` | `rounded-md border` |
| `src/pages/Configuracoes.tsx` | `rounded-md border` |
| `src/pages/Eventos.tsx` | `rounded-md border` |
| `src/components/comissoes/ComissoesTable.tsx` | `rounded-md border` |
| `src/components/contratos/TemplatesTable.tsx` | `rounded-md border` |
| `src/components/contratos/ContratosTable.tsx` | `rounded-md border` |
| `src/components/atividades/PendenciasTab.tsx` | `rounded-md border` |

### Grupo 3: Remover `bg-card` extra (ja desnecessario)

| Arquivo | Atual |
|---------|-------|
| `src/pages/clientes/ClientesTable.tsx` | `rounded-lg border bg-card` |
| `src/components/briefings/BriefingsTable.tsx` | `rounded-lg border bg-card` |

### Grupo 4: Tabelas dentro de Cards -- padronizar para `CardContent p-0`

Estes ja estao corretos ou quase corretos. Verificar:

| Arquivo | Situacao |
|---------|----------|
| `src/components/usuarios/CorretoresUsuariosTab.tsx` | `<Card><Table>` -- falta `CardContent p-0` |
| `src/components/comissoes/ConfiguracaoPercentuaisGestores.tsx` | `CardContent` com padding -- trocar para `p-0` |
| `src/components/configuracoes/TermosEditor.tsx` | `CardContent` com padding -- trocar para `p-0` |
| `src/components/financeiro/FinanceiroConfiguracoes.tsx` | `CardContent` com padding -- trocar para `p-0` |
| `src/components/planejamento/PlanejamentoGlobalEquipe.tsx` | `CardContent` com padding -- trocar para `p-0` |

### Grupo 5: Ja corretos (nenhuma alteracao)

- `src/components/contratos/VariaveisManager.tsx` -- `Card > CardContent p-0 > Table`
- `src/components/financeiro/RelatorioRessarcimentos.tsx` -- `Card > CardContent p-0 > Table`
- `src/components/negociacoes/NegociacaoCondicoesPagamentoInlineEditor.tsx` -- `Card > CardContent p-0 > Table`
- `src/components/contratos/CondicoesPagamentoInlineEditor.tsx` -- `Card > CardContent p-0 > Table`
- `src/pages/Bonificacoes.tsx` -- `Card > CardContent p-0 > Table`
- `src/pages/portal/PortalCorretoresGestao.tsx` -- `Card > CardContent p-0 > Table`

## Regra Resumida

```text
Tabela sozinha:       <div className="rounded-lg border"><Table>...</Table></div>
Tabela dentro de Card: <Card><CardContent className="p-0"><Table>...</Table></CardContent></Card>
```

## O que NAO muda

- O componente `Table` base (`src/components/ui/table.tsx`) permanece inalterado
- O espaçamento interno (padding das celulas) ja foi ajustado anteriormente
- Tabelas dentro de dialogs/modals de selecao (NegociacaoForm, PropostaForm) podem manter wrapper mais simples se estiverem em contexto compacto

## Secao Tecnica

Serao alterados aproximadamente **25 arquivos**, cada um com uma mudanca minima: adicionar ou ajustar a `div` wrapper ao redor do `<Table>`. Nenhuma logica de dados ou comportamento sera modificada.

