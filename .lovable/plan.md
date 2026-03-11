

# Filtro por Cidade em /corretores

## O que existe
A tabela `corretores` já possui colunas `cidade` e `uf`. A tabela `imobiliarias` tem `endereco_cidade`. Os dados já estão sendo gravados (ex: "DOURADOS").

## Plano

### 1. Adicionar filtro de cidade na página (`src/pages/Corretores.tsx`)
- Novo `Select` ao lado do filtro de imobiliária com as cidades distintas
- Buscar cidades únicas via query dedicada (tanto de `corretores.cidade` quanto de `imobiliarias.endereco_cidade` para cobertura completa)

### 2. Atualizar `useCorretoresPaginated` (`src/hooks/useCorretores.ts`)
- Adicionar parâmetro `cidade` ao hook
- Filtrar com `.eq('cidade', cidade)` quando informado
- Também permitir filtro pela cidade da imobiliária: se o corretor não tem cidade própria, usar a da imobiliária vinculada

### 3. Mostrar cidade na tabela
- Adicionar coluna "Cidade/UF" na tabela, exibindo `c.cidade` + `c.uf` ou fallback para `c.imobiliaria?.endereco_cidade`

### 4. Incluir cidade na exportação Excel
- Adicionar coluna "Cidade" e "UF" no export

### Detalhes técnicos

**Query de cidades distintas** (nova query no componente):
```typescript
const { data: cidades } = useQuery({
  queryKey: ['corretores-cidades'],
  queryFn: async () => {
    const { data } = await supabase
      .from('corretores')
      .select('cidade')
      .not('cidade', 'is', null)
      .neq('cidade', '');
    const unique = [...new Set(data?.map(c => c.cidade?.trim()).filter(Boolean))].sort();
    return unique;
  }
});
```

**Filtro no hook paginado**: adicionar `.eq('cidade', cidade)` quando o filtro estiver ativo.

