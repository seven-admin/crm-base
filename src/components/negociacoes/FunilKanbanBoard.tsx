import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { KanbanBoard, KanbanColumnType } from '@/components/ui/kanban';
import { MoverNegociacaoDialog, ContratoSolicitadoData } from './MoverNegociacaoDialog';
import { NegociacaoForm } from './NegociacaoForm';
import { NegociacaoHistoricoTimeline } from './NegociacaoHistoricoTimeline';
import { NegociacaoCard } from './NegociacaoCard';
import { PropostaDialog } from './PropostaDialog';
import { useNegociacoes, useMoverNegociacao, useDeleteNegociacao, useConverterPropostaEmContrato, useSolicitarReserva, useEnviarParaAnalise, useEnviarProposta, useReenviarParaAnalise } from '@/hooks/useNegociacoes';
import { useCreateContrato } from '@/hooks/useContratos';
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
import { toast } from 'sonner';
import { formatarMoedaCompacta } from '@/lib/formatters';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

function useComentariosCount(negociacaoIds: string[]) {
  return useQuery({
    queryKey: ['negociacao-comentarios-count', negociacaoIds],
    enabled: negociacaoIds.length > 0,
    queryFn: async () => {
      const { data, error } = await db
        .from('negociacao_comentarios')
        .select('negociacao_id')
        .in('negociacao_id', negociacaoIds);
      if (error) throw error;
      const counts: Record<string, number> = {};
      for (const row of data || []) {
        counts[row.negociacao_id] = (counts[row.negociacao_id] || 0) + 1;
      }
      return counts;
    },
    staleTime: 30000,
  });
}

interface FunilKanbanBoardProps {
  filters?: {
    empreendimento_id?: string;
    corretor_id?: string;
  };
  negociacoes?: Negociacao[];
  isLoadingNegociacoes?: boolean;
}

