import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  Plus, 
  Pencil, 
  Trash2, 
  ArrowUp, 
  ArrowDown,
  Loader2,
  CreditCard,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useTiposParcelaAll,
  useCreateTipoParcela,
  useUpdateTipoParcela,
  useDeleteTipoParcela,
  useReorderTiposParcela,
  TipoParcela,
} from '@/hooks/useTiposParcela';

interface TipoParcelaFormData {
  codigo: string;
  nome: string;
  descricao: string;
  is_active: boolean;
}

const DEFAULT_FORM_DATA: TipoParcelaFormData = {
  codigo: '',
  nome: '',
  descricao: '',
  is_active: true,
};

export default function TiposParcela() {
  const { data: tipos = [], isLoading } = useTiposParcelaAll();
  const createTipo = useCreateTipoParcela();
  const updateTipo = useUpdateTipoParcela();
  const deleteTipo = useDeleteTipoParcela();
  const reorderTipos = useReorderTiposParcela();

  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingTipo, setEditingTipo] = useState<TipoParcela | null>(null);
  const [tipoToDelete, setTipoToDelete] = useState<TipoParcela | null>(null);
  const [formData, setFormData] = useState<TipoParcelaFormData>(DEFAULT_FORM_DATA);

  const handleAddNew = () => {
    setEditingTipo(null);
    setFormData(DEFAULT_FORM_DATA);
    setFormOpen(true);
  };

  const handleEdit = (tipo: TipoParcela) => {
    setEditingTipo(tipo);
    setFormData({
      codigo: tipo.codigo,
      nome: tipo.nome,
      descricao: tipo.descricao || '',
      is_active: tipo.is_active,
    });
    setFormOpen(true);
  };

  const handleDelete = (tipo: TipoParcela) => {
    setTipoToDelete(tipo);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (tipoToDelete) {
      deleteTipo.mutate(tipoToDelete.id, {
        onSuccess: () => {
          toast.success('Tipo de parcela excluído com sucesso!');
          setDeleteDialogOpen(false);
          setTipoToDelete(null);
        },
        onError: (error: any) => {
          toast.error(`Erro ao excluir: ${error.message}`);
        },
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.codigo.trim() || !formData.nome.trim()) {
      toast.error('Código e nome são obrigatórios');
      return;
    }

    if (editingTipo) {
      updateTipo.mutate(
        {
          id: editingTipo.id,
          ...formData,
          descricao: formData.descricao || null,
        },
        {
          onSuccess: () => {
            toast.success('Tipo de parcela atualizado com sucesso!');
            setFormOpen(false);
          },
          onError: (error: any) => {
            toast.error(`Erro ao atualizar: ${error.message}`);
          },
        }
      );
    } else {
      const maxOrdem = tipos.reduce((max, t) => Math.max(max, t.ordem), 0);
      createTipo.mutate(
        {
          ...formData,
          descricao: formData.descricao || null,
          ordem: maxOrdem + 1,
        },
        {
          onSuccess: () => {
            toast.success('Tipo de parcela criado com sucesso!');
            setFormOpen(false);
          },
          onError: (error: any) => {
            toast.error(`Erro ao criar: ${error.message}`);
          },
        }
      );
    }
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newItems = [...tipos];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newItems.length) return;

    [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];

    const updates = newItems.map((item, idx) => ({
      id: item.id,
      ordem: idx,
    }));

    reorderTipos.mutate(updates);
  };

  const isSaving = createTipo.isPending || updateTipo.isPending;

  return (
    <MainLayout title="Tipos de Parcela" subtitle="Gerencie os tipos de parcela disponíveis para condições de pagamento">
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button onClick={handleAddNew}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Tipo
          </Button>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Tipos Cadastrados</CardTitle>
            <CardDescription>
              Arraste para reordenar ou use os botões de seta
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : tipos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum tipo de parcela cadastrado</p>
                <Button variant="outline" onClick={handleAddNew} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Tipo
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Ordem</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead className="hidden md:table-cell">Descrição</TableHead>
                    <TableHead className="w-24">Status</TableHead>
                    <TableHead className="w-32 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tipos.map((tipo, index) => (
                    <TableRow key={tipo.id}>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => moveItem(index, 'up')}
                            disabled={index === 0}
                          >
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => moveItem(index, 'down')}
                            disabled={index === tipos.length - 1}
                          >
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="px-2 py-1 bg-muted rounded text-xs">
                          {tipo.codigo}
                        </code>
                      </TableCell>
                      <TableCell className="font-medium">{tipo.nome}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {tipo.descricao || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={tipo.is_active ? 'default' : 'secondary'}>
                          {tipo.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEdit(tipo)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(tipo)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingTipo ? 'Editar Tipo de Parcela' : 'Novo Tipo de Parcela'}
            </DialogTitle>
            <DialogDescription>
              {editingTipo
                ? 'Altere os dados do tipo de parcela'
                : 'Preencha os dados para criar um novo tipo de parcela'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="codigo">Código *</Label>
              <Input
                id="codigo"
                placeholder="Ex: entrada, mensal_fixa"
                value={formData.codigo}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, codigo: e.target.value }))
                }
                disabled={!!editingTipo}
              />
              {editingTipo && (
                <p className="text-xs text-muted-foreground">
                  O código não pode ser alterado após a criação
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                placeholder="Ex: Parcela de Entrada"
                value={formData.nome}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, nome: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                placeholder="Breve descrição do tipo de parcela"
                value={formData.descricao}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, descricao: e.target.value }))
                }
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">Ativo</Label>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, is_active: checked }))
                }
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingTipo ? 'Salvar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o tipo de parcela{' '}
              <strong>{tipoToDelete?.nome}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteTipo.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
