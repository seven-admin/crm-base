import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useImobiliarias } from '@/hooks/useImobiliarias';
import { useAddImobiliariaToEmpreendimento } from '@/hooks/useEmpreendimentoEquipe';
import type { EmpreendimentoImobiliaria } from '@/types/empreendimentos.types';

interface AddImobiliariaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empreendimentoId: string;
  imobiliariasVinculadas: EmpreendimentoImobiliaria[];
}

export function AddImobiliariaDialog({ 
  open, 
  onOpenChange, 
  empreendimentoId, 
  imobiliariasVinculadas 
}: AddImobiliariaDialogProps) {
  const [selectedImobiliariaId, setSelectedImobiliariaId] = useState<string>('');
  const [comissaoPercentual, setComissaoPercentual] = useState<string>('');
  const { imobiliarias, isLoading } = useImobiliarias();
  const addImobiliaria = useAddImobiliariaToEmpreendimento();

  // Filtrar imobiliárias já vinculadas
  const imobiliariasDisponiveis = imobiliarias.filter(
    (i) => !imobiliariasVinculadas.some((iv) => iv.imobiliaria_id === i.id)
  );

  const handleSubmit = () => {
    if (!selectedImobiliariaId) return;

    addImobiliaria.mutate(
      { 
        empreendimentoId, 
        imobiliariaId: selectedImobiliariaId,
        comissaoPercentual: comissaoPercentual ? parseFloat(comissaoPercentual) : undefined 
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setSelectedImobiliariaId('');
          setComissaoPercentual('');
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Imobiliária</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Selecione a Imobiliária</Label>
            <Select 
              value={selectedImobiliariaId} 
              onValueChange={setSelectedImobiliariaId}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder={isLoading ? 'Carregando...' : 'Selecione uma imobiliária'} />
              </SelectTrigger>
              <SelectContent>
                {imobiliariasDisponiveis.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    Todas as imobiliárias já estão vinculadas
                  </div>
                ) : (
                  imobiliariasDisponiveis.map((imobiliaria) => (
                    <SelectItem key={imobiliaria.id} value={imobiliaria.id}>
                      <div className="flex flex-col">
                        <span>{imobiliaria.nome}</span>
                        {imobiliaria.cnpj && (
                          <span className="text-xs text-muted-foreground">CNPJ: {imobiliaria.cnpj}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Comissão (%)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              max="100"
              placeholder="Ex: 5.00"
              value={comissaoPercentual}
              onChange={(e) => setComissaoPercentual(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Percentual de comissão para esta imobiliária neste empreendimento
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!selectedImobiliariaId || addImobiliaria.isPending}
            >
              {addImobiliaria.isPending ? 'Adicionando...' : 'Adicionar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
