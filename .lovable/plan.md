## Alterações em `src/components/empreendimentos/UnidadesTab.tsx` (função `handleExportarDisponiveis`)

### 1. Novo cabeçalho do PDF
Substituir o bloco de cabeçalho atual para ficar semelhante ao já aplicado na edge function `exportar-tabela-disponiveis`:

- **Esquerda:**
  - Linha 1 (título): `CRM 360 – {empreendimento.nome}` (remove "Seven Group 360" e coloca o nome do empreendimento)
  - Linha 2 (subtítulo): `Plataforma de Gestão Integrada` (mantido)
- **Direita:**
  - `Unidades Disponíveis`
  - `Gerado em {data}` (remove a duplicação do nome do empreendimento, já que agora aparece à esquerda)

### 2. Correção da linha quebrada (visto no AXIS, unidade 1102)
O row 1102 aparece com colunas deslocadas porque o `html2canvas` corta a linha exatamente no page break (o `pagebreak: avoid-all` do html2pdf não protege `<tr>` individualmente quando o `tbody` é grande).

Correção: aplicar `page-break-inside: avoid; break-inside: avoid;` em cada `<tr>` de dado e no `<tr>` separador, para que nenhuma linha seja fatiada entre páginas.

### Observações
- Nenhum outro arquivo é alterado.
- Não mexe na edge function nem em dados; é puramente ajuste de layout/renderização do PDF frontend.
