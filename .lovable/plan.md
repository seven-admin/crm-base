

# Corrigir filtro de cidades: limite de 1000 linhas do Supabase

## Problema
A query que popula o filtro de cidades busca `cidade` de todos os corretores, mas o Supabase retorna no máximo 1000 linhas por padrão. Como a maioria dos corretores é de "DOURADOS", os 1000 primeiros resultados são todos dessa cidade, e cidades como "Santa Maria" ficam de fora.

## Solução
Criar uma **database function** que retorna cidades distintas diretamente no banco, eliminando o limite de 1000 linhas.

### 1. Migration SQL
```sql
CREATE OR REPLACE FUNCTION public.get_cidades_corretores()
RETURNS TABLE(cidade TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT TRIM(c.cidade) as cidade
  FROM public.corretores c
  WHERE c.cidade IS NOT NULL 
    AND TRIM(c.cidade) <> ''
  ORDER BY cidade;
$$;
```

### 2. `src/pages/Corretores.tsx` (linhas 47-58)
Substituir a query atual por uma chamada RPC:

```typescript
const { data: cidades = [] } = useQuery({
  queryKey: ['corretores-cidades'],
  queryFn: async () => {
    const { data } = await supabase.rpc('get_cidades_corretores');
    return (data?.map((c: any) => c.cidade).filter(Boolean) || []) as string[];
  },
});
```

Isso garante que **todas** as cidades distintas sejam retornadas, independentemente do número de corretores.

