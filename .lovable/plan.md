

# Corrigir erro de unidades duplicadas apos exclusao em lote

## Problema

A exclusao de unidades em lote faz **soft delete** (marca `is_active = false`), mas a tabela `unidades` tem uma **unique constraint** no banco de dados:

```
unidades_empreendimento_id_bloco_id_numero_key (empreendimento_id, bloco_id, numero)
```

Isso impede criar novas unidades com o mesmo numero e bloco, mesmo que as anteriores estejam marcadas como inativas.

## Solucao

Duas abordagens possiveis (recomendo a opcao 1):

### Opcao 1 - Alterar a exclusao em lote para **hard delete** (DELETE real)

**Arquivo**: `src/hooks/useUnidades.ts` - funcao `useDeleteUnidadesBatch`

- Trocar o `.update({ is_active: false })` por `.delete()` para que os registros sejam realmente removidos do banco
- Isso libera os numeros para reutilizacao imediata

### Opcao 2 - Alterar a unique constraint no banco para considerar apenas registros ativos

- Remover a constraint atual e criar um **partial unique index** que considera apenas unidades com `is_active = true`
- Isso permite manter o soft delete e ainda reutilizar numeros

## Plano de implementacao (Opcao 1 recomendada)

1. **Corrigir dados atuais**: Executar uma migracao SQL para deletar permanentemente as unidades inativas do empreendimento AXIS (e opcionalmente todas as inativas do sistema)

2. **Alterar o hook `useDeleteUnidadesBatch`**: Trocar soft delete por hard delete para evitar o problema no futuro

3. **Revisar tambem `useDeleteUnidade`** (exclusao individual): Garantir consistencia, trocando tambem para hard delete

## Detalhes tecnicos

### Migracao SQL
```sql
DELETE FROM unidades 
WHERE empreendimento_id = '176bc0f0-09b5-4d24-a785-7ea23d7d19cf' 
  AND is_active = false;
```

### Alteracao no hook
No arquivo `src/hooks/useUnidades.ts`, na funcao `useDeleteUnidadesBatch`, trocar:
- De: `supabase.from('unidades').update({ is_active: false }).in('id', ids)`
- Para: `supabase.from('unidades').delete().in('id', ids)`

Mesma alteracao na funcao `useDeleteUnidade` (exclusao individual).

