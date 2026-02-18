
# Redesign do PDF de Unidades Disponíveis

## Resumo das mudanças

Todas as alterações são no arquivo `src/components/empreendimentos/UnidadesTab.tsx`, dentro da função `handleExportarDisponiveis`.

---

## 1. Remover logo — cabeçalho só texto

Remover o `<img src="${logoImg}" ...>` do cabeçalho (linha 203). O lado esquerdo ficará apenas com:

```
CRM 360 – Seven Group 360
Plataforma de Gestão Integrada
```

O import do `logoImg` pode ser mantido (é usado em outros lugares do sistema).

---

## 2. Adicionar hora na data de geração

Linha 180: mudar o `format` de `'dd/MM/yyyy'` para `'dd/MM/yyyy HH:mm:ss'`.

Resultado no PDF: `Gerado em 18/02/2026 14:32:05`

---

## 3. Remover colunas "Posição" e "Observações"

Remover da linha de `<th>` o cabeçalho de Posição e Observações (linhas 223–224).

Remover do `linhasHtml` as duas `<td>` correspondentes (linhas 194–195).

A tabela ficará com 5 colunas: **Bloco / Número / Tipologia / Área (m²) / Valor (R$)**

---

## 4. Redesign das linhas da tabela

**Borda das linhas:** trocar `border: 1px solid #ddd` por `border-bottom: 1px solid #555` (apenas linha inferior, cinza escuro, sem bordas laterais) — visual mais limpo e moderno.

**Espaçamento:** reduzir padding de `6px 8px` para `3px 6px` — linhas mais compactas.

**Fonte do conteúdo:** aplicar `font-family: 'Courier New', Courier, monospace` nas células `<td>` — fonte monoespaçada que garante alinhamento uniforme e evita quebras inesperadas, ideal para números e códigos.

O cabeçalho (`<thead>`) mantém a fonte Helvetica/Arial para diferenciação visual entre header e dados.

---

## 5. Corrigir o totalizador cortado

Adicionar `white-space: nowrap` no `<p>` do totalizador (linha 231) para garantir que o texto "Total de unidades disponíveis: X" não quebre em duas linhas.

---

## Resultado visual esperado

```text
┌─────────────────────────────────────────────────────────┐
│  CRM 360 – Seven Group 360          Unidades Disponíveis│
│  Plataforma de Gestão Integrada     LIVTY               │
│                                     Gerado em 18/02/2026│
│                                             14:32:05     │
├──────────┬────────┬──────────┬──────────┬───────────────┤
│  Bloco   │ Número │Tipologia │ Área(m²) │    Valor(R$)  │
├──────────┼────────┼──────────┼──────────┼───────────────┤  ← borda cinza escuro 1px
│  Q-1     │  101   │  Casa A  │   120,00 │  R$ 450.000   │
│  Q-1     │  102   │  Casa B  │   135,00 │  R$ 490.000   │
└──────────┴────────┴──────────┴──────────┴───────────────┘
                        Total de unidades disponíveis: 42
```

---

## Arquivo modificado

- `src/components/empreendimentos/UnidadesTab.tsx` (apenas a função `handleExportarDisponiveis`)
