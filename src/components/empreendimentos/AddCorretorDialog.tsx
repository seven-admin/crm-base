import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useCorretores } from '@/hooks/useCorretores';
import { useAddCorretorToEmpreendimento } from '@/hooks/useEmpreendimentoEquipe';
import type { EmpreendimentoCorretor } from '@/types/empreendimentos.types';

interface AddCorretorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empreendimentoId: string;
  corretoresVinculados: EmpreendimentoCorretor[];
}

export function AddCorretorDialog({ 
  open, 
  onOpenChange, 
  empreendimentoId, 
  corretoresVinculados 
}: AddCorretorDialogProps) {
  const [selectedCorretorId, setSelectedCorretorId] = useState<string>('');
  const { corretores, isLoading } = useCorretores();
  const addCorretor = useAddCorretorToEmpreendimento();

  // Filtrar corretores já vinculados
  const corretoresDisponiveis = corretores.filter(
    (c) => !corretoresVinculados.some((cv) => cv.corretor_id === c.id)
  );

  const handleSubmit = () => {
    if (!selectedCorretorId) return;

    addCorretor.mutate(
      { empreendimentoId, corretorId: selectedCorretorId },
      {
        onSuccess: () => {
          onOpenChange(false);
          setSelectedCorretorId('');
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Corretor</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Selecione o Corretor</Label>
            <Select 
              value={selectedCorretorId} 
              onValueChange={setSelectedCorretorId}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder={isLoading ? 'Carregando...' : 'Selecione um corretor'} />
              </SelectTrigger>
              <SelectContent>
                {corretoresDisponiveis.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    Todos os corretores já estão vinculados
                  </div>
                ) : (
                  corretoresDisponiveis.map((corretor) => (
                    <SelectItem key={corretor.id} value={corretor.id}>
                      <div className="flex flex-col">
                        <span>{corretor.nome_completo}</span>
                        {corretor.creci && (
                          <span className="text-xs text-muted-foreground">CRECI: {corretor.creci}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!selectedCorretorId || addCorretor.isPending}
            >
              {addCorretor.isPending ? 'Adicionando...' : 'Adicionar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
