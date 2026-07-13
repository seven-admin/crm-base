# Login textual + Logo multi-tenant no topo

## 1. Tela de Login (`src/pages/Auth.tsx`)
- Remover o `<img>` da logo Seven.
- Substituir por um bloco textual centralizado: **"SVN CRM"** (tipografia display, tracking apertado, mesma cor do texto principal do tema).
- Manter o restante do layout (form centralizado, botão Google, etc.).

## 2. Assets das logos por tenant
Criar pointers Lovable Assets a partir dos uploads:
- `src/assets/logo-arqo.png.asset.json` ← `user-uploads://Logo_Preferencial_•_Arqo_1.png`
- `src/assets/logo-nexa.png.asset.json` ← `user-uploads://Ativo_20-3.png`
- Seven continua usando `logo-sevengroup.png` já existente.

## 3. Seleção da logo no topo (`src/components/layout/AppTopbar.tsx`)
- Importar os 3 assets.
- Usar `useEmpresaAccess()` (já disponível) para ler `empresa` do profile.
- Mapear:
  - `seven` (e default/`externo`/`incorporador`) → logo Seven
  - `arqo` → logo Arqo
  - `nexa` → logo Nexa
- Aplicar nas duas ocorrências (desktop linha 168 e mobile linha 250).
- Ajustar `alt` conforme a empresa e manter `className="h-5"` (ou `h-6` se a proporção da Arqo/Nexa exigir — verificado no render).

## Fora de escopo
- Nenhuma alteração em permissões, rotas, cores ou dados. Apenas troca visual condicionada ao vínculo `profile.empresa` que já existe.
