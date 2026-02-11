import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Phone, Users, MapPin, Headphones, CheckCircle, XCircle, Trash2, Edit, List, Calendar, AlertCircle, Video, Handshake, PenTool, PackageCheck, GraduationCap, Briefcase } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AtividadeForm } from '@/components/atividades/AtividadeForm';
import { ConcluirAtividadeDialog } from '@/components/atividades/ConcluirAtividadeDialog';
import { CancelarAtividadeDialog } from '@/components/atividades/CancelarAtividadeDialog';
import { AtividadeDetalheDialog } from '@/components/atividades/AtividadeDetalheDialog';
import { PendenciasTab } from '@/components/atividades/PendenciasTab';
import { AgendaCalendario } from '@/components/agenda/AgendaCalendario';
import { AgendaDia } from '@/components/agenda/AgendaDia';
import { useAtividade, useAtividades, useAtividadesStatusResumo, useDeleteAtividade, useCancelarAtividade, useCreateAtividade, useUpdateAtividade, useAgendaMensal, useAgendaDia, useAtividadesHoje, useAtividadesVencidas, useConcluirAtividadesEmLote, useCreateAtividadesParaGestores } from '@/hooks/useAtividades';
import { useSuperAdminIds } from '@/hooks/useSuperAdminIds';
import { useGestoresProduto } from '@/hooks/useGestores';
import { useEmpreendimentos } from '@/hooks/useEmpreendimentos';
import { useClientes } from '@/hooks/useClientes';
import type { AtividadeFormSubmitData } from '@/components/atividades/AtividadeForm';
import type { Atividade, AtividadeFilters, AtividadeTipo, AtividadeStatus } from '@/types/atividades.types';
import { ATIVIDADE_TIPO_LABELS, ATIVIDADE_STATUS_LABELS } from '@/types/atividades.types';
import { cn } from '@/lib/utils';
import { Shield } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const TIPO_ICONS: Record<AtividadeTipo, typeof Phone> = {
  ligacao: Phone,
  meeting: Video,
  reuniao: Users,
  visita: MapPin,
  atendimento: Headphones,
  fechamento: Handshake,
  assinatura: PenTool,
  acompanhamento: PackageCheck,
  treinamento: GraduationCap,
  administrativa: Briefcase,
};

const STATUS_COLORS: Record<AtividadeStatus, string> = {
  pendente: 'bg-accent text-accent-foreground border-border',
  concluida: 'bg-primary/10 text-primary border-primary/20',
  cancelada: 'bg-muted text-muted-foreground border-border',
};

const TIPO_COLORS: Record<AtividadeTipo, string> = {
  ligacao: 'bg-secondary text-secondary-foreground border-border',
  meeting: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  reuniao: 'bg-primary/10 text-primary border-primary/20',
  visita: 'bg-accent text-accent-foreground border-border',
  atendimento: 'bg-muted text-foreground border-border',
  fechamento: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  assinatura: 'bg-teal-100 text-teal-800 border-teal-200',
  acompanhamento: 'bg-sky-100 text-sky-800 border-sky-200',
  treinamento: 'bg-amber-100 text-amber-800 border-amber-200',
  administrativa: 'bg-slate-100 text-slate-800 border-slate-200',
};

