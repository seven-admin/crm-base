import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Building2 } from 'lucide-react';
import { useCreateNexaAtividade, useUpdateNexaAtividade, useNexaCorretoresPorImobiliaria } from '@/hooks/useNexaMetas';
import { useEmpreendimentosAtivos, useImobiliariasAtivas, getOrCreatePessoa } from '@/hooks/useNexa';
import type { NexaAtividadeTipo, NexaAtividadeSubtipo, NexaAtividadeWithRelations, NexaVisitaStatus } from '@/types/nexa.types';
import { TIPO_ATIVIDADE_LABELS, NEXA_SUBTIPO_LABELS, STATUS_LABELS } from '@/types/nexa.types';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  atividade?: NexaAtividadeWithRelations | null;
}

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const SEM_IMOB = 'Sem imobiliária';

export function NexaAtividadeFormDialog({ open, onOpenChange, atividade }: Props) {
  const create = useCreateNexaAtividade();
  const update = useUpdateNexaAtividade();
  const { data: corretores = [] } = useNexaCorretoresPorImobiliaria();
  const { data: emps = [] } = useEmpreendimentosAtivos();
  const { data: imobs = [] } = useImobiliariasAtivas();
  const isEdit = !!atividade;

  const [tipo, setTipo] = useState<NexaAtividadeTipo>('visita');
  const [dataHora, setDataHora] = useState('');
  const [obs, setObs] = useState('');
  // Mercado
  const [subtipo, setSubtipo] = useState<NexaAtividadeSubtipo | ''>('');
  const [local, setLocal] = useState('');
  const [qtdPessoas, setQtdPessoas] = useState('');
  const [corretorIds, setCorretorIds] = useState<string[]>([]);
  const [busca, setBusca] = useState('');
  // Atendimento (cliente)
  const [jaLead, setJaLead] = useState(false);
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [empId, setEmpId] = useState('');
  const [imobId, setImobId] = useState('');
  const [status, setStatus] = useState<NexaVisitaStatus>('agendada');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (atividade) {
      setTipo(atividade.tipo);
      setDataHora(toLocalInput(atividade.data_hora));
      setObs(atividade.observacoes ?? '');
      setSubtipo(atividade.subtipo ?? '');
      setLocal(atividade.local ?? '');
      setQtdPessoas(atividade.qtd_pessoas != null ? String(atividade.qtd_pessoas) : '');
      setCorretorIds((atividade.participantes ?? []).map((p) => p.corretor_id));
      setJaLead(!!atividade.cliente_id);
      setNome(atividade.cliente?.nome || atividade.visitante_nome || '');
      setTelefone(atividade.cliente?.telefone || atividade.visitante_telefone || '');
      setEmail(atividade.cliente?.email || '');
      setEmpId(atividade.empreendimento_id ?? '');
      setImobId(atividade.imobiliaria_id ?? '');
      setStatus(atividade.status ?? 'agendada');
    } else {
      setTipo('visita'); setDataHora(''); setObs('');
      setSubtipo(''); setLocal(''); setQtdPessoas(''); setCorretorIds([]);
      setJaLead(false); setNome(''); setTelefone(''); setEmail(''); setEmpId(''); setImobId(''); setStatus('agendada');
    }
    setBusca('');
  }, [open, atividade]);

  const grupos = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const filtrados = termo
      ? corretores.filter((c) => c.nome_completo.toLowerCase().includes(termo) || (c.imobiliaria?.nome ?? '').toLowerCase().includes(termo))
      : corretores;
    const map = new Map<string, typeof filtrados>();
    for (const c of filtrados) {
      const key = c.imobiliaria?.nome ?? SEM_IMOB;
      const arr = map.get(key) ?? [];
      arr.push(c);
      map.set(key, arr);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [corretores, busca]);

  const toggle = (id: string) => {
    setCorretorIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  };

  const submit = async () => {
    if (!dataHora) return toast.error('Informe data e hora.');
    if (tipo === 'visita' && !subtipo) return toast.error('Selecione o tipo da atividade de mercado.');
    if (tipo === 'atendimento' && (!nome.trim() || !telefone.trim() || !empId)) {
      return toast.error('Informe nome, telefone e empreendimento.');
    }
    setSaving(true);
    try {
      const optById = new Map(corretores.map((c) => [c.id, c]));
      const snapById = new Map((atividade?.participantes ?? []).map((p) => [p.corretor_id, p]));
      const participantes = corretorIds.map((id) => {
        const opt = optById.get(id);
        const snap = snapById.get(id);
        return {
          corretor_id: id,
          corretor_nome: opt?.nome_completo ?? snap?.corretor_nome ?? null,
          imobiliaria_nome: opt?.imobiliaria?.nome ?? snap?.imobiliaria_nome ?? null,
        };
      });

      // Atendimento: vincula a lead do grupo se marcado, senão guarda nome/telefone soltos.
      let cliente_id: string | null = atividade?.cliente_id ?? null;
      let visitante_nome: string | null = null;
      let visitante_telefone: string | null = null;
      if (tipo === 'atendimento') {
        if (jaLead) {
          cliente_id = cliente_id ?? (await getOrCreatePessoa(nome.trim(), telefone.trim(), email.trim() || undefined));
        } else {
          cliente_id = null;
          visitante_nome = nome.trim();
          visitante_telefone = telefone.trim();
        }
      }

      const input = {
        tipo,
        subtipo: tipo === 'visita' ? (subtipo || null) : null,
        data_hora: new Date(dataHora).toISOString(),
        local: local.trim() || null,
        qtd_pessoas: qtdPessoas ? Math.max(0, Number(qtdPessoas)) : null,
        observacoes: obs.trim() || null,
        participantes,
        cliente_id,
        visitante_nome,
        visitante_telefone,
        empreendimento_id: tipo === 'atendimento' ? (empId || null) : null,
        imobiliaria_id: tipo === 'atendimento' ? (imobId || null) : null,
        corretor_id: null,
        status: tipo === 'atendimento' ? status : null,
      };
      if (isEdit && atividade) await update.mutateAsync({ id: atividade.id, input });
      else await create.mutateAsync(input);
      onOpenChange(false);
    } catch {
      /* toast já disparado no hook */
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar atividade' : 'Nova atividade'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Categoria *</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as NexaAtividadeTipo)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TIPO_ATIVIDADE_LABELS).map(([k, l]) => (
                    <SelectItem key={k} value={k}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Data e hora *</Label>
              <Input type="datetime-local" value={dataHora} onChange={(e) => setDataHora(e.target.value)} />
            </div>
          </div>

          {/* ===== Atividade (mercado) ===== */}
          {tipo === 'visita' && (
            <>
              <div>
                <Label>Tipo da atividade *</Label>
                <Select value={subtipo} onValueChange={(v) => setSubtipo(v as NexaAtividadeSubtipo)}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(NEXA_SUBTIPO_LABELS).map(([k, l]) => (
                      <SelectItem key={k} value={k}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-[1fr_140px] gap-3">
                <div>
                  <Label>Local</Label>
                  <Input value={local} onChange={(e) => setLocal(e.target.value)} placeholder="Ex.: Imobiliária X, estande, sala de treinamento" />
                </div>
                <div>
                  <Label>Qtd. de pessoas</Label>
                  <Input type="number" min={0} value={qtdPessoas} onChange={(e) => setQtdPessoas(e.target.value)} />
                </div>
              </div>

              <div className="space-y-3 rounded-2xl border border-black/[.07] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <Label>Participantes</Label>
                    <p className="mt-1 text-xs text-muted-foreground">{corretorIds.length} selecionado(s) · corretores por imobiliária</p>
                  </div>
                  <Input className="max-w-xs" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar corretor ou imobiliária..." />
                </div>
                <div className="max-h-64 space-y-3 overflow-y-auto">
                  {grupos.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">Nenhum corretor encontrado.</p>}
                  {grupos.map(([imob, lista]) => (
                    <div key={imob}>
                      <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                        <Building2 className="h-3.5 w-3.5" /> {imob}
                      </p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {lista.map((c) => (
                          <label key={c.id} className="flex cursor-pointer items-center gap-2 rounded-xl border border-black/[.07] p-2.5 hover:bg-muted/30">
                            <Checkbox checked={corretorIds.includes(c.id)} onCheckedChange={() => toggle(c.id)} />
                            <span className="min-w-0 truncate text-sm">{c.nome_completo}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ===== Atendimento (cliente) ===== */}
          {tipo === 'atendimento' && (
            <>
              {!isEdit && (
                <div className="flex items-center justify-between rounded-lg bg-muted p-3">
                  <div>
                    <Label htmlFor="jalead" className="font-medium">Este cliente já é um lead do grupo?</Label>
                    <p className="text-xs text-muted-foreground">Se sim, vinculamos ao cadastro de clientes. Se não, guardamos só nome e telefone.</p>
                  </div>
                  <Switch id="jalead" checked={jaLead} onCheckedChange={setJaLead} />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Nome *</Label>
                  <Input value={nome} onChange={(e) => setNome(e.target.value)} disabled={isEdit && !!atividade?.cliente_id} />
                </div>
                <div>
                  <Label>Telefone *</Label>
                  <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} disabled={isEdit && !!atividade?.cliente_id} />
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
                      {emps.map((e) => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Imobiliária parceira (opcional)</Label>
                  <Select value={imobId} onValueChange={setImobId}>
                    <SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                    <SelectContent>
                      {imobs.map((i: { id: string; nome: string }) => <SelectItem key={i.id} value={i.id}>{i.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

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
            </>
          )}

          <div>
            <Label>Observações</Label>
            <Textarea rows={3} value={obs} onChange={(e) => setObs(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={saving}>{saving ? 'Salvando...' : isEdit ? 'Salvar' : 'Registrar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
