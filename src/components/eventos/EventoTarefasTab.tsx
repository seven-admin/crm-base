import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Calendar, User, GripVertical, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTarefasEvento } from '@/hooks/useEventos';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { EventoTarefa } from '@/types/marketing.types';
import { toast } from 'sonner';

interface EventoTarefasTabProps {
  eventoId: string;
}

const STATUS_COLORS: Record<string, string> = {
  pendente: 'bg-muted text-muted-foreground',
  em_andamento: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  concluida: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
};

const STATUS_LABELS: Record<string, string> = {
  pendente: 'Pendente',
  em_andamento: 'Em Andamento',
  concluida: 'Concluída',
};

// Sentinel value para "Nenhum" em selects (não pode ser string vazia)
const SELECT_NONE = '__none__';

type TarefaFormData = {
  titulo: string;
  responsavel_id: string;
  data_inicio: string;
  data_fim: string;
  status: string;
  dependencia_id: string;
};

const EMPTY_FORM: TarefaFormData = {
  titulo: '',
  responsavel_id: SELECT_NONE,
  data_inicio: '',
  data_fim: '',
  status: 'pendente',
  dependencia_id: SELECT_NONE,
};

export function EventoTarefasTab({ eventoId }: EventoTarefasTabProps) {
  const { tarefas, isLoading, createTarefa, updateTarefa, deleteTarefa } = useTarefasEvento(eventoId);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingTarefa, setEditingTarefa] = useState<EventoTarefa | null>(null);
  const [formData, setFormData] = useState<TarefaFormData>(EMPTY_FORM);

  // Buscar usuários para atribuição
  const { data: usuarios } = useQuery({
    queryKey: ['profiles-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .order('full_name');
      if (error) throw error;
      return data;
    },
  });

  const handleToggleStatus = (tarefa: EventoTarefa) => {
    const novoStatus = tarefa.status === 'concluida' ? 'pendente' : 'concluida';
    updateTarefa.mutate({ id: tarefa.id, status: novoStatus });
  };

  const handleOpenAdd = () => {
    setFormData(EMPTY_FORM);
    setEditingTarefa(null);
    setShowAddDialog(true);
  };

  const handleOpenEdit = (tarefa: EventoTarefa) => {
    setFormData({
      titulo: tarefa.titulo,
      responsavel_id: tarefa.responsavel_id ?? SELECT_NONE,
      data_inicio: tarefa.data_inicio || '',
      data_fim: tarefa.data_fim || '',
      status: tarefa.status || 'pendente',
      dependencia_id: tarefa.dependencia_id ?? SELECT_NONE,
    });
    setEditingTarefa(tarefa);
    setShowAddDialog(true);
  };

  const handleCloseDialog = () => {
    setShowAddDialog(false);
    setEditingTarefa(null);
    setFormData(EMPTY_FORM);
  };

  const handleSave = () => {
    if (!formData.titulo.trim()) {
      toast.error('Título é obrigatório');
      return;
    }

    const statusValue = formData.status as 'pendente' | 'em_andamento' | 'concluida';
    
    // Converter SELECT_NONE de volta para null/undefined
    const responsavelId = formData.responsavel_id === SELECT_NONE ? null : formData.responsavel_id;
    const dependenciaId = formData.dependencia_id === SELECT_NONE ? null : formData.dependencia_id;

    if (editingTarefa) {
      // Editar tarefa existente
      updateTarefa.mutate({
        id: editingTarefa.id,
        titulo: formData.titulo,
        responsavel_id: responsavelId,
        data_inicio: formData.data_inicio || null,
        data_fim: formData.data_fim || null,
        status: statusValue,
        dependencia_id: dependenciaId,
      }, {
        onSuccess: () => {
          toast.success('Tarefa atualizada');
          handleCloseDialog();
        },
      });
    } else {
      // Criar nova tarefa
      createTarefa.mutate({
        titulo: formData.titulo,
        responsavel_id: responsavelId || undefined,
        data_inicio: formData.data_inicio || undefined,
        data_fim: formData.data_fim || undefined,
        status: statusValue,
        dependencia_id: dependenciaId || undefined,
      }, {
        onSuccess: () => {
          toast.success('Tarefa criada');
          handleCloseDialog();
        },
      });
    }
  };

  const handleDeleteTarefa = (id: string) => {
    if (confirm('Remover esta tarefa?')) {
      deleteTarefa.mutate(id);
    }
  };

  const tarefasPendentes = tarefas?.filter(t => t.status !== 'concluida') || [];
  const tarefasConcluidas = tarefas?.filter(t => t.status === 'concluida') || [];

  // Tarefas disponíveis para dependência (excluindo a tarefa sendo editada)
  const tarefasParaDependencia = tarefas?.filter(t => t.id !== editingTarefa?.id) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com botão adicionar */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Tarefas do Evento</h3>
          <p className="text-sm text-muted-foreground">
            {tarefasConcluidas.length} de {tarefas?.length || 0} concluídas
          </p>
        </div>
        <Button onClick={handleOpenAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Tarefa
        </Button>
      </div>

      {/* Barra de progresso */}
      {tarefas && tarefas.length > 0 && (
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${(tarefasConcluidas.length / tarefas.length) * 100}%` }}
          />
        </div>
      )}

      {/* Lista de tarefas pendentes */}
      <div className="space-y-2">
        {tarefasPendentes.length === 0 && tarefasConcluidas.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Nenhuma tarefa cadastrada.</p>
            <Button variant="outline" className="mt-4" onClick={handleOpenAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar primeira tarefa
            </Button>
          </Card>
        )}

        {tarefasPendentes.map((tarefa) => (
          <TarefaItem
            key={tarefa.id}
            tarefa={tarefa}
            onToggle={() => handleToggleStatus(tarefa)}
            onEdit={() => handleOpenEdit(tarefa)}
            onDelete={() => handleDeleteTarefa(tarefa.id)}
          />
        ))}
      </div>

      {/* Tarefas concluídas */}
      {tarefasConcluidas.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">
            Concluídas ({tarefasConcluidas.length})
          </h4>
          {tarefasConcluidas.map((tarefa) => (
            <TarefaItem
              key={tarefa.id}
              tarefa={tarefa}
              onToggle={() => handleToggleStatus(tarefa)}
              onEdit={() => handleOpenEdit(tarefa)}
              onDelete={() => handleDeleteTarefa(tarefa.id)}
            />
          ))}
        </div>
      )}

      {/* Dialog adicionar/editar tarefa */}
      <Dialog open={showAddDialog} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingTarefa ? 'Editar Tarefa' : 'Nova Tarefa'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                placeholder="Descreva a tarefa..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="responsavel">Responsável</Label>
              <Select
                value={formData.responsavel_id || SELECT_NONE}
                onValueChange={(value) => setFormData({ ...formData, responsavel_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar responsável" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SELECT_NONE}>Nenhum</SelectItem>
                  {usuarios?.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="concluida">Concluída</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="data_inicio">Data Início</Label>
                <Input
                  id="data_inicio"
                  type="date"
                  value={formData.data_inicio}
                  onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="data_fim">Data Fim</Label>
                <Input
                  id="data_fim"
                  type="date"
                  value={formData.data_fim}
                  onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
                />
              </div>
            </div>

            {tarefasParaDependencia.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="dependencia">Depende de</Label>
                <Select
                  value={formData.dependencia_id || SELECT_NONE}
                  onValueChange={(value) => setFormData({ ...formData, dependencia_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Nenhuma dependência" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SELECT_NONE}>Nenhuma</SelectItem>
                    {tarefasParaDependencia.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.titulo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Esta tarefa só pode iniciar após a tarefa selecionada ser concluída.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={createTarefa.isPending || updateTarefa.isPending}
            >
              {editingTarefa ? 'Salvar' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Componente de item de tarefa
function TarefaItem({
  tarefa,
  onToggle,
  onEdit,
  onDelete,
}: {
  tarefa: EventoTarefa;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isConcluida = tarefa.status === 'concluida';

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
        isConcluida 
          ? 'bg-muted/30 border-border/50' 
          : 'bg-card border-border hover:border-primary/30'
      }`}
    >
      <GripVertical className="h-4 w-4 text-muted-foreground/50 cursor-grab" />
      
      <Checkbox
        checked={isConcluida}
        onCheckedChange={onToggle}
        className="h-5 w-5"
      />

      <div className="flex-1 min-w-0">
        <p className={`font-medium ${isConcluida ? 'line-through text-muted-foreground' : ''}`}>
          {tarefa.titulo}
        </p>
        <div className="flex items-center gap-3 mt-1">
          {tarefa.responsavel && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <User className="h-3 w-3" />
              {tarefa.responsavel.full_name}
            </span>
          )}
          {tarefa.data_fim && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(new Date(tarefa.data_fim), "dd/MM", { locale: ptBR })}
            </span>
          )}
        </div>
      </div>

      <Badge className={STATUS_COLORS[tarefa.status || 'pendente']}>
        {STATUS_LABELS[tarefa.status || 'pendente']}
      </Badge>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-primary"
        onClick={onEdit}
      >
        <Pencil className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-destructive"
        onClick={onDelete}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
