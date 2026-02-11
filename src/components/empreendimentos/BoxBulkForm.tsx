import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useCreateBoxesBulk } from '@/hooks/useBoxes';
import { useBlocos } from '@/hooks/useBlocos';
import { BOX_TIPO_LABELS, BoxTipo } from '@/types/empreendimentos.types';

interface BoxBulkFormProps {
  empreendimentoId: string;
  onSuccess: () => void;
}

export function BoxBulkForm({ empreendimentoId, onSuccess }: BoxBulkFormProps) {
  const [formData, setFormData] = useState({
    quantidade: 10,
    numero_inicial: 1,
    prefixo: 'V',
    bloco_id: '',
    tipo: 'simples' as BoxTipo,
    coberto: false,
    valor: '',
  });

  const { data: blocos = [] } = useBlocos(empreendimentoId);
  const createBulk = useCreateBoxesBulk();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    createBulk.mutate(
      {
        empreendimentoId,
        data: {
          quantidade: formData.quantidade,
          numero_inicial: formData.numero_inicial,
          prefixo: formData.prefixo || undefined,
          bloco_id: formData.bloco_id || undefined,
          tipo: formData.tipo,
          coberto: formData.coberto,
          valor: formData.valor ? parseFloat(formData.valor.replace(',', '.')) : undefined,
        },
      },
      {
        onSuccess: () => {
          onSuccess();
        },
      }
    );
  };

  const previewNumeros = () => {
    const nums = [];
    for (let i = 0; i < Math.min(formData.quantidade, 5); i++) {
      const numero = formData.prefixo
        ? `${formData.prefixo}${String(formData.numero_inicial + i).padStart(3, '0')}`
        : String(formData.numero_inicial + i).padStart(3, '0');
      nums.push(numero);
    }
    if (formData.quantidade > 5) {
      nums.push('...');
    }
    return nums.join(', ');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="quantidade">Quantidade</Label>
          <Input
            id="quantidade"
            type="number"
            min={1}
            max={500}
            value={formData.quantidade}
            onChange={(e) => setFormData({ ...formData, quantidade: parseInt(e.target.value) || 1 })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="numero_inicial">Número Inicial</Label>
          <Input
            id="numero_inicial"
            type="number"
            min={1}
            value={formData.numero_inicial}
            onChange={(e) => setFormData({ ...formData, numero_inicial: parseInt(e.target.value) || 1 })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="prefixo">Prefixo (opcional)</Label>
        <Input
          id="prefixo"
          value={formData.prefixo}
          onChange={(e) => setFormData({ ...formData, prefixo: e.target.value.toUpperCase() })}
          placeholder="Ex: V, BOX, G"
          maxLength={5}
        />
        <p className="text-xs text-muted-foreground">
          Preview: {previewNumeros()}
        </p>
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
          <Label htmlFor="coberto" className="cursor-pointer">Vaga Coberta</Label>
          <p className="text-xs text-muted-foreground">Marque se as vagas são cobertas</p>
        </div>
        <Switch
          id="coberto"
          checked={formData.coberto}
          onCheckedChange={(checked) => setFormData({ ...formData, coberto: checked })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="valor">Valor Unitário (opcional)</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
            R$
          </span>
          <Input
            id="valor"
            value={formData.valor}
            onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
            className="pl-10"
            placeholder="0,00"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={createBulk.isPending}>
          {createBulk.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Criar {formData.quantidade} Boxes
        </Button>
      </div>
    </form>
  );
}
