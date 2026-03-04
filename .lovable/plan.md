

# Adicionar campo "Quantidade de Participantes" para Treinamentos

## Resumo
Adicionar coluna `qtd_participantes` na tabela `atividades` e exibi-la no formulário (apenas quando tipo = treinamento) e no detalhe. Migrar os dados já existentes extraindo os números das observações.

## Alterações

### 1. Migração SQL (schema + dados)
- Adicionar coluna `qtd_participantes INTEGER NULL` na tabela `atividades`
- UPDATE retroativo: extrair números das observações que contenham padrão "PARA X CORRETORES" (18 registros identificados)

```sql
ALTER TABLE atividades ADD COLUMN qtd_participantes integer;

UPDATE atividades
SET qtd_participantes = (regexp_match(observacoes, 'PARA\s+(\d+)\s+CORRETOR'))[1]::integer
WHERE tipo = 'treinamento'
  AND observacoes ~ 'PARA\s+\d+\s+CORRETOR';
```

### 2. Formulário (`AtividadeForm.tsx`)
- Adicionar campo numérico "Qtd. Participantes" visível apenas quando `tipo === 'treinamento'`
- Campo opcional, input type number, mínimo 1

### 3. Detalhe (`AtividadeDetalheDialog.tsx`)
- Exibir "Participantes: X" quando `tipo === 'treinamento'` e valor preenchido

### 4. Tipos TypeScript (`atividades.types.ts`)
- Adicionar `qtd_participantes?: number | null` em `Atividade` e `AtividadeFormData`

### 5. Hook (`useAtividades.ts`)
- Incluir `qtd_participantes` nos payloads de create/update

Impacto: 4 arquivos + 1 migração. Sem quebra de funcionalidades existentes.

