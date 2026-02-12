

# Simplificar coluna TIPO na tabela de Atividades

## Problema

O label "Ligacao/WhatsApp" dentro de um Badge com icone esta quebrando em duas linhas na coluna TIPO da tabela, ficando visualmente ruim.

## Solucao

Remover o Badge decorativo e deixar apenas o icone + texto simples (sem fundo, sem borda). Isso dara mais espaco e evitara a quebra.

## Mudanca

**Arquivo:** `src/pages/Atividades.tsx`

Nas linhas 671-674 (tabela desktop), trocar:

```
<Badge variant="outline" className={TIPO_COLORS[atividade.tipo]}>
  <TipoIcon className="h-3 w-3 mr-1" />
  {ATIVIDADE_TIPO_LABELS[atividade.tipo]}
</Badge>
```

Por:

```
<div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
  <TipoIcon className="h-3.5 w-3.5 shrink-0" />
  <span>{ATIVIDADE_TIPO_LABELS[atividade.tipo]}</span>
</div>
```

Tambem verificar se ha outra ocorrencia similar (linha ~501, versao mobile/card) e aplicar o mesmo ajuste.

