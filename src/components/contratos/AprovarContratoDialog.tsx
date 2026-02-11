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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useResponderAprovacao } from '@/hooks/useFluxoAprovacao';
import { useAuth } from '@/contexts/AuthContext';
import { APROVADOR_TIPO_LABELS, type ContratoAprovacao } from '@/types/assinaturas.types';
import { CheckCircle2, XCircle, RotateCcw } from 'lucide-react';

interface AprovarContratoDialogProps {
  open: boolean;
  onClose: () => void;
  aprovacao: ContratoAprovacao;
  contratoId: string;
}

export function AprovarContratoDialog({ 
  open, 
  onClose, 
  aprovacao,
  contratoId
}: AprovarContratoDialogProps) {
  const { user } = useAuth();
  const [observacao, setObservacao] = useState('');
  const [selectedAction, setSelectedAction] = useState<'aprovado' | 'reprovado' | 'em_revisao' | null>(null);
  
  const responderAprovacao = useResponderAprovacao();

  const handleSubmit = async () => {
    if (!selectedAction || !user) return;

    await responderAprovacao.mutateAsync({
      id: aprovacao.id,
      contratoId,
      status: selectedAction,
      observacao: observacao || undefined,
      aprovadorId: user.id
    });

    setObservacao('');
    setSelectedAction(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Responder Aprovação</DialogTitle>
          <DialogDescription>
            Etapa: {APROVADOR_TIPO_LABELS[aprovacao.tipo_aprovador]}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Action buttons */}
          <div className="grid grid-cols-3 gap-3">
            <Button
              type="button"
              variant={selectedAction === 'aprovado' ? 'default' : 'outline'}
              className={selectedAction === 'aprovado' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
              onClick={() => setSelectedAction('aprovado')}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Aprovar
            </Button>
            <Button
              type="button"
              variant={selectedAction === 'em_revisao' ? 'default' : 'outline'}
              className={selectedAction === 'em_revisao' ? 'bg-amber-600 hover:bg-amber-700' : ''}
              onClick={() => setSelectedAction('em_revisao')}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Revisão
            </Button>
            <Button
              type="button"
              variant={selectedAction === 'reprovado' ? 'default' : 'outline'}
              className={selectedAction === 'reprovado' ? 'bg-red-600 hover:bg-red-700' : ''}
              onClick={() => setSelectedAction('reprovado')}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reprovar
            </Button>
          </div>

          {/* Observation */}
          <div className="space-y-2">
            <Label htmlFor="observacao">
              Observação {(selectedAction === 'reprovado' || selectedAction === 'em_revisao') && '*'}
            </Label>
            <Textarea
              id="observacao"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder={
                selectedAction === 'reprovado' 
                  ? 'Informe o motivo da reprovação...'
                  : selectedAction === 'em_revisao'
                  ? 'Descreva o que precisa ser revisado...'
                  : 'Adicione uma observação (opcional)...'
              }
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={
              !selectedAction || 
              responderAprovacao.isPending ||
              ((selectedAction === 'reprovado' || selectedAction === 'em_revisao') && !observacao.trim())
            }
          >
            {responderAprovacao.isPending ? 'Salvando...' : 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
