import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSolicitacoesDoCorretor } from '@/hooks/useSolicitacoesCorretor';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
  pendente: 'Pendente',
  aprovada: 'Aprovada',
  rejeitada: 'Rejeitada'
};

const STATUS_COLORS: Record<string, string> = {
  pendente: 'bg-yellow-100 text-yellow-800',
  aprovada: 'bg-green-100 text-green-800',
  rejeitada: 'bg-red-100 text-red-800'
};

const STATUS_ICONS: Record<string, typeof Clock> = {
  pendente: Clock,
  aprovada: CheckCircle2,
  rejeitada: XCircle
};

export default function PortalSolicitacoes() {
  const { data: solicitacoes = [], isLoading } = useSolicitacoesDoCorretor();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (solicitacoes.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <p>Você ainda não possui nenhuma solicitação de reserva.</p>
          <p className="text-sm mt-2">Acesse os empreendimentos para solicitar reservas de unidades.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {solicitacoes.map((solicitacao) => {
        const status = solicitacao.status_aprovacao || 'pendente';
        const StatusIcon = STATUS_ICONS[status];

        return (
          <Card key={solicitacao.id}>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">{solicitacao.codigo}</span>
                    <Badge className={STATUS_COLORS[status]}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {STATUS_LABELS[status]}
                    </Badge>
                    {status === 'pendente' && solicitacao.posicao_fila && (
                      <Badge variant="outline" className="border-blue-500 text-blue-600">
                        #{solicitacao.posicao_fila} na fila
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-sm">
                    <span className="font-medium">{solicitacao.empreendimento?.nome}</span>
                  </p>

                  {/* Unidades */}
                  {solicitacao.unidades && solicitacao.unidades.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {solicitacao.unidades.map((nu) => (
                        <Badge key={nu.id} variant="secondary" className="text-xs">
                          {nu.unidade?.bloco?.nome && `${nu.unidade.bloco.nome} - `}
                          Unidade {nu.unidade?.numero}
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  {solicitacao.cliente && (
                    <p className="text-sm text-muted-foreground">
                      Cliente: {solicitacao.cliente.nome}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {solicitacao.solicitada_em && (
                      <span>
                        Enviada {formatDistanceToNow(new Date(solicitacao.solicitada_em), { addSuffix: true, locale: ptBR })}
                      </span>
                    )}
                    {status === 'aprovada' && solicitacao.aprovada_em && (
                      <span className="text-green-600">
                        Aprovada em {format(new Date(solicitacao.aprovada_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    )}
                    {status === 'rejeitada' && solicitacao.rejeitada_em && (
                      <span className="text-red-600">
                        Rejeitada em {format(new Date(solicitacao.rejeitada_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    )}
                  </div>

                  {status === 'rejeitada' && solicitacao.motivo_rejeicao && (
                    <p className="text-sm text-red-600 mt-2 bg-red-50 p-2 rounded">
                      <strong>Motivo:</strong> {solicitacao.motivo_rejeicao}
                    </p>
                  )}

                  {solicitacao.observacoes && (
                    <p className="text-sm text-muted-foreground italic mt-2">
                      "{solicitacao.observacoes}"
                    </p>
                  )}

                  {/* Valor total */}
                  {solicitacao.valor_negociacao && (
                    <p className="text-sm font-medium mt-2">
                      Valor total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(solicitacao.valor_negociacao)}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
