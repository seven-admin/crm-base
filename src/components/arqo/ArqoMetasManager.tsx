import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarRange, Loader2, Pencil, Plus, Target, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useDeleteArqoConfig } from '@/hooks/useArqo';
import { supabase } from '@/integrations/supabase/client';
import type { ArqoMetaAtendimento } from '@/types/arqo.types';

interface ProfileOption {
  id: string;
  full_name: string;
  email: string;
}

interface Props {
  metas: ArqoMetaAtendimento[];
  profiles: ProfileOption[];
}

type MetaForm = {
  id?: string;
  nome: string;
  vigenciaInicio: string;
  vigenciaFim: string;
  diariaLigacoes: number;
  diariaConversas: number;
  diariaAgendamentos: number;
  diariaVisitas: number;
  semanalLigacoes: number;
  semanalConversas: number;
  semanalAgendamentos: number;
  semanalVisitas: number;
  isActive: boolean;
  userIds: string[];
};

const today = () => new Date().toISOString().slice(0, 10);

function emptyForm(): MetaForm {
  return {
    nome: '',
    vigenciaInicio: today(),
    vigenciaFim: '',
    diariaLigacoes: 0,
    diariaConversas: 0,
    diariaAgendamentos: 0,
    diariaVisitas: 0,
    semanalLigacoes: 0,
    semanalConversas: 0,
    semanalAgendamentos: 0,
    semanalVisitas: 0,
    isActive: true,
    userIds: [],
  };
}

const metricFields: Array<{ daily: keyof MetaForm; weekly: keyof MetaForm; label: string }> = [
  { daily: 'diariaLigacoes', weekly: 'semanalLigacoes', label: 'Meta 01 · Ligações' },
  { daily: 'diariaConversas', weekly: 'semanalConversas', label: 'Meta 02 · Conversas efetivadas' },
  { daily: 'diariaAgendamentos', weekly: 'semanalAgendamentos', label: 'Meta 03 · Agendamentos' },
  { daily: 'diariaVisitas', weekly: 'semanalVisitas', label: 'Meta 04 · Visitas realizadas' },
];

