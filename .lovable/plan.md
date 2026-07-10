## Refatorar layout do PDF "Exportar Disponíveis"

Arquivo: `src/components/empreendimentos/UnidadesTab.tsx` (função `handleExportarDisponiveis`, linhas 188-296).

### 1. Assets Nexa
Registrar como Lovable Assets a partir dos uploads:
- `user-uploads://Ativo_20.png` → logotipo completo (símbolo + "nexa") → usado no cabeçalho do PDF.
- `user-uploads://Ativo_29.png` → símbolo isolado → usado como marca d'água no fundo da página.

Salvar os JSONs em `src/assets/nexa-logo.png.asset.json` e `src/assets/nexa-symbol.png.asset.json` e importar no componente.

### 2. Cabeçalho
Substituir o bloco atual "CRM 360 – {empreendimento}" por:
- Esquerda: `<img>` do logotipo Nexa (altura ~28px) + texto "NEXA" em caixa alta ao lado, com o nome do empreendimento como subtítulo menor.
- Direita: mantém "Unidades Disponíveis" + data de geração.
- Divisor inferior mais sutil (1px `#e5e7eb`).

### 3. Marca d'água de fundo
Envolver o conteúdo em wrapper `position: relative` e injetar o símbolo como `<div>` absoluto centralizado, `opacity: 0.05`, largura ~500px, `z-index: 0`. Conteúdo da tabela em `position: relative; z-index: 1`. Ajustar `html2canvas` para `backgroundColor: '#ffffff'` (já está) e converter a imagem para dataURL antes do render (evita CORS em html2canvas).

### 4. Impedir quebra da lista
- `<table>` recebe `table-layout: fixed` e larguras explícitas por coluna para não haver reflow.
- `<thead>` com `display: table-header-group` para repetir em cada página.
- Cada `<tr>` de dado com `page-break-inside: avoid; break-inside: avoid` (já existe, reforçar removendo o `rowSep` que insere `<tr>` extra e trocar por `border-bottom` direto na linha — o `<tr>` separador atual pode causar órfãos entre páginas).
- `pagebreak.mode` mantido; adicionar `avoid: 'tr'`.

### 5. Rodapé
Mantido; ajustar cor para harmonizar com nova paleta (cinza `#666`).

### Escopo
Somente frontend, apenas o método `handleExportarDisponiveis` e imports/assets novos. Nenhuma outra alteração no arquivo.