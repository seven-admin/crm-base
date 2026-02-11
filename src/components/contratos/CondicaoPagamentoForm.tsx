import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Car, Home, Banknote, Package, Calculator, Sparkles } from 'lucide-react';
import {
  TIPO_PARCELA_LABELS,
  FORMA_QUITACAO_LABELS,
  FORMA_PAGAMENTO_LABELS,
  EVENTO_VENCIMENTO_LABELS,
  INDICES_CORRECAO,
  TIPOS_PARCELA,
  FORMAS_QUITACAO,
  FORMAS_PAGAMENTO,
  EVENTOS_VENCIMENTO,
  DEFAULT_CONDICAO_PAGAMENTO,
  type CondicaoPagamentoFormData,
  type TipoParcelaCodigo,
  type FormaQuitacao,
  type FormaPagamento,
  type EventoVencimento,
} from '@/types/condicoesPagamento.types';

interface CondicaoPagamentoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: CondicaoPagamentoFormData) => void;
  initialData?: Partial<CondicaoPagamentoFormData>;
  isSaving?: boolean;
  valorReferencia?: number;
  valorConfigurado?: number;
}

export function CondicaoPagamentoForm({
  open,
  onOpenChange,
  onSave,
  initialData,
  isSaving,
  valorReferencia = 0,
  valorConfigurado = 0,
}: CondicaoPagamentoFormProps) {
  const [formData, setFormData] = useState<CondicaoPagamentoFormData>({
    ...DEFAULT_CONDICAO_PAGAMENTO,
    ...initialData,
  });
  const [modoCalculo, setModoCalculo] = useState<'manual' | 'automatico'>('manual');

  useEffect(() => {
    if (open) {
      setFormData({
        ...DEFAULT_CONDICAO_PAGAMENTO,
        ...initialData,
      });
      // Sempre começa em modo manual para evitar problemas de centavos
      setModoCalculo('manual');
    }
  }, [open, initialData]);

  const handleChange = <K extends keyof CondicaoPagamentoFormData>(
    field: K,
    value: CondicaoPagamentoFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  // Cálculos automáticos
  const valorRestante = useMemo(() => {
    return Math.max(0, valorReferencia - valorConfigurado);
  }, [valorReferencia, valorConfigurado]);

  const valorCalculadoPorParcela = useMemo(() => {
    if (modoCalculo === 'automatico' && formData.quantidade > 0) {
      return valorRestante / formData.quantidade;
    }
    return formData.valor || 0;
  }, [modoCalculo, formData.quantidade, valorRestante, formData.valor]);

  const totalCondicao = useMemo(() => {
    const valorParcela = modoCalculo === 'automatico' ? valorCalculadoPorParcela : (formData.valor || 0);
    return valorParcela * formData.quantidade;
  }, [modoCalculo, valorCalculadoPorParcela, formData.valor, formData.quantidade]);

  // Atualizar valor quando em modo automático
  useEffect(() => {
    if (modoCalculo === 'automatico' && formData.quantidade > 0 && valorRestante > 0) {
      // Arredondar para 2 casas decimais
      const valorAuto = Math.round((valorRestante / formData.quantidade) * 100) / 100;
      setFormData(prev => ({ ...prev, valor: valorAuto, valor_tipo: 'fixo' as const }));
    }
  }, [modoCalculo, formData.quantidade, valorRestante]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  };

  const formaQuitacaoIcons: Record<FormaQuitacao, React.ReactNode> = {
    dinheiro: <Banknote className="h-4 w-4" />,
    veiculo: <Car className="h-4 w-4" />,
    imovel: <Home className="h-4 w-4" />,
    outro_bem: <Package className="h-4 w-4" />,
  };

  const showBemFields = formData.forma_quitacao !== 'dinheiro';
  const showVeiculoFields = formData.forma_quitacao === 'veiculo';
  const showImovelFields = formData.forma_quitacao === 'imovel';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Editar Condição de Pagamento' : 'Nova Condição de Pagamento'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tipo de Parcela */}
          <div className="space-y-2">
            <Label>Tipo de Parcela *</Label>
            <Select
              value={formData.tipo_parcela_codigo}
              onValueChange={(value: TipoParcelaCodigo) => handleChange('tipo_parcela_codigo', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_PARCELA.map(tipo => (
                  <SelectItem key={tipo} value={tipo}>
                    {TIPO_PARCELA_LABELS[tipo]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label>Descrição (opcional)</Label>
            <Input
              value={formData.descricao || ''}
              onChange={e => handleChange('descricao', e.target.value)}
              placeholder="Ex: Parcelas de entrada"
            />
          </div>

          {/* Card de Cálculo Automático */}
          {valorReferencia > 0 && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm">Modo de Cálculo</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={modoCalculo === 'manual' ? 'default' : 'outline'}
                      onClick={() => setModoCalculo('manual')}
                    >
                      Manual
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={modoCalculo === 'automatico' ? 'default' : 'outline'}
                      onClick={() => setModoCalculo('automatico')}
                    >
                      <Sparkles className="h-3 w-3 mr-1" />
                      Automático
                    </Button>
                  </div>
                </div>

                {modoCalculo === 'automatico' && (
                  <Alert className="bg-background">
                    <AlertDescription className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Valor restante a configurar:</span>
                        <span className="font-semibold">{formatCurrency(valorRestante)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>÷ {formData.quantidade} parcelas =</span>
                        <span className="font-semibold text-primary">{formatCurrency(valorCalculadoPorParcela)}/parcela</span>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Quantidade e Valor */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Quantidade *</Label>
              <Input
                type="number"
                min={0}
                value={formData.quantidade || ''}
                onChange={e => handleChange('quantidade', parseInt(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>Valor por Parcela *</Label>
              <Input
                type="number"
                step="0.01"
                min={0}
                value={formData.valor || ''}
                onChange={e => {
                  handleChange('valor', parseFloat(e.target.value) || undefined);
                  if (modoCalculo === 'automatico') setModoCalculo('manual');
                }}
                placeholder="0,00"
                disabled={modoCalculo === 'automatico'}
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo de Valor</Label>
              <Select
                value={formData.valor_tipo}
                onValueChange={(value: 'fixo' | 'percentual') => handleChange('valor_tipo', value)}
                disabled={modoCalculo === 'automatico'}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixo">Valor Fixo (R$)</SelectItem>
                  <SelectItem value="percentual">Percentual (%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Preview do total */}
          {valorReferencia > 0 && (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm text-muted-foreground">Total desta condição:</span>
              <span className="font-semibold">{formatCurrency(totalCondicao)}</span>
            </div>
          )}

          <Separator />

          {/* Datas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Evento de Vencimento</Label>
              <Select
                value={formData.evento_vencimento || 'custom'}
                onValueChange={(value: EventoVencimento) => handleChange('evento_vencimento', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENTOS_VENCIMENTO.map(evento => (
                    <SelectItem key={evento} value={evento}>
                      {EVENTO_VENCIMENTO_LABELS[evento]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {formData.evento_vencimento === 'custom' && (
              <div className="space-y-2">
                <Label>Data do Primeiro Vencimento</Label>
                <Input
                  type="date"
                  value={formData.data_vencimento || ''}
                  onChange={e => handleChange('data_vencimento', e.target.value)}
                />
              </div>
            )}
          </div>

          {formData.quantidade > 1 && (
            <div className="space-y-2">
              <Label>Intervalo entre Parcelas (dias)</Label>
              <Select
                value={formData.intervalo_dias.toString()}
                onValueChange={value => handleChange('intervalo_dias', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">Mensal (30 dias)</SelectItem>
                  <SelectItem value="60">Bimestral (60 dias)</SelectItem>
                  <SelectItem value="90">Trimestral (90 dias)</SelectItem>
                  <SelectItem value="180">Semestral (180 dias)</SelectItem>
                  <SelectItem value="365">Anual (365 dias)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <Separator />

          {/* Correção Monetária */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Aplicar correção monetária</Label>
              <Switch
                checked={formData.com_correcao}
                onCheckedChange={value => handleChange('com_correcao', value)}
              />
            </div>

            {formData.com_correcao && (
              <div className="grid grid-cols-2 gap-4 pl-4 border-l-2 border-muted">
                <div className="space-y-2">
                  <Label>Índice de Correção</Label>
                  <Select
                    value={formData.indice_correcao}
                    onValueChange={value => handleChange('indice_correcao', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INDICES_CORRECAO.map(indice => (
                        <SelectItem key={indice} value={indice}>
                          {indice}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Parcelas sem Correção</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.parcelas_sem_correcao}
                    onChange={e => handleChange('parcelas_sem_correcao', parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Forma de Quitação */}
          <div className="space-y-4">
            <Label>Forma de Quitação</Label>
            <div className="grid grid-cols-4 gap-2">
              {FORMAS_QUITACAO.map(forma => (
                <button
                  key={forma}
                  type="button"
                  onClick={() => handleChange('forma_quitacao', forma)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                    formData.forma_quitacao === forma
                      ? 'border-primary bg-primary/10'
                      : 'border-muted hover:border-muted-foreground/50'
                  }`}
                >
                  {formaQuitacaoIcons[forma]}
                  <span className="text-xs font-medium">{FORMA_QUITACAO_LABELS[forma]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Forma de Pagamento (se dinheiro) */}
          {formData.forma_quitacao === 'dinheiro' && (
            <div className="space-y-2">
              <Label>Forma de Pagamento</Label>
              <Select
                value={formData.forma_pagamento}
                onValueChange={(value: FormaPagamento) => handleChange('forma_pagamento', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FORMAS_PAGAMENTO.map(forma => (
                    <SelectItem key={forma} value={forma}>
                      {FORMA_PAGAMENTO_LABELS[forma]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Dados do Bem */}
          {showBemFields && (
            <>
              <Separator />
              <div className="space-y-4">
                <h4 className="font-medium">
                  Dados do {formData.forma_quitacao === 'veiculo' ? 'Veículo' : formData.forma_quitacao === 'imovel' ? 'Imóvel' : 'Bem'}
                </h4>

                {showVeiculoFields && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Marca</Label>
                        <Input
                          value={formData.bem_marca || ''}
                          onChange={e => handleChange('bem_marca', e.target.value)}
                          placeholder="Ex: Honda"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Modelo</Label>
                        <Input
                          value={formData.bem_modelo || ''}
                          onChange={e => handleChange('bem_modelo', e.target.value)}
                          placeholder="Ex: Civic EXL"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Ano/Modelo</Label>
                        <Input
                          value={formData.bem_ano || ''}
                          onChange={e => handleChange('bem_ano', e.target.value)}
                          placeholder="Ex: 2022/2023"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Placa</Label>
                        <Input
                          value={formData.bem_placa || ''}
                          onChange={e => handleChange('bem_placa', e.target.value)}
                          placeholder="Ex: ABC-1234"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Cor</Label>
                        <Input
                          value={formData.bem_cor || ''}
                          onChange={e => handleChange('bem_cor', e.target.value)}
                          placeholder="Ex: Prata"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>RENAVAM</Label>
                      <Input
                        value={formData.bem_renavam || ''}
                        onChange={e => handleChange('bem_renavam', e.target.value)}
                        placeholder="Número do RENAVAM"
                      />
                    </div>
                  </>
                )}

                {showImovelFields && (
                  <>
                    <div className="space-y-2">
                      <Label>Descrição do Imóvel</Label>
                      <Input
                        value={formData.bem_descricao || ''}
                        onChange={e => handleChange('bem_descricao', e.target.value)}
                        placeholder="Ex: Apartamento residencial"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Endereço Completo</Label>
                      <Input
                        value={formData.bem_endereco || ''}
                        onChange={e => handleChange('bem_endereco', e.target.value)}
                        placeholder="Rua, número, bairro, cidade, UF"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Matrícula</Label>
                        <Input
                          value={formData.bem_matricula || ''}
                          onChange={e => handleChange('bem_matricula', e.target.value)}
                          placeholder="Número da matrícula"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Cartório</Label>
                        <Input
                          value={formData.bem_cartorio || ''}
                          onChange={e => handleChange('bem_cartorio', e.target.value)}
                          placeholder="Nome do cartório"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Área (m²)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.bem_area_m2 || ''}
                        onChange={e => handleChange('bem_area_m2', parseFloat(e.target.value) || undefined)}
                        placeholder="Área em metros quadrados"
                      />
                    </div>
                  </>
                )}

                {formData.forma_quitacao === 'outro_bem' && (
                  <div className="space-y-2">
                    <Label>Descrição do Bem</Label>
                    <Textarea
                      value={formData.bem_descricao || ''}
                      onChange={e => handleChange('bem_descricao', e.target.value)}
                      placeholder="Descreva o bem detalhadamente..."
                      rows={3}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Valor Avaliado</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.bem_valor_avaliado || ''}
                    onChange={e => handleChange('bem_valor_avaliado', parseFloat(e.target.value) || undefined)}
                    placeholder="Valor de avaliação do bem"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Observações sobre o Bem</Label>
                  <Textarea
                    value={formData.bem_observacoes || ''}
                    onChange={e => handleChange('bem_observacoes', e.target.value)}
                    placeholder="Observações adicionais..."
                    rows={2}
                  />
                </div>
              </div>
            </>
          )}

          {/* Texto Adicional */}
          <div className="space-y-2">
            <Label>Texto Adicional para o Contrato</Label>
            <Textarea
              value={formData.observacao_texto || ''}
              onChange={e => handleChange('observacao_texto', e.target.value)}
              placeholder="Texto adicional que será incluído nesta condição..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
