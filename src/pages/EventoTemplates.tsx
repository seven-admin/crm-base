import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, MoreVertical, Edit, Trash2, Copy, ListChecks, Loader2 } from 'lucide-react';
import { useEventoTemplates, EventoTemplate } from '@/hooks/useEventoTemplates';
import { EventoTemplateForm } from '@/components/eventos/EventoTemplateForm';
import { toast } from 'sonner';

export default function EventoTemplates() {
  const { templates, isLoading, createTemplate, updateTemplate, deleteTemplate, addTarefa, deleteTarefa, updateTarefa } = useEventoTemplates();
  const [formOpen, setFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EventoTemplate | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<EventoTemplate | null>(null);

  const handleCreate = () => {
    setEditingTemplate(null);
    setFormOpen(true);
  };

  const handleEdit = (template: EventoTemplate) => {
    setEditingTemplate(template);
    setFormOpen(true);
  };

  const handleDuplicate = (template: EventoTemplate) => {
    createTemplate.mutate({
      nome: `${template.nome} (Cópia)`,
      descricao: template.descricao,
      duracao_dias: template.duracao_dias,
      orcamento_padrao: template.orcamento_padrao,
      local_padrao: template.local_padrao,
      tarefas: template.tarefas?.map((t, idx) => ({
        titulo: t.titulo,
        descricao: t.descricao,
        dias_antes_evento: t.dias_antes_evento,
        duracao_horas: t.duracao_horas,
        ordem: idx,
      })),
    });
  };

  const handleDelete = () => {
    if (templateToDelete) {
      deleteTemplate.mutate(templateToDelete.id);
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
    }
  };

  const handleSubmit = async (data: {
    nome: string;
    descricao?: string;
    duracao_dias?: number;
    orcamento_padrao?: number;
    local_padrao?: string;
    tarefas: Array<{
      id?: string;
      titulo: string;
      descricao?: string;
      dias_antes_evento: number;
      duracao_horas?: number;
      ordem: number;
    }>;
  }) => {
    if (editingTemplate) {
      // Update template
      await updateTemplate.mutateAsync({
        id: editingTemplate.id,
        nome: data.nome,
        descricao: data.descricao,
        duracao_dias: data.duracao_dias,
        orcamento_padrao: data.orcamento_padrao,
        local_padrao: data.local_padrao,
      });

      // Handle tarefas: delete removed, update existing, add new
      const existingTarefaIds = editingTemplate.tarefas?.map(t => t.id) || [];
      const newTarefaIds = data.tarefas.filter(t => t.id).map(t => t.id);
      
      // Delete removed tarefas
      for (const oldId of existingTarefaIds) {
        if (!newTarefaIds.includes(oldId)) {
          await deleteTarefa.mutateAsync(oldId);
        }
      }

      // Update existing and add new
      for (let idx = 0; idx < data.tarefas.length; idx++) {
        const tarefa = data.tarefas[idx];
        if (tarefa.id) {
          await updateTarefa.mutateAsync({
            id: tarefa.id,
            titulo: tarefa.titulo,
            descricao: tarefa.descricao,
            dias_antes_evento: tarefa.dias_antes_evento,
            duracao_horas: tarefa.duracao_horas,
            ordem: tarefa.ordem ?? idx,
          });
        } else {
          await addTarefa.mutateAsync({
            template_id: editingTemplate.id,
            titulo: tarefa.titulo,
            descricao: tarefa.descricao,
            dias_antes_evento: tarefa.dias_antes_evento,
            duracao_horas: tarefa.duracao_horas,
            ordem: tarefa.ordem ?? idx,
          });
        }
      }
    } else {
      // Create new template with tarefas
      await createTemplate.mutateAsync({
        nome: data.nome,
        descricao: data.descricao,
        duracao_dias: data.duracao_dias,
        orcamento_padrao: data.orcamento_padrao,
        local_padrao: data.local_padrao,
        tarefas: data.tarefas.map((t, idx) => ({
          titulo: t.titulo,
          descricao: t.descricao,
          dias_antes_evento: t.dias_antes_evento,
          duracao_horas: t.duracao_horas,
          ordem: t.ordem ?? idx,
        })),
      });
    }

    setFormOpen(false);
    setEditingTemplate(null);
  };

  return (
    <MainLayout 
      title="Templates de Eventos" 
      subtitle="Gerencie modelos de eventos com tarefas pré-definidas"
    >
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Template
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Templates Disponíveis</CardTitle>
            <CardDescription>
              Configure templates para criar eventos rapidamente com tarefas pré-definidas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ListChecks className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum template cadastrado</p>
                <Button variant="outline" className="mt-4" onClick={handleCreate}>
                  Criar primeiro template
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-center">Duração</TableHead>
                    <TableHead className="text-center">Tarefas</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template) => (
                    <TableRow 
                      key={template.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleEdit(template)}
                    >
                      <TableCell className="font-medium">{template.nome}</TableCell>
                      <TableCell className="text-muted-foreground max-w-xs truncate">
                        {template.descricao || '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">
                          {template.duracao_dias || 1} dia(s)
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">
                          {template.tarefas?.length || 0} tarefas
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(template)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicate(template)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setTemplateToDelete(template);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Editar Template' : 'Novo Template de Evento'}
            </DialogTitle>
          </DialogHeader>
          <EventoTemplateForm
            template={editingTemplate}
            onSubmit={handleSubmit}
            onCancel={() => setFormOpen(false)}
            isLoading={createTemplate.isPending || updateTemplate.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Template</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o template "{templateToDelete?.nome}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
