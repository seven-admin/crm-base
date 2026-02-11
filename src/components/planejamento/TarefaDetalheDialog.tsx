import { format, parseISO, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CalendarDays, Users, FileText, History, AlertTriangle } from 'lucide-react';
import { usePlanejamentoHistorico } from '@/hooks/usePlanejamentoHistorico';
import type { PlanejamentoItemWithRelations } from '@/types/planejamento.types';
import { Skeleton } from '@/components/ui/skeleton';

interface TarefaDetalheDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: PlanejamentoItemWithRelations | null;
}

export function TarefaDetalheDialog({ open, onOpenChange, item }: TarefaDetalheDialogProps) {
  const { historico, isLoading: loadingHistorico } = usePlanejamentoHistorico(item?.id);

  if (!item) return null;

  const isOverdue = item.data_fim && isBefore(parseISO(item.data_fim), new Date()) && !item.status?.is_final;

  const formatCampo = (campo: string) => {
    const map: Record<string, string> = {
      status_id: 'Status',
      data_inicio: 'Data Início',
      data_fim: 'Data Fim',
      obs: 'Observações',
      fase_id: 'Fase',
      responsavel_tecnico_id: 'Responsável',
      item: 'Nome da Tarefa'
    };
    return map[campo] || campo;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-lg">Detalhes da Tarefa</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            {/* Nome da tarefa */}
            <div>
              <h3 className="text-xl font-semibold">{item.item}</h3>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {item.fase && (
                <Badge 
                  variant="outline"
                  style={{ borderColor: item.fase.cor, color: item.fase.cor }}
                >
                  {item.fase.nome}
                </Badge>
              )}
              {item.status && (
                <Badge 
                  style={{ backgroundColor: item.status.cor }}
                  className="text-white"
                >
                  {item.status.nome}
                </Badge>
              )}
              {isOverdue && (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Atrasado
                </Badge>
              )}
            </div>

            <Separator />

            {/* Datas */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Período:</span>
              </div>
              <div className="grid grid-cols-2 gap-4 pl-6">
                <div>
                  <span className="text-xs text-muted-foreground">Data Início</span>
                  <p className="font-medium">
                    {item.data_inicio 
                      ? format(parseISO(item.data_inicio), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                      : '—'}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Data Fim</span>
                  <p className="font-medium">
                    {item.data_fim 
                      ? format(parseISO(item.data_fim), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                      : '—'}
                  </p>
                </div>
              </div>
            </div>

            {/* Responsáveis */}
            {(item.responsavel || (item.responsaveis && item.responsaveis.length > 0)) && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Responsáveis:</span>
                  </div>
                  <div className="space-y-2 pl-6">
                    {item.responsavel && (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {item.responsavel.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{item.responsavel.full_name}</span>
                        <Badge variant="secondary" className="text-xs">Principal</Badge>
                      </div>
                    )}
                    {item.responsaveis?.map(resp => (
                      <div key={resp.id} className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {resp.user?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{resp.user?.full_name || 'Usuário'}</span>
                        <span className="text-xs text-muted-foreground">({resp.papel})</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Observações */}
            {item.obs && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Observações:</span>
                  </div>
                  <p className="text-sm text-muted-foreground pl-6 whitespace-pre-wrap">
                    {item.obs}
                  </p>
                </div>
              </>
            )}

            {/* Histórico */}
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <History className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Histórico de Alterações:</span>
              </div>
              <div className="space-y-2 pl-6">
                {loadingHistorico ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ) : historico && historico.length > 0 ? (
                  historico.slice(0, 10).map(h => (
                    <div key={h.id} className="text-sm border-l-2 border-muted pl-3 py-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {format(parseISO(h.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                        {h.user?.full_name && (
                          <span className="text-xs text-muted-foreground">
                            por {h.user.full_name}
                          </span>
                        )}
                      </div>
                      <p className="text-muted-foreground">
                        <span className="font-medium text-foreground">{formatCampo(h.campo_alterado)}</span>
                        {h.valor_anterior && h.valor_novo ? (
                          <span>: {h.valor_anterior} → {h.valor_novo}</span>
                        ) : h.valor_novo ? (
                          <span> definido como: {h.valor_novo}</span>
                        ) : null}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground italic">Nenhuma alteração registrada</p>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
