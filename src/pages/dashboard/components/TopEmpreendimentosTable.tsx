import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatarMoedaCompacta } from '@/lib/formatters';
import { useTopEmpreendimentosReal } from '../useDashboardData';
import { Skeleton } from '@/components/ui/skeleton';

export function TopEmpreendimentosTable() {
  const { data: rows = [], isLoading } = useTopEmpreendimentosReal();

  return (
    <div className="bg-card rounded-2xl border border-border/60 shadow-card overflow-hidden">
      <div className="px-6 py-5 border-b border-border">
        <h2 className="text-base font-semibold text-foreground">Top empreendimentos</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Ordenado por VGV em negociação</p>
      </div>

      {isLoading ? (
        <div className="p-6"><Skeleton className="h-40 rounded-lg" /></div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground py-10 text-center">Nenhum empreendimento com movimentação.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empreendimento</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Leads ativos</TableHead>
              <TableHead className="text-right">Propostas</TableHead>
              <TableHead className="text-right">Vendas no mês</TableHead>
              <TableHead className="text-right">VGV negociado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((emp) => (
              <TableRow key={emp.id}>
                <TableCell className="font-medium text-foreground">{emp.nome}</TableCell>
                <TableCell><Badge variant="secondary">{emp.tipo}</Badge></TableCell>
                <TableCell className="text-right tabular-nums">{emp.leadsAtivos}</TableCell>
                <TableCell className="text-right tabular-nums">{emp.propostas}</TableCell>
                <TableCell className="text-right tabular-nums">{emp.vendasMes}</TableCell>
                <TableCell className="text-right tabular-nums font-semibold">
                  {formatarMoedaCompacta(emp.vgvNegociado)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
