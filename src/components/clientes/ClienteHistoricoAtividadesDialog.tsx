import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

import { useAtividades, useCreateAtividade, useCreateAtividadesParaGestores } from '@/hooks/useAtividades';
import type { Cliente } from '@/types/clientes.types';
import type { Atividade, AtividadeStatus, AtividadeCategoria } from '@/types/atividades.types';
import { ATIVIDADE_STATUS_COLORS, ATIVIDADE_STATUS_LABELS, ATIVIDADE_TIPO_LABELS, ATIVIDADE_CATEGORIA_LABELS } from '@/types/atividades.types';
import { cn } from '@/lib/utils';
import { AtividadeForm, type AtividadeFormSubmitData } from '@/components/atividades/AtividadeForm';

interface ClienteHistoricoAtividadesDialogProps {
  cliente: Cliente | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function RelatorioInline({ atividade }: { atividade: Atividade }) {
  const linhas = [atividade.observacoes, atividade.resultado].filter(Boolean) as string[];
  if (linhas.length === 0) return null;

  return (
    <div className="mt-2 space-y-1">
      {atividade.observacoes && (
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
          <span className="font-medium text-foreground">Observações:</span> {atividade.observacoes}
        </p>
      )}
      {atividade.resultado && (
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
          <span className="font-medium text-foreground">Resultado:</span> {atividade.resultado}
        </p>
      )}
    </div>
  );
}

export function ClienteHistoricoAtividadesDialog({
  cliente,
  open,
  onOpenChange,
}: ClienteHistoricoAtividadesDialogProps) {
  const [createOpen, setCreateOpen] = useState(false);

  const { data: atividadesData, isLoading } = useAtividades(
    cliente?.id ? { filters: { cliente_id: cliente.id } } : {}
  );
  const atividades = atividadesData?.items || [];

  const createOne = useCreateAtividade();
  const createBatch = useCreateAtividadesParaGestores();

  const atividadesOrdenadas = useMemo(() => {
    return [...atividades].sort(
      (a, b) => new Date(b.data_fim).getTime() - new Date(a.data_fim).getTime()
    );
  }, [atividades]);

  const handleCreate = async (payload: AtividadeFormSubmitData) => {
    if (payload.gestorIds && payload.gestorIds.length > 0) {
      await createBatch.mutateAsync({ formData: payload.formData, gestorIds: payload.gestorIds });
    } else {
      await createOne.mutateAsync(payload.formData);
    }
    setCreateOpen(false);
  };

  if (!cliente) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Histórico de Atividades - {cliente.nome}</DialogTitle>
          </DialogHeader>

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              <span>Total: </span>
              <span className="font-medium text-foreground">{atividades.length}</span>
            </div>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Atividade
            </Button>
          </div>

          <Separator />

          <ScrollArea className="flex-1 -mx-6 px-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              </div>
            ) : atividadesOrdenadas.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                Nenhuma atividade vinculada a este cliente
              </div>
            ) : (
              <div className="space-y-3 py-1">
                {atividadesOrdenadas.map((a) => (
                  <Card key={a.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className={cn('text-xs', ATIVIDADE_STATUS_COLORS[a.status as AtividadeStatus])}>
                            {ATIVIDADE_STATUS_LABELS[a.status as AtividadeStatus]}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {ATIVIDADE_TIPO_LABELS[a.tipo]}
                          </Badge>
                          {a.categoria && (
                            <Badge variant="secondary" className="text-xs">
                              {ATIVIDADE_CATEGORIA_LABELS[a.categoria as AtividadeCategoria]}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {a.data_inicio === a.data_fim 
                              ? format(new Date(`${a.data_inicio}T00:00:00`), "dd/MM/yyyy", { locale: ptBR })
                              : `${format(new Date(`${a.data_inicio}T00:00:00`), "dd/MM", { locale: ptBR })} - ${format(new Date(`${a.data_fim}T00:00:00`), "dd/MM/yyyy", { locale: ptBR })}`
                            }
                          </span>
                        </div>

                        <p className="mt-2 font-medium leading-snug break-words">{a.titulo}</p>

                        {a.gestor?.full_name && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Gestor: {a.gestor.full_name}
                          </p>
                        )}

                        <RelatorioInline atividade={a} />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Dialog de criação (já vinculado ao cliente) */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Nova Atividade - {cliente.nome}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="py-1">
              <AtividadeForm
                {...({
                  onSubmit: handleCreate,
                  isLoading: createOne.isPending || createBatch.isPending,
                  defaultClienteId: cliente.id,
                  lockCliente: true,
                } as any)}
              />
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
