import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { GripVertical, RotateCcw } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import type { TVLayoutItem } from '@/types/tvLayout.types';

interface TVLayoutConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: TVLayoutItem[];
  onToggleVisibility: (id: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onReset: () => void;
}

export function TVLayoutConfigDialog({
  open,
  onOpenChange,
  config,
  onToggleVisibility,
  onReorder,
  onReset,
}: TVLayoutConfigDialogProps) {
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    if (result.source.index === result.destination.index) return;
    onReorder(result.source.index, result.destination.index);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Configurar Layout do Modo TV</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-4">
            Escolha quais widgets exibir e arraste para reordenar.
          </p>
          
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="tv-layout-items">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="space-y-2"
                >
                  {config.map((item, index) => (
                    <Draggable key={item.id} draggableId={item.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                            snapshot.isDragging 
                              ? 'bg-accent border-primary shadow-lg' 
                              : 'bg-card border-border hover:bg-accent/50'
                          }`}
                        >
                          <div
                            {...provided.dragHandleProps}
                            className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
                          >
                            <GripVertical className="h-5 w-5" />
                          </div>
                          
                          <Checkbox
                            id={item.id}
                            checked={item.visible}
                            onCheckedChange={() => onToggleVisibility(item.id)}
                          />
                          
                          <label
                            htmlFor={item.id}
                            className={`flex-1 text-sm cursor-pointer ${
                              item.visible ? 'text-foreground' : 'text-muted-foreground'
                            }`}
                          >
                            {item.title}
                          </label>
                          
                          <span className="text-xs text-muted-foreground capitalize">
                            {item.type}
                          </span>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>

        <DialogFooter className="flex-row justify-between sm:justify-between">
          <Button variant="outline" size="sm" onClick={onReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Restaurar Padrão
          </Button>
          <Button onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
