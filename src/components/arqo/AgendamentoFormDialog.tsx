import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useArqoLeads, useCreateArqoAgendamento, useUpdateArqoAgendamento } from '@/hooks/useArqo';
import { useProfilesByRoles } from '@/hooks/useFuncionariosSeven';
import { toast } from 'sonner';
import type { ArqoAgendamentoStatus, ArqoAgendamentoTipo, ArqoAgendamentoWithRelations } from '@/types/arqo.types';
import { AGENDAMENTO_TIPO_LABELS, AGENDAMENTO_STATUS_LABELS } from '@/types/arqo.types';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  agendamento?: ArqoAgendamentoWithRelations | null;
}

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function AgendamentoFormDialog({ open, onOpenChange, agendamento }: Props) {
  const create = useCreateArqoAgendamento();
  const update = useUpdateArqoAgendamento();
  const { data: leads } = useArqoLeads();
  const { data: responsaveis } = useProfilesByRoles(['arqo_admin', 'arqo_gestor', 'arqo_consultor', 'arqo_closer']);
  const isEdit = !!agendamento;

  const [leadId, setLeadId] = useState('');
  const [tipo, setTipo] = useState<ArqoAgendamentoTipo>('visita');
  const [dataHora, setDataHora] = useState('');
  const [duracaoMin, setDuracaoMin] = useState(30);
  const [local, setLocal] = useState('');
  const [responsavelId, setResponsavelId] = useState('');
  const [obs, setObs] = useState('');
  const [status, setStatus] = useState<ArqoAgendamentoStatus>('agendado');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (agendamento) {
      setLeadId(agendamento.lead_id);
      setTipo(agendamento.tipo);
      setDataHora(toLocalInput(agendamento.data_hora));
      setDuracaoMin(agendamento.duracao_min);
      setLocal(agendamento.local || '');
      setResponsavelId(agendamento.responsavel_id || '');
      setObs(agendamento.observacoes || '');
      setStatus(agendamento.status);
    } else {
      setLeadId(''); setTipo('visita'); setDataHora(''); setDuracaoMin(30);
      setLocal(''); setResponsavelId(''); setObs(''); setStatus('agendado');
    }
  }, [open, agendamento]);

  const submit = async () => {
    if (!leadId || !dataHora) {
      toast.error('Selecione o lead e a data/hora.');
      return;
    }
    setSaving(true);
    try {
      if (isEdit && agendamento) {
        await update.mutateAsync({
          id: agendamento.id,
          patch: {
            tipo,
            data_hora: new Date(dataHora).toISOString(),
            duracao_min: duracaoMin,
            local: local || null,
            responsavel_id: responsavelId || null,
            observacoes: obs || null,
            status,
          },
        });
      } else {
        await create.mutateAsync({
          lead_id: leadId,
          tipo,
          data_hora: new Date(dataHora).toISOString(),
          duracao_min: duracaoMin,
          local: local || null,
          responsavel_id: responsavelId || null,
          observacoes: obs || null,
        });
      }
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
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar agendamento' : 'Novo agendamento'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Lead *</Label>
            <Select value={leadId} onValueChange={setLeadId} disabled={isEdit}>
              <SelectTrigger><SelectValue placeholder="Selecione o lead" /></SelectTrigger>
              <SelectContent>
                {leads?.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.cliente?.nome ?? '—'}{l.cliente?.telefone ? ` · ${l.cliente.telefone}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tipo *</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as ArqoAgendamentoTipo)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(AGENDAMENTO_TIPO_LABELS).map(([k, l]) => (
                    <SelectItem key={k} value={k}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Responsável</Label>
              <Select value={responsavelId} onValueChange={setResponsavelId}>
                <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                <SelectContent>
                  {responsaveis?.map((p) => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Data e hora *</Label>
              <Input type="datetime-local" value={dataHora} onChange={(e) => setDataHora(e.target.value)} />
            </div>
            <div>
              <Label>Duração (min)</Label>
              <Input type="number" min={5} step={5} value={duracaoMin} onChange={(e) => setDuracaoMin(Number(e.target.value))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Local (opcional)</Label>
              <Input value={local} onChange={(e) => setLocal(e.target.value)} />
            </div>
            {isEdit && (
              <div>
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as ArqoAgendamentoStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(AGENDAMENTO_STATUS_LABELS).map(([k, l]) => (
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
            {saving ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Agendar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