export function ArqoMetasManager({ metas, profiles }: Props) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<MetaForm>(emptyForm);
  const [userSearch, setUserSearch] = useState('');
  const queryClient = useQueryClient();
  const del = useDeleteArqoConfig('arqo_metas_atendimento');

  const save = useMutation({
    mutationFn: async (payload: MetaForm) => {
      const { data, error } = await supabase.rpc('arqo_salvar_meta_atendimento', {
        p_meta_id: payload.id ?? null,
        p_nome: payload.nome.trim(),
        p_vigencia_inicio: payload.vigenciaInicio,
        p_vigencia_fim: payload.vigenciaFim || null,
        p_meta_diaria_ligacoes: payload.diariaLigacoes,
        p_meta_diaria_conversas: payload.diariaConversas,
        p_meta_diaria_agendamentos: payload.diariaAgendamentos,
        p_meta_diaria_visitas_realizadas: payload.diariaVisitas,
        p_meta_semanal_ligacoes: payload.semanalLigacoes,
        p_meta_semanal_conversas: payload.semanalConversas,
        p_meta_semanal_agendamentos: payload.semanalAgendamentos,
        p_meta_semanal_visitas_realizadas: payload.semanalVisitas,
        p_is_active: payload.isActive,
        p_user_ids: payload.userIds,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['arqo', 'metas-atendimento'] });
      toast.success('Meta salva e atribuída aos usuários');
      setOpen(false);
    },
    onError: (error: Error) => toast.error(error.message || 'Não foi possível salvar a meta'),
  });

  const filteredProfiles = useMemo(() => {
    const search = userSearch.trim().toLowerCase();
    if (!search) return profiles;
    return profiles.filter((profile) => (
      profile.full_name.toLowerCase().includes(search)
      || profile.email.toLowerCase().includes(search)
    ));
  }, [profiles, userSearch]);

  const openNew = () => {
    setForm(emptyForm());
    setUserSearch('');
    setOpen(true);
  };

  const openEdit = (meta: ArqoMetaAtendimento) => {
    setForm({
      id: meta.id,
      nome: meta.nome,
      vigenciaInicio: meta.vigencia_inicio,
      vigenciaFim: meta.vigencia_fim ?? '',
      diariaLigacoes: meta.meta_diaria_ligacoes,
      diariaConversas: meta.meta_diaria_conversas,
      diariaAgendamentos: meta.meta_diaria_agendamentos,
      diariaVisitas: meta.meta_diaria_visitas_realizadas,
      semanalLigacoes: meta.meta_semanal_ligacoes,
      semanalConversas: meta.meta_semanal_conversas,
      semanalAgendamentos: meta.meta_semanal_agendamentos,
      semanalVisitas: meta.meta_semanal_visitas_realizadas,
      isActive: meta.is_active,
      userIds: meta.usuarios?.map((item) => item.user_id) ?? (meta.user_id ? [meta.user_id] : []),
    });
    setUserSearch('');
    setOpen(true);
  };

  const toggleUser = (userId: string) => {
    setForm((current) => ({
      ...current,
      userIds: current.userIds.includes(userId)
        ? current.userIds.filter((id) => id !== userId)
        : [...current.userIds, userId],
    }));
  };

  const submit = () => {
    if (!form.nome.trim()) return toast.error('Informe o nome da meta');
    if (!form.vigenciaInicio) return toast.error('Informe o início da vigência');
    if (form.userIds.length === 0) return toast.error('Selecione ao menos um usuário');
    save.mutate(form);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Metas de atendimento</h3>
          <p className="mt-1 text-xs text-muted-foreground">Uma configuração pode ser atribuída a vários usuários.</p>
        </div>
        <Button size="sm" onClick={openNew}><Plus className="mr-1 h-4 w-4" /> Nova meta</Button>
      </div>

      {metas.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma meta cadastrada.</p>}
      <div className="space-y-2">
        {metas.map((meta) => {
          const users = meta.usuarios?.map((item) => item.profile?.full_name).filter(Boolean) ?? [];
          return (
            <div key={meta.id} className="rounded-2xl border border-black/[.07] bg-[#fffdfa] p-4">
              <div className="flex flex-wrap items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary"><Target className="h-5 w-5" /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{meta.nome}</p>
                    <Badge variant={meta.is_active ? 'default' : 'secondary'}>{meta.is_active ? 'Ativa' : 'Inativa'}</Badge>
                  </div>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <CalendarRange className="h-3.5 w-3.5" />
                    {meta.vigencia_inicio} até {meta.vigencia_fim || 'sem data final'}
                  </p>
                  <p className="mt-2 flex items-start gap-1 text-xs text-muted-foreground">
                    <Users className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {users.join(', ') || 'Nenhum usuário'}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Dia: {meta.meta_diaria_ligacoes} ligações · {meta.meta_diaria_conversas} conversas · {meta.meta_diaria_agendamentos} agendamentos · {meta.meta_diaria_visitas_realizadas} visitas realizadas
                  </p>
                </div>
                <Button size="icon" variant="ghost" onClick={() => openEdit(meta)}><Pencil className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => confirm('Remover esta meta?') && del.mutate(meta.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader><DialogTitle>{form.id ? 'Editar meta' : 'Nova meta de atendimento'}</DialogTitle></DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Nome da meta *</Label>
              <Input value={form.nome} onChange={(event) => setForm({ ...form, nome: event.target.value })} placeholder="Ex.: Meta comercial do mês" />
            </div>
            <div className="space-y-1.5">
              <Label>Início da vigência *</Label>
              <Input type="date" value={form.vigenciaInicio} onChange={(event) => setForm({ ...form, vigenciaInicio: event.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Fim da vigência</Label>
              <Input type="date" value={form.vigenciaFim} onChange={(event) => setForm({ ...form, vigenciaFim: event.target.value })} />
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-black/[.07]">
            <div className="grid grid-cols-[1fr_110px_110px] gap-3 bg-muted/45 px-4 py-3 text-xs font-semibold text-muted-foreground">
              <span>Métrica</span><span>Por dia</span><span>Por semana</span>
            </div>
            {metricFields.map((metric) => (
              <div key={metric.label} className="grid grid-cols-[1fr_110px_110px] items-center gap-3 border-t border-black/[.07] px-4 py-3">
                <Label>{metric.label}</Label>
                <Input
                  type="number"
                  min={0}
                  value={Number(form[metric.daily])}
                  onChange={(event) => setForm({ ...form, [metric.daily]: Math.max(0, Number(event.target.value)) })}
                />
                <Input
                  type="number"
                  min={0}
                  value={Number(form[metric.weekly])}
                  onChange={(event) => setForm({ ...form, [metric.weekly]: Math.max(0, Number(event.target.value)) })}
                />
              </div>
            ))}
          </div>

          <div className="space-y-3 rounded-2xl border border-black/[.07] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <Label>Usuários atribuídos *</Label>
                <p className="mt-1 text-xs text-muted-foreground">{form.userIds.length} selecionado(s)</p>
              </div>
              <Input className="max-w-xs" value={userSearch} onChange={(event) => setUserSearch(event.target.value)} placeholder="Buscar usuário..." />
            </div>
            <div className="grid max-h-56 gap-2 overflow-y-auto sm:grid-cols-2">
              {filteredProfiles.map((profile) => (
                <label key={profile.id} className="flex cursor-pointer items-start gap-3 rounded-xl border border-black/[.07] p-3 hover:bg-muted/30">
                  <Checkbox checked={form.userIds.includes(profile.id)} onCheckedChange={() => toggleUser(profile.id)} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{profile.full_name}</span>
                    <span className="block truncate text-xs text-muted-foreground">{profile.email}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-muted/35 px-4 py-3">
            <div><Label>Meta ativa</Label><p className="text-xs text-muted-foreground">Disponível para o cálculo do dashboard.</p></div>
            <Switch checked={form.isActive} onCheckedChange={(checked) => setForm({ ...form, isActive: checked })} />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={submit} disabled={save.isPending}>
              {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar meta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
