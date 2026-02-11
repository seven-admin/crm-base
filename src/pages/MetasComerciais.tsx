import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Target, TrendingUp, DollarSign, Users, Edit2, ChevronLeft, ChevronRight, Plus, Trash2, AlertTriangle, Copy, Building, CalendarIcon } from 'lucide-react';
import { format, startOfMonth, addMonths, subMonths, getYear, startOfWeek, addWeeks } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  useMetasPorMes, 
  useVendasRealizadasMes, 
  useForecastFechamento, 
  useRankingCorretoresMes,
  useHistoricoMetas,
  useCreateMeta,
  useTodasMetas,
  useDeleteMeta,
  useMetasVsRealizadoPorEmpreendimento,
  useCopiarMetas,
  MetaComercialComEmpreendimento
} from '@/hooks/useMetasComerciais';
import { useEmpreendimentos } from '@/hooks/useEmpreendimentos';
import { usePermissions } from '@/hooks/usePermissions';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import { CORES_DASHBOARD, TOOLTIP_STYLE } from '@/lib/chartColors';
import { formatarMoeda } from '@/lib/formatters';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const mesesOptions = [
  { value: '01', label: 'Janeiro' },
  { value: '02', label: 'Fevereiro' },
  { value: '03', label: 'Março' },
  { value: '04', label: 'Abril' },
  { value: '05', label: 'Maio' },
  { value: '06', label: 'Junho' },
  { value: '07', label: 'Julho' },
  { value: '08', label: 'Agosto' },
  { value: '09', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' },
];

const currentYear = getYear(new Date());
const anosOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

const MetasComerciais = () => {
  const [competencia, setCompetencia] = useState(new Date());
  const [empreendimentoId, setEmpreendimentoId] = useState<string | undefined>(undefined);
  const [showEditMeta, setShowEditMeta] = useState(false);
  const [editingMeta, setEditingMeta] = useState<MetaComercialComEmpreendimento | null>(null);
  const [metaValor, setMetaValor] = useState<number>(0);
  const [metaUnidades, setMetaUnidades] = useState('');
  const [metaVisitas, setMetaVisitas] = useState('');
  const [metaAtendimentos, setMetaAtendimentos] = useState('');
  const [metaTreinamentos, setMetaTreinamentos] = useState('');
  const [metaPropostas, setMetaPropostas] = useState('');
  const [metaMes, setMetaMes] = useState(format(new Date(), 'MM'));
  const [metaAno, setMetaAno] = useState(currentYear.toString());
  const [metaEscopo, setMetaEscopo] = useState<'geral' | 'empreendimento'>('geral');
  const [metaEmpreendimentoId, setMetaEmpreendimentoId] = useState<string>('');
  const [metaPeriodicidade, setMetaPeriodicidade] = useState<'mensal' | 'semanal'>('mensal');
  const [metaSemanaDate, setMetaSemanaDate] = useState<Date | undefined>(undefined);
  const [anoFiltro, setAnoFiltro] = useState(currentYear);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showCopiarMetas, setShowCopiarMetas] = useState(false);
  const [copiaOrigem, setCopiaOrigem] = useState({ mes: format(new Date(), 'MM'), ano: currentYear.toString() });
  const [copiaDestino, setCopiaDestino] = useState({ mes: '', ano: '' });

  const { isAdmin } = usePermissions();
  const { data: empreendimentos } = useEmpreendimentos();
  
  const { data: meta, isLoading: loadingMeta } = useMetasPorMes(competencia, empreendimentoId);
  const { data: vendas, isLoading: loadingVendas } = useVendasRealizadasMes(competencia, empreendimentoId);
  const { data: forecast, isLoading: loadingForecast } = useForecastFechamento(competencia, empreendimentoId);
  const { data: ranking, isLoading: loadingRanking } = useRankingCorretoresMes(competencia, empreendimentoId);
  const { data: historico, isLoading: loadingHistorico } = useHistoricoMetas(6, empreendimentoId);
  const { data: todasMetas, isLoading: loadingTodasMetas } = useTodasMetas(anoFiltro);
  const { data: comparativoEmpreendimentos, isLoading: loadingComparativo } = useMetasVsRealizadoPorEmpreendimento(competencia);
  
  const createMeta = useCreateMeta();
  const deleteMeta = useDeleteMeta();
  const copiarMetas = useCopiarMetas();

  // Verificar se é o mês atual
  const isMesAtual = format(competencia, 'yyyy-MM') === format(new Date(), 'yyyy-MM');

  const isLoading = loadingMeta || loadingVendas || loadingForecast;

  // Calcular atingimento
  const atingimentoValor = meta?.meta_valor && meta.meta_valor > 0 
    ? ((vendas?.totalValor || 0) / meta.meta_valor) * 100 
    : 0;
  const atingimentoUnidades = meta?.meta_unidades && meta.meta_unidades > 0 
    ? ((vendas?.totalUnidades || 0) / meta.meta_unidades) * 100 
    : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handlePrevMonth = () => {
    setCompetencia(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCompetencia(prev => addMonths(prev, 1));
  };

  const resetMetaFields = () => {
    setMetaVisitas('');
    setMetaAtendimentos('');
    setMetaTreinamentos('');
    setMetaPropostas('');
    setMetaPeriodicidade('mensal');
    setMetaSemanaDate(undefined);
  };

  const handleOpenEditMeta = () => {
    setEditingMeta(null);
    setMetaValor(meta?.meta_valor || 0);
    setMetaUnidades(meta?.meta_unidades?.toString() || '');
    setMetaVisitas((meta as any)?.meta_visitas?.toString() || '');
    setMetaAtendimentos((meta as any)?.meta_atendimentos?.toString() || '');
    setMetaTreinamentos((meta as any)?.meta_treinamentos?.toString() || '');
    setMetaPropostas((meta as any)?.meta_propostas?.toString() || '');
    setMetaMes(format(competencia, 'MM'));
    setMetaAno(format(competencia, 'yyyy'));
    setMetaEscopo(empreendimentoId ? 'empreendimento' : 'geral');
    setMetaEmpreendimentoId(empreendimentoId || '');
    setShowEditMeta(true);
  };

  const handleOpenNewMeta = () => {
    setEditingMeta(null);
    setMetaValor(0);
    setMetaUnidades('');
    resetMetaFields();
    setMetaMes(format(new Date(), 'MM'));
    setMetaAno(currentYear.toString());
    setMetaEscopo('geral');
    setMetaEmpreendimentoId('');
    setMetaPeriodicidade('mensal');
    setMetaSemanaDate(undefined);
    setShowEditMeta(true);
  };

  const handleEditExistingMeta = (metaItem: MetaComercialComEmpreendimento) => {
    setEditingMeta(metaItem);
    setMetaValor(metaItem.meta_valor || 0);
    setMetaUnidades(metaItem.meta_unidades?.toString() || '');
    setMetaVisitas((metaItem as any).meta_visitas?.toString() || '');
    setMetaAtendimentos((metaItem as any).meta_atendimentos?.toString() || '');
    setMetaTreinamentos((metaItem as any).meta_treinamentos?.toString() || '');
    setMetaPropostas((metaItem as any).meta_propostas?.toString() || '');
    const periodicidade = (metaItem as any).periodicidade || 'mensal';
    setMetaPeriodicidade(periodicidade);
    const competenciaDate = new Date(metaItem.competencia + 'T00:00:00');
    setMetaMes(format(competenciaDate, 'MM'));
    setMetaAno(format(competenciaDate, 'yyyy'));
    if (periodicidade === 'semanal') {
      setMetaSemanaDate(competenciaDate);
    } else {
      setMetaSemanaDate(undefined);
    }
    setMetaEscopo(metaItem.empreendimento_id ? 'empreendimento' : 'geral');
    setMetaEmpreendimentoId(metaItem.empreendimento_id || '');
    setShowEditMeta(true);
  };

  const handleSaveMeta = async () => {
    try {
      let competenciaStr: string;
      if (metaPeriodicidade === 'semanal') {
        if (!metaSemanaDate) {
          toast.error('Selecione a semana');
          return;
        }
        const monday = startOfWeek(metaSemanaDate, { weekStartsOn: 1 });
        competenciaStr = format(monday, 'yyyy-MM-dd');
      } else {
        competenciaStr = `${metaAno}-${metaMes}-01`;
      }
      await createMeta.mutateAsync({
        competencia: competenciaStr,
        periodicidade: metaPeriodicidade,
        empreendimento_id: metaEscopo === 'empreendimento' ? metaEmpreendimentoId : null,
        corretor_id: null,
        meta_valor: metaValor || 0,
        meta_unidades: parseInt(metaUnidades) || 0,
        meta_visitas: parseInt(metaVisitas) || 0,
        meta_atendimentos: parseInt(metaAtendimentos) || 0,
        meta_treinamentos: parseInt(metaTreinamentos) || 0,
        meta_propostas: parseInt(metaPropostas) || 0,
      });
      toast.success('Meta salva com sucesso!');
      setShowEditMeta(false);
    } catch (error) {
      toast.error('Erro ao salvar meta');
    }
  };

  const handleDeleteMeta = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteMeta.mutateAsync(deleteConfirmId);
      toast.success('Meta excluída com sucesso!');
      setDeleteConfirmId(null);
    } catch (error) {
      toast.error('Erro ao excluir meta');
    }
  };

  const handleCopiarMetas = async () => {
    if (!copiaDestino.mes || !copiaDestino.ano) return;
    
    try {
      const origemCompetencia = `${copiaOrigem.ano}-${copiaOrigem.mes}-01`;
      const destinoCompetencia = `${copiaDestino.ano}-${copiaDestino.mes}-01`;
      
      const quantidade = await copiarMetas.mutateAsync({ origemCompetencia, destinoCompetencia });
      toast.success(`${quantidade} meta(s) copiada(s) com sucesso!`);
      setShowCopiarMetas(false);
      setCopiaDestino({ mes: '', ano: '' });
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao copiar metas');
    }
  };

  const getAtingimentoColor = (percentual: number) => {
    if (percentual >= 100) return 'text-green-500';
    if (percentual >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getAtingimentoBadge = (percentual: number) => {
    if (percentual >= 100) return 'default';
    if (percentual >= 70) return 'secondary';
    return 'destructive';
  };

  return (
    <MainLayout
      title="Metas Comerciais"
      subtitle="Acompanhe o desempenho de vendas vs metas"
    >
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="gerenciar">Gerenciar Metas</TabsTrigger>
        </TabsList>

        {/* Tab Dashboard */}
        <TabsContent value="dashboard">
          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handlePrevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-lg font-semibold min-w-[140px] text-center capitalize">
                {format(competencia, 'MMMM yyyy', { locale: ptBR })}
              </div>
              <Button variant="outline" size="icon" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <Select 
              value={empreendimentoId || 'all'} 
              onValueChange={(v) => setEmpreendimentoId(v === 'all' ? undefined : v)}
            >
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Todos os empreendimentos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os empreendimentos</SelectItem>
                {empreendimentos?.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {isAdmin() && (
              <Button variant="outline" onClick={handleOpenEditMeta} className="gap-2">
                <Edit2 className="h-4 w-4" />
                {meta ? 'Editar Meta' : 'Definir Meta'}
              </Button>
            )}
          </div>

          {/* Alerta de Atingimento Baixo */}
          {!isLoading && meta && atingimentoValor < 70 && isMesAtual && (
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Atenção: Meta em Risco</AlertTitle>
              <AlertDescription>
                O atingimento atual está em <strong>{atingimentoValor.toFixed(1)}%</strong> da meta.
                Faltam <strong>{formatCurrency((meta.meta_valor || 0) - (vendas?.totalValor || 0))}</strong> para 
                atingir 100% e <strong>{Math.ceil((meta.meta_unidades || 0) - (vendas?.totalUnidades || 0))}</strong> unidades.
              </AlertDescription>
            </Alert>
          )}

          {/* Cards KPI */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Meta do Mês */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Meta do Mês</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                ) : meta ? (
                  <>
                    <div className="text-2xl font-bold">{formatCurrency(meta.meta_valor)}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {meta.meta_unidades} unidades
                    </p>
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground">Meta não definida</div>
                )}
              </CardContent>
            </Card>

            {/* Vendas Realizadas */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Vendas Realizadas</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{formatCurrency(vendas?.totalValor || 0)}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {vendas?.totalUnidades || 0} unidades vendidas
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Atingimento */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Atingimento</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                ) : meta ? (
                  <>
                    <div className={`text-2xl font-bold ${getAtingimentoColor(atingimentoValor)}`}>
                      {atingimentoValor.toFixed(1)}%
                    </div>
                    <div className="flex gap-2 mt-1">
                      <Badge variant={getAtingimentoBadge(atingimentoValor)}>
                        Valor: {atingimentoValor.toFixed(0)}%
                      </Badge>
                      <Badge variant={getAtingimentoBadge(atingimentoUnidades)}>
                        Unid: {atingimentoUnidades.toFixed(0)}%
                      </Badge>
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground">Defina uma meta</div>
                )}
              </CardContent>
            </Card>

            {/* Forecast */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Forecast Ponderado</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loadingForecast ? (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{formatCurrency(forecast?.valorPonderado || 0)}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {forecast?.quantidadePipeline || 0} em pipeline ({formatCurrency(forecast?.valorBruto || 0)} bruto)
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Gráfico e Ranking */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Gráfico Histórico */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Realizado vs Meta - Últimos 6 meses</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingHistorico ? (
                  <div className="flex items-center justify-center h-[300px]">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : historico && historico.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={historico} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="mesLabel" className="text-xs fill-muted-foreground" />
                      <YAxis 
                        className="text-xs fill-muted-foreground"
                        tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                      />
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={TOOLTIP_STYLE}
                      />
                      <Legend />
                      <Bar dataKey="meta" name="Meta" fill={CORES_DASHBOARD.cinza} radius={[4, 4, 0, 0]} barSize={24} />
                      <Bar dataKey="realizado" name="Realizado" fill={CORES_DASHBOARD.azul} radius={[4, 4, 0, 0]} barSize={24}>
                        <LabelList
                          dataKey="realizado"
                          position="top"
                          formatter={(value: number) => value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` : ''}
                          fill="hsl(var(--muted-foreground))"
                          fontSize={11}
                          fontWeight={500}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    Sem dados para exibir
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Ranking Corretores */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Ranking de Corretores
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingRanking ? (
                  <div className="flex items-center justify-center h-[300px]">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : ranking && ranking.length > 0 ? (
                  <div className="space-y-3">
                    {ranking.map((corretor, index) => (
                      <div key={corretor.id} className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0 ? 'bg-yellow-500 text-yellow-950' :
                          index === 1 ? 'bg-gray-300 text-gray-700' :
                          index === 2 ? 'bg-amber-600 text-amber-100' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{corretor.nome}</p>
                          <p className="text-xs text-muted-foreground">
                            {corretor.unidades} unidade{corretor.unidades !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="text-sm font-semibold text-right">
                          {formatCurrency(corretor.valor)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
                    Nenhuma venda no período
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Gráfico Comparativo por Empreendimento */}
          {comparativoEmpreendimentos && comparativoEmpreendimentos.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Meta vs Realizado por Empreendimento - {format(competencia, 'MMMM/yyyy', { locale: ptBR })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingComparativo ? (
                  <div className="flex items-center justify-center h-[350px]">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={Math.max(350, comparativoEmpreendimentos.length * 50)}>
                    <BarChart data={comparativoEmpreendimentos} layout="vertical" margin={{ left: 10, right: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis 
                        type="number" 
                        tickFormatter={(v) => formatCurrency(v)}
                        className="text-xs fill-muted-foreground"
                      />
                      <YAxis 
                        type="category" 
                        dataKey="nome" 
                        width={130}
                        className="text-xs fill-muted-foreground"
                      />
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={TOOLTIP_STYLE}
                      />
                      <Legend />
                      <Bar dataKey="meta" name="Meta" fill={CORES_DASHBOARD.cinza} radius={[0, 4, 4, 0]} />
                      <Bar dataKey="realizado" name="Realizado" fill={CORES_DASHBOARD.azul} radius={[0, 4, 4, 0]}>
                        <LabelList
                          dataKey="atingimento"
                          position="right"
                          formatter={(value: number) => `${value.toFixed(0)}%`}
                          fill="hsl(var(--muted-foreground))"
                          fontSize={11}
                          fontWeight={500}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab Gerenciar Metas */}
        <TabsContent value="gerenciar">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <Select value={anoFiltro.toString()} onValueChange={(v) => setAnoFiltro(parseInt(v))}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent>
                  {anosOptions.map((ano) => (
                    <SelectItem key={ano} value={ano.toString()}>
                      {ano}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isAdmin() && (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowCopiarMetas(true)} className="gap-2">
                  <Copy className="h-4 w-4" />
                  Copiar Metas
                </Button>
                <Button onClick={handleOpenNewMeta} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nova Meta
                </Button>
              </div>
            )}
          </div>

          <Card>
            <CardContent className="p-0">
              {loadingTodasMetas ? (
                <div className="flex items-center justify-center h-[300px]">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : todasMetas && todasMetas.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Competência</TableHead>
                      <TableHead>Periodicidade</TableHead>
                      <TableHead>Escopo</TableHead>
                      <TableHead className="text-right">Meta Valor</TableHead>
                      <TableHead className="text-right">Meta Unidades</TableHead>
                      <TableHead className="text-right">Visitas</TableHead>
                      <TableHead className="text-right">Atend.</TableHead>
                      <TableHead className="text-right">Trein.</TableHead>
                      <TableHead className="text-right">Propostas</TableHead>
                      {isAdmin() && <TableHead className="w-[100px]">Ações</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {todasMetas.map((metaItem) => (
                      <TableRow key={metaItem.id}>
                        <TableCell>
                          {(() => {
                            const periodicidade = (metaItem as any).periodicidade || 'mensal';
                            const compDate = new Date(metaItem.competencia + 'T00:00:00');
                            if (periodicidade === 'semanal') {
                              return `Semana de ${format(compDate, 'dd/MM/yyyy')}`;
                            }
                            return format(compDate, 'MMMM/yyyy', { locale: ptBR });
                          })()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={(metaItem as any).periodicidade === 'semanal' ? 'outline' : 'secondary'}>
                            {(metaItem as any).periodicidade === 'semanal' ? 'Semanal' : 'Mensal'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {metaItem.empreendimento ? (
                            <Badge variant="outline">{metaItem.empreendimento.nome}</Badge>
                          ) : (
                            <Badge variant="secondary">GERAL</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatarMoeda(metaItem.meta_valor || 0)}
                        </TableCell>
                        <TableCell className="text-right">
                          {metaItem.meta_unidades || 0}
                        </TableCell>
                        <TableCell className="text-right">
                          {(metaItem as any).meta_visitas || 0}
                        </TableCell>
                        <TableCell className="text-right">
                          {(metaItem as any).meta_atendimentos || 0}
                        </TableCell>
                        <TableCell className="text-right">
                          {(metaItem as any).meta_treinamentos || 0}
                        </TableCell>
                        <TableCell className="text-right">
                          {(metaItem as any).meta_propostas || 0}
                        </TableCell>
                        {isAdmin() && (
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditExistingMeta(metaItem)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteConfirmId(metaItem.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                  <Target className="h-12 w-12 mb-4" />
                  <p>Nenhuma meta cadastrada para {anoFiltro}</p>
                  {isAdmin() && (
                    <Button variant="link" onClick={handleOpenNewMeta} className="mt-2">
                      Criar primeira meta
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog Editar/Criar Meta */}
      <Dialog open={showEditMeta} onOpenChange={setShowEditMeta}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingMeta ? 'Editar Meta' : 'Nova Meta'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Periodicidade */}
            <div className="space-y-2">
              <Label>Periodicidade</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMetaPeriodicidade('mensal')}
                  className={cn(
                    'p-2 rounded-lg border text-sm transition-colors',
                    metaPeriodicidade === 'mensal'
                      ? 'border-primary bg-primary/10 text-primary font-medium'
                      : 'border-input hover:bg-accent'
                  )}
                >
                  Mensal
                </button>
                <button
                  type="button"
                  onClick={() => setMetaPeriodicidade('semanal')}
                  className={cn(
                    'p-2 rounded-lg border text-sm transition-colors',
                    metaPeriodicidade === 'semanal'
                      ? 'border-primary bg-primary/10 text-primary font-medium'
                      : 'border-input hover:bg-accent'
                  )}
                >
                  Semanal
                </button>
              </div>
            </div>

            {/* Competência - Mensal */}
            {metaPeriodicidade === 'mensal' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mês</Label>
                  <Select value={metaMes} onValueChange={setMetaMes}>
                    <SelectTrigger>
                      <SelectValue placeholder="Mês" />
                    </SelectTrigger>
                    <SelectContent>
                      {mesesOptions.map((mes) => (
                        <SelectItem key={mes.value} value={mes.value}>
                          {mes.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Ano</Label>
                  <Select value={metaAno} onValueChange={setMetaAno}>
                    <SelectTrigger>
                      <SelectValue placeholder="Ano" />
                    </SelectTrigger>
                    <SelectContent>
                      {anosOptions.map((ano) => (
                        <SelectItem key={ano} value={ano.toString()}>
                          {ano}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Competência - Semanal */}
            {metaPeriodicidade === 'semanal' && (
              <div className="space-y-2">
                <Label>Semana (selecione qualquer dia da semana)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !metaSemanaDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {metaSemanaDate
                        ? `Semana de ${format(startOfWeek(metaSemanaDate, { weekStartsOn: 1 }), 'dd/MM/yyyy')}`
                        : 'Selecione a semana'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={metaSemanaDate}
                      onSelect={setMetaSemanaDate}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {/* Escopo */}
            <div className="space-y-2">
              <Label>Escopo</Label>
              <Select value={metaEscopo} onValueChange={(v) => setMetaEscopo(v as 'geral' | 'empreendimento')}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o escopo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="geral">Meta Geral (todos empreendimentos)</SelectItem>
                  <SelectItem value="empreendimento">Por Empreendimento</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {metaEscopo === 'empreendimento' && (
              <div className="space-y-2">
                <Label>Empreendimento</Label>
                <Select value={metaEmpreendimentoId} onValueChange={setMetaEmpreendimentoId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o empreendimento" />
                  </SelectTrigger>
                  <SelectContent>
                    {empreendimentos?.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Meta de Valor */}
            <div className="space-y-2">
              <Label htmlFor="metaValor">Meta de Valor (R$)</Label>
              <CurrencyInput
                id="metaValor"
                value={metaValor}
                onChange={setMetaValor}
                placeholder="Ex: 5.000.000,00"
              />
            </div>
            
            {/* Meta de Unidades */}
            <div className="space-y-2">
              <Label htmlFor="metaUnidades">Meta de Unidades</Label>
              <Input
                id="metaUnidades"
                type="number"
                value={metaUnidades}
                onChange={(e) => setMetaUnidades(e.target.value)}
                placeholder="Ex: 20"
              />
            </div>

            {/* Novas metas de atividades */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="metaVisitas">Meta de Visitas</Label>
                <Input
                  id="metaVisitas"
                  type="number"
                  value={metaVisitas}
                  onChange={(e) => setMetaVisitas(e.target.value)}
                  placeholder="Ex: 30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="metaAtendimentos">Meta de Atendimentos</Label>
                <Input
                  id="metaAtendimentos"
                  type="number"
                  value={metaAtendimentos}
                  onChange={(e) => setMetaAtendimentos(e.target.value)}
                  placeholder="Ex: 50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="metaTreinamentos">Meta de Treinamentos</Label>
                <Input
                  id="metaTreinamentos"
                  type="number"
                  value={metaTreinamentos}
                  onChange={(e) => setMetaTreinamentos(e.target.value)}
                  placeholder="Ex: 4"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="metaPropostas">Meta de Propostas</Label>
                <Input
                  id="metaPropostas"
                  type="number"
                  value={metaPropostas}
                  onChange={(e) => setMetaPropostas(e.target.value)}
                  placeholder="Ex: 15"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditMeta(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveMeta} 
              disabled={createMeta.isPending || (metaEscopo === 'empreendimento' && !metaEmpreendimentoId)}
            >
              {createMeta.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Confirmar Exclusão */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta meta? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMeta}>
              {deleteMeta.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog Copiar Metas */}
      <Dialog open={showCopiarMetas} onOpenChange={setShowCopiarMetas}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Copiar Metas</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-6">
              {/* Origem */}
              <div className="space-y-3">
                <Label className="font-semibold">De (Origem)</Label>
                <Select value={copiaOrigem.mes} onValueChange={(v) => setCopiaOrigem({...copiaOrigem, mes: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Mês" />
                  </SelectTrigger>
                  <SelectContent>
                    {mesesOptions.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={copiaOrigem.ano} onValueChange={(v) => setCopiaOrigem({...copiaOrigem, ano: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Ano" />
                  </SelectTrigger>
                  <SelectContent>
                    {anosOptions.map((a) => (
                      <SelectItem key={a} value={a.toString()}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Destino */}
              <div className="space-y-3">
                <Label className="font-semibold">Para (Destino)</Label>
                <Select value={copiaDestino.mes} onValueChange={(v) => setCopiaDestino({...copiaDestino, mes: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Mês" />
                  </SelectTrigger>
                  <SelectContent>
                    {mesesOptions.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={copiaDestino.ano} onValueChange={(v) => setCopiaDestino({...copiaDestino, ano: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Ano" />
                  </SelectTrigger>
                  <SelectContent>
                    {anosOptions.map((a) => (
                      <SelectItem key={a} value={a.toString()}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground">
              Todas as metas (gerais e por empreendimento) do mês de origem serão copiadas para o mês de destino.
            </p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCopiarMetas(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCopiarMetas} 
              disabled={copiarMetas.isPending || !copiaDestino.mes || !copiaDestino.ano}
            >
              {copiarMetas.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Copiar Metas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default MetasComerciais;