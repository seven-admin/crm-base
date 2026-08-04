import { useMemo, useState } from 'react';
import { CalendarRange, Loader2, Pencil, Plus, Target, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { useNexaMetas, useSaveNexaMeta, useDeleteNexaMeta } from '@/hooks/useNexaMetas';
import { useProfilesByRoles } from '@/hooks/useFuncionariosSeven';
import type { NexaMeta } from '@/types/nexa.types';

const today = () => new Date().toISOString().slice(0, 10);

type MetaForm = {
  id?: string;
  nome: string;
  vigenciaInicio: string;
  vigenciaFim: string;
  semanalVisitas: number;
  semanalAtendimentos: number;
  semanalImpacto: number;
  semanalEngajamento: number;
  isActive: boolean;
  userIds: string[];
};

function emptyForm(): MetaForm {
  return {
    nome: '', vigenciaInicio: today(), vigenciaFim: '',
    semanalVisitas: 0, semanalAtendimentos: 0, semanalImpacto: 0, semanalEngajamento: 0,
    isActive: true, userIds: [],
  };
}

export function NexaMetasManager() {
  const { data: metas = [], isLoading } = useNexaMetas();
  const { data: profiles = [] } = useProfilesByRoles(['nexa_admin', 'nexa_gestor', 'nexa_corretor', 'super_admin']);
  const save = useSaveNexaMeta();
  const del = useDeleteNexaMeta();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<MetaForm>(emptyForm);
  const [userSearch, setUserSearch] = useState('');

  const filteredProfiles = useMemo(() => {
    const s = userSearch.trim().toLowerCase();
    if (!s) return profiles;
    return profiles.filter((p) => p.full_name.toLowerCase().includes(s) || p.email.toLowerCase().includes(s));
  }, [profiles, userSearch]);

  const openNew = () => { setForm(emptyForm()); setUserSearch(''); setOpen(true); };
  const openEdit = (meta: NexaMeta) => {
    setForm({
      id: meta.id,
      nome: meta.nome,
      vigenciaInicio: meta.vigencia_inicio,
      vigenciaFim: meta.vigencia_fim ?? '',
      semanalVisitas: meta.meta_semanal_visitas,
      semanalAtendimentos: meta.meta_semanal_atendimentos,
      semanalImpacto: meta.meta_semanal_impacto,
      semanalEngajamento: meta.meta_semanal_engajamento,
      isActive: meta.is_active,
      userIds: meta.usuarios?.map((u) => u.user_id) ?? [],
    });
    setUserSearch('');
    setOpen(true);
  };

  const toggleUser = (id: string) => {
    setForm((cur) => ({ ...cur, userIds: cur.userIds.includes(id) ? cur.userIds.filter((x) => x !== id) : [...cur.userIds, id] }));
  };

  const submit = () => {
    if (!form.nome.trim()) return toast.error('Informe o nome da meta');
    if (!form.vigenciaInicio) return toast.error('Informe o início da vigência');
    if (form.userIds.length === 0) return toast.error('Selecione ao menos um usuário');
    save.mutate(form, { onSuccess: () => setOpen(false) });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Metas semanais</h3>
          <p className="mt-1 text-xs text-muted-foreground">Meta de visitas e atendimentos por semana. Pode ser atribuída a vários usuários.</p>
        </div>
        <Button size="sm" onClick={openNew}><Plus className="mr-1 h-4 w-4" /> Nova meta</Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-40 rounded-2xl" />
      ) : metas.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma meta cadastrada.</p>
      ) : (
        <div className="space-y-2">
          {metas.map((meta) => {
            const users = meta.usuarios?.map((u) => u.profile?.full_name).filter(Boolean) ?? [];
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
                      Semana: {meta.meta_semanal_visitas} visitas · {meta.meta_semanal_atendimentos} atendimentos · {meta.meta_semanal_impacto} impacto · {meta.meta_semanal_engajamento} engajamento
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
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader><DialogTitle>{form.id ? 'Editar meta' : 'Nova meta semanal'}</DialogTitle></DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Nome da meta *</Label>
              <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex.: Meta comercial de agosto" />
            </div>
            <div className="space-y-1.5">
              <Label>Início da vigência *</Label>
              <Input type="date" value={form.vigenciaInicio} onChange={(e) => setForm({ ...form, vigenciaInicio: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Fim da vigência</Label>
              <Input type="date" value={form.vigenciaFim} onChange={(e) => setForm({ ...form, vigenciaFim: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Visitas por semana</Label>
              <Input type="number" min={0} value={form.semanalVisitas} onChange={(e) => setForm({ ...form, semanalVisitas: Math.max(0, Number(e.target.value)) })} />
            </div>
            <div className="space-y-1.5">
              <Label>Atendimentos por semana</Label>
              <Input type="number" min={0} value={form.semanalAtendimentos} onChange={(e) => setForm({ ...form, semanalAtendimentos: Math.max(0, Number(e.target.value)) })} />
            </div>
            <div className="space-y-1.5">
              <Label>Impacto — corretores/semana</Label>
              <Input type="number" min={0} value={form.semanalImpacto} onChange={(e) => setForm({ ...form, semanalImpacto: Math.max(0, Number(e.target.value)) })} />
            </div>
            <div className="space-y-1.5">
              <Label>Engajamento — corretores/semana</Label>
              <Input type="number" min={0} value={form.semanalEngajamento} onChange={(e) => setForm({ ...form, semanalEngajamento: Math.max(0, Number(e.target.value)) })} />
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-black/[.07] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <Label>Usuários atribuídos *</Label>
                <p className="mt-1 text-xs text-muted-foreground">{form.userIds.length} selecionado(s)</p>
              </div>
              <Input className="max-w-xs" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="Buscar usuário..." />
            </div>
            <div className="grid max-h-56 gap-2 overflow-y-auto sm:grid-cols-2">
              {filteredProfiles.map((p) => (
                <label key={p.id} className="flex cursor-pointer items-start gap-3 rounded-xl border border-black/[.07] p-3 hover:bg-muted/30">
                  <Checkbox checked={form.userIds.includes(p.id)} onCheckedChange={() => toggleUser(p.id)} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{p.full_name}</span>
                    <span className="block truncate text-xs text-muted-foreground">{p.email}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-muted/35 px-4 py-3">
            <div><Label>Meta ativa</Label><p className="text-xs text-muted-foreground">Disponível para o cálculo do dashboard.</p></div>
            <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
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
