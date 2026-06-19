## Objetivo

Fazer o PDF gerado pela edge function `export-unidades-pdf` (usada na automação n8n) sair **idêntico** ao gerado pelo botão "Exportar Disponíveis (PDF)" da tela de Empreendimentos → aba Unidades.

## Por que não dá para reusar literalmente o mesmo código

O botão da tela usa `html2pdf.js` (HTML + `html2canvas` rodando no navegador). A edge function roda em Deno, sem DOM nem Chromium, então não é possível executar `html2pdf`. A solução é **replicar o mesmo layout** usando `pdf-lib` (que já é a lib instalada na função).

## O que vai mudar

Arquivo: `supabase/functions/export-unidades-pdf/index.ts`

1. **Filtro fixo de disponíveis** — ignora qualquer `status/bloco_id/quartos/valor_min/valor_max` do payload; força `status = 'disponivel'`. O `BodySchema` fica só com `empreendimento_id`.
2. **Ordenação igual ao botão** — Bloco/Quadra → Andar → Número, usando `localeCompare` numérico (pt-BR).
3. **Layout A4 retrato** com as mesmas 7 colunas, na mesma ordem:
   - `Número` (ou `Lote` se o empreendimento for loteamento)
   - `Bloco` (ou `Quadra` se loteamento)
   - `Andar` (com sufixo "º")
   - `Tipologia`
   - `Box` (lista `numero (tipo)` separada por vírgula)
   - `Área (m²)` formatada pt-BR
   - `Valor (R$)` em BRL
4. **Cabeçalho idêntico ao botão**:
   - Esquerda: "CRM 360 – Seven Group 360" + "Plataforma de Gestão Integrada"
   - Direita: "Unidades Disponíveis" + nome do empreendimento + "Gerado em dd/MM/yyyy HH:mm:ss"
   - Linha divisória cinza abaixo
5. **Rodapé idêntico**:
   - "Total de unidades disponíveis: N" alinhado à direita
   - Bloco de `texto_rodape_relatorio` (quando existir no empreendimento), separado por linha cinza, com quebras de linha preservadas
6. **Tipografia e cores** próximas ao HTML:
   - Helvetica para textos
   - Cabeçalho da tabela em fundo cinza claro, com linha inferior mais escura
   - Linhas separadas por filete cinza claro (1px), sem zebra
7. **Paginação automática** — cabeçalho da tabela repetido em cada página; rodapé só na última página.
8. **Query** — incluir join de `boxes` para preencher a coluna Box (hoje a função não traz boxes).
9. **Nome do arquivo no Storage** — manter o padrão atual do upload, mas mudar o sufixo lógico para `Unidades_Disponiveis_<NomeEmpreendimento>_<dd-MM-yyyy>.pdf` (apenas dentro do path; a URL assinada continua igual).
10. **Resposta JSON** — sem mudança de contrato: `{ url, path, total, empreendimento, status: 'disponivel', expira_em }`.

## Contrato de entrada simplificado

```json
{ "empreendimento_id": "uuid" }
```

Qualquer campo extra é ignorado silenciosamente (compatibilidade com chamadas atuais).

## Fora de escopo

- Não mexer no botão da tela (`UnidadesTab.tsx`).
- Não alterar autenticação (continua só `x-api-token`).
- Não alterar bucket nem política de URL assinada (1h).
