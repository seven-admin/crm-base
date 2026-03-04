

# Filtro de Mês no Portal Incorporador Forecast

## Problema

A página `/portal-incorporador/forecast` não possui filtro de mês. Todos os hooks de dados (`useResumoAtividadesPorCategoria`, `useNegociacoesIncorporador`, `useAtendimentosLista`) e sub-componentes (`FunilTemperatura`, `VisitasPorEmpreendimento`, `AtividadesPorTipo`, `ProximasAtividades`, `AtendimentosResumo`) são chamados sem parâmetros de data, mostrando dados default (mês atual) ou sem filtro algum.

## Solução

Adicionar state `competencia` + seletor de mês (mesmo padrão da página `Forecast.tsx`: ChevronLeft/Right + botões "Este mês" / "Mês anterior") e propagar `dataInicio`/`dataFim` para todos os hooks e componentes.

## Alterações em `src/pages/portal-incorporador/PortalIncorporadorForecast.tsx`

1. **Imports**: Adicionar `startOfMonth`, `endOfMonth`, `addMonths`, `subMonths` do date-fns, `ChevronLeft`, `ChevronRight` do lucide, e `Button` do shadcn.
2. **State**: `const [competencia, setCompetencia] = useState(new Date())` + memos `dataInicio`/`dataFim`.
3. **Seletor de mês**: Renderizar acima das Tabs, com o mesmo layout da Forecast (setas + label do mês + botões rápidos).
4. **Propagar datas**:
   - `useResumoAtividadesPorCategoria(undefined, dataInicio, dataFim, empsFilter)`
   - `useNegociacoesIncorporador` — adicionar params `dataInicio`/`dataFim` ao hook inline, filtrar por `.gte('created_at', inicioStr).lte('created_at', fimStr)`
   - `useAtendimentosLista` — idem, filtrar por `data_inicio`
   - Sub-componentes: passar `dataInicio={dataInicio} dataFim={dataFim}` para `FunilTemperatura`, `VisitasPorEmpreendimento`, `AtividadesPorTipo`, `ProximasAtividades`, `AtendimentosResumo`

