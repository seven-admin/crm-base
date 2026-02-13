import { useState } from 'react';
import { Plus, Search, Building2, Phone, Mail, MapPin, Trash2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// Card import removed - using standard table layout
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useIncorporadoras, useIncorporadora, useIncorporadorasPaginated } from '@/hooks/useIncorporadoras';
import { usePermissions } from '@/hooks/usePermissions';
import { IncorporadoraForm } from '@/components/mercado/IncorporadoraForm';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { Incorporadora } from '@/types/mercado.types';

export default function Incorporadoras() {
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIncorporadoraId, setEditingIncorporadoraId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  
  const { create, update, delete: deleteIncorporadora, isCreating, isUpdating } = useIncorporadoras();
  const { data, isLoading } = useIncorporadorasPaginated(page, 20, search || undefined);
  const { data: incorporadoraDetalhe, isLoading: isLoadingIncorporadora } = useIncorporadora(editingIncorporadoraId || undefined);
  const { canAccessModule } = usePermissions();
  
  const incorporadoras = data?.incorporadoras || [];
  const totalPages = data?.totalPages || 1;
  const total = data?.total || 0;
  
  const canCreate = canAccessModule('incorporadoras', 'create');
  const canEdit = canAccessModule('incorporadoras', 'edit');
  const canDelete = canAccessModule('incorporadoras', 'delete');

  const handleSubmit = (data: any) => {
    if (editingIncorporadoraId) {
      update({ ...data, id: editingIncorporadoraId });
    } else {
      create(data);
    }
    handleDialogOpenChange(false);
  };

  const handleEdit = (incorporadora: Incorporadora) => {
    setEditingIncorporadoraId(incorporadora.id);
    setIsDialogOpen(true);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingIncorporadoraId(null);
    }
  };

  return (
    <MainLayout title="Incorporadoras" subtitle="Gestão de incorporadoras">
      <div className="space-y-6">
        <div className="flex justify-end">
          {canCreate && (
            <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Incorporadora
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingIncorporadoraId ? 'Editar Incorporadora' : 'Nova Incorporadora'}
                  </DialogTitle>
                </DialogHeader>
                {editingIncorporadoraId && isLoadingIncorporadora ? (
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
                  <IncorporadoraForm
                    initialData={incorporadoraDetalhe || undefined}
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
              placeholder="Buscar por nome, CNPJ ou razão social..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {total} incorporadora{total !== 1 ? 's' : ''}
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Carregando...</div>
        ) : incorporadoras.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma incorporadora encontrada
          </div>
        ) : (
          <>
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Incorporadora</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Cidade</TableHead>
                    <TableHead>Status</TableHead>
                    {canDelete && <TableHead className="w-[60px]"></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {incorporadoras.map((inc) => (
                    <TableRow 
                      key={inc.id}
                      className={canEdit ? "cursor-pointer hover:bg-muted/50" : ""}
                      onClick={() => canEdit && handleEdit(inc)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{inc.nome}</p>
                            {inc.cnpj && (
                              <p className="text-sm text-muted-foreground">{inc.cnpj}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {inc.telefone && (
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3" />
                              {inc.telefone}
                            </div>
                          )}
                          {inc.email && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {inc.email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {inc.endereco_cidade && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            {inc.endereco_cidade}/{inc.endereco_uf}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={inc.is_active ? 'default' : 'secondary'}>
                          {inc.is_active ? 'Ativo' : 'Inativo'}
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
                                <AlertDialogTitle>Excluir incorporadora?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta ação desativará a incorporadora. Empreendimentos vinculados não serão afetados.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteIncorporadora(inc.id)}
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
