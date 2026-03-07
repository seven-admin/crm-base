

# Reestilização do Calendário — Estilo Google Calendar

## Problema atual
O layout usa um overlay absoluto para barras multi-dia + um `div` spacer dentro das células. Isso causa desalinhamento dos números porque o spacer e o overlay não sincronizam perfeitamente. Qualquer variação de padding/gap quebra o alinhamento.

## Abordagem: Google Calendar-like

Abandonar o overlay absoluto. Renderizar tudo **inline** dentro de cada célula, com layout por CSS grid interno fixo.

### Estrutura de cada célula (Google-style)

```text
┌─────────────────────┐
│        14           │  ← Número centralizado, fonte leve
│ ██ Criação DRIVE... │  ← Barra multi-dia (inline, não overlay)
│ ██ Invasões FASE... │  ← Barra multi-dia
│ • 8am Reunião Fix.. │  ← Evento single-day (bullet style)
│ +2 mais             │  ← Overflow
└─────────────────────┘
```

### Mudanças em `PlanejamentoCalendario.tsx`

1. **Eliminar overlay absoluto** — Remover o `<div className="absolute inset-0">` que renderiza as barras multi-dia como camada flutuante.

2. **Renderizar barras multi-dia inline nas células** — Para cada dia, calcular quais multi-day items o cobrem e renderizá-los como chips dentro da célula (não como barras contínuas cross-cell). Cada chip terá estilo de barra (cor de fundo, borda esquerda colorida) e será truncado.

3. **Número do dia centralizado** — Mudar de `text-left` + `flex justify-between` para número centralizado no topo (como Google Calendar). Botão "+" aparece no hover ao lado.

4. **Altura da célula** — Aumentar para `h-32` (128px) para acomodar mais conteúdo sem overflow.

5. **Layout interno com grid fixo** — Usar CSS grid com rows fixas:
   - Row 1: número do dia (24px, fixo)
   - Row 2: área de eventos (flex-1, overflow hidden)

6. **Estilo dos itens** — Multi-dia: chip com borda-esquerda colorida (3px) + fundo suave. Single-day: bullet colorido + texto (como Google Calendar mostra eventos de horário específico).

7. **Barra contínua simplificada** — Em vez de barras cross-cell (complexas e fonte dos bugs), cada célula renderiza seus próprios chips inline. Perde-se a barra visual contínua, mas ganha-se robustez e alinhamento perfeito. A continuidade visual fica indicada pela mesma cor/nome repetido nas células adjacentes.

### Mudanças em `CalendarioDiaCell.tsx`

- Atualizar para o mesmo padrão (usado no calendário de empreendimento). Número centralizado, bullets para single-day.

### Resultado esperado
- Números **sempre** alinhados (são a primeira row fixa de cada célula, sem dependência de overlay)
- Eventos **sempre** abaixo do número, nunca sobrepõem
- Visual limpo e familiar (Google Calendar)
- Código mais simples (sem cálculos de posição absoluta, sem slots, sem overlay)

### Arquivos afetados
- `src/components/planejamento/PlanejamentoCalendario.tsx` (principal)
- `src/components/planejamento/CalendarioDiaCell.tsx` (atualizar estilo)

