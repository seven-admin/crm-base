import { useState } from 'react';
import { Plus, GripVertical, Pencil, Trash2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePlanejamentoFases } from '@/hooks/usePlanejamentoFases';
import { cn } from '@/lib/utils';

const CORES_DISPONIVEIS = [
  '#22C55E', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899',
  '#06B6D4', '#EF4444', '#10B981', '#6366F1', '#F97316'
];

export function PlanejamentoFasesEditor() {
  const { fases, isLoading, createFase, updateFase, deleteFase } = usePlanejamentoFases();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState({ nome: '', cor: '' });
  const [isAdding, setIsAdding] = useState(false);
  const [newFase, setNewFase] = useState({ nome: '', cor: CORES_DISPONIVEIS[0] });

  const handleEdit = (fase: { id: string; nome: string; cor: string }) => {
    setEditingId(fase.id);
    setEditValue({ nome: fase.nome, cor: fase.cor });
  };

  const handleSaveEdit = () => {
    if (editingId && editValue.nome.trim()) {
      updateFase.mutate({ id: editingId, nome: editValue.nome, cor: editValue.cor });
      setEditingId(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValue({ nome: '', cor: '' });
  };

  const handleAdd = () => {
    if (newFase.nome.trim()) {
      const nextOrdem = (fases?.length || 0) + 1;
      createFase.mutate({ nome: newFase.nome, cor: newFase.cor, ordem: nextOrdem });
      setNewFase({ nome: '', cor: CORES_DISPONIVEIS[0] });
      setIsAdding(false);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta fase?')) {
      deleteFase.mutate(id);
    }
  };

  if (isLoading) {
    return <div className="animate-pulse h-32 bg-muted rounded-lg" />;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Fases do Planejamento</CardTitle>
        <Button size="sm" variant="outline" onClick={() => setIsAdding(true)} disabled={isAdding}>
          <Plus className="h-4 w-4 mr-1" /> Nova Fase
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {fases?.map((fase) => (
          <div
            key={fase.id}
            className="flex items-center gap-2 p-2 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
            
            <div
              className="w-4 h-4 rounded-full flex-shrink-0"
              style={{ backgroundColor: fase.cor }}
            />

            {editingId === fase.id ? (
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
                  {CORES_DISPONIVEIS.map((cor) => (
                    <button
                      key={cor}
                      className={cn(
                        'w-5 h-5 rounded-full transition-all',
                        editValue.cor === cor && 'ring-2 ring-offset-2 ring-primary'
                      )}
                      style={{ backgroundColor: cor }}
                      onClick={() => setEditValue({ ...editValue, cor })}
                    />
                  ))}
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
                <span className="flex-1 text-sm font-medium">{fase.nome}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => handleEdit({ id: fase.id, nome: fase.nome, cor: fase.cor })}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(fase.id)}
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
              className="w-4 h-4 rounded-full flex-shrink-0"
              style={{ backgroundColor: newFase.cor }}
            />
            <Input
              value={newFase.nome}
              onChange={(e) => setNewFase({ ...newFase, nome: e.target.value })}
              placeholder="Nome da fase..."
              className="flex-1 h-8"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd();
                if (e.key === 'Escape') setIsAdding(false);
              }}
            />
            <div className="flex gap-1">
              {CORES_DISPONIVEIS.slice(0, 5).map((cor) => (
                <button
                  key={cor}
                  className={cn(
                    'w-5 h-5 rounded-full transition-all',
                    newFase.cor === cor && 'ring-2 ring-offset-2 ring-primary'
                  )}
                  style={{ backgroundColor: cor }}
                  onClick={() => setNewFase({ ...newFase, cor })}
                />
              ))}
            </div>
            <Button size="sm" onClick={handleAdd} disabled={!newFase.nome.trim()}>
              Adicionar
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)}>
              Cancelar
            </Button>
          </div>
        )}

        {(!fases || fases.length === 0) && !isAdding && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma fase cadastrada. Clique em "Nova Fase" para começar.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
