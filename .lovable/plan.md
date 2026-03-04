

# Plano: 3 Alterações

## 1. Mover "Pessoas Treinadas" para dentro do CategoriaCard

**Situação atual**: Card standalone separado na grade, antes dos CategoriaCards.

**Proposta**: Remover o card standalone. Modificar o `CategoriaCard` para aceitar uma prop opcional `pessoasTreinadas` (número). Quando presente e > 0, renderizar uma linha extra com ícone `GraduationCap` e texto "X pessoas treinadas" na lista de tipos, antes do footer.

**Arquivos**:
- `src/hooks/usePessoasTreinadas.ts` — expandir para retornar dados **por categoria** (`Record<string, { totalPessoas, totalTreinamentos }>`)
- `src/components/forecast/CategoriaCard.tsx` — nova prop `pessoasTreinadas?: number`, renderizar linha extra com `GraduationCap`
- `src/pages/Forecast.tsx` — remover o card standalone, passar `pessoasTreinadas` para cada `CategoriaCard` com base na categoria

## 2. Corrigir exclusão de lançamento recorrente (FK constraint)

**Problema**: A FK `recorrencia_pai_id` usa `NO ACTION`, impedindo exclusão de lançamentos pai.

**Solução**: Migração SQL alterando a constraint para `ON DELETE SET NULL`.

```sql
ALTER TABLE lancamentos_financeiros 
  DROP CONSTRAINT lancamentos_financeiros_recorrencia_pai_id_fkey,
  ADD CONSTRAINT lancamentos_financeiros_recorrencia_pai_id_fkey 
    FOREIGN KEY (recorrencia_pai_id) REFERENCES lancamentos_financeiros(id) ON DELETE SET NULL;
```

## 3. Atividades: salvar direto ao selecionar cliente (sem avançar etapas)

**Situação atual**: No step 2 do wizard, após selecionar o cliente, o usuário precisa clicar "Próximo" (step 3) ou marcar "Cliente Direto" para salvar.

**Proposta**: Quando o modo é "Atendimento" e o usuário seleciona um cliente no step 2, automaticamente submeter o formulário (com `clienteDireto = true` implícito), fechando o modal. Os campos opcionais (título, datas, etc.) terão seus defaults aplicados automaticamente.

**Arquivo**: `src/components/atividades/AtividadeForm.tsx`
- No `onValueChange` do Select de cliente (step 2), após setar o valor, chamar `form.handleSubmit(onSubmit)()` automaticamente
- Aplicar defaults: `data_inicio` = hoje, `titulo` = nome do tipo selecionado
- Isso se aplica apenas quando `modo === 'atendimento'` e não há `initialData` (modo criação)

