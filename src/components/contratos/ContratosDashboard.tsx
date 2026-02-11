import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  TrendingUp, 
  Clock, 
  DollarSign,
  CheckCircle,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { useContratosStats } from '@/hooks/useContratosStats';
import { CONTRATO_STATUS_LABELS, CONTRATO_STATUS_COLORS, type ContratoStatus } from '@/types/contratos.types';
import { Progress } from '@/components/ui/progress';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

interface ContratosDashboardProps {
  onContratoClick?: (id: string) => void;
}

export function ContratosDashboard({ onContratoClick }: ContratosDashboardProps) {
  const { data: stats, isLoading } = useContratosStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!stats) return null;

  const statusOrder: ContratoStatus[] = [
    'em_geracao', 
    'enviado_assinatura', 
    'assinado', 
    'enviado_incorporador', 
    'aprovado', 
    'reprovado', 
    'cancelado'
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Contratos</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {stats.contratosEsteMes} novos este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Valor no Pipeline</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.valorPipeline)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Contratos em andamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tempo Médio de Fechamento</p>
                <p className="text-2xl font-bold">{stats.tempoMedioFechamento} dias</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Da geração à aprovação
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Taxa de Conversão</p>
                <p className="text-2xl font-bold">{stats.taxaConversao.toFixed(1)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <Progress value={stats.taxaConversao} className="mt-2 h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Status Distribution & Pending Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contratos por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {statusOrder.map((status) => {
                const count = stats.porStatus[status] || 0;
                const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
                
                return (
                  <div key={status} className="flex items-center gap-3">
                    <Badge 
                      className={`${CONTRATO_STATUS_COLORS[status]} text-white min-w-[140px] justify-center`}
                    >
                      {CONTRATO_STATUS_LABELS[status]}
                    </Badge>
                    <div className="flex-1">
                      <Progress value={percentage} className="h-2" />
                    </div>
                    <span className="text-sm font-medium w-8 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Pending Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Contratos Pendentes de Ação
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.contratosPendentes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mb-2" />
                <p className="text-muted-foreground">Nenhum contrato pendente!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.contratosPendentes.map((contrato) => (
                  <div 
                    key={contrato.id} 
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => onContratoClick?.(contrato.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{contrato.numero}</p>
                      <p className="text-sm text-muted-foreground truncate">{contrato.cliente}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <Badge 
                          variant="outline" 
                          className={`${CONTRATO_STATUS_COLORS[contrato.status]} text-white text-xs`}
                        >
                          {CONTRATO_STATUS_LABELS[contrato.status]}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {contrato.diasEmAberto} dias
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Resumo do Mês</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <p className="text-2xl font-bold text-primary">{stats.contratosEsteMes}</p>
              <p className="text-sm text-muted-foreground">Novos contratos</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <p className="text-2xl font-bold text-green-600">{stats.porStatus['aprovado'] || 0}</p>
              <p className="text-sm text-muted-foreground">Aprovados</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <p className="text-2xl font-bold text-amber-600">{stats.porStatus['enviado_assinatura'] || 0}</p>
              <p className="text-sm text-muted-foreground">Aguardando assinatura</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <p className="text-2xl font-bold">{formatCurrency(stats.valorEsteMes)}</p>
              <p className="text-sm text-muted-foreground">Valor total</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
