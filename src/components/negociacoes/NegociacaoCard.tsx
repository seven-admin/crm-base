import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { MoreVertical, ArrowRight, History, Edit, Trash2, FileText, Send, Check, X, ClipboardCheck, Eye, RefreshCw } from 'lucide-react';
import { Negociacao } from '@/types/negociacoes.types';
import { cn } from '@/lib/utils';
import { useValidacaoFichaProposta } from '@/hooks/useValidacaoFichaProposta';

interface NegociacaoCardProps {
  negociacao: Negociacao;
  isDragging?: boolean;
  onMover: (negociacao: Negociacao) => void;
  onEditar: (negociacao: Negociacao) => void;
  onHistorico: (negociacao: Negociacao) => void;
  onExcluir: (negociacao: Negociacao) => void;
  onGerarProposta?: (negociacao: Negociacao) => void;
  onEnviarParaAnalise?: (negociacao: Negociacao) => void;
  onEnviarProposta?: (negociacao: Negociacao) => void;
  onAceitarProposta?: (negociacao: Negociacao) => void;
  onRecusarProposta?: (negociacao: Negociacao) => void;
  onSolicitarReserva?: (negociacao: Negociacao) => void;
  onReenviarParaAnalise?: (negociacao: Negociacao) => void;
  onEditarProposta?: (negociacao: Negociacao) => void;
}

