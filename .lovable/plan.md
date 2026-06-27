# Documentação: Módulo de Empreendimentos

Criar arquivo `DOCUMENTACAO_EMPREENDIMENTOS.md` na raiz do projeto descrevendo de forma funcional (não técnica) as três áreas solicitadas.

## Estrutura do documento

### 1. Visão Geral
- O que é o módulo e onde fica na navegação
- Tipos suportados: Loteamento, Condomínio, Prédio, Comercial
- Status do ciclo de vida: Lançamento, Em Obra, Entregue

### 2. Listagem de Empreendimentos (`/empreendimentos`)
- **Busca e filtros**: campo de busca textual, filtro por Tipo e por Status
- **Agrupamento por UF**: cards agrupados por estado (collapsible), ordem alfabética pelo nome do estado, "Sem estado definido" no final
- **Card do empreendimento**: nome, tipo, status, foto de capa, contadores de unidades (disponíveis/reservadas/vendidas), valor total e vendido
- **Criação**: botão "Novo Empreendimento" abre formulário
- **Inativação**: switch para ocultar das listagens globais (sem exclusão física)
- **Detalhe**: abas internas (Unidades, Blocos, Tipologias, Boxes, Mídias, Documentos, Equipe, Mapa)
- **Exportar Disponíveis (PDF)**: gera relatório das unidades em status `disponivel` em A4 retrato (Número, Bloco, Andar, Tipologia, Box, Área, Valor) + rodapé customizado por empreendimento (`texto_rodape_relatorio`)

### 3. Disponibilidade
Cobre duas vertentes:

**3.1 Mapa Interativo (interno – aba "Mapa" / `MapaUnidadesPage`)**
- Disponível para tipos `loteamento` e `condominio`
- Visualização gráfica com polígonos por unidade, cores por status
- Legenda configurável (`legenda_status_visiveis`)
- Formato de label configurável (`mapa_label_formato`)
- Edição reservada à equipe interna; clientes/corretores em modo leitura

**3.2 Portal Incorporador – Disponibilidade (`/portal-incorporador/disponibilidade`)**
- Seletor de empreendimento (apenas os vinculados ao usuário, via filtro global do portal)
- Para Loteamento/Condomínio: abas **Mapa** (read-only) e **Unidades** (tabela)
- Para Prédio/Comercial: apenas tabela de unidades (UI adaptativa)
- Tabela: Quadra/Bloco, Unidade, Status (badge colorido), Valor; filtro por bloco quando houver mais de um; contador "X disponíveis de Y"
- Ordenação natural por Bloco → Andar → Número
- Status exibidos: Disponível, Reservada, Vendida, Bloqueada

### 4. Automação (Webhook / n8n)
- Edge function `export-unidades-pdf`: gera o mesmo PDF de disponíveis sob demanda
- Recebe apenas `empreendimento_id`; força status `disponivel`
- Retorna URL assinada (TTL 1h) + path + total + nome do empreendimento

## Escopo
- Apenas criação de 1 arquivo `.md` em português
- Não altera código, componentes ou edge functions
