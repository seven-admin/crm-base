export interface KanbanColumn {
  id: string;
  title: string;
  color?: string;
  bgColor?: string;
}

export interface KanbanBoardProps<T> {
  columns: KanbanColumn[];
  items: T[];
  getItemId: (item: T) => string;
  getItemColumn: (item: T) => string;
  renderCard: (item: T, isDragging: boolean) => React.ReactNode;
  onMove: (itemId: string, sourceColumn: string, destinationColumn: string, newIndex: number) => void;
  onMoveWithData?: (item: T, sourceColumn: string, destinationColumn: string) => void;
  isLoading?: boolean;
  columnClassName?: string;
  emptyMessage?: string;
  renderColumnHeader?: (column: KanbanColumn, itemCount: number, items: T[]) => React.ReactNode;
}

export interface KanbanColumnProps<T> {
  column: KanbanColumn;
  items: T[];
  getItemId: (item: T) => string;
  renderCard: (item: T, isDragging: boolean) => React.ReactNode;
  emptyMessage?: string;
  renderHeader?: (column: KanbanColumn, itemCount: number, items: T[]) => React.ReactNode;
  className?: string;
}

export interface KanbanCardWrapperProps {
  id: string;
  index: number;
  children: (isDragging: boolean) => React.ReactNode;
}
