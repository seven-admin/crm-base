

# Adicionar Pessoa Jurídica ao cadastro de clientes + plano completo anterior

## Situação atual
- A tabela `clientes` **não tem** colunas `tipo_pessoa`, `cnpj` nem `razao_social` — é exclusivamente pessoa física
- O formulário `ClienteForm.tsx` já trata nacionalidade (brasileiro exige CPF, estrangeiro exige passaporte)
- A imobiliária já tem `tipo_pessoa` (fisica/juridica) com CNPJ/CPF — podemos seguir o mesmo padrão
- A função SQL `verificar_ficha_proposta_completa` exige `v_cliente.cpf IS NULL` de forma incondicional — precisa ser atualizada

## Plano completo (inclui itens anteriores + PJ)

### 1. Migration SQL — Schema

**Corretores (itens do plano anterior):**
- `ALTER TABLE corretores ALTER COLUMN imobiliaria_id DROP NOT NULL`
- `ADD COLUMN status_vinculo text DEFAULT 'ativo'`
- Criar function RPC `get_imobiliarias_ativas()`

**Clientes (novo):**
- `ADD COLUMN tipo_pessoa text DEFAULT 'fisica'` (valores: `'fisica'`, `'juridica'`)
- `ADD COLUMN cnpj text` (nullable)
- `ADD COLUMN razao_social text` (nullable)
- `ADD COLUMN inscricao_estadual text` (nullable)
- Atualizar trigger `uppercase_clientes` para incluir `razao_social`
- Atualizar function `verificar_ficha_proposta_completa`:
  - Se `tipo_pessoa = 'juridica'`: exigir CNPJ em vez de CPF
  - Se `tipo_pessoa = 'fisica'`: manter lógica atual (CPF para brasileiro, passaporte para estrangeiro)

### 2. Frontend — Formulário de Cliente (`ClienteForm.tsx`)

- Adicionar campo `tipo_pessoa` no início do formulário (toggle Pessoa Física / Pessoa Jurídica)
- **Pessoa Física**: formulário atual (CPF, RG, data nascimento, estado civil, cônjuge, etc.)
- **Pessoa Jurídica**: mostrar campos CNPJ, Razão Social, Inscrição Estadual; ocultar campos exclusivos de PF (RG, data nascimento, estado civil, cônjuge, nome_mae, nome_pai)
- Atualizar schema zod:
  - PJ: exigir CNPJ válido (usar `validarCNPJ` de `documentUtils.ts` que já existe), nome vira "Nome Fantasia"
  - PF: manter lógica atual de CPF/passaporte

### 3. Validações de proposta e contrato

- **`useValidacaoFichaProposta.ts`**: adicionar condição para PJ — exigir CNPJ em vez de CPF
- **`validarContrato.ts`**: mesma lógica — se PJ, exigir CNPJ; se PF brasileiro, CPF; se PF estrangeiro, passaporte
- **Function SQL `verificar_ficha_proposta_completa`**: atualizar para verificar `tipo_pessoa` e exigir documento correspondente

### 4. Types (`clientes.types.ts`)

- Adicionar `tipo_pessoa`, `cnpj`, `razao_social`, `inscricao_estadual` à interface `Cliente` e `ClienteFormData`

### 5. Tabela de listagem (`Clientes.tsx` e `PortalClientes.tsx`)

- Exibir badge PF/PJ na listagem
- Mostrar CNPJ ou CPF conforme o tipo

### 6. Itens do plano anterior (corretores)

- Edge function `register-corretor`: aceitar `imobiliaria_id` opcional
- `Auth.tsx`: adicionar view `register-corretor`
- `CorretorRegisterForm.tsx`: toggle Autônomo/Vinculado + select imobiliária
- `PortalCorretoresGestao.tsx`: seção de aprovação de pendentes
- `Corretores.tsx`: coluna vínculo + gestão de vínculo pelo admin
- `CorretorForm.tsx`: `imobiliaria_id` opcional

### Arquivos a criar/modificar

- **Migration SQL** (schema clientes + corretores + functions)
- `src/types/clientes.types.ts`
- `src/components/clientes/ClienteForm.tsx`
- `src/hooks/useValidacaoFichaProposta.ts`
- `src/lib/validarContrato.ts`
- `src/pages/Clientes.tsx`
- `src/pages/PortalClientes.tsx`
- `src/lib/documentUtils.ts` (já tem `validarCNPJ` e `formatarCNPJ` — sem alteração)
- `supabase/functions/register-corretor/index.ts`
- `src/pages/Auth.tsx`
- `src/components/auth/CorretorRegisterForm.tsx`
- `src/pages/portal/PortalCorretoresGestao.tsx`
- `src/hooks/useGestorCorretores.ts`
- `src/pages/Corretores.tsx`
- `src/components/mercado/CorretorForm.tsx`

