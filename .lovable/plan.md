
## Correção definitiva das linhas do PDF

### Causa raiz real — whitespace no template literal

O código na linha 198-207 usa um template literal multi-linha com indentação:

```javascript
const linhasHtml = ordenadas.map((u, i) => `
      <tr style="...">
        <td style="...">401</td>
        ...
      </tr>
    `).join('');
```

Cada `\n` e espaço de indentação antes de `<td>` são **nós de texto whitespace** no HTML. O renderizador do `html2canvas`/`html2pdf` os interpreta como conteúdo, adicionando altura extra em cada linha — por isso aparece aquele espaço em branco acima do texto, independente do `vertical-align`.

Além disso, o espaçamento antes de `${linhasHtml}` na linha 234 também adiciona whitespace.

### Solução

1. **Compactar o template literal das linhas** — colocar tudo em uma única linha por `<tr>`, sem quebras ou indentação interna
2. **Remover as cores alternadas** — todas as linhas com fundo branco `#ffffff`
3. **Manter** `line-height: 1`, `vertical-align: top` e `padding: 2px 6px` que já estão corretos

### Mudança exata — linha 198-207

Atual (com quebras e indentação que geram whitespace):
```javascript
const linhasHtml = ordenadas.map((u, i) => `
      <tr style="background: ${i % 2 === 0 ? '#ffffff' : '#f5f5f5'};">
        <td style="${tdBase} text-align: center;">${u.numero}</td>
        ...
      </tr>
    `).join('');
```

Novo (tudo inline, sem whitespace extra, fundo branco uniforme):
```javascript
const linhasHtml = ordenadas.map((u) => `<tr style="background:#ffffff;"><td style="${tdBase} text-align:center;">${u.numero}</td><td style="${tdBase}">${u.bloco?.nome || '-'}</td><td style="${tdBase} text-align:center;">${u.andar != null ? u.andar + 'º' : '-'}</td><td style="${tdBase}">${u.tipologia?.nome || '-'}</td><td style="${tdBase} text-align:center;">${u.area_privativa != null ? Number(u.area_privativa).toLocaleString('pt-BR', {minimumFractionDigits:2,maximumFractionDigits:2}) : '-'}</td><td style="${tdBase} text-align:right;">${formatarMoeda(u.valor)}</td></tr>`).join('');
```

### Também — linha 234

A interpolação `${linhasHtml}` dentro do `htmlContent` tem indentação/quebras ao redor — isso precisa estar colado diretamente ao `<tbody>` sem espaços.

### Arquivo modificado
- `src/components/empreendimentos/UnidadesTab.tsx` — linhas 198-207 e 233-235
