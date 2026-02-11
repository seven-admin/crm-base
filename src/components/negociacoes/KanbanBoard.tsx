import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { KanbanColumn } from './KanbanColumn';
import { MoverNegociacaoDialog } from './MoverNegociacaoDialog';
import { NegociacaoForm } from './NegociacaoForm';
import { NegociacaoHistoricoTimeline } from './NegociacaoHistoricoTimeline';
import { useNegociacoes, useDeleteNegociacao, useConverterPropostaEmContrato } from '@/hooks/useNegociacoes';
import { useEtapasPadraoAtivas } from '@/hooks/useFunis';
import { Negociacao } from '@/types/negociacoes.types';
import { FunilEtapa } from '@/types/funis.types';
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
import { Skeleton } from '@/components/ui/skeleton';

interface KanbanBoardProps {
  filters?: {
    empreendimento_id?: string;
    corretor_id?: string;
  };
}

export function KanbanBoard({ filters }: KanbanBoardProps) {
  const navigate = useNavigate();
  const { data: etapas = [], isLoading: etapasLoading } = useEtapasPadraoAtivas();
  const { data: negociacoes = [], isLoading: negociacoesLoading } = useNegociacoes(filters);
  const deleteMutation = useDeleteNegociacao();
  const converterContratoMutation = useConverterPropostaEmContrato();

  const [selectedNegociacao, setSelectedNegociacao] = useState<Negociacao | null>(null);
  const [targetEtapa, setTargetEtapa] = useState<FunilEtapa | undefined>();
  const [moverDialogOpen, setMoverDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [historicoOpen, setHistoricoOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const isLoading = etapasLoading || negociacoesLoading;

  // Group negotiations by stage
  const porEtapa = negociacoes.reduce((acc, neg) => {
    const etapaId = neg.funil_etapa_id || '';
    if (!acc[etapaId]) acc[etapaId] = [];
    acc[etapaId].push(neg);
    return acc;
  }, {} as Record<string, Negociacao[]>);

  const handleMover = (negociacao: Negociacao) => {
    setSelectedNegociacao(negociacao);
    setTargetEtapa(undefined);
    setMoverDialogOpen(true);
  };

  const handleEditar = (negociacao: Negociacao) => {
    setSelectedNegociacao(negociacao);
    setEditDialogOpen(true);
  };

  const handleHistorico = (negociacao: Negociacao) => {
    setSelectedNegociacao(negociacao);
    setHistoricoOpen(true);
  };

  const handleExcluir = (negociacao: Negociacao) => {
    setSelectedNegociacao(negociacao);
    setDeleteDialogOpen(true);
  };

  const handleDrop = (negociacao: Negociacao, novaEtapa: FunilEtapa) => {
    setSelectedNegociacao(negociacao);
    setTargetEtapa(novaEtapa);
    setMoverDialogOpen(true);
  };

  const handleDragStart = (e: React.DragEvent, negociacao: Negociacao) => {
    e.dataTransfer.setData('application/json', JSON.stringify(negociacao));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleConfirmDelete = async () => {
    if (selectedNegociacao) {
      await deleteMutation.mutateAsync(selectedNegociacao.id);
      setDeleteDialogOpen(false);
      setSelectedNegociacao(null);
    }
  };

  const handleGerarContrato = async (negociacao: Negociacao) => {
    const result = await converterContratoMutation.mutateAsync(negociacao.id);
    if (result?.contrato_id) {
      navigate(`/contratos?id=${result.contrato_id}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex-shrink-0 w-72">
            <Skeleton className="h-10 w-full mb-3" />
            <div className="space-y-2">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-4 p-1 pb-4">
          {etapas.map((etapa) => (
            <KanbanColumn
              key={etapa.id}
              etapa={etapa}
              negociacoes={porEtapa[etapa.id] || []}
              onMover={handleMover}
              onEditar={handleEditar}
              onHistorico={handleHistorico}
              onExcluir={handleExcluir}
              onDrop={handleDrop}
              onDragStart={handleDragStart}
              onGerarContrato={handleGerarContrato}
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <MoverNegociacaoDialog
        open={moverDialogOpen}
        onOpenChange={setMoverDialogOpen}
        negociacao={selectedNegociacao}
        targetEtapa={targetEtapa}
        etapas={etapas}
      />

      <NegociacaoForm
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        negociacao={selectedNegociacao}
      />

      <NegociacaoHistoricoTimeline
        open={historicoOpen}
        onOpenChange={setHistoricoOpen}
        negociacao={selectedNegociacao}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Negociação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a negociação {selectedNegociacao?.codigo}?
              As unidades vinculadas serão liberadas. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}