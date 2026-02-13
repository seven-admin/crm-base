import { useState, useEffect, useCallback } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useClientesPaginated, useDeleteCliente, useCreateCliente, useUpdateCliente, useClienteStats, useQualificarCliente, useMarcarPerdido, useReativarCliente, useCliente, useUpdateClientesEmLote } from '@/hooks/useClientes';
import { useGestoresProduto } from '@/hooks/useGestores';
import { Cliente, ClienteFormData, ClienteFase, ClienteTemperatura } from '@/types/clientes.types';
import { perf } from '@/lib/perf';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIsMobile } from '@/hooks/use-mobile';
import { ClienteForm } from '@/components/clientes/ClienteForm';
import { ClienteInteracoesDialog } from '@/components/clientes/ClienteInteracoesDialog';
import { ClienteHistoricoAtividadesDialog } from '@/components/clientes/ClienteHistoricoAtividadesDialog';
import { ClienteQuickViewDialog } from '@/components/clientes/ClienteQuickViewDialog';
import { AcaoEmLoteDialog, AcaoEmLoteData } from '@/components/clientes/AcaoEmLoteDialog';
import { MarcarPerdidoDialog } from '@/components/clientes/MarcarPerdidoDialog';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { ClientesStats } from '@/pages/clientes/ClientesStats';
import { ClientesToolbar } from '@/pages/clientes/ClientesToolbar';
import { ClientesMobileCards } from '@/pages/clientes/ClientesMobileCards';
import { ClientesTable } from '@/pages/clientes/ClientesTable';

