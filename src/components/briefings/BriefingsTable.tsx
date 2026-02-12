import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, Pencil, CheckCircle, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  type Briefing, 
  BRIEFING_STATUS_LABELS, 
  BRIEFING_STATUS_COLORS 
} from '@/types/briefings.types';
import { cn } from '@/lib/utils';

interface BriefingsTableProps {
  briefings: Briefing[];
  isLoading: boolean;
  onView: (briefing: Briefing) => void;
  onEdit: (briefing: Briefing) => void;
  onTriar: (briefing: Briefing) => void;
  onDelete: (id: string) => void;
  canTriar: boolean;
  canEdit: (briefing: Briefing) => boolean;
  canDelete: boolean;
}

export function BriefingsTable({
  briefings,
  isLoading,
  onView,
  onEdit,
  onTriar,
  onDelete,
  canTriar,
  canEdit,
  canDelete,
}: BriefingsTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (briefings.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Nenhum briefing encontrado.
      </div>
    );
  }

  const renderActions = (briefing: Briefing) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onView(briefing)}>
          <Eye className="h-4 w-4 mr-2" />
          Visualizar
        </DropdownMenuItem>
        {canEdit(briefing) && (
          <DropdownMenuItem onClick={() => onEdit(briefing)}>
            <Pencil className="h-4 w-4 mr-2" />
            Editar
          </DropdownMenuItem>
        )}
        {canTriar && briefing.status === 'pendente' && (
          <DropdownMenuItem onClick={() => onTriar(briefing)}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Triar
          </DropdownMenuItem>
        )}
        {canDelete && (
          <DropdownMenuItem 
            onClick={() => onDelete(briefing.id)}
            className="text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <>
      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {briefings.map((briefing) => (
          <Card 
            key={briefing.id} 
            className="p-4 cursor-pointer hover:bg-muted/50"
            onClick={() => canEdit(briefing) ? onEdit(briefing) : onView(briefing)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs text-muted-foreground">{briefing.codigo}</span>
                  <Badge className={cn('font-medium', BRIEFING_STATUS_COLORS[briefing.status])}>
                    {BRIEFING_STATUS_LABELS[briefing.status]}
                  </Badge>
                </div>
                <p className="font-medium">{briefing.cliente}</p>
                <p className="text-sm text-muted-foreground line-clamp-1">{briefing.tema}</p>
              </div>
              <div onClick={(e) => e.stopPropagation()}>
                {renderActions(briefing)}
              </div>
            </div>
            <div className="flex justify-between items-center mt-2 pt-2 border-t text-xs text-muted-foreground">
              <span>Criado: {format(new Date(briefing.created_at), 'dd/MM/yyyy', { locale: ptBR })}</span>
              {briefing.data_entrega && (
                <span>Entrega: {format(new Date(briefing.data_entrega), 'dd/MM/yyyy', { locale: ptBR })}</span>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Tema</TableHead>
              <TableHead className="hidden lg:table-cell">Empreendimento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden lg:table-cell">Criado em</TableHead>
              <TableHead className="hidden lg:table-cell">Entrega</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {briefings.map((briefing) => {
              const handleRowClick = () => {
                if (canEdit(briefing)) {
                  onEdit(briefing);
                } else {
                  onView(briefing);
                }
              };
              
              return (
                <TableRow 
                  key={briefing.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={handleRowClick}
                >
                  <TableCell className="font-mono text-sm">
                    {briefing.codigo}
                  </TableCell>
                  <TableCell>{briefing.cliente}</TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {briefing.tema}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {briefing.empreendimento?.nome || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge className={cn('font-medium', BRIEFING_STATUS_COLORS[briefing.status])}>
                      {BRIEFING_STATUS_LABELS[briefing.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {format(new Date(briefing.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {briefing.data_entrega 
                      ? format(new Date(briefing.data_entrega), 'dd/MM/yyyy', { locale: ptBR })
                      : '-'
                    }
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    {renderActions(briefing)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
