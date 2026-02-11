import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useGestoresProduto } from '@/hooks/useGestores';
import {
  ClienteFase,
  ClienteTemperatura,
  CLIENTE_FASE_LABELS,
  CLIENTE_TEMPERATURA_LABELS,
} from '@/types/clientes.types';

export interface AcaoEmLoteData {
  gestor_id?: string | null;
  fase?: ClienteFase;
  temperatura?: ClienteTemperatura | null;
}

type FieldAction = 'keep' | 'set' | 'clear';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  onConfirm: (data: AcaoEmLoteData) => void;
  isLoading: boolean;
}

export function AcaoEmLoteDialog({
  open,
  onOpenChange,
  selectedCount,
  onConfirm,
  isLoading,
}: Props) {
  const { data: gestores = [] } = useGestoresProduto({ enabled: open });

  // State for each field action
  const [gestorAction, setGestorAction] = useState<FieldAction>('keep');
  const [gestorValue, setGestorValue] = useState<string>('');

  const [faseAction, setFaseAction] = useState<FieldAction>('keep');
  const [faseValue, setFaseValue] = useState<ClienteFase>('prospecto');

  const [temperaturaAction, setTemperaturaAction] = useState<FieldAction>('keep');
  const [temperaturaValue, setTemperaturaValue] = useState<ClienteTemperatura>('morno');

  const handleConfirm = () => {
    const data: AcaoEmLoteData = {};

    if (gestorAction === 'set' && gestorValue) {
      data.gestor_id = gestorValue;
    } else if (gestorAction === 'clear') {
      data.gestor_id = null;
    }

    if (faseAction === 'set') {
      data.fase = faseValue;
    }

    if (temperaturaAction === 'set') {
      data.temperatura = temperaturaValue;
    } else if (temperaturaAction === 'clear') {
      data.temperatura = null;
    }

    // Only submit if at least one field was changed
    if (Object.keys(data).length === 0) {
      return;
    }

    onConfirm(data);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset state when closing
      setGestorAction('keep');
      setGestorValue('');
      setFaseAction('keep');
      setFaseValue('prospecto');
      setTemperaturaAction('keep');
      setTemperaturaValue('morno');
    }
    onOpenChange(newOpen);
  };

  const hasChanges =
    gestorAction !== 'keep' || faseAction !== 'keep' || temperaturaAction !== 'keep';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar em Lote</DialogTitle>
          <DialogDescription>
            Alterando {selectedCount} cliente(s) selecionado(s). Apenas os campos modificados
            serão atualizados.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Gestor de Produto */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Gestor de Produto</Label>
            <Select
              value={gestorAction}
              onValueChange={(v) => setGestorAction(v as FieldAction)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="keep">Não alterar</SelectItem>
                <SelectItem value="set">Definir para...</SelectItem>
                <SelectItem value="clear">Remover gestor</SelectItem>
              </SelectContent>
            </Select>
            {gestorAction === 'set' && (
              <Select value={gestorValue} onValueChange={setGestorValue}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o gestor" />
                </SelectTrigger>
                <SelectContent>
                  {gestores.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Fase */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Fase</Label>
            <Select
              value={faseAction}
              onValueChange={(v) => setFaseAction(v as FieldAction)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="keep">Não alterar</SelectItem>
                <SelectItem value="set">Definir para...</SelectItem>
              </SelectContent>
            </Select>
            {faseAction === 'set' && (
              <Select
                value={faseValue}
                onValueChange={(v) => setFaseValue(v as ClienteFase)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CLIENTE_FASE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Temperatura */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Temperatura</Label>
            <Select
              value={temperaturaAction}
              onValueChange={(v) => setTemperaturaAction(v as FieldAction)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="keep">Não alterar</SelectItem>
                <SelectItem value="set">Definir para...</SelectItem>
                <SelectItem value="clear">Remover temperatura</SelectItem>
              </SelectContent>
            </Select>
            {temperaturaAction === 'set' && (
              <Select
                value={temperaturaValue}
                onValueChange={(v) => setTemperaturaValue(v as ClienteTemperatura)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CLIENTE_TEMPERATURA_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading || !hasChanges}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Atualizando...
              </>
            ) : (
              'Confirmar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
