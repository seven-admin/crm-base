import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MainLayout } from '@/components/layout/MainLayout';
import { useEmpreendimentosAtivos, useUnidadesDisponiveis, useUpdateUnidadeStatus } from '@/hooks/useNexa';
import { useEmpresaAccess } from '@/hooks/useEmpresaAccess';
import { usePermissions } from '@/hooks/usePermissions';

const formatBRL = (v: number | null) =>
  v == null ? '—' : v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const STATUS_OPTIONS: { value: string; label: string; className: string }[] = [
  { value: 'disponivel', label: 'Disponível', className: 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-600' },
  { value: 'reservada', label: 'Reservada', className: 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600' },
  { value: 'negociacao', label: 'Negociação', className: 'bg-blue-500 hover:bg-blue-600 text-white border-blue-600' },
  { value: 'contrato', label: 'Contrato', className: 'bg-indigo-500 hover:bg-indigo-600 text-white border-indigo-600' },
  { value: 'vendida', label: 'Vendida', className: 'bg-rose-500 hover:bg-rose-600 text-white border-rose-600' },
  { value: 'bloqueada', label: 'Bloqueada', className: 'bg-slate-500 hover:bg-slate-600 text-white border-slate-600' },
];
const ALL_STATUSES = STATUS_OPTIONS.map((s) => s.value);
const STATUS_MAP = Object.fromEntries(STATUS_OPTIONS.map((s) => [s.value, s]));

export default function NexaDisponibilidade() {
  const { data: emps } = useEmpreendimentosAtivos();
  const [empId, setEmpId] = useState<string | undefined>();
  const { isNexa, isSeven } = useEmpresaAccess();
  const { isAdmin, isSuperAdmin } = usePermissions();
  const canEdit = (isNexa || isSeven) && (isAdmin() || isSuperAdmin());
  const { data: unidades, isLoading, refetch, isFetching } = useUnidadesDisponiveis(
    empId,
    canEdit ? ALL_STATUSES : ['disponivel']
  );
  const updateStatus = useUpdateUnidadeStatus();

  return (
    <MainLayout
      title="Unidades disponíveis"
      subtitle={canEdit ? 'Clique no status para alterá-lo.' : 'Consulta em tempo real do banco.'}
    >
      <div className="space-y-6">
      <div className="flex gap-3 items-end">
        <div className="flex-1 max-w-md">
          <label className="text-sm font-medium mb-1 block">Empreendimento</label>
          <Select value={empId} onValueChange={setEmpId}>
            <SelectTrigger><SelectValue placeholder="Selecione um empreendimento" /></SelectTrigger>
            <SelectContent>
              {emps?.map((e) => (
                <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" onClick={() => refetch()} disabled={!empId || isFetching}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {!empId ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Selecione um empreendimento acima.</CardContent></Card>
      ) : isLoading ? (
        <Skeleton className="h-64" />
      ) : !unidades?.length ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhuma unidade encontrada.</CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bloco</TableHead>
                  <TableHead>Andar</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Tipologia</TableHead>
                  <TableHead>Área</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead className="w-[180px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unidades.map((u: any) => (
                  <TableRow key={u.unidade_id}>
                    <TableCell>{u.bloco || '—'}</TableCell>
                    <TableCell>{u.andar ?? '—'}</TableCell>
                    <TableCell className="font-medium">{u.unidade}</TableCell>
                    <TableCell>{u.tipologia || '—'}</TableCell>
                    <TableCell>{u.area_privativa ? `${u.area_privativa} m²` : '—'}</TableCell>
                    <TableCell>{formatBRL(u.valor)}</TableCell>
                    <TableCell>
                      {canEdit ? (
                        <Select
                          value={u.status}
                          onValueChange={(v) => updateStatus.mutate({ unidadeId: u.unidade_id, status: v })}
                          disabled={updateStatus.isPending}
                        >
                          <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map((s) => (
                              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant="outline">{u.status}</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      </div>
    </MainLayout>
  );
}
