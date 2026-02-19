
# Ajustes na Pagina /design-test - Cor Azul, Textos Reais, Labels, Formularios e Menu Colorido

## 1. Cor de destaque: #6d93c5

Substituir todas as ocorrencias de `#6366F1` (indigo) por `#6d93c5` em todos os componentes de teste:
- Logo circular no nav
- Underline do link ativo
- Avatar iniciais
- Icone e dot do HeroCard
- Links "See all" nos cards
- Cores de destaque em geral

## 2. Textos reais do sistema (estaticos)

Substituir os textos em ingles por textos encontrados nas paginas reais do sistema:

**Top Nav links**: Empreendimentos, Comercial, Financeiro, Contratos, Clientes (em vez de Dashboard, Projects, etc.)

**HeroCard**: 
- Titulo: "Painel Executivo"
- Texto suporte: "Acompanhe os indicadores de desempenho e metas comerciais. Compare resultados semanais com periodos anteriores."
- Metrica: "R$ 2.847.500" (VGV ou receita)
- Tooltip: valores em R$

**TestProjectList** -> Empreendimentos:
- Itens: "Residencial Aurora", "Comercial Centro", "Loteamento Vista Verde"
- Subtitles: localizacao ou incorporadora
- Status: "Ativo", "Em Revisao", "Rascunho"
- Tags: "Apartamento", "Comercial", "Loteamento"
- Descricao real sobre empreendimento

**TestTeamCard** -> Corretores:
- Titulo: "Corretores"
- Nomes brasileiros com cargos como "Corretor Pleno", "Gerente Comercial"
- Status: "Disponivel", "Ausente"

**TestDarkCard**:
- Titulo: "Novo Empreendimento"
- Texto: "Configure unidades, tabelas de preco e regras comerciais para lancar seu proximo empreendimento."
- Botao: "Cadastrar Empreendimento"

**TestMetricsCard**:
- Labels: "VGV Total", "Unidades Vendidas", "Clientes Ativos"
- Valores: "R$ 48.2M", "142", "1.847"

**TestTableCard** -> Negociacoes recentes:
- Titulo: "Negociacoes Recentes"
- Colunas: Cliente, Empreendimento, Status, Valor, Data
- Nomes de clientes e empreendimentos brasileiros
- Status: "Aprovada", "Pendente", "Em Analise", "Cancelada"

## 3. Labels de exemplo

Adicionar uma secao de labels/badges de exemplo abaixo da tabela, mostrando diferentes estilos:
- Status badges (Ativo, Inativo, Pendente, Aprovado, Cancelado, Em Analise)
- Badges com cores variadas e estilos pill
- Componente inline na propria pagina DesignTest.tsx

## 4. Elementos de formulario

Adicionar uma secao de formulario de teste abaixo dos labels, com:
- Input de texto (Nome do Cliente)
- Input de email
- Select/dropdown (Empreendimento)
- Textarea (Observacoes)
- Checkbox e Radio buttons
- Toggle/switch
- Botoes (primario, secundario, outline)
- Todos com estilo inline consistente com o visual da pagina (border-radius arredondado, cores suaves, fundo branco)

## 5. Menu com cores por modulo

Cada link do nav tera uma cor de underline/destaque seguindo as cores do sidebar:
- Empreendimentos: #10B981 (verde)
- Comercial: #F5941E (laranja)
- Financeiro: #F59E0B (amarelo)
- Contratos: #60A5FA (azul)
- Clientes: #8B5CF6 (roxo)

O link ativo mostra o underline na cor correspondente do modulo.

## Arquivos a modificar

| Arquivo | Mudanca |
|---|---|
| `src/pages/DesignTest.tsx` | Nav com cores por item, secao de labels, secao de formulario, textos em PT-BR |
| `src/components/design-test/TestHeroCard.tsx` | Textos reais, cor #6d93c5 |
| `src/components/design-test/TestProjectList.tsx` | Dados de empreendimentos reais |
| `src/components/design-test/TestTeamCard.tsx` | Dados de corretores, titulo "Corretores" |
| `src/components/design-test/TestDarkCard.tsx` | Texto sobre novo empreendimento |
| `src/components/design-test/TestMetricsCard.tsx` | Labels financeiros/comerciais reais |
| `src/components/design-test/TestTableCard.tsx` | Tabela de negociacoes com dados reais, coluna extra |

## Secao Tecnica

**Nav links** - Mudar o array `navLinks` para objetos com `label` e `color`. O underline usa a cor do item ao inves de uma cor fixa.

**Labels** - Secao full-width com fundo branco (card), renderizando badges em diferentes cores e estilos (filled, outline, soft).

**Formulario** - Secao full-width com fundo branco (card), usando elementos HTML nativos estilizados inline. Inputs com `borderRadius: 10`, `border: 1px solid #E2E8F0`, `padding: 10px 14px`. Select estilizado. Botao primario com `background: #6d93c5`. Layout em grid de 2 colunas para inputs, textarea full-width.
