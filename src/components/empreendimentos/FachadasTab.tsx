import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Image } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useFachadas, useDeleteFachada, type Fachada } from '@/hooks/useFachadas';
import { FachadaForm } from './FachadaForm';

interface FachadasTabProps {
  empreendimentoId: string;
}

export function FachadasTab({ empreendimentoId }: FachadasTabProps) {
  const { data: fachadas, isLoading } = useFachadas(empreendimentoId);
  const deleteFachada = useDeleteFachada();
  const [formOpen, setFormOpen] = useState(false);
  const [editingFachada, setEditingFachada] = useState<Fachada | null>(null);

  const handleEdit = (fachada: Fachada) => {
    setEditingFachada(fachada);
    setFormOpen(true);
  };

  const handleNew = () => {
    setEditingFachada(null);
    setFormOpen(true);
  };

  const handleDelete = (fachada: Fachada) => {
    deleteFachada.mutate({ id: fachada.id, empreendimentoId });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Fachadas</h3>
          <p className="text-sm text-muted-foreground">
            Cadastre as diferentes fachadas disponíveis para as unidades
          </p>
        </div>
        <Button onClick={handleNew} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nova Fachada
        </Button>
      </div>

      {fachadas && fachadas.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {fachadas.map((fachada) => (
            <Card key={fachada.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{fachada.nome}</CardTitle>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(fachada)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                          <AlertDialogDescription>
                            Deseja realmente excluir a fachada "{fachada.nome}"?
                            As unidades associadas terão a fachada removida.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(fachada)}>
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                {fachada.descricao && (
                  <CardDescription className="line-clamp-2">
                    {fachada.descricao}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {fachada.imagem_url ? (
                  <img 
                    src={fachada.imagem_url} 
                    alt={fachada.nome}
                    className="w-full h-32 object-cover rounded-md"
                  />
                ) : (
                  <div className="w-full h-32 bg-muted rounded-md flex items-center justify-center">
                    <Image className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <Image className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhuma fachada cadastrada</p>
            <Button onClick={handleNew} variant="outline" className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Cadastrar Primeira Fachada
            </Button>
          </CardContent>
        </Card>
      )}

      <FachadaForm
        open={formOpen}
        onOpenChange={setFormOpen}
        empreendimentoId={empreendimentoId}
        fachada={editingFachada}
      />
    </div>
  );
}
