
# Refinamento da paleta e ajuste de contraste

## Objetivo
Reorganizar a paleta atual (azul-acinzentada) para a nova paleta enviada, com hierarquia mais suave — especialmente nas linhas alternadas de tabela, que hoje ficam com contraste alto demais.

## Análise da paleta enviada
Agrupei os 20 hex em 4 papéis:

**Superfícies escuras (modo dark / topbar / sidebar)**
- `#15202b`, `#141d26` — background base
- `#192734`, `#243447` — superfícies (card, popover)
- `#22303c` — bordas/divisores dark

**Superfícies claras (modo light — padrão do app)**
- `#ffffff` — card / popover / input
- `#f8f8fa` — background base
- `#e5e6eb`, `#dfe2e8`, `#d2d4dc` — divisores, hover, zebra de tabela
- `#c0c2ce` — borda forte

**Texto e neutros**
- `#141d26` — foreground primário
- `#243447` — foreground secundário
- `#8899ac` — muted foreground
- `#afafaf` — placeholder / disabled

**Marca e status**
- `#1160b7` — primary (azul institucional)
- `#002050` — primary-dark / hover
- `#b1d6f0` — primary-soft (badges, chips)
- `#d24726` — destructive / warning quente
- `#c51f5d` — accent secundário (destaques pontuais, ex.: alertas críticos)

## O que muda

### 1. Tokens em `src/index.css` (`:root` e `.dark`)
Reescrever os HSL para refletir a nova paleta. Principais mudanças no modo claro:
- `--background`: `#f8f8fa` (era cinza-azulado forte `#c0c5ce`)
- `--card` / `--popover` / `--input-bg`: `#ffffff`
- `--foreground`: `#141d26`
- `--muted-foreground`: `#8899ac`
- `--border`: `#e5e6eb` (mais suave)
- `--primary`: `#1160b7` com `--primary-foreground` branco
- `--primary-soft`: `#b1d6f0`
- `--ring`: `#1160b7` (substitui o laranja como foco padrão)
- `--destructive`: `#d24726`
- `--accent`: `#c51f5d` (uso restrito a destaques)

No `.dark` usar `#15202b` background, `#192734` card, `#243447` accent surface, `#22303c` border, `#8899ac` muted-foreground.

### 2. Redução do contraste das tabelas
Hoje o zebra usa `--muted` (bem escuro). Vou introduzir tokens dedicados e aplicar nos componentes de tabela:
- `--table-row`: `#ffffff`
- `--table-row-alt`: `#f8f8fa` (delta ~2% de luminância, quase imperceptível — como Linear/Notion)
- `--table-row-hover`: `#eef1f5`
- `--table-border`: `#eceef2` (mais leve que o `--border` global)
- `--table-header`: `#f4f5f8` com texto `--muted-foreground`

Aplicar em `src/components/ui/table.tsx` (classes de `TableRow` para zebra e hover) e em qualquer wrapper de DataTable que hoje force `bg-muted` na linha alternada.

### 3. Sidebar / topbar
- Sidebar continua clara por padrão, mas com `--sidebar-background: #ffffff` e borda `#e5e6eb`.
- Item ativo: fundo `#b1d6f0` com texto `#002050` (em vez do cinza escuro atual).
- Nav group colors (`--nav-*`): todos apontam para `#1160b7` para manter identidade única, exceto `--nav-financeiro` e `--nav-marketing` se você quiser diferenciar (posso manter tudo azul — mais sóbrio).

### 4. Gradiente de fundo do `body`
Hoje é `#ffffff → #e1e1e1`. Trocar para `#ffffff → #f8f8fa` (praticamente flat, sem "sujeira" visual).

## Arquivos afetados
- `src/index.css` — tokens `:root`, `.dark`, body background
- `src/components/ui/table.tsx` — classes de zebra/hover
- `tailwind.config.ts` — expor `table-row`, `table-row-alt`, `table-row-hover`, `table-border`, `table-header` como cores utilitárias
- Varredura rápida por `bg-muted/50`, `bg-muted` e `divide-` em componentes de tabela (Financeiro, Clientes, Corretores, Unidades) para trocar por os novos tokens quando forem responsáveis pelo contraste alto

## Validação
1. Playwright em `/empreendimentos`, `/clientes`, `/financeiro` — screenshots antes/depois
2. Verificar contraste WCAG AA de texto sobre `--table-row-alt` (`#141d26` sobre `#f8f8fa` = ~16:1, OK)
3. Confirmar que estados hover, seleção e foco continuam distinguíveis

## Fora do escopo
- Não vou mexer em lógica de negócio, hooks ou queries
- Não vou introduzir modo dark automático (só ajustar os tokens do `.dark` para estarem prontos quando ativado)
- Ajustes finos por página (ex.: cores específicas de Kanban) ficam para depois que a base for aprovada