export const NegociacaoCard = memo(function NegociacaoCard({ 
  negociacao, 
  isDragging = false,
  onMover, 
  onEditar, 
  onHistorico, 
  onExcluir,
  onGerarProposta,
  onEnviarParaAnalise,
  onEnviarProposta,
  onAceitarProposta,
  onRecusarProposta,
  onSolicitarReserva,
  onReenviarParaAnalise,
  onEditarProposta
}: NegociacaoCardProps) {
  const navigate = useNavigate();
  const validacao = useValidacaoFichaProposta(negociacao);
  
  const formatCurrencyCompact = (value?: number) => {
    if (!value) return '-';
    if (value >= 1000000) {
      return `R$ ${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `R$ ${(value / 1000).toFixed(0)}K`;
    }
    return `R$ ${value.toFixed(0)}`;
  };

  const valorExibido = negociacao.valor_proposta || negociacao.valor_negociacao;

  // Cor da borda baseada no status
  const getBorderColor = () => {
    if (negociacao.status_proposta === 'aceita') return 'border-l-purple-500';
    if (negociacao.status_proposta === 'aprovada_incorporador') return 'border-l-teal-500';
    if (negociacao.status_proposta === 'em_analise') return 'border-l-yellow-500';
    if (negociacao.status_proposta === 'contra_proposta') return 'border-l-orange-500';
    if (negociacao.status_proposta === 'enviada') return 'border-l-blue-500';
    if (negociacao.numero_proposta) return 'border-l-cyan-500';
    if (validacao.fichaCompleta) return 'border-l-green-500';
    return 'border-l-amber-500';
  };

  // Cor do badge de progresso
  const getProgressBadgeColor = () => {
    if (validacao.fichaCompleta) return 'bg-green-500';
    if (validacao.percentualCompleto >= 70) return 'bg-amber-500';
    return 'bg-orange-500';
  };

  return (
    <Card
      className={cn(
        "bg-background cursor-grab active:cursor-grabbing select-none border-l-[3px]",
        getBorderColor(),
        isDragging 
          ? "opacity-95 scale-[1.02] shadow-xl rotate-[1deg] ring-2 ring-primary/40"
          : "hover:shadow-sm transition-shadow"
      )}
    >
      {/* Linha 1: Cliente + Código + Status + Menu */}
      <div className="p-2 pb-1">
        <div className="flex items-center gap-1.5">
          <p className="font-medium text-xs truncate flex-1">
            {negociacao.cliente?.nome || 'Cliente'}
          </p>
          
          {/* Badge de progresso ou status */}
          {negociacao.numero_proposta ? (
            <Badge 
              className="text-[10px] px-1.5 py-0 h-4 text-white flex-shrink-0 bg-cyan-500"
            >
              P
            </Badge>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge 
                  className={cn(
                    "text-[10px] px-1.5 py-0 h-4 text-white flex-shrink-0",
                    getProgressBadgeColor()
                  )}
                >
                  {validacao.percentualCompleto}%
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                {validacao.fichaCompleta ? (
                  <p className="text-xs text-green-600">Ficha completa</p>
                ) : (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-amber-600">Pendências:</p>
                    <ul className="text-xs list-disc pl-3 space-y-0.5">
                      {validacao.pendencias.slice(0, 5).map((p, i) => (
                        <li key={i}>{p}</li>
                      ))}
                      {validacao.pendencias.length > 5 && (
                        <li>+{validacao.pendencias.length - 5} mais...</li>
                      )}
                    </ul>
                  </div>
                )}
              </TooltipContent>
            </Tooltip>
          )}
          
          {/* Menu dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onMover(negociacao)}>
                <ArrowRight className="h-4 w-4 mr-2" />
                Mover
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(`/negociacoes/editar/${negociacao.id}`)}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onHistorico(negociacao)}>
                <History className="h-4 w-4 mr-2" />
                Histórico
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              {!negociacao.numero_proposta && validacao.podesolicitarReserva && onSolicitarReserva && (
                <DropdownMenuItem onClick={() => onSolicitarReserva(negociacao)}>
                  <ClipboardCheck className="h-4 w-4 mr-2" />
                  Solicitar Reserva
                </DropdownMenuItem>
              )}
              
              {!negociacao.numero_proposta && onGerarProposta && (
                <DropdownMenuItem onClick={() => onGerarProposta(negociacao)}>
                  <FileText className="h-4 w-4 mr-2" />
                  Gerar Proposta
                </DropdownMenuItem>
              )}
              {negociacao.status_proposta === 'rascunho' && onEnviarParaAnalise && (
                <DropdownMenuItem onClick={() => onEnviarParaAnalise(negociacao)}>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar para Análise
                </DropdownMenuItem>
              )}
              {negociacao.status_proposta === 'em_analise' && (
                <DropdownMenuItem disabled>
                  <Eye className="h-4 w-4 mr-2" />
                  Aguardando Incorporador
                </DropdownMenuItem>
              )}
              {negociacao.status_proposta === 'aprovada_incorporador' && onEnviarProposta && (
                <DropdownMenuItem onClick={() => onEnviarProposta(negociacao)}>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar ao Cliente
                </DropdownMenuItem>
              )}
              {negociacao.status_proposta === 'contra_proposta' && (
                <>
                  {onEditarProposta && (
                    <DropdownMenuItem onClick={() => onEditarProposta(negociacao)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar Proposta
                    </DropdownMenuItem>
                  )}
                  {onReenviarParaAnalise && (
                    <DropdownMenuItem onClick={() => onReenviarParaAnalise(negociacao)}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Reenviar para Análise
                    </DropdownMenuItem>
                  )}
                </>
              )}
              {negociacao.status_proposta === 'enviada' && (
                <>
                  {onAceitarProposta && (
                    <DropdownMenuItem onClick={() => onAceitarProposta(negociacao)}>
                      <Check className="h-4 w-4 mr-2" />
                      Aceitar Proposta
                    </DropdownMenuItem>
                  )}
                  {onRecusarProposta && (
                    <DropdownMenuItem onClick={() => onRecusarProposta(negociacao)}>
                      <X className="h-4 w-4 mr-2" />
                      Recusar Proposta
                    </DropdownMenuItem>
                  )}
                </>
              )}
              
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onExcluir(negociacao)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Código e número da proposta */}
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {negociacao.codigo}
          {negociacao.numero_proposta && ` · ${negociacao.numero_proposta}`}
        </p>
      </div>

      {/* Linha 2: Empreendimento + Unidades */}
      <div className="px-2 pb-1 flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground truncate flex-1">
          🏢 {negociacao.empreendimento?.nome}
        </span>
        {negociacao.unidades && negociacao.unidades.length > 0 && (
          <Badge variant="secondary" className="text-[8px] px-1 py-0 h-3.5 flex-shrink-0">
            📦 {negociacao.unidades.length}
          </Badge>
        )}
      </div>

      {/* Linha 3: Valor + Gestor */}
      <div className="px-2 pb-2 flex items-center justify-between">
        <span className="text-[10px] font-semibold text-primary">
          {formatCurrencyCompact(valorExibido)}
        </span>
        {negociacao.gestor?.full_name && (
          <span className="text-[10px] text-muted-foreground truncate max-w-[80px]">
            👤 {negociacao.gestor.full_name.split(' ')[0]}
          </span>
        )}
      </div>
    </Card>
  );
});
