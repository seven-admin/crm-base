import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateCliente } from '@/hooks/useClientes';
import { formatarTelefone } from '@/lib/documentUtils';
import { Loader2 } from 'lucide-react';

interface NovoClienteRapidoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClienteCriado: (id: string, nome: string) => void;
}

export function NovoClienteRapidoDialog({ open, onOpenChange, onClienteCriado }: NovoClienteRapidoDialogProps) {
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const createCliente = useCreateCliente();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;

    createCliente.mutate(
      {
        nome: nome.trim(),
        telefone: telefone || undefined,
        email: email || undefined,
      } as any,
      {
        onSuccess: (data: any) => {
          onClienteCriado(data.id, data.nome);
          setNome('');
          setTelefone('');
          setEmail('');
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Cadastro Rápido de Cliente</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome-rapido">Nome *</Label>
            <Input
              id="nome-rapido"
              placeholder="Nome do cliente"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="telefone-rapido">Telefone</Label>
            <Input
              id="telefone-rapido"
              placeholder="(00) 00000-0000"
              value={telefone}
              onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
              maxLength={15}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email-rapido">E-mail</Label>
            <Input
              id="email-rapido"
              type="email"
              placeholder="email@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!nome.trim() || createCliente.isPending}>
              {createCliente.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
