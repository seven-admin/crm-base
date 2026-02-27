import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useAlterarStatusEmLote, useReabrirAtividadesEmLote } from '@/hooks/useAtividades';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ATIVIDADE_CATEGORIA_LABELS, type AtividadeCategoria } from '@/types/atividades.types';

interface ForecastBatchStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoria: AtividadeCategoria;
  statusGroup: string; // 'abertas' | 'fechadas' | 'atrasadas' | 'futuras'
  gestorId?: string;
  dataInicio: Date;
  dataFim: Date;
}

const STATUS_GROUP_LABELS: Record<string, string> = {
  abertas: 'Abertas',
  fechadas: 'Fechadas',
  atrasadas: 'Atrasadas',
  futuras: 'Futuras',
};

export function ForecastBatchStatusDialog({
  open,
  onOpenChange,
  categoria,
  statusGroup,
  gestorId,
  dataInicio,
  dataFim,
}: ForecastBatchStatusDialogProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [novoStatus, setNovoStatus] = useState<string>('');
  const alterarStatus = useAlterarStatusEmLote();
  const reabrirEmLote = useReabrirAtividadesEmLote();

  // Build query filters based on statusGroup
  const { data: atividades, isLoading } = useQuery({
    queryKey: ['forecast-batch', categoria, statusGroup, gestorId, dataInicio.toISOString(), dataFim.toISOString()],
    queryFn: async () => {
      let q = supabase
        .from('atividades')
        .select('id, titulo, data_inicio, data_fim, status, gestor:profiles(full_name)')
        .eq('categoria', categoria)
        .gte('data_inicio', format(dataInicio, 'yyyy-MM-dd'))
        .lte('data_inicio', format(dataFim, 'yyyy-MM-dd'));

      if (gestorId) q = q.eq('gestor_id', gestorId);

      const hoje = format(new Date(), 'yyyy-MM-dd');

      switch (statusGroup) {
        case 'abertas':
          q = q.eq('status', 'pendente').gte('data_fim', hoje);
          break;
        case 'atrasadas':
          q = q.eq('status', 'pendente').lt('data_fim', hoje);
          break;
        case 'fechadas':
          q = q.eq('status', 'concluida');
          break;
        case 'futuras':
          q = q.eq('status', 'pendente').gt('data_inicio', hoje);
          break;
      }

      q = q.order('data_inicio', { ascending: true });

      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: open,
  });

  useEffect(() => {
    if (!open) {
      setSelectedIds(new Set());
      setNovoStatus('');
    }
  }, [open]);

  const toggleItem = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (!atividades) return;
    if (selectedIds.size === atividades.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(atividades.map(a => a.id)));
    }
  };

  const handleConfirm = () => {
    if (selectedIds.size === 0 || !novoStatus) return;
    const ids = Array.from(selectedIds);
    if (novoStatus === 'pendente') {
      reabrirEmLote.mutate(ids, { onSuccess: () => onOpenChange(false) });
    } else {
      alterarStatus.mutate(
        { ids, status: novoStatus },
        { onSuccess: () => onOpenChange(false) }
      );
    }
  };

  const isPending = alterarStatus.isPending || reabrirEmLote.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {ATIVIDADE_CATEGORIA_LABELS[categoria]} — {STATUS_GROUP_LABELS[statusGroup] || statusGroup}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Novo status */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Novo status:</span>
            <Select value={novoStatus} onValueChange={setNovoStatus}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="concluida">Concluída</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Lista */}
          <div className="max-h-[350px] overflow-y-auto border rounded-lg">
            {isLoading ? (
              <div className="p-4 space-y-2">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10" />)}
              </div>
            ) : !atividades?.length ? (
              <p className="text-sm text-muted-foreground p-4 text-center">Nenhuma atividade encontrada.</p>
            ) : (
              <>
                {/* Select all header */}
                <div className="flex items-center gap-3 p-3 border-b bg-muted/30 sticky top-0">
                  <Checkbox
                    checked={selectedIds.size === atividades.length && atividades.length > 0}
                    onCheckedChange={toggleAll}
                  />
                  <span className="text-xs font-medium text-muted-foreground">
                    {selectedIds.size > 0 ? `${selectedIds.size} selecionada(s)` : 'Selecionar todas'}
                  </span>
                </div>
                {atividades.map(a => (
                  <div
                    key={a.id}
                    className="flex items-center gap-3 p-3 border-b last:border-0 hover:bg-muted/20 cursor-pointer"
                    onClick={() => toggleItem(a.id)}
                  >
                    <Checkbox
                      checked={selectedIds.has(a.id)}
                      onCheckedChange={() => toggleItem(a.id)}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{a.titulo}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.gestor?.full_name || '—'} · {format(new Date(a.data_inicio), 'dd/MM', { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button
              onClick={handleConfirm}
              disabled={selectedIds.size === 0 || !novoStatus || isPending}
            >
              {isPending ? 'Alterando...' : `Alterar ${selectedIds.size} atividade(s)`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
