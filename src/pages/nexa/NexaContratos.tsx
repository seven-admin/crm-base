import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Plus, Download, FileText, Settings2, Variable, Blocks, Trash2 } from 'lucide-react';
import { useContratos, downloadContratoPdf, useUpdateContratoStatus, useDeleteContrato } from '@/hooks/useNexaContratos';
import { CONTRATO_STATUS_LABELS, CONTRATO_STATUS_COLORS, type ContratoStatus } from '@/types/contratos.types';

const STATUS_OPCOES = Object.keys(CONTRATO_STATUS_LABELS) as ContratoStatus[];

export default function NexaContratos() {
  const { data: contratos, isLoading } = useContratos();
  const updateStatus = useUpdateContratoStatus();
  const deleteContrato = useDeleteContrato();

  return (
    <MainLayout
      title="Contratos Nexa"
      subtitle="Contratos gerados a partir de modelos."
      actions={
        <div className="flex gap-2">
          <Button variant="outline" asChild><Link to="/nexa/contratos/variaveis"><Variable className="h-4 w-4 mr-2" />Variáveis</Link></Button>
          <Button variant="outline" asChild><Link to="/nexa/contratos/blocos"><Blocks className="h-4 w-4 mr-2" />Blocos</Link></Button>
          <Button variant="outline" asChild><Link to="/nexa/contratos/modelos"><Settings2 className="h-4 w-4 mr-2" />Modelos</Link></Button>
          <Button asChild><Link to="/nexa/contratos/novo"><Plus className="h-4 w-4 mr-2" />Novo contrato</Link></Button>
        </div>
      }
    >
      <div className="overflow-hidden rounded-[1.5rem] border border-border/70 bg-card shadow-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Empreendimento</TableHead>
              <TableHead>Modelo</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="w-48">Status</TableHead>
              <TableHead className="w-24">PDF</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={9}>Carregando…</TableCell></TableRow>}
            {!isLoading && !contratos?.length && (
              <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-12">
                <FileText className="h-10 w-10 mx-auto mb-2 opacity-40" />
                Nenhum contrato gerado.
              </TableCell></TableRow>
            )}
            {contratos?.map((c) => {
              const status = c.status as ContratoStatus;
              const corStatus = CONTRATO_STATUS_COLORS[status] || 'bg-slate-500';
              return (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-xs">{c.numero || '—'}</TableCell>
                  <TableCell>{c.cliente?.nome || '—'}</TableCell>
                  <TableCell>{c.empreendimento?.nome || '—'}</TableCell>
                  <TableCell>{c.template?.nome || '—'}</TableCell>
                  <TableCell>{(c.valor_contrato ?? c.valor) ? Number(c.valor_contrato ?? c.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—'}</TableCell>
                  <TableCell>{c.data_geracao ? format(new Date(c.data_geracao), 'dd/MM/yyyy') : '—'}</TableCell>
                  <TableCell>
                    <Select
                      value={status}
                      onValueChange={(v) => updateStatus.mutate({ id: c.id, status: v })}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <span className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${corStatus}`} />
                          <SelectValue>{CONTRATO_STATUS_LABELS[status] || c.status}</SelectValue>
                        </span>
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPCOES.map((s) => (
                          <SelectItem key={s} value={s}>
                            <span className="flex items-center gap-2">
                              <span className={`h-2 w-2 rounded-full ${CONTRATO_STATUS_COLORS[s]}`} />
                              {CONTRATO_STATUS_LABELS[s]}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {c.pdf_url ? (
                      <Button size="icon" variant="ghost" onClick={() => downloadContratoPdf(c.pdf_url!)}>
                        <Download className="h-4 w-4" />
                      </Button>
                    ) : '—'}
                  </TableCell>
                  <TableCell>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="icon" variant="ghost" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir contrato?</AlertDialogTitle>
                          <AlertDialogDescription>
                            O contrato {c.numero ? `"${c.numero}"` : ''} será removido permanentemente. O PDF já gerado não será apagado do armazenamento.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteContrato.mutate(c.id)}>Excluir</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </MainLayout>
  );
}
