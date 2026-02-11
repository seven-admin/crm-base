import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Users, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { useLancamentos } from '@/hooks/useFinanceiro';
import { useFuncionariosSeven } from '@/hooks/useFuncionariosSeven';
import { STATUS_LANCAMENTO_LABELS, STATUS_LANCAMENTO_COLORS } from '@/types/financeiro.types';
import type { LancamentoFinanceiro, StatusLancamento } from '@/types/financeiro.types';

interface RelatorioRessarcimentosProps {
  startDate: string;
  endDate: string;
}

interface FuncionarioResumo {
  id: string;
  nome: string;
  lancamentos: LancamentoFinanceiro[];
  totalPendente: number;
  totalPago: number;
  totalGeral: number;
}

export function RelatorioRessarcimentos({ startDate, endDate }: RelatorioRessarcimentosProps) {
  const [statusFilter, setStatusFilter] = useState<'todos' | 'pendente' | 'pago'>('todos');
  const [funcionarioFilter, setFuncionarioFilter] = useState<string>('todos');
  const [openRows, setOpenRows] = useState<Set<string>>(new Set());

  const { data: lancamentos = [], isLoading } = useLancamentos({
    data_inicio: startDate,
    data_fim: endDate,
    status: statusFilter !== 'todos' ? statusFilter as StatusLancamento : undefined,
  });
  const { data: profiles = [] } = useFuncionariosSeven();

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  // Filter only lancamentos with beneficiario
  const resumoPorFuncionario = useMemo(() => {
    const comBeneficiario = lancamentos.filter(
      (l: any) => l.beneficiario_id != null
    );

    const grouped = new Map<string, LancamentoFinanceiro[]>();
    for (const l of comBeneficiario) {
      const key = (l as any).beneficiario_id;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(l);
    }

    const resumos: FuncionarioResumo[] = [];
    grouped.forEach((items, id) => {
      const nome = (items[0] as any).beneficiario?.full_name || 'Sem nome';
      const totalPendente = items.filter(l => l.status === 'pendente').reduce((s, l) => s + l.valor, 0);
      const totalPago = items.filter(l => l.status === 'pago').reduce((s, l) => s + l.valor, 0);
      resumos.push({
        id,
        nome,
        lancamentos: items,
        totalPendente,
        totalPago,
        totalGeral: totalPendente + totalPago,
      });
    });

    resumos.sort((a, b) => a.nome.localeCompare(b.nome));

    if (funcionarioFilter !== 'todos') {
      return resumos.filter(r => r.id === funcionarioFilter);
    }
    return resumos;
  }, [lancamentos, funcionarioFilter]);

  const totaisGerais = useMemo(() => ({
    pendente: resumoPorFuncionario.reduce((s, r) => s + r.totalPendente, 0),
    pago: resumoPorFuncionario.reduce((s, r) => s + r.totalPago, 0),
    geral: resumoPorFuncionario.reduce((s, r) => s + r.totalGeral, 0),
    lancamentos: resumoPorFuncionario.reduce((s, r) => s + r.lancamentos.length, 0),
  }), [resumoPorFuncionario]);

  const toggleRow = (id: string) => {
    setOpenRows(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-center">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="pago">Pago</SelectItem>
          </SelectContent>
        </Select>

        <Select value={funcionarioFilter} onValueChange={setFuncionarioFilter}>
          <SelectTrigger className="w-[220px]">
            <Users className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Funcionário" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os funcionários</SelectItem>
            {profiles.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="text-sm text-muted-foreground ml-auto">
          {resumoPorFuncionario.length} funcionário(s) • {totaisGerais.lancamentos} lançamento(s)
        </span>
      </div>

      {/* Tabela consolidada */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10" />
                <TableHead>Funcionário</TableHead>
                <TableHead className="text-center">Qtd.</TableHead>
                <TableHead className="text-right">Pendente</TableHead>
                <TableHead className="text-right">Pago</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : resumoPorFuncionario.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    Nenhum ressarcimento encontrado no período
                  </TableCell>
                </TableRow>
              ) : (
                resumoPorFuncionario.map(func => (
                  <Collapsible key={func.id} open={openRows.has(func.id)} onOpenChange={() => toggleRow(func.id)} asChild>
                    <>
                      <CollapsibleTrigger asChild>
                        <TableRow className="cursor-pointer hover:bg-muted/50">
                          <TableCell>
                            {openRows.has(func.id)
                              ? <ChevronDown className="h-4 w-4" />
                              : <ChevronRight className="h-4 w-4" />
                            }
                          </TableCell>
                          <TableCell className="font-medium">{func.nome}</TableCell>
                          <TableCell className="text-center">{func.lancamentos.length}</TableCell>
                          <TableCell className="text-right text-yellow-700">{formatCurrency(func.totalPendente)}</TableCell>
                          <TableCell className="text-right text-green-700">{formatCurrency(func.totalPago)}</TableCell>
                          <TableCell className="text-right font-semibold">{formatCurrency(func.totalGeral)}</TableCell>
                        </TableRow>
                      </CollapsibleTrigger>
                      <CollapsibleContent asChild>
                        <>
                          {func.lancamentos.map(l => (
                            <TableRow key={l.id} className="bg-muted/20">
                              <TableCell />
                              <TableCell className="pl-10 text-sm">
                                {format(new Date(l.data_vencimento), 'dd/MM/yyyy')} — {l.descricao}
                              </TableCell>
                              <TableCell className="text-center text-sm text-muted-foreground">
                                {(l as any).categoria_fluxo || '-'}
                              </TableCell>
                              <TableCell />
                              <TableCell className="text-right text-sm">{formatCurrency(l.valor)}</TableCell>
                              <TableCell className="text-right">
                                <Badge className={STATUS_LANCAMENTO_COLORS[l.status]}>
                                  {STATUS_LANCAMENTO_LABELS[l.status]}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </>
                      </CollapsibleContent>
                    </>
                  </Collapsible>
                ))
              )}
              {/* Totalizador */}
              {resumoPorFuncionario.length > 0 && (
                <TableRow className="border-t-2 font-semibold bg-muted/30">
                  <TableCell />
                  <TableCell>TOTAL GERAL</TableCell>
                  <TableCell className="text-center">{totaisGerais.lancamentos}</TableCell>
                  <TableCell className="text-right text-yellow-700">{formatCurrency(totaisGerais.pendente)}</TableCell>
                  <TableCell className="text-right text-green-700">{formatCurrency(totaisGerais.pago)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(totaisGerais.geral)}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
