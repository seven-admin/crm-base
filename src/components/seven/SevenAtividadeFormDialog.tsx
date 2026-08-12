import { useEffect, useState } from 'react';
import { CalendarPlus, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCriarSevenAtividade } from '@/hooks/useSevenAgenda';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function localDateTimeMinimum() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

export function SevenAtividadeFormDialog({ open, onOpenChange }: Props) {
  const [titulo, setTitulo] = useState('');
  const [dataHora, setDataHora] = useState('');
  const [local, setLocal] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const criar = useCriarSevenAtividade();

  useEffect(() => {
    if (!open) return;
    setTitulo('');
    setDataHora('');
    setLocal('');
    setObservacoes('');
  }, [open]);

  const canSubmit = titulo.trim() && dataHora;

  const submit = async () => {
    if (!canSubmit) return;
    await criar.mutateAsync({
      titulo: titulo.trim(),
      dataHora: new Date(dataHora).toISOString(),
      local: local.trim() || undefined,
      observacoes: observacoes.trim() || undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">Agenda Seven</p>
          <DialogTitle>Nova atividade</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="seven-ativ-titulo">Título *</Label>
            <Input id="seven-ativ-titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} autoFocus placeholder="Ex.: Reunião de alinhamento" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="seven-ativ-data">Data e hora *</Label>
              <Input id="seven-ativ-data" type="datetime-local" min={localDateTimeMinimum()} value={dataHora} onChange={(e) => setDataHora(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seven-ativ-local">Local</Label>
              <Input id="seven-ativ-local" value={local} onChange={(e) => setLocal(e.target.value)} placeholder="Opcional" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="seven-ativ-obs">Observações</Label>
            <Textarea id="seven-ativ-obs" value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={!canSubmit || criar.isPending}>
            {criar.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CalendarPlus className="mr-2 h-4 w-4" />}
            Criar atividade
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
