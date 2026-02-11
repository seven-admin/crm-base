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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { useEmpreendimentos } from '@/hooks/useEmpreendimentos';
import { useUnidades } from '@/hooks/useUnidades';
import { useClientes } from '@/hooks/useClientes';
import { useCorretores } from '@/hooks/useCorretores';
import { useImobiliarias } from '@/hooks/useImobiliarias';
import { useGestoresProduto } from '@/hooks/useGestores';
import { useContratoTemplates, useCreateContrato } from '@/hooks/useContratos';
import type { ContratoFormData } from '@/types/contratos.types';

interface ContratoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: {
    cliente_id: string;
    empreendimento_id: string;
    corretor_id?: string;
    imobiliaria_id?: string;
    valor?: number;
    unidade_ids: string[];
  };
}

const formatCurrency = (value: number | undefined | null) => {
  if (value === undefined || value === null) return '';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export function ContratoForm({ open, onOpenChange, initialData }: ContratoFormProps) {
  const { data: empreendimentos = [] } = useEmpreendimentos();
  const { data: clientes = [] } = useClientes();
  const { corretores = [] } = useCorretores();
  const { imobiliarias = [] } = useImobiliarias();
  const { data: gestores = [] } = useGestoresProduto();
  const { mutate: createContrato, isPending } = useCreateContrato();

  const [formData, setFormData] = useState<ContratoFormData>({
    cliente_id: '',
    empreendimento_id: '',
    unidade_ids: [],
  });

  const { data: unidades = [] } = useUnidades(formData.empreendimento_id);
  const { data: templates = [] } = useContratoTemplates(formData.empreendimento_id);

  // Initialize from initial data if available
  useEffect(() => {
    if (initialData) {
      setFormData({
        cliente_id: initialData.cliente_id,
        empreendimento_id: initialData.empreendimento_id,
        corretor_id: initialData.corretor_id,
        imobiliaria_id: initialData.imobiliaria_id,
        valor_contrato: initialData.valor,
        unidade_ids: initialData.unidade_ids,
      });
    }
  }, [initialData]);

  const unidadesDisponiveis = unidades.filter(
    u => u.status === 'disponivel' || u.status === 'reservada' || formData.unidade_ids.includes(u.id)
  );

  const handleUnitToggle = (unitId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      unidade_ids: checked
        ? [...prev.unidade_ids, unitId]
        : prev.unidade_ids.filter(id => id !== unitId),
    }));
  };

  // Calculate total from selected units - with guard to prevent infinite loops
  useEffect(() => {
    if (formData.unidade_ids.length === 0 || initialData) return;
    
    const total = unidades
      .filter(u => formData.unidade_ids.includes(u.id))
      .reduce((acc, u) => acc + (u.valor || 0), 0);
    const totalNormalizado = Math.round(total * 100) / 100;
    
    setFormData(prev => {
      const prevTotal = Math.round((prev.valor_contrato || 0) * 100) / 100;
      if (prevTotal === totalNormalizado) return prev; // Guard to prevent re-render
      return { ...prev, valor_contrato: totalNormalizado };
    });
  }, [formData.unidade_ids, unidades, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações obrigatórias
    if (!formData.cliente_id) {
      return;
    }
    
    if (!formData.empreendimento_id) {
      return;
    }
    
    if (formData.unidade_ids.length === 0) {
      return;
    }
    
    if (!formData.template_id) {
      return;
    }
    
    if (!formData.valor_contrato || formData.valor_contrato <= 0) {
      return;
    }
    
    if (!formData.gestor_id) {
      return;
    }

    createContrato(formData, {
      onSuccess: () => {
        onOpenChange(false);
        resetForm();
      },
    });
  };

  const resetForm = () => {
    setFormData({
      cliente_id: '',
      empreendimento_id: '',
      unidade_ids: [],
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Novo Contrato</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto -mx-6 px-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cliente">Cliente *</Label>
              <Select
                value={formData.cliente_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, cliente_id: value }))}
                disabled={!!initialData}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="empreendimento">Empreendimento *</Label>
              <Select
                value={formData.empreendimento_id}
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  empreendimento_id: value,
                  unidade_ids: [],
                  template_id: undefined,
                }))}
                disabled={!!initialData}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o empreendimento" />
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
          </div>

          {formData.empreendimento_id && (
            <div className="space-y-2">
              <Label>Unidades *</Label>
              <ScrollArea className="h-32 border rounded-md p-2">
                <div className="space-y-2">
                  {unidadesDisponiveis.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Nenhuma unidade disponível
                    </p>
                  ) : (
                    unidadesDisponiveis.map((unidade) => (
                      <div key={unidade.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={unidade.id}
                          checked={formData.unidade_ids.includes(unidade.id)}
                        onCheckedChange={(checked) => handleUnitToggle(unidade.id, !!checked)}
                          disabled={!!initialData}
                        />
                        <label htmlFor={unidade.id} className="text-sm flex-1 cursor-pointer">
                          {unidade.bloco?.nome && `${unidade.bloco.nome} - `}
                          Unidade {unidade.numero}
                          {unidade.tipologia?.nome && ` (${unidade.tipologia.nome})`}
                          {unidade.valor && ` - ${formatCurrency(unidade.valor)}`}
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="template">Template do Contrato *</Label>
              <Select
                value={formData.template_id || ''}
                onValueChange={(value) => setFormData(prev => ({ ...prev, template_id: value || undefined }))}
              >
                <SelectTrigger className={!formData.template_id && formData.empreendimento_id ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Selecione um template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.length === 0 ? (
                    <SelectItem value="__empty__" disabled>
                      Nenhum template disponível
                    </SelectItem>
                  ) : (
                    templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.nome}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {!formData.template_id && formData.empreendimento_id && (
                <p className="text-xs text-destructive">Template obrigatório</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor">Valor do Contrato</Label>
              <Input
                id="valor"
                value={formatCurrency(formData.valor_contrato)}
                disabled
                className="bg-muted"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gestor">Gestor do Produto *</Label>
              <Select
                value={formData.gestor_id || ''}
                onValueChange={(value) => setFormData(prev => ({ ...prev, gestor_id: value || undefined }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o gestor" />
                </SelectTrigger>
                <SelectContent>
                  {gestores.map((gestor) => (
                    <SelectItem key={gestor.id} value={gestor.id}>
                      {gestor.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="corretor">Corretor</Label>
              <Select
                value={formData.corretor_id || ''}
                onValueChange={(value) => setFormData(prev => ({ ...prev, corretor_id: value || undefined }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o corretor" />
                </SelectTrigger>
                <SelectContent>
                  {corretores.map((corretor) => (
                    <SelectItem key={corretor.id} value={corretor.id}>
                      {corretor.nome_completo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="imobiliaria">Imobiliária</Label>
            <Select
              value={formData.imobiliaria_id || ''}
              onValueChange={(value) => setFormData(prev => ({ ...prev, imobiliaria_id: value || undefined }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a imobiliária" />
              </SelectTrigger>
              <SelectContent>
                {imobiliarias.map((imob) => (
                  <SelectItem key={imob.id} value={imob.id}>
                    {imob.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
              rows={3}
            />
          </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 flex-shrink-0 border-t mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={
                isPending || 
                !formData.cliente_id || 
                !formData.empreendimento_id || 
                !formData.gestor_id || 
                !formData.template_id ||
                formData.unidade_ids.length === 0 ||
                !formData.valor_contrato ||
                formData.valor_contrato <= 0
              }
            >
              {isPending ? 'Criando...' : 'Criar Contrato'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
