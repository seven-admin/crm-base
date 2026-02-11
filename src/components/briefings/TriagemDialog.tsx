import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTriarBriefing } from '@/hooks/useBriefings';
import type { Briefing, BriefingStatus } from '@/types/briefings.types';

interface TriagemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  briefing: Briefing | null;
}

export function TriagemDialog({ open, onOpenChange, briefing }: TriagemDialogProps) {
  const [status, setStatus] = useState<BriefingStatus>('triado');
  const [dataEntrega, setDataEntrega] = useState('');
  const [observacoes, setObservacoes] = useState('');

  const { mutate: triarBriefing, isPending } = useTriarBriefing();

  const handleSubmit = () => {
    if (!briefing) return;

    triarBriefing({
      id: briefing.id,
      status,
      data_entrega: dataEntrega || undefined,
      observacoes: observacoes || undefined,
    }, {
      onSuccess: () => {
        onOpenChange(false);
        setStatus('triado');
        setDataEntrega('');
        setObservacoes('');
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Triar Briefing</DialogTitle>
          <DialogDescription>
            Defina o status e a previsão de entrega para o briefing {briefing?.codigo}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as BriefingStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="triado">Triado</SelectItem>
                <SelectItem value="em_producao">Em Produção</SelectItem>
                <SelectItem value="revisao">Em Revisão</SelectItem>
                <SelectItem value="entregue">Entregue</SelectItem>
                <SelectItem value="aprovado">Aprovado</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Previsão de Entrega</Label>
            <Input
              type="date"
              value={dataEntrega}
              onChange={(e) => setDataEntrega(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Observações da Triagem</Label>
            <Textarea
              placeholder="Observações ou instruções adicionais..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? 'Salvando...' : 'Confirmar Triagem'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
