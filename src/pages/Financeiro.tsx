import React, { useState, useMemo, forwardRef } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { CurrencyInput } from '@/components/ui/currency-input';

import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  CheckCircle,
  ClipboardCheck,
  Calendar,
  Repeat,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ArrowUpDown
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { format, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  useLancamentos, 
  useCreateLancamento, 
  useUpdateLancamento,
  useRegistrarPagamentoLancamento,
  useRegistrarPagamentoEmLote,
  useFinanceiroStats,
  useAprovarLancamentos,
  useCentrosCusto,
  useCategoriasFluxo,
  useDeleteLancamento
} from '@/hooks/useFinanceiro';
import { useEmpreendimentos } from '@/hooks/useEmpreendimentos';
import { useFuncionariosSeven } from '@/hooks/useFuncionariosSeven';
import { FinanceiroConfiguracoes } from '@/components/financeiro/FinanceiroConfiguracoes';
import { FinanceiroDashboard } from '@/components/financeiro/FinanceiroDashboard';
import { RelatorioRessarcimentos } from '@/components/financeiro/RelatorioRessarcimentos';
import { useAuth } from '@/contexts/AuthContext';
import type { LancamentoFormData, TipoFluxo, StatusConferencia, RecorrenciaFrequencia, StatusLancamento, BeneficiarioTipo } from '@/types/financeiro.types';
import { STATUS_LANCAMENTO_LABELS, STATUS_LANCAMENTO_COLORS, STATUS_CONFERENCIA_LABELS, STATUS_CONFERENCIA_COLORS, RECORRENCIA_LABELS, RECORRENCIA_MESES } from '@/types/financeiro.types';

