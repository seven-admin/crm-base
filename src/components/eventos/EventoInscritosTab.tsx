import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Users, Plus, Pencil, Trash2, CheckCircle, XCircle, Send, FileText } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { dispararWebhook } from '@/lib/webhookUtils';

interface EventoInscritosTabProps {
  eventoId: string;
  eventoNome?: string;
  eventoData?: string;
}

interface InscricaoForm {
  nome_corretor: string;
  telefone: string;
  email: string;
  imobiliaria_nome: string;
}

const emptyForm: InscricaoForm = { nome_corretor: '', telefone: '', email: '', imobiliaria_nome: '' };

export function EventoInscritosTab({ eventoId, eventoNome, eventoData }: EventoInscritosTabProps) {
  const queryClient = useQueryClient();
  const queryKey = ['evento-inscricoes-admin', eventoId];

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<InscricaoForm>(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: inscricoes, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('evento_inscricoes')
        .select('*, corretor:corretor_id(telefone, whatsapp, imobiliaria:imobiliaria_id(gestor_telefone))')
        .eq('evento_id', eventoId)
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Buscar telefones via user_id para inscritos sem corretor_id
      const userIdsWithoutCorretor = data
        .filter(d => !d.corretor_id && d.user_id)
        .map(d => d.user_id);

      let corretorMap: Record<string, { telefone: string | null; whatsapp: string | null; imobiliaria_id: string | null }> = {};
      let gestorMapByImob: Record<string, string | null> = {};

      if (userIdsWithoutCorretor.length > 0) {
        const { data: corretoresByUser } = await supabase
          .from('corretores')
          .select('user_id, telefone, whatsapp, imobiliaria_id')
          .in('user_id', userIdsWithoutCorretor);
        if (corretoresByUser) {
          corretorMap = Object.fromEntries(
            corretoresByUser.map(c => [c.user_id, { telefone: c.telefone, whatsapp: c.whatsapp, imobiliaria_id: c.imobiliaria_id }])
          );
          // Buscar gestor_telefone das imobiliárias
          const imobIds = [...new Set(corretoresByUser.map(c => c.imobiliaria_id).filter(Boolean))] as string[];
          if (imobIds.length > 0) {
            const { data: imobs } = await supabase
              .from('imobiliarias')
              .select('id, gestor_telefone')
              .in('id', imobIds);
            if (imobs) {
              gestorMapByImob = Object.fromEntries(imobs.map(i => [i.id, i.gestor_telefone]));
            }
          }
        }
      }

      // Enriquecer dados com fallback de celular e gestor_telefone
      return data.map(insc => {
        const fallbackCorretor = corretorMap[insc.user_id];
        return {
          ...insc,
          _celular_corretor:
            insc.corretor?.whatsapp || insc.corretor?.telefone ||
            fallbackCorretor?.whatsapp || fallbackCorretor?.telefone ||
            insc.telefone || null,
          _gestor_telefone:
            (insc.corretor as any)?.imobiliaria?.gestor_telefone ||
            (fallbackCorretor?.imobiliaria_id ? gestorMapByImob[fallbackCorretor.imobiliaria_id] : null) ||
            null,
        };
      });
    },
    enabled: !!eventoId,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const addMutation = useMutation({
    mutationFn: async (data: InscricaoForm) => {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase.from('evento_inscricoes').insert({
        evento_id: eventoId,
        user_id: userData.user?.id || '',
        nome_corretor: data.nome_corretor,
        telefone: data.telefone || null,
        email: data.email || null,
        imobiliaria_nome: data.imobiliaria_nome || null,
      });
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success('Inscrito adicionado.'); closeDialog(); },
    onError: (e: Error) => toast.error('Erro: ' + e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: InscricaoForm }) => {
      const { error } = await supabase.from('evento_inscricoes').update({
        nome_corretor: data.nome_corretor,
        telefone: data.telefone || null,
        email: data.email || null,
        imobiliaria_nome: data.imobiliaria_nome || null,
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success('Inscrito atualizado.'); closeDialog(); },
    onError: (e: Error) => toast.error('Erro: ' + e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('evento_inscricoes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success('Inscrito removido.'); setDeleteId(null); },
    onError: (e: Error) => toast.error('Erro: ' + e.message),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, currentStatus }: { id: string; currentStatus: string }) => {
      const newStatus = currentStatus === 'confirmada' ? 'cancelada' : 'confirmada';
      const { error } = await supabase.from('evento_inscricoes').update({ status: newStatus }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success('Status atualizado.'); },
    onError: (e: Error) => toast.error('Erro: ' + e.message),
  });

  const [sendingId, setSendingId] = useState<string | null>(null);

  const handleReenviar = async (insc: any) => {
    setSendingId(insc.id);
    try {
      await dispararWebhook('evento_inscricao_corretor', {
        evento_id: eventoId,
        evento_nome: eventoNome,
        evento_data: eventoData,
        corretor_nome: insc.nome_corretor,
        corretor_telefone: insc.telefone || null,
        corretor_email: insc.email || null,
        corretor_celular: (insc as any)._celular_corretor || null,
        gestor_telefone: (insc as any)._gestor_telefone || null,
        imobiliaria: insc.imobiliaria_nome || null,
      });
      toast.success('Mensagem reenviada com sucesso.');
    } catch {
      toast.error('Erro ao reenviar mensagem.');
    } finally {
      setSendingId(null);
    }
  };

  const closeDialog = () => { setDialogOpen(false); setEditingId(null); setForm(emptyForm); };

  const openAdd = () => { setForm(emptyForm); setEditingId(null); setDialogOpen(true); };

  const openEdit = (insc: any) => {
    setForm({
      nome_corretor: insc.nome_corretor || '',
      telefone: insc.telefone || '',
      email: insc.email || '',
      imobiliaria_nome: insc.imobiliaria_nome || '',
    });
    setEditingId(insc.id);
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.nome_corretor.trim()) { toast.error('Nome é obrigatório.'); return; }
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: form });
    } else {
      addMutation.mutate(form);
    }
  };

  const handleGerarPDF = () => {
    if (!inscricoes?.length) return;
    const sorted = [...inscricoes].sort((a, b) =>
      (a.nome_corretor || '').localeCompare(b.nome_corretor || '', 'pt-BR')
    );
    const rows = sorted
      .map(
        (i) =>
          `<tr><td style="padding:6px 10px;border-bottom:1px solid #eee">${i.nome_corretor || '—'}</td><td style="padding:6px 10px;border-bottom:1px solid #eee">${i.telefone || '—'}</td><td style="padding:6px 10px;border-bottom:1px solid #eee">${i.imobiliaria_nome || '—'}</td></tr>`
      )
      .join('');
    const html = `
      <div style="font-family:Arial,sans-serif;padding:20px">
        <h2 style="margin-bottom:4px">${eventoNome || 'Evento'}</h2>
        <p style="color:#666;margin-bottom:16px;font-size:13px">${sorted.length} inscrito(s)</p>
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <thead><tr style="background:#f5f5f5;text-align:left">
            <th style="padding:8px 10px">Nome</th>
            <th style="padding:8px 10px">Telefone</th>
            <th style="padding:8px 10px">Imobiliária</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
    const el = document.createElement('div');
    el.innerHTML = html;
    html2pdf().set({ margin: 10, filename: `inscritos-${eventoNome || 'evento'}.pdf`, jsPDF: { format: 'a4' } }).from(el).save();
  };

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  const confirmadas = inscricoes?.filter(i => i.status === 'confirmada').length || 0;
  const total = inscricoes?.length || 0;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Inscritos
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{confirmadas} confirmado(s)</Badge>
            {total !== confirmadas && <Badge variant="outline">{total} total</Badge>}
            <Button size="sm" variant="outline" onClick={handleGerarPDF} disabled={!inscricoes?.length} className="gap-1">
              <FileText className="h-4 w-4" /> PDF
            </Button>
            <Button size="sm" onClick={openAdd} className="gap-1">
              <Plus className="h-4 w-4" /> Adicionar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!inscricoes?.length ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Nenhuma inscrição registrada.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Celular Corretor</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Imobiliária</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inscricoes.map((insc) => (
                    <TableRow key={insc.id}>
                      <TableCell className="font-medium">{insc.nome_corretor}</TableCell>
                      <TableCell>{insc.telefone || '—'}</TableCell>
                      <TableCell>{(insc as any)._celular_corretor || '—'}</TableCell>
                      <TableCell>{insc.email || '—'}</TableCell>
                      <TableCell>{insc.imobiliaria_nome || '—'}</TableCell>
                      <TableCell>
                        <Badge
                          variant={insc.status === 'confirmada' ? 'default' : 'destructive'}
                          className="text-xs cursor-pointer"
                          onClick={() => toggleStatusMutation.mutate({ id: insc.id, currentStatus: insc.status })}
                        >
                          {insc.status === 'confirmada' ? (
                            <><CheckCircle className="h-3 w-3 mr-1" />Confirmada</>
                          ) : (
                            <><XCircle className="h-3 w-3 mr-1" />Cancelada</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(insc.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            title="Reenviar mensagem"
                            disabled={sendingId === insc.id}
                            onClick={() => handleReenviar(insc)}
                          >
                            <Send className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(insc)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(insc.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) closeDialog(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Inscrito' : 'Adicionar Inscrito'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input value={form.nome_corretor} onChange={e => setForm(f => ({ ...f, nome_corretor: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Imobiliária</Label>
              <Input value={form.imobiliaria_nome} onChange={e => setForm(f => ({ ...f, imobiliaria_nome: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={addMutation.isPending || updateMutation.isPending}>
              {editingId ? 'Salvar' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir inscrito?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
