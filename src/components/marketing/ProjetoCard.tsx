import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar, Building2, Shield } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  ProjetoMarketing, 
  PRIORIDADE_LABELS, 
  PRIORIDADE_COLORS 
} from '@/types/marketing.types';
import React, { forwardRef, memo, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface ProjetoCardProps {
  projeto: ProjetoMarketing;
  isDragging?: boolean;
  isSuperAdminCreated?: boolean;
}

const ProjetoCardInner = forwardRef<HTMLDivElement, ProjetoCardProps>(function ProjetoCardInner(
  { projeto, isDragging, isSuperAdminCreated },
  ref
) {
  const navigate = useNavigate();

  const getCategoriaIcon = () => {
    switch (projeto.categoria) {
      case 'render_3d':
        return '🎨';
      case 'design_grafico':
        return '✏️';
      case 'video_animacao':
        return '🎬';
      case 'evento':
        return '📅';
      default:
        return '📁';
    }
  };

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    navigate(`/marketing/${projeto.id}`);
  }, [isDragging, navigate, projeto.id]);

  // Cor da borda baseada na prioridade
  const borderColor = {
    urgente: 'border-l-red-500',
    alta: 'border-l-orange-500',
    normal: 'border-l-blue-500',
    baixa: 'border-l-slate-400',
  }[projeto.prioridade] || '';

  return (
    <Card 
      ref={ref}
      className={cn(
        "bg-background cursor-pointer select-none border-l-[3px]",
        isSuperAdminCreated ? 'border-l-amber-500 border-t-2 border-t-amber-400 ring-2 ring-amber-400/40 bg-amber-50 dark:bg-amber-950/30' : borderColor,
        isDragging 
          ? "opacity-95 scale-[1.02] shadow-xl rotate-[1deg] ring-2 ring-primary/40"
          : "hover:shadow-sm transition-shadow"
      )}
      onClick={handleClick}
    >
      {/* Header compacto */}
      <div className="p-2 pb-1">
        <div className="flex items-center gap-1.5">
          <span className="text-sm flex-shrink-0">{getCategoriaIcon()}</span>
          <p className="font-medium text-xs truncate flex-1">{projeto.titulo}</p>
          {isSuperAdminCreated && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Shield className="h-4 w-4 text-amber-500 shrink-0" />
                </TooltipTrigger>
                <TooltipContent>Criada por Super Admin</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {projeto.is_interno && (
            <Badge 
              variant="secondary" 
              className="text-[10px] px-1 py-0 h-4 flex-shrink-0 gap-0.5"
            >
              <Building2 className="h-2.5 w-2.5" />
            </Badge>
          )}
          <Badge 
            className="text-[10px] px-1.5 py-0 h-4 text-white flex-shrink-0"
            style={{ backgroundColor: PRIORIDADE_COLORS[projeto.prioridade] }}
          >
            {PRIORIDADE_LABELS[projeto.prioridade][0].toUpperCase()}
          </Badge>
        </div>
        <p className="text-[10px] text-muted-foreground ml-5 mt-0.5">{projeto.codigo}</p>
      </div>
      
      {/* Footer condensado */}
      <div className="px-2 pb-2 flex items-center justify-between gap-2">
        {projeto.empreendimento ? (
          <span className="text-[10px] text-muted-foreground truncate flex-1">
            🏢 {projeto.empreendimento.nome}
          </span>
        ) : (
          <span className="flex-1" />
        )}
        
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {projeto.data_previsao && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <Calendar className="h-2.5 w-2.5" />
              {format(new Date(projeto.data_previsao), 'dd/MM', { locale: ptBR })}
            </span>
          )}
          
          {projeto.supervisor && (
            <Avatar className="h-4 w-4">
              <AvatarFallback className="text-[8px] bg-muted">
                {projeto.supervisor.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      </div>
    </Card>
  );
});

export const ProjetoCard = memo(ProjetoCardInner);

ProjetoCard.displayName = 'ProjetoCard';