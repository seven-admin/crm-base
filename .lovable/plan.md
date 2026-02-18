
## Correção do alinhamento vertical — causa raiz identificada

### O que está causando o espaçamento no topo de cada linha

O `tdBase` não tem `line-height` definido. O browser usa o valor padrão de aproximadamente `1.2`, o que significa:

- Com `font-size: 7.5pt`, o `line-height` efetivo é ~9pt
- Isso cria ~0.75pt de espaço acima e abaixo do texto dentro de cada célula
- Visualmente: a linha parece ter um "topo vazio" antes do conteúdo

O padding de `2px` em cima e embaixo está correto. O problema é que o `line-height` nativo do browser duplica o espaçamento percebido.

### Solução

Adicionar `line-height: 1; vertical-align: middle;` no `tdBase` e nos `<th>`.

- `line-height: 1` = a altura da linha é exatamente igual ao tamanho da fonte — sem espaço extra acima nem abaixo do texto
- `vertical-align: middle` = o texto fica centralizado verticalmente dentro do `padding` de 2px

### Mudança exata — linha 196

Atual:
```
"padding: 2px 6px; border-bottom: 1px solid #555; font-family: 'Courier New', Courier, monospace; font-size: 7.5pt; white-space: nowrap;"
```

Novo:
```
"padding: 2px 6px; border-bottom: 1px solid #555; font-family: 'Courier New', Courier, monospace; font-size: 7.5pt; white-space: nowrap; line-height: 1; vertical-align: middle;"
```

### Mudança nos `<th>` — linhas 225 a 230

Adicionar `line-height: 1; vertical-align: middle;` no style de cada `<th>`.

### Arquivo modificado
- `src/components/empreendimentos/UnidadesTab.tsx` — linhas 196, 225, 226, 227, 228, 229, 230

Apenas 2 propriedades CSS adicionadas. Nenhuma mudança estrutural.
