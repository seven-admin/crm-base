import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  Clock, 
  XCircle, 
  RotateCcw,
  User,
  PlayCircle,
  AlertTriangle
} from 'lucide-react';
import { 
  useContratoAprovacoes, 
  useIniciarFluxoAprovacao 
} from '@/hooks/useFluxoAprovacao';
import { 
  APROVADOR_TIPO_LABELS, 
  APROVACAO_STATUS_LABELS,
  APROVACAO_STATUS_COLORS,
  type ContratoAprovacao 
} from '@/types/assinaturas.types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState } from 'react';
import { AprovarContratoDialog } from './AprovarContratoDialog';
import { useAuth } from '@/contexts/AuthContext';

interface FluxoAprovacaoProps {
  contratoId: string;
  empreendimentoId: string;
  readOnly?: boolean;
}

export function FluxoAprovacao({ contratoId, empreendimentoId, readOnly = false }: FluxoAprovacaoProps) {
  const { user } = useAuth();
  const [aprovarDialogOpen, setAprovarDialogOpen] = useState(false);
  const [selectedAprovacao, setSelectedAprovacao] = useState<ContratoAprovacao | null>(null);

  const { data: aprovacoes, isLoading } = useContratoAprovacoes(contratoId);
  const iniciarFluxo = useIniciarFluxoAprovacao();

  const handleIniciarFluxo = async () => {
    await iniciarFluxo.mutateAsync({ contratoId, empreendimentoId });
  };

  const handleAprovar = (aprovacao: ContratoAprovacao) => {
    setSelectedAprovacao(aprovacao);
    setAprovarDialogOpen(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'aprovado':
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case 'reprovado':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'em_revisao':
        return <RotateCcw className="h-5 w-5 text-amber-500" />;
      default:
        return <Clock className="h-5 w-5 text-slate-400" />;
    }
  };

  const getEtapaAtual = () => {
    if (!aprovacoes || aprovacoes.length === 0) return null;
    return aprovacoes.find(a => a.status === 'pendente' && a.data_envio);
  };

  const isFluxoConcluido = aprovacoes?.every(a => a.status === 'aprovado');
  const isFluxoReprovado = aprovacoes?.some(a => a.status === 'reprovado');
  const etapaAtual = getEtapaAtual();

  if (isLoading) {
    return <div className="animate-pulse h-48 bg-muted rounded-lg" />;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">Fluxo de Aprovação</CardTitle>
          <CardDescription>Acompanhe o status das aprovações</CardDescription>
        </div>
        {!readOnly && (!aprovacoes || aprovacoes.length === 0) && (
          <Button onClick={handleIniciarFluxo} disabled={iniciarFluxo.isPending}>
            <PlayCircle className="h-4 w-4 mr-2" />
            {iniciarFluxo.isPending ? 'Iniciando...' : 'Iniciar Fluxo'}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {(!aprovacoes || aprovacoes.length === 0) ? (
          <div className="text-center py-8 text-muted-foreground">
            <PlayCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Fluxo de aprovação não iniciado</p>
            <p className="text-sm mt-1">Inicie o fluxo para começar as aprovações</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Timeline visual */}
            <div className="flex items-center justify-between">
              {aprovacoes.map((aprovacao, index) => (
                <div key={aprovacao.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center
                      ${aprovacao.status === 'aprovado' ? 'bg-emerald-100' : ''}
                      ${aprovacao.status === 'reprovado' ? 'bg-red-100' : ''}
                      ${aprovacao.status === 'em_revisao' ? 'bg-amber-100' : ''}
                      ${aprovacao.status === 'pendente' ? 'bg-slate-100' : ''}
                    `}>
                      {getStatusIcon(aprovacao.status)}
                    </div>
                    <span className="text-xs mt-1 text-center max-w-[80px]">
                      {APROVADOR_TIPO_LABELS[aprovacao.tipo_aprovador]}
                    </span>
                  </div>
                  {index < aprovacoes.length - 1 && (
                    <div className={`
                      w-16 h-0.5 mx-2
                      ${aprovacoes[index].status === 'aprovado' ? 'bg-emerald-300' : 'bg-slate-200'}
                    `} />
                  )}
                </div>
              ))}
            </div>

            {/* Status geral */}
            {isFluxoConcluido && (
              <div className="flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <span className="text-emerald-700 font-medium">
                  Todas as aprovações concluídas!
                </span>
              </div>
            )}

            {isFluxoReprovado && (
              <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600" />
                <span className="text-red-700 font-medium">
                  Contrato reprovado em uma das etapas
                </span>
              </div>
            )}

            {/* Etapa atual */}
            {etapaAtual && !isFluxoConcluido && !isFluxoReprovado && (
              <div className="p-4 border rounded-lg bg-blue-50/50 border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Etapa Atual: {APROVADOR_TIPO_LABELS[etapaAtual.tipo_aprovador]}</h4>
                    {etapaAtual.aprovador && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <User className="h-3 w-3" />
                        {etapaAtual.aprovador.full_name}
                      </p>
                    )}
                    {etapaAtual.data_envio && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Enviado em: {format(new Date(etapaAtual.data_envio), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    )}
                  </div>
                  {!readOnly && (
                    <Button onClick={() => handleAprovar(etapaAtual)}>
                      Responder
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Lista detalhada */}
            <div className="space-y-3">
              {aprovacoes.map((aprovacao) => (
                <div 
                  key={aprovacao.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(aprovacao.status)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          Etapa {aprovacao.etapa}: {APROVADOR_TIPO_LABELS[aprovacao.tipo_aprovador]}
                        </span>
                        <Badge className={`${APROVACAO_STATUS_COLORS[aprovacao.status]} text-white text-xs`}>
                          {APROVACAO_STATUS_LABELS[aprovacao.status]}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {aprovacao.aprovador ? (
                          <span>{aprovacao.aprovador.full_name}</span>
                        ) : (
                          <span className="italic">Aprovador não atribuído</span>
                        )}
                        {aprovacao.data_resposta && (
                          <span className="ml-2">
                            • {format(new Date(aprovacao.data_resposta), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        )}
                      </div>
                      {aprovacao.observacao && (
                        <p className="text-sm mt-1 italic">"{aprovacao.observacao}"</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      {selectedAprovacao && (
        <AprovarContratoDialog
          open={aprovarDialogOpen}
          onClose={() => {
            setAprovarDialogOpen(false);
            setSelectedAprovacao(null);
          }}
          aprovacao={selectedAprovacao}
          contratoId={contratoId}
        />
      )}
    </Card>
  );
}
