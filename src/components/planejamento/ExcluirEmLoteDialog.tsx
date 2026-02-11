import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { usePlanejamentoItens } from '@/hooks/usePlanejamentoItens';
import type { PlanejamentoItemWithRelations } from '@/types/planejamento.types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: Set<string>;
  items: PlanejamentoItemWithRelations[];
  empreendimentoId: string;
  onSuccess: () => void;
}

export function ExcluirEmLoteDialog({
  open,
  onOpenChange,
  selectedIds,
  items,
  empreendimentoId,
  onSuccess
}: Props) {
  const { deleteItemsBulk } = usePlanejamentoItens({ empreendimento_id: empreendimentoId });

  const selectedItems = items.filter(i => selectedIds.has(i.id));
  const displayLimit = 5;
  const displayedItems = selectedItems.slice(0, displayLimit);
  const remaining = selectedItems.length - displayLimit;

  const handleConfirm = async () => {
    await deleteItemsBulk.mutateAsync(Array.from(selectedIds));
    onSuccess();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Excluir Tarefas
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                Você está prestes a excluir <strong>{selectedItems.length} tarefa(s)</strong>.
                Esta ação não pode ser desfeita.
              </p>
              
              {displayedItems.length > 0 && (
                <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                  <p className="text-sm font-medium text-foreground mb-2">Tarefas selecionadas:</p>
                  <ul className="text-sm space-y-1">
                    {displayedItems.map(item => (
                      <li key={item.id} className="flex items-center gap-2">
                        <span className="text-muted-foreground">•</span>
                        <span className="truncate">{item.item}</span>
                      </li>
                    ))}
                    {remaining > 0 && (
                      <li className="text-muted-foreground italic">
                        ...e mais {remaining} {remaining === 1 ? 'item' : 'itens'}
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={deleteItemsBulk.isPending}
          >
            {deleteItemsBulk.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Excluindo...
              </>
            ) : (
              'Confirmar Exclusão'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
