

# Temperatura: visual corporativo com icones Lucide e reordenada

## O que muda

Substituir os emojis por icones Lucide React (estilo termometro, como na imagem de referencia) para um visual mais clean e corporativo. Reordenar para Morto aparecer primeiro (a esquerda).

## Alteracao 1 — Icones Lucide no lugar de emojis

**Arquivo:** `src/components/atividades/TemperaturaSelector.tsx`

- Importar icones do `lucide-react`: `ThermometerSnowflake`, `Thermometer`, `ThermometerSun`, `Skull`
- Trocar o campo `emoji: string` por `icon: React.ComponentType` no array `TEMPERATURAS`
- Mapeamento:
  - Morto: `Skull` (caveira clean)
  - Frio: `ThermometerSnowflake` (termometro com floco)
  - Morno: `Thermometer` (termometro neutro)
  - Quente: `ThermometerSun` (termometro com sol)
- Renderizar o icone como componente (`<temp.icon className="h-3 w-3" />`) no lugar do emoji texto
- Array reordenado: Morto, Frio, Morno, Quente

Array final:
```text
[
  { value: 'morto',  label: 'Morto',  icon: Skull,                 activeClass: '...', inactiveClass: '...' },
  { value: 'frio',   label: 'Frio',   icon: ThermometerSnowflake,  activeClass: '...', inactiveClass: '...' },
  { value: 'morno',  label: 'Morno',  icon: Thermometer,           activeClass: '...', inactiveClass: '...' },
  { value: 'quente', label: 'Quente', icon: ThermometerSun,        activeClass: '...', inactiveClass: '...' },
]
```

## Alteracao 2 — Sempre mostrar temperatura no formulario de atividades

**Arquivo:** `src/components/atividades/AtividadeForm.tsx`

- Remover a condicao `{clienteId && (` que esconde o campo de temperatura (~linha 838)
- Temperatura fica sempre visivel, independente de ter cliente selecionado
- Substituir os botoes inline por `TemperaturaSelector` (consistencia visual + inclui "Morto")
- Remover o `useEffect` que limpa temperatura quando nao tem cliente (~linha 180-183)
- Ajustar label de "Temperatura do Cliente" para "Temperatura"

## Resumo de arquivos

| Arquivo | Mudanca |
|---------|---------|
| `TemperaturaSelector.tsx` | Emojis viram icones Lucide (termometro/caveira), reordenar (Morto primeiro) |
| `AtividadeForm.tsx` | Sempre mostrar temperatura + usar TemperaturaSelector |

