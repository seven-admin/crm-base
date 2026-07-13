import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Download, FileText, Settings2, Variable, Blocks } from 'lucide-react';
import { useContratos, downloadContratoPdf } from '@/hooks/useNexaContratos';

export default function NexaContratos() {
  const { data: contratos, isLoading } = useContratos();

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
      <div className="border rounded-lg bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Empreendimento</TableHead>
              <TableHead>Modelo</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24">PDF</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={8}>Carregando…</TableCell></TableRow>}
            {!isLoading && !contratos?.length && (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                <FileText className="h-10 w-10 mx-auto mb-2 opacity-40" />
                Nenhum contrato gerado.
              </TableCell></TableRow>
            )}
            {contratos?.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-mono text-xs">{c.numero || '—'}</TableCell>
                <TableCell>{c.cliente?.nome || '—'}</TableCell>
                <TableCell>{c.empreendimento?.nome || '—'}</TableCell>
                <TableCell>{c.template?.nome || '—'}</TableCell>
                <TableCell>{(c.valor_contrato ?? c.valor) ? Number(c.valor_contrato ?? c.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—'}</TableCell>
                <TableCell>{c.data_geracao ? format(new Date(c.data_geracao), 'dd/MM/yyyy') : '—'}</TableCell>
                <TableCell><Badge variant="outline">{c.status}</Badge></TableCell>
                <TableCell>
                  {c.pdf_url ? (
                    <Button size="icon" variant="ghost" onClick={() => downloadContratoPdf(c.pdf_url!)}>
                      <Download className="h-4 w-4" />
                    </Button>
                  ) : '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </MainLayout>
  );
}
