import { Cliente } from '@/types/clientes.types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  CLIENTE_FASE_COLORS,
  CLIENTE_FASE_LABELS,
  CLIENTE_TEMPERATURA_COLORS,
  CLIENTE_TEMPERATURA_LABELS,
} from '@/types/clientes.types';

interface ClienteQuickViewDialogProps {
  cliente: Cliente | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenFull?: (cliente: Cliente) => void;
}

export function ClienteQuickViewDialog({
  cliente,
  open,
  onOpenChange,
  onOpenFull,
}: ClienteQuickViewDialogProps) {
  const formatPhone = (phone?: string | null) => phone || '-';

  if (!cliente) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="truncate">{cliente.nome}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={cn('text-xs', CLIENTE_FASE_COLORS[cliente.fase])}>
              {CLIENTE_FASE_LABELS[cliente.fase]}
            </Badge>
            {cliente.temperatura && (
              <Badge
                variant="outline"
                className={cn('text-xs', CLIENTE_TEMPERATURA_COLORS[cliente.temperatura])}
              >
                {CLIENTE_TEMPERATURA_LABELS[cliente.temperatura]}
              </Badge>
            )}
            {cliente.origem && (
              <Badge variant="secondary" className="text-xs">
                {cliente.origem}
              </Badge>
            )}
          </div>

          <div className="rounded-md border bg-card p-3 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">E-mail</span>
              <span className="text-sm truncate">{cliente.email || '-'}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">Telefone</span>
              <span className="text-sm">{formatPhone(cliente.telefone)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">WhatsApp</span>
              <span className="text-sm">{formatPhone(cliente.whatsapp)}</span>
            </div>
          </div>

          <div className="rounded-md border bg-card p-3 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">Cidade/UF</span>
              <span className="text-sm truncate">
                {(cliente.endereco_cidade || '-') + (cliente.endereco_uf ? `/${cliente.endereco_uf}` : '')}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">Gestor</span>
              <span className="text-sm truncate">{(cliente as any).gestor?.full_name || '-'}</span>
            </div>
          </div>

          {onOpenFull && (
            <div className="flex justify-end">
              <Button onClick={() => onOpenFull(cliente)}>Ver cadastro completo</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
