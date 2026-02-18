import { useState } from 'react';
import { useIncorporadorEmpreendimentos } from '@/hooks/useIncorporadorEmpreendimentos';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import {
  Palette,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  List,
} from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CORES_ARRAY, TOOLTIP_STYLE } from '@/lib/chartColors';


const CATEGORIA_LABELS: Record<string, string> = {
  'render_3d': 'Render 3D',
  'design_grafico': 'Design Gráfico',
  'video_animacao': 'Vídeo/Animação',
  'evento': 'Evento',
  'pedido_orcamento': 'Orçamento',
};

const ETAPA_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

interface TicketResumo {
  id: string;
  codigo: string;
  titulo: string;
  categoria: string;
  status: string;
  data_previsao: string | null;
  is_interno: boolean;
  dias_atraso?: number;
  dias_restantes?: number;
}

const STATUS_TICKET_LABELS: Record<string, { label: string; cls: string }> = {
  em_producao: { label: 'Em Produção', cls: 'bg-blue-100 text-blue-800' },
  aguardando_aprovacao: { label: 'Aguard. Aprovação', cls: 'bg-yellow-100 text-yellow-800' },
  aprovado: { label: 'Aprovado', cls: 'bg-green-100 text-green-800' },
  revisao: { label: 'Revisão', cls: 'bg-orange-100 text-orange-800' },
  concluido: { label: 'Concluído', cls: 'bg-muted text-muted-foreground' },
  arquivado: { label: 'Arquivado', cls: 'bg-muted text-muted-foreground' },
};

