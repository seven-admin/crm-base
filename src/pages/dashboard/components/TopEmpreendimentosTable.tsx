import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatarMoedaCompacta } from '@/lib/formatters';
import { useTopEmpreendimentosReal } from '../useDashboardData';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function TopEmpreendimentosTable() {
  const { data: rows = [], isLoading } = useTopEmpreendimentosReal();

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-black/[.06] bg-[#201a17] text-white">
      <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-6 md:px-7 md:py-7">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.19em] text-[#ff8a39]">Portfólio</p>
          <h2 className="mt-2 text-xl font-semibold tracking-[-0.035em] text-white">Empreendimentos em destaque</h2>
          <p className="mt-1 text-sm text-white/45">Desempenho por VGV em negociação</p>
        </div>
        <Link to="/empreendimentos" aria-label="Ver empreendimentos" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 text-white/70 transition-colors hover:border-[#ff7417] hover:bg-[#ff7417] hover:text-[#201a17]">
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      {isLoading ? (
        <div className="p-6"><Skeleton className="h-40 rounded-2xl bg-white/10" /></div>
      ) : rows.length === 0 ? (
        <p className="py-10 text-center text-sm text-white/45">Nenhum empreendimento com movimentação.</p>
      ) : (
        <Table className="text-white">
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="pl-6 text-[10px] uppercase tracking-[.12em] text-white/35 md:pl-7">Empreendimento</TableHead>
              <TableHead className="text-[10px] uppercase tracking-[.12em] text-white/35">Tipo</TableHead>
              <TableHead className="text-right text-[10px] uppercase tracking-[.12em] text-white/35">Leads</TableHead>
              <TableHead className="text-right text-[10px] uppercase tracking-[.12em] text-white/35">Prop.</TableHead>
              <TableHead className="text-right text-[10px] uppercase tracking-[.12em] text-white/35">Vendas</TableHead>
              <TableHead className="pr-6 text-right text-[10px] uppercase tracking-[.12em] text-white/35 md:pr-7">VGV</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((emp) => (
              <TableRow key={emp.id} className="border-white/10 hover:bg-white/[.04]">
                <TableCell className="pl-6 font-medium text-white md:pl-7">{emp.nome}</TableCell>
                <TableCell><Badge className="border-0 bg-white/[.08] text-[10px] text-white/60">{emp.tipo}</Badge></TableCell>
                <TableCell className="text-right text-white/55 tabular-nums">{emp.leadsAtivos}</TableCell>
                <TableCell className="text-right text-white/55 tabular-nums">{emp.propostas}</TableCell>
                <TableCell className="text-right text-white/55 tabular-nums">{emp.vendasMes}</TableCell>
                <TableCell className="pr-6 text-right font-semibold text-white tabular-nums md:pr-7">
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
