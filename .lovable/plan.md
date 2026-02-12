

# Atualizar Logos do Sistema

## O que sera feito

Substituir a logo atual por duas novas versoes:
- **Logo completa** (Ativo_2@4x.png) — usada na sidebar, header do portal corretor e header do portal incorporador
- **Icone "N"** (Ativo_7@4x.png) — marca d'agua centralizada na pagina inicial

## Mudancas

### 1. Copiar os assets para o projeto

- `user-uploads://Ativo_2@4x.png` -> `src/assets/logo-full.png`
- `user-uploads://Ativo_7@4x.png` -> `src/assets/logo-icon.png`

### 2. Atualizar `src/components/layout/Sidebar.tsx`

- Trocar `import logo from '@/assets/logo.png'` para `import logo from '@/assets/logo-full.png'`
- Remover o filtro CSS `brightness-0 invert` (a nova logo ja vem em branco para fundo escuro)

### 3. Atualizar `src/components/portal/PortalLayout.tsx`

- Mesmo ajuste: trocar import e remover filtro `brightness-0 invert`

### 4. Atualizar `src/components/portal-incorporador/PortalIncorporadorLayout.tsx`

- Mesmo ajuste: trocar import e remover filtro `brightness-0 invert`

### 5. Atualizar `src/pages/Index.tsx`

- Importar `logo-icon.png` no lugar de `logo.png`
- Aumentar o tamanho da imagem para `h-48` (marca d'agua maior)
- Manter opacidade baixa (`opacity-10`) para efeito de watermark

### Arquivos alterados: 4

- `src/components/layout/Sidebar.tsx`
- `src/components/portal/PortalLayout.tsx`
- `src/components/portal-incorporador/PortalIncorporadorLayout.tsx`
- `src/pages/Index.tsx`

