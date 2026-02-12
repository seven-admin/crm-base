import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Activity, AlertTriangle, BarChart3, Plus, ClipboardList, Calendar, Percent, Monitor, X, TrendingUp, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CategoriaCard } from '@/components/forecast/CategoriaCard';
import { FunilTemperatura } from '@/components/forecast/FunilTemperatura';
import { VisitasPorEmpreendimento } from '@/components/forecast/VisitasPorEmpreendimento';
import { AlertasFollowup } from '@/components/forecast/AlertasFollowup';
import { AtividadesPorTipo } from '@/components/forecast/AtividadesPorTipo';
import { ProximasAtividades } from '@/components/forecast/ProximasAtividades';
import { RankingCorretoresAtivos } from '@/components/forecast/RankingCorretoresAtivos';
import { AtendimentosResumo } from '@/components/forecast/AtendimentosResumo';
import { AtividadeForm } from '@/components/atividades/AtividadeForm';
import { useTVLayoutConfig } from '@/hooks/useTVLayoutConfig';
import { TVLayoutConfigDialog } from '@/components/tv-layout';
import { useResumoAtividades } from '@/hooks/useForecast';
import { useResumoAtividadesPorCategoria } from '@/hooks/useResumoAtividadesPorCategoria';
import { ATIVIDADE_CATEGORIA_LABELS, type AtividadeCategoria } from '@/types/atividades.types';
import { Building2, Users, Briefcase, UserCheck } from 'lucide-react';
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

