import { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Building, Phone, Mail, MapPin, Users, Trash2, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// Card import removed - using standard table layout
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useImobiliarias, useImobiliaria, useImobiliariasPaginated } from '@/hooks/useImobiliarias';
import { usePermissions } from '@/hooks/usePermissions';
import { ImobiliariaForm } from '@/components/mercado/ImobiliariaForm';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { Imobiliaria } from '@/types/mercado.types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

export default function Imobiliarias() {
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingImobiliariaId, setEditingImobiliariaId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [imobiliariaParaExcluir, setImobiliariaParaExcluir] = useState<Pick<Imobiliaria, 'id' | 'nome'> | null>(null);
  const [isCheckingDelete, setIsCheckingDelete] = useState(false);
  const [deleteCheck, setDeleteCheck] = useState<{ negociacoes: number; corretores: number } | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { createAsync, updateAsync, delete: deleteImobiliaria, isCreating, isUpdating, isDeleting } = useImobiliarias();
  const { data, isLoading } = useImobiliariasPaginated(page, 20, search || undefined);
  const { data: imobiliariaDetalhe, isLoading: isLoadingImobiliaria } = useImobiliaria(editingImobiliariaId || undefined);
  const { canAccessModule } = usePermissions();
  
  const imobiliarias = data?.imobiliarias || [];
  const totalPages = data?.totalPages || 1;
  const total = data?.total || 0;
  
  const canCreate = canAccessModule('imobiliarias', 'create');
  const canEdit = canAccessModule('imobiliarias', 'edit');
  const canDelete = canAccessModule('imobiliarias', 'delete');

  const handleExport = async () => {
    const { data } = await supabase
      .from('imobiliarias')
      .select('nome, cnpj, gestor_nome, gestor_email, gestor_telefone, telefone, email, endereco_cidade, endereco_uf, is_active')
      .order('nome');
    if (!data) return;
    const rows = data.map((r) => ({
      Nome: r.nome,
      CNPJ: r.cnpj || '',
      Gestor: r.gestor_nome || '',
      'Email Gestor': r.gestor_email || '',
      'Telefone Gestor': r.gestor_telefone || '',
      Telefone: r.telefone || '',
      Email: r.email || '',
      Cidade: r.endereco_cidade || '',
      UF: r.endereco_uf || '',
      Status: r.is_active ? 'Ativo' : 'Inativo',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Imobiliarias');
    XLSX.writeFile(wb, 'imobiliarias.xlsx');
  };

  const handleSubmit = async (data: any) => {
    const { gestor_criar_acesso, ...formData } = data;
    
    let imobiliariaId = editingImobiliariaId;

    try {
      if (editingImobiliariaId) {
        await updateAsync({ ...formData, id: editingImobiliariaId });
      } else {
        const created = await createAsync(formData);
        imobiliariaId = created?.id || null;
      }
    } catch {
      // Toast de erro já é exibido pelo hook
      handleDialogOpenChange(false);
      return;
    }

    handleDialogOpenChange(false);

    // Criar acesso do gestor após salvar a imobiliária
    if (gestor_criar_acesso && formData.gestor_email && formData.gestor_nome && imobiliariaId) {
      try {
        const { data: result, error } = await supabase.functions.invoke('create-user', {
          body: {
            email: formData.gestor_email,
            full_name: formData.gestor_nome,
            role: 'gestor_imobiliaria'
          }
        });

        if (error) {
          let msg = error.message;
          try {
            const body = await (error as any).context?.json();
            if (body?.error) msg = body.error;
          } catch {}
          throw new Error(msg);
        }
        if (result?.error) throw new Error(result.error);

        // Vincular user_id na imobiliária automaticamente
        if (result?.user_id) {
          await supabase
            .from('imobiliarias')
            .update({ user_id: result.user_id })
            .eq('id', imobiliariaId);
        }

        toast({
          title: 'Acesso do gestor criado!',
          description: `Login criado para ${formData.gestor_nome}. Senha padrão: Seven@1234`,
        });

        queryClient.invalidateQueries({ queryKey: ['imobiliarias'] });
        queryClient.invalidateQueries({ queryKey: ['imobiliarias-paginated'] });
      } catch (err: any) {
        toast({
          title: 'Imobiliária salva, mas erro ao criar acesso do gestor',
          description: err.message || 'Erro desconhecido',
          variant: 'destructive',
        });
      }
    }
  };

  const handleEdit = (imobiliaria: Imobiliaria) => {
    setEditingImobiliariaId(imobiliaria.id);
    setIsDialogOpen(true);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingImobiliariaId(null);
    }
  };

  const handleOpenDelete = (imob: Imobiliaria) => {
    setImobiliariaParaExcluir({ id: imob.id, nome: imob.nome });
    setDeleteDialogOpen(true);
  };

  const shouldShowUnlinkLabel = useMemo(() => {
    return (deleteCheck?.negociacoes ?? 0) > 0;
  }, [deleteCheck]);

  useEffect(() => {
    const run = async () => {
      if (!deleteDialogOpen || !imobiliariaParaExcluir?.id) return;

      setIsCheckingDelete(true);
      setDeleteCheck(null);
      try {
        const [negRes, corRes] = await Promise.all([
          supabase
            .from('negociacoes')
            .select('id', { count: 'exact', head: true })
            .eq('imobiliaria_id', imobiliariaParaExcluir.id),
          supabase
            .from('corretores')
            .select('id', { count: 'exact', head: true })
            .eq('imobiliaria_id', imobiliariaParaExcluir.id),
        ]);

        if (negRes.error) throw negRes.error;
        if (corRes.error) throw corRes.error;

        setDeleteCheck({
          negociacoes: negRes.count ?? 0,
          corretores: corRes.count ?? 0,
        });
      } catch (err: any) {
        toast({
          title: 'Erro ao validar exclusão',
          description: err?.message || 'Não foi possível checar vínculos desta imobiliária.',
          variant: 'destructive',
        });
      } finally {
        setIsCheckingDelete(false);
      }
    };

    run();
  }, [deleteDialogOpen, imobiliariaParaExcluir?.id, toast]);

  return (
    <MainLayout title="Imobiliárias" subtitle="Gestão de imobiliárias parceiras">
      <div className="space-y-6">
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          {canCreate && (
            <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Imobiliária
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingImobiliariaId ? 'Editar Imobiliária' : 'Nova Imobiliária'}
                  </DialogTitle>
                </DialogHeader>
                {editingImobiliariaId && isLoadingImobiliaria ? (
                  <div className="space-y-4 py-4">
                    <Skeleton className="h-10 w-full" />
                    <div className="grid grid-cols-2 gap-4">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : (
                  <ImobiliariaForm
                    initialData={imobiliariaDetalhe || undefined}
                    onSubmit={handleSubmit}
                    isLoading={isCreating || isUpdating}
                  />
                )}
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, CNPJ ou cidade..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {total} imobiliária{total !== 1 ? 's' : ''}
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Carregando...</div>
        ) : imobiliarias.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma imobiliária encontrada
          </div>
        ) : (
          <>
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Imobiliária</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Cidade</TableHead>
                    <TableHead>Corretores</TableHead>
                    <TableHead>Status</TableHead>
                    {canDelete && <TableHead className="w-[60px]"></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {imobiliarias.map((imob) => (
                    <TableRow 
                      key={imob.id}
                      className={canEdit ? "cursor-pointer hover:bg-muted/50" : ""}
                      onClick={() => canEdit && handleEdit(imob)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Building className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{imob.nome}</p>
                            {imob.cnpj && (
                              <p className="text-sm text-muted-foreground">{imob.cnpj}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {imob.telefone && (
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3" />
                              {imob.telefone}
                            </div>
                          )}
                          {imob.email && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {imob.email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {imob.endereco_cidade && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            {imob.endereco_cidade}/{imob.endereco_uf}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{imob.corretores_count || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={imob.is_active ? 'default' : 'secondary'}>
                          {imob.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      {canDelete && (
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" onClick={() => handleOpenDelete(imob)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            <PaginationControls
              page={page}
              totalPages={totalPages}
              totalItems={total}
              onPageChange={setPage}
            />
          </>
        )}

        {canDelete && (
          <AlertDialog
            open={deleteDialogOpen}
            onOpenChange={(open) => {
              setDeleteDialogOpen(open);
              if (!open) {
                setImobiliariaParaExcluir(null);
                setDeleteCheck(null);
                setIsCheckingDelete(false);
              }
            }}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir imobiliária?</AlertDialogTitle>
                <AlertDialogDescription>
                  {isCheckingDelete ? (
                    <div className="space-y-2 pt-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p>
                        Esta ação não pode ser desfeita. Corretores vinculados perderão o vínculo.
                      </p>
                      {deleteCheck && deleteCheck.negociacoes > 0 && (
                        <p className="font-medium text-foreground">
                          Existem {deleteCheck.negociacoes} negociação(ões) vinculada(s) (incluindo inativas). Para excluir, a ação fará o
                          desvínculo dessas negociações.
                        </p>
                      )}
                      {deleteCheck && deleteCheck.corretores > 0 && (
                        <p className="text-muted-foreground">
                          Corretores vinculados: {deleteCheck.corretores}.
                        </p>
                      )}
                    </div>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  disabled={isCheckingDelete || !imobiliariaParaExcluir?.id || isDeleting}
                  onClick={() => {
                    if (!imobiliariaParaExcluir?.id) return;
                    deleteImobiliaria(imobiliariaParaExcluir.id);
                    setDeleteDialogOpen(false);
                  }}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  {shouldShowUnlinkLabel ? 'Desvincular e excluir' : 'Excluir'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </MainLayout>
  );
}
