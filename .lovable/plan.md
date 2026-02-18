
## Causa raiz real — confirmada na imagem

### O que está acontecendo

A imagem mostra claramente: a linha horizontal aparece **acima** do texto de cada linha. Isso é o comportamento clássico quando:

1. O `border-bottom` está em cada `<td>` (não no `<tr>`)
2. O `html2canvas` renderiza com `scale: 2` — o border é renderizado com sub-pixel precision e pode aparecer ligeiramente deslocado

**Mas o problema principal está no código na linha 198:**

```
`<tr style="background:#ffffff;"><td style="${tdBase}text-align:center;">`
```

O `tdBase` termina com `vertical-align: top;` e o código concatena diretamente `text-align:center;` — **sem espaço separador**. Isso gera um CSS malformado:

```
...vertical-align: top;text-align:center;
```

Browsers e html2canvas são tolerantes a isso, mas pode causar comportamento imprevisível no layout.

### Solução definitiva — 3 mudanças

**1. Adicionar espaço entre `${tdBase}` e os estilos extras**

Trocar `${tdBase}text-align:center;` por `${tdBase} text-align:center;` (com espaço).

**2. Mover o `border` do `<td>` para o `<tr>`**

O `border-bottom: 1px solid #555` no `tdBase` é aplicado em cada célula individualmente. Com `border-collapse: collapse`, o border da célula da linha N e da linha N+1 ficam sobrepostos — o renderizador escolhe qual usar e pode deslocar visualmente.

Solução: remover o `border-bottom` do `tdBase` e colocar `border-bottom: 1px solid #ddd` no `<tr>`.

**3. Aumentar o padding para separar o texto da borda**

O padding de `2px 6px` é muito apertado — com a borda vindo do `<tr>`, um padding de `4px 6px` garante espaço visual adequado.

### Mudanças exatas

**Linha 196 — `tdBase`**: remover `border-bottom: 1px solid #555` e manter o resto

Atual:
```
"padding: 2px 6px; border-bottom: 1px solid #555; font-family: ...; line-height: 1; vertical-align: top;"
```

Novo:
```
"padding: 4px 6px; font-family: 'Courier New', Courier, monospace; font-size: 7.5pt; white-space: nowrap; line-height: 1; vertical-align: top;"
```

**Linha 198 — `linhasHtml`**:
- Trocar `border-bottom` do `<td>` para o `<tr>` via style
- Adicionar espaço entre `${tdBase}` e os estilos extras

Novo:
```javascript
const linhasHtml = ordenadas.map((u) => `<tr style="background:#ffffff; border-bottom: 1px solid #ddd;"><td style="${tdBase} text-align:center;">${u.numero}</td><td style="${tdBase}">${u.bloco?.nome || '-'}</td><td style="${tdBase} text-align:center;">${u.andar != null ? u.andar + 'º' : '-'}</td><td style="${tdBase}">${u.tipologia?.nome || '-'}</td><td style="${tdBase} text-align:center;">${u.area_privativa != null ? Number(u.area_privativa).toLocaleString('pt-BR', {minimumFractionDigits:2,maximumFractionDigits:2}) : '-'}</td><td style="${tdBase} text-align:right;">${formatarMoeda(u.valor)}</td></tr>`).join('');
```

**Também na `<table>`**: adicionar `border-top: 1px solid #ddd;` para fechar a tabela visualmente.

### Arquivo modificado
- `src/components/empreendimentos/UnidadesTab.tsx` — linhas 196, 198 e 213
