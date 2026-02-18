
## Correção do Totalizador Cortado — Solução Simples

### Problema
O texto "Total de unidades disponíveis: X" está sendo cortado na parte inferior porque cai exatamente na borda da página no momento da quebra. O jsPDF não consegue renderizar texto parcialmente na última linha visível.

### Solução
Adicionar um `<div>` vazio de espaçamento depois do parágrafo do totalizador, em `src/components/empreendimentos/UnidadesTab.tsx`, linha 239:

```html
<p style="...">
  Total de unidades disponíveis: <strong>${ordenadas.length}</strong>
</p>
<div style="height: 20px;"></div>   ← adicionar isso
```

Esse espaço empurra o totalizador para cima da borda da página, garantindo que ele apareça completo — sem alterar margens, sem mexer no html2canvas, sem risco de efeitos colaterais.

### Também corrigir o alinhamento vertical das células

Ao mesmo tempo, aproveitar para corrigir o `tdBase` adicionando `line-height` explícito, que é o que realmente funciona no contexto off-screen do html2canvas (o `vertical-align: middle` sozinho não tem efeito confiável nesse contexto):

```
padding: 3px 6px; border-bottom: 1px solid #555; font-family: 'Courier New', Courier, monospace; font-size: 9pt; white-space: nowrap; line-height: 20px;
```

E nos `<th>`, adicionar `line-height: 24px;` em cada um.

### Arquivo modificado
- `src/components/empreendimentos/UnidadesTab.tsx` — linha 239 (adicionar `<div>` espaçador) e `tdBase` + `<th>` (corrigir `line-height`)
