

# Filtro por Empreendimento no Portal do Incorporador

## O que sera feito
Adicionar um select/combobox de empreendimento no header do layout do portal, permitindo filtrar todas as paginas (Dashboard, Executivo, Forecast, Propostas, Disponibilidade, Marketing, Planejamento) por um empreendimento especifico ou ver todos.

## Abordagem

Criar um contexto React (`PortalIncorporadorFilterContext`) no layout para compartilhar o filtro entre todas as paginas filhas, evitando prop drilling e alteracao massiva de assinaturas.

## Arquivos a modificar

### 1. Novo: `src/contexts/PortalIncorporadorFilterContext.tsx`
- Context com `empreendimentoIdFiltro` (string | null) e setter
- Hook `usePortalIncorporadorFilter()` para consumo nas paginas
- Provider que encapsula o Outlet no layout

### 2. `src/components/portal-incorporador/PortalIncorporadorLayout.tsx`
- Importar o provider e o hook `useIncorporadorEmpreendimentos`
- Renderizar um `Select` no header (ao lado do nome do usuario) com opcoes: "Todos os empreendimentos" + lista dos empreendimentos vinculados
- Envolver o `<Outlet />` com o `PortalIncorporadorFilterProvider`

### 3. Novo hook: `src/hooks/useFilteredEmpreendimentoIds.ts`
- Consome `useIncorporadorEmpreendimentos` + `usePortalIncorporadorFilter`
- Retorna `empreendimentoIds` filtrado (1 ID se selecionado, todos se "todos")
- Centraliza a logica de filtragem para todas as paginas

### 4. Paginas que precisam atualizar (trocar `useIncorporadorEmpreendimentos` por `useFilteredEmpreendimentoIds`):
- `PortalIncorporadorDashboard.tsx`
- `PortalIncorporadorExecutivo.tsx`
- `PortalIncorporadorForecast.tsx`
- `PortalIncorporadorPropostas.tsx`
- `PortalIncorporadorDisponibilidade.tsx`
- `PortalIncorporadorMarketing.tsx`
- `PortalIncorporadorPlanejamento.tsx`

Em cada pagina, a unica mudanca e substituir a chamada de `useIncorporadorEmpreendimentos()` por `useFilteredEmpreendimentoIds()` para obter os IDs ja filtrados.

## UX
- Select compacto no header, alinhado a direita antes do botao de logout
- Opcao default: "Todos os empreendimentos"
- Persistencia apenas em memoria (reseta ao sair do portal)

