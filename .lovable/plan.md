

# Adicionar exclusão em lote no Forecast (somente super_admin)

## Solução

### `src/components/forecast/ForecastBatchStatusDialog.tsx`

- Importar `usePermissions` e `Trash2` icon
- Chamar `isSuperAdmin()` para verificar se o usuário logado é super_admin
- Adicionar botão "Excluir selecionadas" (vermelho, ícone Trash2) na área de ações, visível **apenas para super_admin**
- Ao clicar, exibir estado de confirmação inline (texto "Confirmar exclusão?" com botões Sim/Não) para evitar exclusões acidentais
- Na confirmação, executar `supabase.from('atividades').delete().in('id', ids)` via `useMutation`
- Após sucesso: invalidar queries de forecast, exibir toast, fechar dialog
- A FK `negociacoes_atividade_origem_id_fkey` já usa `ON DELETE SET NULL`, então não há risco de integridade

### Arquivo a modificar
- `src/components/forecast/ForecastBatchStatusDialog.tsx`

