

# Redesign da Pagina /design-test - Layout Duas Colunas com Top Nav

## Visao Geral

Reescrever completamente a pagina `/design-test` para seguir o layout descrito: duas colunas (62/38), top nav horizontal, card hero grande com grafico de colunas, lista de projetos expandivel, card de metricas com mini bar charts, e card escuro. A pagina atual (grid de KPIs + charts) sera substituida inteiramente.

## Estrutura do Layout

```text
+------------------------------------------------------------------+
|  [Logo]    Nav1  Nav2  Nav3  Nav4  Nav5    [Search] [Icons] [Av]  |  64px
+------------------------------------------------------------------+
|                                                                    |
|  +---------------------------+  +--------------------+             |
|  |  CARD HERO (~58vh)        |  |  LISTA PROJETOS    |             |
|  |  H1 48px + dropdown pill  |  |  (~58vh)           |             |
|  |  Texto suporte 2 linhas   |  |  3 itens com       |             |
|  |  Grafico 7 colunas        |  |  expansao, badges, |             |
|  |  Metrica XL 72px          |  |  chevrons          |             |
|  +---------------------------+  +--------------------+             |
|                                                                    |
|  +-------------+  +-----------+  +--------------------+            |
|  | CARD LISTA  |  | CARD DARK |  |  CARD METRICAS     |            |
|  | (~42vh)     |  | (~42vh)   |  |  (~42vh)           |            |
|  | Avatar+badge|  | Texto     |  |  3 colunas com     |            |
|  | + botao     |  | branco    |  |  mini bar charts   |            |
|  +-------------+  +-----------+  +--------------------+            |
|                                                                    |
+------------------------------------------------------------------+
```

Coluna esquerda: ~62% | Coluna direita: ~38%
Gap entre cards: 16px | Border-radius: 20px | Padding: 24-32px

## Arquivos a Modificar/Criar

### 1. `src/pages/DesignTest.tsx` - Reescrita completa

Layout principal com:
- **Top Nav** (64px): logo circular + texto, 5 links centralizados (item ativo com underline azul), input de busca (~300px), 3 icones (sino, mensagem, config), avatar circular
- **Corpo**: flex row com coluna esquerda (62%) e coluna direita (38%), gap 16px
- **Altura do conteudo**: calc(100vh - 64px - padding)

### 2. `src/components/design-test/TestHeroCard.tsx` - NOVO

Card grande (58% da altura):
- Canto superior: icone pequeno + titulo H1 em 48px bold + dropdown pill a direita ("This week" com chevron)
- 2 linhas de texto descritivo abaixo do titulo
- Area central/direita: grafico com 7 colunas (Seg-Dom), cada com ponto flutuante + linha vertical, tooltip pill sobre o ponto mais alto
- Canto inferior esquerdo: numero gigante em ~72px bold + 2 linhas de texto descritivo
- Background branco, border-radius 20px, shadow suave

### 3. `src/components/design-test/TestProjectList.tsx` - NOVO

Card de lista de projetos (58% da altura, coluna direita):
- Header: titulo "Projects" + link "See all" a direita
- 3 itens separados por divisorias finas
- Cada item: icone quadrado arredondado (48px) a esquerda, titulo + subtitulo, badge de status (pill colorido), chevron a direita
- Primeiro item expandido: mostra tags pill + paragrafo descritivo + metadados (icone + texto) em linha
- Scroll interno se necessario

### 4. `src/components/design-test/TestTeamCard.tsx` - NOVO

Card de lista de equipe (42% da altura, metade esquerda do bloco inferior):
- Header: titulo + link "see all"
- 2 itens com avatar circular (40px), nome + cargo, badge de status, botao circular (icone)
- Separados por divisoria

### 5. `src/components/design-test/TestDarkCard.tsx` - NOVO

Card escuro (42% da altura, metade direita do bloco inferior esquerdo):
- Background escuro (~#1E293B ou similar)
- Texto em branco (titulo + descricao)
- Botao pill claro na base, largura quase total
- Border-radius 20px

### 6. `src/components/design-test/TestMetricsCard.tsx` - NOVO

Card de metricas (42% da altura, coluna direita):
- Header: titulo + seletor de data (dropdown ou pill)
- Corpo dividido em 3 colunas iguais separadas por linhas verticais
- Cada coluna: label pequeno no topo, numero grande bold no centro, mini bar chart na base (8-10 barras verticais finas com alturas variadas, cores pasteis)
- Mini bar charts feitos com divs estilizadas (nao Recharts, para simplicidade)

### 7. Componentes antigos - REMOVER imports

Os componentes `TestKPICard`, `TestTrendChart`, `TestDonutChart`, `TestFunnelMini` nao serao mais importados na pagina (os arquivos podem permanecer para referencia futura, apenas removemos o uso).

## Dados Mock

```text
Top Nav:
- Links: Dashboard, Projects, Inbox, Schedule, Reports
- Ativo: Dashboard

Hero Card:
- Titulo: "Statistics"
- Metrica: "$21,897" ou similar
- Grafico: 7 pontos (Mon-Sun) com valores variados

Projetos:
- 3 projetos com nomes, status badges (Active/Review/Draft), icones coloridos
- Primeiro expandido com tags e descricao

Equipe:
- 2 membros com avatar fallback (iniciais), nome, cargo, badge

Metricas:
- 3 colunas: Revenue ($12.4K), Orders (284), Visitors (14.2K)
- Mini bars com 8-10 valores aleatorios cada
```

## Especificacoes de Estilo

```text
Propriedade              Valor
Background pagina        #F5F6FA
Card background          #FFFFFF
Card dark background     #1E293B
Border-radius            20px
Box-shadow               0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)
Gap entre cards          16px
Padding cards            24-32px
Top nav height           64px
H1 hero                  48px, font-weight 700, color #1E293B
Metrica XL               72px, font-weight 700
Labels                   12px, uppercase, tracking-wider, color #94A3B8
Badge pill               px-3 py-1, rounded-full, font-size 12px
Divisorias               1px solid #F1F5F9
```

## Secao Tecnica

| Arquivo | Operacao |
|---|---|
| `src/pages/DesignTest.tsx` | Reescrever completamente |
| `src/components/design-test/TestHeroCard.tsx` | Criar |
| `src/components/design-test/TestProjectList.tsx` | Criar |
| `src/components/design-test/TestTeamCard.tsx` | Criar |
| `src/components/design-test/TestDarkCard.tsx` | Criar |
| `src/components/design-test/TestMetricsCard.tsx` | Criar |

Os componentes antigos (`TestKPICard.tsx`, `TestTrendChart.tsx`, `TestDonutChart.tsx`, `TestFunnelMini.tsx`) permanecem no repositorio mas nao serao mais usados pela pagina. Nenhum outro arquivo do sistema sera alterado.

