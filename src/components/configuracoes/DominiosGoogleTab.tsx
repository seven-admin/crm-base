import { useState } from 'react';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  useDominiosGoogle, useUpsertDominioGoogle, useDeleteDominioGoogle,
  useToggleDominioGoogleAtivo, type DominioGoogle, type EmpresaDefault,
} from '@/hooks/useDominiosGoogle';

const EMPRESAS: { value: EmpresaDefault; label: string }[] = [
  { value: 'seven', label: 'Seven' },
  { value: 'arqo', label: 'Arqo' },
  { value: 'nexa', label: 'Nexa' },
  { value: 'externo', label: 'Externo' },
];

const DOMAIN_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i;

type FormState = Partial<DominioGoogle> & { dominio: string; empresa_default: EmpresaDefault; is_active: boolean };

const emptyForm = (): FormState => ({
  dominio: '',
  empresa_default: 'seven',
  descricao: '',
  is_active: true,
});

export function DominiosGoogleTab() {
  const { data, isLoading } = useDominiosGoogle();
  const upsert = useUpsertDominioGoogle();
  const del = useDeleteDominioGoogle();
  const toggle = useToggleDominioGoogleAtivo();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [toDelete, setToDelete] = useState<DominioGoogle | null>(null);
  const [error, setError] = useState('');

  const openNew = () => { setForm(emptyForm()); setError(''); setOpen(true); };
  const openEdit = (d: DominioGoogle) => {
    setForm({ ...d, descricao: d.descricao ?? '' });
    setError('');
    setOpen(true);
  };

  const save = async () => {
    const dominio = form.dominio.trim().toLowerCase();
    if (!DOMAIN_RE.test(dominio)) {
      setError('Informe um domínio válido, ex.: sevengroup360.com.br');
      return;
    }
    await upsert.mutateAsync({ ...form, dominio });
    if (!upsert.isError) setOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Domínios Google permitidos</h2>
          <p className="text-sm text-muted-foreground">
            Apenas usuários com e-mail nestes domínios podem entrar via Google.
          </p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" /> Novo domínio</Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12" />)}</div>
      ) : !data?.length ? (
        <Card className="p-12 text-center text-muted-foreground">Nenhum domínio cadastrado.</Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Domínio</TableHead>
                <TableHead>Empresa padrão</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-center">Ativo</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-mono">{d.dominio}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="uppercase">{d.empresa_default}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{d.descricao || '—'}</TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={d.is_active}
                      onCheckedChange={(v) => toggle.mutate({ id: d.id, is_active: v })}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(d)} title="Editar">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon" variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setToDelete(d)} title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{form.id ? 'Editar domínio' : 'Novo domínio'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Domínio *</Label>
              <Input
                placeholder="minhaempresa.com.br"
                value={form.dominio}
                onChange={(e) => setForm({ ...form, dominio: e.target.value })}
              />
            </div>
            <div>
              <Label>Empresa padrão *</Label>
              <Select
                value={form.empresa_default}
                onValueChange={(v) => setForm({ ...form, empresa_default: v as EmpresaDefault })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EMPRESAS.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Descrição</Label>
              <Input
                placeholder="Opcional"
                value={form.descricao ?? ''}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.is_active}
                onCheckedChange={(v) => setForm({ ...form, is_active: v })}
              />
              <Label>Ativo</Label>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save} disabled={upsert.isPending}>
              {upsert.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir domínio?</AlertDialogTitle>
            <AlertDialogDescription>
              O domínio <span className="font-mono">{toDelete?.dominio}</span> será removido.
              Usuários com e-mails neste domínio deixarão de conseguir entrar pelo Google.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (!toDelete) return;
                await del.mutateAsync(toDelete.id);
                setToDelete(null);
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
