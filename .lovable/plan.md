# Refatoração Visual — Fase 1: Fundação + Layout Global

Objetivo desta rodada: elevar o CRM interno ao padrão visual do `/design-test` sem tocar em regras de negócio. Nenhuma página perde funcionalidade — o que muda é o "chassi" (tokens, layout, primitivos). Páginas herdam o novo visual automaticamente por usarem `<MainLayout>`, `<Card>`, `<Button>`, `<Badge>` e `<Input>` do shadcn.

Portal do Corretor e Portal do Incorporador **não** entram nesta fase.

---

## 1. Design tokens (index.css + tailwind.config.ts)

Reescrever a paleta semântica para refletir o design-test:

- `--background`: cinza-claro suave da tela (`#e1e1e1` → HSL)
- `--card` / `--popover`: `#FFFFFF`
- `--foreground`: `#1E293B` (slate-800)
- `--muted-foreground`: `#94A3B8` (slate-400) para labels/subtítulos
- `--primary`: laranja da marca `#f47f19` (com `--primary-foreground` branco) — substitui o azul atual
- `--primary-soft`: `#fce0c7` para bg de avatar/badges
- `--secondary`: `#F1F5F9` (slate-100), `--secondary-foreground`: `#475569`
- `--border`: `#E2E8F0`, `--input-bg`: `#FAFBFC`
- `--ring`: laranja primário
- `--radius`: `1rem` (16px, rounded-2xl como padrão)
- Sombras: `--shadow-card: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)`
- Status tokens (`--status-*`) alinhados às cores dos badges do design-test (success, warning, danger, info, neutral, purple, orange)
- Modo dark: manter estrutura atual mas ajustar `--primary` para o laranja

Cores dos grupos de menu (Empreendimentos verde, Comercial laranja etc.) migram para tokens `--nav-*` — hoje vêm do hook `useSidebarColors` e continuarão configuráveis.

## 2. Layout global — Topbar substituindo Sidebar

Novo componente `src/components/layout/AppTopbar.tsx` baseado em `DesignTest.tsx`:

- Barra fixa 64px, fundo branco, sombra sutil
- Logo à esquerda
- Links horizontais dos **grupos** de menu (Planejamento, Empreendimentos, Clientes, Comercial, Contratos, Financeiro, Parceiros, Marketing, Eventos, Sistema) com underline colorido no ativo
- Cada grupo abre um **dropdown/mega-menu** com os subitens que hoje existem na sidebar (Cronograma, Configurações, Diário de Bordo, Forecast etc.), respeitando permissões via `usePermissions`
- Campo de busca global (visual apenas nesta fase)
- Ícones: notificações (mantém `NotificacaoBell`), mensagens, configurações
- Avatar do usuário com dropdown (perfil, logout) — reaproveita lógica atual

`MainLayout` refatorado:
- Remove `<Sidebar />` e o `lg:pl-64`
- Renderiza `<AppTopbar />` no topo
- `<PageHeader>` continua abaixo (redesenhado com o padrão do design-test: fundo branco, título tight, subtitle slate-400, ações à direita, back-link sutil)
- Container do conteúdo com `bg-[hsl(var(--background))]` e padding responsivo

Responsividade mobile:
- Topbar colapsa em um botão "menu" que abre um `Sheet` lateral com a mesma árvore agrupada (reaproveita `Collapsible`)
- Busca vira ícone que expande

`Sidebar.tsx` atual é mantido no repositório apenas como fallback e removido do `MainLayout`; será deletado numa fase seguinte após validação.

## 3. Primitivos shadcn realinhados

Ajustar variantes (sem quebrar API) em:

- `Button`: variante `default` = laranja sólido; `secondary` = slate-100/slate-600; `outline` = borda laranja + texto laranja; `ghost` mantém; radius 10px; peso 600
- `Card`: `rounded-2xl`, `shadow-card`, sem borda por padrão (borda opcional via variante)
- `Badge`: novas variantes `success`, `warning`, `danger`, `info`, `neutral`, `purple`, `orange` mapeadas para os pares cor/bg do design-test; variante `outline` com borda de 40% opacidade
- `Input` / `Textarea` / `Select`: altura 40px, radius 10px, bg `#FAFBFC`, borda `--border`, foco com ring laranja
- Checkbox/Radio: accent color laranja
- `KPICard` (`src/components/dashboard/KPICard.tsx`): reescrito no padrão de `TestKPICard` (título uppercase tracking-wider slate-400, valor 3xl slate-800, badge de variação pill, ícone em círculo colorido)

## 4. Tipografia

- Continua DM Sans (já carregado)
- Headings: `tracking-tight` + `font-bold`
- Labels de tabela/KPI: `text-xs uppercase tracking-wider text-muted-foreground`
- Escala consistente aplicada via classes utilitárias em `Typography` helpers (opcional) ou direto nos componentes primitivos

## 5. Verificação

- Rodar `tsgo` para checar tipos
- Playwright headless: capturar screenshots de `/` (dashboard), `/clientes`, `/negociacoes`, `/financeiro`, `/empreendimentos` antes/depois para confirmar herança visual e regressões óbvias
- Testar dropdown de grupos com permissões de usuário padrão vs. super admin
- Testar topbar em viewport 375px

## Detalhes técnicos

- Arquivos criados: `src/components/layout/AppTopbar.tsx`, `src/components/layout/AppTopbarMobile.tsx`
- Arquivos alterados: `src/index.css`, `tailwind.config.ts`, `src/components/layout/MainLayout.tsx`, `src/components/layout/PageHeader.tsx`, `src/components/ui/button.tsx`, `src/components/ui/card.tsx`, `src/components/ui/badge.tsx`, `src/components/ui/input.tsx`, `src/components/ui/textarea.tsx`, `src/components/dashboard/KPICard.tsx`
- Nenhuma alteração de banco, RLS, hooks de dados ou lógica de negócio
- Portais (`PortalLayout`, `PortalIncorporadorLayout`) permanecem intactos

## Fora do escopo (fases futuras)

- Refatoração página a página (dashboards, tabelas, formulários específicos)
- Portal do Corretor / Incorporador
- Remoção definitiva do `Sidebar.tsx` legado
- Ajustes finos de charts (Recharts) para nova paleta
