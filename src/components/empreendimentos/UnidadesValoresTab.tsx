import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Calculator, Save, RefreshCw, Loader2, History, Percent } from 'lucide-react';
import { useUnidades, useUpdateUnidadesBulk } from '@/hooks/useUnidades';
import { useBlocos } from '@/hooks/useBlocos';
import { useConfiguracaoComercial } from '@/hooks/useConfiguracaoComercial';
import { UNIDADE_STATUS_LABELS, UNIDADE_STATUS_COLORS, UnidadeStatus } from '@/types/empreendimentos.types';
import { cn, parseDecimalInput } from '@/lib/utils';
import { ordenarUnidadesPorBlocoENumero } from '@/lib/unidadeUtils';
import { HistoricoPrecoDialog } from '@/components/unidades/HistoricoPrecoDialog';
import { toast } from 'sonner';

// Status que não devem ter valores alterados automaticamente
const STATUS_PROTEGIDOS: UnidadeStatus[] = ['vendida', 'reservada'];

interface UnidadesValoresTabProps {
  empreendimentoId: string;
}

interface EditedValue {
  area_privativa?: number;
  valor?: number;
}

export function UnidadesValoresTab({ empreendimentoId }: UnidadesValoresTabProps) {
  const [blocoFilter, setBlocoFilter] = useState<string>('all');
  const [editedValues, setEditedValues] = useState<Record<string, EditedValue>>({});
  const [areaInputs, setAreaInputs] = useState<Record<string, string>>({});
  const [valorInputs, setValorInputs] = useState<Record<string, string>>({});
  const [historicoUnidade, setHistoricoUnidade] = useState<{ id: string; numero: string } | null>(null);
  const [ajusteDialogOpen, setAjusteDialogOpen] = useState(false);
  const [percentualAjuste, setPercentualAjuste] = useState<string>('');
  const [tipoAjuste, setTipoAjuste] = useState<'valor' | 'area'>('valor');
  const [motivoReajuste, setMotivoReajuste] = useState<string>('');

  const { data: unidades = [], isLoading } = useUnidades(empreendimentoId, {
    blocoId: blocoFilter !== 'all' ? blocoFilter : undefined,
  });
  const { data: blocos = [] } = useBlocos(empreendimentoId);
  const { data: configComercial } = useConfiguracaoComercial(empreendimentoId);
  const updateBulk = useUpdateUnidadesBulk();

  const valorM2 = configComercial?.valor_m2 || 0;
  const unidadesOrdenadas = useMemo(() => ordenarUnidadesPorBlocoENumero(unidades), [unidades]);

  const hasChanges = Object.keys(editedValues).length > 0;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);

  const handleAreaChange = (unidadeId: string, value: string) => {
    if (/^[\d.,]*$/.test(value)) {
      setAreaInputs(prev => ({ ...prev, [unidadeId]: value }));
      const numValue = parseDecimalInput(value);
      setEditedValues(prev => ({
        ...prev,
        [unidadeId]: {
          ...prev[unidadeId],
          area_privativa: numValue > 0 ? numValue : undefined,
        },
      }));
    }
  };

  const handleValorChange = (unidadeId: string, value: string) => {
    const numericValue = value.replace(/\D/g, '');
    const valorNum = Number(numericValue) / 100;
    setValorInputs(prev => ({ ...prev, [unidadeId]: value }));
    setEditedValues(prev => ({
      ...prev,
      [unidadeId]: {
        ...prev[unidadeId],
        valor: valorNum > 0 ? valorNum : undefined,
      },
    }));
  };

  const recalcularUnidade = (unidadeId: string) => {
    const unidade = unidades.find(u => u.id === unidadeId);
    
    // Bloquear recálculo de unidades protegidas
    if (unidade && STATUS_PROTEGIDOS.includes(unidade.status)) {
      toast.warning('Não é possível recalcular unidades vendidas ou reservadas');
      return;
    }
    
    const areaAtual = editedValues[unidadeId]?.area_privativa ?? unidade?.area_privativa;
    
    if (areaAtual && valorM2) {
      const novoValor = areaAtual * valorM2;
      setEditedValues(prev => ({
        ...prev,
        [unidadeId]: {
          ...prev[unidadeId],
          valor: novoValor,
        },
      }));
      setValorInputs(prev => ({
        ...prev,
        [unidadeId]: novoValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
      }));
    }
  };

  const recalcularTodos = () => {
    if (!valorM2) return;
    
    const newEditedValues: Record<string, EditedValue> = { ...editedValues };
    const newValorInputs: Record<string, string> = { ...valorInputs };
    let unidadesIgnoradas = 0;

    unidades.forEach(unidade => {
      // Ignorar unidades com status protegido
      if (STATUS_PROTEGIDOS.includes(unidade.status)) {
        unidadesIgnoradas++;
        return;
      }
      
      const areaAtual = editedValues[unidade.id]?.area_privativa ?? unidade.area_privativa;
      if (areaAtual) {
        const novoValor = areaAtual * valorM2;
        newEditedValues[unidade.id] = {
          ...newEditedValues[unidade.id],
          valor: novoValor,
        };
        newValorInputs[unidade.id] = novoValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
      }
    });

    setEditedValues(newEditedValues);
    setValorInputs(newValorInputs);
    
    if (unidadesIgnoradas > 0) {
      toast.info(`${unidadesIgnoradas} unidade(s) vendida(s)/reservada(s) mantida(s) sem alteração`);
    }
  };

  const aplicarAjustePercentual = () => {
    const percentual = parseFloat(percentualAjuste.replace(',', '.'));
    if (isNaN(percentual) || percentual === 0) return;
    
    const fator = 1 + (percentual / 100);
    const newEditedValues: Record<string, EditedValue> = { ...editedValues };
    const newValorInputs: Record<string, string> = { ...valorInputs };
    const newAreaInputs: Record<string, string> = { ...areaInputs };
    let unidadesIgnoradas = 0;

    unidades.forEach(unidade => {
      // Ignorar unidades com status protegido
      if (STATUS_PROTEGIDOS.includes(unidade.status)) {
        unidadesIgnoradas++;
        return;
      }
      
      if (tipoAjuste === 'valor') {
        const valorAtual = editedValues[unidade.id]?.valor ?? unidade.valor ?? 0;
        if (valorAtual > 0) {
          // Arredondar para 2 casas decimais
          const novoValor = Math.round((valorAtual * fator) * 100) / 100;
          newEditedValues[unidade.id] = {
            ...newEditedValues[unidade.id],
            valor: novoValor,
          };
          newValorInputs[unidade.id] = novoValor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
      } else {
        const areaAtual = editedValues[unidade.id]?.area_privativa ?? unidade.area_privativa ?? 0;
        if (areaAtual > 0) {
          const novaArea = areaAtual * fator;
          newEditedValues[unidade.id] = {
            ...newEditedValues[unidade.id],
            area_privativa: novaArea,
          };
          newAreaInputs[unidade.id] = novaArea.toFixed(2).replace('.', ',');
        }
      }
    });

    setEditedValues(newEditedValues);
    setValorInputs(newValorInputs);
    setAreaInputs(newAreaInputs);
    setAjusteDialogOpen(false);
    setPercentualAjuste('');
    setMotivoReajuste('');
    
    if (unidadesIgnoradas > 0) {
      toast.info(`${unidadesIgnoradas} unidade(s) vendida(s)/reservada(s) mantida(s) sem alteração`);
    }
  };

  const handleSave = (motivo?: string) => {
    const updates = Object.entries(editedValues)
      .filter(([_, values]) => values.area_privativa !== undefined || values.valor !== undefined)
      .map(([id, values]) => ({
        id,
        area_privativa: values.area_privativa,
        valor: values.valor,
      }));

    if (updates.length > 0) {
      updateBulk.mutate(
        { empreendimentoId, updates, motivo },
        {
          onSuccess: () => {
            setEditedValues({});
            setAreaInputs({});
            setValorInputs({});
          },
        }
      );
    }
  };

  const getDisplayArea = (unidadeId: string, originalArea?: number | null) => {
    if (areaInputs[unidadeId] !== undefined) {
      return areaInputs[unidadeId];
    }
    return originalArea?.toString().replace('.', ',') || '';
  };

  const getDisplayValor = (unidadeId: string, originalValor?: number | null) => {
    if (valorInputs[unidadeId] !== undefined) {
      return valorInputs[unidadeId];
    }
    return originalValor?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '';
  };

  const isModified = (unidadeId: string) => !!editedValues[unidadeId];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">Valores das Unidades</CardTitle>
        <div className="flex items-center gap-2">
          {valorM2 > 0 && (
            <Badge variant="secondary" className="text-sm">
              Valor/m²: {formatCurrency(valorM2)}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtros e Ações */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Select value={blocoFilter} onValueChange={setBlocoFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Todos os blocos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os blocos</SelectItem>
                {blocos.map((bloco) => (
                  <SelectItem key={bloco.id} value={bloco.id}>
                    {bloco.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAjusteDialogOpen(true)}
            >
              <Percent className="h-4 w-4 mr-2" />
              Ajustar em %
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={recalcularTodos}
              disabled={!valorM2 || updateBulk.isPending}
            >
              <Calculator className="h-4 w-4 mr-2" />
              Recalcular Todos
            </Button>
            <Button
              size="sm"
              onClick={() => handleSave()}
              disabled={!hasChanges || updateBulk.isPending}
            >
              {updateBulk.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar Alterações
            </Button>
          </div>
        </div>

        {/* Tabela */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Bloco/Quadra</TableHead>
                <TableHead className="w-[100px]">Número</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead className="w-[120px] text-right">Valor/m² Calc.</TableHead>
                <TableHead className="w-[180px]">Valor (R$)</TableHead>
                <TableHead className="w-[100px] text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {unidades.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhuma unidade encontrada
                  </TableCell>
                </TableRow>
              ) : (
                unidadesOrdenadas.map((unidade) => (
                  <TableRow 
                    key={unidade.id}
                    className={cn(isModified(unidade.id) && 'bg-muted/30')}
                  >
                    <TableCell>{unidade.bloco?.nome || '-'}</TableCell>
                    <TableCell className="font-medium">{unidade.numero}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary" 
                        className={cn('text-xs', UNIDADE_STATUS_COLORS[unidade.status])}
                      >
                        {UNIDADE_STATUS_LABELS[unidade.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm">
                      {valorM2 > 0 ? formatCurrency(valorM2) : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                          R$
                        </span>
                        <Input
                          type="text"
                          value={getDisplayValor(unidade.id, unidade.valor)}
                          onChange={(e) => handleValorChange(unidade.id, e.target.value)}
                          className="h-8 w-full pl-8"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => recalcularUnidade(unidade.id)}
                          disabled={!valorM2 || STATUS_PROTEGIDOS.includes(unidade.status)}
                          title={STATUS_PROTEGIDOS.includes(unidade.status) 
                            ? "Unidade vendida/reservada não pode ser recalculada" 
                            : "Recalcular valor"
                          }
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setHistoricoUnidade({ id: unidade.id, numero: unidade.numero })}
                          title="Ver histórico de preços"
                        >
                          <History className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {hasChanges && (
          <p className="text-sm text-muted-foreground">
            {Object.keys(editedValues).length} unidade(s) modificada(s)
          </p>
        )}
      </CardContent>

      {/* Dialog de Histórico */}
      {historicoUnidade && (
        <HistoricoPrecoDialog
          open={!!historicoUnidade}
          onOpenChange={(open) => !open && setHistoricoUnidade(null)}
          unidadeId={historicoUnidade.id}
          unidadeNumero={historicoUnidade.numero}
        />
      )}

      {/* Dialog de Ajuste Percentual */}
      <Dialog open={ajusteDialogOpen} onOpenChange={(open) => {
        setAjusteDialogOpen(open);
        if (!open) {
          setPercentualAjuste('');
          setMotivoReajuste('');
        }
      }}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Reajuste Percentual de Valores</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Motivo do Reajuste *</Label>
              <Input
                value={motivoReajuste}
                onChange={(e) => setMotivoReajuste(e.target.value)}
                placeholder="Ex: Reajuste IPCA 2025, Correção Anual"
              />
              <p className="text-xs text-muted-foreground">
                Esse motivo será registrado no histórico de alterações
              </p>
            </div>

            <div className="space-y-2">
              <Label>Percentual (%)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  value={percentualAjuste}
                  onChange={(e) => setPercentualAjuste(e.target.value)}
                  placeholder="10.00"
                  className="text-right"
                />
                <span className="text-muted-foreground font-medium">%</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Positivo = aumento | Negativo = redução
              </p>
            </div>

            <div className="space-y-2">
              <Label>Aplicar em</Label>
              <Select value={tipoAjuste} onValueChange={(v) => setTipoAjuste(v as 'valor' | 'area')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="valor">Valores (R$)</SelectItem>
                  <SelectItem value="area">Áreas (m²)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAjusteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                aplicarAjustePercentual();
                // Salvar imediatamente após aplicar o ajuste
                setTimeout(() => handleSave(motivoReajuste), 100);
              }}
              disabled={!motivoReajuste.trim() || !percentualAjuste}
            >
              Aplicar Reajuste
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}