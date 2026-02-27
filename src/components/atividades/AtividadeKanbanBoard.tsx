import { useMemo, useState } from 'react';
import { KanbanBoard } from '@/components/ui/kanban/KanbanBoard';
import { KanbanCardWrapper } from '@/components/ui/kanban/KanbanCard';
import { AtividadeKanbanCard } from './AtividadeKanbanCard';
import { AtividadeDetalheDialog } from './AtividadeDetalheDialog';
import { useAtividades, useAlterarStatusEmLote, useAtividade } from '@/hooks/useAtividades';
import { useAtividadeEtapas } from '@/hooks/useAtividadeEtapas';
import type { Atividade, AtividadeTipo } from '@/types/atividades.types';
import { TIPOS_NEGOCIACAO } from '@/types/atividades.types';
import type { ClienteTemperatura } from '@/types/clientes.types';
import type { KanbanColumn } from '@/components/ui/kanban/types';

const FALLBACK_COLUMNS: KanbanColumn[] = [
  { id: 'pendente', title: 'Pendente', color: '#F59E0B', bgColor: 'hsl(var(--accent))' },
  { id: 'concluida', title: 'Concluída', color: '#10B981', bgColor: 'hsl(var(--accent))' },
  { id: 'cancelada', title: 'Cancelada', color: '#94A3B8', bgColor: 'hsl(var(--accent))' },
];

interface AtividadeKanbanBoardProps {
  dataInicio?: string;
  dataFim?: string;
  temperaturaFilter?: ClienteTemperatura;
  tipos?: AtividadeTipo[];
}

export function AtividadeKanbanBoard({ dataInicio, dataFim, temperaturaFilter, tipos }: AtividadeKanbanBoardProps) {
  const [detalheId, setDetalheId] = useState<string | null>(null);
  const alterarStatus = useAlterarStatusEmLote();

  const { data: etapasConfig = [] } = useAtividadeEtapas();

  const { data: atividadesData, isLoading } = useAtividades({
    filters: {
      ...(tipos ? { tipos } : { tipos: TIPOS_NEGOCIACAO }),
      ...(dataInicio ? { data_inicio: dataInicio } : {}),
      ...(dataFim ? { data_fim: dataFim } : {}),
      ...(temperaturaFilter ? { temperatura_cliente: temperaturaFilter } : {}),
    },
    page: 1,
    pageSize: 200,
  });

  const { data: detalheAtividade } = useAtividade(detalheId ?? undefined);

  const atividades = atividadesData?.items || [];

  // Use configured stages if available, otherwise fallback to status columns
  const useEtapas = etapasConfig.length > 0;

  const columns: KanbanColumn[] = useMemo(() => {
    if (!useEtapas) return FALLBACK_COLUMNS;
    return etapasConfig.map((etapa) => ({
      id: etapa.id,
      title: etapa.nome,
      color: etapa.cor,
      bgColor: etapa.cor_bg,
    }));
  }, [useEtapas, etapasConfig]);

  const getItemColumn = (item: Atividade) => {
    if (useEtapas) {
      // Use atividade_etapa_id if set, otherwise try to match by status name
      if ((item as any).atividade_etapa_id) {
        return (item as any).atividade_etapa_id;
      }
      // Fallback: match by status name to etapa name
      const matched = etapasConfig.find(
        (e) => e.nome.toLowerCase() === item.status.toLowerCase()
      );
      return matched?.id || etapasConfig[0]?.id || item.status;
    }
    return item.status;
  };

  const handleMove = (item: Atividade, _source: string, destination: string) => {
    if (useEtapas) {
      // When using etapas, update atividade_etapa_id
      // Also map to status for backwards compatibility
      const etapa = etapasConfig.find((e) => e.id === destination);
      const statusMap: Record<string, string> = {};
      for (const e of etapasConfig) {
        if (e.is_inicial) statusMap[e.id] = 'pendente';
        else if (e.is_final) statusMap[e.id] = 'concluida';
      }
      const newStatus = statusMap[destination] || item.status;
      alterarStatus.mutate({ ids: [item.id], status: newStatus });
    } else {
      alterarStatus.mutate({ ids: [item.id], status: destination });
    }
  };

  return (
    <>
      <KanbanBoard<Atividade>
        columns={columns}
        items={atividades}
        getItemId={(item) => item.id}
        getItemColumn={getItemColumn}
        renderCard={(item, isDragging) => (
          <KanbanCardWrapper id={item.id} index={0}>
            {(dragging) => (
              <AtividadeKanbanCard
                atividade={item}
                isDragging={isDragging || dragging}
                onOpenDetalhe={setDetalheId}
              />
            )}
          </KanbanCardWrapper>
        )}
        onMove={() => {}}
        onMoveWithData={handleMove}
        isLoading={isLoading}
        emptyMessage="Nenhuma atividade"
        renderColumnHeader={(column, count) => (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: column.color }} />
              <span className="text-sm font-semibold">{column.title}</span>
            </div>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{count}</span>
          </div>
        )}
      />

      <AtividadeDetalheDialog
        atividade={detalheAtividade || null}
        loading={!detalheAtividade && !!detalheId}
        open={!!detalheId}
        onOpenChange={(open) => !open && setDetalheId(null)}
      />
    </>
  );
}
