import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Trash2, Search, X, Users, UserPlus, Pencil } from 'lucide-react';
import { useArqoLeadsAdmin, useDeleteArqoLeadsBulk, useAssignGrupoLeadsBulk } from '@/hooks/useArqoLeadsAdmin';
import { useArqoEtapas, useArqoSources, useArqoGrupos } from '@/hooks/useArqo';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { ArqoNovoLeadDialog } from '@/components/arqo/ArqoNovoLeadDialog';
import { ArqoEditarLeadDialog } from '@/components/arqo/ArqoEditarLeadDialog';

export function ArqoGerenciarLeads() {
  const { role } = useAuth();
  const [newLeadOpen, setNewLeadOpen] = useState(false);
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sourceId, setSourceId] = useState<string>('all');
  const [etapaId, setEtapaId] = useState<string>('all');
  const [consultorId, setConsultorId] = useState<string>('all');
  const [grupoId, setGrupoId] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [alsoDeleteClients, setAlsoDeleteClients] = useState(false);
  const [grupoDestinoId, setGrupoDestinoId] = useState<string>('');

  const filters = {
    search: search.trim() || undefined,
    source_id: sourceId === 'all' ? undefined : sourceId,
    etapa_id: etapaId === 'all' ? undefined : etapaId,
    consultor_id: consultorId === 'all' ? undefined : consultorId,
    semGrupo: grupoId === '__none__',
    grupo_id: grupoId === 'all' || grupoId === '__none__' ? undefined : grupoId,
    dateFrom: dateFrom ? new Date(dateFrom).toISOString() : undefined,
    dateTo: dateTo ? new Date(dateTo + 'T23:59:59').toISOString() : undefined,
  };

  const { data: leads = [], isLoading } = useArqoLeadsAdmin(filters);
  const { data: etapas = [] } = useArqoEtapas();
  const { data: sources = [] } = useArqoSources();
  const { data: grupos = [] } = useArqoGrupos();
  const del = useDeleteArqoLeadsBulk();
  const assignGrupo = useAssignGrupoLeadsBulk();

  const { data: consultores = [] } = useQuery({
    queryKey: ['arqo', 'consultores-list'],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, email, empresa')
        .eq('empresa', 'arqo')
        .order('full_name');
      return data ?? [];
    },
  });

  const allChecked = leads.length > 0 && leads.every((l) => selected.has(l.id));
  const someChecked = selected.size > 0 && !allChecked;

  const toggleAll = () => {
    if (allChecked) setSelected(new Set());
    else setSelected(new Set(leads.map((l) => l.id)));
  };
  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const clearFilters = () => {
    setSearch(''); setSourceId('all'); setEtapaId('all'); setConsultorId('all'); setGrupoId('all');
    setDateFrom(''); setDateTo('');
  };

  const handleConfirmDelete = async () => {
    if (confirmText !== 'EXCLUIR') return;
    await del.mutateAsync({ ids: Array.from(selected), deleteClients: alsoDeleteClients });
    setSelected(new Set());
    setConfirmOpen(false);
    setConfirmText('');
    setAlsoDeleteClients(false);
  };

  const handleAssignGrupo = async () => {
    if (!grupoDestinoId) return;
    await assignGrupo.mutateAsync({ ids: Array.from(selected), grupoId: grupoDestinoId });
    setSelected(new Set());
    setGrupoDestinoId('');
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[10px] font-bold uppercase tracking-[.16em] text-primary">Filtros e ações em lote</p>
          {role === 'super_admin' && (
            <Button onClick={() => setNewLeadOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Novo lead
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
          <div className="lg:col-span-2">
            <Label className="text-xs">Busca (nome, telefone, email)</Label>
            <div className="relative">
              <Search className="h-4 w-4 absolute left-2 top-2.5 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" placeholder="Buscar..." />
            </div>
          </div>
          <div>
            <Label className="text-xs">Origem</Label>
            <Select value={sourceId} onValueChange={setSourceId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {sources.map((s) => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Etapa</Label>
            <Select value={etapaId} onValueChange={setEtapaId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {etapas.map((e) => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Consultor</Label>
            <Select value={consultorId} onValueChange={setConsultorId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="__none__">— Sem consultor</SelectItem>
                {consultores.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Grupo</Label>
            <Select value={grupoId} onValueChange={setGrupoId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="__none__">— Sem grupo</SelectItem>
                {grupos.map((g) => <SelectItem key={g.id} value={g.id}>{g.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">De</Label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Até</Label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-3 w-3 mr-1" /> Limpar
            </Button>
            <p className="text-sm text-muted-foreground">
              {leads.length} lead(s) · {selected.size} selecionado(s)
            </p>
          </div>
          <div className="flex items-center gap-2">
            {selected.size > 0 && (
              <>
                <Select value={grupoDestinoId} onValueChange={setGrupoDestinoId}>
                  <SelectTrigger className="w-48 h-9"><SelectValue placeholder="Atribuir a grupo..." /></SelectTrigger>
                  <SelectContent>
                    {grupos.map((g) => <SelectItem key={g.id} value={g.id}>{g.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  disabled={!grupoDestinoId || assignGrupo.isPending}
                  onClick={handleAssignGrupo}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Atribuir ({selected.size})
                </Button>
              </>
            )}
            <Button
              variant="destructive"
              disabled={selected.size === 0}
              onClick={() => setConfirmOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir selecionados ({selected.size})
            </Button>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={allChecked ? true : someChecked ? 'indeterminate' : false}
                  onCheckedChange={toggleAll}
                />
              </TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead>Etapa</TableHead>
              <TableHead>Consultor</TableHead>
              <TableHead>Grupo</TableHead>
              <TableHead>Criado em</TableHead>
              {role === 'super_admin' && <TableHead className="w-20 text-right">Ações</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={role === 'super_admin' ? 9 : 8} className="text-center py-6">Carregando…</TableCell></TableRow>}
            {!isLoading && leads.length === 0 && (
              <TableRow><TableCell colSpan={role === 'super_admin' ? 9 : 8} className="text-center py-8 text-muted-foreground">
                Nenhum lead encontrado.
              </TableCell></TableRow>
            )}
            {leads.map((l) => (
              <TableRow key={l.id} className={selected.has(l.id) ? 'bg-muted/50' : ''}>
                <TableCell>
                  <Checkbox checked={selected.has(l.id)} onCheckedChange={() => toggle(l.id)} />
                </TableCell>
                <TableCell>
                  <div className="font-medium">{l.cliente?.nome || '—'}</div>
                  {l.cliente?.nivel_cadastro && (
                    <Badge variant="outline" className="text-[10px] mt-0.5">{l.cliente.nivel_cadastro}</Badge>
                  )}
                </TableCell>
                <TableCell className="text-xs">
                  {(l.cliente?.telefone || l.cliente?.whatsapp) && <div>{l.cliente.telefone || l.cliente.whatsapp}</div>}
                  {l.telefones_adicionais?.map((telefone, index) => (
                    <div key={`${telefone}-${index}`} className="text-muted-foreground">{telefone}</div>
                  ))}
                  {l.cliente?.email && <div className="text-muted-foreground">{l.cliente.email}</div>}
                </TableCell>
                <TableCell className="text-xs">{l.source?.nome || '—'}</TableCell>
                <TableCell>
                  {l.etapa && (
                    <Badge style={{ backgroundColor: l.etapa.cor, color: '#fff' }} className="text-xs">
                      {l.etapa.nome}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-xs">
                  {l.consultor?.full_name || <span className="text-muted-foreground italic">sem consultor</span>}
                </TableCell>
                <TableCell className="text-xs">
                  {l.grupo?.nome || <span className="text-muted-foreground italic">sem grupo</span>}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {format(new Date(l.created_at), 'dd/MM/yyyy HH:mm')}
                </TableCell>
                {role === 'super_admin' && (
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => setEditingLeadId(l.id)} title="Editar lead">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {selected.size} lead(s) permanentemente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é <b>irreversível</b>. Todos os eventos, agendamentos e vínculos destes leads serão apagados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={alsoDeleteClients} onCheckedChange={(v) => setAlsoDeleteClients(v === true)} />
              Excluir também os clientes de nível "lead" sem outras vinculações
            </label>
            <div>
              <Label className="text-xs">Digite <b>EXCLUIR</b> para confirmar</Label>
              <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} autoFocus />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setConfirmText(''); setAlsoDeleteClients(false); }}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={confirmText !== 'EXCLUIR' || del.isPending}
              onClick={handleConfirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Excluir definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {role === 'super_admin' && (
        <>
          <ArqoNovoLeadDialog open={newLeadOpen} onOpenChange={setNewLeadOpen} />
          <ArqoEditarLeadDialog
            leadId={editingLeadId}
            open={!!editingLeadId}
            onOpenChange={(open) => { if (!open) setEditingLeadId(null); }}
          />
        </>
      )}
    </div>
  );
}
