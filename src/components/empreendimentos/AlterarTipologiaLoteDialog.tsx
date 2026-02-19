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
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { useTipologias } from '@/hooks/useTipologias';
import { useUpdateUnidadesTipologiaBatch } from '@/hooks/useUnidades';

interface AlterarTipologiaLoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empreendimentoId: string;
  selectedCount: number;
  selectedIds: string[];
  onSuccess: () => void;
}

export function AlterarTipologiaLoteDialog({
  open,
  onOpenChange,
  empreendimentoId,
  selectedCount,
  selectedIds,
  onSuccess,
}: AlterarTipologiaLoteDialogProps) {
  const [tipologiaId, setTipologiaId] = useState('');
  const [atualizarArea, setAtualizarArea] = useState(true);
  const { data: tipologias } = useTipologias(empreendimentoId);
  const updateTipologiaBatch = useUpdateUnidadesTipologiaBatch();

  const tipologiaSelecionada = tipologias?.find(t => t.id === tipologiaId);

  const handleConfirm = () => {
    if (!tipologiaId) return;

    updateTipologiaBatch.mutate(
      {
        ids: selectedIds,
        empreendimentoId,
        tipologiaId,
        areaPrivativa: atualizarArea && tipologiaSelecionada?.area_privativa
          ? tipologiaSelecionada.area_privativa
          : undefined,
      },
      {
        onSuccess: () => {
          setTipologiaId('');
          setAtualizarArea(true);
          onOpenChange(false);
          onSuccess();
        },
      }
    );
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      setTipologiaId('');
      setAtualizarArea(true);
    }
    onOpenChange(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Alterar Tipologia em Lote</DialogTitle>
          <DialogDescription>
            Selecione a nova tipologia para {selectedCount} unidade(s).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nova Tipologia</label>
            <Select value={tipologiaId} onValueChange={setTipologiaId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a tipologia" />
              </SelectTrigger>
              <SelectContent>
                {tipologias?.map((tip) => (
                  <SelectItem key={tip.id} value={tip.id}>
                    {tip.nome}
                    {tip.area_privativa ? ` (${tip.area_privativa} m²)` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {tipologiaId && tipologiaSelecionada?.area_privativa && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="atualizar-area"
                checked={atualizarArea}
                onCheckedChange={(checked) => setAtualizarArea(checked === true)}
              />
              <label htmlFor="atualizar-area" className="text-sm cursor-pointer">
                Atualizar área privativa para {tipologiaSelecionada.area_privativa} m²
              </label>
            </div>
          )}

          {tipologiaId && tipologiaSelecionada && (
            <div className="p-3 bg-muted/50 rounded-lg text-sm">
              <span className="text-muted-foreground">
                {selectedCount} unidade(s) serão alteradas para{' '}
              </span>
              <span className="font-medium">{tipologiaSelecionada.nome}</span>
              {atualizarArea && tipologiaSelecionada.area_privativa && (
                <span className="text-muted-foreground">
                  {' '}com área de {tipologiaSelecionada.area_privativa} m²
                </span>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!tipologiaId || updateTipologiaBatch.isPending}
          >
            {updateTipologiaBatch.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
