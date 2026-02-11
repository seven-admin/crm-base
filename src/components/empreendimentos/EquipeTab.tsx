import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Loader2, Trash2, Building, UserCheck } from 'lucide-react';
import { useEmpreendimentoCorretores, useEmpreendimentoImobiliarias, useRemoveCorretorFromEmpreendimento, useRemoveImobiliariaFromEmpreendimento } from '@/hooks/useEmpreendimentoEquipe';
import { AddCorretorDialog } from './AddCorretorDialog';
import { AddImobiliariaDialog } from './AddImobiliariaDialog';

interface EquipeTabProps {
  empreendimentoId: string;
}

export function EquipeTab({ empreendimentoId }: EquipeTabProps) {
  const { data: corretores, isLoading: loadingCorretores } = useEmpreendimentoCorretores(empreendimentoId);
  const { data: imobiliarias, isLoading: loadingImobiliarias } = useEmpreendimentoImobiliarias(empreendimentoId);
  const removeCorretor = useRemoveCorretorFromEmpreendimento();
  const removeImobiliaria = useRemoveImobiliariaFromEmpreendimento();

  const [addCorretorOpen, setAddCorretorOpen] = useState(false);
  const [addImobiliariaOpen, setAddImobiliariaOpen] = useState(false);

  if (loadingCorretores || loadingImobiliarias) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              <h3 className="font-semibold">Corretores Autorizados</h3>
            </div>
            <Button size="sm" variant="outline" onClick={() => setAddCorretorOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>

          {corretores && corretores.length > 0 ? (
            <div className="space-y-3">
              {corretores.map((ec) => (
                <div key={ec.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{ec.corretor?.nome_completo}</p>
                    <p className="text-sm text-muted-foreground">{ec.corretor?.creci && `CRECI: ${ec.corretor.creci}`}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeCorretor.mutate({ id: ec.id, empreendimentoId })}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">Nenhum corretor autorizado</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              <h3 className="font-semibold">Imobiliárias Parceiras</h3>
            </div>
            <Button size="sm" variant="outline" onClick={() => setAddImobiliariaOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>

          {imobiliarias && imobiliarias.length > 0 ? (
            <div className="space-y-3">
              {imobiliarias.map((ei) => (
                <div key={ei.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{ei.imobiliaria?.nome}</p>
                    <p className="text-sm text-muted-foreground">
                      {ei.comissao_percentual ? `Comissão: ${ei.comissao_percentual}%` : 'Sem comissão definida'}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeImobiliaria.mutate({ id: ei.id, empreendimentoId })}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">Nenhuma imobiliária parceira</p>
          )}
        </CardContent>
      </Card>

      <AddCorretorDialog open={addCorretorOpen} onOpenChange={setAddCorretorOpen} empreendimentoId={empreendimentoId} corretoresVinculados={corretores || []} />
      <AddImobiliariaDialog open={addImobiliariaOpen} onOpenChange={setAddImobiliariaOpen} empreendimentoId={empreendimentoId} imobiliariasVinculadas={imobiliarias || []} />
    </div>
  );
}
