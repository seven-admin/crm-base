import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useCorretoresPaginated, useCorretores } from '@/hooks/useCorretores';
import { useImobiliarias } from '@/hooks/useImobiliarias';
import { usePermissions } from '@/hooks/usePermissions';
import { CorretorForm } from '@/components/mercado/CorretorForm';
import { Corretor, CorretorFormData } from '@/types/mercado.types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { Plus, Search, Pencil, KeyRound, Download, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function Corretores() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [imobiliariaFilter, setImobiliariaFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCorretor, setEditingCorretor] = useState<Corretor | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [corretorParaExcluir, setCorretorParaExcluir] = useState<Corretor | null>(null);
  const [vinculosInfo, setVinculosInfo] = useState<{ negociacoes: number } | null>(null);

  const { data, isLoading } = useCorretoresPaginated(
    page, 20,
    searchDebounced || undefined,
    imobiliariaFilter !== 'all' ? imobiliariaFilter : undefined
  );
  const { create, update, delete: deleteCorretor, isCreating, isUpdating, isDeleting } = useCorretores();
  const { imobiliarias } = useImobiliarias();
  const { canAccessModule } = usePermissions();

  const handleSearch = (value: string) => {
    setSearch(value);
    // Simple debounce via timeout
    setTimeout(() => {
      setSearchDebounced(value);
      setPage(1);
    }, 400);
  };

  const handleCreate = () => {
    setEditingCorretor(undefined);
    setDialogOpen(true);
  };

  const handleEdit = (corretor: Corretor) => {
    setEditingCorretor(corretor);
    setDialogOpen(true);
  };

  const handleSubmit = (formData: CorretorFormData) => {
    if (editingCorretor) {
      update({ id: editingCorretor.id, ...formData }, {
        onSuccess: () => setDialogOpen(false),
      });
    } else {
      create(formData, {
        onSuccess: () => setDialogOpen(false),
      });
    }
  };

  const handleDeleteClick = async (corretor: Corretor) => {
    setCorretorParaExcluir(corretor);
    // Pre-check for linked negotiations
    const { count } = await supabase
      .from('negociacoes')
      .select('id', { count: 'exact', head: true })
      .eq('corretor_id', corretor.id);
    setVinculosInfo({ negociacoes: count || 0 });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!corretorParaExcluir) return;
    
    try {
      // Se tem user_id, excluir conta de usuário primeiro
      if (corretorParaExcluir.user_id) {
        const { error } = await supabase.functions.invoke('delete-user', {
          body: { user_id: corretorParaExcluir.user_id },
        });
        if (error) {
          const errorBody = await error.context?.json?.().catch(() => null);
          toast.error(errorBody?.error || 'Erro ao excluir conta de usuário');
          return;
        }
      }

      deleteCorretor(corretorParaExcluir.id, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['corretores-usuarios'] });
          queryClient.invalidateQueries({ queryKey: ['profiles'] });
        },
      });
      setDeleteDialogOpen(false);
      setCorretorParaExcluir(null);
    } catch (err) {
      toast.error('Erro inesperado ao excluir corretor');
    }
  };

  const corretores = data?.corretores || [];
  const totalPages = data?.totalPages || 1;
  const total = data?.total || 0;

  const handleExport = async () => {
    const { data: allCorretores } = await supabase
      .from('corretores')
      .select('nome_completo, cpf, creci, email, telefone, is_active, user_id, imobiliaria:imobiliarias(nome)')
      .order('nome_completo');
    if (!allCorretores) return;
    const rows = allCorretores.map((c: any) => ({
      Nome: c.nome_completo,
      CPF: c.cpf || '',
      CRECI: c.creci || '',
      Email: c.email || '',
      Telefone: c.telefone || '',
      Imobiliária: c.imobiliaria?.nome || '',
      Status: c.is_active ? 'Ativo' : 'Inativo',
      'Com Acesso': c.user_id ? 'Sim' : 'Não',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Corretores');
    XLSX.writeFile(wb, 'corretores.xlsx');
  };

  return (
    <MainLayout title="Corretores" subtitle="Gestão de corretores parceiros">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, CPF ou email..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={imobiliariaFilter} onValueChange={(v) => { setImobiliariaFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-[220px]">
            <SelectValue placeholder="Todas imobiliárias" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas imobiliárias</SelectItem>
            {imobiliarias.map(i => (
              <SelectItem key={i.id} value={i.id}>{i.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Corretor
        </Button>
      </div>

      {/* Summary */}
      <p className="text-sm text-muted-foreground mb-3">{total} corretores cadastrados</p>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>CPF</TableHead>
              <TableHead>CRECI</TableHead>
              <TableHead>Imobiliária</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Acesso</TableHead>
              <TableHead className="w-[100px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : corretores.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Nenhum corretor encontrado
                </TableCell>
              </TableRow>
            ) : (
              corretores.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.nome_completo}</TableCell>
                  <TableCell className="text-muted-foreground">{c.cpf || '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{c.creci || '—'}</TableCell>
                  <TableCell>{c.imobiliaria?.nome || '—'}</TableCell>
                  <TableCell>
                    <Badge variant={c.is_active ? 'default' : 'secondary'}>
                      {c.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {c.user_id ? (
                      <Badge variant="outline" className="gap-1">
                        <KeyRound className="h-3 w-3" />
                        Com acesso
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">Sem conta</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(c)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {canAccessModule('corretores', 'delete') && (
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(c)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <PaginationControls
        page={page}
        totalPages={totalPages}
        totalItems={total}
        onPageChange={setPage}
      />

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCorretor ? 'Editar Corretor' : 'Novo Corretor'}</DialogTitle>
          </DialogHeader>
          <CorretorForm
            initialData={editingCorretor}
            onSubmit={handleSubmit}
            isLoading={isCreating || isUpdating}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir corretor</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span>Tem certeza que deseja excluir o corretor <strong>{corretorParaExcluir?.nome_completo}</strong>?</span>
              {vinculosInfo && vinculosInfo.negociacoes > 0 && (
                <span className="block text-destructive">
                  ⚠️ Este corretor possui {vinculosInfo.negociacoes} negociação(ões) vinculada(s). A exclusão pode falhar caso existam restrições no banco de dados.
                </span>
              )}
              {corretorParaExcluir?.user_id && (
                <span className="block text-destructive font-medium">
                  ⚠️ A conta de acesso ao sistema também será removida permanentemente.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