export default function PortalIncorporadorMarketing() {
  const [statusFiltro, setStatusFiltro] = useState<string>('todos');
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('todos');
  const [detalheTicketId, setDetalheTicketId] = useState<string | null>(null);
  const { empreendimentoIds, isLoading: loadingEmps } = useIncorporadorEmpreendimentos();

  // Query para detalhe do ticket selecionado
  const { data: ticketDetalhe, isLoading: loadingDetalhe } = useQuery({
    queryKey: ['ticket-portal-detalhe', detalheTicketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projetos_marketing')
        .select(`
          *,
          cliente:cliente_id(id, full_name, email),
          supervisor:supervisor_id(id, full_name),
          empreendimento:empreendimento_id(id, nome),
          briefing:briefing_id(id, codigo, cliente, tema, objetivo, formato_peca, composicao, head_titulo, sub_complemento, mensagem_chave, tom_comunicacao, estilo_visual, diretrizes_visuais, referencia, importante, observacoes, status)
        `)
        .eq('id', detalheTicketId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!detalheTicketId,
  });
  
  // Query customizada para incorporadores
  const { data, isLoading: loadingDash } = useQuery({
    queryKey: ['incorporador-marketing', empreendimentoIds],
    queryFn: async () => {
      if (!empreendimentoIds.length) return null;
      
      const hoje = new Date();
      const hojeStr = format(hoje, 'yyyy-MM-dd');
      
      // Buscar etapas (incluindo is_final para filtrar tickets concluídos)
      const { data: etapas } = await supabase
        .from('ticket_etapas')
        .select('id, nome, cor, ordem, is_final')
        .eq('is_active', true)
        .order('ordem');
      
      // Criar conjunto de IDs de etapas finais
      const etapasFinaisIds = new Set(
        (etapas || []).filter(e => e.is_final).map(e => e.id)
      );
      
      // Buscar tickets dos empreendimentos do incorporador
      const { data: tickets, error } = await supabase
        .from('projetos_marketing')
        .select('id, codigo, titulo, categoria, status, ticket_etapa_id, data_previsao, is_interno, created_at')
        .eq('is_active', true)
        .in('empreendimento_id', empreendimentoIds);
      
      if (error) throw error;
      
      const allTickets = tickets || [];
      
      // KPIs - considera etapas finais como concluídos
      const ticketsAtivos = allTickets.filter(t => {
        if (['concluido', 'arquivado'].includes(t.status)) return false;
        if (t.ticket_etapa_id && etapasFinaisIds.has(t.ticket_etapa_id)) return false;
        return true;
      }).length;
      
      const emProducao = allTickets.filter(t => t.status === 'em_producao').length;
      const concluidosPeriodo = allTickets.filter(t => t.status === 'concluido').length;
      
      // Tickets atrasados - exclui etapas finais
      const ticketsAtrasados: TicketResumo[] = allTickets
        .filter(t => {
          if (['concluido', 'arquivado'].includes(t.status)) return false;
          if (t.ticket_etapa_id && etapasFinaisIds.has(t.ticket_etapa_id)) return false;
          if (!t.data_previsao) return false;
          return t.data_previsao < hojeStr;
        })
        .map(t => ({
          id: t.id,
          codigo: t.codigo,
          titulo: t.titulo,
          categoria: t.categoria,
          status: t.status,
          data_previsao: t.data_previsao,
          is_interno: t.is_interno,
          dias_atraso: t.data_previsao ? differenceInDays(hoje, parseISO(t.data_previsao)) : 0,
        }))
        .sort((a, b) => (b.dias_atraso || 0) - (a.dias_atraso || 0));
      
      // Próximas entregas (7 dias) - exclui etapas finais
      const seteDiasFrente = format(new Date(hoje.getTime() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
      const proximasEntregas: TicketResumo[] = allTickets
        .filter(t => {
          if (['concluido', 'arquivado'].includes(t.status)) return false;
          if (t.ticket_etapa_id && etapasFinaisIds.has(t.ticket_etapa_id)) return false;
          if (!t.data_previsao) return false;
          return t.data_previsao >= hojeStr && t.data_previsao <= seteDiasFrente;
        })
        .map(t => ({
          id: t.id,
          codigo: t.codigo,
          titulo: t.titulo,
          categoria: t.categoria,
          status: t.status,
          data_previsao: t.data_previsao,
          is_interno: t.is_interno,
          dias_restantes: t.data_previsao ? differenceInDays(parseISO(t.data_previsao), hoje) : 0,
        }))
        .sort((a, b) => (a.dias_restantes || 0) - (b.dias_restantes || 0));
      
      // Por etapa
      const etapaCountMap = new Map<string, number>();
      allTickets.forEach(t => {
        if (t.ticket_etapa_id) {
          etapaCountMap.set(t.ticket_etapa_id, (etapaCountMap.get(t.ticket_etapa_id) || 0) + 1);
        }
      });
      
      const porEtapa = (etapas || []).map((etapa, idx) => ({
        name: etapa.nome,
        value: etapaCountMap.get(etapa.id) || 0,
        color: etapa.cor || ETAPA_COLORS[idx % ETAPA_COLORS.length],
      })).filter(e => e.value > 0);
      
      // Por categoria
      const categoriaCounts: Record<string, number> = {};
      allTickets.forEach(t => {
        if (!categoriaCounts[t.categoria]) {
          categoriaCounts[t.categoria] = 0;
        }
        categoriaCounts[t.categoria]++;
      });
      
      const porCategoria = Object.entries(categoriaCounts).map(([cat, total], idx) => ({
        name: CATEGORIA_LABELS[cat] || cat,
        value: total,
        color: CORES_ARRAY[idx % CORES_ARRAY.length],
      })).filter(e => e.value > 0);
      
      return {
        ticketsAtivos,
        emProducao,
        concluidosPeriodo,
        atrasados: ticketsAtrasados.length,
        proximasEntregas,
        porEtapa,
        porCategoria,
        allTickets: allTickets.filter(t => t.status !== 'arquivado'),
        etapas: etapas || [],
      };
    },
    enabled: empreendimentoIds.length > 0,
  });

  const isLoading = loadingEmps || loadingDash;

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

  if (!data) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Nenhum dado de marketing disponível.
      </div>
    );
  }

  // Tooltip customizado para os gráficos
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) => {
    if (!active || !payload?.[0]) return null;
    const item = payload[0];
    return (
      <div style={TOOLTIP_STYLE} className="p-3">
        <p className="font-medium text-sm">{item.name}</p>
        <p className="text-sm text-muted-foreground">{item.value} ticket(s)</p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Palette className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{data.ticketsAtivos}</p>
                <p className="text-sm text-muted-foreground">Tickets Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-chart-3/10">
                <Clock className="h-5 w-5 text-chart-3" />
              </div>
              <div>
                <p className="text-2xl font-bold">{data.emProducao}</p>
                <p className="text-sm text-muted-foreground">Em Produção</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-chart-2/10">
                <CheckCircle2 className="h-5 w-5 text-chart-2" />
              </div>
              <div>
                <p className="text-2xl font-bold">{data.concluidosPeriodo}</p>
                <p className="text-sm text-muted-foreground">Concluídos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{data.atrasados}</p>
                <p className="text-sm text-muted-foreground">Atrasados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tickets por Etapa</CardTitle>
          </CardHeader>
          <CardContent>
            {data.porEtapa.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Sem tickets ativos</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={data.porEtapa}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {data.porEtapa.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 pt-2">
                  {data.porEtapa.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs">
                      <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-muted-foreground">{item.name} ({item.value})</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            {data.porCategoria.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Sem dados</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={data.porCategoria}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {data.porCategoria.map((entry, index) => (
                        <Cell key={`cell-cat-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 pt-2">
                  {data.porCategoria.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs">
                      <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-muted-foreground">{item.name} ({item.value})</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Lista completa de tickets */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <List className="h-4 w-4 text-primary" />
              Todos os Tickets Ativos
              <Badge variant="secondary">{data.allTickets.length}</Badge>
            </CardTitle>
            <div className="flex gap-2 flex-wrap">
              <Select value={statusFiltro} onValueChange={setStatusFiltro}>
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os status</SelectItem>
                  {Object.entries(STATUS_TICKET_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={categoriaFiltro} onValueChange={setCategoriaFiltro}>
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas as cat.</SelectItem>
                  {Object.entries(CATEGORIA_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[360px]">
            {(() => {
              const filtered = data.allTickets.filter(t => {
                if (statusFiltro !== 'todos' && t.status !== statusFiltro) return false;
                if (categoriaFiltro !== 'todos' && t.categoria !== categoriaFiltro) return false;
                return true;
              });
              if (filtered.length === 0) return (
                <p className="text-center text-muted-foreground py-8 text-sm">Nenhum ticket encontrado</p>
              );
              const hoje = format(new Date(), 'yyyy-MM-dd');
              return (
                <div className="space-y-2 pr-3">
                  {filtered.map(ticket => {
                    const atrasado = ticket.data_previsao && ticket.data_previsao < hoje;
                    const statusCfg = STATUS_TICKET_LABELS[ticket.status] || { label: ticket.status, cls: 'bg-muted text-muted-foreground' };
                    return (
                      <div
                        key={ticket.id}
                        onClick={() => setDetalheTicketId(ticket.id)}
                        className={`flex items-center justify-between p-3 border rounded-lg transition-colors hover:bg-muted/50 cursor-pointer ${atrasado ? 'border-destructive/40' : ''}`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span className="text-xs text-muted-foreground font-mono shrink-0">{ticket.codigo}</span>
                          <div className="min-w-0">
                            <p className="text-sm truncate">{ticket.titulo}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-muted-foreground">{CATEGORIA_LABELS[ticket.categoria] || ticket.categoria}</span>
                              {ticket.data_previsao && (
                                <span className={`text-xs flex items-center gap-1 ${atrasado ? 'text-destructive' : 'text-muted-foreground'}`}>
                                  <Calendar className="h-3 w-3" />
                                  {format(parseISO(ticket.data_previsao), 'dd/MM', { locale: ptBR })}
                                  {atrasado && ` (${differenceInDays(new Date(), parseISO(ticket.data_previsao))}d atraso)`}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className={`text-xs ml-2 flex-shrink-0 ${statusCfg.cls}`}>
                          {statusCfg.label}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Próximas Entregas - Largura total */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Próximas Entregas (7 dias)</CardTitle>
          <Badge variant="secondary">{data.proximasEntregas.length}</Badge>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[280px]">
            {data.proximasEntregas.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma entrega prevista
              </p>
            ) : (
              <div className="space-y-2">
                {data.proximasEntregas.map((ticket) => (
                  <div key={ticket.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <span className="text-xs text-muted-foreground font-mono shrink-0">{ticket.codigo}</span>
                      <span className="text-sm truncate">{ticket.titulo}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Badge variant="outline" className="text-xs">
                        {CATEGORIA_LABELS[ticket.categoria] || ticket.categoria}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground w-16 justify-end">
                        <Calendar className="h-3 w-3" />
                        {ticket.data_previsao && format(parseISO(ticket.data_previsao), 'dd/MM', { locale: ptBR })}
                      </div>
                      {ticket.dias_restantes !== undefined && (
                        <Badge 
                          variant={ticket.dias_restantes <= 1 ? 'destructive' : 'secondary'} 
                          className="text-xs w-12 justify-center"
                        >
                          {ticket.dias_restantes === 0 ? 'Hoje' : `${ticket.dias_restantes}d`}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Modal de detalhe do ticket */}
      <Dialog open={!!detalheTicketId} onOpenChange={(open) => !open && setDetalheTicketId(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-start gap-2 flex-wrap">
              {ticketDetalhe && (
                <span className="font-mono text-sm text-muted-foreground shrink-0">{(ticketDetalhe as any).codigo}</span>
              )}
              <span className="flex-1">{(ticketDetalhe as any)?.titulo}</span>
            </DialogTitle>
          </DialogHeader>

          {loadingDetalhe ? (
            <div className="space-y-3 py-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : ticketDetalhe ? (
            <div className="space-y-4 py-2">
              {/* Badges de status, categoria e prioridade */}
              <div className="flex flex-wrap gap-2">
                {(() => {
                  const t = ticketDetalhe as any;
                  const statusCfg = STATUS_TICKET_LABELS[t.status] || { label: t.status, cls: 'bg-muted text-muted-foreground' };
                  return (
                    <>
                      <Badge variant="outline" className={`text-xs ${statusCfg.cls}`}>{statusCfg.label}</Badge>
                      <Badge variant="outline" className="text-xs">{CATEGORIA_LABELS[t.categoria] || t.categoria}</Badge>
                      {t.prioridade && (
                        <Badge variant="outline" className="text-xs capitalize">{t.prioridade}</Badge>
                      )}
                      {t.is_interno && (
                        <Badge variant="secondary" className="text-xs">Interno</Badge>
                      )}
                    </>
                  );
                })()}
              </div>

              {/* Empreendimento e datas */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                {(ticketDetalhe as any).empreendimento && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Empreendimento</p>
                    <p className="font-medium">{(ticketDetalhe as any).empreendimento.nome}</p>
                  </div>
                )}
                {(ticketDetalhe as any).supervisor && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Supervisor</p>
                    <p className="font-medium">{(ticketDetalhe as any).supervisor.full_name}</p>
                  </div>
                )}
                {(ticketDetalhe as any).data_previsao && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Previsão de Entrega</p>
                    <p className="font-medium">
                      {format(parseISO((ticketDetalhe as any).data_previsao), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                )}
                {(ticketDetalhe as any).data_entrega && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Data de Entrega</p>
                    <p className="font-medium">
                      {format(parseISO((ticketDetalhe as any).data_entrega), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                )}
              </div>

              {/* Descrição */}
              {(ticketDetalhe as any).descricao && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Descrição</p>
                    <p className="text-sm whitespace-pre-wrap">{(ticketDetalhe as any).descricao}</p>
                  </div>
                </>
              )}

              {/* Briefing vinculado */}
              {(ticketDetalhe as any).briefing && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Briefing vinculado</p>
                    {(() => {
                      const b = (ticketDetalhe as any).briefing;
                      const campos = [
                        { label: 'Tema', value: b.tema },
                        { label: 'Objetivo', value: b.objetivo },
                        { label: 'Formato da Peça', value: b.formato_peca },
                        { label: 'Composição', value: b.composicao },
                        { label: 'Head / Título', value: b.head_titulo },
                        { label: 'Mensagem-Chave', value: b.mensagem_chave },
                        { label: 'Tom de Comunicação', value: b.tom_comunicacao },
                        { label: 'Estilo Visual', value: b.estilo_visual },
                        { label: 'Diretrizes Visuais', value: b.diretrizes_visuais },
                        { label: 'Referência', value: b.referencia },
                        { label: 'Importante', value: b.importante },
                        { label: 'Observações', value: b.observacoes },
                      ].filter(c => c.value);
                      return (
                        <div className="grid grid-cols-1 gap-2">
                          {campos.map(c => (
                            <div key={c.label} className="text-sm">
                              <span className="text-xs text-muted-foreground">{c.label}: </span>
                              <span>{c.value}</span>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </>
              )}

              {/* Texto do briefing inline */}
              {(ticketDetalhe as any).briefing_texto && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Briefing</p>
                    <p className="text-sm whitespace-pre-wrap">{(ticketDetalhe as any).briefing_texto}</p>
                  </div>
                </>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
