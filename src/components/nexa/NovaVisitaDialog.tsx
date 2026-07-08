import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateVisita, useEmpreendimentosAtivos, useImobiliariasAtivas, getOrCreatePessoa } from '@/hooks/useNexa';
import { toast } from 'sonner';

export function NovaVisitaDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const create = useCreateVisita();
  const { data: emps } = useEmpreendimentosAtivos();
  const { data: imobs } = useImobiliariasAtivas();

  const [jaLead, setJaLead] = useState(false);
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [empId, setEmpId] = useState<string>('');
  const [imobId, setImobId] = useState<string>('');
  const [dataHora, setDataHora] = useState('');
  const [obs, setObs] = useState('');
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setJaLead(false); setNome(''); setTelefone(''); setEmail('');
    setEmpId(''); setImobId(''); setDataHora(''); setObs('');
  };

  const submit = async () => {
    if (!nome || !telefone || !empId || !dataHora) {
      toast.error('Preencha nome, telefone, empreendimento e data/hora.');
      return;
    }
    setSaving(true);
    try {
      let cliente_id: string | null = null;
      if (jaLead) {
        cliente_id = await getOrCreatePessoa(nome, telefone, email || undefined);
      }
      await create.mutateAsync({
        cliente_id,
        visitante_nome: jaLead ? null : nome,
        visitante_telefone: jaLead ? null : telefone,
        empreendimento_id: empId,
        imobiliaria_parceira_id: imobId || null,
        data_hora: new Date(dataHora).toISOString(),
        observacoes: obs || null,
      });
      reset();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Nova visita</DialogTitle></DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between bg-muted p-3 rounded-lg">
            <div>
              <Label htmlFor="jalead" className="font-medium">Este visitante já é um lead do grupo?</Label>
              <p className="text-xs text-muted-foreground">
                Se sim, vinculamos ao cadastro de clientes. Se não, guardamos apenas nome e telefone.
              </p>
            </div>
            <Switch id="jalead" checked={jaLead} onCheckedChange={setJaLead} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Nome *</Label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <div>
              <Label>Telefone *</Label>
              <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} />
            </div>
          </div>

          {jaLead && (
            <div>
              <Label>E-mail (opcional)</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Empreendimento *</Label>
              <Select value={empId} onValueChange={setEmpId}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {emps?.map((e) => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Imobiliária parceira (opcional)</Label>
              <Select value={imobId} onValueChange={setImobId}>
                <SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                <SelectContent>
                  {imobs?.map((i: any) => <SelectItem key={i.id} value={i.id}>{i.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Data e hora *</Label>
            <Input type="datetime-local" value={dataHora} onChange={(e) => setDataHora(e.target.value)} />
          </div>

          <div>
            <Label>Observações</Label>
            <Textarea rows={3} value={obs} onChange={(e) => setObs(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={saving}>{saving ? 'Salvando...' : 'Agendar visita'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
