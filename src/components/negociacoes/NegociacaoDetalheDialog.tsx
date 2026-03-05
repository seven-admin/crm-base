import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Building2, User, Phone, Mail, Edit, ArrowRight, History, FileText, Calendar } from 'lucide-react';
import { Negociacao, STATUS_PROPOSTA_LABELS, STATUS_PROPOSTA_COLORS } from '@/types/negociacoes.types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NegociacaoDetalheDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  negociacao: Negociacao | null;
  onEditar?: (negociacao: Negociacao) => void;
  onMover?: (negociacao: Negociacao) => void;
  onHistorico?: (negociacao: Negociacao) => void;
  onVerProposta?: (negociacao: Negociacao) => void;
}

export function NegociacaoDetalheDialog({
  open,
  onOpenChange,
  negociacao,
  onEditar,
  onMover,
  onHistorico,
  onVerProposta,
}: NegociacaoDetalheDialogProps) {
  if (!negociacao) return null;

  const formatCurrency = (value?: number) => {
    if (!value) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date?: string | null) => {
    if (!date) return '-';
    return format(new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  const valorExibido = negociacao.valor_proposta || negociacao.valor_negociacao;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <span>{negociacao.codigo}</span>
            {negociacao.numero_proposta && (
              <Badge variant="outline" className="text-xs">
                {negociacao.numero_proposta}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Status da proposta */}
        {negociacao.status_proposta && (
          <Badge
            className={`text-xs px-2 py-0.5 text-white w-fit ${STATUS_PROPOSTA_COLORS[negociacao.status_proposta]}`}
          >
            {STATUS_PROPOSTA_LABELS[negociacao.status_proposta]}
          </Badge>
        )}

        {/* Cliente */}
        <div className="space-y-3">
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Cliente</h4>
            <p className="text-sm font-medium">{negociacao.cliente?.nome || 'Não informado'}</p>
            {negociacao.cliente?.telefone && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                <Phone className="h-3 w-3" />
                <span>{negociacao.cliente.telefone}</span>
              </div>
            )}
            {negociacao.cliente?.email && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                <Mail className="h-3 w-3" />
                <span>{negociacao.cliente.email}</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Empreendimento + Unidades */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Empreendimento</h4>
            <div className="flex items-center gap-1.5 text-sm">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{negociacao.empreendimento?.nome || '-'}</span>
            </div>
            {negociacao.unidades && negociacao.unidades.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {negociacao.unidades.map((u) => (
                  <Badge key={u.id} variant="secondary" className="text-[11px] px-1.5 py-0">
                    {u.unidade?.bloco?.nome ? `${u.unidade.bloco.nome}-` : ''}
                    {u.unidade?.numero}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Corretor e Gestor */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Corretor</h4>
              <div className="flex items-center gap-1.5 text-sm">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{negociacao.corretor?.nome_completo || '-'}</span>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Gestor</h4>
              <div className="flex items-center gap-1.5 text-sm">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{negociacao.gestor?.full_name || '-'}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Valores */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Valor</h4>
              <p className="text-sm font-semibold text-primary">{formatCurrency(valorExibido)}</p>
            </div>
            {negociacao.valor_entrada && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Entrada</h4>
                <p className="text-sm">{formatCurrency(negociacao.valor_entrada)}</p>
              </div>
            )}
          </div>

          {/* Datas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Criada em</h4>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(negociacao.created_at)}</span>
              </div>
            </div>
            {negociacao.data_previsao_fechamento && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Previsão</h4>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(negociacao.data_previsao_fechamento)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Observações */}
          {negociacao.observacoes && (
            <>
              <Separator />
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Observações</h4>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap">{negociacao.observacoes}</p>
              </div>
            </>
          )}
        </div>

        {/* Ações */}
        <div className="flex flex-wrap gap-2 pt-2">
          {onEditar && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => { onEditar(negociacao); onOpenChange(false); }}
            >
              <Edit className="h-3.5 w-3.5 mr-1.5" />
              Editar
            </Button>
          )}
          {onMover && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => { onMover(negociacao); onOpenChange(false); }}
            >
              <ArrowRight className="h-3.5 w-3.5 mr-1.5" />
              Mover
            </Button>
          )}
          {onHistorico && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => { onHistorico(negociacao); onOpenChange(false); }}
            >
              <History className="h-3.5 w-3.5 mr-1.5" />
              Histórico
            </Button>
          )}
          {negociacao.numero_proposta && onVerProposta && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => { onVerProposta(negociacao); onOpenChange(false); }}
            >
              <FileText className="h-3.5 w-3.5 mr-1.5" />
              Ver Proposta
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
