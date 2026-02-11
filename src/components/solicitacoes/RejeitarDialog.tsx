import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, XCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

interface RejeitarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (motivo: string) => void;
  isLoading?: boolean;
}

export function RejeitarDialog({ 
  open, 
  onOpenChange, 
  onConfirm, 
  isLoading 
}: RejeitarDialogProps) {
  const [motivo, setMotivo] = useState('');

  const handleConfirm = () => {
    if (motivo.trim()) {
      onConfirm(motivo);
      setMotivo('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <XCircle className="h-5 w-5" />
            Rejeitar Solicitação
          </DialogTitle>
          <DialogDescription>
            Informe o motivo da rejeição. Esta informação será enviada ao corretor.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Label htmlFor="motivo">Motivo da Rejeição *</Label>
          <Textarea
            id="motivo"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ex: Unidade já reservada para outro cliente, documentação pendente, etc."
            rows={4}
            className="mt-2"
          />
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button 
            variant="destructive"
            onClick={handleConfirm}
            disabled={!motivo.trim() || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Rejeitando...
              </>
            ) : (
              'Confirmar Rejeição'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
