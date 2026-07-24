import { useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  useArqoLeads, useArqoGrupos, useArqoEtapas,
} from '@/hooks/useArqo';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import {
  Users, UserCheck, Clock, TrendingUp, AlertCircle, Award, XCircle,
} from 'lucide-react';
import { ArqoGerenciarLeads } from './ArqoGerenciarLeads';

function KpiCard({ label, value, icon: Icon, hint }: any) {
  return (
    <Card className="group relative overflow-hidden p-5 shadow-none transition-colors hover:bg-primary-soft/35">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.14em] text-muted-foreground">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-[-0.05em]">{value}</p>
          {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
        </div>
        <Icon className="h-6 w-6 text-primary/65" />
      </div>
      <span className="absolute inset-x-5 bottom-0 h-0.5 origin-left scale-x-0 bg-primary transition-transform group-hover:scale-x-100" />
    </Card>
  );
}

export default function ArqoAdmin() {
  const { data: leads = [], isLoading } = useArqoLeads();
  const { data: grupos = [] } = useArqoGrupos();
  const { data: etapas = [] } = useArqoEtapas();

  // Membros de todos os grupos para KPIs por consultor/grupo
  const { data: membros = [] } = useQuery({
    queryKey: ['arqo', 'admin', 'grupo-membros-todos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('arqo_grupo_membros')
        .select('grupo_id, user_id, papel, is_active');
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['arqo', 'admin', 'profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, empresa');
      if (error) throw error;
      return data ?? [];
    },
  });

  const profilesMap = useMemo(() => {
    const m = new Map<string, { full_name: string; email: string }>();
    profiles.forEach((p: any) => m.set(p.id, { full_name: p.full_name, email: p.email }));
    return m;
  }, [profiles]);

  const inicioMes = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
  }, []);

  const kpis = useMemo(() => {
    const ativos = leads.filter(l => !l.fechado_em);
    const agora = Date.now();
    const semConsultor = ativos.filter(l => (
      !l.consultor_id && (!l.reserva_ate || new Date(l.reserva_ate).getTime() <= agora)
    )).length;
    const emAtendimento = ativos.filter(l => l.consultor_id).length;
    const ganhosMes = leads.filter(l =>
      l.etapa?.categoria === 'ganho' && l.fechado_em && l.fechado_em >= inicioMes,
    ).length;
    const perdidosMes = leads.filter(l =>
      l.etapa?.categoria === 'perda' && l.fechado_em && l.fechado_em >= inicioMes,
    ).length;
    return {
      totalAtivos: ativos.length,
      semConsultor,
      emAtendimento,
      ganhosMes,
      perdidosMes,
    };
  }, [leads, inicioMes]);

  const porGrupo = useMemo(() => {
    const agora = Date.now();
    return grupos.map(g => {
      const membrosDoGrupo = membros.filter((m: any) => m.grupo_id === g.id && m.is_active).length;
      const leadsGrupo = leads.filter(l => l.grupo_id === g.id);
      const fila = leadsGrupo.filter(l => (
        !l.consultor_id
        && !l.fechado_em
        && (!l.reserva_ate || new Date(l.reserva_ate).getTime() <= agora)
      )).length;
      const emAtend = leadsGrupo.filter(l => l.consultor_id && !l.fechado_em).length;
      const ganhos = leadsGrupo.filter(l => l.etapa?.categoria === 'ganho').length;
      const perdas = leadsGrupo.filter(l => l.etapa?.categoria === 'perda').length;
      return { grupo: g, membrosDoGrupo, fila, emAtend, ganhos, perdas };
    });
  }, [grupos, membros, leads]);

  const porConsultor = useMemo(() => {
    const map = new Map<string, {
      userId: string; nome: string; email: string;
      ativo: number; atendidos: number; ganhos: number; perdas: number;
      ultimoAtendimento: string | null;
    }>();
    leads.forEach(l => {
      if (!l.consultor_id) return;
      const info = profilesMap.get(l.consultor_id);
      const cur = map.get(l.consultor_id) ?? {
        userId: l.consultor_id,
        nome: info?.full_name ?? '—',
        email: info?.email ?? '',
        ativo: 0, atendidos: 0, ganhos: 0, perdas: 0,
        ultimoAtendimento: null as string | null,
      };
      cur.atendidos += 1;
      if (!l.fechado_em) cur.ativo += 1;
      if (l.etapa?.categoria === 'ganho') cur.ganhos += 1;
      if (l.etapa?.categoria === 'perda') cur.perdas += 1;
      if (l.updated_at && (!cur.ultimoAtendimento || l.updated_at > cur.ultimoAtendimento)) {
        cur.ultimoAtendimento = l.updated_at;
      }
      map.set(l.consultor_id, cur);
    });
    return Array.from(map.values()).sort((a, b) => b.atendidos - a.atendidos);
  }, [leads, profilesMap]);

  const porEtapa = useMemo(() => {
    return etapas
      .filter(e => e.categoria === 'ativa')
      .map(e => ({
        etapa: e,
        total: leads.filter(l => l.etapa_id === e.id && !l.fechado_em).length,
      }));
  }, [etapas, leads]);

  const maxEtapa = Math.max(1, ...porEtapa.map(p => p.total));

  return (
    <MainLayout
      title="Gestão Arqo"
      subtitle="Visão gerencial de filas, equipes e oportunidades"
    >
      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="leads">Gerenciar Leads</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-24" />)}
            </div>
          ) : (
        <>
          <div className="mb-6 grid grid-cols-2 overflow-hidden rounded-[1.75rem] border border-border/70 bg-card md:grid-cols-5 [&>*]:rounded-none [&>*]:border-0 [&>*]:border-b [&>*]:border-r [&>*]:border-border/70">
            <KpiCard label="Leads ativos" value={kpis.totalAtivos} icon={Users} />
            <KpiCard label="Na fila" value={kpis.semConsultor} icon={AlertCircle} hint="Sem consultor" />
            <KpiCard label="Em atendimento" value={kpis.emAtendimento} icon={UserCheck} />
            <KpiCard label="Ganhos no mês" value={kpis.ganhosMes} icon={Award} />
            <KpiCard label="Perdidos no mês" value={kpis.perdidosMes} icon={XCircle} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card className="p-5">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> Distribuição por etapa (ativas)
              </h3>
              <div className="space-y-2">
                {porEtapa.length === 0 && (
                  <p className="text-sm text-muted-foreground">Sem etapas configuradas.</p>
                )}
                {porEtapa.map(({ etapa, total }) => (
                  <div key={etapa.id}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: etapa.cor }} />
                        {etapa.nome}
                      </span>
                      <span className="font-medium">{total}</span>
                    </div>
                    <div className="h-2 bg-muted rounded">
                      <div
                        className="h-full rounded"
                        style={{
                          width: `${(total / maxEtapa) * 100}%`,
                          backgroundColor: etapa.cor,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Users className="h-4 w-4" /> Grupos de atendimento
              </h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Grupo</TableHead>
                    <TableHead className="text-center">Membros</TableHead>
                    <TableHead className="text-center">Fila</TableHead>
                    <TableHead className="text-center">Ativos</TableHead>
                    <TableHead className="text-center">Ganhos</TableHead>
                    <TableHead className="text-center">Perdas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {porGrupo.map(({ grupo, membrosDoGrupo, fila, emAtend, ganhos, perdas }) => (
                    <TableRow key={grupo.id}>
                      <TableCell className="font-medium">{grupo.nome}</TableCell>
                      <TableCell className="text-center">{membrosDoGrupo}</TableCell>
                      <TableCell className="text-center">
                        {fila > 0 ? <Badge variant="secondary">{fila}</Badge> : fila}
                      </TableCell>
                      <TableCell className="text-center">{emAtend}</TableCell>
                      <TableCell className="text-center text-emerald-600 font-medium">{ganhos}</TableCell>
                      <TableCell className="text-center text-destructive font-medium">{perdas}</TableCell>
                    </TableRow>
                  ))}
                  {porGrupo.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-6">
                        Nenhum grupo cadastrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </div>

          <Card className="p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <UserCheck className="h-4 w-4" /> Desempenho por consultor
            </h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Consultor</TableHead>
                  <TableHead className="text-center">Lead ativo</TableHead>
                  <TableHead className="text-center">Total atendidos</TableHead>
                  <TableHead className="text-center">Ganhos</TableHead>
                  <TableHead className="text-center">Perdas</TableHead>
                  <TableHead className="text-center">Conversão</TableHead>
                  <TableHead>Última atividade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {porConsultor.map(c => {
                  const conv = c.atendidos > 0 ? Math.round((c.ganhos / c.atendidos) * 100) : 0;
                  return (
                    <TableRow key={c.userId}>
                      <TableCell>
                        <div className="font-medium">{c.nome}</div>
                        <div className="text-xs text-muted-foreground">{c.email}</div>
                      </TableCell>
                      <TableCell className="text-center">
                        {c.ativo > 0 ? <Badge>{c.ativo}</Badge> : '—'}
                      </TableCell>
                      <TableCell className="text-center">{c.atendidos}</TableCell>
                      <TableCell className="text-center text-emerald-600 font-medium">{c.ganhos}</TableCell>
                      <TableCell className="text-center text-destructive font-medium">{c.perdas}</TableCell>
                      <TableCell className="text-center">{conv}%</TableCell>
                      <TableCell className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {c.ultimoAtendimento
                          ? new Date(c.ultimoAtendimento).toLocaleString('pt-BR')
                          : '—'}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {porConsultor.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-6">
                      Nenhum consultor com leads atribuídos.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </>
      )}
        </TabsContent>

        <TabsContent value="leads">
          <ArqoGerenciarLeads />
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}