export default function Atividades() {
  const [view, setView] = useState<'lista' | 'calendario' | 'pendencias'>('lista');
  const [filters, setFilters] = useState<AtividadeFilters>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAtividade, setEditingAtividade] = useState<Atividade | null>(null);
  const [concluirDialogOpen, setConcluirDialogOpen] = useState(false);
  const [selectedAtividade, setSelectedAtividade] = useState<Atividade | null>(null);
  const [cancelarDialogOpen, setCancelarDialogOpen] = useState(false);
  const [atividadeParaCancelar, setAtividadeParaCancelar] = useState<Atividade | null>(null);
  const [detalheDialogOpen, setDetalheDialogOpen] = useState(false);
  const [detalheAtividadeId, setDetalheAtividadeId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const ano = currentDate.getFullYear();
  const mes = currentDate.getMonth() + 1;

  const { data: atividadesData, isLoading } = useAtividades({ filters, page, pageSize });
  const atividades = atividadesData?.items || [];
  const totalPages = atividadesData?.totalPages || 1;
  const totalItems = atividadesData?.count || 0;

  const { data: resumoStatus } = useAtividadesStatusResumo({ filters });
  const { data: atividadesMes, isLoading: isLoadingMes } = useAgendaMensal(ano, mes, undefined, filters);
  const { data: atividadesDia } = useAgendaDia(selectedDate);
  const { data: atividadesHoje } = useAtividadesHoje(filters);
  const { data: atividadesVencidas, isLoading: isLoadingVencidas } = useAtividadesVencidas();
  const { data: gestores } = useGestoresProduto();
  const { data: empreendimentos } = useEmpreendimentos();
  const { data: clientes } = useClientes();
  const { data: superAdminIds } = useSuperAdminIds();
  const createAtividade = useCreateAtividade();
  const createAtividadesParaGestores = useCreateAtividadesParaGestores();
  const updateAtividade = useUpdateAtividade();
  const deleteAtividade = useDeleteAtividade();
  const cancelarAtividade = useCancelarAtividade();
  const concluirEmLote = useConcluirAtividadesEmLote();

  const { data: detalheAtividade, isLoading: isLoadingDetalheAtividade } = useAtividade(detalheAtividadeId ?? undefined);

  // Resetar paginação ao mudar filtros / tamanho da página
  useEffect(() => {
    setPage(1);
    setSelectedIds(new Set());
  }, [filters, pageSize]);

  const hojeDateOnly = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const isAtrasada = (atividade: Atividade) => {
    if (atividade.status !== 'pendente') return false;
    if (!atividade.deadline_date) return false;
    const prazo = new Date(`${atividade.deadline_date}T00:00:00`);
    prazo.setHours(0, 0, 0, 0);
    return prazo < hojeDateOnly;
  };

  // Atividades pendentes para seleção
  const atividadesPendentes = atividades?.filter(a => a.status === 'pendente') || [];

  const handleNova = () => {
    setEditingAtividade(null);
    setDialogOpen(true);
  };

  const handleEdit = (atividade: Atividade) => {
    if (atividade.status === 'pendente') {
      setEditingAtividade(atividade);
      setDialogOpen(true);
    } else {
      setDetalheAtividadeId(atividade.id);
      setDetalheDialogOpen(true);
    }
  };

  const handleOpenDetalheById = (id: string) => {
    setDetalheAtividadeId(id);
    setDetalheDialogOpen(true);
  };

  const handleConcluir = (atividade: Atividade) => {
    setSelectedAtividade(atividade);
    setConcluirDialogOpen(true);
  };

  const handleDelete = (id: string) => deleteAtividade.mutate(id);
  
  const handleCancelar = (atividade: Atividade) => {
    setAtividadeParaCancelar(atividade);
    setCancelarDialogOpen(true);
  };

  const handleConfirmCancelamento = (motivo: string) => {
    if (!atividadeParaCancelar) return;
    cancelarAtividade.mutate(
      { id: atividadeParaCancelar.id, motivo },
      {
        onSuccess: () => {
          setCancelarDialogOpen(false);
          setAtividadeParaCancelar(null);
        }
      }
    );
  };

  const handleAtividadeSubmit: (data: AtividadeFormSubmitData) => void = (data) => {
    if (editingAtividade) {
      // Na edição, sempre usa o formData normal
      updateAtividade.mutate({ id: editingAtividade.id, data: data.formData }, {
        onSuccess: () => {
          setDialogOpen(false);
          setEditingAtividade(null);
        }
      });
    } else {
      // Na criação, verifica se tem gestorIds (múltiplos gestores)
      if (data.gestorIds && data.gestorIds.length > 0) {
        createAtividadesParaGestores.mutate(
          { formData: data.formData, gestorIds: data.gestorIds },
          {
            onSuccess: () => {
              setDialogOpen(false);
            }
          }
        );
      } else {
        createAtividade.mutate(data.formData, {
          onSuccess: () => {
            setDialogOpen(false);
          }
        });
      }
    }
  };

  const handleConcluirSuccess = () => {
    setConcluirDialogOpen(false);
    setSelectedAtividade(null);
  };

  const handleMonthChange = (year: number, month: number) => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  // Seleção em lote
  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === atividadesPendentes.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(atividadesPendentes.map(a => a.id)));
    }
  };

  const handleConcluirEmLote = () => {
    if (selectedIds.size === 0) return;
    concluirEmLote.mutate(Array.from(selectedIds), {
      onSuccess: () => {
        setSelectedIds(new Set());
      }
    });
  };

  return (
    <MainLayout title="Atividades" subtitle="Gerencie as atividades comerciais">
      <div className="space-y-6">
        {/* Header com toggle de visualização */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={view} onValueChange={(v) => setView(v as 'lista' | 'calendario' | 'pendencias')}>
            <TabsList>
              <TabsTrigger value="lista" className="gap-2">
                <List className="h-4 w-4" />
                <span className="hidden sm:inline">Lista</span>
              </TabsTrigger>
              <TabsTrigger value="calendario" className="gap-2">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Calendário</span>
              </TabsTrigger>
              <TabsTrigger value="pendencias" className="gap-2 relative">
                <AlertCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Pendências</span>
                {(atividadesVencidas?.length || 0) > 0 && (
                  <Badge variant="destructive" className="ml-1 h-5 min-w-5 px-1.5 text-[10px]">
                    {atividadesVencidas?.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex gap-2">
            {selectedIds.size > 0 && (
              <Button 
                variant="outline" 
                onClick={handleConcluirEmLote}
                disabled={concluirEmLote.isPending}
                className="text-primary border-primary/30 hover:bg-primary/10"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Concluir {selectedIds.size} selecionada(s)
              </Button>
            )}
            <Button onClick={handleNova} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              <span className="sm:hidden">Nova</span>
              <span className="hidden sm:inline">Nova Atividade</span>
            </Button>
          </div>
        </div>

        {/* Resumo (visível em lista e calendário) */}
        {view !== 'pendencias' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Atividades Hoje</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{atividadesHoje?.length || 0}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Este Mês</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{atividadesMes?.length || 0}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* View: Pendências */}
        {view === 'pendencias' && (
          <PendenciasTab
            atividades={atividadesVencidas || []}
            isLoading={isLoadingVencidas}
            onAtividadeClick={handleOpenDetalheById}
            onConcluir={handleConcluir}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onToggleSelectAll={() => {
              const pendenciasIds = (atividadesVencidas || []).map(a => a.id);
              if (selectedIds.size === pendenciasIds.length && pendenciasIds.every(id => selectedIds.has(id))) {
                setSelectedIds(new Set());
              } else {
                setSelectedIds(new Set(pendenciasIds));
              }
            }}
          />
        )}

        {/* View: Lista */}
        {view === 'lista' && (
          <>
            {/* Filtros */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Filtros</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-8 gap-4">
                  <Select value={filters.tipo || ''} onValueChange={(v) => setFilters({ ...filters, tipo: v === 'all' ? undefined : v as AtividadeTipo })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {Object.entries(ATIVIDADE_TIPO_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filters.status || ''} onValueChange={(v) => setFilters({ ...filters, status: v === 'all' ? undefined : v as AtividadeStatus })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {Object.entries(ATIVIDADE_STATUS_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filters.responsavel_id || ''} onValueChange={(v) => setFilters({ ...filters, responsavel_id: v === 'all' ? undefined : v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Responsável" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {gestores?.map((g) => (
                        <SelectItem key={g.id} value={g.id}>{g.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filters.created_by || ''} onValueChange={(v) => setFilters({ ...filters, created_by: v === 'all' ? undefined : v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Criado por" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {gestores?.map((g) => (
                        <SelectItem key={g.id} value={g.id}>{g.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filters.empreendimento_id || ''} onValueChange={(v) => setFilters({ ...filters, empreendimento_id: v === 'all' ? undefined : v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Empreendimento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {empreendimentos?.map((e) => (
                        <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filters.cliente_id || ''} onValueChange={(v) => setFilters({ ...filters, cliente_id: v === 'all' ? undefined : v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {clientes?.slice(0, 50).map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    type="date"
                    value={filters.data_inicio || ''}
                    onChange={(e) => setFilters({ ...filters, data_inicio: e.target.value || undefined })}
                    placeholder="Data início"
                  />

                  <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Itens" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="20">20 / pág</SelectItem>
                      <SelectItem value="50">50 / pág</SelectItem>
                      <SelectItem value="100">100 / pág</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Resumo por status (total filtrado) */}
            <Card>
              <CardContent className="py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className={cn('border', STATUS_COLORS.pendente)}>
                    Pendentes: {resumoStatus?.pendente ?? 0}
                  </Badge>
                  <Badge variant="outline" className={cn('border', STATUS_COLORS.concluida)}>
                    Concluídas: {resumoStatus?.concluida ?? 0}
                  </Badge>
                  <Badge variant="outline" className={cn('border', STATUS_COLORS.cancelada)}>
                    Canceladas: {resumoStatus?.cancelada ?? 0}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Total: {resumoStatus?.total ?? totalItems}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Lista - Mobile Card View */}
            <div className="md:hidden space-y-3">
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
                </div>
              ) : atividades?.length === 0 ? (
                <Card className="p-6 text-center text-muted-foreground">
                  Nenhuma atividade encontrada
                </Card>
              ) : (
                atividades?.map((atividade) => {
                  const TipoIcon = TIPO_ICONS[atividade.tipo];
                  const isVencida = atividade.status === 'pendente' && new Date(atividade.data_fim) < new Date();
                  const atrasada = isAtrasada(atividade);
                  const isSelected = selectedIds.has(atividade.id);
                  return (
                    <Card
                      key={atividade.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleOpenDetalheById(atividade.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') handleOpenDetalheById(atividade.id);
                      }}
                      className={cn(
                        'p-4 cursor-pointer transition-colors hover:bg-muted/30',
                        isVencida && 'border-destructive',
                        isSelected && 'ring-2 ring-primary'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        {atividade.status === 'pendente' && (
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSelect(atividade.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="mt-1"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <Badge variant="outline" className={TIPO_COLORS[atividade.tipo]}>
                              <TipoIcon className="h-3 w-3 mr-1" />
                              {ATIVIDADE_TIPO_LABELS[atividade.tipo]}
                            </Badge>
                            <Badge variant="outline" className={STATUS_COLORS[atividade.status]}>
                              {ATIVIDADE_STATUS_LABELS[atividade.status]}
                            </Badge>
                            {atrasada && (
                              <Badge variant="outline" className="border-destructive text-destructive">
                                Atrasada
                              </Badge>
                            )}
                          </div>
                          <h4 className="font-normal text-sm truncate">{atividade.titulo}</h4>
                          <p className="text-xs text-muted-foreground truncate">
                            {atividade.cliente?.nome || 'Sem cliente'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {atividade.data_inicio === atividade.data_fim 
                              ? format(new Date(`${atividade.data_inicio}T00:00:00`), "dd/MM/yyyy", { locale: ptBR })
                              : `${format(new Date(`${atividade.data_inicio}T00:00:00`), "dd/MM", { locale: ptBR })} - ${format(new Date(`${atividade.data_fim}T00:00:00`), "dd/MM/yyyy", { locale: ptBR })}`
                            }
                          </p>
                          {atividade.deadline_date && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Prazo: {format(new Date(`${atividade.deadline_date}T00:00:00`), 'dd/MM/yyyy', { locale: ptBR })}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col gap-1">
                          {atividade.status === 'pendente' && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleConcluir(atividade);
                                }}
                                title="Concluir"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCancelar(atividade);
                                }}
                                title="Cancelar"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(atividade);
                                }}
                                title="Editar"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Excluir"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir esta atividade? Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(atividade.id)}>
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>

            {/* Lista - Desktop Table View */}
            <Card className="hidden md:block">
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-6 space-y-4">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={atividadesPendentes.length > 0 && selectedIds.size === atividadesPendentes.length}
                            onCheckedChange={toggleSelectAll}
                            aria-label="Selecionar todas"
                          />
                        </TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Título</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead className="hidden lg:table-cell">Corretor</TableHead>
                        <TableHead className="hidden lg:table-cell">Gestor</TableHead>
                        <TableHead>Data/Hora</TableHead>
                        <TableHead>Prazo</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {atividades?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                            Nenhuma atividade encontrada
                          </TableCell>
                        </TableRow>
                      ) : (
                        atividades?.map((atividade) => {
                          const TipoIcon = TIPO_ICONS[atividade.tipo];
                          const isVencida = atividade.status === 'pendente' && new Date(atividade.data_fim) < new Date();
                          const atrasada = isAtrasada(atividade);
                          const isSelected = selectedIds.has(atividade.id);
                          const isSACreated = !!(atividade.created_by && superAdminIds?.has(atividade.created_by));
                          return (
                            <TableRow
                              key={atividade.id}
                              role="button"
                              tabIndex={0}
                              onClick={() => handleOpenDetalheById(atividade.id)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') handleOpenDetalheById(atividade.id);
                              }}
                              className={cn(
                                'cursor-pointer',
                                isVencida && 'bg-destructive/5',
                                isSelected && 'bg-primary/5',
                                isSACreated && 'bg-amber-500/5 border-l-2 border-l-amber-500'
                              )}
                            >
                              <TableCell>
                                {atividade.status === 'pendente' && (
                                  <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={() => toggleSelect(atividade.id)}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={TIPO_COLORS[atividade.tipo]}>
                                  <TipoIcon className="h-3 w-3 mr-1" />
                                  {ATIVIDADE_TIPO_LABELS[atividade.tipo]}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-normal">
                                <div className="flex items-center gap-1.5">
                                  {atividade.titulo}
                                  {isSACreated && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Shield className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                      </TooltipTrigger>
                                      <TooltipContent>Criada por Super Admin</TooltipContent>
                                    </Tooltip>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>{atividade.cliente?.nome || '-'}</TableCell>
                              <TableCell className="hidden lg:table-cell">{atividade.corretor?.nome_completo || '-'}</TableCell>
                              <TableCell className="hidden lg:table-cell">{atividade.gestor?.full_name || '-'}</TableCell>
                              <TableCell>
                                {atividade.data_inicio === atividade.data_fim 
                                  ? format(new Date(`${atividade.data_inicio}T00:00:00`), "dd/MM/yyyy", { locale: ptBR })
                                  : `${format(new Date(`${atividade.data_inicio}T00:00:00`), "dd/MM", { locale: ptBR })} - ${format(new Date(`${atividade.data_fim}T00:00:00`), "dd/MM/yyyy", { locale: ptBR })}`
                                }
                              </TableCell>
                              <TableCell>
                                {atividade.deadline_date ? (
                                  <div className="flex items-center gap-2">
                                    <span>
                                      {format(new Date(`${atividade.deadline_date}T00:00:00`), 'dd/MM/yyyy', { locale: ptBR })}
                                    </span>
                                    {atrasada && (
                                      <Badge variant="outline" className="border-destructive text-destructive">
                                        Atrasada
                                      </Badge>
                                    )}
                                  </div>
                                ) : (
                                  '-'
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={STATUS_COLORS[atividade.status]}>
                                  {ATIVIDADE_STATUS_LABELS[atividade.status]}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  {atividade.status === 'pendente' && (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleConcluir(atividade);
                                        }}
                                        title="Concluir"
                                      >
                                        <CheckCircle className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleCancelar(atividade);
                                        }}
                                        title="Cancelar"
                                      >
                                        <XCircle className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleEdit(atividade);
                                        }}
                                        title="Editar"
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                    </>
                                  )}
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        title="Excluir"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Tem certeza que deseja excluir esta atividade? Esta ação não pode ser desfeita.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDelete(atividade.id)}>
                                          Excluir
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Paginação (lista) */}
            {!isLoading && atividades.length > 0 && (
              <PaginationControls
                page={page}
                totalPages={totalPages}
                totalItems={totalItems}
                onPageChange={setPage}
              />
            )}
          </>
        )}

        {/* View: Calendário */}
        {view === 'calendario' && (
          <div className="relative">
            {/* 
              No desktop, o painel do dia fica SOBREPOSTO (fixed) para não forçar a altura do grid
              e não criar o "vazio" abaixo do calendário. Reservamos espaço com padding-right.
            */}
            <div className="grid grid-cols-1 gap-6 items-start lg:pr-[444px]">
              {/* Calendário */}
              <div>
                {isLoadingMes ? (
                  <Card>
                    <CardContent className="pt-6">
                      <Skeleton className="h-[400px] w-full" />
                    </CardContent>
                  </Card>
                ) : (
                  <AgendaCalendario
                    atividades={atividadesMes || []}
                    selectedDate={selectedDate}
                    onDateSelect={setSelectedDate}
                    onMonthChange={handleMonthChange}
                  />
                )}
              </div>

              {/* Mobile/Tablet: painel no fluxo (abaixo) */}
              <div className="lg:hidden">
                <div className="max-h-[70vh] min-h-0 overflow-hidden">
                  <AgendaDia
                    data={selectedDate}
                    atividades={atividadesDia || []}
                    onAtividadeClick={handleEdit}
                    onNovaAtividade={handleNova}
                  />
                </div>
              </div>
            </div>

            {/* Desktop: painel sobreposto (alinhado à altura do calendário) */}
            <div className="hidden lg:block lg:absolute lg:right-0 lg:top-0 lg:bottom-0 lg:w-[420px] z-20">
              <AgendaDia
                data={selectedDate}
                atividades={atividadesDia || []}
                onAtividadeClick={handleEdit}
                onNovaAtividade={handleNova}
                className="h-full"
              />
            </div>
          </div>
        )}

        {/* VencidasCard agora está nos cards de resumo no topo */}
      </div>

      {/* Dialog Nova/Editar Atividade */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>{editingAtividade ? 'Editar Atividade' : 'Nova Atividade'}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto -mx-6 px-6">
            <AtividadeForm 
              initialData={editingAtividade || undefined} 
              onSubmit={handleAtividadeSubmit}
              isLoading={createAtividade.isPending || updateAtividade.isPending}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Concluir Atividade */}
      <ConcluirAtividadeDialog
        atividade={selectedAtividade}
        open={concluirDialogOpen}
        onOpenChange={setConcluirDialogOpen}
        onSuccess={handleConcluirSuccess}
      />

      {/* Dialog Cancelar Atividade */}
      <CancelarAtividadeDialog
        open={cancelarDialogOpen}
        onOpenChange={(open) => {
          setCancelarDialogOpen(open);
          if (!open) setAtividadeParaCancelar(null);
        }}
        atividadeTitulo={atividadeParaCancelar?.titulo}
        onConfirm={handleConfirmCancelamento}
        isLoading={cancelarAtividade.isPending}
      />

      {/* Dialog Detalhe Atividade */}
      <AtividadeDetalheDialog
        atividade={detalheAtividade}
        open={detalheDialogOpen}
        loading={isLoadingDetalheAtividade}
        onOpenChange={(open) => {
          setDetalheDialogOpen(open);
          if (!open) setDetalheAtividadeId(null);
        }}
      />
    </MainLayout>
  );
}
