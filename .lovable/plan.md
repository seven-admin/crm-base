
# Simplificar coluna TIPO — somente icone

## Mudanca

**Arquivo:** `src/pages/Atividades.tsx`

Nas duas ocorrencias (mobile ~linha 501 e desktop ~linha 671), trocar o bloco atual:

```tsx
<div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
  <TipoIcon className="h-3.5 w-3.5 shrink-0" />
  <span>{ATIVIDADE_TIPO_LABELS[atividade.tipo]}</span>
</div>
```

Por apenas o icone com tooltip para manter a informacao acessivel ao passar o mouse:

```tsx
<Tooltip>
  <TooltipTrigger asChild>
    <TipoIcon className="h-4 w-4 text-muted-foreground" />
  </TooltipTrigger>
  <TooltipContent>{ATIVIDADE_TIPO_LABELS[atividade.tipo]}</TooltipContent>
</Tooltip>
```

Adicionar import de `Tooltip, TooltipTrigger, TooltipContent` caso ainda nao esteja importado no arquivo.

**Arquivos alterados:** 1 (`src/pages/Atividades.tsx`)
