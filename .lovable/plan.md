
# Pagina de Teste - Redesign Visual (Estilo Referencia)

## Objetivo

Criar uma pagina isolada `/design-test` que replica o Dashboard Executivo com o novo estilo visual da imagem de referencia. Isso permite ajustar cores, sombras, tipografia e espacamento **sem afetar nenhuma outra pagina do sistema**. Quando o resultado estiver aprovado, aplicamos as mudancas globalmente.

## Abordagem

A pagina de teste tera seus proprios componentes e estilos **inline/isolados**, sem modificar `index.css`, `card.tsx` ou `chartColors.ts`. Assim o sistema atual continua intacto enquanto iteramos no novo visual.

## Arquivos a Criar

### 1. `src/pages/DesignTest.tsx`
Pagina principal com o layout completo do dashboard no novo estilo:
- Fundo cinza frio (`#F5F6FA`) aplicado via `style` inline
- KPIs com tipografia grande (3xl bold), icones em circulos pasteis coloridos
- Graficos com cores dessaturadas e sem grid lines
- Cards brancos sem borda, apenas com `box-shadow` suave
- Espacamento generoso (`gap-6`)

### 2. `src/components/design-test/TestKPICard.tsx`
Card de KPI no novo estilo visual:
- Valor em `text-3xl font-bold`
- Icone dentro de circulo pastel (48x48, `rounded-full`)
- Cada KPI com cor propria (peach, verde-agua, lavanda, azul claro)
- Badge pill para variacao (verde positivo / vermelho negativo)
- Sombra suave (`shadow-sm`) sem borda
- Border-radius 16px

### 3. `src/components/design-test/TestTrendChart.tsx`
Grafico de tendencia no novo estilo:
- Sem `CartesianGrid` (fundo limpo)
- Area chart com gradiente suave (opacidade 0.08)
- Linha fina com cor pastel
- Eixos discretos (cor `#CBD5E1`, sem `axisLine`)
- Card sem borda, com sombra

### 4. `src/components/design-test/TestDonutChart.tsx`
Donut chart no novo estilo:
- Paleta pastel
- Legenda vertical ao lado do grafico (layout horizontal flex)
- Valor total centralizado dentro do donut
- Card sem borda

### 5. `src/components/design-test/TestFunnelMini.tsx`
Funil minimalista:
- Barras com cores pastel
- Border-radius maior nas barras (rounded-full)
- Mais espacamento vertical

### 6. Rota no `App.tsx`
Adicionar rota publica `/design-test` (sem ProtectedRoute, para facil acesso durante desenvolvimento).

## Nova Paleta Pastel (isolada nos componentes de teste)

```text
Cor           Hex        Uso
Peach         #F4A261    KPI financeiro, serie principal
Rosa pastel   #E8A0BF    Marketing, serie secundaria
Azul claro    #7EC8E3    Conversao, forecast
Verde agua    #81C784    Vendas, sucesso
Lavanda       #B39DDB    Comissoes, CRM
Amarelo suave #FFD54F    Alertas, warnings
Azul pastel   #64B5F6    Info, neutro
Cinza suave   #B0BEC5    Backgrounds, inativos
```

## Estilos dos Cards de Teste

```text
Propriedade        Valor
Background         #FFFFFF
Border             nenhuma
Box-shadow         0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)
Border-radius      16px (1rem)
Padding            24px
```

## Estilos do Fundo

```text
Propriedade        Valor
Background page    #F5F6FA (cinza frio neutro)
```

## Dados Mock

A pagina usara dados mock estaticos para nao depender de autenticacao ou banco de dados, permitindo visualizacao imediata:
- 8 KPIs com valores ficticios
- Grafico de tendencia com 6 meses de dados
- Donut com 4 fatias
- Funil com 5 etapas
- Lista de alertas com 3 itens

## Resultado Esperado

Uma pagina acessivel em `/design-test` que mostra exatamente como o dashboard ficara com o novo estilo da referencia. A partir dela, podemos:
1. Ajustar cores, sombras e espacamentos iterativamente
2. Quando aprovado, aplicar as mudancas em `index.css`, `card.tsx`, `chartColors.ts` e nos componentes reais

## Secao Tecnica

| Arquivo | Operacao |
|---|---|
| `src/pages/DesignTest.tsx` | Criar |
| `src/components/design-test/TestKPICard.tsx` | Criar |
| `src/components/design-test/TestTrendChart.tsx` | Criar |
| `src/components/design-test/TestDonutChart.tsx` | Criar |
| `src/components/design-test/TestFunnelMini.tsx` | Criar |
| `src/App.tsx` | Adicionar rota `/design-test` |

Nenhum arquivo existente sera modificado alem do `App.tsx` (apenas 1 linha de rota adicionada). Todo o resto do sistema permanece inalterado.
