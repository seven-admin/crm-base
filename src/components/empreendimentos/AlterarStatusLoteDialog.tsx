import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { UNIDADE_STATUS_LABELS, UNIDADE_STATUS_COLORS, type UnidadeStatus } from '@/types/empreendimentos.types';
import { useUpdateUnidadesStatusBatch } from '@/hooks/useUnidades';
import { cn } from '@/lib/utils';

interface AlterarStatusLoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empreendimentoId: string;
  selectedCount: number;
  selectedIds: string[];
  onSuccess: () => void;
}

export function AlterarStatusLoteDialog({
  open,
  onOpenChange,
  empreendimentoId,
  selectedCount,
  selectedIds,
  onSuccess,
}: AlterarStatusLoteDialogProps) {
  const [novoStatus, setNovoStatus] = useState<UnidadeStatus | ''>('');
  const updateStatusBatch = useUpdateUnidadesStatusBatch();

  const handleConfirm = () => {
    if (!novoStatus) return;

    updateStatusBatch.mutate(
      { ids: selectedIds, empreendimentoId, status: novoStatus },
      {
        onSuccess: () => {
          setNovoStatus('');
          onOpenChange(false);
          onSuccess();
        },
      }
    );
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      setNovoStatus('');
    }
    onOpenChange(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Alterar Status em Lote</DialogTitle>
          <DialogDescription>
            Selecione o novo status para {selectedCount} unidade(s).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Novo Status</label>
            <Select value={novoStatus} onValueChange={(v) => setNovoStatus(v as UnidadeStatus)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(UNIDADE_STATUS_LABELS) as [UnidadeStatus, string][]).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    <div className="flex items-center gap-2">
                      <div className={cn('w-3 h-3 rounded-full', UNIDADE_STATUS_COLORS[value])} />
                      {label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {novoStatus && (
            <div className="p-3 bg-muted/50 rounded-lg text-sm">
              <span className="text-muted-foreground">
                {selectedCount} unidade(s) serão alteradas para{' '}
              </span>
              <span className="inline-flex items-center gap-1.5 font-medium">
                <span className={cn('w-3 h-3 rounded-full inline-block', UNIDADE_STATUS_COLORS[novoStatus])} />
                {UNIDADE_STATUS_LABELS[novoStatus]}
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!novoStatus || updateStatusBatch.isPending}
          >
            {updateStatusBatch.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
