
## Correção definitiva — trocar `vertical-align: middle` por `vertical-align: top`

### Diagnóstico real observado na imagem

A imagem mostra claramente que o texto de cada linha está **flutuando no centro vertical** da célula, com espaço vazio acima e abaixo. Isso é exatamente o comportamento do `vertical-align: middle` — ele calcula a altura total da célula e posiciona o texto no meio.

O problema é que `vertical-align: middle` funciona junto com a altura calculada da linha. Com `line-height: 1` e `padding: 2px`, a altura mínima da célula deveria ser pequena — mas o browser de renderização do html2canvas pode estar calculando uma altura maior para a linha (baseada no maior elemento da linha ou em valores internos), fazendo o texto flutuar visualmente no centro.

### Solução correta

Trocar `vertical-align: middle` por `vertical-align: top` em todos os `<td>` e `<th>`.

- `vertical-align: top` = o texto começa logo depois do `padding-top` de 2px
- O resultado: texto colado ao topo, separado apenas pelos 2px de padding — sem espaço flutuante
- O `line-height: 1` continua correto para eliminar o espaço interno da fonte

### Mudanças exatas

**Linha 196 — `tdBase`**: trocar `vertical-align: middle` por `vertical-align: top`

Atual:
```
"padding: 2px 6px; ... line-height: 1; vertical-align: middle;"
```

Novo:
```
"padding: 2px 6px; ... line-height: 1; vertical-align: top;"
```

**Linhas 225–230 — `<th>`**: trocar `vertical-align: middle` por `vertical-align: top` em todos os cabeçalhos

### Arquivo modificado
- `src/components/empreendimentos/UnidadesTab.tsx` — linhas 196, 225, 226, 227, 228, 229, 230

Apenas a palavra `middle` trocada por `top` em 7 lugares. Nenhuma outra mudança.
