
# Adicionar CPF ao cadastro de Imobiliaria (Pessoa Fisica ou Juridica)

## Resumo

Permitir que uma imobiliaria seja cadastrada tanto como pessoa juridica (CNPJ) quanto como pessoa fisica (CPF), com um seletor de tipo de pessoa e validacao adequada para cada documento.

## Alteracoes no banco de dados

**Migration SQL** - Adicionar coluna `cpf` e `tipo_pessoa` na tabela `imobiliarias`:

```text
ALTER TABLE imobiliarias ADD COLUMN tipo_pessoa text NOT NULL DEFAULT 'juridica';
ALTER TABLE imobiliarias ADD COLUMN cpf text;
```

A coluna `tipo_pessoa` aceita valores `'fisica'` ou `'juridica'` (default `'juridica'` para manter compatibilidade com dados existentes).

## Alteracoes no frontend

### 1. `src/types/mercado.types.ts`
- Adicionar `tipo_pessoa?: 'fisica' | 'juridica'` e `cpf?: string` nas interfaces `Imobiliaria` e `ImobiliariaFormData`.

### 2. `src/components/mercado/ImobiliariaForm.tsx`
- Adicionar campo `tipo_pessoa` ao schema zod (default `'juridica'`).
- Adicionar campo `cpf` ao schema com validacao condicional.
- No Step 1 (Empresa), adicionar um `RadioGroup` com opcoes "Pessoa Juridica" e "Pessoa Fisica" antes dos campos de documento.
- Quando `tipo_pessoa === 'juridica'`: exibir campo CNPJ (como hoje), ocultar CPF.
- Quando `tipo_pessoa === 'fisica'`: exibir campo CPF com mascara (`formatarCPF`) e validacao (`validarCPF`), ocultar CNPJ.
- Atualizar `useEffect` do `reset` para carregar `tipo_pessoa` e `cpf` do `initialData`.

### 3. `src/hooks/useImobiliarias.ts`
- Garantir que o campo `cpf` e `tipo_pessoa` sejam enviados no insert/update (verificar se o hook ja envia todos os campos dinamicamente).

### 4. Validacao
- Usar `validarCPF` de `src/lib/documentUtils.ts` (ja existe no projeto) para validar CPF no submit quando tipo_pessoa for `'fisica'`.
- Usar `validarCNPJ` de `src/lib/documentUtils.ts` (ja existe) para validar CNPJ quando tipo_pessoa for `'juridica'`.
- A validacao sera feita via `refine` no schema zod.

## Detalhes da UX

- O seletor de tipo de pessoa sera um `RadioGroup` horizontal com duas opcoes: "Pessoa Juridica" e "Pessoa Fisica".
- Ao trocar o tipo, o campo de documento anterior sera limpo automaticamente.
- Labels dinamicos: quando PF, o label "Nome" pode ter hint "(Nome completo)" para orientar.
