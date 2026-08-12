import { useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatarMoedaCompacta } from '@/lib/formatters';
import { useTopEmpreendimentosReal } from '../useDashboardData';
import { useNexaDashboard } from '@/hooks/useNexaDashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function TopEmpreendimentosTable({ month }: { month: Date }) {
  const { data: emps = [], isLoading } = useTopEmpreendimentosReal(month);
  const { data: nexa } = useNexaDashboard(month);

  // Junta ARQO (leads do mês) + NEXA (propostas e VGV do mês) por empreendimento
  // e mostra os 5 com maior VGV no mês.
  const rows = useMemo(() => {
    const nexaCount = nexa?.porEmpreendimento;
    const nexaVgv = nexa?.vgvPorEmpreendimento;
    return emps
      .map((e) => ({
        ...e,
        nexa: nexaCount?.get(e.id) ?? 0,
        vgv: nexaVgv?.get(e.id) ?? 0,
      }))
      .filter((e) => e.leadsMes > 0 || e.nexa > 0 || e.vgv > 0)
      .sort((a, b) => b.vgv - a.vgv || b.nexa - a.nexa)
      .slice(0, 5);
  }, [emps, nexa]);

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
              <TableHead className="text-[10px] uppercase tracking-[.12em] text-white/35">Tipologia</TableHead>
              <TableHead className="text-right text-[10px] uppercase tracking-[.12em] text-[#ff8a39]/70">Arqo</TableHead>
              <TableHead className="text-right text-[10px] uppercase tracking-[.12em] text-[#ff8a39]/70">Nexa</TableHead>
              <TableHead className="pr-6 text-right text-[10px] uppercase tracking-[.12em] text-white/35 md:pr-7">VGV</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((emp) => (
              <TableRow key={emp.id} className="border-white/10 hover:bg-white/[.04]">
                <TableCell className="pl-6 font-medium text-white md:pl-7">{emp.nome}</TableCell>
                <TableCell><Badge className="border-0 bg-white/[.08] text-[10px] text-white/60">{emp.tipo}</Badge></TableCell>
                <TableCell className="text-right text-white/55 tabular-nums">{emp.leadsMes}</TableCell>
                <TableCell className="text-right text-white/55 tabular-nums">{emp.nexa}</TableCell>
                <TableCell className="pr-6 text-right font-semibold text-white tabular-nums md:pr-7">
                  {formatarMoedaCompacta(emp.vgv)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
