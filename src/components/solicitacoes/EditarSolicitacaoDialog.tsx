import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2, Trash2, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Negociacao } from '@/types/negociacoes.types';
import { useRemoverItemSolicitacao } from '@/hooks/useSolicitacoes';

interface EditarSolicitacaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  negociacao: Negociacao | null;
}

export function EditarSolicitacaoDialog({ 
  open, 
  onOpenChange, 
  negociacao 
}: EditarSolicitacaoDialogProps) {
  const [selectedToRemove, setSelectedToRemove] = useState<string[]>([]);
  const removerItem = useRemoverItemSolicitacao();

  useEffect(() => {
    if (open) {
      setSelectedToRemove([]);
    }
  }, [open]);

  if (!negociacao) return null;

  const handleToggle = (unidadeId: string) => {
    setSelectedToRemove(prev => 
      prev.includes(unidadeId) 
        ? prev.filter(id => id !== unidadeId)
        : [...prev, unidadeId]
    );
  };

  const handleRemoverSelecionados = async () => {
    for (const unidadeId of selectedToRemove) {
      await removerItem.mutateAsync({
        negociacaoId: negociacao.id,
        unidadeId
      });
    }
    setSelectedToRemove([]);
    onOpenChange(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0
    }).format(value);
  };

  const unidadesRestantes = (negociacao.unidades?.length || 0) - selectedToRemove.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Solicitação {negociacao.codigo}</DialogTitle>
          <DialogDescription>
            Selecione as unidades que deseja remover desta solicitação.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Warning if removing all */}
          {unidadesRestantes === 0 && selectedToRemove.length > 0 && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg text-destructive text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>Não é possível remover todas as unidades. A solicitação deve ter pelo menos uma unidade.</span>
            </div>
          )}

          {/* Units list */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {negociacao.unidades?.map((nu) => {
              const isSelected = selectedToRemove.includes(nu.unidade_id);
              const isIndisponivel = nu.unidade?.status !== 'disponivel';
              
              return (
                <div 
                  key={nu.id} 
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    isSelected ? 'bg-destructive/10 border-destructive/30' : 
                    isIndisponivel ? 'bg-amber-500/10 border-amber-500/30' : 'bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id={nu.id}
                      checked={isSelected}
                      onCheckedChange={() => handleToggle(nu.unidade_id)}
                    />
                    <Label htmlFor={nu.id} className="cursor-pointer">
                      <div className="font-medium">
                        {nu.unidade?.bloco?.nome ? `${nu.unidade.bloco.nome} - ` : ''}
                        {nu.unidade?.numero}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatCurrency(nu.valor_tabela || nu.unidade?.valor || 0)}
                      </div>
                    </Label>
                  </div>

                  {isIndisponivel && (
                    <Badge variant="outline" className="text-amber-600 border-amber-600">
                      {nu.unidade?.status}
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="flex items-center justify-between pt-4 border-t">
            <span className="text-sm text-muted-foreground">
              Unidades após remoção: {unidadesRestantes}
            </span>
            <span className="text-sm">
              <span className="text-destructive">{selectedToRemove.length}</span> selecionada(s) para remover
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button 
            variant="destructive"
            onClick={handleRemoverSelecionados}
            disabled={selectedToRemove.length === 0 || unidadesRestantes === 0 || removerItem.isPending}
          >
            {removerItem.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Removendo...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Remover Selecionadas
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
