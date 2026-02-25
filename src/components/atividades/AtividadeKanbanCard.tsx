import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Phone, Users, MapPin, MessageSquare, Video, Handshake, PenTool, PackageCheck, GraduationCap, Briefcase, FileText, Thermometer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { Atividade, AtividadeTipo } from '@/types/atividades.types';
import { ATIVIDADE_TIPO_LABELS, TIPOS_NEGOCIACAO } from '@/types/atividades.types';
import { TemperaturaSelector } from './TemperaturaSelector';
import { useUpdateAtividade } from '@/hooks/useAtividades';
import type { ClienteTemperatura } from '@/types/clientes.types';

const TIPO_ICONS: Record<AtividadeTipo, typeof Phone> = {
  ligacao: Phone,
  meeting: Video,
  reuniao: Users,
  visita: MapPin,
  atendimento: MessageSquare,
  fechamento: Handshake,
  assinatura: PenTool,
  acompanhamento: PackageCheck,
  treinamento: GraduationCap,
  administrativa: Briefcase,
};


interface AtividadeKanbanCardProps {
  atividade: Atividade;
  isDragging: boolean;
  onOpenDetalhe?: (id: string) => void;
}

export function AtividadeKanbanCard({ atividade, isDragging, onOpenDetalhe }: AtividadeKanbanCardProps) {
  const navigate = useNavigate();
  const TipoIcon = TIPO_ICONS[atividade.tipo];
  const updateAtividade = useUpdateAtividade();

  const handleTemperaturaChange = (temp: ClienteTemperatura) => {
    updateAtividade.mutate({ id: atividade.id, data: { temperatura_cliente: temp } });
  };

  const handleConverterProposta = (e: React.MouseEvent) => {
    e.stopPropagation();
    const params = new URLSearchParams();
    if (atividade.cliente_id) params.set('cliente_id', atividade.cliente_id);
    if (atividade.empreendimento_id) params.set('empreendimento_id', atividade.empreendimento_id);
    if (atividade.corretor_id) params.set('corretor_id', atividade.corretor_id);
    params.set('atividade_origem_id', atividade.id);
    navigate(`/negociacoes/nova?${params.toString()}`);
  };

  return (
    <Card
      className={cn(
        'p-3 cursor-pointer hover:shadow-md transition-shadow',
        isDragging && 'shadow-xl'
      )}
      onClick={() => onOpenDetalhe?.(atividade.id)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <TipoIcon className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium truncate">{atividade.titulo}</span>
        </div>
        {atividade.temperatura_cliente && (
          <TemperaturaSelector
            value={atividade.temperatura_cliente}
            onValueChange={handleTemperaturaChange}
            compact
          />
        )}
      </div>

      <div className="mt-2 space-y-1 text-xs text-muted-foreground">
        <div className="flex items-center justify-between">
          <span>{ATIVIDADE_TIPO_LABELS[atividade.tipo]}</span>
          <span>{format(new Date(`${atividade.data_inicio}T00:00:00`), 'dd/MM', { locale: ptBR })}</span>
        </div>
        {atividade.cliente?.nome && (
          <p className="truncate">{atividade.cliente.nome}</p>
        )}
        {atividade.empreendimento?.nome && (
          <p className="truncate text-muted-foreground/70">{atividade.empreendimento.nome}</p>
        )}
      </div>

      {TIPOS_NEGOCIACAO.includes(atividade.tipo) && (
        <div className="mt-2 pt-2 border-t">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-primary w-full"
                onClick={handleConverterProposta}
              >
                <FileText className="h-3.5 w-3.5 mr-1" />
                Converter em Proposta
              </Button>
            </TooltipTrigger>
            <TooltipContent>Abrir formulário de proposta com dados pré-preenchidos</TooltipContent>
          </Tooltip>
        </div>
      )}
    </Card>
  );
}
