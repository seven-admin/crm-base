import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardIncorporador } from '@/hooks/useDashboardIncorporador';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Home,
  ShoppingCart,
  FileText,
  Palette,
  FileCheck,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export function DashboardIncorporador() {
  const { data, isLoading } = useDashboardIncorporador();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <MainLayout title="Dashboard" subtitle="Visão geral dos seus empreendimentos">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Dashboard" subtitle="Visão geral dos seus empreendimentos">
      {/* KPIs Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Empreendimentos
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.empreendimentos.length || 0}</div>
            <p className="text-xs text-muted-foreground">projetos ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Unidades
            </CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.unidadesDisponiveis || 0}</div>
            <p className="text-xs text-muted-foreground">
              disponíveis de {data?.totalUnidades || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Vendidas
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.unidadesVendidas || 0}</div>
            <p className="text-xs text-muted-foreground">
              {data?.totalUnidades ? ((data.unidadesVendidas / data.totalUnidades) * 100).toFixed(0) : 0}% vendido
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Valor Vendido
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data?.valorTotalVendido || 0)}
            </div>
            <p className="text-xs text-muted-foreground">total acumulado</p>
          </CardContent>
        </Card>
      </div>

      {/* Cards de Status */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/portal-corretor/reservas')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-orange-500/10">
                  <FileText className="h-6 w-6 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Reservas Ativas</p>
                  <p className="text-2xl font-bold">{data?.reservasAtivas || 0}</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/marketing/briefings')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-purple-500/10">
                  <Palette className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Briefings Pendentes</p>
                  <p className="text-2xl font-bold">{data?.briefingsPendentes || 0}</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/contratos')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-blue-500/10">
                  <FileCheck className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Contratos em Andamento</p>
                  <p className="text-2xl font-bold">{data?.contratosEmAndamento || 0}</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Empreendimentos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Meus Empreendimentos</CardTitle>
          <Button variant="outline" size="sm" onClick={() => navigate('/empreendimentos')}>
            Ver Todos
          </Button>
        </CardHeader>
        <CardContent>
          {data?.empreendimentos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum empreendimento vinculado ainda.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {data?.empreendimentos.map((emp) => (
                <div
                  key={emp.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/empreendimentos/${emp.id}`)}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{emp.nome}</p>
                      {emp.endereco_cidade && (
                        <p className="text-sm text-muted-foreground">{emp.endereco_cidade}</p>
                      )}
                    </div>
                  </div>
                  <Badge variant="secondary">{emp.status || 'Em andamento'}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </MainLayout>
  );
}
