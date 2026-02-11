import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CurrencyInput } from '@/components/ui/currency-input';
import { useCreateComissao, useUpdateComissao } from '@/hooks/useComissoes';
import { useEmpreendimentos } from '@/hooks/useEmpreendimentos';
import { useGestoresProduto } from '@/hooks/useGestores';
import { useContratos } from '@/hooks/useContratos';
import type { Comissao, ComissaoFormData, ComissaoStatus } from '@/types/comissoes.types';
import { formatarMoeda } from '@/lib/formatters';

interface ComissaoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  comissaoToEdit?: Comissao | null;
}

const STATUS_OPTIONS: { value: ComissaoStatus; label: string }[] = [
  { value: 'pendente', label: 'Pendente' },
  { value: 'parcialmente_pago', label: 'Parcialmente Pago' },
  { value: 'pago', label: 'Pago' },
  { value: 'cancelado', label: 'Cancelado' },
];

export function ComissaoForm({ open, onOpenChange, comissaoToEdit }: ComissaoFormProps) {
  const isEditing = !!comissaoToEdit;

  const [formData, setFormData] = useState<ComissaoFormData>({
    empreendimento_id: '',
    valor_venda: 0,
    percentual_comissao: 3,
    valor_comissao: 0,
  });

  const [status, setStatus] = useState<ComissaoStatus>('pendente');

  const { data: empreendimentos = [] } = useEmpreendimentos();
  const { data: gestores = [] } = useGestoresProduto();
  const { data: contratos = [] } = useContratos();
  const { mutate: createComissao, isPending: isCreating } = useCreateComissao();
  const { mutate: updateComissao, isPending: isUpdating } = useUpdateComissao();

  const isPending = isCreating || isUpdating;

  // Contratos disponíveis (apenas assinados)
  const contratosDisponiveis = contratos.filter(c => c.status === 'assinado');

  // Load data when editing
  useEffect(() => {
    if (comissaoToEdit) {
      setFormData({
        contrato_id: comissaoToEdit.contrato_id || undefined,
        empreendimento_id: comissaoToEdit.empreendimento_id,
        gestor_id: comissaoToEdit.gestor_id || undefined,
        valor_venda: comissaoToEdit.valor_venda,
        percentual_comissao: comissaoToEdit.percentual_comissao,
        valor_comissao: comissaoToEdit.valor_comissao || 0,
        observacoes: comissaoToEdit.observacoes || undefined,
      });
      setStatus(comissaoToEdit.status);
    } else {
      // Reset form for new commission
      setFormData({
        empreendimento_id: '',
        valor_venda: 0,
        percentual_comissao: 3,
        valor_comissao: 0,
      });
      setStatus('pendente');
    }
  }, [comissaoToEdit, open]);

  // Calculate commission when values change
  useEffect(() => {
    const valorComissao = (formData.valor_venda * formData.percentual_comissao) / 100;
    
    setFormData(prev => ({
      ...prev,
      valor_comissao: valorComissao,
    }));
  }, [formData.valor_venda, formData.percentual_comissao]);

  // Auto-fill when contract is selected
  const handleContratoChange = (contratoId: string) => {
    if (contratoId === '__none__') {
      setFormData({ ...formData, contrato_id: undefined });
      return;
    }
    
    const contrato = contratos.find(c => c.id === contratoId);
    if (contrato) {
      setFormData({
        ...formData,
        contrato_id: contratoId,
        empreendimento_id: contrato.empreendimento_id,
        gestor_id: contrato.gestor_id || formData.gestor_id,
        valor_venda: contrato.valor_contrato || 0
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditing && comissaoToEdit) {
      updateComissao(
        {
          id: comissaoToEdit.id,
          empreendimento_id: formData.empreendimento_id,
          contrato_id: formData.contrato_id || null,
          gestor_id: formData.gestor_id || null,
          valor_venda: formData.valor_venda,
          percentual_comissao: formData.percentual_comissao,
          valor_comissao: formData.valor_comissao,
          observacoes: formData.observacoes || null,
          status,
        },
        {
          onSuccess: () => {
            onOpenChange(false);
          },
        }
      );
    } else {
      createComissao(formData, {
        onSuccess: () => {
          onOpenChange(false);
          setFormData({
            empreendimento_id: '',
            valor_venda: 0,
            percentual_comissao: 3,
            valor_comissao: 0,
          });
        },
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? `Editar Comissão ${comissaoToEdit?.numero}` : 'Nova Comissão - Gestor do Produto'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="empreendimento">Empreendimento *</Label>
              <Select
                value={formData.empreendimento_id}
                onValueChange={(value) => setFormData({ ...formData, empreendimento_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {empreendimentos.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contrato">Contrato (opcional)</Label>
              <Select
                value={formData.contrato_id || '__none__'}
                onValueChange={handleContratoChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Nenhum</SelectItem>
                  {contratosDisponiveis.map((contrato) => (
                    <SelectItem key={contrato.id} value={contrato.id}>
                      {contrato.numero}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Ao selecionar um contrato, os campos serão preenchidos automaticamente
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gestor">Gestor do Produto *</Label>
            <Select
              value={formData.gestor_id || '__none__'}
              onValueChange={(value) => setFormData({ ...formData, gestor_id: value === '__none__' ? undefined : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o gestor..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Nenhum</SelectItem>
                {gestores.map((gestor) => (
                  <SelectItem key={gestor.id} value={gestor.id}>
                    {gestor.full_name}
                    {gestor.percentual_comissao ? ` (${gestor.percentual_comissao}%)` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="valor_venda">Valor da Venda *</Label>
            <CurrencyInput
              id="valor_venda"
              value={formData.valor_venda}
              onChange={(value) => setFormData({ ...formData, valor_venda: value })}
            />
          </div>

          <div className="space-y-4 p-4 border rounded-lg">
            <h4 className="font-medium">Comissão do Gestor</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="percentual_comissao">Percentual (%)</Label>
                <Input
                  id="percentual_comissao"
                  type="number"
                  step="0.01"
                  value={formData.percentual_comissao}
                  onChange={(e) => setFormData({ ...formData, percentual_comissao: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Valor Calculado</Label>
                <div className="text-2xl font-bold text-primary pt-1">
                  {formatarMoeda(formData.valor_comissao)}
                </div>
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as ComissaoStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes || ''}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending || !formData.empreendimento_id || formData.valor_venda <= 0}>
              {isPending ? (isEditing ? 'Salvando...' : 'Criando...') : (isEditing ? 'Salvar Alterações' : 'Criar Comissão')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
