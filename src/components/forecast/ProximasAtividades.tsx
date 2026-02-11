import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Clock, User, MapPin, Phone, Headphones, Shield, Video, Handshake, PenTool, PackageCheck, GraduationCap, Briefcase } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useProximasAtividades } from '@/hooks/useForecast';
import { useSuperAdminIds } from '@/hooks/useSuperAdminIds';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const TIPO_ICON: Record<string, React.ElementType> = {
  ligacao: Phone,
  meeting: Video,
  reuniao: User,
  visita: MapPin,
  atendimento: Headphones,
  fechamento: Handshake,
  assinatura: PenTool,
  acompanhamento: PackageCheck,
  treinamento: GraduationCap,
  administrativa: Briefcase,
};

// Formatar hora removendo segundos se existirem
const formatarHora = (hora?: string | null) => 
  hora ? hora.substring(0, 5) : null;

interface ProximasAtividadesProps {
  gestorId?: string;
  empreendimentoIds?: string[];
}

export function ProximasAtividades({ gestorId, empreendimentoIds }: ProximasAtividadesProps) {
  const { data: atividades, isLoading } = useProximasAtividades(10, gestorId, empreendimentoIds);
  const { data: superAdminIds } = useSuperAdminIds();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-5 w-5 text-primary" />
            Próximas Atividades
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const hojeStr = format(new Date(), 'yyyy-MM-dd');

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Calendar className="h-5 w-5 text-primary" />
          Próximas Atividades
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {!atividades || atividades.length === 0 ? (
          <div className="text-center py-8 px-6 text-muted-foreground">
            <Calendar className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Nenhuma atividade agendada</p>
          </div>
        ) : (
        <ScrollArea className="h-[300px]">
            <div className="px-6 pb-4 space-y-2">
              <TooltipProvider>
              {atividades.map((atividade: any) => {
                const Icon = TIPO_ICON[atividade.tipo] || Calendar;
                const isToday = atividade.data_inicio <= hojeStr && atividade.data_fim >= hojeStr;
                const isSuperAdmin = superAdminIds?.has(atividade.created_by);

                const dataExibicao = atividade.data_inicio === atividade.data_fim
                  ? format(parseISO(atividade.data_inicio), "dd/MM", { locale: ptBR })
                  : `${format(parseISO(atividade.data_inicio), "dd/MM")} - ${format(parseISO(atividade.data_fim), "dd/MM")}`;

                return (
                  <div
                    key={atividade.id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-accent/50 cursor-pointer',
                      isToday && 'bg-primary/5 border border-primary/10',
                      isSuperAdmin && 'bg-amber-500/5 border-l-2 border-l-amber-500 ring-1 ring-amber-500/20'
                    )}
                    onClick={() => navigate(`/atividades`)}
                  >
                    <div className={cn(
                      'h-10 w-10 rounded-full flex items-center justify-center shrink-0',
                      isSuperAdmin
                        ? 'bg-amber-500/10 text-amber-500'
                        : isToday ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                    )}>
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium truncate">{atividade.titulo}</p>
                        {isSuperAdmin && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Shield className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                            </TooltipTrigger>
                            <TooltipContent>Criada por Super Admin</TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <Clock className="h-3 w-3" />
                        <span>{dataExibicao}</span>
                        {atividade.hora_inicio && (
                          <span className="text-primary font-medium">
                            às {formatarHora(atividade.hora_inicio)}
                            {atividade.hora_fim && ` - ${formatarHora(atividade.hora_fim)}`}
                          </span>
                        )}
                        {atividade.cliente && (
                          <>
                            <span className="text-muted-foreground/50">•</span>
                            <span className="truncate">{atividade.cliente.nome}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {atividade.categoria && (
                        <Badge variant="secondary" className="text-xs">
                          {atividade.categoria === 'seven' ? 'Seven' : atividade.categoria === 'incorporadora' ? 'Incorporadora' : atividade.categoria === 'imobiliaria' ? 'Imobiliária' : 'Cliente'}
                        </Badge>
                      )}
                      {isToday && (
                        <Badge variant="default" className="text-xs">
                          Hoje
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
              </TooltipProvider>
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
