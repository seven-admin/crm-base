import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ClipboardCheck, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  Building2,
  User,
  Clock,
  Filter
} from 'lucide-react';
import { useSolicitacoesPendentes, useAprovarSolicitacao, useRejeitarSolicitacao } from '@/hooks/useSolicitacoes';
import { useEmpreendimentos } from '@/hooks/useEmpreendimentos';
import { useAuth } from '@/contexts/AuthContext';
import { SolicitacaoCard } from '@/components/solicitacoes/SolicitacaoCard';
import { RejeitarDialog } from '@/components/solicitacoes/RejeitarDialog';
import { EditarSolicitacaoDialog } from '@/components/solicitacoes/EditarSolicitacaoDialog';
import { Negociacao } from '@/types/negociacoes.types';

export default function Solicitacoes() {
  const [filtroEmpreendimento, setFiltroEmpreendimento] = useState<string>('all');
  const [selectedNegociacao, setSelectedNegociacao] = useState<Negociacao | null>(null);
  const [rejeitarDialogOpen, setRejeitarDialogOpen] = useState(false);
  const [editarDialogOpen, setEditarDialogOpen] = useState(false);

  const { user } = useAuth();
  const { data: empreendimentos = [] } = useEmpreendimentos();
  const { data: solicitacoes = [], isLoading } = useSolicitacoesPendentes({
    empreendimento_id: filtroEmpreendimento !== 'all' ? filtroEmpreendimento : undefined
  });

  const aprovarMutation = useAprovarSolicitacao();
  const rejeitarMutation = useRejeitarSolicitacao();

  const handleAprovar = async (negociacao: Negociacao) => {
    if (!user?.id) return;
    await aprovarMutation.mutateAsync({ 
      negociacaoId: negociacao.id, 
      gestorId: user.id 
    });
  };

  const handleRejeitar = (negociacao: Negociacao) => {
    setSelectedNegociacao(negociacao);
    setRejeitarDialogOpen(true);
  };

  const handleEditar = (negociacao: Negociacao) => {
    setSelectedNegociacao(negociacao);
    setEditarDialogOpen(true);
  };

  const confirmarRejeicao = async (motivo: string) => {
    if (!selectedNegociacao || !user?.id) return;
    await rejeitarMutation.mutateAsync({
      negociacaoId: selectedNegociacao.id,
      motivo,
      gestorId: user.id
    });
    setRejeitarDialogOpen(false);
    setSelectedNegociacao(null);
  };

  // Stats
  const totalSolicitacoes = solicitacoes.length;
  const valorTotal = solicitacoes.reduce((sum, s) => sum + (s.valor_negociacao || 0), 0);
  const totalUnidades = solicitacoes.reduce((sum, s) => sum + (s.unidades?.length || 0), 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <MainLayout
      title="Fila de Solicitações"
      subtitle="Gerencie as solicitações de reserva pendentes de aprovação"
    >
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Solicitações Pendentes</p>
                <p className="text-2xl font-bold">{totalSolicitacoes}</p>
              </div>
              <ClipboardCheck className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unidades Solicitadas</p>
                <p className="text-2xl font-bold">{totalUnidades}</p>
              </div>
              <Building2 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-bold">{formatCurrency(valorTotal)}</p>
              </div>
              <Clock className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Filtrar:</span>
        </div>
        <Select value={filtroEmpreendimento} onValueChange={setFiltroEmpreendimento}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Empreendimento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Empreendimentos</SelectItem>
            {empreendimentos.map((emp) => (
              <SelectItem key={emp.id} value={emp.id}>
                {emp.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : solicitacoes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma solicitação pendente</h3>
            <p className="text-muted-foreground">
              Todas as solicitações de reserva foram processadas.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {solicitacoes.map((solicitacao) => (
            <SolicitacaoCard
              key={solicitacao.id}
              negociacao={solicitacao}
              onAprovar={() => handleAprovar(solicitacao)}
              onRejeitar={() => handleRejeitar(solicitacao)}
              onEditar={() => handleEditar(solicitacao)}
              isAprovando={aprovarMutation.isPending}
            />
          ))}
        </div>
      )}

      {/* Dialogs */}
      <RejeitarDialog
        open={rejeitarDialogOpen}
        onOpenChange={setRejeitarDialogOpen}
        onConfirm={confirmarRejeicao}
        isLoading={rejeitarMutation.isPending}
      />

      <EditarSolicitacaoDialog
        open={editarDialogOpen}
        onOpenChange={setEditarDialogOpen}
        negociacao={selectedNegociacao}
      />
    </MainLayout>
  );
}
