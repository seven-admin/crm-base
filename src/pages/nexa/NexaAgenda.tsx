import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Eye, Pencil, Trash2 } from 'lucide-react';
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
import { MainLayout } from '@/components/layout/MainLayout';
import { useNexaVisitas, useDeleteVisita, useEmpreendimentosAtivos } from '@/hooks/useNexa';
import { VisitaFormDialog } from '@/components/nexa/VisitaFormDialog';
import { STATUS_LABELS, STATUS_COLORS, type NexaVisitaStatus, type NexaVisitaWithRelations } from '@/types/nexa.types';
import { usePermissions } from '@/hooks/usePermissions';

export default function NexaAgenda() {
  const navigate = useNavigate();
  const { isSuperAdmin } = usePermissions();
  const superAdmin = isSuperAdmin();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<NexaVisitaWithRelations | null>(null);
  const [toDelete, setToDelete] = useState<NexaVisitaWithRelations | null>(null);

  const [statusFilter, setStatusFilter] = useState<'todos' | NexaVisitaStatus>('todos');
  const [empFilter, setEmpFilter] = useState<string>('todos');

  const { data: visitas, isLoading } = useNexaVisitas();
  const { data: emps } = useEmpreendimentosAtivos();
  const del = useDeleteVisita();

  const filtered = useMemo(() => {
    return (visitas ?? []).filter((v) => {
      if (statusFilter !== 'todos' && v.status !== statusFilter) return false;
      if (empFilter !== 'todos' && v.empreendimento_id !== empFilter) return false;
      return true;
    });
  }, [visitas, statusFilter, empFilter]);

  const openCreate = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (v: NexaVisitaWithRelations) => { setEditing(v); setFormOpen(true); };

  return (
    <MainLayout
      title="Agenda Nexa"
      subtitle="Gestão de visitas a empreendimentos"
      actions={<Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Nova visita</Button>}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              {Object.entries(STATUS_LABELS).map(([k, l]) => (
                <SelectItem key={k} value={k}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={empFilter} onValueChange={setEmpFilter}>
            <SelectTrigger className="w-[260px]"><SelectValue placeholder="Empreendimento" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos empreendimentos</SelectItem>
              {emps?.map((e) => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}
          </div>
        ) : !filtered.length ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Nenhuma visita encontrada.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data / Hora</TableHead>
                  <TableHead>Visitante</TableHead>
                  <TableHead>Empreendimento</TableHead>
                  <TableHead>Imobiliária</TableHead>
                  <TableHead>Corretor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(v.data_hora), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>{v.cliente?.nome || v.visitante_nome || '—'}</TableCell>
                    <TableCell>{v.empreendimento?.nome || '—'}</TableCell>
                    <TableCell>{v.imobiliaria?.nome || '—'}</TableCell>
                    <TableCell>{v.corretor?.nome_completo || '—'}</TableCell>
                    <TableCell><Badge className={STATUS_COLORS[v.status]}>{STATUS_LABELS[v.status]}</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => navigate(`/nexa/visitas/${v.id}`)} title="Ver detalhes">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => openEdit(v)} title="Editar">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {superAdmin && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setToDelete(v)}
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

        <VisitaFormDialog open={formOpen} onOpenChange={setFormOpen} visita={editing} />

        <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir visita?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação é irreversível. A visita e todo o histórico de eventos vinculado serão apagados permanentemente.
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
    </MainLayout>
  );
}
