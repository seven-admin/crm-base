import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Building2 } from 'lucide-react';
import { useCreateNexaAtividade, useUpdateNexaAtividade, useNexaCorretoresPorImobiliaria } from '@/hooks/useNexaMetas';
import type { NexaAtividadeTipo, NexaAtividadeWithRelations } from '@/types/nexa.types';
import { TIPO_ATIVIDADE_LABELS } from '@/types/nexa.types';

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
  const isEdit = !!atividade;

  const [tipo, setTipo] = useState<NexaAtividadeTipo>('visita');
  const [dataHora, setDataHora] = useState('');
  const [local, setLocal] = useState('');
  const [qtdPessoas, setQtdPessoas] = useState('');
  const [obs, setObs] = useState('');
  const [corretorIds, setCorretorIds] = useState<string[]>([]);
  const [busca, setBusca] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (atividade) {
      setTipo(atividade.tipo);
      setDataHora(toLocalInput(atividade.data_hora));
      setLocal(atividade.local ?? '');
      setQtdPessoas(atividade.qtd_pessoas != null ? String(atividade.qtd_pessoas) : '');
      setObs(atividade.observacoes ?? '');
      setCorretorIds((atividade.participantes ?? []).map((p) => p.corretor_id));
    } else {
      setTipo('visita'); setDataHora(''); setLocal(''); setQtdPessoas(''); setObs(''); setCorretorIds([]);
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
    if (tipo === 'visita' && !local.trim()) return toast.error('Informe o local da visita.');
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
      const input = {
        tipo,
        data_hora: new Date(dataHora).toISOString(),
        local: local.trim() || null,
        qtd_pessoas: qtdPessoas ? Math.max(0, Number(qtdPessoas)) : null,
        observacoes: obs.trim() || null,
        participantes,
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
              <Label>Tipo *</Label>
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

          {tipo === 'visita' && (
            <>
              <div className="grid grid-cols-[1fr_140px] gap-3">
                <div>
                  <Label>Local *</Label>
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
