
## Correção definitiva — alinhamento e margem direita

### Diagnóstico real

O `display: flex; align-items: center` dentro de `<td>` **não funciona no html2canvas**. O html2canvas não suporta flexbox dentro de células de tabela quando renderiza off-screen. Por isso o texto sempre fica colado na base, independente de quantas vezes essa abordagem seja tentada.

### Solução simples (sem reinventar)

Remover todos os `<div style="display:flex...">` dentro dos `<td>` e `<th>`.

Usar apenas `padding-top` e `padding-bottom` iguais nas células para criar o efeito visual de centralização. Isso funciona 100% no html2canvas porque é CSS básico suportado universalmente.

**`tdBase` novo:**
```
padding: 6px 6px; border-bottom: 1px solid #555; font-family: 'Courier New'...; font-size: 9pt; white-space: nowrap;
```

**Células `<td>` — conteúdo direto, sem div:**
```html
<td style="${tdBase} text-align: center;">${u.numero}</td>
<td style="${tdBase}">${u.bloco?.nome || '-'}</td>
```

**Cabeçalhos `<th>` — mesma coisa:**
```html
<th style="padding: 6px 6px; border-bottom: 2px solid #333; ...">Número</th>
```

### Margem direita fora do padrão

Mudar `margin: 15` para `margin: [10, 10, 10, 10]` no html2pdf para reduzir a margem de 15mm para 10mm em todos os lados.

### Resumo das mudanças em `src/components/empreendimentos/UnidadesTab.tsx`

1. `tdBase` (linha 196): trocar para `padding: 6px 6px;` — remove `line-height`, remove qualquer flex
2. `linhasHtml` (linhas 199–207): remover todos os `<div style="display:flex...">` — conteúdo direto na célula
3. `<th>` (linhas 225–230): remover os `<div style="display:flex...">` — texto direto no `<th>`, com `padding: 6px 6px;`
4. `margin: 15` (linha 254): mudar para `margin: [10, 10, 10, 10]`

### Por que isso funciona

html2canvas suporta `padding` em células de tabela normalmente. Um `padding: 6px` em cima e em baixo cria espaçamento simétrico que visualmente centraliza o texto — exatamente o que o html2pdf.js precisa para renderizar corretamente.
