# Plano — Novo padrão visual global

Aplicar o estilo das referências (dashboard limpo, formulários com labels acima, tabelas divididas com badges, gráficos suaves) em todo o sistema, mantendo `#198EF4` como primário e adicionando laranja `#F5941E` como accent.

## 1. Tokens globais (`src/index.css`)

Novos/ajustados tokens HSL:
- `--primary: 210 90% 53%` (#198EF4) — mantém
- `--accent: 28 91% 54%` (#F5941E) — passa a ser usado ativamente
- `--background: 240 14% 98%` — mantém
- `--card: 0 0% 100%` com `--radius: 1rem` (cantos 16px, estilo das refs)
- `--border: 220 13% 91%` — mais suave
- `--muted-foreground: 215 16% 55%` — labels acinzentados como nas refs
- Novo bloco de **status badges** (soft): `--status-pending`, `--status-progress`, `--status-done`, `--status-fixed` em pares bg/fg pastel
- Novo `--surface-dark: 217 33% 17%` para cards escuros tipo "Status Summary"
- Sombras: `--shadow-card: 0 1px 3px rgb(0 0 0 / 0.04), 0 1px 2px rgb(0 0 0 / 0.03)` (bem sutil)

## 2. Tipografia

- Instalar `@fontsource/inter` (weights 400/500/600/700) via `bun add`, importar em `main.tsx`
- `fontFamily.sans` no Tailwind → Inter, feature-settings `"cv11","ss01"`
- Escala: títulos `text-2xl font-bold tracking-tight`, KPIs `text-4xl font-bold`, labels `text-xs uppercase tracking-wider text-muted-foreground`

## 3. Componentes shadcn ajustados

**Card** (`src/components/ui/card.tsx`)
- `rounded-2xl border-border/60 shadow-[var(--shadow-card)] bg-card`
- Variante `card-dark` (fundo `--surface-dark`, texto claro) para painéis de destaque tipo "Status Summary"

**Button** (`src/components/ui/button.tsx`)
- `default` → azul primário sólido, `rounded-lg`, `h-10`, hover -8% brightness
- Nova variante `accent` → laranja `#F5941E` (para CTAs principais tipo Submit das refs)
- `secondary` → cinza neutro `bg-muted text-muted-foreground`
- `outline` refinado (borda mais fina, hover bg-muted/50)

**Input** (`src/components/ui/input.tsx`)
- `h-11 rounded-lg border-border/70 bg-card`
- Placeholder `text-muted-foreground/60`
- Focus ring azul primário fino (2px, offset-0)
- Label padrão acima com `text-sm font-medium mb-1.5`

**Table** (`src/components/ui/table.tsx`)
- Header: sem fundo, `text-muted-foreground text-xs font-medium uppercase tracking-wide`, `border-b`
- Linhas: `border-b border-border/50` (linhas divididas, sem zebra pesada — estilo Basic Table da ref)
- Nova classe utilitária `.table-striped` (opcional) com `bg-muted/30` em linhas ímpares
- Hover: `hover:bg-muted/40`
- Padding `py-4` (respiração generosa das refs)

**Badge** (`src/components/ui/badge.tsx`)
- Novas variantes soft: `pending` (laranja/coral pastel), `progress` (amarelo pastel), `done` (verde-água pastel), `fixed` (rosa pastel), `info` (azul pastel)
- `rounded-md px-2.5 py-1 text-xs font-medium`

## 4. Gráficos (Recharts)

Novo `src/lib/chartColors.ts` (atualizar):
- Paleta pastel suave: `#FBCFE8` (pink), `#BFDBFE` (blue), `#FDE68A` (yellow), `#A7F3D0` (teal), `#DDD6FE` (purple), `#FED7AA` (orange)
- Grid `stroke-border/40`, eixo `text-muted-foreground text-xs`
- Line/Area com `strokeWidth={2}`, pontos com ring branco (estilo Performance Line Chart da ref)
- Doughnut com `innerRadius=60%`, sem stroke

## 5. Cards de KPI

Atualizar `src/components/dashboard/KPICard.tsx` no padrão da ref:
- Label pequeno em cima (`text-xs uppercase text-muted-foreground`)
- Valor grande (`text-3xl font-bold`)
- Delta abaixo com seta ↑/↓ verde/vermelho e `text-xs`
- Sem borda, apenas card com sombra sutil OU inline sem card (variante `inline`) — como a linha superior da imagem 1

## 6. Layout de página (`PageHeader`)

Ajustar `src/components/layout/PageHeader.tsx`:
- Título grande + subtítulo em cinza (estilo "Good Morning, John Doe / Your performance summary")
- Ações à direita alinhadas (Share/Print/Export → Outline/Outline/Accent)
- Sem fundo colorido, apenas padding generoso

## 7. Detalhes técnicos

- Não alterar lógica de negócio, apenas presentation
- Verificar que dark mode continua funcionando (todos tokens em HSL)
- Rodar typecheck após alterações

## Fora do escopo

- Refatorar páginas específicas para o novo layout (fica para próxima iteração — os componentes já entregam 80% do visual automaticamente)
- Substituir bibliotecas de gráfico
- Mudanças em edge functions / DB
