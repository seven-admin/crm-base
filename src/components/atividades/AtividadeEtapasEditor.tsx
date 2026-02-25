import { useState } from 'react';
import { Plus, GripVertical, Trash2, Edit2, Check, X, Flag, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
  useAtividadeEtapasConfig,
  useCreateAtividadeEtapa,
  useUpdateAtividadeEtapa,
  useDeleteAtividadeEtapa,
  useReorderAtividadeEtapas,
  type AtividadeEtapa,
} from '@/hooks/useAtividadeEtapas';
import { cn } from '@/lib/utils';

const CORES_ETAPAS = [
  { cor: '#3b82f6', cor_bg: '#dbeafe', label: 'Azul' },
  { cor: '#10b981', cor_bg: '#d1fae5', label: 'Verde' },
  { cor: '#f59e0b', cor_bg: '#fef3c7', label: 'Amarelo' },
  { cor: '#ef4444', cor_bg: '#fee2e2', label: 'Vermelho' },
  { cor: '#8b5cf6', cor_bg: '#ede9fe', label: 'Roxo' },
  { cor: '#ec4899', cor_bg: '#fce7f3', label: 'Rosa' },
];

export function AtividadeEtapasEditor() {
  const { data: allEtapas = [], isLoading } = useAtividadeEtapasConfig();
  const createMutation = useCreateAtividadeEtapa();
  const updateMutation = useUpdateAtividadeEtapa();
  const deleteMutation = useDeleteAtividadeEtapa();
  const reorderMutation = useReorderAtividadeEtapas();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingNome, setEditingNome] = useState('');
  const [addingNew, setAddingNew] = useState(false);
  const [newEtapaNome, setNewEtapaNome] = useState('');
  const [newEtapaCor, setNewEtapaCor] = useState(CORES_ETAPAS[0]);
  const [deleteConfirm, setDeleteConfirm] = useState<AtividadeEtapa | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const etapas = allEtapas.filter((e) => e.is_active);

  const handleAddEtapa = async () => {
    if (!newEtapaNome.trim()) return;
    await createMutation.mutateAsync({
      nome: newEtapaNome,
      cor: newEtapaCor.cor,
      cor_bg: newEtapaCor.cor_bg,
      ordem: etapas.length,
      is_inicial: false,
      is_final: false,
    });
    setNewEtapaNome('');
    setAddingNew(false);
  };

  const handleSaveEdit = async (etapa: AtividadeEtapa) => {
    if (!editingNome.trim()) return;
    await updateMutation.mutateAsync({ id: etapa.id, nome: editingNome });
    setEditingId(null);
  };

  const handleToggleFlag = async (etapa: AtividadeEtapa, flag: 'is_inicial' | 'is_final') => {
    if (!etapa[flag]) {
      for (const e of etapas) {
        if (e.id !== etapa.id && e[flag]) {
          await updateMutation.mutateAsync({ id: e.id, [flag]: false });
        }
      }
    }
    await updateMutation.mutateAsync({ id: etapa.id, [flag]: !etapa[flag] });
  };

  const handleChangeColor = async (etapa: AtividadeEtapa, cor: (typeof CORES_ETAPAS)[0]) => {
    await updateMutation.mutateAsync({ id: etapa.id, cor: cor.cor, cor_bg: cor.cor_bg });
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      return;
    }
    const draggedIndex = etapas.findIndex((e) => e.id === draggedId);
    const targetIndex = etapas.findIndex((e) => e.id === targetId);
    const newEtapas = [...etapas];
    const [dragged] = newEtapas.splice(draggedIndex, 1);
    newEtapas.splice(targetIndex, 0, dragged);
    const updates = newEtapas.map((etapa, index) => ({ id: etapa.id, ordem: index }));
    await reorderMutation.mutateAsync(updates);
    setDraggedId(null);
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
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Etapas de Atividades</CardTitle>
        <Button size="sm" variant="outline" onClick={() => setAddingNew(true)} disabled={addingNew}>
          <Plus className="h-4 w-4 mr-1" />
          Adicionar Etapa
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {etapas.map((etapa) => (
          <div
            key={etapa.id}
            draggable
            onDragStart={(e) => handleDragStart(e, etapa.id)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, etapa.id)}
            className={cn(
              'flex items-center gap-2 p-3 rounded-lg border transition-colors',
              draggedId === etapa.id && 'opacity-50',
              'hover:bg-muted/50'
            )}
            style={{ borderLeftColor: etapa.cor || '#6b7280', borderLeftWidth: 4 }}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />

            {editingId === etapa.id ? (
              <div className="flex-1 flex items-center gap-2">
                <Input
                  value={editingNome}
                  onChange={(e) => setEditingNome(e.target.value)}
                  className="h-8"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveEdit(etapa);
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                />
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleSaveEdit(etapa)}>
                  <Check className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingId(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <span className="flex-1 font-medium">{etapa.nome}</span>
                <TooltipProvider>
                  <div className="flex items-center gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant={etapa.is_inicial ? 'default' : 'ghost'}
                          className="h-7 w-7"
                          onClick={() => handleToggleFlag(etapa, 'is_inicial')}
                        >
                          <Flag className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Etapa Inicial</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant={etapa.is_final ? 'default' : 'ghost'}
                          className={cn('h-7 w-7', etapa.is_final && 'bg-green-500 hover:bg-green-600')}
                          onClick={() => handleToggleFlag(etapa, 'is_final')}
                        >
                          <CheckCircle className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Etapa Final (Concluído)</TooltipContent>
                    </Tooltip>

                    <div className="flex items-center gap-0.5 ml-2 border-l pl-2">
                      {CORES_ETAPAS.map((cor) => (
                        <Tooltip key={cor.cor}>
                          <TooltipTrigger asChild>
                            <button
                              className={cn(
                                'h-5 w-5 rounded-full border-2 transition-transform hover:scale-110',
                                etapa.cor === cor.cor ? 'border-foreground' : 'border-transparent'
                              )}
                              style={{ backgroundColor: cor.cor }}
                              onClick={() => handleChangeColor(etapa, cor)}
                            />
                          </TooltipTrigger>
                          <TooltipContent>{cor.label}</TooltipContent>
                        </Tooltip>
                      ))}
                    </div>

                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 ml-2"
                      onClick={() => {
                        setEditingId(etapa.id);
                        setEditingNome(etapa.nome);
                      }}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>

                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => setDeleteConfirm(etapa)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </TooltipProvider>
              </>
            )}
          </div>
        ))}

        {addingNew && (
          <div className="flex items-center gap-2 p-3 rounded-lg border border-dashed">
            <div className="flex items-center gap-1">
              {CORES_ETAPAS.map((cor) => (
                <button
                  key={cor.cor}
                  className={cn(
                    'h-5 w-5 rounded-full border-2 transition-transform hover:scale-110',
                    newEtapaCor.cor === cor.cor ? 'border-foreground' : 'border-transparent'
                  )}
                  style={{ backgroundColor: cor.cor }}
                  onClick={() => setNewEtapaCor(cor)}
                />
              ))}
            </div>
            <Input
              value={newEtapaNome}
              onChange={(e) => setNewEtapaNome(e.target.value)}
              placeholder="Nome da etapa"
              className="flex-1 h-8"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddEtapa();
                if (e.key === 'Escape') {
                  setAddingNew(false);
                  setNewEtapaNome('');
                }
              }}
            />
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleAddEtapa} disabled={!newEtapaNome.trim()}>
              <Check className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => {
                setAddingNew(false);
                setNewEtapaNome('');
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {etapas.length === 0 && !addingNew && (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma etapa configurada. Adicione etapas para começar.
          </div>
        )}

        <div className="flex items-center gap-4 pt-4 text-xs text-muted-foreground border-t mt-4">
          <div className="flex items-center gap-1">
            <Flag className="h-3 w-3" />
            <span>Inicial</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            <span>Final</span>
          </div>
          <span className="ml-auto">Arraste para reordenar</span>
        </div>
      </CardContent>

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Etapa</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a etapa "{deleteConfirm?.nome}"?
              Atividades nesta etapa precisarão ser movidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (deleteConfirm) {
                  await deleteMutation.mutateAsync(deleteConfirm.id);
                  setDeleteConfirm(null);
                }
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
