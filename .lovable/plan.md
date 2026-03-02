

# Correcoes: Metas (campo Ligacoes) + Exclusao de Atividade

## Problema 1: Campo "Ligacoes" no modal de metas nao salva no banco

O modal de criacao/edicao de metas tipo "atividades" tem um campo "Meta de Ligacoes" (linha 981-988), mas ele esta vinculado ao estado `metaPropostas` / `setMetaPropostas`. Na hora de salvar (handleSaveMeta, linha 221), quando o tipo e "atividades", o valor de `meta_propostas` e forcado para 0. Resultado: o valor digitado em Ligacoes e descartado.

Alem disso, **nao existe coluna `meta_ligacoes`** na tabela `metas_comerciais` do banco. Os campos existentes sao: `meta_valor`, `meta_unidades`, `meta_propostas`, `meta_visitas`, `meta_atendimentos`, `meta_treinamentos`.

### Correcao

1. **Migration SQL**: Adicionar coluna `meta_ligacoes integer NOT NULL DEFAULT 0` na tabela `metas_comerciais`
2. **Frontend (MetasComerciais.tsx)**:
   - Criar estado `metaLigacoes` dedicado (separado de `metaPropostas`)
   - Vincular o campo "Meta de Ligacoes" ao novo estado `metaLigacoes`
   - No `handleSaveMeta`, enviar `meta_ligacoes` com o valor correto
   - No `handleEditExistingMeta`, carregar `meta_ligacoes` do registro
   - No `resetMetaFields`, limpar `metaLigacoes`
   - Na tabela "Gerenciar Metas", exibir coluna "Ligacoes"
3. **Hook (useMetasComerciais.ts)**: Incluir `meta_ligacoes` no tipo `MetasPorTipo.atividades` e no card do dashboard

## Problema 2: Erro ao excluir atividade (FK constraint)

O erro no banco e:
```
update or delete on table "atividades" violates foreign key constraint 
"negociacoes_atividade_origem_id_fkey" on table "negociacoes"
```

A atividade tem uma negociacao vinculada via `atividade_origem_id`. A FK atual tem `ON DELETE NO ACTION`, o que impede a exclusao.

### Correcao

**Migration SQL**: Alterar a FK para `ON DELETE SET NULL`, permitindo excluir a atividade sem excluir a negociacao (apenas desvincula).

```sql
ALTER TABLE public.negociacoes 
  DROP CONSTRAINT negociacoes_atividade_origem_id_fkey,
  ADD CONSTRAINT negociacoes_atividade_origem_id_fkey 
    FOREIGN KEY (atividade_origem_id) 
    REFERENCES public.atividades(id) 
    ON DELETE SET NULL;
```

## Resumo das alteracoes

| Arquivo / Recurso | Mudanca |
|---|---|
| Migration SQL | Adicionar coluna `meta_ligacoes` + alterar FK negociacoes para SET NULL |
| `src/pages/MetasComerciais.tsx` | Estado `metaLigacoes`, vincular campo, salvar/carregar/exibir corretamente |
| `src/hooks/useMetasComerciais.ts` | Incluir `meta_ligacoes` no tipo e nos cards de atividades |

