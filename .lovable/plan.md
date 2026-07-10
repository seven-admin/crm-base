Substituir `html2pdf.js` por **jsPDF + jspdf-autotable** na função `handleExportarDisponiveis` de `src/components/empreendimentos/UnidadesTab.tsx`.

### 1. Dependências
- `bun add jspdf-autotable` (mantém `jspdf` já presente via html2pdf; instala tipagens juntas).
- Remover import de `html2pdf.js` do arquivo (biblioteca continua no `package.json` por ora, pois pode ser usada em outros pontos — verificar via grep; se não for, remover também).

### 2. Novo símbolo da marca d'água
- `lovable-assets create --file /mnt/user-uploads/Ativo_29-2.png --filename nexa-symbol.png` e sobrescrever `src/assets/nexa-symbol.png.asset.json`.
- Pré-carregar a imagem em **base64** (`fetch → blob → FileReader`) antes de gerar o PDF, para uso em `doc.addImage`.
- Idem para `src/assets/nexa-logo.png.asset.json` (logo do cabeçalho).

### 3. Estrutura do documento (jsPDF)
```
const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
// A4 = 210 x 297 mm, margem = 10 mm em todos os lados
```

### 4. Cabeçalho (somente logo)
Renderizado dentro do callback `didDrawPage` do autoTable, aplicado em **todas as páginas**:
- Esquerda: `doc.addImage(logoBase64, 'PNG', 10, 8, 22, 10)` (só a logo Nexa, sem texto "NEXA").
- Abaixo da logo: nome do empreendimento em 8pt cinza (`#666`).
- Direita: "Unidades Disponíveis" (11pt bold) + "Gerado em dd/mm/aaaa hh:mm" (8pt cinza).
- Linha divisória fina em `y ≈ 22mm` (`setDrawColor(230); doc.line(10, 22, 200, 22)`).

### 5. Marca d'água em todas as páginas
Também no `didDrawPage`, antes do conteúdo:
```
doc.saveGraphicsState();
doc.setGState(new doc.GState({ opacity: 0.06 }));
doc.addImage(symbolBase64, 'PNG', 55, 90, 100, 100); // centralizado 100mm
doc.restoreGraphicsState();
```

### 6. Tabela (autoTable)
```
autoTable(doc, {
  startY: 26,
  margin: { top: 26, right: 10, bottom: 15, left: 10 },
  head: [[unidLabel, blocoLabel, 'Andar', 'Tipologia', 'Box', 'Área (m²)', 'Valor (R$)']],
  body: linhas,
  theme: 'plain',           // sem bordas
  styles: {
    font: 'helvetica',
    fontSize: 8,
    cellPadding: { top: 1.2, bottom: 1.2, left: 2, right: 2 }, // espaçamento vertical reduzido
    lineWidth: 0,           // remove bordas
    textColor: [40, 40, 40],
  },
  headStyles: {
    fontStyle: 'bold',
    fillColor: false,       // sem fundo
    textColor: [17, 17, 17],
    lineWidth: { bottom: 0.2 },
    lineColor: [180, 180, 180],
  },
  columnStyles: {
    0: { cellWidth: 18, halign: 'center' },   // Número/Lote
    1: { cellWidth: 26 },                     // Bloco/Quadra
    2: { cellWidth: 14, halign: 'center' },   // Andar
    3: { cellWidth: 42 },                     // Tipologia
    4: { cellWidth: 26, halign: 'center' },   // Box
    5: { cellWidth: 22, halign: 'center' },   // Área
    6: { cellWidth: 42, halign: 'right' },    // Valor
  },
  didDrawPage: (data) => { /* header + watermark acima */ },
});
```
Larguras somam **190 mm** = 210 − 2×10, então respeitam exatamente a margem de 1 cm. Zero risco de overflow horizontal.

### 7. Rodapé
Ao final (após o autoTable):
- Total de unidades disponíveis em `doc.lastAutoTable.finalY + 6`, alinhado à direita.
- Se `texto_rodape_relatorio` existir, imprimir em `finalY + 14` com `doc.splitTextToSize(texto, 190)` em 7pt cinza.
- Numeração "Página X de Y" no rodapé de cada página (loop `for i in 1..doc.getNumberOfPages()`).

### 8. Salvar
`doc.save(\`Unidades_Disponiveis_${nome}_${data}.pdf\`)`.

### Escopo
- `src/components/empreendimentos/UnidadesTab.tsx`: substituir apenas `handleExportarDisponiveis` e imports (`html2pdf` → `jsPDF`, `autoTable`).
- `src/assets/nexa-symbol.png.asset.json`: repontar para o novo upload.
- `package.json`: adicionar `jspdf-autotable`.
Nenhum outro arquivo alterado.