export default function Financeiro() {
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState('visao-geral');
  const [formOpen, setFormOpen] = useState(false);
  const [pagamentoOpen, setPagamentoOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [lancamentoToDelete, setLancamentoToDelete] = useState<string | null>(null);
  const [selectedLancamento, setSelectedLancamento] = useState<string | null>(null);
  const [tipoLancamento, setTipoLancamento] = useState<TipoFluxo>('saida');
  const [selectedForApproval, setSelectedForApproval] = useState<string[]>([]);
  const [selectedForPayment, setSelectedForPayment] = useState<string[]>([]);
  const [pagamentoLoteOpen, setPagamentoLoteOpen] = useState(false);
  const [pagamentoLoteData, setPagamentoLoteData] = useState({
    data_pagamento: format(new Date(), 'yyyy-MM-dd')
  });
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [editingLancamento, setEditingLancamento] = useState<any | null>(null);
  
  // Filtros e paginação
  const [tipoFilter, setTipoFilter] = useState<'todos' | 'receber' | 'pagar'>('todos');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [centroCustoFilter, setCentroCustoFilter] = useState<string>('todos');
  const [categoriaFilter, setCategoriaFilter] = useState<string>('todos');
  const [empreendimentoFilter, setEmpreendimentoFilter] = useState<string>('todos');
  const [funcionarioFilter, setFuncionarioFilter] = useState<string>('todos');
  const [page, setPage] = useState(1);
  const pageSize = 20;
  
  // Estado para ordenação da tabela
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  
  const [formData, setFormData] = useState<LancamentoFormData>({
    tipo: 'saida',
    descricao: '',
    valor: 0,
    data_vencimento: ''
  });
  const [pagamentoData, setPagamentoData] = useState({
    data_pagamento: format(new Date(), 'yyyy-MM-dd'),
    nf_numero: ''
  });
  
  const isSuperAdmin = role === 'super_admin';

  // Gerar lista de meses para seleção (6 meses passados + mês atual + 12 meses futuros)
  const monthOptions = useMemo(() => {
    const options = [];
    const today = new Date();
    
    // 12 meses futuros
    for (let i = 12; i >= 1; i--) {
      const date = addMonths(today, i);
      options.push({
        value: format(date, 'yyyy-MM'),
        label: format(date, 'MMMM yyyy', { locale: ptBR })
      });
    }
    
    // Mês atual + 6 meses passados
    for (let i = 0; i <= 6; i++) {
      const date = subMonths(today, i);
      options.push({
        value: format(date, 'yyyy-MM'),
        label: format(date, 'MMMM yyyy', { locale: ptBR })
      });
    }
    
    return options;
  }, []);

  // Calcular datas do mês selecionado
  const [year, month] = selectedMonth.split('-').map(Number);
  const startDate = format(new Date(year, month - 1, 1), 'yyyy-MM-dd');
  const endDate = format(endOfMonth(new Date(year, month - 1, 1)), 'yyyy-MM-dd');

  const { data: lancamentos = [], isLoading } = useLancamentos({
    data_inicio: startDate,
    data_fim: endDate,
    tipo: tipoFilter !== 'todos' ? tipoFilter : undefined,
    status: statusFilter !== 'todos' ? statusFilter as StatusLancamento : undefined,
    centro_custo_id: centroCustoFilter !== 'todos' ? centroCustoFilter : undefined,
    categoria_fluxo: categoriaFilter !== 'todos' ? categoriaFilter : undefined,
    empreendimento_id: empreendimentoFilter !== 'todos' ? empreendimentoFilter : undefined,
    beneficiario_id: funcionarioFilter !== 'todos' ? funcionarioFilter : undefined,
  });
  
  // Reset page quando filtros mudam
  React.useEffect(() => {
    setPage(1);
  }, [selectedMonth, tipoFilter, statusFilter, centroCustoFilter, categoriaFilter, empreendimentoFilter, funcionarioFilter]);
  const { data: stats } = useFinanceiroStats({
    data_inicio: startDate,
    data_fim: endDate
  });
  const { data: empreendimentos = [] } = useEmpreendimentos();
  const { data: centrosCusto = [] } = useCentrosCusto();
  const { data: allCategoriasFluxo = [] } = useCategoriasFluxo();
  const { data: categoriasFluxo = [] } = useCategoriasFluxo(tipoLancamento === 'entrada' ? 'entrada' : 'saida');
  const { data: allProfiles = [] } = useFuncionariosSeven();
  const createLancamento = useCreateLancamento();
  const updateLancamento = useUpdateLancamento();
  const registrarPagamento = useRegistrarPagamentoLancamento();
  const registrarPagamentoLote = useRegistrarPagamentoEmLote();
  const aprovarLancamentos = useAprovarLancamentos();
  const deleteLancamento = useDeleteLancamento();

  const entradas = lancamentos.filter(l => (l as any).tipo === 'receber');
  const saidas = lancamentos.filter(l => (l as any).tipo === 'pagar');
  const pendentesConferencia = lancamentos.filter(l => 
    (l as any).status_conferencia === 'pendente' || !(l as any).status_conferencia
  );
  const pendentesPagamento = lancamentos.filter(l => l.status === 'pendente');

  // Calcular total selecionado para pagamento
  const totalSelecionadoPagamento = pendentesPagamento
    .filter(l => selectedForPayment.includes(l.id))
    .reduce((acc, l) => acc + l.valor, 0);

  // Lançamentos ordenados
  const sortedLancamentos = useMemo(() => {
    if (!sortConfig) return lancamentos;
    
    return [...lancamentos].sort((a: any, b: any) => {
      let aVal: any;
      let bVal: any;
      
      switch (sortConfig.key) {
        case 'data_vencimento':
          aVal = new Date(a.data_vencimento).getTime();
          bVal = new Date(b.data_vencimento).getTime();
          break;
        case 'descricao':
          aVal = a.descricao?.toLowerCase() || '';
          bVal = b.descricao?.toLowerCase() || '';
          break;
        case 'categoria_fluxo':
          aVal = a.categoria_fluxo?.toLowerCase() || '';
          bVal = b.categoria_fluxo?.toLowerCase() || '';
          break;
        case 'centro_custo':
          aVal = a.centro_custo?.nome?.toLowerCase() || '';
          bVal = b.centro_custo?.nome?.toLowerCase() || '';
          break;
        case 'tipo':
          aVal = a.tipo || '';
          bVal = b.tipo || '';
          break;
        case 'valor':
          aVal = a.valor || 0;
          bVal = b.valor || 0;
          break;
        case 'status':
          aVal = a.status || '';
          bVal = b.status || '';
          break;
        default:
          aVal = a[sortConfig.key];
          bVal = b[sortConfig.key];
      }
      
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [lancamentos, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig(prev => {
      if (prev?.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  // Paginação
  const paginatedLancamentos = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedLancamentos.slice(start, start + pageSize);
  }, [sortedLancamentos, page, pageSize]);

  const totalPages = Math.ceil(sortedLancamentos.length / pageSize);

  const SortableHeader = forwardRef<
    HTMLTableCellElement,
    { column: string; label: string; className?: string }
  >(({ column, label, className }, ref) => (
    <TableHead 
      ref={ref}
      className={`cursor-pointer select-none hover:bg-muted/50 transition-colors ${className || ''}`}
      onClick={() => handleSort(column)}
    >
      <div className="flex items-center gap-1">
        {label}
        {sortConfig?.key === column ? (
          sortConfig.direction === 'asc' 
            ? <ChevronUp className="h-4 w-4" />
            : <ChevronDown className="h-4 w-4" />
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-30" />
        )}
      </div>
    </TableHead>
  ));
  SortableHeader.displayName = 'SortableHeader';

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const resetForm = () => {
    setFormData({
      tipo: 'saida',
      descricao: '',
      valor: 0,
      data_vencimento: ''
    });
    setEditingLancamento(null);
  };

  const openEditLancamento = (lancamento: any) => {
    setEditingLancamento(lancamento);
    setTipoLancamento(lancamento.tipo === 'receber' ? 'entrada' : 'saida');
    setFormData({
      tipo: lancamento.tipo === 'receber' ? 'entrada' : 'saida',
      descricao: lancamento.descricao,
      valor: lancamento.valor,
      data_vencimento: lancamento.data_vencimento,
      empreendimento_id: lancamento.empreendimento_id,
      centro_custo_id: lancamento.centro_custo_id,
      categoria_fluxo: lancamento.categoria_fluxo,
      observacoes: lancamento.observacoes,
      is_recorrente: lancamento.is_recorrente,
      recorrencia_frequencia: lancamento.recorrencia_frequencia,
      beneficiario_id: lancamento.beneficiario_id,
      beneficiario_tipo: lancamento.beneficiario_tipo,
    } as any);
    setFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingLancamento) {
      updateLancamento.mutate({
        id: editingLancamento.id,
        data: {
          descricao: formData.descricao,
          valor: formData.valor,
          data_vencimento: formData.data_vencimento,
          empreendimento_id: formData.empreendimento_id || null,
          centro_custo_id: (formData as any).centro_custo_id || null,
          categoria_fluxo: (formData as any).categoria_fluxo || null,
          observacoes: (formData as any).observacoes || null,
          beneficiario_id: formData.beneficiario_id || null,
          beneficiario_tipo: formData.beneficiario_tipo || null,
        }
      }, {
        onSuccess: () => {
          setFormOpen(false);
          resetForm();
        }
      });
    } else {
      const dataToSend = {
        ...formData,
        tipo: tipoLancamento === 'entrada' ? 'receber' : 'pagar'
      } as any;
      createLancamento.mutate(dataToSend, {
        onSuccess: () => {
          setFormOpen(false);
          resetForm();
        }
      });
    }
  };

  const handleRegistrarPagamento = () => {
    if (selectedLancamento) {
      registrarPagamento.mutate({
        id: selectedLancamento,
        ...pagamentoData
      }, {
        onSuccess: () => {
          setPagamentoOpen(false);
          setSelectedLancamento(null);
        }
      });
    }
  };

  const openPagamento = (id: string) => {
    setSelectedLancamento(id);
    setPagamentoOpen(true);
  };

  const openFormWithType = (tipo: TipoFluxo) => {
    resetForm();
    setTipoLancamento(tipo);
    setFormData(prev => ({ ...prev, tipo }));
    setFormOpen(true);
  };

  const toggleSelectForApproval = (id: string) => {
    setSelectedForApproval(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id) 
        : [...prev, id]
    );
  };

  const handleApproveSelected = () => {
    if (selectedForApproval.length === 0) return;
    
    aprovarLancamentos.mutate(selectedForApproval, {
      onSuccess: () => {
        setSelectedForApproval([]);
      }
    });
  };

  const toggleSelectForPayment = (id: string) => {
    setSelectedForPayment(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id) 
        : [...prev, id]
    );
  };

  const handlePaySelected = () => {
    if (selectedForPayment.length === 0) return;
    setPagamentoLoteOpen(true);
  };

  const handleConfirmPagamentoLote = () => {
    registrarPagamentoLote.mutate({
      ids: selectedForPayment,
      data_pagamento: pagamentoLoteData.data_pagamento
    }, {
      onSuccess: () => {
        setSelectedForPayment([]);
        setPagamentoLoteOpen(false);
      }
    });
  };

  const openDeleteDialog = (id: string) => {
    setLancamentoToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (lancamentoToDelete) {
      deleteLancamento.mutate(lancamentoToDelete);
      setLancamentoToDelete(null);
      setDeleteDialogOpen(false);
    }
  };


  return (
    <MainLayout 
      title="Fluxo de Caixa" 
      subtitle="Gestão financeira - Entradas e Saídas"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
          <TabsList>
            <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
            <TabsTrigger value="movimentacoes">Movimentações</TabsTrigger>
            <TabsTrigger value="conferencia">
              Conferência
              {pendentesConferencia.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {pendentesConferencia.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="ressarcimentos">Ressarcimentos</TabsTrigger>
            <TabsTrigger value="configuracoes">Configurações</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-1">
            <Button 
              variant="outline" 
              size="icon"
              className="h-9 w-9"
              onClick={() => {
                const [y, m] = selectedMonth.split('-').map(Number);
                setSelectedMonth(format(subMonths(new Date(y, m - 1), 1), 'yyyy-MM'));
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[180px]">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              size="icon"
              className="h-9 w-9"
              onClick={() => {
                const [y, m] = selectedMonth.split('-').map(Number);
                setSelectedMonth(format(addMonths(new Date(y, m - 1), 1), 'yyyy-MM'));
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            
            <Button 
              variant="secondary" 
              size="sm"
              className="ml-2"
              onClick={() => setSelectedMonth(format(new Date(), 'yyyy-MM'))}
              disabled={selectedMonth === format(new Date(), 'yyyy-MM')}
            >
              Hoje
            </Button>
          </div>
        </div>

        <TabsContent value="visao-geral">
          <FinanceiroDashboard
            lancamentos={lancamentos}
            stats={stats}
            onOpenPagamento={openPagamento}
            formatCurrency={formatCurrency}
          />
        </TabsContent>

        <TabsContent value="movimentacoes">
          <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={tipoFilter} onValueChange={(v) => setTipoFilter(v as any)}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos Tipos</SelectItem>
                  <SelectItem value="receber">Entradas</SelectItem>
                  <SelectItem value="pagar">Saídas</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos Status</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                  <SelectItem value="vencido">Vencido</SelectItem>
                </SelectContent>
              </Select>

              <Select value={centroCustoFilter} onValueChange={setCentroCustoFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Centro Custo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos C.Custo</SelectItem>
                  {centrosCusto.map((cc: any) => (
                    <SelectItem key={cc.id} value={cc.id}>{cc.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas Categorias</SelectItem>
                  {allCategoriasFluxo.map((cat: any) => (
                    <SelectItem key={cat.id} value={cat.nome}>{cat.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={empreendimentoFilter} onValueChange={setEmpreendimentoFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Empreend." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos Empreend.</SelectItem>
                  {empreendimentos.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={funcionarioFilter} onValueChange={setFuncionarioFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Funcionário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos Func.</SelectItem>
                  {allProfiles.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {(tipoFilter !== 'todos' || statusFilter !== 'todos' || centroCustoFilter !== 'todos' || categoriaFilter !== 'todos' || empreendimentoFilter !== 'todos' || funcionarioFilter !== 'todos') && (
                <Button variant="ghost" size="sm" onClick={() => {
                  setTipoFilter('todos');
                  setStatusFilter('todos');
                  setCentroCustoFilter('todos');
                  setCategoriaFilter('todos');
                  setEmpreendimentoFilter('todos');
                  setFuncionarioFilter('todos');
                }}>
                  Limpar Filtros
                </Button>
              )}
              
              {selectedForPayment.length > 0 && (
                <Button onClick={handlePaySelected} variant="default">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Pagar Selecionados ({selectedForPayment.length}) - {formatCurrency(totalSelecionadoPagamento)}
                </Button>
              )}
              
              <span className="text-sm text-muted-foreground">
                {sortedLancamentos.length} registro(s)
              </span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => openFormWithType('entrada')}>
                <ArrowDownCircle className="h-4 w-4 mr-2 text-green-500" /> Nova Entrada
              </Button>
              <Button onClick={() => openFormWithType('saida')}>
                <ArrowUpCircle className="h-4 w-4 mr-2" /> Nova Saída
              </Button>
            </div>
          </div>
          
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox 
                        checked={selectedForPayment.length === pendentesPagamento.length && pendentesPagamento.length > 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedForPayment(pendentesPagamento.map(l => l.id));
                          } else {
                            setSelectedForPayment([]);
                          }
                        }}
                      />
                    </TableHead>
                    <SortableHeader column="data_vencimento" label="Data" />
                    <SortableHeader column="descricao" label="Descrição" />
                    <SortableHeader column="categoria_fluxo" label="Categoria" className="hidden lg:table-cell" />
                    <SortableHeader column="beneficiario" label="Beneficiário" className="hidden md:table-cell" />
                    <SortableHeader column="centro_custo" label="Centro de Custo" className="hidden xl:table-cell" />
                    <SortableHeader column="tipo" label="Tipo" />
                    <SortableHeader column="valor" label="Valor" className="text-right" />
                    <SortableHeader column="status" label="Status" />
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedLancamentos.map((lancamento) => {
                    const isEntrada = (lancamento as any).tipo === 'receber';
                    const isPendente = lancamento.status === 'pendente';
                    return (
                      <TableRow 
                        key={lancamento.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => openEditLancamento(lancamento)}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          {isPendente ? (
                            <Checkbox 
                              checked={selectedForPayment.includes(lancamento.id)}
                              onCheckedChange={() => toggleSelectForPayment(lancamento.id)}
                            />
                          ) : (
                            <span className="w-4" />
                          )}
                        </TableCell>
                        <TableCell>{format(new Date(lancamento.data_vencimento), 'dd/MM/yyyy')}</TableCell>
                        <TableCell className="font-medium">{lancamento.descricao}</TableCell>
                        <TableCell className="hidden lg:table-cell">{(lancamento as any).categoria_fluxo || '-'}</TableCell>
                        <TableCell className="hidden md:table-cell">{(lancamento as any).beneficiario?.full_name || '-'}</TableCell>
                        <TableCell className="hidden xl:table-cell">{(lancamento as any).centro_custo?.nome || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={isEntrada ? 'default' : 'secondary'} className={isEntrada ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {isEntrada ? 'Entrada' : 'Saída'}
                          </Badge>
                        </TableCell>
                        <TableCell className={`text-right font-medium ${isEntrada ? 'text-green-600' : 'text-red-600'}`}>
                          {isEntrada ? '+' : '-'} {formatCurrency(lancamento.valor)}
                        </TableCell>
                        <TableCell>
                          <Badge className={STATUS_LANCAMENTO_COLORS[lancamento.status]}>
                            {STATUS_LANCAMENTO_LABELS[lancamento.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            {isPendente && (
                              <Button size="sm" variant="outline" onClick={() => openPagamento(lancamento.id)}>
                                {isEntrada ? 'Receber' : 'Pagar'}
                              </Button>
                            )}
                            {isSuperAdmin && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                onClick={() => openDeleteDialog(lancamento.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {paginatedLancamentos.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                        Nenhum lançamento encontrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              
              {/* Paginação */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <p className="text-sm text-muted-foreground">
                    Página {page} de {totalPages} • {sortedLancamentos.length} registros
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page >= totalPages}
                    >
                      Próxima
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conferencia">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5" />
                Lançamentos Pendentes de Conferência
              </CardTitle>
              {selectedForApproval.length > 0 && (
                <Button onClick={handleApproveSelected}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Aprovar Selecionados ({selectedForApproval.length})
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox 
                        checked={selectedForApproval.length === pendentesConferencia.length && pendentesConferencia.length > 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedForApproval(pendentesConferencia.map(l => l.id));
                          } else {
                            setSelectedForApproval([]);
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status Conf.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendentesConferencia.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Nenhum lançamento pendente de conferência
                      </TableCell>
                    </TableRow>
                  ) : (
                    pendentesConferencia.map((lancamento) => {
                      const isEntrada = (lancamento as any).tipo === 'receber';
                      const statusConf = ((lancamento as any).status_conferencia || 'pendente') as StatusConferencia;
                      return (
                        <TableRow key={lancamento.id}>
                          <TableCell>
                            <Checkbox 
                              checked={selectedForApproval.includes(lancamento.id)}
                              onCheckedChange={() => toggleSelectForApproval(lancamento.id)}
                            />
                          </TableCell>
                          <TableCell>{format(new Date(lancamento.data_vencimento), 'dd/MM/yyyy')}</TableCell>
                          <TableCell className="font-medium">{lancamento.descricao}</TableCell>
                          <TableCell>
                            <Badge variant={isEntrada ? 'default' : 'secondary'} className={isEntrada ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                              {isEntrada ? 'Entrada' : 'Saída'}
                            </Badge>
                          </TableCell>
                          <TableCell className={`text-right font-medium ${isEntrada ? 'text-green-600' : 'text-red-600'}`}>
                            {isEntrada ? '+' : '-'} {formatCurrency(lancamento.valor)}
                          </TableCell>
                          <TableCell>
                            <Badge className={STATUS_CONFERENCIA_COLORS[statusConf]}>
                              {STATUS_CONFERENCIA_LABELS[statusConf]}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ressarcimentos">
          <RelatorioRessarcimentos startDate={startDate} endDate={endDate} />
        </TabsContent>

        <TabsContent value="configuracoes">
          <FinanceiroConfiguracoes />
        </TabsContent>
      </Tabs>

      {/* Dialog Novo/Editar Lançamento */}
      <Dialog open={formOpen} onOpenChange={(open) => {
        setFormOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {tipoLancamento === 'entrada' ? (
                <ArrowDownCircle className="h-5 w-5 text-green-500" />
              ) : (
                <ArrowUpCircle className="h-5 w-5 text-red-500" />
              )}
              {editingLancamento ? 'Editar' : 'Nova'} {tipoLancamento === 'entrada' ? 'Entrada' : 'Saída'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Descrição</Label>
              <Input
                value={formData.descricao}
                onChange={e => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                placeholder="Descrição do lançamento"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Valor</Label>
                <CurrencyInput
                  value={formData.valor}
                  onChange={(value) => setFormData(prev => ({ ...prev, valor: value }))}
                />
              </div>
              <div>
                <Label>Data Vencimento</Label>
                <Input
                  type="date"
                  value={formData.data_vencimento}
                  onChange={e => setFormData(prev => ({ ...prev, data_vencimento: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Centro de Custo</Label>
                <Select
                  value={(formData as any).centro_custo_id || ''}
                  onValueChange={value => setFormData(prev => ({ ...prev, centro_custo_id: value || undefined } as any))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {centrosCusto.map((cc: any) => (
                      <SelectItem key={cc.id} value={cc.id}>{cc.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Categoria</Label>
                <Select
                  value={(formData as any).categoria_fluxo || ''}
                  onValueChange={value => setFormData(prev => ({ ...prev, categoria_fluxo: value || undefined } as any))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriasFluxo.map((cat: any) => (
                      <SelectItem key={cat.id} value={cat.nome}>{cat.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Empreendimento (opcional)</Label>
              <Select
                value={formData.empreendimento_id || ''}
                onValueChange={value => setFormData(prev => ({ ...prev, empreendimento_id: value || undefined }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {empreendimentos.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Funcionário (Ressarcimento)</Label>
              <Select
                value={formData.beneficiario_id || ''}
                onValueChange={value => setFormData(prev => ({ 
                  ...prev, 
                  beneficiario_id: value || undefined,
                  beneficiario_tipo: value ? 'outro' as BeneficiarioTipo : undefined,
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Nenhum (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {allProfiles.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {!editingLancamento && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Repeat className="h-4 w-4 text-muted-foreground" />
                    <Label>Lançamento Recorrente</Label>
                  </div>
                  <Switch
                    checked={(formData as any).is_recorrente || false}
                    onCheckedChange={(checked) => setFormData(prev => ({ 
                      ...prev, 
                      is_recorrente: checked,
                      recorrencia_frequencia: checked ? 'mensal' : undefined
                    } as any))}
                  />
                </div>
                {(formData as any).is_recorrente && (
                  <div className="space-y-2">
                    <Label>Frequência</Label>
                    <Select
                      value={(formData as any).recorrencia_frequencia || 'mensal'}
                      onValueChange={value => setFormData(prev => ({ ...prev, recorrencia_frequencia: value } as any))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(RECORRENCIA_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Serão criados lançamentos até Dezembro/{new Date().getFullYear()}
                    </p>
                  </div>
                )}
              </div>
            )}
            <div>
              <Label>Observações</Label>
              <Textarea
                value={formData.observacoes || ''}
                onChange={e => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                placeholder="Observações..."
                rows={2}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createLancamento.isPending || updateLancamento.isPending}>
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Registrar Pagamento */}
      <Dialog open={pagamentoOpen} onOpenChange={setPagamentoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pagamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Data do Pagamento</Label>
              <Input
                type="date"
                value={pagamentoData.data_pagamento}
                onChange={e => setPagamentoData(prev => ({ ...prev, data_pagamento: e.target.value }))}
              />
            </div>
            <div>
              <Label>Nº Nota Fiscal (opcional)</Label>
              <Input
                value={pagamentoData.nf_numero}
                onChange={e => setPagamentoData(prev => ({ ...prev, nf_numero: e.target.value }))}
                placeholder="Número da NF"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPagamentoOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleRegistrarPagamento} disabled={registrarPagamento.isPending}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Pagamento em Lote */}
      <Dialog open={pagamentoLoteOpen} onOpenChange={setPagamentoLoteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pagar {selectedForPayment.length} Lançamentos</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Data do Pagamento</Label>
              <Input
                type="date"
                value={pagamentoLoteData.data_pagamento}
                onChange={e => setPagamentoLoteData({ data_pagamento: e.target.value })}
              />
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Total a pagar: <span className="font-semibold text-foreground">{formatCurrency(totalSelecionadoPagamento)}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {selectedForPayment.length} lançamento(s) selecionado(s)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPagamentoLoteOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmPagamentoLote} disabled={registrarPagamentoLote.isPending}>
              Confirmar Pagamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialog Confirmação de Exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Lançamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este lançamento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}