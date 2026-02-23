
# Alterar Status de Atividades em Lote no Forecast (Super Admin)

## Objetivo
Adicionar ao dashboard de Forecast a capacidade de selecionar atividades por categoria/status e alterar o status delas em lote. Funcionalidade restrita a usuarios com role `super_admin`.

## Como vai funcionar

1. **Botao "Acoes em Lote"** aparece no header do Forecast somente para super_admin
2. Ao ativar o modo lote, os CategoriaCards ficam clicaveis nos badges de status (Abertas, Fechadas, Atrasadas, Futuras)
3. Clicar em um badge abre um dialog listando as atividades daquele grupo (categoria + status)
4. O usuario seleciona atividades individualmente ou todas, escolhe o novo status (Pendente, Concluida, Cancelada) e confirma
5. As atividades sao atualizadas em lote no banco

## Arquivos a criar

### `src/components/forecast/ForecastBatchStatusDialog.tsx`
Dialog que:
- Recebe filtros (categoria, status group como "abertas"/"atrasadas"/"fechadas"/"futuras") e periodo
- Busca atividades correspondentes via `useAtividades`
- Exibe lista com checkboxes para selecao
- Select para novo status destino
- Botao confirmar que chama o mutation em lote

## Arquivos a alterar

### `src/hooks/useAtividades.ts`
- Criar hook `useAlterarStatusEmLote()` -- mutation que recebe `{ ids: string[], status: AtividadeStatus }` e faz update em lote no Supabase

### `src/components/forecast/CategoriaCard.tsx`
- Adicionar prop opcional `onBadgeClick?: (statusGroup: string) => void`
- Quando presente, badges (Abertas, Fechadas, Atrasadas, Futuras) ficam clicaveis e chamam o callback

### `src/pages/Forecast.tsx`
- Importar `useAuth` para checar `role === 'super_admin'`
- Adicionar estado para modo lote e para o dialog
- Renderizar botao "Acoes em Lote" apenas se super_admin
- Passar `onBadgeClick` para os CategoriaCards quando modo lote ativo
- Renderizar `ForecastBatchStatusDialog`

## Detalhes tecnicos

### Hook `useAlterarStatusEmLote`
```typescript
export function useAlterarStatusEmLote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: AtividadeStatus }) => {
      const { error } = await supabase
        .from('atividades')
        .update({ status })
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: (_, { ids }) => {
      queryClient.invalidateQueries({ queryKey: ['atividades'] });
      queryClient.invalidateQueries({ queryKey: ['forecast'] });
      invalidateDashboards(queryClient);
      toast.success(`${ids.length} atividade(s) atualizada(s)!`);
    },
  });
}
```

### Fluxo do dialog
- O dialog recebe `categoria`, `statusGroup` (abertas/fechadas/atrasadas/futuras), `gestorId`, `dataInicio`, `dataFim`
- Converte statusGroup para filtro real (abertas/atrasadas -> status=pendente, fechadas -> status=concluida, futuras -> status=pendente + data_inicio > hoje)
- Lista atividades com checkbox + titulo + gestor + data
- Select no topo para escolher novo status
- Botao "Alterar Status" que chama `useAlterarStatusEmLote`

### Permissao
- Verificacao client-side via `useAuth()` -> `role === 'super_admin'`
- RLS no banco ja restringe updates conforme politicas existentes
