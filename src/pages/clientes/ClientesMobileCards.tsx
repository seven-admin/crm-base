import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import type { Cliente, ClienteFase } from '@/types/clientes.types';
import {
  CLIENTE_FASE_COLORS,
  CLIENTE_FASE_LABELS,
} from '@/types/clientes.types';
import { ClipboardList, Edit, MessageSquare, MoreVertical, RefreshCw, Trash2, UserCheck, UserX } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  clientes: Cliente[];
  onOpenQuickView: (cliente: Cliente) => void;
  onOpenInteracoes: (cliente: Cliente) => void;
  onOpenHistorico: (cliente: Cliente) => void;
  onEdit: (cliente: Cliente) => void;
  onDelete: (cliente: Cliente) => void;
  onQualificar: (id: string) => void;
  onMarcarPerdido: (id: string) => void;
  onReativar: (id: string) => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
};

const getFaseBadge = (fase: ClienteFase) => (
  <Badge variant="outline" className={cn('text-xs', CLIENTE_FASE_COLORS[fase])}>
    {CLIENTE_FASE_LABELS[fase]}
  </Badge>
);


export function ClientesMobileCards({
  clientes,
  onOpenQuickView,
  onOpenInteracoes,
  onOpenHistorico,
  onEdit,
  onDelete,
  onQualificar,
  onMarcarPerdido,
  onReativar,
  selectedIds,
  onToggleSelect,
}: Props) {
  return (
    <div className="space-y-3">
      {clientes.map((cliente) => (
        <Card key={cliente.id} className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1">
              <Checkbox
                checked={selectedIds.has(cliente.id)}
                onCheckedChange={() => onToggleSelect(cliente.id)}
                aria-label={`Selecionar ${cliente.nome}`}
                className="mt-1"
              />
              <div className="flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => onOpenQuickView(cliente)}
                  className="text-left hover:underline truncate block"
                >
                  {cliente.nome}
                </button>
                <p className="text-sm text-muted-foreground truncate">{cliente.email || '-'}</p>
                <p className="text-sm text-muted-foreground">{cliente.telefone || '-'}</p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onOpenInteracoes(cliente)}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Interações
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onOpenHistorico(cliente)}>
                  <ClipboardList className="h-4 w-4 mr-2" />
                  Histórico (Atividades)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(cliente)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuSeparator />

                {cliente.fase === 'prospecto' && (
                  <DropdownMenuItem onClick={() => onQualificar(cliente.id)}>
                    <UserCheck className="h-4 w-4 mr-2" />
                    Qualificar
                  </DropdownMenuItem>
                )}
                {cliente.fase !== 'perdido' && cliente.fase !== 'comprador' && (
                  <DropdownMenuItem onClick={() => onMarcarPerdido(cliente.id)}>
                    <UserX className="h-4 w-4 mr-2" />
                    Marcar Perdido
                  </DropdownMenuItem>
                )}
                {cliente.fase === 'perdido' && (
                  <DropdownMenuItem onClick={() => onReativar(cliente.id)}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reativar
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={() => onDelete(cliente)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-2 mt-3 flex-wrap ml-8">
            {getFaseBadge(cliente.fase)}
            {cliente.origem && (
              <Badge variant="outline" className="text-xs">
                {cliente.origem}
              </Badge>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
