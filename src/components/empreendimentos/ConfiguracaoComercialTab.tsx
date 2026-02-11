import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save, CheckCircle, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { useConfiguracaoComercialAdmin, useUpsertConfiguracaoComercial } from '@/hooks/useConfiguracaoComercial';

interface ConfiguracaoComercialTabProps {
  empreendimentoId: string;
}

export function ConfiguracaoComercialTab({ empreendimentoId }: ConfiguracaoComercialTabProps) {
  const { data: config, isLoading } = useConfiguracaoComercialAdmin(empreendimentoId);
  const upsertConfig = useUpsertConfiguracaoComercial();

  const [formData, setFormData] = useState({
    valor_m2: 409.28,
    data_referencia: new Date().toISOString().split('T')[0],
    desconto_avista: 7,
    entrada_curto_prazo: 10,
    parcelas_curto_prazo: 24,
    entrada_minima: 6,
    max_parcelas_entrada: 10,
    max_parcelas_mensais: 180,
    taxa_juros_anual: 11,
    indice_reajuste: 'IPCA',
    limite_parcelas_anuais: 25,
  });

  useEffect(() => {
    if (config) {
      setFormData({
        valor_m2: config.valor_m2,
        data_referencia: config.data_referencia,
        desconto_avista: config.desconto_avista,
        entrada_curto_prazo: config.entrada_curto_prazo,
        parcelas_curto_prazo: config.parcelas_curto_prazo,
        entrada_minima: config.entrada_minima,
        max_parcelas_entrada: config.max_parcelas_entrada,
        max_parcelas_mensais: config.max_parcelas_mensais,
        taxa_juros_anual: config.taxa_juros_anual,
        indice_reajuste: config.indice_reajuste,
        limite_parcelas_anuais: config.limite_parcelas_anuais,
      });
    }
  }, [config]);

  const handleSave = async (activate: boolean = false) => {
    try {
      await upsertConfig.mutateAsync({
        empreendimento_id: empreendimentoId,
        ...formData,
        is_active: activate ? true : (config?.is_active || false),
      });
      if (activate) {
        toast.success('Configuração ativada para o time comercial!');
      }
    } catch (error) {
      // Toast is handled by the hook
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
    <Card className="max-w-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Configuração Comercial</CardTitle>
          </div>
          <Badge variant={config?.is_active ? 'default' : 'secondary'}>
            {config?.is_active ? 'Ativo' : 'Rascunho'}
          </Badge>
        </div>
        <CardDescription>
          Defina os parâmetros comerciais para este empreendimento
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Base Values */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm text-muted-foreground">VALORES BASE</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valor_m2">Valor por m²</Label>
              <Input
                id="valor_m2"
                type="number"
                step="0.01"
                value={formData.valor_m2}
                onChange={e => setFormData(prev => ({ ...prev, valor_m2: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data_referencia">Data Referência</Label>
              <Input
                id="data_referencia"
                type="date"
                value={formData.data_referencia}
                onChange={e => setFormData(prev => ({ ...prev, data_referencia: e.target.value }))}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Cash Discount */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm text-muted-foreground">CONDIÇÃO À VISTA</h4>
          <div className="space-y-2">
            <Label htmlFor="desconto_avista">Desconto (%)</Label>
            <Input
              id="desconto_avista"
              type="number"
              step="0.1"
              value={formData.desconto_avista}
              onChange={e => setFormData(prev => ({ ...prev, desconto_avista: parseFloat(e.target.value) || 0 }))}
            />
          </div>
        </div>

        <Separator />

        {/* Short Term */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm text-muted-foreground">CONDIÇÃO 24x FIXAS</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="entrada_curto_prazo">Entrada Mínima (%)</Label>
              <Input
                id="entrada_curto_prazo"
                type="number"
                step="0.1"
                value={formData.entrada_curto_prazo}
                onChange={e => setFormData(prev => ({ ...prev, entrada_curto_prazo: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="parcelas_curto_prazo">Parcelas</Label>
              <Input
                id="parcelas_curto_prazo"
                type="number"
                value={formData.parcelas_curto_prazo}
                onChange={e => setFormData(prev => ({ ...prev, parcelas_curto_prazo: parseInt(e.target.value) || 0 }))}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Long Term Financing */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm text-muted-foreground">PARCELAMENTO LONGO</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="entrada_minima">Entrada Mínima (%)</Label>
              <Input
                id="entrada_minima"
                type="number"
                step="0.1"
                value={formData.entrada_minima}
                onChange={e => setFormData(prev => ({ ...prev, entrada_minima: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_parcelas_entrada">Máx. Parcelas Entrada</Label>
              <Input
                id="max_parcelas_entrada"
                type="number"
                value={formData.max_parcelas_entrada}
                onChange={e => setFormData(prev => ({ ...prev, max_parcelas_entrada: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_parcelas_mensais">Máx. Parcelas Mensais</Label>
              <Input
                id="max_parcelas_mensais"
                type="number"
                value={formData.max_parcelas_mensais}
                onChange={e => setFormData(prev => ({ ...prev, max_parcelas_mensais: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxa_juros_anual">Taxa Juros Anual (%)</Label>
              <Input
                id="taxa_juros_anual"
                type="number"
                step="0.1"
                value={formData.taxa_juros_anual}
                onChange={e => setFormData(prev => ({ ...prev, taxa_juros_anual: parseFloat(e.target.value) || 0 }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="indice_reajuste">Índice de Reajuste</Label>
            <Select
              value={formData.indice_reajuste}
              onValueChange={value => setFormData(prev => ({ ...prev, indice_reajuste: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="IPCA">IPCA</SelectItem>
                <SelectItem value="IGPM">IGP-M</SelectItem>
                <SelectItem value="INCC">INCC</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        {/* Annual Installments */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm text-muted-foreground">INTERMEDIÁRIAS/ANUAIS</h4>
          <div className="space-y-2">
            <Label htmlFor="limite_parcelas_anuais">Limite (% do total)</Label>
            <Input
              id="limite_parcelas_anuais"
              type="number"
              step="0.1"
              value={formData.limite_parcelas_anuais}
              onChange={e => setFormData(prev => ({ ...prev, limite_parcelas_anuais: parseFloat(e.target.value) || 0 }))}
            />
          </div>
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => handleSave(false)}
            disabled={upsertConfig.isPending}
            className="flex-1"
          >
            {upsertConfig.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar Rascunho
          </Button>
          <Button
            onClick={() => handleSave(true)}
            disabled={upsertConfig.isPending}
            className="flex-1"
          >
            {upsertConfig.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Ativar para Comercial
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
