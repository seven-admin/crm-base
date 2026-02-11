import { useState } from 'react';
import { Loader2, Shield } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAlterarStatusAtividade } from '@/hooks/useAtividades';
import type { AtividadeStatus } from '@/types/atividades.types';
import { ATIVIDADE_STATUS_LABELS } from '@/types/atividades.types';

interface AlterarStatusAtividadeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  atividadeId: string;
  statusAtual: AtividadeStatus;
  onSuccess?: () => void;
}

export function AlterarStatusAtividadeDialog({
  open,
  onOpenChange,
  atividadeId,
  statusAtual,
  onSuccess,
}: AlterarStatusAtividadeDialogProps) {
  const [novoStatus, setNovoStatus] = useState<AtividadeStatus | ''>('');
  const [justificativa, setJustificativa] = useState('');
  const alterarStatus = useAlterarStatusAtividade();

  const statusDisponiveis: AtividadeStatus[] = ['pendente', 'concluida', 'cancelada'].filter(
    (s) => s !== statusAtual
  ) as AtividadeStatus[];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoStatus || !justificativa.trim()) return;

    await alterarStatus.mutateAsync({
      id: atividadeId,
      statusAtual,
      novoStatus,
      justificativa: justificativa.trim(),
    });

    setNovoStatus('');
    setJustificativa('');
    onOpenChange(false);
    onSuccess?.();
  };

  const handleClose = () => {
    setNovoStatus('');
    setJustificativa('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Ações de Administrador
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-muted-foreground">Status atual</Label>
            <Badge variant="outline" className="text-sm">
              {ATIVIDADE_STATUS_LABELS[statusAtual]}
            </Badge>
          </div>

          <div className="space-y-2">
            <Label htmlFor="novo-status">Alterar para</Label>
            <Select
              value={novoStatus}
              onValueChange={(v) => setNovoStatus(v as AtividadeStatus)}
            >
              <SelectTrigger id="novo-status">
                <SelectValue placeholder="Selecione o novo status" />
              </SelectTrigger>
              <SelectContent>
                {statusDisponiveis.map((status) => (
                  <SelectItem key={status} value={status}>
                    {ATIVIDADE_STATUS_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="justificativa">
              Justificativa <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="justificativa"
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              placeholder="Informe o motivo da alteração de status..."
              className="min-h-[100px] resize-none"
              required
            />
            <p className="text-xs text-muted-foreground">
              Esta ação será registrada no histórico de interações.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!novoStatus || !justificativa.trim() || alterarStatus.isPending}
            >
              {alterarStatus.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Aplicar Alteração
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
