// TODO: substituir por dados reais
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatarMoedaCompacta } from '@/lib/formatters';
import { mockTopEmpreendimentos } from '../mockData';

const tipoVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  Vertical: 'default',
  Loteamento: 'secondary',
  Comercial: 'outline',
};

export function TopEmpreendimentosTable() {
  const rows = [...mockTopEmpreendimentos].sort((a, b) => b.vgvNegociado - a.vgvNegociado).slice(0, 5);

  return (
    <div className="bg-card rounded-2xl shadow-card overflow-hidden">
      <div className="px-6 py-5 border-b border-border">
        <h2 className="text-base font-semibold text-foreground">Top empreendimentos</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Ordenado por VGV em negociação</p>
      </div>

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
            <TableRow key={emp.nome}>
              <TableCell className="font-medium text-foreground">{emp.nome}</TableCell>
              <TableCell>
                <Badge variant={tipoVariant[emp.tipo]}>{emp.tipo}</Badge>
              </TableCell>
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
    </div>
  );
}
