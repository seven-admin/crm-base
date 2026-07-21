import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useArqoAgendamentos, useDeleteArqoAgendamento } from '@/hooks/useArqo';
import { AgendamentoFormDialog } from '@/components/arqo/AgendamentoFormDialog';
import {
  AGENDAMENTO_TIPO_LABELS, AGENDAMENTO_STATUS_LABELS, AGENDAMENTO_STATUS_COLORS,
  type ArqoAgendamentoStatus, type ArqoAgendamentoWithRelations,
} from '@/types/arqo.types';
import { usePermissions } from '@/hooks/usePermissions';

export function AgendaAtendimentosTab() {
  const { isSuperAdmin } = usePermissions();
  const superAdmin = isSuperAdmin();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ArqoAgendamentoWithRelations | null>(null);
  const [toDelete, setToDelete] = useState<ArqoAgendamentoWithRelations | null>(null);
  const [statusFilter, setStatusFilter] = useState<'todos' | ArqoAgendamentoStatus>('todos');

  const { data: agendamentos, isLoading } = useArqoAgendamentos();
  const del = useDeleteArqoAgendamento();

  const filtered = useMemo(() => {
    return (agendamentos ?? []).filter((a) => statusFilter === 'todos' || a.status === statusFilter);
  }, [agendamentos, statusFilter]);

  const openCreate = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (a: ArqoAgendamentoWithRelations) => { setEditing(a); setFormOpen(true); };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            {Object.entries(AGENDAMENTO_STATUS_LABELS).map(([k, l]) => (
              <SelectItem key={k} value={k}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Novo agendamento</Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}
        </div>
      ) : !filtered.length ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhum agendamento encontrado.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data / Hora</TableHead>
                <TableHead>Lead</TableHead>
                <TableHead>Empreendimento</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="whitespace-nowrap">
                    {format(new Date(a.data_hora), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </TableCell>
                  <TableCell>{a.lead?.cliente?.nome || '—'}</TableCell>
                  <TableCell>{a.lead?.empreendimento?.nome || '—'}</TableCell>
                  <TableCell>{AGENDAMENTO_TIPO_LABELS[a.tipo]}</TableCell>
                  <TableCell>{a.responsavel?.full_name || '—'}</TableCell>
                  <TableCell><Badge className={AGENDAMENTO_STATUS_COLORS[a.status]}>{AGENDAMENTO_STATUS_LABELS[a.status]}</Badge></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(a)} title="Editar">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {superAdmin && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setToDelete(a)}
                          title="Excluir"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <AgendamentoFormDialog open={formOpen} onOpenChange={setFormOpen} agendamento={editing} />

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir agendamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é irreversível.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!toDelete) return;
                await del.mutateAsync(toDelete.id);
                setToDelete(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
