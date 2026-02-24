import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ClipboardList, Monitor, X, Settings, ChevronLeft, ChevronRight, DollarSign, TrendingUp, Handshake, FileCheck, ListChecks } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CategoriaCard } from '@/components/forecast/CategoriaCard';
import { ForecastBatchStatusDialog } from '@/components/forecast/ForecastBatchStatusDialog';
import { VisitasPorEmpreendimento } from '@/components/forecast/VisitasPorEmpreendimento';
import { AtividadeForm } from '@/components/atividades/AtividadeForm';
import { useTVLayoutConfig } from '@/hooks/useTVLayoutConfig';
import { TVLayoutConfigDialog } from '@/components/tv-layout';
import { useResumoAtividades } from '@/hooks/useForecast';
import { useResumoAtividadesPorCategoria } from '@/hooks/useResumoAtividadesPorCategoria';
import { useForecastFinanceiro } from '@/hooks/useForecastFinanceiro';
import { ATIVIDADE_CATEGORIA_LABELS, TIPOS_FORECAST, type AtividadeCategoria } from '@/types/atividades.types';
import { Building2, Users, Briefcase, UserCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateAtividade, useCreateAtividadesParaGestores } from '@/hooks/useAtividades';
import { useGestoresProduto } from '@/hooks/useGestores';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { AtividadeFormSubmitData } from '@/components/atividades/AtividadeForm';
import { formatarMoeda } from '@/lib/formatters';

