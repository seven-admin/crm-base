

# Adicionar botao de reiniciar cronometro

## Situacao atual

O componente `AtividadeCronometro.tsx` no estado "finalizado" (linha 126-134) mostra apenas a duracao registrada, sem opcao de reiniciar. A funcionalidade de reiniciar (limpar campos e permitir nova contagem) nao existe no codigo.

## Alteracao

Adicionar um botao "Reiniciar" no estado finalizado do cronometro que limpa os tres campos (`cronometro_inicio`, `cronometro_fim`, `duracao_minutos`) e volta o componente ao estado idle.

## Detalhes tecnicos

### Arquivo: `src/components/atividades/AtividadeCronometro.tsx`

1. Importar o icone `RotateCcw` do lucide-react
2. Adicionar handler `handleReset` que chama `updateAtividade.mutate` com os tres campos nulos:

```text
const handleReset = useCallback(() => {
  updateAtividade.mutate({
    id: atividadeId,
    data: {
      cronometro_inicio: null,
      cronometro_fim: null,
      duracao_minutos: null,
    } as any,
  });
}, [atividadeId, updateAtividade]);
```

3. No bloco do estado finalizado (linha 126-134), adicionar botao "Reiniciar" ao lado da duracao:

```text
// Estado finalizado
return (
  <div className="flex items-center gap-2 p-3 rounded-lg border border-border bg-muted/30">
    <Clock className="h-4 w-4 text-muted-foreground" />
    <span className="text-sm text-muted-foreground">Duracao:</span>
    <span className="text-sm font-medium text-foreground flex-1">
      {duracaoMinutos ? formatDuration(duracaoMinutos) : '-'}
    </span>
    <Button
      size="sm"
      variant="outline"
      onClick={handleReset}
      disabled={disabled || updateAtividade.isPending}
      className="gap-1.5"
    >
      <RotateCcw className="h-3.5 w-3.5" />
      Reiniciar
    </Button>
  </div>
);
```

### Arquivo unico modificado

- `src/components/atividades/AtividadeCronometro.tsx`

