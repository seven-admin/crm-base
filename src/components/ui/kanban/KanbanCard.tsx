import { Draggable } from '@hello-pangea/dnd';
import { KanbanCardWrapperProps } from './types';
import { cn } from '@/lib/utils';

export function KanbanCardWrapper({ id, index, children }: KanbanCardWrapperProps) {
  return (
    <Draggable draggableId={id} index={index}>
      {(provided, snapshot) => {
        // Estilo simplificado - deixar dnd controlar durante drag
        const style = {
          ...provided.draggableProps.style,
          transition: snapshot.isDragging 
            ? undefined 
            : snapshot.isDropAnimating 
              ? 'all 0.12s ease-out' 
              : undefined,
        };

        return (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={cn(
              "mb-2",
              snapshot.isDragging && "z-50 rotate-[2deg] scale-[1.02] shadow-2xl"
            )}
            style={style}
          >
            {children(snapshot.isDragging)}
          </div>
        );
      }}
    </Draggable>
  );
}
