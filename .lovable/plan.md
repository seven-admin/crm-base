

# Alterar cor das linhas separadoras para #bebfc0

## Mudanca

Substituir a cor `#F1F5F9` usada em **linhas divisorias e borders de separacao** por `#bebfc0` nos componentes da pagina `/design-test`. Somente as linhas que servem como separadores visuais serao alteradas -- backgrounds de botoes, tags e badges permanecem inalterados.

## Arquivos e linhas afetadas

### `src/components/design-test/TestTeamCard.tsx`
- Divisoria entre membros da equipe (`background: '#F1F5F9'` na div separadora)

### `src/components/design-test/TestProjectList.tsx`
- Divisoria entre itens da lista de projetos (`background: '#F1F5F9'` na div separadora)

### `src/components/design-test/TestTableCard.tsx`
- `borderBottom` do header da tabela
- `borderBottom` entre linhas da tabela

### `src/components/design-test/TestMetricsCard.tsx`
- `borderRight` entre as 3 colunas de metricas

### `src/pages/DesignTest.tsx`
- Borders dos inputs do formulario (`border: '1px solid #E2E8F0'` -- estes usam `#E2E8F0`, nao `#F1F5F9`, portanto nao serao alterados)
- Borders dos icones do nav e input de busca (estes sao borders de elementos UI, nao separadores -- permanecem como estao)

## Resumo tecnico

Trocar `#F1F5F9` por `#bebfc0` somente nas propriedades que funcionam como divisorias visuais:
- `background: '#F1F5F9'` em divs de height 1px (separadores)
- `borderBottom: '1px solid #F1F5F9'` em linhas de tabela
- `borderRight: '1px solid #F1F5F9'` entre colunas de metricas

Nao alterar usos de `#F1F5F9` em backgrounds de botoes, tags, pills ou badges.

