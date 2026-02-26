import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, LayoutGrid, List } from 'lucide-react';
import { FunilKanbanBoard } from '@/components/negociacoes/FunilKanbanBoard';
import { NegociacaoForm } from '@/components/negociacoes/NegociacaoForm';
import { NegociacoesToolbar, type NegociacoesFilters } from '@/pages/negociacoes/NegociacoesToolbar';
import { NegociacoesTable } from '@/pages/negociacoes/NegociacoesTable';
import { MoverNegociacaoDialog } from '@/components/negociacoes/MoverNegociacaoDialog';
import { NegociacaoHistoricoTimeline } from '@/components/negociacoes/NegociacaoHistoricoTimeline';
import { useNegociacoesKanban, useNegociacoesPaginated, useDeleteNegociacao } from '@/hooks/useNegociacoes';
import { useEtapasPadraoAtivas } from '@/hooks/useFunis';
import { Card } from '@/components/ui/card';
import { formatarMoedaCompacta } from '@/lib/formatters';
import { Negociacao } from '@/types/negociacoes.types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const Funil = () => {
  const navigate = useNavigate();
  const [formOpen, setFormOpen] = useState(false);
  const [view, setView] = useState<'kanban' | 'lista'>('kanban');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<NegociacoesFilters>({});
  
  // Dialog states
  const [moverNeg, setMoverNeg] = useState<Negociacao | null>(null);
  const [historicoNeg, setHistoricoNeg] = useState<Negociacao | null>(null);
  const [excluirNeg, setExcluirNeg] = useState<Negociacao | null>(null);

  const deleteNegociacao = useDeleteNegociacao();

  // Kanban filters
  const kanbanFilters = useMemo(() => ({
    empreendimento_id: filters.empreendimento_id,
    corretor_id: filters.corretor_id,
    funil_etapa_id: filters.funil_etapa_id,
    status_proposta: filters.status_proposta as any,
    temperatura: filters.temperatura as any,
  }), [filters.empreendimento_id, filters.corretor_id, filters.funil_etapa_id, filters.status_proposta, filters.temperatura]);

  const { data: negociacoesKanban = [], isLoading: isLoadingKanban } = useNegociacoesKanban(
    kanbanFilters,
    { enabled: view === 'kanban' }
  );

  // Table data
  const { negociacoes: negociacoesTabela, total, totalPages, isLoading: isLoadingTabela } = useNegociacoesPaginated({
    ...filters,
    page,
    pageSize: 20,
  });

  const { data: etapas = [] } = useEtapasPadraoAtivas();

  // Metrics
  const metricsSource = view === 'kanban' ? negociacoesKanban : negociacoesTabela;
  const totalNegociacoes = view === 'kanban' ? negociacoesKanban.length : total;
  const valorTotal = useMemo(
    () => metricsSource.reduce((acc, n) => acc + (n.valor_negociacao || 0), 0),
    [metricsSource]
  );
  
  const etapaFechado = etapas.find(e => e.is_final_sucesso);
  const taxaConversao = totalNegociacoes > 0 && etapaFechado
    ? ((metricsSource.filter(n => n.funil_etapa_id === etapaFechado.id).length / totalNegociacoes) * 100).toFixed(1)
    : 0;

  const countPerStage = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const n of metricsSource) {
      if (!n.funil_etapa_id) continue;
      acc[n.funil_etapa_id] = (acc[n.funil_etapa_id] || 0) + 1;
    }
    return acc;
  }, [metricsSource]);

  const handleFiltersChange = (newFilters: NegociacoesFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleExcluir = async () => {
    if (!excluirNeg) return;
    await deleteNegociacao.mutateAsync(excluirNeg.id);
    setExcluirNeg(null);
  };

  return (
    <MainLayout
      title="Negociações"
      subtitle="Gerencie suas negociações e propostas comerciais"
    >
      {/* Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total de Fichas</p>
          <p className="text-2xl font-bold">{totalNegociacoes}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Valor Total</p>
          <p className="text-2xl font-bold">{formatarMoedaCompacta(valorTotal)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
          <p className="text-2xl font-bold">{taxaConversao}%</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Por Etapa</p>
          <div className="flex gap-1 mt-1 flex-wrap">
            {etapas.map((etapa) => (
              <div 
                key={etapa.id} 
                className="px-1.5 py-0.5 rounded text-xs text-white"
                style={{ backgroundColor: etapa.cor }}
                title={etapa.nome}
              >
                {countPerStage[etapa.id] || 0}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Tabs + Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <Tabs value={view} onValueChange={(v) => setView(v as 'kanban' | 'lista')} className="w-auto">
          <TabsList>
            <TabsTrigger value="kanban" className="gap-1.5">
              <LayoutGrid className="h-4 w-4" />
              Kanban
            </TabsTrigger>
            <TabsTrigger value="lista" className="gap-1.5">
              <List className="h-4 w-4" />
              Lista
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Button onClick={() => navigate('/negociacoes/nova')} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Nova Ficha de Proposta
        </Button>
      </div>

      {/* Shared Filters */}
      <div className="mb-6">
        <NegociacoesToolbar filters={filters} onFiltersChange={handleFiltersChange} />
      </div>

      {/* Content */}
      {view === 'kanban' ? (
        <div className="min-h-[500px]">
          <FunilKanbanBoard
            filters={kanbanFilters}
            negociacoes={negociacoesKanban}
            isLoadingNegociacoes={isLoadingKanban}
          />
        </div>
      ) : (
        <NegociacoesTable
          negociacoes={negociacoesTabela}
          isLoading={isLoadingTabela}
          page={page}
          totalPages={totalPages}
          totalItems={total}
          onPageChange={setPage}
          onMover={(neg) => setMoverNeg(neg)}
          onHistorico={(neg) => setHistoricoNeg(neg)}
          onExcluir={(neg) => setExcluirNeg(neg)}
        />
      )}

      {/* Form Dialog */}
      <NegociacaoForm
        open={formOpen}
        onOpenChange={setFormOpen}
      />

      {/* Mover Dialog */}
      <MoverNegociacaoDialog
        negociacao={moverNeg}
        etapas={etapas}
        open={!!moverNeg}
        onOpenChange={(open) => !open && setMoverNeg(null)}
      />

      {/* Histórico Dialog */}
      <NegociacaoHistoricoTimeline
        negociacao={historicoNeg}
        open={!!historicoNeg}
        onOpenChange={(open) => !open && setHistoricoNeg(null)}
      />

      {/* Excluir Dialog */}
      <AlertDialog open={!!excluirNeg} onOpenChange={(open) => !open && setExcluirNeg(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir ficha?</AlertDialogTitle>
            <AlertDialogDescription>
              A ficha <strong>{excluirNeg?.codigo}</strong> será removida. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleExcluir}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

export default Funil;
