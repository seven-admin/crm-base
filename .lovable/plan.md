
# Disponibilidade no Portal do Incorporador + Renomear "Mapa de Unidades"

## Resumo

Duas alteracoes:
1. Renomear "Mapa de Unidades" para "Disponibilidade" em toda a aplicacao
2. Adicionar a pagina de Disponibilidade ao Portal do Incorporador

## Alteracoes detalhadas

### 1. Renomear "Mapa de Unidades" para "Disponibilidade"

**Arquivo: `src/components/layout/Sidebar.tsx`**
- Alterar o label de `'Mapa de Unidades'` para `'Disponibilidade'` no item do menu

**Arquivo: `src/pages/MapaUnidadesPage.tsx`**
- Alterar o titulo de "Mapa de Unidades" para "Disponibilidade"
- Alterar o subtitle para algo como "Visualize a disponibilidade de unidades por empreendimento"

### 2. Criar pagina de Disponibilidade para o Portal do Incorporador

**Novo arquivo: `src/pages/portal-incorporador/PortalIncorporadorDisponibilidade.tsx`**
- Pagina similar a `MapaUnidadesPage`, mas usando `useIncorporadorEmpreendimentos` para filtrar apenas os empreendimentos vinculados ao incorporador
- Reutiliza o componente `MapaInterativo` existente
- Inclui seletor de empreendimento (filtrado) e o mapa

### 3. Registrar a rota no App.tsx

**Arquivo: `src/App.tsx`**
- Adicionar lazy import para `PortalIncorporadorDisponibilidade`
- Adicionar `<Route path="disponibilidade" element={...} />` dentro do bloco de rotas do portal-incorporador

### 4. Adicionar card de navegacao e titulo no layout

**Arquivo: `src/components/portal-incorporador/PortalIncorporadorLayout.tsx`**
- Adicionar entrada em `routeTitles` para `/portal-incorporador/disponibilidade`
- Adicionar card de navegacao "Disponibilidade" na pagina principal do portal (com icone Map e cor adequada)

### 5. Atualizar index de exports

**Arquivo: `src/pages/portal-incorporador/index.ts`**
- Adicionar export para `PortalIncorporadorDisponibilidade`

## Arquivos afetados

| Arquivo | Alteracao |
|---|---|
| `src/components/layout/Sidebar.tsx` | Renomear label para "Disponibilidade" |
| `src/pages/MapaUnidadesPage.tsx` | Renomear titulo para "Disponibilidade" |
| `src/pages/portal-incorporador/PortalIncorporadorDisponibilidade.tsx` | **Novo** - Pagina de disponibilidade usando empreendimentos do incorporador |
| `src/App.tsx` | Adicionar rota `/portal-incorporador/disponibilidade` |
| `src/components/portal-incorporador/PortalIncorporadorLayout.tsx` | Adicionar titulo e card de navegacao |
| `src/pages/portal-incorporador/index.ts` | Adicionar export |

## Sem alteracoes no banco

Tudo frontend. O componente `MapaInterativo` ja recebe `empreendimentoId` como prop, entao basta reutiliza-lo.
