import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  XCircle, 
  Edit2, 
  AlertTriangle,
  User,
  Building2,
  Clock,
  Loader2,
  ChevronDown,
  ChevronUp,
  Hash
} from 'lucide-react';
import { Negociacao } from '@/types/negociacoes.types';
import { useDetectarConflitos, SolicitacaoComPosicao } from '@/hooks/useSolicitacoes';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { formatarMoeda } from '@/lib/formatters';

interface SolicitacaoCardProps {
  negociacao: SolicitacaoComPosicao;
  onAprovar: () => void;
  onRejeitar: () => void;
  onEditar: () => void;
  isAprovando?: boolean;
}

export function SolicitacaoCard({ 
  negociacao, 
  onAprovar, 
  onRejeitar, 
  onEditar,
  isAprovando 
}: SolicitacaoCardProps) {
  const [expandido, setExpandido] = useState(false);
  const { data: conflitos = [] } = useDetectarConflitos(negociacao.id);

  const temConflitos = conflitos.length > 0;


  const tempoDecorrido = negociacao.solicitada_em 
    ? formatDistanceToNow(new Date(negociacao.solicitada_em), { locale: ptBR, addSuffix: true })
    : '';

  const isPrimeiroNaFila = negociacao.posicao_fila === 1;

  return (
    <Card className={`${temConflitos ? 'border-amber-500/50 bg-amber-500/5' : ''} ${isPrimeiroNaFila ? 'ring-2 ring-emerald-500/50' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {/* Badge de posição na fila */}
              <Badge 
                variant={isPrimeiroNaFila ? 'default' : 'secondary'}
                className={`font-bold ${isPrimeiroNaFila ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
              >
                <Hash className="h-3 w-3 mr-0.5" />
                {negociacao.posicao_fila}
              </Badge>
              <span className="font-semibold text-lg">{negociacao.codigo}</span>
              {temConflitos && (
                <Badge variant="outline" className="text-amber-600 border-amber-600">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Conflito
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Building2 className="h-4 w-4" />
                {negociacao.empreendimento?.nome}
              </span>
              <span className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {negociacao.corretor?.nome_completo || 'Sem corretor'}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {tempoDecorrido}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={onEditar}
            >
              <Edit2 className="h-4 w-4 mr-1" />
              Editar
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={onRejeitar}
              className="text-destructive hover:bg-destructive/10"
            >
              <XCircle className="h-4 w-4 mr-1" />
              Rejeitar
            </Button>
            <Button 
              size="sm"
              onClick={onAprovar}
              disabled={isAprovando}
              className="bg-green-600 hover:bg-green-700"
            >
              {isAprovando ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-1" />
              )}
              Aprovar
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Cliente info */}
        <div className="mb-4 p-3 bg-muted/50 rounded-lg">
          <div className="text-sm text-muted-foreground mb-1">Cliente</div>
          <div className="font-medium">{negociacao.cliente?.nome}</div>
          <div className="text-sm text-muted-foreground">
            {negociacao.cliente?.email} • {negociacao.cliente?.telefone}
          </div>
        </div>

        {/* Unidades */}
        <Collapsible open={expandido} onOpenChange={setExpandido}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium">
              Unidades ({negociacao.unidades?.length || 0})
            </div>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                {expandido ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>

          <div className="flex flex-wrap gap-2 mb-2">
            {negociacao.unidades?.slice(0, expandido ? undefined : 5).map((nu) => {
              const unidadeConflito = conflitos.find(c => c.unidade_id === nu.unidade_id);
              return (
                <Badge 
                  key={nu.id} 
                  variant={unidadeConflito ? 'destructive' : 'secondary'}
                  className="text-xs"
                >
                  {nu.unidade?.bloco?.nome ? `${nu.unidade.bloco.nome}-` : ''}
                  {nu.unidade?.numero}
                  {nu.unidade?.status !== 'disponivel' && (
                    <span className="ml-1 text-[10px] opacity-75">
                      ({nu.unidade?.status})
                    </span>
                  )}
                </Badge>
              );
            })}
            {!expandido && (negociacao.unidades?.length || 0) > 5 && (
              <Badge variant="outline" className="text-xs">
                +{(negociacao.unidades?.length || 0) - 5} mais
              </Badge>
            )}
          </div>

          <CollapsibleContent>
            {/* Conflict details */}
            {temConflitos && (
              <div className="mt-4 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                <div className="flex items-center gap-2 text-amber-600 mb-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-medium">Unidades com solicitações concorrentes</span>
                </div>
                <div className="space-y-2">
                  {conflitos.map((conflito) => (
                    <div key={conflito.unidade_id} className="text-sm">
                      <span className="font-medium">{conflito.unidade_codigo}</span>
                      <span className="text-muted-foreground"> solicitada também por: </span>
                      {conflito.negociacoes_concorrentes.map((nc, i) => (
                        <span key={nc.id}>
                          {i > 0 && ', '}
                          <span className="text-amber-600">{nc.codigo}</span>
                          {nc.corretor_nome && ` (${nc.corretor_nome})`}
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Ao aprovar esta solicitação, as concorrentes serão rejeitadas automaticamente.
                </p>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Total */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <span className="text-sm text-muted-foreground">Valor Total</span>
          <span className="font-semibold text-lg">
            {formatarMoeda(negociacao.valor_negociacao || 0)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
