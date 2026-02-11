import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useEventoTemplates, EventoTemplate } from '@/hooks/useEventoTemplates';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Clock, ListTodo, FileText } from 'lucide-react';

interface SelecionarTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (template: EventoTemplate) => void;
  onSkip: () => void;
}

export function SelecionarTemplateDialog({
  open,
  onOpenChange,
  onSelectTemplate,
  onSkip,
}: SelecionarTemplateDialogProps) {
  const { templates, isLoading } = useEventoTemplates();
  const [selected, setSelected] = useState<string | null>(null);

  const handleConfirm = () => {
    const template = templates?.find((t) => t.id === selected);
    if (template) {
      onSelectTemplate(template);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Evento a partir de Template</DialogTitle>
          <DialogDescription>
            Escolha um modelo para pré-configurar seu evento ou crie do zero.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : templates?.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              Nenhum template disponível ainda.
            </p>
            <Button onClick={onSkip}>Criar Evento do Zero</Button>
          </div>
        ) : (
          <>
            <div className="grid gap-3">
              {templates?.map((template) => (
                <Card
                  key={template.id}
                  className={`cursor-pointer transition-all ${
                    selected === template.id
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => setSelected(template.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold">{template.nome}</h3>
                        {template.descricao && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {template.descricao}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-3 mt-3">
                          <Badge variant="secondary" className="gap-1">
                            <Calendar className="h-3 w-3" />
                            {template.duracao_dias} dia{template.duracao_dias !== 1 ? 's' : ''}
                          </Badge>
                          {template.tarefas && template.tarefas.length > 0 && (
                            <Badge variant="secondary" className="gap-1">
                              <ListTodo className="h-3 w-3" />
                              {template.tarefas.length} tarefa{template.tarefas.length !== 1 ? 's' : ''}
                            </Badge>
                          )}
                          {template.orcamento_padrao && template.orcamento_padrao > 0 && (
                            <Badge variant="secondary">
                              R$ {template.orcamento_padrao.toLocaleString('pt-BR')}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-between pt-4 border-t">
              <Button variant="ghost" onClick={onSkip}>
                Criar do Zero
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleConfirm} disabled={!selected}>
                  Usar Template
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
