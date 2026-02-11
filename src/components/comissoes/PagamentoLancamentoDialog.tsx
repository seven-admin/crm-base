import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRegistrarPagamentoComissao } from '@/hooks/useComissoes';
import { useCentrosCusto, useCategoriasFluxo } from '@/hooks/useFinanceiro';
import type { Comissao } from '@/types/comissoes.types';
import { format } from 'date-fns';
import { Loader2, Receipt, Wallet, Building2 } from 'lucide-react';

interface PagamentoLancamentoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  comissao: Comissao | null;
}

export function PagamentoLancamentoDialog({
  open,
  onOpenChange,
  comissao,
}: PagamentoLancamentoDialogProps) {
  const [dataPagamento, setDataPagamento] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [centroCustoId, setCentroCustoId] = useState('');
  const [categoriaFluxo, setCategoriaFluxo] = useState('');
  const [nfNumero, setNfNumero] = useState('');
  const [observacoes, setObservacoes] = useState('');

  const { data: centrosCusto = [], isLoading: loadingCentros } = useCentrosCusto();
  const { data: categorias = [], isLoading: loadingCategorias } = useCategoriasFluxo('saida');
  const { mutate: registrarPagamento, isPending } = useRegistrarPagamentoComissao();

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setDataPagamento(format(new Date(), 'yyyy-MM-dd'));
      setCentroCustoId('');
      setCategoriaFluxo('');
      setNfNumero('');
      setObservacoes('');
      
      // Pre-select "Comissões" category if exists
      const comissoesCategoria = categorias.find(c => 
        c.nome.toLowerCase().includes('comiss') || 
        c.nome.toLowerCase().includes('comission')
      );
      if (comissoesCategoria) {
        setCategoriaFluxo(comissoesCategoria.id);
      }
    }
  }, [open, categorias]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comissao || !centroCustoId) return;

    registrarPagamento({
      comissao_id: comissao.id,
      data_pagamento: dataPagamento,
      centro_custo_id: centroCustoId,
      categoria_fluxo_id: categoriaFluxo || undefined,
      nf_numero: nfNumero || undefined,
      observacoes: observacoes || undefined,
    }, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (!comissao) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Registrar Pagamento de Comissão
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Commission Summary */}
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Comissão:</span>
              <span className="font-medium">{comissao.numero}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Gestor:</span>
              <span className="font-medium">{comissao.gestor?.full_name || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Empreendimento:</span>
              <span className="font-medium">{comissao.empreendimento?.nome || '-'}</span>
            </div>
            <div className="flex justify-between border-t pt-2 mt-2">
              <span className="text-muted-foreground">Valor a Pagar:</span>
              <span className="font-bold text-primary text-lg">
                {formatCurrency(comissao.valor_comissao || 0)}
              </span>
            </div>
          </div>

          {/* Financial Entry Fields */}
          <div className="space-y-4">
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
              <Label htmlFor="centro_custo" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Centro de Custo *
              </Label>
              <Select
                value={centroCustoId}
                onValueChange={setCentroCustoId}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingCentros ? "Carregando..." : "Selecione o centro de custo"} />
                </SelectTrigger>
                <SelectContent>
                  {centrosCusto.map((cc) => (
                    <SelectItem key={cc.id} value={cc.id}>
                      {cc.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria_fluxo">Categoria</Label>
              <Select
                value={categoriaFluxo}
                onValueChange={setCategoriaFluxo}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingCategorias ? "Carregando..." : "Selecione a categoria (opcional)"} />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nf_numero" className="flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Número da Nota Fiscal
              </Label>
              <Input
                id="nf_numero"
                value={nfNumero}
                onChange={(e) => setNfNumero(e.target.value)}
                placeholder="Opcional"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Observações adicionais (opcional)"
                rows={2}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending || !centroCustoId}>
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Registrando...
                </>
              ) : (
                'Confirmar Pagamento'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
