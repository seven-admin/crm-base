import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useIncorporadorEmpreendimentos } from '@/hooks/useIncorporadorEmpreendimentos';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FunilTemperatura } from '@/components/forecast/FunilTemperatura';
import { VisitasPorEmpreendimento } from '@/components/forecast/VisitasPorEmpreendimento';
import { AtividadesPorTipo } from '@/components/forecast/AtividadesPorTipo';
import { ProximasAtividades } from '@/components/forecast/ProximasAtividades';
import { AtendimentosResumo } from '@/components/forecast/AtendimentosResumo';
import { CalendarioCompacto } from '@/components/forecast/CalendarioCompacto';
import { CategoriaCard } from '@/components/forecast/CategoriaCard';
import { AtividadesListaPortal } from '@/components/portal-incorporador/AtividadesListaPortal';
import { useResumoAtividades } from '@/hooks/useForecast';
import { useResumoAtividadesPorCategoria } from '@/hooks/useResumoAtividadesPorCategoria';
import { ATIVIDADE_CATEGORIA_LABELS, type AtividadeCategoria } from '@/types/atividades.types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  BarChart3,
  ListTodo,
  Info,
  Briefcase,
  Building2,
  Users,
  UserCheck,
  Headphones,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react';

// Hook inline para negociações do incorporador
function useNegociacoesIncorporador(empreendimentoIds: string[]) {
  return useQuery({
    queryKey: ['incorporador-negociacoes', empreendimentoIds],
    queryFn: async () => {
      if (!empreendimentoIds.length) return [];
      const { data, error } = await supabase
        .from('negociacoes' as any)
        .select(`
          id, codigo, status_aprovacao, valor_total, created_at,
          cliente:clientes(nome),
          empreendimento:empreendimentos(nome)
        `)
        .in('empreendimento_id', empreendimentoIds)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: empreendimentoIds.length > 0,
  });
}

// Hook inline para lista de atendimentos
function useAtendimentosLista(empreendimentoIds: string[]) {
  return useQuery({
    queryKey: ['incorporador-atendimentos-lista', empreendimentoIds],
    queryFn: async () => {
      if (!empreendimentoIds.length) return [];
      const { data, error } = await supabase
        .from('atividades' as any)
        .select(`
          id, titulo, tipo, status, data_inicio, data_fim,
          cliente:clientes(nome),
          empreendimento:empreendimentos(nome),
          corretor:corretores(nome_completo)
        `)
        .in('empreendimento_id', empreendimentoIds)
        .eq('tipo', 'atendimento')
        .neq('status', 'cancelada')
        .order('data_inicio', { ascending: false })
        .limit(30);
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: empreendimentoIds.length > 0,
  });
}

const STATUS_APROVACAO_LABELS: Record<string, { label: string; badgeClass: string }> = {
  pendente: { label: 'Pendente', badgeClass: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  aprovada: { label: 'Aprovada', badgeClass: 'bg-green-100 text-green-800 border-green-200' },
  rejeitada: { label: 'Rejeitada', badgeClass: 'bg-red-100 text-red-800 border-red-200' },
};

const ATIVIDADE_STATUS_BADGE: Record<string, string> = {
  pendente: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  concluida: 'bg-green-100 text-green-800 border-green-200',
  cancelada: 'bg-muted text-muted-foreground',
};

export default function PortalIncorporadorForecast() {
  const [tab, setTab] = useState<'dashboard' | 'atividades'>('dashboard');
  const [dataSelecionada, setDataSelecionada] = useState<Date | null>(null);
  const { empreendimentoIds, isLoading: loadingEmps } = useIncorporadorEmpreendimentos();
  
  const empsFilter = empreendimentoIds.length > 0 ? empreendimentoIds : undefined;
  const { data: resumoAtividades, isLoading: loadingResumo } = useResumoAtividades(
    undefined, undefined, undefined, empsFilter
  );
  const { data: resumoCategorias, isLoading: loadingCategorias } = useResumoAtividadesPorCategoria(
    undefined, undefined, undefined, empsFilter
  );
  const { data: negociacoes, isLoading: loadingNeg } = useNegociacoesIncorporador(empreendimentoIds);
  const { data: atendimentos, isLoading: loadingAtend } = useAtendimentosLista(empreendimentoIds);

  const CATEGORIA_CONFIG: Record<AtividadeCategoria, { icon: typeof Building2; iconColor: string; bgColor: string }> = {
    seven: { icon: Briefcase, iconColor: 'text-primary', bgColor: 'bg-primary/10' },
    incorporadora: { icon: Building2, iconColor: 'text-chart-2', bgColor: 'bg-chart-2/10' },
    imobiliaria: { icon: Users, iconColor: 'text-chart-3', bgColor: 'bg-chart-3/10' },
    cliente: { icon: UserCheck, iconColor: 'text-chart-4', bgColor: 'bg-chart-4/10' },
  };

  const isLoading = loadingEmps || loadingResumo || loadingCategorias;

  // KPIs de negociações
  const negKPIs = {
    total: negociacoes?.length || 0,
    pendentes: negociacoes?.filter((n: any) => n.status_aprovacao === 'pendente').length || 0,
    aprovadas: negociacoes?.filter((n: any) => n.status_aprovacao === 'aprovada').length || 0,
    rejeitadas: negociacoes?.filter((n: any) => n.status_aprovacao === 'rejeitada').length || 0,
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (empreendimentoIds.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Nenhum empreendimento vinculado à sua conta.
      </div>
    );
  }

  // Verificar se há dados de atividades
  const hasAtividadesData = (resumoAtividades?.total || 0) > 0;

  return (
    <div className="space-y-6">
      {/* Alerta quando não há atividades */}
      {!hasAtividadesData && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Nenhuma atividade encontrada</AlertTitle>
          <AlertDescription>
            Não há atividades registradas para seus empreendimentos no momento. 
            As informações de forecast serão exibidas aqui quando atividades forem agendadas, 
            negociações forem iniciadas ou leads forem registrados.
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs Navigation */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as 'dashboard' | 'atividades')}>
        <TabsList>
          <TabsTrigger value="dashboard" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="atividades" className="gap-2">
            <ListTodo className="h-4 w-4" />
            Atividades
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6 mt-6">
          {/* Cards por Categoria */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {(['seven', 'incorporadora', 'imobiliaria', 'cliente'] as AtividadeCategoria[]).map((cat) => {
              const cfg = CATEGORIA_CONFIG[cat];
              return (
                <CategoriaCard
                  key={cat}
                  nome={ATIVIDADE_CATEGORIA_LABELS[cat]}
                  icon={cfg.icon}
                  iconColor={cfg.iconColor}
                  bgColor={cfg.bgColor}
                  dados={resumoCategorias?.[cat]}
                />
              );
            })}
          </div>

          {/* Funil e Visitas */}
          <div className="grid gap-4 lg:grid-cols-2">
            <FunilTemperatura empreendimentoIds={empreendimentoIds} />
            <VisitasPorEmpreendimento empreendimentoIds={empreendimentoIds} />
          </div>

          {/* Atividades e Próximas */}
          <div className="grid gap-4 lg:grid-cols-2">
            <AtividadesPorTipo empreendimentoIds={empreendimentoIds} />
            <ProximasAtividades empreendimentoIds={empreendimentoIds} />
          </div>

          {/* Atendimentos - ocupa largura total */}
          <AtendimentosResumo empreendimentoIds={empreendimentoIds} />

          {/* Lista de Atendimentos */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Headphones className="h-4 w-4 text-primary" />
                  Lista de Atendimentos
                </CardTitle>
                <Badge variant="secondary">{atendimentos?.length || 0}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {loadingAtend ? (
                <div className="space-y-2">
                  {[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full" />)}
                </div>
              ) : !atendimentos?.length ? (
                <p className="text-center text-muted-foreground py-6 text-sm">
                  Nenhum atendimento encontrado
                </p>
              ) : (
                <ScrollArea className="h-[280px]">
                  <div className="space-y-2 pr-3">
                    {atendimentos.map((at: any) => (
                      <div key={at.id} className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{at.titulo}</p>
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                            {at.cliente && <span>👤 {at.cliente.nome}</span>}
                            {at.empreendimento && <span>🏢 {at.empreendimento.nome}</span>}
                            <span>📅 {format(parseISO(at.data_inicio), 'dd/MM/yyyy', { locale: ptBR })}</span>
                          </div>
                        </div>
                        <Badge className={`text-xs ml-2 flex-shrink-0 ${ATIVIDADE_STATUS_BADGE[at.status] || ''}`}>
                          {at.status === 'pendente' ? 'Pendente' : at.status === 'concluida' ? 'Concluída' : at.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Negociações */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Previsões e Negócios
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* KPIs de negociações */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-2xl font-bold">{negKPIs.total}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Total</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 border border-yellow-200 text-center">
                  <p className="text-2xl font-bold text-yellow-700">{negKPIs.pendentes}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Pendentes</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 border border-green-200 text-center">
                  <p className="text-2xl font-bold text-green-700">{negKPIs.aprovadas}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Aprovadas</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 border border-destructive/30 text-center">
                  <p className="text-2xl font-bold text-destructive">{negKPIs.rejeitadas}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Rejeitadas</p>
                </div>
              </div>

              {/* Lista de negociações */}
              {loadingNeg ? (
                <div className="space-y-2">
                  {[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full" />)}
                </div>
              ) : !negociacoes?.length ? (
                <p className="text-center text-muted-foreground py-6 text-sm">
                  Nenhuma negociação encontrada
                </p>
              ) : (
                <ScrollArea className="h-[280px]">
                  <div className="space-y-2 pr-3">
                    {negociacoes.map((neg: any) => {
                      const statusCfg = STATUS_APROVACAO_LABELS[neg.status_aprovacao] || STATUS_APROVACAO_LABELS.pendente;
                      return (
                        <div key={neg.id} className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono text-muted-foreground">{neg.codigo}</span>
                              {neg.cliente && <span className="text-sm font-medium truncate">👤 {neg.cliente.nome}</span>}
                            </div>
                            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                              {neg.empreendimento && <span>🏢 {neg.empreendimento.nome}</span>}
                              {neg.valor_total && (
                                <span>💰 {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(neg.valor_total)}</span>
                              )}
                              <span>📅 {format(parseISO(neg.created_at), 'dd/MM/yyyy', { locale: ptBR })}</span>
                            </div>
                          </div>
                          <Badge variant="outline" className={`text-xs ml-2 flex-shrink-0 ${statusCfg.badgeClass}`}>
                            {statusCfg.label}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Atividades Tab */}
        <TabsContent value="atividades" className="space-y-6 mt-6">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <CalendarioCompacto 
                empreendimentoIds={empreendimentoIds} 
                onDayClick={setDataSelecionada}
                selectedDate={dataSelecionada}
              />
            </div>
            <div className="lg:col-span-2">
              <AtividadesListaPortal 
                empreendimentoIds={empreendimentoIds}
                dataSelecionada={dataSelecionada}
                onLimparData={() => setDataSelecionada(null)}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