const Clientes = () => {
  const [search, setSearch] = useState('');
  const [selectedFase, setSelectedFase] = useState<ClienteFase | 'todos'>('todos');
  const [selectedGestor, setSelectedGestor] = useState<string>('todos');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClienteId, setEditingClienteId] = useState<string | null>(null);
  const [interacoesCliente, setInteracoesCliente] = useState<Cliente | null>(null);
  const [historicoCliente, setHistoricoCliente] = useState<Cliente | null>(null);
  const [quickViewCliente, setQuickViewCliente] = useState<Cliente | null>(null);
  const [page, setPage] = useState(1);
  
  // State for batch selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [acaoEmLoteDialogOpen, setAcaoEmLoteDialogOpen] = useState(false);
  
  // State for loss dialog
  const [perdidoDialogOpen, setPerdidoDialogOpen] = useState(false);
  const [clienteParaPerder, setClienteParaPerder] = useState<Cliente | null>(null);
  
  const { data: gestores = [] } = useGestoresProduto();
  
  const filters = {
    search: search || undefined,
    fase: selectedFase !== 'todos' ? selectedFase : undefined,
    gestor_id: selectedGestor !== 'todos' ? selectedGestor : undefined,
    page,
    pageSize: 20
  };
  
  const { data: paginatedData, isLoading } = useClientesPaginated(filters);
  const clientes = paginatedData?.clientes ?? [];
  const totalPages = paginatedData?.totalPages ?? 1;
  const total = paginatedData?.total ?? 0;
  
  const {
    data: clienteDetalhe,
    isLoading: isLoadingCliente,
    error: clienteDetalheError,
    refetch: refetchClienteDetalhe,
  } = useCliente(editingClienteId || undefined);
  const { data: stats } = useClienteStats();
  const deleteMutation = useDeleteCliente();
  const createMutation = useCreateCliente();
  const updateMutation = useUpdateCliente();
  const qualificarMutation = useQualificarCliente();
  const marcarPerdidoMutation = useMarcarPerdido();
  const reativarMutation = useReativarCliente();
  const updateEmLoteMutation = useUpdateClientesEmLote();
  const isMobile = useIsMobile();

  const handleUpdateTemperatura = useCallback((id: string, temperatura: ClienteTemperatura | null) => {
    updateMutation.mutate({ id, data: { temperatura: temperatura ?? undefined } });
  }, [updateMutation]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, selectedFase, selectedGestor]);

  // Clear selection when page/filters change
  useEffect(() => {
    setSelectedIds(new Set());
  }, [page, search, selectedFase, selectedGestor]);

  const handleDelete = async () => {
    if (selectedCliente) {
      await deleteMutation.mutateAsync(selectedCliente.id);
      setDeleteDialogOpen(false);
      setSelectedCliente(null);
    }
  };

  const handleOpenNew = useCallback(() => {
    perf.start('clientes:modal_open:new');
    setEditingClienteId(null);
    setIsDialogOpen(true);
  }, []);

  const handleEdit = useCallback((cliente: Cliente) => {
    perf.start(`clientes:modal_open:edit:${cliente.id}`, { id: cliente.id });
    setEditingClienteId(cliente.id);
    setIsDialogOpen(true);
  }, []);

  const handleDialogOpenChange = useCallback((open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingClienteId(null);
    }
  }, []);

  const handleSubmit = useCallback((data: ClienteFormData) => {
    if (editingClienteId) {
      updateMutation.mutate(
        { id: editingClienteId, data },
        { onSuccess: () => handleDialogOpenChange(false) }
      );
    } else {
      createMutation.mutate(data, { onSuccess: () => handleDialogOpenChange(false) });
    }
  }, [createMutation, editingClienteId, handleDialogOpenChange, updateMutation]);

  // Toggle individual selection
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  // Toggle select all on current page
  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.size === clientes.length) {
        return new Set();
      } else {
        return new Set(clientes.map((c) => c.id));
      }
    });
  }, [clientes]);

  // Handle batch update
  const handleAcaoEmLote = useCallback((data: AcaoEmLoteData) => {
    updateEmLoteMutation.mutate(
      { ids: Array.from(selectedIds), data },
      {
        onSuccess: () => {
          setSelectedIds(new Set());
          setAcaoEmLoteDialogOpen(false);
        }
      }
    );
  }, [selectedIds, updateEmLoteMutation]);

  // Perf mark: quando o detalhe chega e o formulário pode montar.
  useEffect(() => {
    if (!isDialogOpen || !editingClienteId) return;
    if (isLoadingCliente) return;
    if (!clienteDetalhe) return;
    perf.end(`clientes:modal_open:edit:${editingClienteId}`, {
      id: editingClienteId,
      ok: true,
      stage: 'detail_ready',
    });
  }, [clienteDetalhe, editingClienteId, isDialogOpen, isLoadingCliente]);

  return (
    <MainLayout
      title="Clientes"
      subtitle="Gerencie sua base de clientes em todas as fases"
    >
      <ClientesStats selectedFase={selectedFase} onSelectFase={setSelectedFase} stats={stats ?? null} />

      <ClientesToolbar 
        search={search} 
        onSearchChange={setSearch} 
        onNew={handleOpenNew}
        selectedCount={selectedIds.size}
        onOpenAcaoEmLote={() => setAcaoEmLoteDialogOpen(true)}
        gestorId={selectedGestor}
        onGestorChange={setSelectedGestor}
        gestores={gestores}
      />

      {/* Tabs Mobile */}
      {isMobile && (
        <Tabs value={selectedFase} onValueChange={(v) => setSelectedFase(v as ClienteFase | 'todos')} className="mb-4">
          <TabsList className="w-full overflow-x-auto">
            <TabsTrigger value="todos">Todos</TabsTrigger>
            <TabsTrigger value="prospecto">Prospectos</TabsTrigger>
            <TabsTrigger value="qualificado">Qualificados</TabsTrigger>
            <TabsTrigger value="negociando">Negociando</TabsTrigger>
            <TabsTrigger value="comprador">Compradores</TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : clientes.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {search || selectedFase !== 'todos' ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
        </div>
      ) : isMobile ? (
        <ClientesMobileCards
          clientes={clientes}
          onOpenQuickView={setQuickViewCliente}
          onOpenInteracoes={setInteracoesCliente}
          onOpenHistorico={setHistoricoCliente}
          onEdit={handleEdit}
          onDelete={(cliente) => {
            setSelectedCliente(cliente);
            setDeleteDialogOpen(true);
          }}
          onQualificar={(id) => qualificarMutation.mutate(id)}
          onMarcarPerdido={(id) => {
            const cliente = clientes.find(c => c.id === id);
            setClienteParaPerder(cliente || null);
            setPerdidoDialogOpen(true);
          }}
          onReativar={(id) => reativarMutation.mutate(id)}
          onUpdateTemperatura={handleUpdateTemperatura}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
        />
      ) : (
        <ClientesTable
          clientes={clientes}
          onOpenQuickView={setQuickViewCliente}
          onOpenInteracoes={setInteracoesCliente}
          onOpenHistorico={setHistoricoCliente}
          onEdit={handleEdit}
          onDelete={(cliente) => {
            setSelectedCliente(cliente);
            setDeleteDialogOpen(true);
          }}
          onQualificar={(id) => qualificarMutation.mutate(id)}
          onMarcarPerdido={(id) => {
            const cliente = clientes.find(c => c.id === id);
            setClienteParaPerder(cliente || null);
            setPerdidoDialogOpen(true);
          }}
          onReativar={(id) => reativarMutation.mutate(id)}
          onUpdateTemperatura={handleUpdateTemperatura}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
        />
      )}
      
      {!isLoading && clientes.length > 0 && (
        <PaginationControls
          page={page}
          totalPages={totalPages}
          totalItems={total}
          onPageChange={setPage}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Cliente</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o cliente {selectedCliente?.nome}? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>
              {editingClienteId ? 'Editar Cliente' : 'Novo Cliente'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto -mx-6 px-6">
            {editingClienteId ? (
              // Modo edição: só monta o formulário quando o detalhe estiver carregado
              isLoadingCliente || !clienteDetalhe ? (
                <div className="space-y-4 py-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Carregando cadastro completo…</span>
                  </div>

                  <Skeleton className="h-10 w-full" />
                  <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-20 w-full" />

                  {clienteDetalheError && (
                    <div className="rounded-md border bg-card p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-destructive" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Não foi possível carregar os dados do cliente</p>
                          <p className="text-sm text-muted-foreground">
                            Tente novamente. Se persistir, verifique sua conexão ou permissões.
                          </p>
                          <div className="mt-3 flex justify-end">
                            <Button type="button" variant="outline" onClick={() => refetchClienteDetalhe()}>
                              Tentar novamente
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <ClienteForm
                  initialData={clienteDetalhe}
                  onSubmit={handleSubmit}
                  isLoading={createMutation.isPending || updateMutation.isPending}
                />
              )
            ) : (
              // Modo criação
              <ClienteForm
                initialData={undefined}
                onSubmit={handleSubmit}
                isLoading={createMutation.isPending || updateMutation.isPending}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AcaoEmLoteDialog
        open={acaoEmLoteDialogOpen}
        onOpenChange={setAcaoEmLoteDialogOpen}
        selectedCount={selectedIds.size}
        onConfirm={handleAcaoEmLote}
        isLoading={updateEmLoteMutation.isPending}
      />

      <ClienteQuickViewDialog
        cliente={quickViewCliente}
        open={!!quickViewCliente}
        onOpenChange={(open) => !open && setQuickViewCliente(null)}
        onOpenFull={(cliente) => {
          setQuickViewCliente(null);
          handleEdit(cliente);
        }}
      />

      <ClienteInteracoesDialog
        cliente={interacoesCliente}
        open={!!interacoesCliente}
        onOpenChange={(open) => !open && setInteracoesCliente(null)}
      />

      <ClienteHistoricoAtividadesDialog
        cliente={historicoCliente}
        open={!!historicoCliente}
        onOpenChange={(open) => !open && setHistoricoCliente(null)}
      />

      <MarcarPerdidoDialog
        open={perdidoDialogOpen}
        onOpenChange={(open) => {
          setPerdidoDialogOpen(open);
          if (!open) setClienteParaPerder(null);
        }}
        onConfirm={(motivo) => {
          if (clienteParaPerder) {
            marcarPerdidoMutation.mutate(
              { id: clienteParaPerder.id, motivo },
              {
                onSuccess: () => {
                  setPerdidoDialogOpen(false);
                  setClienteParaPerder(null);
                }
              }
            );
          }
        }}
        isLoading={marcarPerdidoMutation.isPending}
        clienteNome={clienteParaPerder?.nome}
      />
    </MainLayout>
  );
};

export default Clientes;
