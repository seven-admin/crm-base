
## Correções no PDF — Totalizador Cortado + Coluna Andar + Alinhamento Vertical

### Problema raiz do totalizador cortado

O container HTML é renderizado pelo html2canvas com `width: 794` (largura total A4 em px a 96dpi), mas o jsPDF aplica `margin: 15` (15mm de cada lado). Isso significa que apenas ~680px de largura útil existem no PDF final — mas o HTML é gerado com 794px de largura total.

O resultado: o `<p style="text-align: right">` do totalizador renderiza o texto rente à borda direita dos 794px, mas o PDF corta os últimos ~114px por causa da margem direita.

**Solução:** Reduzir o `width` do container para `180mm` (210mm - 2×15mm) e ajustar o `windowWidth` do html2canvas para `680` (equivalente em px), garantindo que o conteúdo renderizado caiba exatamente dentro das margens do PDF.

Alternativamente — e mais simples — manter o container em 794px mas adicionar `padding-right: 15mm` no próprio `<div>` interno, compensando a margem do PDF dentro do HTML.

A abordagem mais confiável é: **definir `padding: 0 15mm` no `<div>` wrapper** e setar `margin: 0` no html2pdf, deixando o HTML controlar todo o espaçamento. Mas isso muda muito a estrutura atual.

**Abordagem escolhida (mínima e cirúrgica):** Mudar o `container.style.width` de `'210mm'` para `'180mm'` e o `windowWidth` do html2canvas de `794` para `680`. Isso faz o html2canvas renderizar o conteúdo na largura correta e o jsPDF consegue posicionar sem cortar.

---

### Mudanças no arquivo `src/components/empreendimentos/UnidadesTab.tsx`

**1. Corrigir largura do container e do html2canvas**

Linha 233: mudar `container.style.width` de `'210mm'` para `'680px'`

Linha 245: mudar `width: 794` para `width: 680` e `windowWidth: 794` para `windowWidth: 680`

Isso garante que o conteúdo renderizado respeite a área útil após as margens de 15mm em cada lado.

---

**2. Adicionar coluna Andar**

Linha 187 — `linhasHtml`: inserir `<td>` de Andar entre Número e Tipologia:

```html
<td style="${tdBase} text-align: center;">${u.andar != null ? u.andar + 'º' : '-'}</td>
```

Linhas 215–219 — `<thead>`: inserir `<th>` de Andar entre Número e Tipologia:

```html
<th style="... text-align: center;">Andar</th>
```

---

**3. Corrigir alinhamento vertical das células (`vertical-align: middle`)**

Linha 187 — `tdBase`: adicionar `vertical-align: middle`:

```
const tdBase = "padding: 3px 6px; border-bottom: 1px solid #555; font-family: 'Courier New', Courier, monospace; font-size: 9pt; white-space: nowrap; vertical-align: middle;";
```

Linhas 215–219 — todos os `<th>`: adicionar `vertical-align: middle` em cada um.

---

### Resultado esperado

| Bloco | Número | Andar | Tipologia | Área (m²) | Valor (R$) |
|---|---|---|---|---|---|
| BLOCO A | 207 | 2º | 3 QUARTOS | 87,37 | R$ 550.000,00 |
| BLOCO A | 210 | 2º | 3 QUARTOS | 82,04 | R$ 525.000,00 |

- Texto de todas as células centralizado verticalmente
- Totalizador completo visível sem corte
- Coluna Andar presente entre Número e Tipologia

### Arquivo modificado
- `src/components/empreendimentos/UnidadesTab.tsx` — linhas 187–245 (função `handleExportarDisponiveis`)
