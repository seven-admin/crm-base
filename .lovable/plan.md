

# Atualizar logo do sistema

## Resumo

Substituir o arquivo `src/assets/logo-full.png` pela nova logo (imagem 02 - "sevengroup" sem tagline). Esse arquivo e usado na Sidebar, no Portal do Corretor e no Portal do Incorporador.

## Mudancas

### 1. Copiar a nova imagem

Copiar `user-uploads://02.png` para `src/assets/logo-full.png`, substituindo o arquivo atual.

### 2. Arquivos impactados (nenhuma alteracao de codigo)

Os seguintes componentes ja importam `src/assets/logo-full.png` e continuarao funcionando automaticamente:

- `src/components/layout/Sidebar.tsx`
- `src/components/portal/PortalLayout.tsx`
- `src/components/portal-incorporador/PortalIncorporadorLayout.tsx`

**Nenhum arquivo de codigo precisa ser editado.** Apenas a substituicao da imagem.

