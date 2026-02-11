import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Loader2, Bed, Bath, Car, Maximize, Pencil, Trash2, Home, Building, Map } from 'lucide-react';
import { useTipologias, useDeleteTipologia } from '@/hooks/useTipologias';
import { TipologiaForm } from './TipologiaForm';
import type { Tipologia, TipologiaCategoria } from '@/types/empreendimentos.types';
import { TIPOLOGIA_CATEGORIA_LABELS } from '@/types/empreendimentos.types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface TipologiasTabProps {
  empreendimentoId: string;
}

const CATEGORIA_ICONS: Record<TipologiaCategoria, React.ReactNode> = {
  casa: <Home className="h-3.5 w-3.5" />,
  apartamento: <Building className="h-3.5 w-3.5" />,
  terreno: <Map className="h-3.5 w-3.5" />,
};

const CATEGORIA_COLORS: Record<TipologiaCategoria, string> = {
  casa: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  apartamento: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  terreno: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
};

export function TipologiasTab({ empreendimentoId }: TipologiasTabProps) {
  const { data: tipologias, isLoading } = useTipologias(empreendimentoId);
  const deleteTipologia = useDeleteTipologia();

  const [formOpen, setFormOpen] = useState(false);
  const [selectedTipologia, setSelectedTipologia] = useState<Tipologia | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tipologiaToDelete, setTipologiaToDelete] = useState<Tipologia | null>(null);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const handleEdit = (tipologia: Tipologia) => {
    setSelectedTipologia(tipologia);
    setFormOpen(true);
  };

  const handleNew = () => {
    setSelectedTipologia(null);
    setFormOpen(true);
  };

  const handleDeleteClick = (tipologia: Tipologia) => {
    setTipologiaToDelete(tipologia);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (tipologiaToDelete) {
      deleteTipologia.mutate({ id: tipologiaToDelete.id, empreendimentoId });
      setDeleteDialogOpen(false);
      setTipologiaToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold">Tipologias</h3>
            <p className="text-sm text-muted-foreground">{tipologias?.length || 0} tipologias cadastradas</p>
          </div>
          <Button size="sm" onClick={handleNew}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Tipologia
          </Button>
        </div>

        {tipologias && tipologias.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tipologias.map((tipologia) => {
              const categoria = (tipologia.categoria || 'apartamento') as TipologiaCategoria;
              const isTerreno = categoria === 'terreno';

              return (
                <div 
                  key={tipologia.id} 
                  className="border rounded-lg p-4 hover:border-primary transition-colors group relative"
                >
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(tipologia)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteClick(tipologia)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className={CATEGORIA_COLORS[categoria]}>
                      {CATEGORIA_ICONS[categoria]}
                      <span className="ml-1">{TIPOLOGIA_CATEGORIA_LABELS[categoria]}</span>
                    </Badge>
                  </div>

                  <h4 className="font-semibold mb-2">{tipologia.nome}</h4>

                  {!isTerreno && (
                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <Bed className="h-4 w-4" />
                        <span>{tipologia.quartos} quartos</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Bath className="h-4 w-4" />
                        <span>{tipologia.banheiros} banh.</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Car className="h-4 w-4" />
                        <span>{tipologia.vagas} vagas</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Maximize className="h-4 w-4" />
                        <span>{tipologia.area_privativa || '-'}m²</span>
                      </div>
                    </div>
                  )}

                  {isTerreno && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                      <Maximize className="h-4 w-4" />
                      <span>{tipologia.area_privativa || '-'}m²</span>
                    </div>
                  )}

                  {tipologia.valor_base && (
                    <p className="font-semibold text-primary">{formatCurrency(Number(tipologia.valor_base))}</p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">Nenhuma tipologia cadastrada</p>
        )}

        <TipologiaForm
          open={formOpen}
          onOpenChange={setFormOpen}
          empreendimentoId={empreendimentoId}
          tipologia={selectedTipologia}
        />

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Tipologia</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir a tipologia "{tipologiaToDelete?.nome}"? 
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