export default function Forecast() {
  const { role } = useAuth();
  const isSuperAdmin = role === 'super_admin';
  const [gestorId, setGestorId] = useState<string | undefined>(undefined);
  const [competencia, setCompetencia] = useState(new Date());
  const { data: gestores } = useGestoresProduto();
  
  const dataInicio = useMemo(() => startOfMonth(competencia), [competencia]);
  const dataFim = useMemo(() => endOfMonth(competencia), [competencia]);
  
  const { data: resumo, isLoading, refetch } = useResumoAtividades(gestorId, dataInicio, dataFim, undefined, TIPOS_FORECAST);
  const { data: resumoCategorias, isLoading: loadingCategorias } = useResumoAtividadesPorCategoria(gestorId, dataInicio, dataFim, undefined, TIPOS_FORECAST);
  const { data: financeiro, isLoading: loadingFinanceiro } = useForecastFinanceiro(gestorId, dataInicio, dataFim);

  const CATEGORIA_CONFIG: Record<AtividadeCategoria, { icon: typeof Building2; iconColor: string; bgColor: string }> = {
    seven: { icon: Briefcase, iconColor: 'text-primary', bgColor: 'bg-primary/10' },
    incorporadora: { icon: Building2, iconColor: 'text-chart-2', bgColor: 'bg-chart-2/10' },
    imobiliaria: { icon: Users, iconColor: 'text-chart-3', bgColor: 'bg-chart-3/10' },
    cliente: { icon: UserCheck, iconColor: 'text-chart-4', bgColor: 'bg-chart-4/10' },
  };

  const [dialogOpen, setDialogOpen] = useState(false);
  const [modoLote, setModoLote] = useState(false);
  const [batchDialog, setBatchDialog] = useState<{ open: boolean; categoria: AtividadeCategoria; statusGroup: string }>({ open: false, categoria: 'seven', statusGroup: 'abertas' });
  const [modoTV, setModoTV] = useState(false);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState(new Date());
  const createAtividade = useCreateAtividade();
  const createAtividadesParaGestores = useCreateAtividadesParaGestores();
  const { config, visibleItems, toggleVisibility, reorder, resetToDefault } = useTVLayoutConfig('forecast');

  const handleSubmit = (data: AtividadeFormSubmitData) => {
    if (data.gestorIds && data.gestorIds.length > 0) {
      createAtividadesParaGestores.mutate(
        { formData: data.formData, gestorIds: data.gestorIds },
        { onSuccess: () => setDialogOpen(false) }
      );
    } else {
      createAtividade.mutate(data.formData, {
        onSuccess: () => setDialogOpen(false),
      });
    }
  };

  const toggleModoTV = async () => {
    if (!modoTV) {
      try {
        await document.documentElement.requestFullscreen?.();
        setModoTV(true);
        setUltimaAtualizacao(new Date());
      } catch (e) {
        console.error('Fullscreen não suportado:', e);
      }
    } else {
      try { await document.exitFullscreen?.(); } catch {}
      setModoTV(false);
    }
  };

  useEffect(() => {
    const h = () => { if (!document.fullscreenElement) setModoTV(false); };
    document.addEventListener('fullscreenchange', h);
    return () => document.removeEventListener('fullscreenchange', h);
  }, []);

  useEffect(() => {
    if (!modoTV) return;
    const interval = setInterval(() => { refetch(); setUltimaAtualizacao(new Date()); }, 60000);
    return () => clearInterval(interval);
  }, [modoTV, refetch]);

  const renderKPIs = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {loadingCategorias ? (
        [...Array(4)].map((_, i) => <Skeleton key={i} className="h-40" />)
      ) : (
        (['seven', 'incorporadora', 'imobiliaria', 'cliente'] as AtividadeCategoria[]).map((cat) => {
          const cfg = CATEGORIA_CONFIG[cat];
          return (
            <CategoriaCard
              key={cat}
              nome={ATIVIDADE_CATEGORIA_LABELS[cat]}
              icon={cfg.icon}
              iconColor={cfg.iconColor}
              bgColor={cfg.bgColor}
              dados={resumoCategorias?.[cat]}
              onBadgeClick={modoLote ? (statusGroup) => setBatchDialog({ open: true, categoria: cat, statusGroup }) : undefined}
            />
          );
        })
      )}
    </div>
  );

  const renderFinanceiroKPIs = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {loadingFinanceiro ? (
        [...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)
      ) : (
        <>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-chart-2/10">
                  <DollarSign className="h-5 w-5 text-chart-2" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Valor em Vendas</p>
                  <p className="text-lg font-bold text-foreground truncate">{formatarMoeda(financeiro?.valorVendas || 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total Comissões</p>
                  <p className="text-lg font-bold text-foreground truncate">{formatarMoeda(financeiro?.totalComissoes || 0)}</p>
                  {(financeiro?.comissoesPorGestor?.length || 0) > 0 && (
                    <div className="mt-1 space-y-0.5">
                      {financeiro!.comissoesPorGestor.slice(0, 3).map((g) => (
                        <p key={g.gestor_id} className="text-[11px] text-muted-foreground truncate">
                          {g.gestor_nome}: {formatarMoeda(g.valor)}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-chart-3/10">
                  <Handshake className="h-5 w-5 text-chart-3" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Negociações Ativas</p>
                  <p className="text-lg font-bold text-foreground truncate">{formatarMoeda(financeiro?.valorNegociacoes || 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-chart-4/10">
                  <FileCheck className="h-5 w-5 text-chart-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Propostas Aceitas</p>
                  <p className="text-lg font-bold text-foreground truncate">{formatarMoeda(financeiro?.valorPropostasAceitas || 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );

  // TV Widget renderer
  const renderTVWidget = (itemId: string) => {
    switch (itemId) {
      case 'kpis':
        return <div key={itemId}>{renderKPIs()}</div>;
      case 'financeiro':
        return <div key={itemId}>{renderFinanceiroKPIs()}</div>;
      default:
        return null;
    }
  };

  // Modo TV
  if (modoTV) {
    return (
      <div className="fixed inset-0 z-50 bg-background overflow-auto">
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-foreground">FORECAST</h1>
            <span className="text-sm font-medium text-primary uppercase">
              {format(competencia, "MMM/yyyy", { locale: ptBR })}
            </span>
            <span className="text-muted-foreground text-sm">
              Última atualização: {format(ultimaAtualizacao, "HH:mm", { locale: ptBR })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setConfigDialogOpen(true)} className="text-muted-foreground hover:text-foreground">
              <Settings className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={toggleModoTV} className="text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5 mr-2" />
              Sair (ESC)
            </Button>
          </div>
        </div>
        <div className="p-6 space-y-6">
          {visibleItems.map(item => renderTVWidget(item.id))}
        </div>
        <TVLayoutConfigDialog
          open={configDialogOpen}
          onOpenChange={setConfigDialogOpen}
          config={config}
          onToggleVisibility={toggleVisibility}
          onReorder={reorder}
          onReset={resetToDefault}
        />
      </div>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Forecast</h1>
            <p className="text-muted-foreground">Previsão de vendas e indicadores comerciais</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center flex-wrap">
            <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCompetencia(subMonths(competencia, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-[140px] text-center font-medium text-sm capitalize">
                {format(competencia, "MMMM 'de' yyyy", { locale: ptBR })}
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCompetencia(addMonths(competencia, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-1">
              <Button 
                variant={format(competencia, 'yyyy-MM') === format(new Date(), 'yyyy-MM') ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setCompetencia(new Date())}
              >
                Este mês
              </Button>
              <Button 
                variant={format(competencia, 'yyyy-MM') === format(subMonths(new Date(), 1), 'yyyy-MM') ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setCompetencia(subMonths(new Date(), 1))}
              >
                Mês anterior
              </Button>
            </div>
            <Select value={gestorId || 'all'} onValueChange={(v) => setGestorId(v === 'all' ? undefined : v)}>
              <SelectTrigger className="w-full sm:w-[220px]">
                <SelectValue placeholder="Todos os Gestores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Gestores</SelectItem>
                {(gestores || []).map((g) => (
                  <SelectItem key={g.id} value={g.id}>{g.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={toggleModoTV}>
              <Monitor className="h-4 w-4 mr-2" />
              Modo TV
            </Button>
            <Button variant="outline" asChild>
              <Link to="/atividades">
                <ClipboardList className="h-4 w-4 mr-2" />
                Ver Atividades
              </Link>
            </Button>
            {isSuperAdmin && (
              <Button
                variant={modoLote ? 'default' : 'outline'}
                onClick={() => setModoLote(!modoLote)}
              >
                <ListChecks className="h-4 w-4 mr-2" />
                {modoLote ? 'Sair do Lote' : 'Ações em Lote'}
              </Button>
            )}
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Atividade
            </Button>
          </div>
        </div>

        {/* KPIs Financeiros */}
        {renderFinanceiroKPIs()}

        {/* Cards por Categoria */}
        {renderKPIs()}

        {/* Visitas por Empreendimento */}
        <VisitasPorEmpreendimento gestorId={gestorId} dataInicio={dataInicio} dataFim={dataFim} />
      </div>

      {/* Dialog Nova Atividade */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nova Atividade</DialogTitle>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto -mx-6 px-6">
            <AtividadeForm 
              onSubmit={handleSubmit}
              isLoading={createAtividade.isPending}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Batch Status */}
      <ForecastBatchStatusDialog
        open={batchDialog.open}
        onOpenChange={(open) => setBatchDialog(prev => ({ ...prev, open }))}
        categoria={batchDialog.categoria}
        statusGroup={batchDialog.statusGroup}
        gestorId={gestorId}
        dataInicio={dataInicio}
        dataFim={dataFim}
      />
    </MainLayout>
  );
}
