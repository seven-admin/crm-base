

# Atualizacao Final: Fundo, Cards e Nova Paleta de Destaque

## Resumo das mudancas

Tres grupos de alteracoes em todos os componentes da pagina `/design-test`:

### 1. Fundo geral da pagina
- `#e8eaec` vira `#e1e1e1`

### 2. Card cinza (DarkCard)
- `#d0d6dd` vira `#f8f8f8`

### 3. Cor de destaque principal e derivadas
Substituir `#6d93c5` por `#f47f19` e os tons auxiliares azuis por tons laranja:

| Antes (azul) | Depois (laranja) | Uso |
|---|---|---|
| `#6d93c5` | `#f47f19` | Cor principal: botoes, links, icones, dots do grafico |
| `#E0EAFF` | `#fce0c7` | Background leve de icones, avatares, badges |

Tons disponiveis para uso futuro: `#f69947` (destaque02), `#f9bf8c` (destaque03), `#fce0c7` (destaque04).

---

## Arquivos e alteracoes

### `src/pages/DesignTest.tsx`
- Linha 31: fundo da pagina `#e8eaec` para `#e1e1e1`
- Linha 40: logo bg `#6d93c5` para `#f47f19`
- Linha 22: badge "Aprovado" color `#6d93c5` para `#f47f19`, bg `#E0EAFF` para `#fce0c7`
- Linha 93: avatar JD bg `#E0EAFF` para `#fce0c7`, color `#6d93c5` para `#f47f19`
- Linhas 186, 194: accentColor dos checkboxes/radios `#6d93c5` para `#f47f19`
- Linha 202: botao principal bg `#6d93c5` para `#f47f19`
- Linha 208: botao outline color e border `#6d93c5` para `#f47f19`

### `src/components/design-test/TestDarkCard.tsx`
- Linha 7: background `#d0d6dd` para `#f8f8f8`

### `src/components/design-test/TestHeroCard.tsx`
- Linha 30: icon container bg `#E0EAFF` para `#fce0c7`
- Linha 31: icon color `#6d93c5` para `#f47f19`
- Linha 63: dot do grafico `#6d93c5` para `#f47f19`
- Linha 64: gradient `#6d93c5` para `#f47f19` (incluindo rgba)

### `src/components/design-test/TestTeamCard.tsx`
- Linha 4: primeiro membro bg `#E0EAFF` para `#fce0c7`, color `#6d93c5` para `#f47f19`
- Linha 13: link "Ver todos" color `#6d93c5` para `#f47f19`

### `src/components/design-test/TestProjectList.tsx`
- Linhas 10-11: iconBg `#E0EAFF` para `#fce0c7`, iconColor `#6d93c5` para `#f47f19`
- Linha 47: link "Ver todos" color `#6d93c5` para `#f47f19`

### `src/components/design-test/TestMetricsCard.tsx`
- Linha 4: VGV Total color `#6d93c5` para `#f47f19`

