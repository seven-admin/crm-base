import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNegociacaoHistorico, NegociacaoHistoricoItem } from '@/hooks/useNegociacaoHistorico';
import { Negociacao, ETAPA_FUNIL_LABELS, ETAPA_FUNIL_COLORS, EtapaFunil } from '@/types/negociacoes.types';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowRight, User, Clock, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NegociacaoHistoricoTimelineProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  negociacao: Negociacao | null;
}

// Helper to get stage name and color from dynamic or legacy data
function getEtapaInfo(item: NegociacaoHistoricoItem, tipo: 'anterior' | 'nova') {
  if (tipo === 'anterior') {
    if (item.etapa_anterior_info) {
      return { nome: item.etapa_anterior_info.nome, cor: item.etapa_anterior_info.cor };
    }
    if (item.etapa_anterior) {
      return { 
        nome: ETAPA_FUNIL_LABELS[item.etapa_anterior as EtapaFunil] || item.etapa_anterior, 
        cor: ETAPA_FUNIL_COLORS[item.etapa_anterior as EtapaFunil] || 'bg-gray-500' 
      };
    }
    return null;
  } else {
    if (item.etapa_nova_info) {
      return { nome: item.etapa_nova_info.nome, cor: item.etapa_nova_info.cor };
    }
    if (item.etapa_nova) {
      return { 
        nome: ETAPA_FUNIL_LABELS[item.etapa_nova as EtapaFunil] || item.etapa_nova, 
        cor: ETAPA_FUNIL_COLORS[item.etapa_nova as EtapaFunil] || 'bg-gray-500' 
      };
    }
    return null;
  }
}

interface MarcoTimelineItem {
  label: string;
  data: string | null | undefined;
  icon: typeof Clock;
}

function MarcosTimeline({ negociacao }: { negociacao: Negociacao }) {
  const marcos: MarcoTimelineItem[] = [
    { label: 'Primeiro Atendimento', data: negociacao.data_primeiro_atendimento, icon: Clock },
    { label: 'Proposta Gerada', data: negociacao.data_proposta_gerada, icon: Clock },
    { label: 'Contrato Gerado', data: negociacao.data_contrato_gerado, icon: Clock },
    { label: 'Fechamento', data: negociacao.data_fechamento, icon: CheckCircle2 },
  ];

  const marcosComData = marcos.filter(m => m.data);
  if (marcosComData.length === 0) return null;

  return (
    <div className="mb-4 p-3 bg-muted/50 rounded-lg border">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
        <Clock className="h-3.5 w-3.5" />
        Marcos de Tempo
      </h4>
      <div className="space-y-2">
        {marcos.map((marco, idx) => {
          const Icon = marco.icon;
          const anterior = idx > 0 ? marcos[idx - 1] : null;
          const diasEntre = marco.data && anterior?.data
            ? differenceInDays(new Date(marco.data), new Date(anterior.data))
            : null;

          return (
            <div key={marco.label} className="flex items-center gap-2">
              <div className={cn(
                "h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0",
                marco.data ? "bg-primary/20" : "bg-muted"
              )}>
                <Icon className={cn("h-3 w-3", marco.data ? "text-primary" : "text-muted-foreground/50")} />
              </div>
              <div className="flex-1 min-w-0">
                <span className={cn(
                  "text-xs",
                  marco.data ? "text-foreground font-medium" : "text-muted-foreground/50"
                )}>
                  {marco.label}
                </span>
              </div>
              {marco.data ? (
                <div className="flex items-center gap-2 flex-shrink-0">
                  {diasEntre !== null && diasEntre > 0 && (
                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      +{diasEntre}d
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(marco.data), 'dd/MM/yyyy', { locale: ptBR })}
                  </span>
                </div>
              ) : (
                <span className="text-[10px] text-muted-foreground/50">—</span>
              )}
            </div>
          );
        })}
      </div>
      {negociacao.data_fechamento && negociacao.created_at && (
        <div className="mt-2 pt-2 border-t border-border/50 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Tempo total:</span>
          <span className="text-xs font-semibold text-primary">
            {differenceInDays(new Date(negociacao.data_fechamento), new Date(negociacao.created_at))} dias
          </span>
        </div>
      )}
    </div>
  );
}

export function NegociacaoHistoricoTimeline({
  open,
  onOpenChange,
  negociacao
}: NegociacaoHistoricoTimelineProps) {
  const { data: historico = [], isLoading } = useNegociacaoHistorico(negociacao?.id);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Histórico da Negociação</SheetTitle>
          <SheetDescription>
            {negociacao?.codigo} - {negociacao?.cliente?.nome}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] mt-4 pr-4">
          {/* Marcos de Tempo */}
          {negociacao && <MarcosTimeline negociacao={negociacao} />}

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : historico.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum histórico encontrado
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-border" />

              <div className="space-y-6">
                {historico.map((item) => {
                  const etapaAnterior = getEtapaInfo(item, 'anterior');
                  const etapaNova = getEtapaInfo(item, 'nova');
                  
                  return (
                    <div key={item.id} className="relative pl-8">
                      {/* Timeline dot */}
                      <div 
                        className="absolute left-0 w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: etapaNova?.cor || '#6b7280' }}
                      >
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>

                      <div className="bg-card border rounded-lg p-3">
                        {/* Movement */}
                        <div className="flex items-center gap-2 text-sm font-medium mb-1 flex-wrap">
                          {etapaAnterior && (
                            <>
                              <span 
                                className="px-2 py-0.5 rounded text-xs text-white"
                                style={{ backgroundColor: etapaAnterior.cor }}
                              >
                                {etapaAnterior.nome}
                              </span>
                              <ArrowRight className="h-3 w-3 text-muted-foreground" />
                            </>
                          )}
                          {etapaNova && (
                            <span 
                              className="px-2 py-0.5 rounded text-xs text-white"
                              style={{ backgroundColor: etapaNova.cor }}
                            >
                              {etapaNova.nome}
                            </span>
                          )}
                        </div>

                        {/* Observation */}
                        {item.observacao && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {item.observacao}
                          </p>
                        )}

                        {/* Footer */}
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>{item.user?.full_name || 'Sistema'}</span>
                          </div>
                          <span>
                            {format(new Date(item.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
