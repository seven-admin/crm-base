

# Remover Dashboard do Sidebar e Criar Home Simples

## O que sera feito

1. **Remover o grupo "Dashboard" do sidebar** -- o bloco com o item "Executivo" (linhas 64-72 de `Sidebar.tsx`) sera removido do array `menuGroups`. A rota `/dashboard-executivo` continuara existindo e acessivel via URL direta, apenas nao aparecera mais no menu.

2. **Transformar a pagina Index em uma home simples com logo centralizada** -- o arquivo `src/pages/Index.tsx` sera reescrito para exibir apenas a logo do sistema centralizada na tela, sem redirecionamento automatico. A pagina usara o `MainLayout` para manter o sidebar visivel.

3. **Ajustar a rota "/" no App.tsx** -- remover o `moduleName="dashboard"` do `ProtectedRoute` da rota raiz para que qualquer usuario autenticado possa acessar a home.

## Detalhes tecnicos

**Sidebar.tsx (linha 64-72):** Remover o objeto do grupo Dashboard do array `menuGroups`. O import `LayoutDashboard` pode ser removido se nao for usado em outro lugar.

**Index.tsx:** Substituir a logica de `Navigate` por um componente simples:
```typescript
import logo from '@/assets/logo.png';
// Renderiza apenas a logo centralizada dentro do layout
```

**App.tsx (linha 111-113):** Alterar o `ProtectedRoute` da rota "/" para nao exigir modulo especifico, e renderizar Index dentro do MainLayout.
