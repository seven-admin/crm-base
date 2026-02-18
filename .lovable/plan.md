
## O que está errado e o que será corrigido

### Problema 1 — Tabela sem dados (crítico)
A linha 231 do arquivo contém literalmente os caracteres `...` dentro da template string do HTML. Isso substituiu todo o trecho:
```
            </tr>
          </thead>
          <tbody>
            ${linhasHtml}
          </tbody>
        </table>
        <p style="margin: 12px 0 0; font-size: 9pt; color: #555; text-align: right; white-space: nowrap;">
```
Por isso a tabela exibe apenas o cabeçalho (thead) e nenhuma linha de dado.

### Problema 2 — Alinhamento vertical na base das células
`vertical-align: middle` em `<td>` não é respeitado pelo html2canvas quando o elemento é renderizado fora do DOM (off-screen). A única abordagem que funciona de forma confiável nesse contexto é envolver o conteúdo de cada `<td>` e `<th>` em um `<div>` com `display: flex; align-items: center;` e altura fixa.

Exemplo para `<td>`:
```html
<td style="padding: 0 6px; border-bottom: 1px solid #555; ...">
  <div style="display: flex; align-items: center; height: 22px;">CONTEÚDO</div>
</td>
```

Exemplo para `<th>`:
```html
<th style="padding: 0 6px; border-bottom: 2px solid #333; ...">
  <div style="display: flex; align-items: center; height: 26px;">TEXTO</div>
</th>
```

---

### Mudanças no arquivo `src/components/empreendimentos/UnidadesTab.tsx`

**1. Remover o `line-height` do `tdBase`** — não é mais necessário pois o alinhamento será feito pelo flex interno:
```
const tdBase = "padding: 0 6px; border-bottom: 1px solid #555; font-family: 'Courier New', Courier, monospace; font-size: 9pt; white-space: nowrap;";
```

**2. Reescrever `linhasHtml`** com `<div>` flex interno em cada `<td>`:
```html
<tr style="background: ...">
  <td style="${tdBase} text-align: center;">
    <div style="display: flex; align-items: center; justify-content: center; height: 22px;">${u.numero}</div>
  </td>
  <td style="${tdBase}">
    <div style="display: flex; align-items: center; height: 22px;">${u.bloco?.nome || '-'}</div>
  </td>
  ... (mesma estrutura para Andar, Tipologia, Área, Valor)
</tr>
```

**3. Reescrever todos os `<th>`** com `<div>` flex interno:
```html
<th style="padding: 0 6px; border-bottom: 2px solid #333; ...">
  <div style="display: flex; align-items: center; justify-content: center; height: 26px;">Número</div>
</th>
```

**4. Reconstruir o fechamento correto da tabela** (o trecho que foi substituído por `...`):
```html
            </tr>
          </thead>
          <tbody>
            ${linhasHtml}
          </tbody>
        </table>
        <p style="margin: 12px 0 0; font-size: 9pt; color: #555; text-align: right; white-space: nowrap;">
          Total de unidades disponíveis: <strong>${ordenadas.length}</strong>
        </p>
        <div style="height: 20px;"></div>
```

---

### Resultado esperado
- Todas as linhas de dados aparecem na tabela
- Texto de todas as células centralizado verticalmente (meio da célula)
- Totalizador com espaçador de 20px abaixo para evitar corte na quebra de página
- Estrutura HTML válida e completa

### Arquivo modificado
- `src/components/empreendimentos/UnidadesTab.tsx` — linhas 196–235
