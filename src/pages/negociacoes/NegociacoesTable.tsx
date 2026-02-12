import { useNavigate } from 'react-router-dom';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, History, ArrowRight, Trash2, Loader2 } from 'lucide-react';
import { Negociacao, STATUS_PROPOSTA_LABELS, STATUS_PROPOSTA_COLORS, StatusProposta } from '@/types/negociacoes.types';
import { formatarMoedaCompacta } from '@/lib/formatters';
import { PaginationControls } from '@/components/ui/pagination-controls';

interface NegociacoesTableProps {
  negociacoes: Negociacao[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onMover: (negociacao: Negociacao) => void;
  onHistorico: (negociacao: Negociacao) => void;
  onExcluir: (negociacao: Negociacao) => void;
}

export function NegociacoesTable({
  negociacoes,
  isLoading,
  page,
  totalPages,
  totalItems,
  onPageChange,
  onMover,
  onHistorico,
  onExcluir,
}: NegociacoesTableProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (negociacoes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed rounded-lg">
        <h3 className="font-medium mb-2">Nenhuma ficha encontrada</h3>
        <p className="text-muted-foreground text-sm">
          Ajuste os filtros ou crie uma nova ficha de proposta.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead className="hidden lg:table-cell">Empreendimento</TableHead>
              <TableHead className="hidden xl:table-cell">Gestor</TableHead>
              <TableHead className="hidden md:table-cell">Corretor</TableHead>
              <TableHead className="hidden lg:table-cell text-center">Unid.</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="hidden md:table-cell">Status</TableHead>
              <TableHead className="hidden lg:table-cell">Etapa</TableHead>
              <TableHead className="hidden xl:table-cell">Criação</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {negociacoes.map((neg) => (
              <TableRow
                key={neg.id}
                className="cursor-pointer"
                onClick={() => navigate(`/negociacoes/editar/${neg.id}`)}
              >
                <TableCell>
                  <span className="font-mono text-xs">{neg.codigo}</span>
                  {neg.numero_proposta && (
                    <span className="block text-[10px] text-muted-foreground">
                      {neg.numero_proposta}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <span className="font-medium text-sm">
                    {neg.cliente?.nome || '-'}
                  </span>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <span className="text-sm text-muted-foreground">
                    {neg.empreendimento?.nome || '-'}
                  </span>
                </TableCell>
                <TableCell className="hidden xl:table-cell">
                  <span className="text-sm text-muted-foreground">
                    {neg.gestor?.full_name || '-'}
                  </span>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <span className="text-sm text-muted-foreground">
                    {neg.corretor?.nome_completo || '-'}
                  </span>
                </TableCell>
                <TableCell className="hidden lg:table-cell text-center">
                  <Badge variant="secondary" className="text-xs">
                    {neg.unidades?.length || 0}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <span className="font-medium text-sm">
                    {formatarMoedaCompacta(neg.valor_proposta || neg.valor_negociacao || 0)}
                  </span>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {neg.status_proposta ? (
                    <Badge
                      className="text-[10px] text-white"
                      style={{
                        backgroundColor: STATUS_PROPOSTA_COLORS[neg.status_proposta as StatusProposta] || undefined,
                      }}
                    >
                      {STATUS_PROPOSTA_LABELS[neg.status_proposta as StatusProposta] || neg.status_proposta}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {neg.funil_etapa ? (
                    <Badge
                      className="text-[10px] text-white"
                      style={{ backgroundColor: neg.funil_etapa.cor }}
                    >
                      {neg.funil_etapa.nome}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="hidden xl:table-cell">
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(neg.created_at), 'dd/MM/yy', { locale: ptBR })}
                  </span>
                </TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/negociacoes/editar/${neg.id}`)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onHistorico(neg)}>
                        <History className="h-4 w-4 mr-2" />
                        Histórico
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onMover(neg)}>
                        <ArrowRight className="h-4 w-4 mr-2" />
                        Mover Etapa
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onExcluir(neg)} className="text-destructive">
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

      <PaginationControls
        page={page}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={onPageChange}
      />
    </div>
  );
}
