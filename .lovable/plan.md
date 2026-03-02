

# Ajustes na tabela de atividades em /atividades

## Alteracoes

### 1. Coluna "Tipo" - Exibir texto ao inves de icone
- Linha ~819-832: Substituir o bloco `<Tooltip><TooltipTrigger><TipoIcon>...</TooltipContent>` por texto simples usando `ATIVIDADE_TIPO_LABELS[atividade.tipo]`
- Manter o badge de subtipo (1o / Ret.) ao lado do texto
- Remover a variavel `TipoIcon` (linha 791) que nao sera mais usada

### 2. Remover coluna "Corretor"
- Linha 773: Remover `<TableHead className="hidden lg:table-cell">Corretor</TableHead>`
- Linha 856: Remover `<TableCell className="hidden lg:table-cell">{atividade.corretor?.nome_completo || '-'}</TableCell>`
- Linha 785: Ajustar `colSpan` de 11 para 10 na celula de "Nenhuma atividade encontrada"

### 3. Observacoes como tooltip no titulo
- Linha ~834-845: Envolver o conteudo da celula de titulo em um `<Tooltip>` que exibe `atividade.observacoes` quando existir
- Se nao houver observacoes, exibir o titulo normalmente sem tooltip (para nao mostrar tooltip vazio)

## Detalhes tecnicos

**Arquivo:** `src/pages/Atividades.tsx`

Coluna Tipo (antes):
```text
<Tooltip>
  <TooltipTrigger><TipoIcon .../></TooltipTrigger>
  <TooltipContent>{label}</TooltipContent>
</Tooltip>
```

Coluna Tipo (depois):
```text
<div className="flex items-center gap-1.5">
  <span className="text-sm">{ATIVIDADE_TIPO_LABELS[atividade.tipo]}</span>
  {subtipo badge}
</div>
```

Titulo com tooltip de observacoes (depois):
```text
{atividade.observacoes ? (
  <Tooltip>
    <TooltipTrigger asChild>
      <div>...titulo + shield...</div>
    </TooltipTrigger>
    <TooltipContent className="max-w-xs">{atividade.observacoes}</TooltipContent>
  </Tooltip>
) : (
  <div>...titulo + shield...</div>
)}
```

Nenhum novo import necessario - `Tooltip`, `TooltipTrigger` e `TooltipContent` ja estao importados no arquivo.
