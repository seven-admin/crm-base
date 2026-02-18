
## Correção da margem direita — 1 linha

### Diagnóstico

A página A4 tem 210mm de largura. Com `margin: 15` (15mm de cada lado), a área útil é 180mm.

Convertendo 180mm para pixels a 96dpi: 180 × 96 / 25.4 ≈ **680px**.

O problema: o `width: 680` e `windowWidth: 680` estão exatamente no limite. Com `scale: 2`, o html2canvas renderiza em 1360px e o html2pdf comprime isso para caber em 180mm. Qualquer pixel extra de padding interno ou borda causa o estouro visível na margem direita.

### Solução

Reduzir `width` e `windowWidth` de `680` para `660`. Isso cria uma folga de ~10px de cada lado, garantindo que o conteúdo caiba sem corte.

**Linha 257** — mudar `width: 680, windowWidth: 680` para `width: 660, windowWidth: 660`:
```typescript
html2canvas: { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff', width: 660, windowWidth: 660 },
```

### Arquivo modificado
- `src/components/empreendimentos/UnidadesTab.tsx` — apenas linha 257

Apenas 2 valores numéricos alterados. Nada mais.
