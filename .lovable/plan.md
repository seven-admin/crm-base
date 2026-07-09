## Objetivo
Substituir o conteúdo de `src/index.css` pelo CSS fornecido, adotando o novo tom de azul primário `#198EF4` como base do sistema.

## Análise da mudança
Diff em relação ao CSS atual é mínimo — apenas os tokens de azul primário mudam:

| Token | Antes | Depois |
|---|---|---|
| `--primary` (light) | `210 83% 39%` (#1160b7) | `208 91% 53%` (#198EF4) |
| `--primary-soft` | `206 71% 82%` | `208 71% 82%` |
| `--primary-soft-foreground` | `217 100% 16%` | `208 100% 16%` |
| `--info` | `210 83% 39%` | `208 91% 53%` |
| `--ring` | `210 83% 39%` | `208 91% 53%` |
| `--sidebar-primary` / `--sidebar-accent` / `--sidebar-ring` | tons `210/206` | tons `208` |
| `--chart-1` | `210 83% 39%` | `208 91% 53%` |
| `--nav-*` (todos) | `210 83% 39%` | `208 91% 53%` |
| `--gradient-primary` | `210 83% 39% → 217 100% 16%` | `208 91% 53% → 208 100% 16%` |
| `.dark --primary` | `210 83% 55%` | `208 91% 53%` (mesmo do light) |
| `.dark --ring`, `.dark --sidebar-*` | idem | idem |

Toda a estrutura de camadas (`@layer base/components/utilities`), classes utilitárias, animações e tokens de tabela/status/sombra permanecem idênticos.

## Passos
1. Sobrescrever `src/index.css` com o novo conteúdo fornecido.

Sem impacto em componentes: nenhum arquivo TSX faz referência hard-coded aos hex antigos — todos consomem via tokens semânticos (`bg-primary`, `text-primary`, etc.).

## Verificação
- Conferir visualmente `/nexa/agenda`, `/empreendimentos` e topbar/mega-menu para validar o novo azul primário nos estados de foco, botões, sidebar ativa e gráficos.
- Alternar tema claro/escuro pelo menu Sistema.
