

# Desativar/Ativar Empreendimento com Toggle

## Objetivo
Adicionar um Switch na pagina de detalhe do empreendimento que permite desativar (ocultar de todos) ou reativar o empreendimento. Diferente da exclusao, eh uma acao reversivel e visivel apenas para admin/gestor.

## Solucao

### Arquivo: `src/pages/EmpreendimentoDetalhe.tsx`

1. Importar `Switch` de `@/components/ui/switch` e o hook `useUpdateEmpreendimento` (ja existente)
2. Adicionar um Switch na area de acoes do header (ao lado dos botoes Editar/Excluir), visivel apenas para `canDelete` (super_admin/admin):

```tsx
<div className="flex items-center gap-2">
  <Switch
    checked={empreendimento.is_active}
    onCheckedChange={(checked) => {
      updateEmpreendimento.mutate({ id, data: { is_active: checked } });
    }}
  />
  <span className="text-sm text-muted-foreground">
    {empreendimento.is_active ? 'Ativo' : 'Inativo'}
  </span>
</div>
```

3. Quando `is_active = false`, exibir um banner de alerta no topo da pagina informando que o empreendimento esta desativado e nao aparece para os demais usuarios.

### Arquivo: `src/hooks/useEmpreendimentos.ts`

O `useUpdateEmpreendimento` ja suporta atualizar qualquer campo parcial, incluindo `is_active`. Nenhuma alteracao necessaria no hook.

A query `useEmpreendimentos` ja filtra por `.eq('is_active', true)`, entao empreendimentos desativados serao automaticamente ocultados de todas as listagens (pagina principal, portal do corretor, selects, etc).

O `useEmpreendimento` (detalhe individual) **nao** filtra por `is_active`, permitindo que admins ainda acessem a pagina de detalhe via URL direta.

### Resultado
- Admin/super_admin ve o toggle na pagina de detalhe
- Ao desativar, o empreendimento some de todas as listagens
- Um banner amarelo aparece no detalhe indicando que esta inativo
- A acao eh reversivel: basta reativar pelo switch

