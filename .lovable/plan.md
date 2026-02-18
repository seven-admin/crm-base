
## Correções no PDF de Unidades Disponíveis

### O que será mudado em `src/components/empreendimentos/UnidadesTab.tsx`

---

### 1. Reordenar colunas — Número primeiro

O usuário quer a coluna **Número** como primeira coluna, seguida de Quadra/Bloco, Andar, Tipologia, Área e Valor.

Nova ordem:

| Número | Bloco/Quadra | Andar | Tipologia | Área (m²) | Valor (R$) |
|---|---|---|---|---|---|

Isso se aplica tanto ao `<thead>` quanto às linhas `<tr>` do `linhasHtml`.

---

### 2. Substituir "Sem Bloco" por traço

Linha 191: mudar

```
u.bloco?.nome || 'Sem ' + blocoLabel
```

para

```
u.bloco?.nome || '-'
```

---

### 3. Ordenação correta — Quadra → Andar → Número

A função atual `ordenarUnidadesPorBlocoENumero` ordena por bloco e depois por número, mas não considera o andar. Para o PDF, a ordenação deve ser:

1. Bloco/Quadra (natural, crescente)
2. Andar (numérico, crescente)
3. Número da unidade (natural, crescente)

Será aplicada uma ordenação local inline antes de montar o HTML, substituindo o `ordenarUnidadesPorBlocoENumero` por um `.sort()` personalizado com três níveis.

---

### 4. Corrigir o totalizador cortado — causa raiz real

O container está com `width: 680px` e o html2pdf usa `margin: 15` (em mm). O problema é que a margem é aplicada **após** a renderização do canvas, então o canvas é gerado com 680px mas o PDF aplica margens de 15mm (≈56.7px) em cada lado — restando ~566px visíveis de 680px de conteúdo. O conteúdo não é cortado na largura da tabela (que tem `width: 100%`), mas o `text-align: right` do totalizador posiciona o texto na borda direita dos 680px, que é exatamente onde a margem corta.

**Solução definitiva:** Adicionar `padding-right: 30px` no wrapper externo do `htmlContent` e `box-sizing: border-box`, garantindo que todo conteúdo fique a pelo menos 30px da borda direita antes que o PDF aplique sua margem.

```html
<div style="font-family: ...; padding-right: 30px; box-sizing: border-box;">
```

Isso empurra o texto do totalizador 30px para dentro, evitando o corte independente de qual margem o jsPDF aplique.

---

### Resultado final — nova ordem de colunas

```
┌──────────┬──────────────┬───────┬──────────┬──────────┬────────────────┐
│  Número  │ Quadra/Bloco │ Andar │Tipologia │ Área(m²) │   Valor (R$)   │
├──────────┼──────────────┼───────┼──────────┼──────────┼────────────────┤
│   101    │    Q-1       │  1º   │  Casa A  │  120,00  │  R$ 450.000,00 │
│   102    │    Q-1       │   -   │  Casa B  │  135,00  │  R$ 490.000,00 │
│   201    │    Q-2       │  2º   │  Casa C  │   98,50  │  R$ 380.000,00 │
└──────────┴──────────────┴───────┴──────────┴──────────┴────────────────┘
                               Total de unidades disponíveis: 42
```

- "Sem Bloco" → `-`
- Número é sempre a primeira coluna
- Ordenação: Bloco → Andar → Número

### Arquivo modificado
- `src/components/empreendimentos/UnidadesTab.tsx` — linhas 176–232 (função `handleExportarDisponiveis`)
