import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ClipboardList, ChevronLeft, ChevronRight, ListChecks, BookOpen, LayoutGrid } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MainLayout } from '@/components/layout/MainLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CategoriaCard } from '@/components/forecast/CategoriaCard';
import { ForecastBatchStatusDialog } from '@/components/forecast/ForecastBatchStatusDialog';
import { VisitasPorEmpreendimento } from '@/components/forecast/VisitasPorEmpreendimento';
import { AtividadeForm } from '@/components/atividades/AtividadeForm';
import { AtividadeKanbanBoard } from '@/components/atividades/AtividadeKanbanBoard';
import { TemperaturaSelector } from '@/components/atividades/TemperaturaSelector';
import { useResumoAtividades } from '@/hooks/useForecast';
import { useResumoAtividadesPorCategoria } from '@/hooks/useResumoAtividadesPorCategoria';

import { ATIVIDADE_CATEGORIA_LABELS, TIPOS_DIARIO, TIPOS_NEGOCIACAO, type AtividadeCategoria } from '@/types/atividades.types';
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
import type { AtividadeFormSubmitData } from '@/components/atividades/AtividadeForm';
import type { ClienteTemperatura } from '@/types/clientes.types';

export default function DiarioBordo() {
  const { role } = useAuth();
  const isSuperAdmin = role === 'super_admin';
  const [gestorId, setGestorId] = useState<string | undefined>(undefined);
  const [competencia, setCompetencia] = useState(new Date());
  const { data: gestores } = useGestoresProduto();

  const dataInicio = useMemo(() => startOfMonth(competencia), [competencia]);
  const dataFim = useMemo(() => endOfMonth(competencia), [competencia]);

  const { data: resumo, isLoading, refetch } = useResumoAtividades(gestorId, dataInicio, dataFim, undefined, TIPOS_DIARIO);
  const { data: resumoCategorias, isLoading: loadingCategorias } = useResumoAtividadesPorCategoria(gestorId, dataInicio, dataFim, undefined, TIPOS_DIARIO);

  const CATEGORIA_CONFIG: Record<AtividadeCategoria, { icon: typeof Building2; iconColor: string; bgColor: string }> = {
    seven: { icon: Briefcase, iconColor: 'text-primary', bgColor: 'bg-primary/10' },
    incorporadora: { icon: Building2, iconColor: 'text-chart-2', bgColor: 'bg-chart-2/10' },
    imobiliaria: { icon: Users, iconColor: 'text-chart-3', bgColor: 'bg-chart-3/10' },
    cliente: { icon: UserCheck, iconColor: 'text-chart-4', bgColor: 'bg-chart-4/10' },
  };

  const [dialogOpen, setDialogOpen] = useState(false);
  const [modoLote, setModoLote] = useState(false);
  const [batchDialog, setBatchDialog] = useState<{ open: boolean; categoria: AtividadeCategoria; statusGroup: string }>({ open: false, categoria: 'seven', statusGroup: 'abertas' });
  const createAtividade = useCreateAtividade();
  const createAtividadesParaGestores = useCreateAtividadesParaGestores();

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

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <BookOpen className="h-8 w-8" />
              Diário de Bordo
            </h1>
            <p className="text-muted-foreground">Registro de atividades operacionais e rotina</p>
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

        {/* Tabs: Resumo / Atividades */}
        <Tabs defaultValue="resumo" className="w-full">
          <TabsList>
            <TabsTrigger value="resumo" className="gap-1.5">
              <BookOpen className="h-4 w-4" />
              Resumo
            </TabsTrigger>
            <TabsTrigger value="atividades" className="gap-1.5">
              <LayoutGrid className="h-4 w-4" />
              Atividades
            </TabsTrigger>
          </TabsList>

          <TabsContent value="resumo">
            {/* Cards por Categoria */}
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

            {/* Visitas por Empreendimento */}
            <div className="mt-6">
              <VisitasPorEmpreendimento gestorId={gestorId} dataInicio={dataInicio} dataFim={dataFim} />
            </div>
          </TabsContent>

          <TabsContent value="atividades">
            <AtividadesMetricsAndBoard competencia={competencia} />
          </TabsContent>
        </Tabs>
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
              tiposPermitidos={TIPOS_DIARIO}
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

function AtividadesMetricsAndBoard({ competencia }: { competencia: Date }) {
  const [temperaturaFilter, setTemperaturaFilter] = useState<ClienteTemperatura | undefined>(undefined);

  const dataInicioFilter = format(endOfMonth(competencia), 'yyyy-MM-dd');
  const dataFimFilter = format(startOfMonth(competencia), 'yyyy-MM-dd');

  return (
    <>
      <div className="flex items-center justify-end mb-4">
        <TemperaturaSelector value={temperaturaFilter ?? null} onValueChange={(v) => setTemperaturaFilter(v ?? undefined)} context="atividade" />
      </div>
      <div className="min-h-[500px]">
        <AtividadeKanbanBoard dataInicio={dataInicioFilter} dataFim={dataFimFilter} temperaturaFilter={temperaturaFilter} />
      </div>
    </>
  );
}
