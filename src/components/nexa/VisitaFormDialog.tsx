import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  useCreateVisita,
  useUpdateVisita,
  useEmpreendimentosAtivos,
  useImobiliariasAtivas,
  getOrCreatePessoa,
} from '@/hooks/useNexa';
import { toast } from 'sonner';
import type { NexaVisitaStatus, NexaVisitaWithRelations } from '@/types/nexa.types';
import { STATUS_LABELS } from '@/types/nexa.types';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  visita?: NexaVisitaWithRelations | null;
  createMode?: 'atendimento' | 'atividade';
}

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function VisitaFormDialog({ open, onOpenChange, visita, createMode = 'atividade' }: Props) {
  const create = useCreateVisita();
  const update = useUpdateVisita();
  const { data: emps } = useEmpreendimentosAtivos();
  const { data: imobs } = useImobiliariasAtivas();
  const isEdit = !!visita;

  const [jaLead, setJaLead] = useState(false);
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [empId, setEmpId] = useState<string>('');
  const [imobId, setImobId] = useState<string>('');
  const [dataHora, setDataHora] = useState('');
  const [obs, setObs] = useState('');
  const [status, setStatus] = useState<NexaVisitaStatus>('agendada');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (visita) {
      setJaLead(!!visita.cliente_id);
      setNome(visita.cliente?.nome || visita.visitante_nome || '');
      setTelefone(visita.cliente?.telefone || visita.visitante_telefone || '');
      setEmail(visita.cliente?.email || '');
      setEmpId(visita.empreendimento_id);
      setImobId(visita.imobiliaria_parceira_id || '');
      setDataHora(toLocalInput(visita.data_hora));
      setObs(visita.observacoes || '');
      setStatus(visita.status);
    } else {
      setJaLead(false); setNome(''); setTelefone(''); setEmail('');
      setEmpId(''); setImobId(''); setDataHora(''); setObs('');
      setStatus('agendada');
    }
  }, [open, visita]);

  const submit = async () => {
    if (!nome || !telefone || !empId || !dataHora) {
      toast.error('Preencha nome, telefone, empreendimento e data/hora.');
      return;
    }
    setSaving(true);
    try {
      if (isEdit && visita) {
        await update.mutateAsync({
          id: visita.id,
          patch: {
            empreendimento_id: empId,
            imobiliaria_parceira_id: imobId || null,
            data_hora: new Date(dataHora).toISOString(),
            observacoes: obs || null,
            status,
            visitante_nome: visita.cliente_id ? null : nome,
            visitante_telefone: visita.cliente_id ? null : telefone,
          },
        });
      } else {
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
      }
      onOpenChange(false);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? 'Editar visita'
              : createMode === 'atendimento'
                ? 'Novo atendimento'
                : 'Nova atividade'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!isEdit && (
            <div className="flex items-center justify-between bg-muted p-3 rounded-lg">
              <div>
                <Label htmlFor="jalead" className="font-medium">Este visitante já é um lead do grupo?</Label>
                <p className="text-xs text-muted-foreground">
                  Se sim, vinculamos ao cadastro de clientes. Se não, guardamos apenas nome e telefone.
                </p>
              </div>
              <Switch id="jalead" checked={jaLead} onCheckedChange={setJaLead} />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Nome *</Label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} disabled={isEdit && !!visita?.cliente_id} />
            </div>
            <div>
              <Label>Telefone *</Label>
              <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} disabled={isEdit && !!visita?.cliente_id} />
            </div>
          </div>

          {!isEdit && jaLead && (
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
                  {imobs?.map((i: { id: string; nome: string }) => <SelectItem key={i.id} value={i.id}>{i.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Data e hora *</Label>
              <Input type="datetime-local" value={dataHora} onChange={(e) => setDataHora(e.target.value)} />
            </div>
            {isEdit && (
              <div>
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as NexaVisitaStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_LABELS).map(([k, l]) => (
                      <SelectItem key={k} value={k}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div>
            <Label>Observações</Label>
            <Textarea rows={3} value={obs} onChange={(e) => setObs(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={saving}>
            {saving
              ? 'Salvando...'
              : isEdit
                ? 'Salvar alterações'
                : createMode === 'atendimento'
                  ? 'Criar atendimento'
                  : 'Criar atividade'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
