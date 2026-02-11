import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Filter, Building2, User, Users, Settings } from 'lucide-react';
import { useComissoesPaginated, useDeleteComissao, useComissaoStats } from '@/hooks/useComissoes';
import { useEmpreendimentos } from '@/hooks/useEmpreendimentos';
import { useGestoresProduto } from '@/hooks/useGestores';
import { ComissoesTable } from '@/components/comissoes/ComissoesTable';
import { ComissaoForm } from '@/components/comissoes/ComissaoForm';
import { ComissoesStats } from '@/components/comissoes/ComissoesStats';
import { PagamentoLancamentoDialog } from '@/components/comissoes/PagamentoLancamentoDialog';
import { ComissaoDetalheDialog } from '@/components/comissoes/ComissaoDetalheDialog';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { ConfiguracaoPercentuaisGestores } from '@/components/comissoes/ConfiguracaoPercentuaisGestores';
import { usePermissions } from '@/hooks/usePermissions';
import type { Comissao, ComissaoFilters } from '@/types/comissoes.types';

export default function Comissoes() {
  const [formOpen, setFormOpen] = useState(false);
  const [pagamentoOpen, setPagamentoOpen] = useState(false);
  const [detalhesOpen, setDetalhesOpen] = useState(false);
  const [selectedComissao, setSelectedComissao] = useState<Comissao | null>(null);
  const [comissaoToEdit, setComissaoToEdit] = useState<Comissao | null>(null);
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState('todas');
  const [filters, setFilters] = useState<ComissaoFilters>({});
  const { isSuperAdmin, isAdmin } = usePermissions();

  const { data: empreendimentos = [] } = useEmpreendimentos();
  const { data: gestores = [] } = useGestoresProduto();
  
  // Build filters based on active tab
  const queryFilters: ComissaoFilters = {
    ...filters,
    status: activeTab === 'pendentes' ? 'pendente' : activeTab === 'pagas' ? 'pago' : undefined,
  };

  const { data, isLoading } = useComissoesPaginated(queryFilters, page, 20);
  const { data: stats } = useComissaoStats(filters.empreendimento_id);
  const { mutate: deleteComissao } = useDeleteComissao();

  const comissoes = data?.comissoes || [];
  const totalPages = data?.totalPages || 1;
  const total = data?.total || 0;

  const handleRegistrarPagamento = (comissao: Comissao) => {
    setSelectedComissao(comissao);
    setPagamentoOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta comissão? Esta ação não pode ser desfeita.')) {
      deleteComissao(id);
    }
  };

  const handleView = (id: string) => {
    const comissao = comissoes.find(c => c.id === id);
    if (comissao) {
      setSelectedComissao(comissao);
      setDetalhesOpen(true);
    }
  };

  const handleEdit = (comissao: Comissao) => {
    setComissaoToEdit(comissao);
    setFormOpen(true);
  };

  const handleFormClose = (open: boolean) => {
    setFormOpen(open);
    if (!open) {
      setComissaoToEdit(null);
    }
  };

  const handleFilterChange = (key: keyof ComissaoFilters, value: string | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === 'all' ? undefined : value,
    }));
    setPage(1);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setPage(1);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <MainLayout 
      title="Comissões" 
      subtitle="Controle de comissões de vendas"
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <ComissoesStats empreendimentoId={filters.empreendimento_id} />

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
            <div className="hidden sm:flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Filtros:</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Select
                value={filters.empreendimento_id || 'all'}
                onValueChange={(v) => handleFilterChange('empreendimento_id', v)}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Empreendimento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Empreendimentos</SelectItem>
                  {empreendimentos.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filters.gestor_id || 'all'}
                onValueChange={(v) => handleFilterChange('gestor_id', v)}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <User className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Gestor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Gestores</SelectItem>
                  {gestores.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={() => setFormOpen(true)} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Nova Comissão
          </Button>
        </div>

        {/* Tabs for status filtering */}
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className={`grid w-full sm:w-auto sm:inline-grid ${(isSuperAdmin() || isAdmin()) ? 'grid-cols-4' : 'grid-cols-3'}`}>
            <TabsTrigger value="todas" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Todas</span>
              <span className="text-xs text-muted-foreground">({stats?.quantidadeComissoes || 0})</span>
            </TabsTrigger>
            <TabsTrigger value="pendentes" className="gap-2">
              <span className="w-2 h-2 rounded-full bg-yellow-500" />
              <span className="hidden sm:inline">Pendentes</span>
            </TabsTrigger>
            <TabsTrigger value="pagas" className="gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span className="hidden sm:inline">Pagas</span>
            </TabsTrigger>
            {(isSuperAdmin() || isAdmin()) && (
              <TabsTrigger value="configuracao" className="gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Configuração</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="configuracao" className="mt-4">
            <ConfiguracaoPercentuaisGestores />
          </TabsContent>

          <TabsContent value={activeTab} className="mt-4">
            {activeTab !== 'configuracao' && (
              <>
                <ComissoesTable
                  comissoes={comissoes}
                  isLoading={isLoading}
                  onView={handleView}
                  onEdit={handleEdit}
                  onRegistrarPagamento={handleRegistrarPagamento}
                  onDelete={handleDelete}
                  canEdit={isSuperAdmin() || isAdmin()}
                  canDelete={isSuperAdmin()}
                />

                <div className="mt-4">
                  <PaginationControls
                    page={page}
                    totalPages={totalPages}
                    totalItems={total}
                    onPageChange={setPage}
                  />
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>

        {/* Summary by Corretor/Imobiliária - only shown when there are commissions */}
        {comissoes.length > 0 && activeTab !== 'configuracao' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Summary by Corretor */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Comissões por Corretor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {Object.entries(
                    comissoes.reduce((acc, c) => {
                      const key = c.corretor_id ? (c as any).corretor?.nome_completo || 'Corretor Não Identificado' : 'Sem Corretor';
                      if (!acc[key]) {
                        acc[key] = { pendente: 0, pago: 0 };
                      }
                      const valor = Number(c.valor_corretor) || 0;
                      if (c.status_corretor === 'pago') {
                        acc[key].pago += valor;
                      } else {
                        acc[key].pendente += valor;
                      }
                      return acc;
                    }, {} as Record<string, { pendente: number; pago: number }>)
                  ).map(([nome, valores]) => (
                    <div key={nome} className="flex items-center justify-between py-2 border-b last:border-0">
                      <span className="text-sm font-medium truncate flex-1">{nome}</span>
                      <div className="flex gap-3 text-sm">
                        {valores.pendente > 0 && (
                          <span className="text-yellow-600">{formatCurrency(valores.pendente)}</span>
                        )}
                        {valores.pago > 0 && (
                          <span className="text-green-600">{formatCurrency(valores.pago)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Summary by Imobiliária */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Comissões por Imobiliária
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {Object.entries(
                    comissoes.reduce((acc, c) => {
                      const key = c.imobiliaria_id ? (c as any).imobiliaria?.nome || 'Imobiliária Não Identificada' : 'Sem Imobiliária';
                      if (!acc[key]) {
                        acc[key] = { pendente: 0, pago: 0 };
                      }
                      const valor = Number(c.valor_imobiliaria) || 0;
                      if (c.status_imobiliaria === 'pago') {
                        acc[key].pago += valor;
                      } else {
                        acc[key].pendente += valor;
                      }
                      return acc;
                    }, {} as Record<string, { pendente: number; pago: number }>)
                  ).map(([nome, valores]) => (
                    <div key={nome} className="flex items-center justify-between py-2 border-b last:border-0">
                      <span className="text-sm font-medium truncate flex-1">{nome}</span>
                      <div className="flex gap-3 text-sm">
                        {valores.pendente > 0 && (
                          <span className="text-yellow-600">{formatCurrency(valores.pendente)}</span>
                        )}
                        {valores.pago > 0 && (
                          <span className="text-green-600">{formatCurrency(valores.pago)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <ComissaoForm 
        open={formOpen} 
        onOpenChange={handleFormClose} 
        comissaoToEdit={comissaoToEdit}
      />
      
      <PagamentoLancamentoDialog
        open={pagamentoOpen}
        onOpenChange={setPagamentoOpen}
        comissao={selectedComissao}
      />

      <ComissaoDetalheDialog
        open={detalhesOpen}
        onOpenChange={setDetalhesOpen}
        comissao={selectedComissao}
      />
    </MainLayout>
  );
}
