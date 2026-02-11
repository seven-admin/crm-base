import { useState } from 'react';
import { Plus, Pencil, Trash2, Check, X, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { usePlanejamentoStatus } from '@/hooks/usePlanejamentoStatus';
import { cn } from '@/lib/utils';

const CORES_STATUS = [
  '#3B82F6', '#F59E0B', '#22C55E', '#EF4444', '#8B5CF6',
  '#06B6D4', '#EC4899', '#6B7280', '#10B981', '#F97316'
];

export function PlanejamentoStatusEditor() {
  const { statusList, isLoading, createStatus, updateStatus, deleteStatus } = usePlanejamentoStatus();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState({ nome: '', cor: '', is_final: false });
  const [isAdding, setIsAdding] = useState(false);
  const [newStatus, setNewStatus] = useState({ nome: '', cor: CORES_STATUS[0], is_final: false });

  const handleEdit = (status: { id: string; nome: string; cor: string; is_final: boolean }) => {
    setEditingId(status.id);
    setEditValue({ nome: status.nome, cor: status.cor, is_final: status.is_final });
  };

  const handleSaveEdit = () => {
    if (editingId && editValue.nome.trim()) {
      updateStatus.mutate({ 
        id: editingId, 
        nome: editValue.nome, 
        cor: editValue.cor,
        is_final: editValue.is_final 
      });
      setEditingId(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValue({ nome: '', cor: '', is_final: false });
  };

  const handleAdd = () => {
    if (newStatus.nome.trim()) {
      const nextOrdem = (statusList?.length || 0) + 1;
      createStatus.mutate({ 
        nome: newStatus.nome, 
        cor: newStatus.cor, 
        ordem: nextOrdem,
        is_final: newStatus.is_final 
      });
      setNewStatus({ nome: '', cor: CORES_STATUS[0], is_final: false });
      setIsAdding(false);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este status?')) {
      deleteStatus.mutate(id);
    }
  };

  if (isLoading) {
    return <div className="animate-pulse h-32 bg-muted rounded-lg" />;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Status das Tarefas</CardTitle>
        <Button size="sm" variant="outline" onClick={() => setIsAdding(true)} disabled={isAdding}>
          <Plus className="h-4 w-4 mr-1" /> Novo Status
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {statusList?.map((status) => (
          <div
            key={status.id}
            className="flex items-center gap-2 p-2 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
          >
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: status.cor }}
            />

            {editingId === status.id ? (
              <>
                <Input
                  value={editValue.nome}
                  onChange={(e) => setEditValue({ ...editValue, nome: e.target.value })}
                  className="flex-1 h-8"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveEdit();
                    if (e.key === 'Escape') handleCancelEdit();
                  }}
                />
                <div className="flex gap-1">
                  {CORES_STATUS.slice(0, 6).map((cor) => (
                    <button
                      key={cor}
                      className={cn(
                        'w-4 h-4 rounded-full transition-all',
                        editValue.cor === cor && 'ring-2 ring-offset-1 ring-primary'
                      )}
                      style={{ backgroundColor: cor }}
                      onClick={() => setEditValue({ ...editValue, cor })}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-1">
                  <Checkbox 
                    id={`final-${status.id}`}
                    checked={editValue.is_final}
                    onCheckedChange={(checked) => setEditValue({ ...editValue, is_final: !!checked })}
                  />
                  <Label htmlFor={`final-${status.id}`} className="text-xs">Final</Label>
                </div>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleSaveEdit}>
                  <Check className="h-4 w-4 text-green-600" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleCancelEdit}>
                  <X className="h-4 w-4 text-muted-foreground" />
                </Button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm font-medium">{status.nome}</span>
                {status.is_final && (
                  <span title="Status final">
                    <Flag className="h-3.5 w-3.5 text-green-600" />
                  </span>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => handleEdit({ 
                    id: status.id, 
                    nome: status.nome, 
                    cor: status.cor,
                    is_final: status.is_final 
                  })}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(status.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>
        ))}

        {isAdding && (
          <div className="flex items-center gap-2 p-2 rounded-lg border border-dashed bg-muted/30">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: newStatus.cor }}
            />
            <Input
              value={newStatus.nome}
              onChange={(e) => setNewStatus({ ...newStatus, nome: e.target.value })}
              placeholder="Nome do status..."
              className="flex-1 h-8"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd();
                if (e.key === 'Escape') setIsAdding(false);
              }}
            />
            <div className="flex gap-1">
              {CORES_STATUS.slice(0, 5).map((cor) => (
                <button
                  key={cor}
                  className={cn(
                    'w-4 h-4 rounded-full transition-all',
                    newStatus.cor === cor && 'ring-2 ring-offset-1 ring-primary'
                  )}
                  style={{ backgroundColor: cor }}
                  onClick={() => setNewStatus({ ...newStatus, cor })}
                />
              ))}
            </div>
            <div className="flex items-center gap-1">
              <Checkbox 
                id="new-final"
                checked={newStatus.is_final}
                onCheckedChange={(checked) => setNewStatus({ ...newStatus, is_final: !!checked })}
              />
              <Label htmlFor="new-final" className="text-xs">Final</Label>
            </div>
            <Button size="sm" onClick={handleAdd} disabled={!newStatus.nome.trim()}>
              Adicionar
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)}>
              Cancelar
            </Button>
          </div>
        )}

        {(!statusList || statusList.length === 0) && !isAdding && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum status cadastrado. Clique em "Novo Status" para começar.
          </p>
        )}

        <p className="text-xs text-muted-foreground mt-2">
          <Flag className="h-3 w-3 inline mr-1 text-green-600" />
          Status marcados como "Final" indicam que a tarefa está concluída.
        </p>
      </CardContent>
    </Card>
  );
}
