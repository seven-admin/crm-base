
# Reestilização Google Calendar — Bordas flat + barras multi-dia contínuas

## Problema
1. Células têm `rounded-lg border` — Google Calendar usa bordas retas/finas sem arredondamento
2. Eventos multi-dia são renderizados como chips individuais por célula em vez de barras contínuas que cruzam as células (como na imagem de referência)

## Plano

### 1. Remover bordas arredondadas e ajustar grid
- Trocar `grid gap-1` por `gap-0` com bordas compartilhadas (border-right/border-bottom)
- Remover `rounded-lg` das células
- Número do dia: alinhar top-left (como Google Calendar), não centralizado
- Seleção: highlight sutil no fundo, sem ring

### 2. Barras multi-dia contínuas (cross-cell)
Renderizar por **semana** (row) em vez de por célula individual:
- Agrupar dias em semanas (arrays de 7 dias)
- Para cada semana, calcular quais itens multi-dia a cruzam
- Renderizar cada item multi-dia como um `<div>` com posição absoluta dentro do container da semana, usando `left` e `width` em percentuais baseados no dia de início e fim dentro daquela semana (colStart/colSpan de 7 colunas)
- Estilo: fundo sólido colorido, texto branco, sem borda-esquerda — como a barra azul "CURSO GILSON" na imagem
- Reservar espaço fixo no topo de cada semana para as barras multi-dia (ex: 20px por slot)

### 3. Eventos single-day
- Mantêm o estilo atual: bullet colorido + texto
- Renderizados inline dentro da célula, abaixo da zona reservada para barras multi-dia

### 4. Estrutura HTML por semana

```text
<div class="relative"> ← container da semana (position: relative)
  <!-- Barras multi-dia absolutas -->
  <div style="position:absolute; top:28px; left:14.28%; width:42.85%"> CURSO GILSON </div>
  
  <!-- Grid 7 colunas com as células dos dias -->
  <div class="grid grid-cols-7">
    <div> 25 <br/> • evento </div>
    <div> 26 </div>
    ...
  </div>
</div>
```

### 5. Algoritmo de slot para barras multi-dia
- Para cada semana, atribuir um "slot" (linha 0, 1, 2...) a cada item multi-dia para evitar sobreposição
- Limitar a 2-3 slots visíveis, mostrar "+N mais" se exceder
- Cada célula reserva padding-top igual a `(numSlots * 20px)` para que os eventos single-day não sobreponham as barras

### Arquivo afetado
- `src/components/planejamento/PlanejamentoCalendario.tsx` — refatorar o grid de flat cells para row-based com barras absolutas
