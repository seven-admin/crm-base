
# Cadastro Individual de Box

## O que muda

Adicionar um botao "Novo Box" ao lado do botao "Criar em Lote" na toolbar do `BoxesTab`, que abre um formulario simples para cadastrar um unico box.

## Detalhes

### Novo componente: `src/components/empreendimentos/BoxForm.tsx`
- Formulario com campos: Numero, Bloco (opcional), Tipo de vaga, Coberto (switch), Valor (opcional), Observacoes (opcional)
- Usa o hook `useCreateBox` que ja existe em `useBoxes.ts`
- Layout similar ao `BoxBulkForm` para manter consistencia visual
- Sem campos de quantidade/prefixo/numero_inicial (sao exclusivos do lote)

### Alteracao: `src/components/empreendimentos/BoxesTab.tsx`
- Adicionar estado `formIndividualOpen` para controlar o dialog
- Adicionar botao "Novo Box" (com icone `Plus`) ao lado dos botoes existentes na toolbar (antes do "Criar em Lote")
- Adicionar um `Dialog` para o formulario individual, similar ao dialog de criacao em lote ja existente

### Nenhuma alteracao de banco ou hooks
- O hook `useCreateBox` ja existe e aceita `BoxFormData`
- O tipo `BoxFormData` ja tem todos os campos necessarios (numero, tipo, coberto, bloco_id, valor, observacoes)
