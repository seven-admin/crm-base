# Módulo de Empreendimentos

Documentação funcional do módulo de Empreendimentos do CRM 360 — Seven Group 360.
Cobre a **listagem principal**, o módulo de **disponibilidade** (mapa e tabelas) e as
**automações** relacionadas.

---

## 1. Visão Geral

O módulo de Empreendimentos é o cadastro central de todos os projetos imobiliários
geridos no sistema. Cada empreendimento agrega blocos, tipologias, unidades, boxes
(vagas), mídias, documentos, equipe comercial e configurações de exibição.

**Onde fica:** menu lateral → grupo **Comercial** → **Empreendimentos**
(rota `/empreendimentos`).

**Tipos suportados**
- Loteamento
- Condomínio
- Prédio
- Comercial

**Status do ciclo de vida**
- Lançamento
- Em Obra
- Entregue

---

## 2. Listagem de Empreendimentos (`/empreendimentos`)

Tela principal do módulo. Apresenta todos os empreendimentos ativos em formato de
cards, com ferramentas de busca, filtros e criação.

### 2.1 Busca e filtros
- **Campo de busca**: pesquisa por nome do empreendimento (aplica ao pressionar
  Enter ou ao sair do campo).
- **Filtro de Tipo**: Loteamento, Condomínio, Prédio, Comercial ou todos.
- **Filtro de Status**: Lançamento, Em Obra, Entregue ou todos.

### 2.2 Agrupamento por UF
Os cards são agrupados por **estado (UF)** em seções recolhíveis (collapsible).
- A ordem é alfabética pelo nome do estado.
- Empreendimentos sem UF cadastrada aparecem em uma seção
  **"Sem estado definido"** ao final.
- Cada seção mostra a contagem de empreendimentos.

### 2.3 Card do empreendimento
Cada card resume:
- Nome, tipo, status e foto de capa.
- Contadores de unidades por status (disponíveis, reservadas, vendidas, em
  negociação, bloqueadas).
- Valor total e valor já vendido.
- Endereço resumido (cidade/UF).

### 2.4 Criação e edição
- Botão **"Novo Empreendimento"** abre o formulário de cadastro.
- Edição é feita acessando o detalhe do empreendimento.

### 2.5 Inativação
Empreendimentos podem ser inativados via switch — passam a ser ocultados das
listagens globais (Forecast, Negociações, Disponibilidade etc.) sem perder
histórico ou ser excluídos fisicamente.

### 2.6 Detalhe do empreendimento
Ao abrir um empreendimento, são exibidas abas internas:
- **Unidades** — cadastro, edição e exportação.
- **Blocos** — agrupamentos de unidades (torres/quadras).
- **Tipologias** — plantas e características (área, quartos, vagas etc.).
- **Boxes** — vagas de estacionamento, com vínculo opcional a unidades.
- **Fachadas** — variações visuais associadas às unidades.
- **Mídias** — fotos, vídeos, tours, PDFs e links (com definição de capa).
- **Documentos** — registro de incorporação, matrícula, projetos, licenças.
- **Equipe** — corretores e imobiliárias autorizadas.
- **Mapa** — visualização e edição do mapa interativo (quando aplicável).

### 2.7 Exportar Disponíveis (PDF)
Na aba **Unidades**, o botão **"Exportar Disponíveis (PDF)"** gera um relatório
focado em unidades com status `disponível`.

- Formato A4 retrato.
- 7 colunas: **Número, Bloco, Andar, Tipologia, Box, Área, Valor**.
- Ordenação natural por Bloco → Andar → Número.
- Cabeçalho: "CRM 360 – Seven Group 360", subtítulo "Unidades Disponíveis",
  nome do empreendimento e data/hora de geração.
- Rodapé: total de unidades disponíveis + texto customizável por empreendimento
  (campo `texto_rodape_relatorio`, configurado no cadastro do empreendimento —
  útil para validade comercial, condições gerais, etc.).

---

## 3. Disponibilidade

Engloba a visualização do estoque de unidades em tempo real. Existem duas
vertentes complementares:

### 3.1 Mapa Interativo (interno)

Disponível na aba **Mapa** do detalhe do empreendimento e na rota dedicada
`MapaUnidadesPage`.

- Aplicável aos tipos **Loteamento** e **Condomínio** (projetos com planta
  horizontal/quadras).
- Visualização gráfica com polígonos por unidade, coloridos pelo status.
- **Legenda configurável** por empreendimento (campo
  `legenda_status_visiveis`) — define quais status aparecem na legenda
  pública.
- **Formato do label** configurável (campo `mapa_label_formato`) — define o
  que aparece sobre cada lote/unidade (ex.: número, quadra, área).
- A edição (criação/ajuste de polígonos) é restrita à equipe interna.
- Clientes, corretores e parceiros sempre acessam o mapa em **modo leitura**.

### 3.2 Portal Incorporador — Disponibilidade
(`/portal-incorporador/disponibilidade`)

Área para o incorporador acompanhar o estoque dos seus empreendimentos.

- **Seletor de empreendimento**: lista apenas os empreendimentos vinculados ao
  usuário (via filtro global do Portal Incorporador).
- **UI adaptativa por tipo**:
  - **Loteamento / Condomínio** → abas **Mapa** (read-only) e **Unidades**
    (tabela).
  - **Prédio / Comercial** → apenas a tabela de unidades.
- **Tabela de Unidades**:
  - Colunas: Quadra/Bloco, Unidade, Status (badge colorido), Valor.
  - Filtro por bloco quando o empreendimento tiver mais de um.
  - Contador "X disponíveis de Y".
  - Ordenação natural por Bloco → Andar → Número.
- **Status exibidos**: Disponível, Reservada, Vendida, Bloqueada.
- Acesso somente leitura — não permite alterar unidades.

---

## 4. Automação (Webhook / n8n)

Para integrações externas (ex.: WhatsApp, automações de marketing), existe a
edge function `export-unidades-pdf` que gera o **mesmo PDF de disponíveis** sob
demanda.

- **Entrada**: apenas `empreendimento_id`.
- **Filtro fixo**: força status `disponível` (ignora qualquer filtro extra do
  payload — replica 100% o comportamento do botão da tela).
- **Saída**: JSON contendo URL assinada do arquivo (TTL 1 hora), path no
  storage, total de unidades, nome do empreendimento e data de expiração.
- O PDF gerado é idêntico em layout ao "Exportar Disponíveis (PDF)" do
  módulo, incluindo cabeçalho, colunas e rodapé customizado.

---

## 5. Referências Cruzadas

- **Negociações / Forecast**: dependem dos status das unidades cadastradas
  aqui (uma venda muda automaticamente a unidade para `vendida` via trigger
  de banco).
- **Disponibilidade no Portal do Corretor**: apresenta o **Mapa de Unidades**
  em modo somente leitura, herdado do cadastro feito neste módulo.
- **Inativação**: ao inativar um empreendimento, ele desaparece das
  listagens globais mas permanece nos relatórios históricos.
