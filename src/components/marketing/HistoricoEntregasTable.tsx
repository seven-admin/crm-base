import { format, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CATEGORIA_LABELS } from '@/types/marketing.types';
import type { CategoriaTicket } from '@/types/marketing.types';

interface TicketRecente {
  id: string;
  codigo: string;
  titulo: string;
  status: string;
  supervisor_id: string;
  supervisor_nome: string;
  data_entrega: string | null;
  data_previsao: string | null;
  categoria: string;
}

interface HistoricoEntregasTableProps {
  tickets: TicketRecente[];
}

export function HistoricoEntregasTable({ tickets }: HistoricoEntregasTableProps) {
  const getStatusEntrega = (dataEntrega: string | null, dataPrevisao: string | null) => {
    if (!dataEntrega) return null;
    if (!dataPrevisao) return { label: 'Entregue', variant: 'default' as const };
    
    const entrega = parseISO(dataEntrega);
    const previsao = parseISO(dataPrevisao);
    const diff = differenceInDays(entrega, previsao);
    
    if (diff <= 0) {
      return { label: 'No prazo', variant: 'default' as const };
    } else {
      return { label: `${diff}d atrasado`, variant: 'destructive' as const };
    }
  };

  if (tickets.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhuma entrega recente encontrada.
      </div>
    );
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Código</TableHead>
            <TableHead>Título</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Responsável</TableHead>
            <TableHead>Data Entrega</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((ticket) => {
            const statusEntrega = getStatusEntrega(ticket.data_entrega, ticket.data_previsao);
            return (
              <TableRow key={ticket.id}>
                <TableCell className="font-mono text-xs">{ticket.codigo}</TableCell>
                <TableCell className="font-medium max-w-[200px] truncate">
                  {ticket.titulo}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {CATEGORIA_LABELS[ticket.categoria as CategoriaTicket] || ticket.categoria}
                  </Badge>
                </TableCell>
                <TableCell>{ticket.supervisor_nome}</TableCell>
                <TableCell>
                  {ticket.data_entrega 
                    ? format(parseISO(ticket.data_entrega), 'dd/MM/yyyy', { locale: ptBR })
                    : '-'
                  }
                </TableCell>
                <TableCell>
                  {statusEntrega && (
                    <Badge variant={statusEntrega.variant} className="text-xs">
                      {statusEntrega.label}
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
