
# Padronizar layout de todas as tabelas do sistema

## Problema
As tabelas de listagem usam layouts inconsistentes: algumas usam `Card` com `CardHeader`, outras usam `div` com borda, outras nao tem container nenhum. O usuario quer um padrao unico.

## Padrao escolhido
O padrao mais limpo e mais usado no sistema e:
- **Toolbar** (busca, filtros, botoes) fora do container da tabela, diretamente no fluxo da pagina
- **Tabela** envolvida por `<div className="rounded-lg border">`
- **Paginacao** abaixo da tabela, fora do container
- Contagem de registros como texto `text-sm text-muted-foreground` acima da tabela

Esse e o padrao ja usado em: Corretores, ClientesTable, NegociacoesTable, Eventos.

## Arquivos a alterar

### 1. `src/pages/Imobiliarias.tsx`
- Remover `<Card>`, `<CardHeader>`, `<CardContent>` ao redor da tabela
- Mover a barra de busca + badge de contagem para fora, no mesmo nivel da toolbar de botoes (mesma linha ou abaixo)
- Envolver a `<Table>` em `<div className="rounded-lg border">`
- Manter `PaginationControls` fora do container

### 2. `src/pages/Incorporadoras.tsx`
- Mesma alteracao que Imobiliarias: remover Card wrapper, toolbar fora, tabela em `<div className="rounded-lg border">`

### 3. `src/pages/Usuarios.tsx` (linhas ~656-658)
- Adicionar `rounded-lg border` ao `<div>` que envolve a tabela desktop

### 4. `src/pages/Atividades.tsx` (linhas ~625-626)
- Substituir `<Card className="hidden md:block"><CardContent className="p-0">` por `<div className="hidden md:block rounded-lg border">`

### 5. `src/pages/Bonificacoes.tsx` (linhas ~270-271)
- Substituir `<Card className="hidden md:block"><CardContent className="p-0">` por `<div className="hidden md:block rounded-lg border">`

### 6. `src/pages/Propostas.tsx` (linhas ~307-308)
- Substituir `<Card><CardContent className="pt-6">` por `<div className="rounded-lg border">`

### 7. `src/pages/Auditoria.tsx` (linhas ~311-320)
- Remover `<Card><CardHeader><CardContent>` wrapper. Mover titulo/contagem para fora. Tabela em `<div className="rounded-lg border">`

### 8. `src/pages/portal/PortalCorretoresGestao.tsx` (linhas ~126-127)
- Substituir `<Card><CardContent className="p-0">` por `<div className="rounded-lg border">`

## Resultado
Todas as tabelas de listagem terao o mesmo padrao visual:
- Toolbar com busca/filtros/botoes no topo
- Contagem de registros como texto simples
- Tabela em container `rounded-lg border`
- Paginacao abaixo

Nenhuma alteracao de logica ou banco de dados - apenas reorganizacao de containers HTML/CSS.
