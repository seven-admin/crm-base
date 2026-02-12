

# Ajuste de Cores do Sidebar e Cards de Empreendimento

## Resumo

Restaurar o tom anterior do sidebar (cinza escuro azulado ao inves de preto puro) e harmonizar as cores dos itens/subitens com a nova paleta laranja. Alem disso, ajustar o topo dos cards de empreendimento para usar o mesmo tom do sidebar.

## Mudancas

### 1. Variaves CSS do Sidebar (`src/index.css`)

Restaurar o sidebar-background para o tom anterior (slate escuro) e ajustar os tons internos:

| Variavel | Atual (preto puro) | Novo (slate escuro) |
|----------|-------------------|---------------------|
| `--sidebar-background` | `0 0% 5%` | `220 16% 12%` |
| `--sidebar-accent` | `0 0% 14%` | `220 14% 18%` |
| `--sidebar-border` | `0 0% 16%` | `220 12% 20%` |

Isso vale tanto para o modo claro quanto para o modo escuro.

### 2. Estilo dos itens ativos no Sidebar (`src/index.css`)

Atualizar o `.sidebar-nav-item-active` para usar um destaque laranja sutil ao inves do cinza neutro:

- Background: laranja com 15% de opacidade (`hsl(30 91% 54% / 0.15)`)
- Texto: laranja claro para o item ativo
- Borda esquerda laranja de 2px para reforcar a indicacao visual

### 3. Estilo dos subitens do Sidebar

Adicionar classe `.sidebar-nav-item-inactive` com cor de texto mais clara (cinza claro com tom quente) para harmonizar com o laranja:

- Cor padrao: `hsl(30 10% 65%)` (cinza quente)
- Hover: texto branco

### 4. Cards de Empreendimento (`src/components/empreendimentos/EmpreendimentoCard.tsx`)

Trocar o gradiente do topo do card de `from-slate-950 via-slate-900 to-slate-950` para usar a mesma cor do sidebar via variavel CSS:

- Background: `hsl(220 16% 12%)` -- mesmo tom do sidebar
- Overlay de imagem: ajustar os rgba para combinar com o novo tom

### 5. Cores dos icones dos grupos no Sidebar (`src/components/layout/Sidebar.tsx`)

Revisar as cores dos grupos para harmonizar melhor com o fundo slate + laranja:

| Grupo | Cor Atual | Cor Proposta |
|-------|-----------|-------------|
| Planejamento | `#10B981` (verde) | `#10B981` (manter) |
| Empreendimentos | `#059669` (verde escuro) | `#10B981` (verde padrao) |
| Clientes | `#8B5CF6` (roxo) | `#8B5CF6` (manter) |
| Forecast | `#06B6D4` (ciano) | `#06B6D4` (manter) |
| Comercial | `#F97316` (laranja) | `#F5941E` (laranja primario) |
| Contratos | `#3B82F6` (azul) | `#60A5FA` (azul mais claro para contraste no fundo escuro) |
| Financeiro | `#F59E0B` (amarelo) | `#F59E0B` (manter) |
| Parceiros | `#EC4899` (rosa) | `#EC4899` (manter) |
| Marketing | `#EC4899` (rosa) | `#EC4899` (manter) |
| Eventos | `#06B6D4` (ciano) | `#06B6D4` (manter) |
| Sistema | `#6B7280` (cinza) | `#94A3B8` (cinza mais claro para melhor visibilidade) |

## O que NAO muda

- Cores semanticas (sucesso, erro, aviso)
- Cor primaria (laranja)
- Background geral da aplicacao (off-white quente)
- Estrutura dos componentes

## Secao Tecnica

### Arquivos alterados

1. `src/index.css` -- variaveis do sidebar + estilos de itens ativos/inativos
2. `src/components/empreendimentos/EmpreendimentoCard.tsx` -- gradiente do topo do card
3. `src/components/layout/Sidebar.tsx` -- cores dos icones dos grupos