export default function Forecast() {
  const [gestorId, setGestorId] = useState<string | undefined>(undefined);
  const [competencia, setCompetencia] = useState(new Date());
  const { data: gestores } = useGestoresProduto();
  
  // Período atual
  const dataInicio = useMemo(() => startOfMonth(competencia), [competencia]);
  const dataFim = useMemo(() => endOfMonth(competencia), [competencia]);
  
  // Período anterior (mês anterior ao selecionado)
  const dataInicioAnterior = useMemo(() => startOfMonth(subMonths(competencia, 1)), [competencia]);
  const dataFimAnterior = useMemo(() => endOfMonth(subMonths(competencia, 1)), [competencia]);
  
  const { data: resumo, isLoading, refetch } = useResumoAtividades(gestorId, dataInicio, dataFim);
  const { data: resumoAnterior } = useResumoAtividades(gestorId, dataInicioAnterior, dataFimAnterior);
  const { data: resumoCategorias, isLoading: loadingCategorias } = useResumoAtividadesPorCategoria(gestorId, dataInicio, dataFim);

  const CATEGORIA_CONFIG: Record<AtividadeCategoria, { icon: typeof Building2; iconColor: string; bgColor: string }> = {
    seven: { icon: Briefcase, iconColor: 'text-primary', bgColor: 'bg-primary/10' },
    incorporadora: { icon: Building2, iconColor: 'text-chart-2', bgColor: 'bg-chart-2/10' },
    imobiliaria: { icon: Users, iconColor: 'text-chart-3', bgColor: 'bg-chart-3/10' },
    cliente: { icon: UserCheck, iconColor: 'text-chart-4', bgColor: 'bg-chart-4/10' },
  };
  
  // Funções de cálculo de variação
  const calcularVariacao = (atual: number, anterior: number): number | undefined => {
    if (anterior === 0) {
      return atual > 0 ? 100 : undefined;
    }
    return ((atual - anterior) / anterior) * 100;
  };
  
  // Para métricas onde aumento é negativo (pendentes, vencidas)
  const calcularVariacaoInversa = (atual: number, anterior: number): number | undefined => {
    const variacao = calcularVariacao(atual, anterior);
    return variacao !== undefined ? -variacao : undefined;
  };
  const [dialogOpen, setDialogOpen] = useState(false);
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
        {
          onSuccess: () => {
            setDialogOpen(false);
          }
        }
      );
    } else {
      createAtividade.mutate(data.formData, {
        onSuccess: () => {
          setDialogOpen(false);
        }
      });
    }
  };

  // Toggle modo TV
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
      try {
        await document.exitFullscreen?.();
      } catch (e) {
        console.error('Erro ao sair do fullscreen:', e);
      }
      setModoTV(false);
    }
  };

  // Listener para ESC/fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setModoTV(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Auto-refresh no modo TV a cada 60 segundos
  useEffect(() => {
    if (!modoTV) return;
    const interval = setInterval(() => {
      refetch();
      setUltimaAtualizacao(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, [modoTV, refetch]);

  // Renderizar KPIs para modo TV
  const renderTVKPIs = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {loadingCategorias ? (
        [...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-40" />
        ))
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
            />
          );
        })
      )}
    </div>
  );

  // Renderizar widget do modo TV baseado no ID
  const renderTVWidget = (itemId: string) => {
    switch (itemId) {
      case 'kpis':
        return <div key={itemId}>{renderTVKPIs()}</div>;
      case 'atendimentos-resumo':
        return (
          <div key={itemId}>
            <AtendimentosResumo gestorId={gestorId} dataInicio={dataInicio} dataFim={dataFim} />
          </div>
        );
      case 'funil-temperatura':
        return (
          <Card key={itemId}>
            <CardHeader className="pb-2">
              <CardTitle className="text-foreground text-lg">Funil de Temperatura</CardTitle>
            </CardHeader>
            <CardContent>
              <FunilTemperatura gestorId={gestorId} dataInicio={dataInicio} dataFim={dataFim} />
            </CardContent>
          </Card>
        );
      case 'atividades-tipo':
        return (
          <Card key={itemId}>
            <CardHeader className="pb-2">
              <CardTitle className="text-foreground text-lg">Atividades por Tipo</CardTitle>
            </CardHeader>
            <CardContent>
              <AtividadesPorTipo gestorId={gestorId} dataInicio={dataInicio} dataFim={dataFim} />
            </CardContent>
          </Card>
        );
      case 'proximas-atividades':
        return (
          <Card key={itemId}>
            <CardHeader className="pb-2">
              <CardTitle className="text-foreground text-lg">Próximas Atividades</CardTitle>
            </CardHeader>
            <CardContent>
              <ProximasAtividades gestorId={gestorId} />
            </CardContent>
          </Card>
        );
      case 'ranking-corretores':
        return (
          <Card key={itemId}>
            <CardHeader className="pb-2">
              <CardTitle className="text-foreground text-lg">Ranking de Corretores</CardTitle>
            </CardHeader>
            <CardContent>
              <RankingCorretoresAtivos gestorId={gestorId} dataInicio={dataInicio} dataFim={dataFim} />
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  // Modo TV - Layout fullscreen
  if (modoTV) {
    return (
      <div className="fixed inset-0 z-50 bg-background overflow-auto">
        {/* Header TV Mode */}
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
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleModoTV}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5 mr-2" />
              Sair (ESC)
            </Button>
          </div>
        </div>

        {/* Conteúdo TV Mode - Renderização dinâmica */}
        <div className="p-6 space-y-6">
          {/* KPIs ocupam linha inteira */}
          {visibleItems.map(item => {
            if (item.id === 'kpis') {
              return renderTVWidget(item.id);
            }
            return null;
          })}

          {/* Grid principal com widgets */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {visibleItems
              .filter(item => item.id !== 'kpis')
              .map(item => renderTVWidget(item.id))}
          </div>
        </div>

        {/* Dialog de configuração */}
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
        {/* Header com ações */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Forecast</h1>
            <p className="text-muted-foreground">Previsão de vendas e indicadores comerciais</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center flex-wrap">
            {/* Seletor de Período */}
            <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => setCompetencia(subMonths(competencia, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-[140px] text-center font-medium text-sm capitalize">
                {format(competencia, "MMMM 'de' yyyy", { locale: ptBR })}
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => setCompetencia(addMonths(competencia, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Atalhos rápidos */}
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

            <Select
              value={gestorId || 'all'}
              onValueChange={(v) => setGestorId(v === 'all' ? undefined : v)}
            >
              <SelectTrigger className="w-full sm:w-[220px]">
                <SelectValue placeholder="Todos os Gestores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Gestores</SelectItem>
                {(gestores || []).map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.full_name}
                  </SelectItem>
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
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Atividade
            </Button>
          </div>
        </div>

        {/* Cards por Categoria */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {loadingCategorias ? (
            [...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-40" />
            ))
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
                />
              );
            })
          )}
        </div>

        {/* Atendimentos: Novo x Retorno */}
        <AtendimentosResumo gestorId={gestorId} dataInicio={dataInicio} dataFim={dataFim} />

        {/* Primeira linha: Funil + Atividades por Tipo */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FunilTemperatura gestorId={gestorId} dataInicio={dataInicio} dataFim={dataFim} />
          <AtividadesPorTipo gestorId={gestorId} dataInicio={dataInicio} dataFim={dataFim} />
        </div>

        {/* Segunda linha: Próximas Atividades + Visitas por Empreendimento */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ProximasAtividades gestorId={gestorId} />
          <VisitasPorEmpreendimento gestorId={gestorId} dataInicio={dataInicio} dataFim={dataFim} />
        </div>

        {/* Terceira linha: Ranking de Corretores */}
        <RankingCorretoresAtivos gestorId={gestorId} dataInicio={dataInicio} dataFim={dataFim} />

        {/* Alertas de Follow-up */}
        <AlertasFollowup gestorId={gestorId} />
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
    </MainLayout>
  );
}
