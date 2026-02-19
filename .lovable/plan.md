

# Atualizar logo e reduzir tamanhos de texto no card principal

## Mudancas

### 1. Nova logomarca
- Copiar o arquivo enviado (`user-uploads://Ativo_5@4x-2.png`) para `src/assets/logo-sevengroup.png`
- Em `src/pages/DesignTest.tsx`, alterar o import da logo para usar o novo arquivo
- Remover o filtro `brightness(0)` pois a logo ja tem as cores corretas (preto + laranja)

### 2. Reducao de texto no TestHeroCard

**Arquivo**: `src/components/design-test/TestHeroCard.tsx`

- Titulo "Painel Executivo": `fontSize: 48` para `fontSize: 24` (reducao de 50%)
- Valor "R$ 2.847.500": `fontSize: 54` para `fontSize: 40` (reducao de ~25%)

