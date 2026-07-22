import { useEffect, useState } from 'react';
import { UserPlus } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCriarLeadIndicado } from '@/hooks/useArqo';
import { useEmpreendimentosSelect } from '@/hooks/useEmpreendimentosSelect';

interface LeadIndicadoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadOrigemId: string;
  empreendimentoId?: string | null;
}

export function LeadIndicadoDialog({ open, onOpenChange, leadOrigemId, empreendimentoId }: LeadIndicadoDialogProps) {
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [selectedEmpreendimento, setSelectedEmpreendimento] = useState(empreendimentoId ?? '__none__');
  const criar = useCriarLeadIndicado();
  const { data: empreendimentos = [] } = useEmpreendimentosSelect({ enabled: open });

  useEffect(() => {
    if (!open) return;
    setNome('');
    setTelefone('');
    setEmail('');
    setObservacoes('');
    setSelectedEmpreendimento(empreendimentoId ?? '__none__');
  }, [open, empreendimentoId]);

  const canSubmit = nome.trim() && (telefone.trim() || email.trim());

  const submit = async () => {
    if (!canSubmit) return;
    await criar.mutateAsync({
      leadOrigemId,
      nome: nome.trim(),
      telefone: telefone.trim(),
      email: email.trim(),
      empreendimentoId: selectedEmpreendimento === '__none__' ? null : selectedEmpreendimento,
      observacoes: observacoes.trim(),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">Indicação durante o contato</p>
          <DialogTitle>Gerar novo lead indicado</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="indicacao-nome">Nome *</Label>
            <Input id="indicacao-nome" value={nome} onChange={(event) => setNome(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="indicacao-telefone">Telefone</Label>
            <Input id="indicacao-telefone" value={telefone} onChange={(event) => setTelefone(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="indicacao-email">E-mail</Label>
            <Input id="indicacao-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Empreendimento de interesse</Label>
            <Select value={selectedEmpreendimento} onValueChange={setSelectedEmpreendimento}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Não informado</SelectItem>
                {empreendimentos.map((item) => <SelectItem key={item.id} value={item.id}>{item.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="indicacao-observacoes">Observações</Label>
            <Textarea id="indicacao-observacoes" value={observacoes} onChange={(event) => setObservacoes(event.target.value)} rows={3} />
          </div>
          <p className="text-xs text-muted-foreground sm:col-span-2">Informe ao menos telefone ou e-mail. O novo lead será enviado para a fila do mesmo grupo.</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={!canSubmit || criar.isPending}>
            <UserPlus className="mr-2 h-4 w-4" /> {criar.isPending ? 'Criando...' : 'Gerar lead'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
