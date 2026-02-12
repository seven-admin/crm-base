

# Rebranding - Paleta Laranja Seven Group

## Paleta Identificada na Imagem

| Cor | Hex Aproximado | Uso Proposto |
|-----|---------------|--------------|
| Preto | #0A0A0A | Sidebar, textos fortes |
| Off-white | #F5F3F0 | Background principal |
| Laranja | #F5941E | Cor primaria (botoes, links, destaques) |
| Cinza quente | #A09A8E | Textos secundarios, bordas |
| Branco | #FFFFFF | Cards, popovers |

## Mudancas Planejadas

### 1. Variaves CSS (`src/index.css`)

**Modo claro:**
- `--primary`: de azul (207 55% 51%) para laranja (~30 91% 54%)
- `--background`: de cinza frio (0 0% 98%) para off-white quente (~30 14% 96%)
- `--muted` e `--border`: ajustar para tons de cinza quente em vez de cinza neutro
- `--ring`: acompanhar a primaria (laranja)
- `--sidebar-background`: manter escuro, ajustar para preto puro (~0 0% 5%)

**Modo escuro:**
- `--primary`: laranja com luminosidade levemente aumentada para contraste
- Neutros ajustados para manter consistencia com cinza quente

### 2. Cores de graficos (`src/lib/chartColors.ts`)

- Substituir o azul principal por laranja nos arrays de cores
- Manter as demais cores complementares que ja funcionam bem com laranja (ciano, verde, roxo)
- Atualizar `CORES_SIDEBAR.dashboard` e outros que usavam azul como destaque

### 3. Tailwind Config (`tailwind.config.ts`)

- Nenhuma alteracao estrutural necessaria -- as cores ja sao consumidas via variaveis CSS

### 4. Componentes Pontuais

- `CORES_SIDEBAR` em `chartColors.ts`: trocar referencias de azul para laranja onde fizer sentido
- Verificar se ha cores azuis hardcoded em componentes (ex: `text-blue-500`, `bg-blue-600`) e substituir por `text-primary` / `bg-primary`

## O que NAO muda

- Cores semanticas (success verde, destructive vermelho, warning amarelo) permanecem inalteradas
- Estrutura de variaveis CSS, Tailwind e componentes UI continuam identicos
- Modo escuro continua funcionando, apenas com os tons ajustados

## Secao Tecnica

### Valores HSL propostos (modo claro)

```text
--primary:            30 91% 54%    (laranja #F5941E)
--primary-foreground: 0 0% 100%    (branco)
--background:         30 14% 96%   (off-white quente)
--foreground:         0 0% 4%      (preto)
--card:               0 0% 100%    (branco)
--muted:              30 8% 91%    (cinza quente claro)
--muted-foreground:   30 5% 40%   (cinza quente)
--border:             30 8% 88%    (cinza quente borda)
--input:              30 8% 88%
--ring:               30 91% 54%   (laranja)
--sidebar-background: 0 0% 5%     (preto)
```

### Valores HSL propostos (modo escuro)

```text
--primary:            30 91% 60%   (laranja mais claro)
--ring:               30 91% 60%
--background:         0 0% 7%
--muted:              30 5% 15%
--muted-foreground:   30 5% 60%
--border:             30 5% 18%
```

### chartColors.ts - Ajustes

```text
CORES_DASHBOARD.principal: '#F5941E' (laranja ao inves de azul)
CORES_SIDEBAR: trocar entradas que usam azul para laranja
CORES_ARRAY[0]: laranja como primeira cor de serie
```

### Busca por cores hardcoded

Sera feita uma busca por classes como `text-blue-*`, `bg-blue-*`, `border-blue-*` e hex codes azuis hardcoded para garantir consistencia completa.

