
## Redução do espaçamento das linhas — problema de padding excessivo

### Diagnóstico

O `padding: 6px 6px` nas células `<td>` e `<th>` está correto para alinhamento visual, mas **6px em cima + 6px em baixo = 12px de espaçamento vertical** por linha — isso dobra a altura das linhas sem necessidade.

Para uma tabela compacta, o padding vertical deve ser `2px`, não `6px`. O padding horizontal (`6px`) pode ficar igual para manter o espaçamento lateral.

### Mudanças exatas

**Linha 196 — `tdBase`**: trocar `padding: 6px 6px` por `padding: 2px 6px`

```
const tdBase = "padding: 2px 6px; border-bottom: 1px solid #555; font-family: 'Courier New', Courier, monospace; font-size: 7.5pt; white-space: nowrap;";
```

**Linhas 225–230 — `<th>`**: trocar `padding: 6px 6px` por `padding: 2px 6px` em todos os cabeçalhos

```html
<th style="padding: 2px 6px; border-bottom: 2px solid #333; ...">
```

### Por que isso resolve

- `padding: 2px 6px` = 2px topo, 2px base, 6px esquerda, 6px direita
- O espaçamento simétrico (2px/2px) ainda centraliza o texto verticalmente
- A altura da linha cai de ~24px para ~16px — cabe muito mais linhas por página
- Nenhuma mudança estrutural, apenas 2 valores de padding

### Arquivo modificado
- `src/components/empreendimentos/UnidadesTab.tsx` — linhas 196, 225, 226, 227, 228, 229, 230
