import { useState } from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  useTiposAtendimento,
  useUpdateTipoAtendimento,
  useCreateTipoAtendimento,
  useDeleteTipoAtendimento,
} from '@/hooks/useTiposAtendimento';
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

export function TiposAtendimentoEditor() {
  const { data: tipos = [], isLoading } = useTiposAtendimento();
  const updateMutation = useUpdateTipoAtendimento();
  const createMutation = useCreateTipoAtendimento();
  const deleteMutation = useDeleteTipoAtendimento();

  const [newNome, setNewNome] = useState('');
  const [newTipo, setNewTipo] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleCreate = () => {
    if (!newNome.trim() || !newTipo.trim()) return;
    const maxOrdem = tipos.reduce((max, t) => Math.max(max, t.ordem), 0);
    createMutation.mutate(
      { nome: newNome.trim(), tipo_atividade: newTipo.trim(), ordem: maxOrdem + 1 },
      { onSuccess: () => { setNewNome(''); setNewTipo(''); } }
    );
  };

  const handleToggle = (id: string, is_active: boolean) => {
    updateMutation.mutate({ id, data: { is_active } });
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
      setDeleteId(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Tipos de Atendimento</CardTitle>
        <CardDescription>
          Configure os tipos de atividade que aparecem no modo "Atendimento" do formulário e estão vinculados ao kanban de negociações.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Lista de tipos existentes */}
        <div className="space-y-2">
          {tipos.map((tipo) => (
            <div
              key={tipo.id}
              className="flex items-center gap-3 p-3 rounded-lg border bg-card"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{tipo.nome}</p>
                <p className="text-xs text-muted-foreground font-mono">{tipo.tipo_atividade}</p>
              </div>
              <Switch
                checked={tipo.is_active}
                onCheckedChange={(checked) => handleToggle(tipo.id, checked)}
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => setDeleteId(tipo.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        {/* Adicionar novo tipo */}
        <div className="border-t pt-4 space-y-3">
          <Label className="text-sm font-medium">Adicionar Novo Tipo</Label>
          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-1">
              <Label className="text-xs text-muted-foreground">Nome</Label>
              <Input
                placeholder="Ex: Contra Proposta"
                value={newNome}
                onChange={(e) => setNewNome(e.target.value)}
              />
            </div>
            <div className="flex-1 space-y-1">
              <Label className="text-xs text-muted-foreground">Tipo (código)</Label>
              <Input
                placeholder="Ex: contra_proposta"
                value={newTipo}
                onChange={(e) => setNewTipo(e.target.value)}
              />
            </div>
            <Button onClick={handleCreate} disabled={!newNome.trim() || !newTipo.trim()}>
              <Plus className="h-4 w-4 mr-1" />
              Adicionar
            </Button>
          </div>
        </div>
      </CardContent>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Tipo de Atendimento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza? Isso não afeta atividades já criadas, mas o tipo não aparecerá mais no formulário.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
