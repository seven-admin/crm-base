
# Corrigir label do campo Nome no cadastro de Imobiliaria

## Problema
Quando o usuario seleciona "Pessoa Fisica", o label do campo muda para "Nome Fantasia", o que nao faz sentido. Deve exibir apenas "Nome" para ambos os tipos.

## Alteracao

### Arquivo: `src/components/auth/ImobiliariaRegisterForm.tsx`

**Linha 235** - Substituir o ternario do label:
- De: `{formData.tipo_pessoa === 'juridica' ? 'Nome da Imobiliária' : 'Nome Fantasia'} *`
- Para: `Nome *`

**Linha 241** - Substituir o ternario do placeholder:
- De: `placeholder={formData.tipo_pessoa === 'juridica' ? 'Nome da imobiliária' : 'Nome fantasia'}`
- Para: `placeholder="Nome"`

Apenas essas duas linhas precisam ser alteradas. O formulario interno (`ImobiliariaForm.tsx`) ja usa "Nome" corretamente para ambos os tipos.
