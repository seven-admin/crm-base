

# Aplicar opacidade (alfa) na logo em todos os locais

## O que sera feito

Adicionar classe `opacity-90` em todas as imagens da logo que ainda nao possuem, para manter um visual consistente e suave em todo o sistema.

## Arquivos a editar

1. **`src/components/portal-incorporador/PortalIncorporadorLayout.tsx`** - Adicionar `opacity-90` na tag `<img>` da logo (linha 50)

2. **`src/pages/AssinarContrato.tsx`** - Adicionar `opacity-90` na tag `<img>` da logo (linha 157)

3. **`src/pages/PoliticaPrivacidade.tsx`** - Adicionar `opacity-90` na tag `<img>` da logo (linha 60)

4. **`src/pages/TermosUso.tsx`** - Adicionar `opacity-90` na tag `<img>` da logo (linha 60)

Os demais locais (Sidebar desktop/mobile e Portal do Corretor) ja possuem `opacity-90`.

