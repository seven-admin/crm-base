import { useState } from 'react';
import { useGestorCorretores, CorretorGestao } from '@/hooks/useGestorCorretores';
// Card import removed - using standard table layout
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, UserCheck, UserX } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const SENHA_PADRAO = 'Seven@1234';

function NovoCorretorDialog({ onSubmit, isPending }: { onSubmit: (d: any) => void; isPending: boolean }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nome: '', email: '', cpf: '', creci: '', telefone: '', password: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...form, password: form.password || undefined });
    setForm({ nome: '', email: '', cpf: '', creci: '', telefone: '', password: '' });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4 mr-2" /> Novo Corretor</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cadastrar Novo Corretor</DialogTitle>
          <DialogDescription>O corretor receberá acesso imediato ao sistema.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nome *</Label>
            <Input required value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>E-mail *</Label>
            <Input type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>CPF *</Label>
            <Input required value={form.cpf} onChange={e => setForm(f => ({ ...f, cpf: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>CRECI</Label>
              <Input value={form.creci} onChange={e => setForm(f => ({ ...f, creci: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Senha de acesso</Label>
            <Input
              type="text"
              placeholder={SENHA_PADRAO}
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">
              Deixe em branco para usar a senha padrão: {SENHA_PADRAO}
            </p>
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Cadastrando...' : 'Cadastrar Corretor'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function PortalCorretoresGestao() {
  const { role } = useAuth();
  const { corretores, isLoading, createCorretor, toggleStatus } = useGestorCorretores();

  if (role !== 'gestor_imobiliaria') {
    return <Navigate to="/portal-corretor" replace />;
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {corretores.length} corretor{corretores.length !== 1 ? 'es' : ''} cadastrado{corretores.length !== 1 ? 's' : ''}
          </p>
        </div>
        <NovoCorretorDialog
          onSubmit={(d) => createCorretor.mutate(d)}
          isPending={createCorretor.isPending}
        />
      </div>

      <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>CRECI</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {corretores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhum corretor cadastrado. Clique em "Novo Corretor" para começar.
                  </TableCell>
                </TableRow>
              ) : (
                corretores.map((c: CorretorGestao) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.nome_completo}</TableCell>
                    <TableCell>{c.email || '—'}</TableCell>
                    <TableCell>{c.cpf || '—'}</TableCell>
                    <TableCell>{c.creci || '—'}</TableCell>
                    <TableCell>{c.telefone || '—'}</TableCell>
                    <TableCell>
                      <Badge variant={c.is_active ? 'default' : 'secondary'}>
                        {c.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleStatus.mutate({ id: c.id, is_active: !c.is_active })}
                        title={c.is_active ? 'Desativar' : 'Ativar'}
                      >
                        {c.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
      </div>
    </div>
  );
}
