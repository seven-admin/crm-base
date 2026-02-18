
## Correções pontuais — 3 problemas, 3 mudanças de linha

### Problema 1 — Fonte grande demais na tabela
A `<table>` tem `font-size: 10pt` (linha 222) que sobrescreve o `9pt` do `tdBase`. O texto da tabela fica grande. A solução é reduzir o `font-size` da `<table>` para `8pt` e o `tdBase` para `7.5pt`.

### Problema 2 — Margem errada
A linha 254 tem `margin: [10, 10, 10, 10]`. Precisa voltar para `margin: 15` (15mm em todos os lados como era antes e como o usuário quer).

### Problema 3 — Alinhamento vertical
O `padding: 6px 6px` com conteúdo direto deve funcionar. O problema real é que a `<table>` tem `font-size: 10pt` sobrescrevendo tudo, fazendo as células terem altura automática diferente do esperado. Com `font-size: 8pt` na table e `7.5pt` nas células, o html2canvas vai renderizar corretamente com o padding simétrico.

---

### Mudanças exatas no arquivo `src/components/empreendimentos/UnidadesTab.tsx`

**Linha 196** — `tdBase`: reduzir fonte de `9pt` para `7.5pt`
```
font-size: 7.5pt;
```

**Linha 222** — `<table>`: reduzir fonte de `10pt` para `8pt`
```html
<table style="width: 100%; border-collapse: collapse; font-size: 8pt;">
```

**Linhas 225–230** — `<th>`: reduzir fonte de `9pt` para `8pt`
```html
font-size: 8pt;
```

**Linha 254** — margem: voltar de `[10, 10, 10, 10]` para `15`
```typescript
margin: 15,
```

Apenas 4 alterações de valores em linhas exatas. Sem mexer em estrutura, sem reinventar nada.
