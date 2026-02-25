import { useMemo, useState } from 'react';
import { KanbanBoard } from '@/components/ui/kanban/KanbanBoard';
import { KanbanCardWrapper } from '@/components/ui/kanban/KanbanCard';
import { AtividadeKanbanCard } from './AtividadeKanbanCard';
import { AtividadeDetalheDialog } from './AtividadeDetalheDialog';
import { useAtividades, useAlterarStatusEmLote, useAtividade } from '@/hooks/useAtividades';
import type { Atividade, AtividadeStatus } from '@/types/atividades.types';
import { TIPOS_NEGOCIACAO, ATIVIDADE_STATUS_LABELS } from '@/types/atividades.types';
import type { KanbanColumn } from '@/components/ui/kanban/types';

const STATUS_COLUMNS: KanbanColumn[] = [
  { id: 'pendente', title: 'Pendente', color: '#F59E0B', bgColor: 'hsl(var(--accent))' },
  { id: 'concluida', title: 'Concluída', color: '#10B981', bgColor: 'hsl(var(--accent))' },
  { id: 'cancelada', title: 'Cancelada', color: '#94A3B8', bgColor: 'hsl(var(--accent))' },
];

export function AtividadeKanbanBoard() {
  const [detalheId, setDetalheId] = useState<string | null>(null);
  const alterarStatus = useAlterarStatusEmLote();

  const { data: atividadesData, isLoading } = useAtividades({
    filters: { tipos: TIPOS_NEGOCIACAO },
    page: 1,
    pageSize: 200,
  });

  const { data: detalheAtividade } = useAtividade(detalheId ?? undefined);

  const atividades = atividadesData?.items || [];

  const handleMove = (item: Atividade, _source: string, destination: string) => {
    alterarStatus.mutate({ ids: [item.id], status: destination });
  };

  return (
    <>
      <KanbanBoard<Atividade>
        columns={STATUS_COLUMNS}
        items={atividades}
        getItemId={(item) => item.id}
        getItemColumn={(item) => item.status}
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
