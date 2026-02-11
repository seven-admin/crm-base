import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, FileText, Users, Clock } from 'lucide-react';
import { useClientes } from '@/hooks/useClientes';
import { useEmpreendimentos } from '@/hooks/useEmpreendimentos';
import { useSolicitacoesDoCorretor } from '@/hooks/useSolicitacoesCorretor';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

export default function PortalDashboard() {
  const { data: solicitacoes = [] } = useSolicitacoesDoCorretor();
  const { data: clientes = [] } = useClientes();
  const { data: empreendimentos = [] } = useEmpreendimentos();

  // Aplicar mesmo filtro de PortalEmpreendimentos para consistência
  const empreendimentosDisponiveis = useMemo(() => 
    empreendimentos.filter(e => ['lancamento', 'obra'].includes(e.status))
  , [empreendimentos]);

  const solicitacoesPendentes = solicitacoes.filter(s => s.status_aprovacao === 'pendente');
  const solicitacoesRecentes = solicitacoes.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empreendimentos</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{empreendimentosDisponiveis.length}</div>
            <p className="text-xs text-muted-foreground">disponíveis para venda</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Solicitações Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{solicitacoesPendentes.length}</div>
            <p className="text-xs text-muted-foreground">aguardando aprovação</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meus Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientes.length}</div>
            <p className="text-xs text-muted-foreground">cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Solicitações</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{solicitacoes.length}</div>
            <p className="text-xs text-muted-foreground">no histórico</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Link
              to="/portal-corretor/empreendimentos"
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted transition-colors"
            >
              <Building2 className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Ver Empreendimentos</p>
                <p className="text-sm text-muted-foreground">Visualize e solicite reservas</p>
              </div>
            </Link>
            <Link
              to="/portal-corretor/solicitacoes"
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted transition-colors"
            >
              <FileText className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Minhas Solicitações</p>
                <p className="text-sm text-muted-foreground">Acompanhe o status das suas solicitações</p>
              </div>
            </Link>
            <Link
              to="/portal-corretor/clientes"
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted transition-colors"
            >
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Cadastrar Cliente</p>
                <p className="text-sm text-muted-foreground">Adicione novos clientes</p>
              </div>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Solicitações Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {solicitacoesRecentes.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Nenhuma solicitação encontrada
              </p>
            ) : (
              <div className="space-y-3">
                {solicitacoesRecentes.map((solicitacao) => (
                  <div key={solicitacao.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-medium">{solicitacao.codigo}</p>
                      <p className="text-sm text-muted-foreground">
                        {solicitacao.empreendimento?.nome}
                        {solicitacao.unidades && solicitacao.unidades.length > 0 && (
                          <> - {solicitacao.unidades.length} unidade(s)</>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {solicitacao.solicitada_em && formatDistanceToNow(new Date(solicitacao.solicitada_em), { addSuffix: true, locale: ptBR })}
                      </p>
                    </div>
                    <Badge className={STATUS_COLORS[solicitacao.status_aprovacao || 'pendente']}>
                      {STATUS_LABELS[solicitacao.status_aprovacao || 'pendente']}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
