

# Duas alterações

## 1. Toggle de Destaque no Detalhe da Atividade

Adicionar um toggle de destaque (estrela) no `AtividadeDetalheDialog`, na seção do lado direito (junto aos badges/título), permitindo ativar/desativar o destaque diretamente na visualização de detalhes sem abrir o formulário de edição.

**Arquivo**: `src/components/atividades/AtividadeDetalheDialog.tsx`
- Importar `Star` do lucide-react e `Switch` do UI
- Adicionar um toggle inline na área de badges (linha ~144), com ícone de estrela e switch que chama `updateAtividade.mutate({ id, data: { destaque: !atividade.destaque } })`
- Visual consistente com o formulário: borda amber quando ativo

## 2. Gestor do Produto na Conversão de Tarefa

Atualmente o `ConverterTarefaDialog` usa `user?.id` (usuário logado) como `gestor_id`. O correto é buscar o gestor de produto do empreendimento selecionado via a RPC `get_gestor_empreendimento`.

**Arquivo**: `src/components/planejamento/ConverterTarefaDialog.tsx`
- Importar e usar `useGestorEmpreendimento(empreendimentoId)`
- Na inserção da atividade, usar `gestor_id: gestorEmpreendimento || user?.id` (fallback para o usuário logado caso não haja gestor cadastrado)