export function FunilKanbanBoard({ filters, negociacoes: negociacoesProp, isLoadingNegociacoes }: FunilKanbanBoardProps) {
  const navigate = useNavigate();
  const { data: etapas = [], isLoading: etapasLoading } = useEtapasPadraoAtivas();
  // Permite reutilizar dados já carregados na página (evita fetch duplicado)
  const hookResult = useNegociacoes(filters, { enabled: !negociacoesProp });
  const negociacoes = negociacoesProp ?? hookResult.data ?? [];
  const negociacoesLoading = isLoadingNegociacoes ?? hookResult.isLoading;
  const moverMutation = useMoverNegociacao();
  const deleteMutation = useDeleteNegociacao();
  const createContratoMutation = useCreateContrato();
  const converterContratoMutation = useConverterPropostaEmContrato();
  const solicitarReservaMutation = useSolicitarReserva();
  const enviarParaAnaliseMutation = useEnviarParaAnalise();
  const enviarPropostaMutation = useEnviarProposta();
  const reenviarParaAnaliseMutation = useReenviarParaAnalise();

  const [selectedNegociacao, setSelectedNegociacao] = useState<Negociacao | null>(null);
  const [targetEtapa, setTargetEtapa] = useState<FunilEtapa | undefined>();
  const [moverDialogOpen, setMoverDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [historicoOpen, setHistoricoOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [propostaOpen, setPropostaOpen] = useState(false);
  const [propostaMode, setPropostaMode] = useState<'gerar' | 'enviar' | 'aceitar' | 'recusar' | 'view'>('view');
  
  // Estado otimista para manter a posição visual durante a mutation
  const [optimisticNegociacoes, setOptimisticNegociacoes] = useState<Negociacao[] | null>(null);

  // Limpar estado otimista quando dados reais chegam
  useEffect(() => {
    if (negociacoes.length > 0 && !moverMutation.isPending) {
      setOptimisticNegociacoes(null);
    }
  }, [negociacoes, moverMutation.isPending]);

  // Usar dados otimistas se disponíveis
  const displayNegociacoes = optimisticNegociacoes ?? negociacoes;

  const isLoading = etapasLoading || negociacoesLoading;

  // Fetch comment counts for all negociacoes with proposals
  const negociacaoIdsComProposta = useMemo(
    () => displayNegociacoes.filter(n => !!n.numero_proposta).map(n => n.id),
    [displayNegociacoes]
  );
  const { data: comentariosCountMap = {} } = useComentariosCount(negociacaoIdsComProposta);

  // Convert dynamic stages to kanban columns
  const columns: KanbanColumnType[] = useMemo(() => 
    etapas.map(etapa => ({
      id: etapa.id,
      title: etapa.nome,
      color: etapa.cor,
      bgColor: etapa.cor_bg || undefined
    })), 
  [etapas]);

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

  const handleConfirmDelete = async () => {
    if (selectedNegociacao) {
      await deleteMutation.mutateAsync(selectedNegociacao.id);
      setDeleteDialogOpen(false);
      setSelectedNegociacao(null);
    }
  };

  // Proposal handlers
  const handleGerarProposta = (negociacao: Negociacao) => {
    setSelectedNegociacao(negociacao);
    setPropostaMode('gerar');
    setPropostaOpen(true);
  };

  const handleEnviarParaAnalise = async (negociacao: Negociacao) => {
    await enviarParaAnaliseMutation.mutateAsync(negociacao);
  };

  const handleEnviarProposta = async (negociacao: Negociacao) => {
    await enviarPropostaMutation.mutateAsync(negociacao.id);
  };

  const handleAceitarProposta = (negociacao: Negociacao) => {
    setSelectedNegociacao(negociacao);
    setPropostaMode('aceitar');
    setPropostaOpen(true);
  };

  const handleRecusarProposta = (negociacao: Negociacao) => {
    setSelectedNegociacao(negociacao);
    setPropostaMode('recusar');
    setPropostaOpen(true);
  };

  const handleReenviarParaAnalise = async (negociacao: Negociacao) => {
    await reenviarParaAnaliseMutation.mutateAsync(negociacao);
  };

  const handleEditarProposta = (negociacao: Negociacao) => {
    setSelectedNegociacao(negociacao);
    setPropostaMode('view');
    setPropostaOpen(true);
  };

  const handleSolicitarReserva = async (negociacao: Negociacao) => {
    await solicitarReservaMutation.mutateAsync(negociacao.id);
  };

  // Handle contract creation request from MoverNegociacaoDialog
  const handleContratoSolicitado = async (data: ContratoSolicitadoData) => {
    if (!selectedNegociacao) return;

    try {
      // Check if negotiation has accepted proposal - use converter
      if (selectedNegociacao.status_proposta === 'aceita') {
        const result = await converterContratoMutation.mutateAsync(selectedNegociacao.id);
        toast.success('Contrato criado com sucesso!', {
          description: `Contrato gerado a partir da proposta`,
          action: {
            label: 'Ver contrato',
            onClick: () => navigate(`/contratos`)
          }
        });
      } else {
        // Fallback: create contract directly
        const contrato = await createContratoMutation.mutateAsync({
          cliente_id: data.cliente_id,
          empreendimento_id: data.empreendimento_id,
          corretor_id: data.corretor_id,
          imobiliaria_id: data.imobiliaria_id,
          unidade_ids: data.unidade_ids,
          valor_contrato: data.valor_contrato,
          negociacao_id: selectedNegociacao.id
        });

        toast.success('Contrato criado com sucesso!', {
          description: `Contrato ${contrato.numero} gerado automaticamente`,
          action: {
            label: 'Ver contrato',
            onClick: () => navigate(`/contratos`)
          }
        });
      }
    } catch (error) {
      console.error('Erro ao criar contrato:', error);
      toast.error('Erro ao criar contrato automaticamente');
    }
  };

  // Handle drag-and-drop move
  const handleKanbanMove = (negociacao: Negociacao, sourceColumn: string, destinationColumn: string) => {
    // Same column - no action needed
    if (sourceColumn === destinationColumn) return;

    const destEtapa = etapas.find(e => e.id === destinationColumn);
    if (!destEtapa) return;

    // For final stages (success or loss), open dialog for additional info
    if (destEtapa.is_final_perda || destEtapa.is_final_sucesso) {
      setSelectedNegociacao(negociacao);
      setTargetEtapa(destEtapa);
      setMoverDialogOpen(true);
      return;
    }

    // ATUALIZAÇÃO OTIMISTA: Atualizar estado local imediatamente
    const updatedNegociacoes = negociacoes.map(n =>
      n.id === negociacao.id ? { ...n, funil_etapa_id: destinationColumn } : n
    );
    setOptimisticNegociacoes(updatedNegociacoes);

    // For other stages, move instantly
    moverMutation.mutate(
      {
        id: negociacao.id,
        etapa_anterior_id: negociacao.funil_etapa_id,
        targetEtapa: { is_final_sucesso: false, is_final_perda: false },
        data: {
          funil_etapa_id: destinationColumn
        }
      },
      {
        onSettled: () => {
          // Limpar estado otimista após mutation (sucesso ou erro)
          setOptimisticNegociacoes(null);
        }
      }
    );
  };

  // Column header with total value
  const renderColumnHeader = (column: KanbanColumnType, itemCount: number, items: Negociacao[]) => {
    const valorTotal = items.reduce((acc, neg) => acc + (neg.valor_negociacao || 0), 0);

    return (
      <>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: column.color }}
            />
            <h3 className="font-medium text-sm">{column.title}</h3>
          </div>
          <span className="text-xs text-muted-foreground bg-background/50 px-2 py-0.5 rounded-full">
            {itemCount}
          </span>
        </div>
        {valorTotal > 0 && (
          <p className="text-xs text-muted-foreground">
            {formatarMoedaCompacta(valorTotal)}
          </p>
        )}
      </>
    );
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
      <KanbanBoard<Negociacao>
        columns={columns}
        items={displayNegociacoes}
        getItemId={(neg) => neg.id}
        getItemColumn={(neg) => neg.funil_etapa_id || ''}
        isLoading={false}
        emptyMessage="Nenhuma negociação"
        renderColumnHeader={renderColumnHeader}
        onMove={() => {}}
        onMoveWithData={handleKanbanMove}
        renderCard={(negociacao, isDragging) => (
          <NegociacaoCard
            negociacao={negociacao}
            isDragging={isDragging}
            comentariosCount={comentariosCountMap[negociacao.id] || 0}
            onMover={handleMover}
            onEditar={handleEditar}
            onHistorico={handleHistorico}
            onExcluir={handleExcluir}
            onGerarProposta={handleGerarProposta}
            onEnviarParaAnalise={handleEnviarParaAnalise}
            onEnviarProposta={handleEnviarProposta}
            onAceitarProposta={handleAceitarProposta}
            onRecusarProposta={handleRecusarProposta}
            onSolicitarReserva={handleSolicitarReserva}
            onReenviarParaAnalise={handleReenviarParaAnalise}
            onEditarProposta={handleEditarProposta}
          />
        )}
      />

      <MoverNegociacaoDialog
        open={moverDialogOpen}
        onOpenChange={setMoverDialogOpen}
        negociacao={selectedNegociacao}
        targetEtapa={targetEtapa}
        etapas={etapas}
        onContratoSolicitado={handleContratoSolicitado}
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

      <PropostaDialog
        open={propostaOpen}
        onOpenChange={setPropostaOpen}
        negociacao={selectedNegociacao}
        mode={propostaMode}
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