

# Quebra de linha entre emoji e texto no badge de temperatura

## Problema
Em telas pequenas, o badge de temperatura quebra o texto de forma irregular porque emoji e label estao na mesma linha dentro de um espaco limitado.

## Solucao

### Arquivo: `src/components/atividades/TemperaturaSelector.tsx`

Nos botoes do `displayMode` (trigger e opcoes do popover), separar o emoji e o label em duas linhas usando `flex-col`, aumentando levemente a altura fixa para acomodar as duas linhas.

Trocar de:
```
{temp.emoji} {temp.label}
```

Para:
```tsx
<span className="flex flex-col items-center leading-tight">
  <span>{temp.emoji}</span>
  <span>{temp.label}</span>
</span>
```

E ajustar as classes do botao: trocar `h-5` por `h-auto py-0.5` e manter `px-1.5 text-[10px]` para ficar compacto.

### Resultado
Badge sempre compacto e consistente: emoji em cima, label embaixo, sem quebra irregular.

