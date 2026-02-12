import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, Loader2, Building2, RefreshCw } from 'lucide-react';
import { useBlocosComContagem, useDeleteBloco, useAtualizarContagemBlocos } from '@/hooks/useBlocos';
import { BlocoForm } from './BlocoForm';
import { toast } from 'sonner';
import type { Bloco, EmpreendimentoTipo } from '@/types/empreendimentos.types';

interface BlocosTabProps {
  empreendimentoId: string;
  tipoEmpreendimento?: EmpreendimentoTipo;
}

export function BlocosTab({ empreendimentoId, tipoEmpreendimento }: BlocosTabProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingBloco, setEditingBloco] = useState<Bloco | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [blocoToDelete, setBlocoToDelete] = useState<Bloco | null>(null);

  const { data: blocos, isLoading } = useBlocosComContagem(empreendimentoId);
  const deleteBloco = useDeleteBloco();
  const atualizarContagem = useAtualizarContagemBlocos();

  const isLoteamento = tipoEmpreendimento === 'loteamento' || tipoEmpreendimento === 'condominio';
  const entityLabel = isLoteamento ? 'Quadra' : 'Bloco';
  const entityLabelPlural = isLoteamento ? 'Quadras' : 'Blocos';

  const handleEdit = (bloco: Bloco) => {
    setEditingBloco(bloco);
    setFormOpen(true);
  };

  const handleCreate = () => {
    setEditingBloco(null);
    setFormOpen(true);
  };

  const handleDeleteClick = (bloco: Bloco) => {
    setBlocoToDelete(bloco);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (blocoToDelete) {
      deleteBloco.mutate(
        { id: blocoToDelete.id, empreendimentoId },
        {
          onSuccess: () => {
            setDeleteDialogOpen(false);
            setBlocoToDelete(null);
          },
        }
      );
    }
  };

  const handleRecalcular = async () => {
    try {
      await atualizarContagem.mutateAsync(empreendimentoId);
      toast.success('Total de lotes atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao recalcular:', error);
      toast.error('Erro ao recalcular total de lotes');
    }
  };

  const totalUnidadesCadastradas = blocos?.reduce(
    (sum, b) => sum + (b.total_unidades_cadastradas || 0),
    0
  ) || 0;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {entityLabelPlural}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={handleRecalcular}
              disabled={atualizarContagem.isPending}
            >
              {atualizarContagem.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Recalcular Totais
            </Button>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Nov{isLoteamento ? 'a' : 'o'} {entityLabel}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {blocos && blocos.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    {!isLoteamento && <TableHead>Andares</TableHead>}
                    <TableHead>{isLoteamento ? 'Total Lotes' : 'Unid/Andar'}</TableHead>
                    <TableHead>Unidades Cadastradas</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {blocos.map((bloco) => (
                    <TableRow key={bloco.id}>
                      <TableCell className="font-medium">{bloco.nome}</TableCell>
                      {!isLoteamento && (
                        <TableCell>{bloco.total_andares || '-'}</TableCell>
                      )}
                      <TableCell>{bloco.unidades_por_andar || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {bloco.total_unidades_cadastradas || 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(bloco)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(bloco)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-4 text-sm text-muted-foreground flex items-center gap-2">
                <span>
                  Total: {blocos.length} {blocos.length === 1 ? entityLabel.toLowerCase() : entityLabelPlural.toLowerCase()}
                </span>
                <span>•</span>
                <span>{totalUnidadesCadastradas} unidades cadastradas</span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-1">
                Nenhum{isLoteamento ? 'a' : ''} {entityLabel.toLowerCase()} cadastrad{isLoteamento ? 'a' : 'o'}
              </h3>
              <p className="text-muted-foreground mb-4">
                Crie {isLoteamento ? 'quadras' : 'blocos/torres'} para organizar as unidades do empreendimento.
              </p>
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Criar primeir{isLoteamento ? 'a' : 'o'} {entityLabel.toLowerCase()}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <BlocoForm
        open={formOpen}
        onOpenChange={setFormOpen}
        empreendimentoId={empreendimentoId}
        bloco={editingBloco || undefined}
        tipoEmpreendimento={tipoEmpreendimento}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Excluir {entityLabel}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {blocoToDelete && (blocoToDelete as any).total_unidades_cadastradas > 0 ? (
                <>
                  <span className="text-destructive font-medium">Atenção:</span> Este {entityLabel.toLowerCase()} "{blocoToDelete?.nome}" possui{' '}
                  <strong>{(blocoToDelete as any).total_unidades_cadastradas}</strong> unidades vinculadas.
                  <br /><br />
                  A exclusão irá desvincular as unidades deste {entityLabel.toLowerCase()}.
                  Deseja continuar?
                </>
              ) : (
                <>
                  Tem certeza que deseja excluir {isLoteamento ? 'a' : 'o'} {entityLabel.toLowerCase()} "{blocoToDelete?.nome}"?
                  Esta ação não pode ser desfeita.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteBloco.isPending}
            >
              {deleteBloco.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Excluir'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
