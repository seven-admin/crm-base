

# Deixar a logo branca (alfa) em todos os locais

## O que sera feito

Substituir a classe `opacity-90` pelo filtro CSS que torna a imagem completamente branca. Sera usado o estilo `brightness(0) invert(1)` via Tailwind (`brightness-0 invert`) em todas as tags `<img>` da logo.

## Arquivos a editar

1. **`src/components/layout/Sidebar.tsx`** - Trocar `opacity-90` por `brightness-0 invert` nas logos (desktop e mobile)
2. **`src/components/portal/PortalLayout.tsx`** - Trocar `opacity-90` por `brightness-0 invert`
3. **`src/components/portal-incorporador/PortalIncorporadorLayout.tsx`** - Trocar `opacity-90` por `brightness-0 invert`
4. **`src/pages/AssinarContrato.tsx`** - Trocar `opacity-90` por `brightness-0 invert`
5. **`src/pages/PoliticaPrivacidade.tsx`** - Trocar `opacity-90` por `brightness-0 invert`
6. **`src/pages/TermosUso.tsx`** - Trocar `opacity-90` por `brightness-0 invert`

## Observacao

Como o sistema usa tema escuro, a logo branca ficara visivel sobre fundos escuros. Em telas com fundo claro (como Termos de Uso e Politica de Privacidade), pode ser necessario ajustar -- se precisar, e so avisar.

