import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useCreateBox } from '@/hooks/useBoxes';
import { useBlocos } from '@/hooks/useBlocos';
import { BOX_TIPO_LABELS, BoxTipo } from '@/types/empreendimentos.types';

interface BoxFormProps {
  empreendimentoId: string;
  onSuccess: () => void;
}

export function BoxForm({ empreendimentoId, onSuccess }: BoxFormProps) {
  const [formData, setFormData] = useState({
    numero: '',
    bloco_id: '',
    tipo: 'simples' as BoxTipo,
    coberto: false,
    valor: '',
    observacoes: '',
  });

  const { data: blocos = [] } = useBlocos(empreendimentoId);
  const createBox = useCreateBox();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    createBox.mutate(
      {
        empreendimentoId,
        data: {
          numero: formData.numero,
          bloco_id: formData.bloco_id || undefined,
          tipo: formData.tipo,
          coberto: formData.coberto,
          valor: formData.valor ? parseFloat(formData.valor.replace(',', '.')) : undefined,
          observacoes: formData.observacoes || undefined,
        },
      },
      { onSuccess }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="numero">Número *</Label>
        <Input
          id="numero"
          value={formData.numero}
          onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
          placeholder="Ex: V001"
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Bloco (opcional)</Label>
        <Select
          value={formData.bloco_id}
          onValueChange={(v) => setFormData({ ...formData, bloco_id: v === 'none' ? '' : v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione um bloco" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Nenhum</SelectItem>
            {blocos.map((bloco) => (
              <SelectItem key={bloco.id} value={bloco.id}>
                {bloco.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Tipo de Vaga</Label>
        <Select
          value={formData.tipo}
          onValueChange={(v) => setFormData({ ...formData, tipo: v as BoxTipo })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(BOX_TIPO_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between p-3 border rounded-lg">
        <div>
          <Label htmlFor="coberto-individual" className="cursor-pointer">Vaga Coberta</Label>
          <p className="text-xs text-muted-foreground">Marque se a vaga é coberta</p>
        </div>
        <Switch
          id="coberto-individual"
          checked={formData.coberto}
          onCheckedChange={(checked) => setFormData({ ...formData, coberto: checked })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="valor-individual">Valor (opcional)</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
            R$
          </span>
          <Input
            id="valor-individual"
            value={formData.valor}
            onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
            className="pl-10"
            placeholder="0,00"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="observacoes">Observações (opcional)</Label>
        <Textarea
          id="observacoes"
          value={formData.observacoes}
          onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
          placeholder="Observações sobre o box"
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={createBox.isPending || !formData.numero.trim()}>
          {createBox.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Criar Box
        </Button>
      </div>
    </form>
  );
}
