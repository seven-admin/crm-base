

# Texto configurável no rodapé do relatório de unidades disponíveis

## O que será feito
Adicionar um campo de texto livre na edição do empreendimento para configurar observações que aparecem no final do relatório PDF de unidades disponíveis (ex: condições comerciais, índices de correção, previsão de entrega).

## Solução

### 1. Migration SQL
- `ALTER TABLE empreendimentos ADD COLUMN texto_rodape_relatorio text`

### 2. `src/types/empreendimentos.types.ts`
- Adicionar `texto_rodape_relatorio: string | null` na interface `Empreendimento`

### 3. `src/components/empreendimentos/EmpreendimentoForm.tsx`
- Adicionar campo `texto_rodape_relatorio` ao schema zod (string optional)
- Adicionar Textarea no step 3 (Documentação) com label "Observações do Relatório" e placeholder orientativo
- Incluir no reset do form e no submit

### 4. `src/components/empreendimentos/UnidadesTab.tsx`
- No `handleExportPDF`, após a tabela e o total, renderizar o `empreendimento.texto_rodape_relatorio` se existir
- Estilizado como bloco de texto com fonte menor, borda superior, respeitando quebras de linha

### Arquivos a modificar
- **Migration SQL** (1 coluna)
- `src/types/empreendimentos.types.ts`
- `src/components/empreendimentos/EmpreendimentoForm.tsx`
- `src/components/empreendimentos/UnidadesTab.tsx`