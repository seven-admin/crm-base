import { useState } from 'react';
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
import { MoreVertical, Building2, User, Phone, Calendar, ArrowRight, History, Edit, Trash2, FileText, Send, Check, X, FilePlus2, Eye, RefreshCw, MessageSquare } from 'lucide-react';
import { Negociacao, STATUS_PROPOSTA_LABELS, STATUS_PROPOSTA_COLORS } from '@/types/negociacoes.types';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface KanbanCardProps {
  negociacao: Negociacao;
  comentariosCount?: number;
  onMover: (negociacao: Negociacao) => void;
  onEditar: (negociacao: Negociacao) => void;
  onHistorico: (negociacao: Negociacao) => void;
  onExcluir: (negociacao: Negociacao) => void;
  onDragStart: (e: React.DragEvent, negociacao: Negociacao) => void;
  onGerarProposta?: (negociacao: Negociacao) => void;
  onEnviarParaAnalise?: (negociacao: Negociacao) => void;
  onEnviarProposta?: (negociacao: Negociacao) => void;
  onAceitarProposta?: (negociacao: Negociacao) => void;
  onRecusarProposta?: (negociacao: Negociacao) => void;
  onGerarContrato?: (negociacao: Negociacao) => void;
  onReenviarParaAnalise?: (negociacao: Negociacao) => void;
  onEditarProposta?: (negociacao: Negociacao) => void;
}

export function KanbanCard({ 
  negociacao, 
  comentariosCount = 0,
  onMover, 
  onEditar, 
  onHistorico, 
  onExcluir,
  onDragStart,
  onGerarProposta,
  onEnviarParaAnalise,
  onEnviarProposta,
  onAceitarProposta,
  onRecusarProposta,
  onGerarContrato,
  onReenviarParaAnalise,
  onEditarProposta
}: KanbanCardProps) {
  const [isDragging, setIsDragging] = useState(false);

  const formatCurrency = (value?: number) => {
    if (!value) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const diasNaEtapa = formatDistanceToNow(new Date(negociacao.updated_at), {
    locale: ptBR,
    addSuffix: false
  });

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    onDragStart(e, negociacao);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const showPropostaActions = negociacao.status_proposta;
  const valorExibido = negociacao.valor_proposta || negociacao.valor_negociacao;

  return (
    <Card
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`p-3 cursor-grab active:cursor-grabbing transition-all hover:shadow-md ${
        isDragging ? 'opacity-50 shadow-lg rotate-2' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{negociacao.cliente?.nome || 'Cliente'}</p>
          <div className="flex items-center gap-1.5">
            <p className="text-xs text-muted-foreground">{negociacao.codigo}</p>
            {negociacao.numero_proposta && (
              <Badge variant="outline" className="text-[10px] px-1 py-0">
                {negociacao.numero_proposta}
              </Badge>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
              <MoreVertical className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onMover(negociacao)}>
              <ArrowRight className="h-4 w-4 mr-2" />
              Mover
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEditar(negociacao)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onHistorico(negociacao)}>
              <History className="h-4 w-4 mr-2" />
              Histórico
            </DropdownMenuItem>
            
            {/* Proposal Actions */}
            <DropdownMenuSeparator />
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
            {negociacao.status_proposta === 'aceita' && onGerarContrato && !negociacao.contrato_id && (
              <DropdownMenuItem onClick={() => onGerarContrato(negociacao)}>
                <FilePlus2 className="h-4 w-4 mr-2" />
                Gerar Contrato
              </DropdownMenuItem>
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

      {/* Proposal Status Badge */}
      {negociacao.status_proposta && (
        <div className="mb-2">
          <Badge 
            className={`text-[10px] px-1.5 py-0 text-white ${STATUS_PROPOSTA_COLORS[negociacao.status_proposta]}`}
          >
            {STATUS_PROPOSTA_LABELS[negociacao.status_proposta]}
          </Badge>
        </div>
      )}

      <div className="space-y-1.5 text-xs">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Building2 className="h-3 w-3 shrink-0" />
          <span className="truncate">{negociacao.empreendimento?.nome}</span>
        </div>

        {negociacao.unidades && negociacao.unidades.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {negociacao.unidades.slice(0, 3).map((u) => (
              <Badge key={u.id} variant="secondary" className="text-[10px] px-1.5 py-0">
                {u.unidade?.bloco?.nome ? `${u.unidade.bloco.nome}-` : ''}
                {u.unidade?.numero}
              </Badge>
            ))}
            {negociacao.unidades.length > 3 && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                +{negociacao.unidades.length - 3}
              </Badge>
            )}
          </div>
        )}

        {negociacao.corretor && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <User className="h-3 w-3 shrink-0" />
            <span className="truncate">{negociacao.corretor.nome_completo}</span>
          </div>
        )}

        {negociacao.cliente?.telefone && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Phone className="h-3 w-3 shrink-0" />
            <span>{negociacao.cliente.telefone}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-3 pt-2 border-t">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            <Calendar className="h-3 w-3 inline mr-1" />
            {diasNaEtapa}
          </span>
          {comentariosCount > 0 && (
            <span className="flex items-center gap-0.5 text-xs text-muted-foreground" title={`${comentariosCount} comentário(s)`}>
              <MessageSquare className="h-3 w-3" />
              {comentariosCount}
            </span>
          )}
        </div>
        {valorExibido && (
          <span className="text-xs font-medium text-primary">
            {formatCurrency(valorExibido)}
          </span>
        )}
      </div>
    </Card>
  );
}