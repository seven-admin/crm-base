import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, DollarSign, Search, Eye, Pencil, Trash2 } from 'lucide-react';
import type { Comissao } from '@/types/comissoes.types';
import { COMISSAO_STATUS_LABELS, COMISSAO_STATUS_COLORS } from '@/types/comissoes.types';

interface ComissoesTableProps {
  comissoes: Comissao[];
  isLoading: boolean;
  onView: (id: string) => void;
  onEdit?: (comissao: Comissao) => void;
  onRegistrarPagamento: (comissao: Comissao) => void;
  onDelete: (id: string) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

export function ComissoesTable({
  comissoes,
  isLoading,
  onView,
  onEdit,
  onRegistrarPagamento,
  onDelete,
  canEdit = false,
  canDelete = false,
}: ComissoesTableProps) {
  const [search, setSearch] = useState('');

  const filteredComissoes = comissoes.filter((c) => {
    const searchLower = search.toLowerCase();
    return (
      c.numero.toLowerCase().includes(searchLower) ||
      c.empreendimento?.nome?.toLowerCase().includes(searchLower) ||
      c.gestor?.full_name?.toLowerCase().includes(searchLower)
    );
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const renderDropdownContent = (comissao: Comissao) => (
    <DropdownMenuContent align="end">
      <DropdownMenuItem onClick={() => onView(comissao.id)}>
        <Eye className="mr-2 h-4 w-4" />
        Ver Detalhes
      </DropdownMenuItem>
      
      {canEdit && onEdit && (
        <DropdownMenuItem onClick={() => onEdit(comissao)}>
          <Pencil className="mr-2 h-4 w-4" />
          Editar
        </DropdownMenuItem>
      )}
      
      {comissao.status === 'pendente' && (comissao.valor_comissao || 0) > 0 && (
        <DropdownMenuItem onClick={() => onRegistrarPagamento(comissao)}>
          <DollarSign className="mr-2 h-4 w-4" />
          Registrar Pagamento
        </DropdownMenuItem>
      )}
      
      {canDelete && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => onDelete(comissao.id)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir
          </DropdownMenuItem>
        </>
      )}
    </DropdownMenuContent>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar comissões..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {filteredComissoes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma comissão encontrada.
          </div>
        ) : (
          filteredComissoes.map((comissao) => (
            <Card 
              key={comissao.id}
              className="p-4 cursor-pointer hover:bg-muted/50"
              onClick={() => onView(comissao.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{comissao.numero}</span>
                    <Badge className={COMISSAO_STATUS_COLORS[comissao.status]}>
                      {COMISSAO_STATUS_LABELS[comissao.status]}
                    </Badge>
                  </div>
                  <p className="text-sm">{comissao.empreendimento?.nome || '-'}</p>
                  <p className="text-sm text-muted-foreground">{comissao.gestor?.full_name || '-'}</p>
                  {comissao.corretor && (
                    <p className="text-xs text-muted-foreground">Corretor: {comissao.corretor.nome_completo}</p>
                  )}
                  {comissao.imobiliaria && (
                    <p className="text-xs text-muted-foreground">Imob: {comissao.imobiliaria.nome}</p>
                  )}
                </div>
                <div onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    {renderDropdownContent(comissao)}
                  </DropdownMenu>
                </div>
              </div>
              <div className="flex justify-between items-center mt-2 pt-2 border-t text-sm">
                <span className="text-muted-foreground">Venda: {formatCurrency(comissao.valor_venda)}</span>
                <span className="font-medium text-green-600">
                  {formatCurrency(comissao.valor_comissao || 0)}
                  <span className="text-muted-foreground text-xs ml-1">
                    ({comissao.percentual_comissao || 0}%)
                  </span>
                </span>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Empreendimento</TableHead>
              <TableHead className="hidden lg:table-cell">Gestor</TableHead>
              <TableHead className="hidden xl:table-cell">Corretor</TableHead>
              <TableHead className="hidden xl:table-cell">Imobiliária</TableHead>
              <TableHead className="text-right">Valor Venda</TableHead>
              <TableHead className="text-right">Comissão</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredComissoes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground">
                  Nenhuma comissão encontrada.
                </TableCell>
              </TableRow>
            ) : (
              filteredComissoes.map((comissao) => (
                <TableRow 
                  key={comissao.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onView(comissao.id)}
                >
                  <TableCell className="font-medium">{comissao.numero}</TableCell>
                  <TableCell>{comissao.empreendimento?.nome || '-'}</TableCell>
                  <TableCell className="hidden lg:table-cell">{comissao.gestor?.full_name || '-'}</TableCell>
                  <TableCell className="hidden xl:table-cell">{comissao.corretor?.nome_completo || '-'}</TableCell>
                  <TableCell className="hidden xl:table-cell">{comissao.imobiliaria?.nome || '-'}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(comissao.valor_venda)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(comissao.valor_comissao || 0)}
                    <span className="text-muted-foreground text-xs ml-1">
                      ({comissao.percentual_comissao || 0}%)
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge className={COMISSAO_STATUS_COLORS[comissao.status]}>
                      {COMISSAO_STATUS_LABELS[comissao.status]}
                    </Badge>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      {renderDropdownContent(comissao)}
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
