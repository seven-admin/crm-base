import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRegistrarPagamento } from '@/hooks/useComissoes';
import type { Comissao } from '@/types/comissoes.types';
import { format } from 'date-fns';

interface PagamentoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  comissao: Comissao | null;
}

export function PagamentoDialog({
  open,
  onOpenChange,
  comissao,
}: PagamentoDialogProps) {
  const [dataPagamento, setDataPagamento] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [nfNumero, setNfNumero] = useState('');

  const { mutate: registrarPagamento, isPending } = useRegistrarPagamento();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comissao) return;

    registrarPagamento({
      comissao_id: comissao.id,
      data_pagamento: dataPagamento,
      nf_numero: nfNumero || undefined,
    }, {
      onSuccess: () => {
        onOpenChange(false);
        setDataPagamento(format(new Date(), 'yyyy-MM-dd'));
        setNfNumero('');
      },
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Registrar Pagamento - Gestor do Produto</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Comissão:</span>
              <span className="font-medium">{comissao?.numero}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Gestor:</span>
              <span className="font-medium">{comissao?.gestor?.full_name || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Valor:</span>
              <span className="font-bold text-primary">
                {formatCurrency(comissao?.valor_comissao || 0)}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="data_pagamento">Data do Pagamento *</Label>
            <Input
              id="data_pagamento"
              type="date"
              value={dataPagamento}
              onChange={(e) => setDataPagamento(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nf_numero">Número da Nota Fiscal</Label>
            <Input
              id="nf_numero"
              value={nfNumero}
              onChange={(e) => setNfNumero(e.target.value)}
              placeholder="Opcional"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Registrando...' : 'Confirmar Pagamento'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
