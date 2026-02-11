import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MOTIVOS_PERDA } from '@/types/clientes.types';
import { AlertTriangle } from 'lucide-react';

interface MarcarPerdidoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (motivo: string) => void;
  isLoading?: boolean;
  clienteNome?: string;
}

export function MarcarPerdidoDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading,
  clienteNome,
}: MarcarPerdidoDialogProps) {
  const [motivoSelecionado, setMotivoSelecionado] = useState<string>('');
  const [observacao, setObservacao] = useState('');

  const handleConfirm = () => {
    if (!motivoSelecionado) return;
    
    const motivoFinal = observacao.trim()
      ? `${motivoSelecionado}: ${observacao.trim()}`
      : motivoSelecionado;
    
    onConfirm(motivoFinal);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset state when closing
      setMotivoSelecionado('');
      setObservacao('');
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Marcar Cliente como Perdido
          </DialogTitle>
          <DialogDescription>
            {clienteNome 
              ? `Registre o motivo da perda do cliente "${clienteNome}".`
              : 'Registre o motivo da perda do cliente.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Selecione o motivo principal:</Label>
            <RadioGroup
              value={motivoSelecionado}
              onValueChange={setMotivoSelecionado}
              className="space-y-2"
            >
              {MOTIVOS_PERDA.map((motivo) => (
                <div key={motivo} className="flex items-center space-x-2">
                  <RadioGroupItem value={motivo} id={motivo} />
                  <Label htmlFor={motivo} className="font-normal cursor-pointer">
                    {motivo}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacao" className="text-sm font-medium">
              Observações (opcional):
            </Label>
            <Textarea
              id="observacao"
              placeholder="Detalhes adicionais sobre a perda..."
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={!motivoSelecionado || isLoading}
          >
            {isLoading ? 'Salvando...' : 'Confirmar Perda'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
