import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useUnidadesDisponiveis, useBoxesDisponiveis, useAcaoUnidade } from '@/hooks/useNexa';

type Acao = 'reservar' | 'vender' | 'bloquear';

export function UnidadeAcaoDialog({
  open, onOpenChange, visitaId, empreendimentoId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  visitaId: string;
  empreendimentoId: string;
}) {
  const { data: unidades, isLoading } = useUnidadesDisponiveis(open ? empreendimentoId : undefined);
  const { data: boxes } = useBoxesDisponiveis(open ? empreendimentoId : undefined);
  const acao = useAcaoUnidade();
  const [unidadeId, setUnidadeId] = useState<string>('');
  const [boxIds, setBoxIds] = useState<string[]>([]);
  const [tipoAcao, setTipoAcao] = useState<Acao>('reservar');

  const toggleBox = (id: string) => {
    setBoxIds((prev) => prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]);
  };

  const submit = async () => {
    if (!unidadeId) return;
    await acao.mutateAsync({ visitaId, unidadeId, boxIds, acao: tipoAcao });
    setUnidadeId(''); setBoxIds([]); setTipoAcao('reservar');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader><DialogTitle>Registrar interesse em unidade</DialogTitle></DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Ação</Label>
            <RadioGroup value={tipoAcao} onValueChange={(v) => setTipoAcao(v as Acao)} className="flex gap-4 mt-2">
              <label className="flex items-center gap-2"><RadioGroupItem value="reservar" /> Reservar</label>
              <label className="flex items-center gap-2"><RadioGroupItem value="vender" /> Vender</label>
              <label className="flex items-center gap-2"><RadioGroupItem value="bloquear" /> Bloquear</label>
            </RadioGroup>
          </div>

          <div>
            <Label>Unidade disponível *</Label>
            {isLoading ? (
              <Skeleton className="h-40 mt-2" />
            ) : !unidades?.length ? (
              <p className="text-sm text-muted-foreground mt-2">Nenhuma unidade disponível.</p>
            ) : (
              <ScrollArea className="h-48 border rounded mt-2">
                <div className="p-2">
                  <RadioGroup value={unidadeId} onValueChange={setUnidadeId}>
                    {unidades.map((u: any) => (
                      <label key={u.unidade_id} className="flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer">
                        <RadioGroupItem value={u.unidade_id} />
                        <span className="text-sm">
                          {u.bloco ? `Bl. ${u.bloco} · ` : ''}Und. {u.unidade}
                          {u.andar != null && ` · ${u.andar}º`}
                          {u.tipologia && ` · ${u.tipologia}`}
                          {u.valor && ` · ${Number(u.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`}
                        </span>
                      </label>
                    ))}
                  </RadioGroup>
                </div>
              </ScrollArea>
            )}
          </div>

          {boxes && boxes.length > 0 && (
            <div>
              <Label>Boxes/Vagas (opcional)</Label>
              <ScrollArea className="h-32 border rounded mt-2">
                <div className="p-2 grid grid-cols-4 gap-2">
                  {boxes.map((b: any) => (
                    <label key={b.id} className="flex items-center gap-2 text-sm">
                      <Checkbox checked={boxIds.includes(b.id)} onCheckedChange={() => toggleBox(b.id)} />
                      {b.numero}
                    </label>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={!unidadeId || acao.isPending}>
            {acao.isPending ? 'Processando...' : 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
