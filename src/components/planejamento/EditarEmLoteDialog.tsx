import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { usePlanejamentoItens } from '@/hooks/usePlanejamentoItens';
import { usePlanejamentoItemResponsaveis } from '@/hooks/usePlanejamentoItemResponsaveis';
import { usePlanejamentoStatus } from '@/hooks/usePlanejamentoStatus';
import { usePlanejamentoFases } from '@/hooks/usePlanejamentoFases';
import { useFuncionariosSeven } from '@/hooks/useFuncionariosSeven';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: Set<string>;
  empreendimentoId: string;
  onSuccess: () => void;
}

type FieldAction = 'manter' | 'definir' | 'limpar';
type ResponsaveisAction = 'manter' | 'adicionar' | 'substituir' | 'remover';

export function EditarEmLoteDialog({ 
  open, 
  onOpenChange, 
  selectedIds, 
  empreendimentoId,
  onSuccess 
}: Props) {
  const { updateItem } = usePlanejamentoItens({ empreendimento_id: empreendimentoId });
  const { addResponsaveisToMultiple, removeAllResponsaveis, setResponsaveis } = usePlanejamentoItemResponsaveis();
  const { statusList } = usePlanejamentoStatus();
  const { fases } = usePlanejamentoFases();
  const { data: funcionarios } = useFuncionariosSeven();

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Status
  const [statusAction, setStatusAction] = useState<FieldAction>('manter');
  const [statusValue, setStatusValue] = useState<string>('');

  // Fase
  const [faseAction, setFaseAction] = useState<FieldAction>('manter');
  const [faseValue, setFaseValue] = useState<string>('');

  // Responsáveis
  const [responsaveisAction, setResponsaveisAction] = useState<ResponsaveisAction>('manter');
  const [responsaveisValue, setResponsaveisValue] = useState<string[]>([]);

  // Data Início
  const [dataInicioAction, setDataInicioAction] = useState<FieldAction>('manter');
  const [dataInicioValue, setDataInicioValue] = useState<Date | undefined>();

  // Data Fim
  const [dataFimAction, setDataFimAction] = useState<FieldAction>('manter');
  const [dataFimValue, setDataFimValue] = useState<Date | undefined>();

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const itemIds = Array.from(selectedIds);

      // Validar datas se ambas estão sendo definidas
      if (dataInicioAction === 'definir' && dataFimAction === 'definir' && dataInicioValue && dataFimValue) {
        const inicioStr = format(dataInicioValue, 'yyyy-MM-dd');
        const fimStr = format(dataFimValue, 'yyyy-MM-dd');
        if (fimStr < inicioStr) {
          toast.error('A data de fim deve ser igual ou posterior à data de início');
          setIsSubmitting(false);
          return;
        }
      }

      // Atualizar campos básicos
      const updates: Record<string, any> = {};
      
      if (statusAction === 'definir' && statusValue) {
        updates.status_id = statusValue;
      }
      
      if (faseAction === 'definir' && faseValue) {
        updates.fase_id = faseValue;
      }

      if (dataInicioAction === 'definir' && dataInicioValue) {
        updates.data_inicio = format(dataInicioValue, 'yyyy-MM-dd');
      } else if (dataInicioAction === 'limpar') {
        updates.data_inicio = null;
      }

      if (dataFimAction === 'definir' && dataFimValue) {
        updates.data_fim = format(dataFimValue, 'yyyy-MM-dd');
      } else if (dataFimAction === 'limpar') {
        updates.data_fim = null;
      }

      // Aplicar updates se houver
      if (Object.keys(updates).length > 0) {
        await Promise.all(
          itemIds.map(id => updateItem.mutateAsync({ id, ...updates }))
        );
      }

      // Gerenciar responsáveis
      if (responsaveisAction === 'adicionar' && responsaveisValue.length > 0) {
        await addResponsaveisToMultiple.mutateAsync({ itemIds, userIds: responsaveisValue });
      } else if (responsaveisAction === 'substituir' && responsaveisValue.length > 0) {
        await Promise.all(
          itemIds.map(itemId => setResponsaveis.mutateAsync({ itemId, userIds: responsaveisValue }))
        );
      } else if (responsaveisAction === 'remover') {
        await removeAllResponsaveis.mutateAsync(itemIds);
      }

      toast.success(`${itemIds.length} item(ns) atualizado(s)`);
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error('Erro ao atualizar itens');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleResponsavel = (userId: string) => {
    setResponsaveisValue(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const hasChanges = 
    statusAction !== 'manter' ||
    faseAction !== 'manter' ||
    responsaveisAction !== 'manter' ||
    dataInicioAction !== 'manter' ||
    dataFimAction !== 'manter';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar em Lote</DialogTitle>
          <DialogDescription>
            {selectedIds.size} item(ns) selecionado(s)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <div className="flex gap-2">
              <Select value={statusAction} onValueChange={(v) => setStatusAction(v as FieldAction)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manter">Não alterar</SelectItem>
                  <SelectItem value="definir">Definir para</SelectItem>
                </SelectContent>
              </Select>
              {statusAction === 'definir' && (
                <Select value={statusValue} onValueChange={setStatusValue}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Selecionar status..." />
                  </SelectTrigger>
                  <SelectContent>
                    {statusList?.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.cor }} />
                          {s.nome}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Fase */}
          <div className="space-y-2">
            <Label>Fase</Label>
            <div className="flex gap-2">
              <Select value={faseAction} onValueChange={(v) => setFaseAction(v as FieldAction)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manter">Não alterar</SelectItem>
                  <SelectItem value="definir">Definir para</SelectItem>
                </SelectContent>
              </Select>
              {faseAction === 'definir' && (
                <Select value={faseValue} onValueChange={setFaseValue}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Selecionar fase..." />
                  </SelectTrigger>
                  <SelectContent>
                    {fases?.map(f => (
                      <SelectItem key={f.id} value={f.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: f.cor }} />
                          {f.nome}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Responsáveis */}
          <div className="space-y-2">
            <Label>Responsáveis</Label>
            <Select value={responsaveisAction} onValueChange={(v) => setResponsaveisAction(v as ResponsaveisAction)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manter">Não alterar</SelectItem>
                <SelectItem value="adicionar">Adicionar</SelectItem>
                <SelectItem value="substituir">Substituir por</SelectItem>
                <SelectItem value="remover">Remover todos</SelectItem>
              </SelectContent>
            </Select>
            {(responsaveisAction === 'adicionar' || responsaveisAction === 'substituir') && (
              <div className="border rounded-md p-2 max-h-32 overflow-y-auto space-y-1">
                {funcionarios?.map(func => (
                  <div key={func.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`func-${func.id}`}
                      checked={responsaveisValue.includes(func.id)}
                      onCheckedChange={() => toggleResponsavel(func.id)}
                    />
                    <label 
                      htmlFor={`func-${func.id}`}
                      className="text-sm cursor-pointer flex-1"
                    >
                      {func.full_name}
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Data Início */}
          <div className="space-y-2">
            <Label>Data Início</Label>
            <div className="flex gap-2">
              <Select value={dataInicioAction} onValueChange={(v) => setDataInicioAction(v as FieldAction)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manter">Não alterar</SelectItem>
                  <SelectItem value="definir">Definir para</SelectItem>
                  <SelectItem value="limpar">Limpar</SelectItem>
                </SelectContent>
              </Select>
              {dataInicioAction === 'definir' && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("flex-1 justify-start text-left font-normal", !dataInicioValue && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dataInicioValue ? format(dataInicioValue, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecionar...'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dataInicioValue}
                      onSelect={setDataInicioValue}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </div>

          {/* Data Fim */}
          <div className="space-y-2">
            <Label>Data Fim</Label>
            <div className="flex gap-2">
              <Select value={dataFimAction} onValueChange={(v) => setDataFimAction(v as FieldAction)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manter">Não alterar</SelectItem>
                  <SelectItem value="definir">Definir para</SelectItem>
                  <SelectItem value="limpar">Limpar</SelectItem>
                </SelectContent>
              </Select>
              {dataFimAction === 'definir' && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("flex-1 justify-start text-left font-normal", !dataFimValue && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dataFimValue ? format(dataFimValue, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecionar...'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dataFimValue}
                      onSelect={setDataFimValue}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !hasChanges}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Aplicar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
