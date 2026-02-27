
# Melhorias UX na aba Atividades do Diario de Bordo

## O que sera feito

### 1. A aba Kanban ja existe -- apenas corrigir UX
A aba "Atividades" com o Kanban ja esta presente no `DiarioBordo.tsx` (linha 156-159, conteudo na linha 191-193). Nao precisa adicionar no sidebar. O foco e melhorar a UX dessa aba.

### 2. Remover contadores gerais
Remover os 4 cards de metricas (Total, Pendentes, Concluidas, Por Etapa) do `AtividadesMetricsAndBoard` (linhas 282-310). O Kanban ja mostra contagem por coluna.

### 3. Unificar filtro de mes
Remover o navegador de mes duplicado de dentro do `AtividadesMetricsAndBoard` (linhas 262-280). Passar a `competencia` do componente pai como prop, assim o filtro de mes do header controla ambas as abas.

### 4. Reorganizar filtro de temperatura
Manter apenas o `TemperaturaSelector` alinhado a direita em uma barra compacta acima do Kanban.

## Detalhes tecnicos

### `src/pages/DiarioBordo.tsx`

**`AtividadesMetricsAndBoard`**:
- Receber `competencia: Date` como prop (em vez de ter estado proprio)
- Remover estado `competencia` e o navegador de mes interno
- Remover os 4 cards de metricas (grid de cards)
- Remover imports/logica de `countPerEtapa`, `totalAtividades`, `pendentes`, `concluidas`
- Manter apenas: barra com filtro de temperatura + Kanban board

**Chamada no pai**:
- Passar `competencia={competencia}` para `AtividadesMetricsAndBoard`

### Resultado visual da aba Atividades

```text
+--------------------------------------------------+
| Diario de Bordo    [<- Mes ->] [Gestor] [+ Nova]  |
+--------------------------------------------------+
| [Resumo]  [Atividades]                            |
+--------------------------------------------------+
|                          [Filtro Temperatura]      |
| +----------+ +----------+ +----------+            |
| | Coluna 1 | | Coluna 2 | | Coluna 3 |            |
| |  (3)     | |  (5)     | |  (2)     |            |
| +----------+ +----------+ +----------+            |
+--------------------------------------------------+
```

### Arquivo a alterar

| Arquivo | Acao |
|---|---|
| `src/pages/DiarioBordo.tsx` | Refatorar `AtividadesMetricsAndBoard`: receber `competencia` como prop, remover cards de metricas, remover navegador de mes duplicado, manter apenas filtro temperatura + Kanban |
