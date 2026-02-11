import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle } from 'lucide-react';
import { MOTIVOS_CANCELAMENTO_ATIVIDADE } from '@/types/atividades.types';

interface CancelarAtividadeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  atividadeTitulo?: string;
  onConfirm: (motivo: string, observacoes?: string) => void;
  isLoading?: boolean;
}

export function CancelarAtividadeDialog({
  open,
  onOpenChange,
  atividadeTitulo,
  onConfirm,
  isLoading = false,
}: CancelarAtividadeDialogProps) {
  const [motivoSelecionado, setMotivoSelecionado] = useState<string>('');
  const [observacoes, setObservacoes] = useState('');

  const handleConfirm = () => {
    if (!motivoSelecionado) return;
    
    // Monta o motivo final: motivo selecionado + observações (se houver)
    const motivoFinal = observacoes.trim()
      ? `${motivoSelecionado}: ${observacoes.trim()}`
      : motivoSelecionado;
    
    onConfirm(motivoFinal, observacoes);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setMotivoSelecionado('');
      setObservacoes('');
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Cancelar Atividade
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {atividadeTitulo && (
            <p className="text-sm text-muted-foreground">
              Atividade: <strong className="text-foreground">{atividadeTitulo}</strong>
            </p>
          )}

          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Selecione o motivo do cancelamento:
            </Label>
            <RadioGroup
              value={motivoSelecionado}
              onValueChange={setMotivoSelecionado}
              className="space-y-2"
            >
              {MOTIVOS_CANCELAMENTO_ATIVIDADE.map((motivo) => (
                <div
                  key={motivo}
                  className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-muted/50 cursor-pointer"
                  onClick={() => setMotivoSelecionado(motivo)}
                >
                  <RadioGroupItem value={motivo} id={motivo} />
                  <Label htmlFor={motivo} className="flex-1 cursor-pointer text-sm">
                    {motivo}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes" className="text-sm font-medium">
              Observações (opcional)
            </Label>
            <Textarea
              id="observacoes"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Detalhes adicionais sobre o cancelamento..."
              className="resize-none"
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
            Voltar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={!motivoSelecionado || isLoading}
          >
            {isLoading ? 'Cancelando...' : 'Confirmar Cancelamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
