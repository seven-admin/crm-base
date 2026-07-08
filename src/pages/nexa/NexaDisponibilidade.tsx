import { useState } from 'react';
import { MapPin, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useEmpreendimentosAtivos, useUnidadesDisponiveis } from '@/hooks/useNexa';

const formatBRL = (v: number | null) =>
  v == null ? '—' : v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function NexaDisponibilidade() {
  const { data: emps } = useEmpreendimentosAtivos();
  const [empId, setEmpId] = useState<string | undefined>();
  const { data: unidades, isLoading, refetch, isFetching } = useUnidadesDisponiveis(empId);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <MapPin className="h-8 w-8 text-primary" />
          Unidades disponíveis
        </h1>
        <p className="text-muted-foreground mt-1">
          Consulta em tempo real do banco. Recarregue para ver o status mais recente.
        </p>
      </div>

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
        <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhuma unidade disponível neste empreendimento.</CardContent></Card>
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
                  <TableHead>Status</TableHead>
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
                    <TableCell><Badge variant="outline">{u.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
