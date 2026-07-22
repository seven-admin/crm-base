import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Pencil, Trash2, Lock } from 'lucide-react';
import { useContratoVariaveis, useSaveContratoVariavel, useDeleteContratoVariavel, ContratoVariavel } from '@/hooks/useNexaContratos';

const TIPOS = ['texto', 'numero', 'data', 'moeda'] as const;

export default function NexaContratosVariaveis() {
  const { data: vars, isLoading } = useContratoVariaveis();
  const save = useSaveContratoVariavel();
  const del = useDeleteContratoVariavel();

  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Partial<ContratoVariavel> | null>(null);
  const [alvoExclusao, setAlvoExclusao] = useState<ContratoVariavel | null>(null);

  const openNew = () => { setEdit({ chave: '', label: '', tipo: 'texto', is_active: true }); setOpen(true); };
  const openEdit = (v: ContratoVariavel) => { setEdit(v); setOpen(true); };

  const submit = async () => {
    if (!edit?.chave || !edit?.label) return;
    await save.mutateAsync(edit as any);
    setOpen(false);
  };

  return (
    <MainLayout
      title="Variáveis de contratos"
      subtitle="Cadastro de variáveis que podem ser usadas nos modelos."
      actions={<Button onClick={openNew}><Plus className="h-4 w-4 mr-2" /> Nova variável</Button>}
    >
      <div className="overflow-hidden rounded-[1.5rem] border border-border/70 bg-card shadow-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Chave</TableHead>
              <TableHead>Label</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Fonte sugerida</TableHead>
              <TableHead className="w-32">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={5}>Carregando…</TableCell></TableRow>}
            {!isLoading && !vars?.length && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhuma variável.</TableCell></TableRow>}
            {vars?.map((v) => (
              <TableRow key={v.id}>
                <TableCell className="font-mono text-sm">
                  {v.is_sistema && <Lock className="h-3 w-3 inline mr-1 text-muted-foreground" />}
                  {`{{${v.chave}}}`}
                </TableCell>
                <TableCell>{v.label}</TableCell>
                <TableCell><Badge variant="outline">{v.tipo}</Badge></TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{v.fonte_sugerida || '—'}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(v)}><Pencil className="h-4 w-4" /></Button>
                    {!v.is_sistema && (
                      <Button size="icon" variant="ghost" onClick={() => setAlvoExclusao(v)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{edit?.id ? 'Editar variável' : 'Nova variável'}</DialogTitle></DialogHeader>
          {edit && (
            <div className="space-y-3">
              <div>
                <Label>Chave *</Label>
                <Input
                  value={edit.chave || ''}
                  disabled={edit.is_sistema}
                  onChange={(e) => setEdit({ ...edit, chave: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })}
                  placeholder="ex: nome_cliente"
                />
                <p className="text-xs text-muted-foreground mt-1">Será usada no modelo como <code>{`{{${edit.chave || 'chave'}}}`}</code></p>
              </div>
              <div>
                <Label>Label *</Label>
                <Input value={edit.label || ''} onChange={(e) => setEdit({ ...edit, label: e.target.value })} />
              </div>
              <div>
                <Label>Tipo</Label>
                <Select value={edit.tipo || 'texto'} onValueChange={(v) => setEdit({ ...edit, tipo: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIPOS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Fonte sugerida (opcional)</Label>
                <Input value={edit.fonte_sugerida || ''} onChange={(e) => setEdit({ ...edit, fonte_sugerida: e.target.value })} placeholder="ex: cliente.nome" />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea rows={2} value={edit.descricao || ''} onChange={(e) => setEdit({ ...edit, descricao: e.target.value })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={submit} disabled={save.isPending}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!alvoExclusao} onOpenChange={(open) => !open && setAlvoExclusao(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir variável?</AlertDialogTitle>
            <AlertDialogDescription>
              <code>{`{{${alvoExclusao?.chave}}}`}</code> será removida permanentemente. Modelos que já usam essa variável passarão a exibir <code>[{alvoExclusao?.chave}]</code> no lugar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (alvoExclusao) del.mutate(alvoExclusao.id); setAlvoExclusao(null); }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
