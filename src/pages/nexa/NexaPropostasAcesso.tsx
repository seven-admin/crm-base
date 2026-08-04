import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Building2, Loader2, Save, Search, UserRound } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useEmpreendimentosAtivos } from '@/hooks/useNexa';
import { useNexaPropostasAcesso, useSaveNexaPropostaAcesso } from '@/hooks/useNexaPropostas';

function useProfilesAtivos() {
  return useQuery({
    queryKey: ['profiles', 'ativos-min'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('is_active', true)
        .order('full_name');
      if (error) throw error;
      return (data ?? []) as Array<{ id: string; full_name: string; email: string }>;
    },
  });
}

export default function NexaPropostasAcesso() {
  const { data: profiles = [], isLoading: loadingP } = useProfilesAtivos();
  const { data: emps = [] } = useEmpreendimentosAtivos();
  const { data: acesso = [] } = useNexaPropostasAcesso();
  const save = useSaveNexaPropostaAcesso();

  const [selUser, setSelUser] = useState<string>('');
  const [buscaUser, setBuscaUser] = useState('');
  const [empIds, setEmpIds] = useState<string[]>([]);

  const acessoPorUser = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const a of acesso) m.set(a.user_id, [...(m.get(a.user_id) ?? []), a.empreendimento_id]);
    return m;
  }, [acesso]);

  useEffect(() => {
    if (selUser) setEmpIds(acessoPorUser.get(selUser) ?? []);
  }, [selUser, acessoPorUser]);

  const usuariosFiltrados = useMemo(() => {
    const s = buscaUser.trim().toLowerCase();
    if (!s) return profiles;
    return profiles.filter((p) => p.full_name?.toLowerCase().includes(s) || p.email?.toLowerCase().includes(s));
  }, [profiles, buscaUser]);

  const toggleEmp = (id: string) =>
    setEmpIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  return (
    <MainLayout title="Acesso a Propostas" subtitle="Defina quais empreendimentos cada usuário vê no dashboard de propostas">
      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        <Card className="p-4 shadow-none">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" value={buscaUser} onChange={(e) => setBuscaUser(e.target.value)} placeholder="Buscar usuário..." />
          </div>
          {loadingP ? (
            <Skeleton className="h-72 rounded-xl" />
          ) : (
            <div className="max-h-[60vh] space-y-1 overflow-y-auto">
              {usuariosFiltrados.map((p) => {
                const n = acessoPorUser.get(p.id)?.length ?? 0;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelUser(p.id)}
                    className={`flex w-full items-center gap-2 rounded-xl border p-2.5 text-left transition-colors ${selUser === p.id ? 'border-primary/40 bg-primary-soft/40' : 'border-transparent hover:bg-muted/40'}`}
                  >
                    <UserRound className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{p.full_name}</span>
                      <span className="block truncate text-xs text-muted-foreground">{p.email}</span>
                    </span>
                    {n > 0 && <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">{n}</span>}
                  </button>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="p-5 shadow-none">
          {!selUser ? (
            <p className="py-16 text-center text-sm text-muted-foreground">Selecione um usuário para definir os empreendimentos.</p>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold">Empreendimentos visíveis</h3>
                  <p className="text-xs text-muted-foreground">{empIds.length} selecionado(s)</p>
                </div>
                <Button onClick={() => save.mutate({ userId: selUser, empreendimentoIds: empIds })} disabled={save.isPending}>
                  {save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Salvar
                </Button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {emps.map((e: { id: string; nome: string }) => (
                  <label key={e.id} className="flex cursor-pointer items-center gap-2 rounded-xl border border-black/[.07] p-3 hover:bg-muted/30">
                    <Checkbox checked={empIds.includes(e.id)} onCheckedChange={() => toggleEmp(e.id)} />
                    <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 truncate text-sm">{e.nome}</span>
                  </label>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>
    </MainLayout>
  );
}
