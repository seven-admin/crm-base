import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useAtividades, useAtividade } from '@/hooks/useAtividades';
import { AtividadeDetalheDialog } from '@/components/atividades/AtividadeDetalheDialog';
import { 
  ATIVIDADE_TIPO_LABELS, 
  ATIVIDADE_STATUS_LABELS,
  ATIVIDADE_STATUS_COLORS,
  ATIVIDADE_SUBTIPO_SHORT_LABELS,
  type AtividadeTipo,
  type AtividadeStatus,
  type AtividadeSubtipo,
  type AtividadeFilters 
} from '@/types/atividades.types';
import { format, isBefore, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Phone, 
  Users, 
  MapPin, 
  Headphones, 
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ListFilter,
  X,
  Video,
  Handshake,
  PenTool,
  PackageCheck,
  GraduationCap,
  Briefcase,
} from 'lucide-react';

interface AtividadesListaPortalProps {
  empreendimentoIds: string[];
  dataSelecionada?: Date | null;
  onLimparData?: () => void;
}

const TIPO_ICONS: Record<string, React.ElementType> = {
  ligacao: Phone,
  meeting: Video,
  reuniao: Users,
  visita: MapPin,
  atendimento: Headphones,
  fechamento: Handshake,
  assinatura: PenTool,
  acompanhamento: PackageCheck,
  treinamento: GraduationCap,
  administrativa: Briefcase,
};

export function AtividadesListaPortal({ empreendimentoIds, dataSelecionada, onLimparData }: AtividadesListaPortalProps) {
  const [tipoFiltro, setTipoFiltro] = useState<AtividadeTipo | 'todos'>('todos');
  const [statusFiltro, setStatusFiltro] = useState<AtividadeStatus | 'todos'>('todos');
  const [page, setPage] = useState(1);
  const [detalheAtividadeId, setDetalheAtividadeId] = useState<string | null>(null);
  const pageSize = 15;

  // Buscar atividade selecionada para o dialog
  const { data: atividadeSelecionada, isLoading: loadingDetalhe } = useAtividade(detalheAtividadeId || undefined);


  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [tipoFiltro, statusFiltro, dataSelecionada]);

  const filters: AtividadeFilters = {
    empreendimento_ids: empreendimentoIds,
    ...(tipoFiltro !== 'todos' && { tipo: tipoFiltro }),
    ...(statusFiltro !== 'todos' && { status: statusFiltro }),
    ...(dataSelecionada && {
      data_inicio: format(dataSelecionada, 'yyyy-MM-dd'),
      data_fim: format(dataSelecionada, 'yyyy-MM-dd'),
    }),
  };

  const { data: atividadesData, isLoading } = useAtividades({ 
    filters, 
    page, 
    pageSize 
  });

  const isAtrasada = (dataFim: string, status: string) => {
    if (status !== 'pendente') return false;
    return isBefore(parseISO(dataFim), new Date());
  };

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ListFilter className="h-4 w-4" />
            Lista de Atividades
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const atividades = atividadesData?.items || [];
  const totalPages = atividadesData?.totalPages || 1;
  const totalCount = atividadesData?.count || 0;

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <ListFilter className="h-4 w-4" />
              Lista de Atividades
              <Badge variant="secondary" className="ml-2">{totalCount}</Badge>
            </CardTitle>
            <div className="flex gap-2 flex-wrap">
              <Select value={tipoFiltro} onValueChange={(v) => setTipoFiltro(v as AtividadeTipo | 'todos')}>
                <SelectTrigger className="w-[130px] h-8 text-xs">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os tipos</SelectItem>
                  {Object.entries(ATIVIDADE_TIPO_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFiltro} onValueChange={(v) => setStatusFiltro(v as AtividadeStatus | 'todos')}>
                <SelectTrigger className="w-[130px] h-8 text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os status</SelectItem>
                  {Object.entries(ATIVIDADE_STATUS_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Badge de data selecionada */}
          {dataSelecionada && (
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="gap-1">
                📅 {format(dataSelecionada, "dd 'de' MMMM", { locale: ptBR })}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                  onClick={onLimparData}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            </div>
          )}
        </CardHeader>
        <CardContent className="flex-1 min-h-0">
          <ScrollArea className="h-[400px] pr-3">
            {atividades.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {dataSelecionada 
                  ? `Nenhuma atividade em ${format(dataSelecionada, "dd/MM/yyyy", { locale: ptBR })}`
                  : 'Nenhuma atividade encontrada'
                }
              </div>
            ) : (
              <div className="space-y-2">
                {atividades.map((atividade) => {
                  const Icon = TIPO_ICONS[atividade.tipo] || Headphones;
                  const atrasada = isAtrasada(atividade.data_fim, atividade.status);
                  
                  return (
                    <div
                      key={atividade.id}
                      onClick={() => setDetalheAtividadeId(atividade.id)}
                      className={`
                        p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50
                        ${atrasada ? 'border-destructive/50 bg-destructive/5' : 'border-border'}
                      `}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <Badge variant="outline" className="text-xs flex-shrink-0">
                            {ATIVIDADE_TIPO_LABELS[atividade.tipo as AtividadeTipo]}
                          </Badge>
                          {atividade.subtipo && (
                            <Badge variant="secondary" className="text-xs flex-shrink-0">
                              {ATIVIDADE_SUBTIPO_SHORT_LABELS[atividade.subtipo as AtividadeSubtipo]}
                            </Badge>
                          )}
                          <Badge className={`text-xs flex-shrink-0 ${ATIVIDADE_STATUS_COLORS[atividade.status as AtividadeStatus]}`}>
                            {ATIVIDADE_STATUS_LABELS[atividade.status as AtividadeStatus]}
                          </Badge>
                          {atrasada && (
                            <Badge variant="destructive" className="text-xs flex-shrink-0 gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Atrasada
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="mt-2">
                        <p className="font-medium text-sm truncate">{atividade.titulo}</p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                          {atividade.cliente && (
                            <span>👤 {atividade.cliente.nome}</span>
                          )}
                          {atividade.empreendimento && (
                            <span>🏢 {atividade.empreendimento.nome}</span>
                          )}
                          <span>
                            📅 {atividade.data_inicio === atividade.data_fim 
                              ? format(parseISO(atividade.data_inicio), "dd/MM/yyyy", { locale: ptBR })
                              : `${format(parseISO(atividade.data_inicio), "dd/MM", { locale: ptBR })} - ${format(parseISO(atividade.data_fim), "dd/MM/yyyy", { locale: ptBR })}`
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-3 border-t mt-3">
              <span className="text-xs text-muted-foreground">
                Página {page} de {totalPages}
              </span>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AtividadeDetalheDialog
        atividade={atividadeSelecionada || null}
        loading={loadingDetalhe}
        open={!!detalheAtividadeId}
        onOpenChange={(open) => !open && setDetalheAtividadeId(null)}
      />
    </>
  );
}
