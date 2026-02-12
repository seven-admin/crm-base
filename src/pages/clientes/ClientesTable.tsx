import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Cliente } from '@/types/clientes.types';
import { ClipboardList, Edit, MessageSquare, MoreVertical, RefreshCw, Trash2, UserCheck, UserX } from 'lucide-react';

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
  onToggleSelectAll: () => void;
};

export function ClientesTable({
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
  onToggleSelectAll,
}: Props) {
  const allSelected = clientes.length > 0 && selectedIds.size === clientes.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < clientes.length;

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                ref={(ref) => {
                  if (ref) {
                    (ref as any).indeterminate = someSelected;
                  }
                }}
                onCheckedChange={onToggleSelectAll}
                aria-label="Selecionar todos"
              />
            </TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>Telefone</TableHead>
            <TableHead>WhatsApp</TableHead>
            <TableHead>Cidade</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Gestor de Produto</TableHead>
            <TableHead className="w-[50px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clientes.map((cliente) => (
            <TableRow
              key={cliente.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onOpenQuickView(cliente)}
            >
              <TableCell onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={selectedIds.has(cliente.id)}
                  onCheckedChange={() => onToggleSelect(cliente.id)}
                  aria-label={`Selecionar ${cliente.nome}`}
                />
              </TableCell>
              <TableCell>
                <p className="text-[13px]">{cliente.nome}</p>
              </TableCell>
              <TableCell>{cliente.telefone || '-'}</TableCell>
              <TableCell>{cliente.whatsapp || '-'}</TableCell>
              <TableCell>{cliente.endereco_cidade || '-'}</TableCell>
              <TableCell>{cliente.endereco_uf || '-'}</TableCell>
              <TableCell>{(cliente as any).gestor?.full_name || '-'}</TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
