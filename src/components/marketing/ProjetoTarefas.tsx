import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Loader2, Pencil, Check, X } from 'lucide-react';
import { useTarefasProjeto } from '@/hooks/useProjetosMarketing';
import { cn } from '@/lib/utils';

interface ProjetoTarefasProps {
  projetoId: string;
}

export function ProjetoTarefas({ projetoId }: ProjetoTarefasProps) {
  const { tarefas, isLoading, createTarefa, updateTarefa, deleteTarefa } = useTarefasProjeto(projetoId);
  const [novaTarefa, setNovaTarefa] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');

  const handleAddTarefa = () => {
    if (novaTarefa.trim()) {
      createTarefa.mutate({ titulo: novaTarefa.trim() });
      setNovaTarefa('');
    }
  };

  const handleToggleTarefa = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'concluida' ? 'pendente' : 'concluida';
    updateTarefa.mutate({ id, status: newStatus });
  };

  const handleDeleteTarefa = (id: string) => {
    deleteTarefa.mutate(id);
  };

  const handleStartEdit = (id: string, titulo: string) => {
    setEditingId(id);
    setEditingValue(titulo);
  };

  const handleSaveEdit = (id: string) => {
    if (editingValue.trim()) {
      updateTarefa.mutate({ id, titulo: editingValue.trim() });
    }
    setEditingId(null);
    setEditingValue('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingValue('');
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Tarefas do Projeto</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Task */}
        <div className="flex gap-2">
          <Input
            placeholder="Nova tarefa..."
            value={novaTarefa}
            onChange={(e) => setNovaTarefa(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTarefa()}
          />
          <Button onClick={handleAddTarefa} disabled={!novaTarefa.trim() || createTarefa.isPending}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Task List */}
        <div className="space-y-2">
          {tarefas?.map((tarefa) => (
            <div 
              key={tarefa.id} 
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border group",
                tarefa.status === 'concluida' ? 'bg-muted/50' : 'hover:bg-muted/30'
              )}
            >
              <Checkbox
                checked={tarefa.status === 'concluida'}
                onCheckedChange={() => handleToggleTarefa(tarefa.id, tarefa.status)}
              />
              
              {editingId === tarefa.id ? (
                <div className="flex-1 flex items-center gap-2">
                  <Input 
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit(tarefa.id);
                      if (e.key === 'Escape') handleCancelEdit();
                    }}
                    autoFocus
                    className="h-8"
                  />
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-green-600"
                    onClick={() => handleSaveEdit(tarefa.id)}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={handleCancelEdit}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <span 
                    className={cn(
                      "flex-1 cursor-pointer",
                      tarefa.status === 'concluida' && 'line-through text-muted-foreground'
                    )}
                    onDoubleClick={() => handleStartEdit(tarefa.id, tarefa.titulo)}
                  >
                    {tarefa.titulo}
                  </span>
                  
                  {tarefa.responsavel && (
                    <span className="text-xs text-muted-foreground">
                      {tarefa.responsavel.full_name}
                    </span>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleStartEdit(tarefa.id, tarefa.titulo)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDeleteTarefa(tarefa.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          ))}

          {(!tarefas || tarefas.length === 0) && (
            <p className="text-center text-muted-foreground py-4">
              Nenhuma tarefa cadastrada
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
