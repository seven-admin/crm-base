## Toggle de Tema Claro/Escuro + Labels do Menu em Maiúsculas

### 1. Toggle de Tema

Adicionar alternância de tema no menu **Sistema** da topbar.

- **`src/hooks/useTheme.ts` (novo)**
  - Hook que gerencia o estado `light` / `dark`.
  - Persiste em `localStorage` (`theme`).
  - Aplica/remove a classe `dark` no `<html>`.
  - Detecta preferência do SO (`prefers-color-scheme`) como fallback inicial.

- **`src/components/ThemeProvider.tsx` (novo)**
  - Provider simples que inicializa o tema o mais cedo possível para evitar flash.

- **`src/main.tsx`**
  - Envolver o `<App />` com o `ThemeProvider`.

- **`src/components/layout/AppTopbar.tsx`**
  - Dentro do dropdown **Sistema**, adicionar um item "Modo escuro / Modo claro" com ícone `Sun`/`Moon` (lucide-react) que dispara o toggle.

- **Revisão do `src/index.css`**
  - Conferir se os tokens `.dark` cobrem: fundo, tabelas (`--table-row`, `--table-row-alt`), bordas e a topbar. Ajustar apenas o necessário para o contraste ficar coerente com o tema claro atual.

### 2. Labels do Menu em Maiúsculas

No estado inicial do `AppTopbar`, os rótulos dos grupos principais devem aparecer em maiúsculas:

- **SEVEN**
- **ARQO**
- **NEXA**
- **SISTEMA**

Aplicar via `text-transform: uppercase` nos botões/triggers de navegação principais, sem alterar os textos literais dos submenus (categorias e itens permanecem em formato normal/title case).

### Escopo

Somente UI e tokens de tema. Nenhuma mudança em backend, rotas ou lógica de negócio.
