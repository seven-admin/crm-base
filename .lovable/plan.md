
# Adicionar Subclassificacao de Atividades: Primeiro Atendimento / Retorno

## Resumo

Adicionar um campo "subtipo" nas atividades dos tipos **ligacao**, **visita** e **atendimento**, permitindo classificar como **Primeiro Atendimento** ou **Retorno**.

## Mudancas

### 1. Migracao no banco de dados

Adicionar coluna `subtipo` na tabela `atividades`:

```sql
ALTER TABLE atividades ADD COLUMN subtipo text;
```

Valores aceitos: `primeiro_atendimento`, `retorno` (ou null para tipos que nao usam).

### 2. Tipos TypeScript — `src/types/atividades.types.ts`

- Criar tipo `AtividadeSubtipo = 'primeiro_atendimento' | 'retorno'`
- Criar constante `ATIVIDADE_SUBTIPO_LABELS` com os rotulos
- Criar constante `TIPOS_COM_SUBTIPO` listando os tipos que aceitam subtipo: `['ligacao', 'visita', 'atendimento']`
- Adicionar campo `subtipo` nas interfaces `Atividade` e `AtividadeFormData`

### 3. Formulario — `src/components/atividades/AtividadeForm.tsx`

- Adicionar campo `subtipo` ao schema zod (opcional)
- Quando o tipo selecionado for `ligacao`, `visita` ou `atendimento`, exibir um select com as opcoes "Primeiro Atendimento" e "Retorno"
- Limpar o subtipo quando o tipo mudar para um que nao aceita subtipo

### 4. Listagem / Tabela — `src/pages/Atividades.tsx`

- Exibir o subtipo como badge discreto ao lado do icone de tipo (ex: badge pequeno "1o" ou "Ret.")
- Adicionar filtro de subtipo nos filtros da pagina

### 5. Hooks — `src/hooks/useAtividades.ts`

- Incluir `subtipo` nos campos de create/update
- Adicionar suporte a filtro por subtipo em `AtividadeFilters`

### 6. Detalhe — `src/components/atividades/AtividadeDetalheDialog.tsx`

- Exibir o subtipo na area de informacoes da atividade

### 7. Outros pontos de exibicao

- `src/components/portal-incorporador/AtividadesListaPortal.tsx` — exibir subtipo nos cards
- `src/components/atividades/AtividadeCard.tsx` — exibir subtipo se presente

## Detalhes tecnicos

```text
Tabela: atividades
Nova coluna: subtipo (text, nullable, sem default)

Tipos que usam subtipo: ligacao, visita, atendimento
Valores possiveis: primeiro_atendimento, retorno
```

### Arquivos alterados: ~7

- Migracao SQL (nova coluna)
- `src/types/atividades.types.ts`
- `src/components/atividades/AtividadeForm.tsx`
- `src/pages/Atividades.tsx`
- `src/hooks/useAtividades.ts`
- `src/components/atividades/AtividadeDetalheDialog.tsx`
- `src/components/portal-incorporador/AtividadesListaPortal.tsx`
