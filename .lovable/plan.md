
# Ajustes na Pagina /design-test

## Mudancas Solicitadas

### 1. Background da pagina
- Trocar `#F5F6FA` por `#e8eaec`

### 2. Cards menores e sem fundo branco
- Remover o fundo branco de **todos os cards exceto o Hero** (Statistics)
- Cards secundarios (Team, Dark, Projects, Metrics) ficam com `background: transparent` — o conteudo "flutua" sobre o fundo cinza
- Somente o card Hero mantem `background: #FFFFFF` com sombra

### 3. Layout menos "esticado"
- Remover a altura fixa de `calc(100vh - 64px)` do body — deixar o conteudo fluir naturalmente com alturas automaticas
- Remover os `flex: 0 0 58%` e `flex: 0 0 42%` que forcam os cards a ocupar percentuais fixos da viewport
- Cards ganham alturas naturais baseadas no conteudo, com padding reduzido onde necessario

### 4. Novo componente: TestTableCard
- Criar `src/components/design-test/TestTableCard.tsx` com uma tabela de exemplo no estilo clean da pagina
- Tabela com dados mock (ex: lista de transacoes ou pedidos recentes)
- Estilo: fundo branco, border-radius 20px, sombra suave, header discreto
- Colunas: Nome, Status (badge pill), Valor, Data
- 5-6 linhas de dados ficticios
- Posicionamento: adicionar abaixo dos cards existentes como uma secao full-width

## Arquivos Alterados

| Arquivo | Mudanca |
|---|---|
| `src/pages/DesignTest.tsx` | Background #e8eaec, remover alturas fixas, adicionar TestTableCard |
| `src/components/design-test/TestHeroCard.tsx` | Nenhuma (ja tem fundo branco) |
| `src/components/design-test/TestProjectList.tsx` | Background transparente |
| `src/components/design-test/TestTeamCard.tsx` | Background transparente |
| `src/components/design-test/TestMetricsCard.tsx` | Background transparente |
| `src/components/design-test/TestDarkCard.tsx` | Mantem background escuro (e uma excecao por design) |
| `src/components/design-test/TestTableCard.tsx` | **Criar** - tabela de exemplo com fundo branco |

## Secao Tecnica

**DesignTest.tsx**: Trocar `background: '#F5F6FA'` por `'#e8eaec'`. Remover `height: 'calc(100vh - 64px)'` e os `flex: '0 0 58%'` / `flex: '0 0 42%'`. Adicionar secao full-width abaixo das duas colunas para a tabela.

**Cards secundarios** (ProjectList, Team, Metrics): Trocar `background: '#FFFFFF'` por `'transparent'` e remover `boxShadow`.

**TestTableCard.tsx**: Novo componente com tabela HTML estilizada inline (mesma abordagem dos outros componentes de teste). Fundo branco, border-radius 20px, sombra suave. Dados mock de transacoes com colunas: Nome, Status, Valor, Data. Header com titulo + botao de filtro.
