

# Tres alteracoes pontuais

## 1. Formulario de cadastro publico de imobiliaria (ImobiliariaRegisterForm) - suporte a CPF

O formulario de auto-cadastro (`src/components/auth/ImobiliariaRegisterForm.tsx`) nao foi atualizado para suportar pessoa fisica/CPF -- apenas o form interno (`ImobiliariaForm.tsx`) recebeu essa mudanca.

### Alteracoes em `src/components/auth/ImobiliariaRegisterForm.tsx`:
- Adicionar estado `tipo_pessoa` (`'fisica' | 'juridica'`, default `'juridica'`).
- Adicionar campo `cpf` ao estado do form e ao schema zod, com validacao condicional (usar `validarCPFLocal` similar ao `validarCNPJLocal` ja existente no arquivo, ou importar de `documentUtils`).
- Renderizar um RadioGroup/botoes antes do campo de documento para alternar entre PJ e PF.
- Quando PJ: mostrar campo CNPJ (como hoje). Quando PF: mostrar campo CPF com mascara e validacao.
- Enviar `tipo_pessoa` e `cpf` no body da chamada `register-imobiliaria`.
- Atualizar a edge function `register-imobiliaria` para aceitar e persistir `tipo_pessoa` e `cpf`.

### Alteracao na edge function `supabase/functions/register-imobiliaria/index.ts`:
- Aceitar os campos `tipo_pessoa` e `cpf` no body.
- Incluir esses campos no INSERT da tabela `imobiliarias`.

---

## 2. Pagina Index - trocar logo

### Alteracao em `src/pages/Index.tsx`:
- Substituir `import logoIcon from '@/assets/logo-icon.png'` por `import logo from '@/assets/logo-full.png'` (mesma logo usada no Sidebar).
- Atualizar o `<img>` para usar `logo` em vez de `logoIcon`.

---

## 3. Validacao na etapa 1 do formulario de atividade

### Alteracao em `src/components/atividades/AtividadeForm.tsx`:
- Na funcao `handleNextStep` (linha 180), alem de verificar `tipo` e `categoria`, tambem verificar se o `subtipo` foi preenchido quando o tipo exige (`TIPOS_COM_SUBTIPO`).
- Adicionar feedback visual: destacar campos obrigatorios nao preenchidos com borda vermelha ou mensagem.

