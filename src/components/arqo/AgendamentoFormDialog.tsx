import { useEffect, useMemo, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useArqoAtividadeTipos, useArqoLeads, useCreateArqoAgendamento, useUpdateArqoAgendamento } from '@/hooks/useArqo';
import { useProfilesByRoles } from '@/hooks/useFuncionariosSeven';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { ArqoAgendamentoStatus, ArqoAgendamentoTipo, ArqoAgendamentoWithRelations } from '@/types/arqo.types';
import { AGENDAMENTO_STATUS_LABELS } from '@/types/arqo.types';
import { formatarTelefone } from '@/lib/documentUtils';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  agendamento?: ArqoAgendamentoWithRelations | null;
}

// Sentinela para "sem lead" — o Radix Select não aceita value vazio.
const SEM_LEAD = '__sem_lead__';

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function AgendamentoFormDialog({ open, onOpenChange, agendamento }: Props) {
  const { user, role } = useAuth();
  const create = useCreateArqoAgendamento();
  const update = useUpdateArqoAgendamento();
  const { data: leads } = useArqoLeads();
  const { data: tipos } = useArqoAtividadeTipos();
  const isEdit = !!agendamento;

  // Gestor/admin pode atribuir a atividade a outro funcionário.
  const podeAtribuir = role === 'super_admin' || role === 'admin' || role === 'arqo_admin' || role === 'arqo_gestor';
  const { data: funcionarios } = useProfilesByRoles(
    ['arqo_admin', 'arqo_gestor', 'arqo_consultor', 'arqo_closer', 'super_admin'],
  );

  const [leadId, setLeadId] = useState('');
  const [tipo, setTipo] = useState<ArqoAgendamentoTipo>('visita');
  const [dataHora, setDataHora] = useState('');
  const [duracaoMin, setDuracaoMin] = useState(30);
  const [local, setLocal] = useState('');
  const [obs, setObs] = useState('');
  const [status, setStatus] = useState<ArqoAgendamentoStatus>('agendado');
  const [responsavelId, setResponsavelId] = useState('');
  const [saving, setSaving] = useState(false);
  const submittingRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    if (agendamento) {
      setLeadId(agendamento.lead_id ?? '');
      setTipo(agendamento.tipo);
      setDataHora(toLocalInput(agendamento.data_hora));
      setDuracaoMin(agendamento.duracao_min);
      setLocal(agendamento.local || '');
      setObs(agendamento.observacoes || '');
      setStatus(agendamento.status);
      setResponsavelId(agendamento.responsavel_id ?? '');
    } else {
      setLeadId(''); setTipo('visita'); setDataHora(''); setDuracaoMin(30);
      setLocal(''); setObs(''); setStatus('agendado');
      setResponsavelId(user?.id ?? '');
    }
  }, [open, agendamento, user?.id]);

  const responsavelOptions = useMemo(() => funcionarios ?? [], [funcionarios]);

  // Opções do seletor de tipo: os tipos ativos configurados. Ao editar uma
  // atividade cujo tipo virou inativo, mantém o valor atual como opção extra.
  const tipoOptions = useMemo(() => {
    const ativos = tipos ?? [];
    if (tipo && !ativos.some((t) => t.codigo === tipo)) {
      return [{ codigo: tipo, rotulo: tipo }, ...ativos];
    }
    return ativos;
  }, [tipos, tipo]);

  // Ao criar, garante um tipo válido assim que a lista carregar.
  useEffect(() => {
    if (!open || isEdit) return;
    const ativos = tipos ?? [];
    if (ativos.length && !ativos.some((t) => t.codigo === tipo)) {
      setTipo(ativos[0].codigo);
    }
  }, [open, isEdit, tipos, tipo]);

  const submit = async () => {
    if (submittingRef.current) return;
    if (!dataHora) {
      toast.error('Informe a data e a hora da atividade.');
      return;
    }
    submittingRef.current = true;
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
            observacoes: obs || null,
            status,
            ...(podeAtribuir ? { responsavel_id: responsavelId || null } : {}),
          },
        });
      } else {
        await create.mutateAsync({
          lead_id: leadId || null,
          tipo,
          data_hora: new Date(dataHora).toISOString(),
          duracao_min: duracaoMin,
          local: local || null,
          responsavel_id: (podeAtribuir ? responsavelId : user?.id) || null,
          observacoes: obs || null,
        });
      }
      onOpenChange(false);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar');
    } finally {
      submittingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar atividade' : 'Nova atividade'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Lead (opcional)</Label>
            <Select
              value={leadId || SEM_LEAD}
              onValueChange={(v) => setLeadId(v === SEM_LEAD ? '' : v)}
              disabled={isEdit}
            >
              <SelectTrigger><SelectValue placeholder="Sem lead vinculado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={SEM_LEAD}>Sem lead vinculado</SelectItem>
                {leads?.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.cliente?.nome ?? '—'}{l.cliente?.telefone ? ` · ${formatarTelefone(l.cliente.telefone)}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tipo *</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as ArqoAgendamentoTipo)}>
                <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                <SelectContent>
                  {tipoOptions.map((t) => (
                    <SelectItem key={t.codigo} value={t.codigo}>{t.rotulo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

          {podeAtribuir && (
            <div>
              <Label>Responsável</Label>
              <Select value={responsavelId} onValueChange={setResponsavelId}>
                <SelectTrigger><SelectValue placeholder="Selecione o responsável" /></SelectTrigger>
                <SelectContent>
                  {responsavelOptions.map((f) => (
                    <SelectItem key={f.id} value={f.id}>{f.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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

          <div>
            <Label>Local (opcional)</Label>
            <Input value={local} onChange={(e) => setLocal(e.target.value)} />
          </div>

          <div>
            <Label>Observações</Label>
            <Textarea rows={3} value={obs} onChange={(e) => setObs(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Criar atividade'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
