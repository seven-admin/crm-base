import { useState } from 'react';
import { Plus, Search, UserCog, Phone, Mail, Trash2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { useCorretores, useCorretor, useCorretoresPaginated } from '@/hooks/useCorretores';
import { usePermissions } from '@/hooks/usePermissions';
import { CorretorForm } from '@/components/mercado/CorretorForm';
import { Corretor } from '@/types/mercado.types';

export default function Corretores() {
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const { create, update, delete: deleteCorretor, isCreating, isUpdating } = useCorretores();
  const { data, isLoading } = useCorretoresPaginated(page, 20, search || undefined);
  const { data: detalhe, isLoading: isLoadingDetalhe } = useCorretor(editingId || undefined);
  const { canAccessModule } = usePermissions();

  const corretores = data?.corretores || [];
  const totalPages = data?.totalPages || 1;
  const total = data?.total || 0;

  const canCreate = canAccessModule('corretores', 'create');
  const canEdit = canAccessModule('corretores', 'edit');
  const canDelete = canAccessModule('corretores', 'delete');

  const handleSubmit = (formData: any) => {
    if (editingId) {
      update({ ...formData, id: editingId });
    } else {
      create(formData);
    }
    handleDialogOpenChange(false);
  };

  const handleEdit = (c: Corretor) => {
    setEditingId(c.id);
    setIsDialogOpen(true);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) setEditingId(null);
  };

  return (
    <MainLayout title="Corretores" subtitle="Time comercial externo">
      <div className="space-y-6">
        <div className="flex justify-end">
          {canCreate && (
            <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Corretor
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingId ? 'Editar Corretor' : 'Novo Corretor'}</DialogTitle>
                </DialogHeader>
                {editingId && isLoadingDetalhe ? (
                  <div className="space-y-4 py-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : (
                  <CorretorForm
                    initialData={detalhe || undefined}
                    onSubmit={handleSubmit}
                    isLoading={isCreating || isUpdating}
                  />
                )}
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[240px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, CPF ou email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9"
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {total} corretor{total !== 1 ? 'es' : ''}
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Carregando...</div>
        ) : corretores.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">Nenhum corretor encontrado</div>
        ) : (
          <>
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Corretor</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>CRECI</TableHead>
                    <TableHead>Status</TableHead>
                    {canDelete && <TableHead className="w-[60px]"></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {corretores.map((c) => (
                    <TableRow
                      key={c.id}
                      className={canEdit ? 'cursor-pointer hover:bg-muted/50' : ''}
                      onClick={() => canEdit && handleEdit(c)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <UserCog className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{c.nome_completo}</p>
                            {c.cpf && <p className="text-sm text-muted-foreground">{c.cpf}</p>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {c.telefone && (
                            <div className="flex items-center gap-1 text-sm"><Phone className="h-3 w-3" />{c.telefone}</div>
                          )}
                          {c.email && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground"><Mail className="h-3 w-3" />{c.email}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{c.creci || '—'}</TableCell>
                      <TableCell>
                        <Badge variant={c.is_active ? 'default' : 'secondary'}>
                          {c.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      {canDelete && (
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir corretor?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta ação desativará o corretor. O histórico de atividades será preservado.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteCorretor(c.id)}
                                  className="bg-destructive hover:bg-destructive/90"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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
      </div>
    </MainLayout>
  );
}
