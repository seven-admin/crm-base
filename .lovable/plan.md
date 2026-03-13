

# Vincular cidade do corretor à imobiliária

## Situação atual
- Corretores têm campos `cidade` e `uf` próprios
- Na tabela, já existe fallback visual (linha 239): se corretor não tem cidade, mostra `imobiliaria.endereco_cidade`
- Porém o **filtro de cidades** (`get_cidades_corretores`) só busca `corretores.cidade`, ignorando corretores que herdam a cidade da imobiliária
- Na criação (edge function `create-corretor`), cidade/uf são opcionais e nem sempre preenchidos

## Solução

### 1. Edge function `create-corretor` — auto-preencher cidade/uf da imobiliária
Quando o corretor é criado **sem** cidade/uf informados, buscar `endereco_cidade` e `endereco_uf` da imobiliária vinculada e usar como valores padrão.

### 2. Edge function `register-corretor` — mesma lógica
Aplicar o mesmo fallback no autocadastro.

### 3. Atualizar `get_cidades_corretores()` — incluir cidades de imobiliárias
A function SQL passará a considerar também `imobiliarias.endereco_cidade` para corretores que não têm cidade própria:

```sql
SELECT DISTINCT cidade FROM (
  SELECT TRIM(c.cidade) as cidade FROM corretores c 
  WHERE c.cidade IS NOT NULL AND TRIM(c.cidade) <> ''
  UNION
  SELECT TRIM(i.endereco_cidade) FROM corretores c 
  JOIN imobiliarias i ON i.id = c.imobiliaria_id
  WHERE c.cidade IS NULL AND i.endereco_cidade IS NOT NULL
) sub ORDER BY cidade;
```

### 4. Migration para preencher corretores existentes
Um `UPDATE` nos corretores que têm `cidade IS NULL` mas têm imobiliária com `endereco_cidade` preenchida, para normalizar os dados existentes.

