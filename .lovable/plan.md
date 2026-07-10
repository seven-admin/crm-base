## Objetivo
Implementar a aba **Valores** em `/empreendimentos/:id` como tabela editável em lote, e remover a aba **Comercial** (também quebrada, sem `TabsContent` nem componente).

## Escopo

### 1. Novo componente `src/components/empreendimentos/ValoresTab.tsx`
Tabela editável listando todas as unidades do empreendimento com:

- Colunas: Bloco · Nº Unidade · Tipologia · Área (m²) · Valor atual (R$) · Novo valor (R$, input) · Valor/m² (calculado)
- Ordenação por bloco → número da unidade.
- Filtros no topo: bloco (select), tipologia (select), status (select), busca por número.
- Ações em lote (barra fixa quando há edições pendentes):
  - Botão **Salvar alterações** (grava apenas linhas modificadas via `update` em `seven_unidades`, uma requisição por linha em `Promise.all`; feedback com toast e contador).
  - Botão **Descartar** (reverte inputs).
- Ações em massa (aplica a linhas filtradas visíveis):
  - Reajuste percentual (+/- %) sobre valor atual.
  - Definir valor por m² (calcula novo valor = área × R$/m²).
  - Copiar `valor_base` da tipologia para as unidades daquela tipologia.
  - Todas essas apenas preenchem os inputs "Novo valor" (sem salvar) — usuário confirma com Salvar.
- Registro de histórico: para cada linha salva com valor alterado, inserir em `seven_unidade_historico_precos` (mantendo o padrão já usado por `HistoricoPrecoDialog`).
- Permissão: aba visível somente para `isAdminOrGestor` (mantém padrão atual). Editor só habilitado se o usuário tiver permissão de edição do empreendimento.

### 2. Ajustes em `src/pages/EmpreendimentoDetalhe.tsx`
- Importar `ValoresTab` e adicionar `<TabsContent value="valores">` dentro do bloco `isAdminOrGestor`.
- Remover `TabsTrigger value="comercial"` (linhas 305–310) — aba quebrada e sem escopo definido.

### 3. Sem mudanças de schema
Usa colunas já existentes: `seven_unidades.valor_atual`, `area_privativa`, `bloco_id`, `tipologia_id`, `numero`, `status`; e `seven_unidade_historico_precos` para histórico.

## Fora de escopo
- Nova aba Comercial (removida; se necessária no futuro, será planejada separadamente).
- Edição de tipologias/valor_base (segue na aba Tipologias).
