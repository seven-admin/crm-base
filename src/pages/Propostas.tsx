import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PaginationControls } from '@/components/ui/pagination-controls';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  FileText, 
  Search, 
  Eye,
  Plus,
  CheckCircle,
  XCircle,
  Handshake,
  AlertTriangle,
  TrendingUp,
  Clock,
  DollarSign,
  Filter,
  Trash2,
  Edit,
} from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { usePropostas, useAceitarPropostaNew, useRecusarPropostaNew, useDeleteProposta } from '@/hooks/usePropostas';
import { useEmpreendimentos } from '@/hooks/useEmpreendimentos';
import { useCorretores } from '@/hooks/useCorretores';
import { usePermissions } from '@/hooks/usePermissions';
import { PropostaForm, PropostaDetalheDialog, ConverterPropostaDialog } from '@/components/propostas';
import { Proposta, STATUS_PROPOSTA_LABELS, STATUS_PROPOSTA_COLORS, StatusProposta } from '@/types/propostas.types';
import { toast } from 'sonner';

const ITEMS_PER_PAGE = 10;

export default function Propostas() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [empreendimentoFilter, setEmpreendimentoFilter] = useState<string>('all');
  const [corretorFilter, setCorretorFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  
  const [selectedProposta, setSelectedProposta] = useState<Proposta | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [propostaParaEditar, setPropostaParaEditar] = useState<Proposta | null>(null);
  const [converterDialogOpen, setConverterDialogOpen] = useState(false);
  const [propostaParaConverter, setPropostaParaConverter] = useState<Proposta | null>(null);

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [propostaParaExcluir, setPropostaParaExcluir] = useState<string | null>(null);

  const { data: propostas = [], isLoading } = usePropostas();
  const { data: empreendimentos = [] } = useEmpreendimentos();
  const { corretores } = useCorretores();
  const { isSuperAdmin, isLoading: permissionsLoading } = usePermissions();
  
  const aceitarProposta = useAceitarPropostaNew();
  const recusarProposta = useRecusarPropostaNew();
  const deleteProposta = useDeleteProposta();
  
  // Memoiza para recalcular quando permissões carregarem
  const canDeleteAny = useMemo(() => isSuperAdmin(), [isSuperAdmin]);

  // Filtrar propostas
  const filteredPropostas = useMemo(() => {
    return propostas.filter((proposta) => {
      const matchesSearch = 
        proposta.cliente?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proposta.numero?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || proposta.status === statusFilter;
      const matchesEmpreendimento = empreendimentoFilter === 'all' || proposta.empreendimento_id === empreendimentoFilter;
      const matchesCorretor = corretorFilter === 'all' || proposta.corretor_id === corretorFilter;

      return matchesSearch && matchesStatus && matchesEmpreendimento && matchesCorretor;
    });
  }, [propostas, searchTerm, statusFilter, empreendimentoFilter, corretorFilter]);

  // Paginação
  const totalPages = Math.ceil(filteredPropostas.length / ITEMS_PER_PAGE);
  const paginatedPropostas = filteredPropostas.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Métricas
  const metrics = useMemo(() => {
    const total = propostas.length;
    const valorTotal = propostas.reduce((sum, p) => sum + (p.valor_proposta || 0), 0);
    const enviadas = propostas.filter(p => p.status === 'enviada').length;
    const aceitas = propostas.filter(p => p.status === 'aceita').length;
    const convertidas = propostas.filter(p => p.status === 'convertida').length;
    const taxaConversao = (enviadas + aceitas + convertidas) > 0 
      ? ((aceitas + convertidas) / (enviadas + aceitas + convertidas)) * 100 
      : 0;
    
    const hoje = new Date();
    const vencendo = propostas.filter(p => {
      if (!['rascunho', 'enviada'].includes(p.status) || !p.data_validade) return false;
      const dias = differenceInDays(parseISO(p.data_validade), hoje);
      return dias >= 0 && dias <= 7;
    }).length;

    return { total, valorTotal, taxaConversao, vencendo };
  }, [propostas]);

  const handleAceitar = async (id: string) => {
    try {
      await aceitarProposta.mutateAsync(id);
      toast.success('Proposta aceita!');
    } catch (error) {
      console.error('Erro ao aceitar proposta:', error);
    }
  };

  const handleRecusar = async (id: string) => {
    const motivo = window.prompt('Motivo da recusa:');
    if (motivo) {
      try {
        await recusarProposta.mutateAsync({ propostaId: id, motivo });
        toast.success('Proposta recusada');
      } catch (error) {
        console.error('Erro ao recusar proposta:', error);
      }
    }
  };

  const handleConverterEmNegociacao = (proposta: Proposta) => {
    setPropostaParaConverter(proposta);
    setConverterDialogOpen(true);
  };

  const handleExcluir = (id: string) => {
    setPropostaParaExcluir(id);
    setDeleteDialogOpen(true);
  };

  const confirmarExclusao = async () => {
    if (!propostaParaExcluir) return;
    try {
      await deleteProposta.mutateAsync(propostaParaExcluir);
      toast.success('Proposta excluída');
      setDeleteDialogOpen(false);
      setPropostaParaExcluir(null);
    } catch (error) {
      console.error('Erro ao excluir proposta:', error);
      toast.error('Erro ao excluir proposta');
    }
  };

  const getStatusBadge = (status: StatusProposta) => {
    return (
      <Badge className={STATUS_PROPOSTA_COLORS[status]}>
        {STATUS_PROPOSTA_LABELS[status]}
      </Badge>
    );
  };

  const getValidadeBadge = (dataValidade: string | null, status: StatusProposta) => {
    if (!dataValidade || !['rascunho', 'enviada'].includes(status)) return null;
    
    const dias = differenceInDays(parseISO(dataValidade), new Date());
    
    if (dias < 0) {
      return <Badge variant="destructive">Expirada</Badge>;
    } else if (dias <= 3) {
      return <Badge variant="destructive" className="flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> {dias}d</Badge>;
    } else if (dias <= 7) {
      return <Badge variant="outline" className="text-amber-600 border-amber-600">{dias}d</Badge>;
    }
    return <Badge variant="outline">{dias}d</Badge>;
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return '-';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <MainLayout>
      <PageHeader
        title="Propostas"
        subtitle="Gerencie todas as propostas comerciais"
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Proposta
          </Button>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Propostas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.valorTotal)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.taxaConversao.toFixed(1)}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencendo em 7 dias</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{metrics.vencendo}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente ou número da proposta..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="rascunho">Rascunho</SelectItem>
                <SelectItem value="enviada">Enviada</SelectItem>
                <SelectItem value="aceita">Aceita</SelectItem>
                <SelectItem value="recusada">Recusada</SelectItem>
                <SelectItem value="expirada">Expirada</SelectItem>
                <SelectItem value="convertida">Convertida</SelectItem>
              </SelectContent>
            </Select>

            <Select value={empreendimentoFilter} onValueChange={setEmpreendimentoFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Empreendimento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos empreendimentos</SelectItem>
                {empreendimentos.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>{emp.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={corretorFilter} onValueChange={setCorretorFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Corretor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos corretores</SelectItem>
                {corretores.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.nome_completo}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardContent className="pt-6">
          {isLoading || permissionsLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : paginatedPropostas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma proposta encontrada</p>
              <Button variant="link" onClick={() => setFormOpen(true)} className="mt-2">
                Criar primeira proposta
              </Button>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Proposta</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Empreendimento</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Validade</TableHead>
                    <TableHead>Corretor</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedPropostas.map((proposta) => (
                    <TableRow 
                      key={proposta.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedProposta(proposta)}
                    >
                      <TableCell className="font-medium">{proposta.numero}</TableCell>
                      <TableCell>{proposta.cliente?.nome || '-'}</TableCell>
                      <TableCell>{proposta.empreendimento?.nome || '-'}</TableCell>
                      <TableCell>{formatCurrency(proposta.valor_proposta)}</TableCell>
                      <TableCell>{getStatusBadge(proposta.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {proposta.data_validade && (
                            <span className="text-sm">
                              {format(parseISO(proposta.data_validade), 'dd/MM/yy', { locale: ptBR })}
                            </span>
                          )}
                          {getValidadeBadge(proposta.data_validade, proposta.status)}
                        </div>
                      </TableCell>
                      <TableCell>{proposta.corretor?.nome_completo || '-'}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedProposta(proposta)}
                            title="Visualizar"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {/* Editar - apenas rascunho ou enviada */}
                          {(proposta.status === 'rascunho' || proposta.status === 'enviada') && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setPropostaParaEditar(proposta)}
                              title="Editar proposta"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {(proposta.status === 'rascunho' || proposta.status === 'enviada') && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleAceitar(proposta.id)}
                                title="Aceitar proposta"
                                disabled={aceitarProposta.isPending}
                              >
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRecusar(proposta.id)}
                                title="Recusar proposta"
                                disabled={recusarProposta.isPending}
                              >
                                <XCircle className="h-4 w-4 text-red-600" />
                              </Button>
                            </>
                          )}
                          
                          {/* Excluir - rascunho sempre, outros status apenas super admin */}
                          {(proposta.status === 'rascunho' || canDeleteAny) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleExcluir(proposta.id)}
                              title="Excluir proposta"
                              disabled={deleteProposta.isPending}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                          
                          {proposta.status === 'aceita' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleConverterEmNegociacao(proposta)}
                              title="Converter em negociação"
                            >
                              <Handshake className="h-4 w-4 text-primary" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="mt-4">
                  <PaginationControls
                    page={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog - Criar nova proposta */}
      <PropostaForm
        open={formOpen}
        onOpenChange={setFormOpen}
      />

      {/* Form Dialog - Editar proposta existente */}
      <PropostaForm
        open={!!propostaParaEditar}
        onOpenChange={(open) => !open && setPropostaParaEditar(null)}
        proposta={propostaParaEditar}
      />

      {/* Detalhe Dialog */}
      <PropostaDetalheDialog
        open={!!selectedProposta}
        onOpenChange={(open) => !open && setSelectedProposta(null)}
        proposta={selectedProposta}
        onEdit={() => {
          if (selectedProposta) {
            setPropostaParaEditar(selectedProposta);
            setSelectedProposta(null);
          }
        }}
      />

      {/* Converter Dialog */}
      <ConverterPropostaDialog
        open={converterDialogOpen}
        onOpenChange={setConverterDialogOpen}
        proposta={propostaParaConverter}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Proposta</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta proposta? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPropostaParaExcluir(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmarExclusao}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteProposta.isPending ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
