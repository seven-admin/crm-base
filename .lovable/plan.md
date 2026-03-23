

# Corrigir botões de aprovação de vínculo na página Corretores

## Problema
Linha 281: botões só aparecem quando `status_vinculo === 'pendente'` E `canEdit`. Como registros existentes têm default `'ativo'`, nenhum aparece como pendente. Além disso, botões são `ghost h-7 w-7` (quase invisíveis).

## Solução — `src/pages/Corretores.tsx`

### 1. Importar `isSuper