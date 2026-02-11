import { useState, useMemo, useEffect, useRef } from 'react';
import { Plus, Trash2, Settings2, Sparkles, Loader2, Save, AlertTriangle, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CondicaoPagamentoForm } from './CondicaoPagamentoForm';
import {
  useContratoCondicoesPagamento,
  useCreateContratoCondicao,
  useUpdateContratoCondicao,
  useDeleteContratoCondicao,
} from '@/hooks/useCondicoesPagamento';
import {
  TIPOS_PARCELA,
  TIPO_PARCELA_LABELS,
  FORMAS_PAGAMENTO,
  FORMA_PAGAMENTO_LABELS,
  DEFAULT_CONDICAO_PAGAMENTO,
  type ContratoCondicaoPagamento,
  type CondicaoPagamentoFormData,
  type TipoParcelaCodigo,
  type FormaQuitacao,
  type FormaPagamento,
} from '@/types/condicoesPagamento.types';
import { toCents, fromCents, round2 } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CondicoesPagamentoInlineEditorProps {
  contratoId: string;
  valorReferencia?: number;
  readonly?: boolean;
  onValidationChange?: (isValid: boolean, diferenca: number) => void;
}

interface EditedCondition {
  tipo_parcela_codigo?: TipoParcelaCodigo;
  quantidade?: number;
  valor?: number;
  forma_quitacao?: FormaQuitacao;
  forma_pagamento?: FormaPagamento;
}

interface NewCondition extends CondicaoPagamentoFormData {
  // Uses all fields from CondicaoPagamentoFormData
}

export function CondicoesPagamentoInlineEditor({ 
  contratoId, 
  valorReferencia = 0,
  readonly = false,
  onValidationChange
}: CondicoesPagamentoInlineEditorProps) {
  const { data: condicoes = [], isLoading } = useContratoCondicoesPagamento(contratoId);
  const createCondicao = useCreateContratoCondicao();
  const updateCondicao = useUpdateContratoCondicao();
  const deleteCondicao = useDeleteContratoCondicao();

  const [editedConditions, setEditedConditions] = useState<Record<string, EditedCondition>>({});
  const [newConditions, setNewConditions] = useState<NewCondition[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conditionToDelete, setConditionToDelete] = useState<string | null>(null);
  const [advancedFormOpen, setAdvancedFormOpen] = useState(false);
  const [editingForAdvanced, setEditingForAdvanced] = useState<ContratoCondicaoPagamento | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isAdjusting, setIsAdjusting] = useState(false);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const parseCurrencyInput = (value: string): number => {
    const numericValue = value.replace(/\D/g, '');
    return Number(numericValue) / 100;
  };

  // Calculate totals using cents to avoid floating point errors
  const { totalConfigurado, percentualConfigurado, diferenca, diferencaCents } = useMemo(() => {
    let totalCents = 0;
    const valorRefCents = toCents(valorReferencia);
    
    // Existing conditions (with edits applied)
    condicoes.forEach(c => {
      const edited = editedConditions[c.id];
      const qtd = edited?.quantidade ?? c.quantidade ?? 0;
      const valor = edited?.valor ?? c.valor ?? 0;
      const valorCents = toCents(valor);
      totalCents += qtd * valorCents;
    });
    
    // New conditions
    newConditions.forEach(c => {
      const valorCents = toCents(c.valor || 0);
      totalCents += c.quantidade * valorCents;
    });
    
    const percentual = valorRefCents > 0 ? Math.min((totalCents / valorRefCents) * 100, 100) : 0;
    const diffCents = valorRefCents - totalCents;
    
    return { 
      totalConfigurado: fromCents(totalCents), 
      percentualConfigurado: percentual, 
      diferenca: fromCents(diffCents),
      diferencaCents: diffCents
    };
  }, [condicoes, editedConditions, newConditions, valorReferencia]);

  const hasChanges = Object.keys(editedConditions).length > 0 || newConditions.length > 0;

  // Check if difference is just cents (small difference that can be auto-adjusted)
  const isCentsDifference = Math.abs(diferencaCents) > 0 && Math.abs(diferencaCents) <= 100; // Up to R$ 1.00

  // Usar ref para evitar loop infinito quando o parent passa callback instável
  const onValidationChangeRef = useRef(onValidationChange);
  onValidationChangeRef.current = onValidationChange;
  
  // Guard para evitar notificações duplicadas
  const lastSentRef = useRef<{ isValid: boolean; diferenca: number } | null>(null);

  // Notify parent of validation state
  useEffect(() => {
    if (valorReferencia > 0) {
      const isValid = diferencaCents === 0;
      const diferencaRounded = Math.round(diferenca * 100) / 100;
      const lastSent = lastSentRef.current;
      
      // Só notifica se realmente mudou
      if (!lastSent || lastSent.isValid !== isValid || Math.abs(lastSent.diferenca - diferencaRounded) >= 0.01) {
        lastSentRef.current = { isValid, diferenca: diferencaRounded };
        onValidationChangeRef.current?.(isValid, diferencaRounded);
      }
    }
  }, [diferencaCents, diferenca, valorReferencia]);

  // Handlers for inline editing
  const handleFieldChange = (id: string, field: keyof EditedCondition, value: any) => {
    setEditedConditions(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };

  const handleQuantidadeChange = (id: string, value: string) => {
    const qtd = parseInt(value) || 0;
    handleFieldChange(id, 'quantidade', qtd);
    
    // Auto-calculate valor if user just entered quantidade
    const condition = condicoes.find(c => c.id === id);
    const currentEdits = editedConditions[id];
    
    if (qtd > 0 && !currentEdits?.valor && condition) {
      const otherTotalCents = condicoes
        .filter(c => c.id !== id)
        .reduce((sum, c) => {
          const edited = editedConditions[c.id];
          const cQtd = edited?.quantidade ?? c.quantidade ?? 0;
          const cValor = edited?.valor ?? c.valor ?? 0;
          return sum + toCents(cQtd * cValor);
        }, 0);
      const remainingCents = toCents(valorReferencia) - otherTotalCents;
      if (remainingCents > 0) {
        const suggestedValor = fromCents(Math.floor(remainingCents / qtd));
        handleFieldChange(id, 'valor', suggestedValor);
      }
    }
  };

  const handleValorChange = (id: string, value: string) => {
    const valor = parseCurrencyInput(value);
    handleFieldChange(id, 'valor', valor);
  };

  // Handlers for new conditions - always start with zeros
  const handleAddNewCondition = () => {
    setNewConditions(prev => [...prev, {
      ...DEFAULT_CONDICAO_PAGAMENTO,
      tipo_parcela_codigo: 'mensal_serie',
      quantidade: 0,
      valor: 0,
    }]);
  };

  const handleNewConditionChange = (index: number, field: keyof NewCondition, value: any) => {
    setNewConditions(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleRemoveNewCondition = (index: number) => {
    setNewConditions(prev => prev.filter((_, i) => i !== index));
  };

  // Delete handler
  const handleDelete = (id: string) => {
    setConditionToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (conditionToDelete) {
      deleteCondicao.mutate({ id: conditionToDelete, contratoId });
      // Remove from edited if exists
      setEditedConditions(prev => {
        const { [conditionToDelete]: _, ...rest } = prev;
        return rest;
      });
      setConditionToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  // Advanced form handler
  const openAdvancedForm = (condition?: ContratoCondicaoPagamento) => {
    setEditingForAdvanced(condition || null);
    setAdvancedFormOpen(true);
  };

  const handleAdvancedSave = (data: CondicaoPagamentoFormData) => {
    if (editingForAdvanced) {
      updateCondicao.mutate({
        id: editingForAdvanced.id,
        contratoId,
        ...data,
      }, {
        onSuccess: () => {
          setAdvancedFormOpen(false);
          setEditingForAdvanced(null);
          // Clear edits for this condition
          setEditedConditions(prev => {
            const { [editingForAdvanced.id]: _, ...rest } = prev;
            return rest;
          });
        },
      });
    } else {
      const maxOrdem = condicoes.reduce((max, c) => Math.max(max, c.ordem || 0), 0);
      createCondicao.mutate({
        contrato_id: contratoId,
        ordem: maxOrdem + 1,
        ...data,
      }, {
        onSuccess: () => setAdvancedFormOpen(false),
      });
    }
  };

  // Auto-adjust cents difference
  const handleAjustarCentavos = async () => {
    if (diferencaCents === 0 || hasChanges) return;
    
    // Find the last editable condition (preferably mensal_serie or entrada with dinheiro)
    const editableConditions = [...condicoes]
      .filter(c => c.forma_quitacao === 'dinheiro' || !c.forma_quitacao)
      .reverse();
    
    const ultimaCondicao = editableConditions[0];
    
    if (!ultimaCondicao) {
      toast.error('Nenhuma condição disponível para ajuste');
      return;
    }
    
    setIsAdjusting(true);
    
    try {
      const qtd = ultimaCondicao.quantidade ?? 1;
      const valorAtualCents = toCents(ultimaCondicao.valor ?? 0);
      
      if (qtd === 1) {
        // Simple case: just adjust the single installment value
        const novoValorCents = valorAtualCents + diferencaCents;
        await updateCondicao.mutateAsync({
          id: ultimaCondicao.id,
          contratoId,
          valor: fromCents(novoValorCents),
        });
        toast.success('Centavos ajustados automaticamente!');
      } else {
        // Complex case: split the condition
        // Keep n-1 installments at original value, create 1 with adjusted value
        const novoValorUltimaCents = valorAtualCents + diferencaCents;
        
        // Update original condition with qty - 1
        await updateCondicao.mutateAsync({
          id: ultimaCondicao.id,
          contratoId,
          quantidade: qtd - 1,
        });
        
        // Create new condition with 1 installment at adjusted value
        const maxOrdem = condicoes.reduce((max, c) => Math.max(max, c.ordem || 0), 0);
        await createCondicao.mutateAsync({
          contrato_id: contratoId,
          ordem: maxOrdem + 1,
          tipo_parcela_codigo: ultimaCondicao.tipo_parcela_codigo as TipoParcelaCodigo,
          quantidade: 1,
          valor: fromCents(novoValorUltimaCents),
          valor_tipo: 'fixo',
          forma_quitacao: 'dinheiro',
          forma_pagamento: (ultimaCondicao.forma_pagamento as FormaPagamento) || 'boleto',
          descricao: 'Ajuste de centavos',
          intervalo_dias: ultimaCondicao.intervalo_dias || 30,
          com_correcao: ultimaCondicao.com_correcao || false,
          indice_correcao: ultimaCondicao.indice_correcao || 'INCC',
          parcelas_sem_correcao: 0,
        });
        
        toast.success('Centavos ajustados automaticamente!');
      }
    } catch (error) {
      console.error('Erro ao ajustar centavos:', error);
      toast.error('Erro ao ajustar centavos');
    } finally {
      setIsAdjusting(false);
    }
  };

  // Save all changes
  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      // Update existing conditions with inline edits
      for (const [id, changes] of Object.entries(editedConditions)) {
        if (Object.keys(changes).length > 0) {
          // Get original condition to merge with changes
          const original = condicoes.find(c => c.id === id);
          if (original) {
            await updateCondicao.mutateAsync({
              id,
              contratoId,
              tipo_parcela_codigo: changes.tipo_parcela_codigo ?? original.tipo_parcela_codigo,
              quantidade: changes.quantidade ?? original.quantidade ?? 0,
              valor: changes.valor ?? original.valor ?? 0,
              forma_pagamento: changes.forma_pagamento ?? original.forma_pagamento ?? 'boleto',
              forma_quitacao: changes.forma_quitacao ?? original.forma_quitacao ?? 'dinheiro',
            });
          }
        }
      }
      
      // Create new conditions
      const maxOrdem = condicoes.reduce((max, c) => Math.max(max, c.ordem || 0), 0);
      for (let i = 0; i < newConditions.length; i++) {
        const newCond = newConditions[i];
        await createCondicao.mutateAsync({
          contrato_id: contratoId,
          ordem: maxOrdem + 1 + i,
          ...newCond,
        });
      }
      
      setEditedConditions({});
      setNewConditions([]);
      toast.success('Alterações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar alterações');
    } finally {
      setIsSaving(false);
    }
  };

  // Get display value (edited or original)
  const getDisplayValue = (condition: ContratoCondicaoPagamento, field: keyof EditedCondition) => {
    return editedConditions[condition.id]?.[field] ?? condition[field as keyof ContratoCondicaoPagamento];
  };

  const isModified = (id: string) => !!editedConditions[id];

  if (isLoading) {
    return <div className="p-4 text-center text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      {valorReferencia > 0 && (
        <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Valor do Contrato: {formatCurrency(valorReferencia)}</span>
            <span className={cn(
              "font-semibold",
              percentualConfigurado >= 100 ? "text-green-600" : 
              percentualConfigurado >= 50 ? "text-amber-600" : "text-muted-foreground"
            )}>
              {percentualConfigurado.toFixed(1)}% configurado
            </span>
          </div>
          <Progress 
            value={percentualConfigurado} 
            className={cn("h-3", percentualConfigurado >= 100 && "[&>div]:bg-green-600")} 
          />
        </div>
      )}

      {/* Alerta de diferença de valores */}
      {valorReferencia > 0 && diferencaCents !== 0 && !hasChanges && (
        <Alert variant={isCentsDifference ? "default" : "destructive"} className={cn("border-2", isCentsDifference && "border-amber-300 bg-amber-50 dark:bg-amber-950/20")}>
          <AlertTriangle className={cn("h-5 w-5", isCentsDifference && "text-amber-600")} />
          <AlertTitle className={cn("font-semibold", isCentsDifference && "text-amber-800 dark:text-amber-200")}>
            {isCentsDifference ? 'Ajuste de centavos necessário' : 'Condições de pagamento inconsistentes'}
          </AlertTitle>
          <AlertDescription className={cn("mt-1", isCentsDifference && "text-amber-700 dark:text-amber-300")}>
            {diferenca > 0 ? (
              <>
                O total configurado é <strong>{formatCurrency(Math.abs(diferenca))}</strong> menor que o valor do contrato.
              </>
            ) : (
              <>
                O total configurado é <strong>{formatCurrency(Math.abs(diferenca))}</strong> maior que o valor do contrato.
              </>
            )}
            {isCentsDifference ? (
              <span className="block mt-2 text-sm">
                Use o botão "Ajustar Centavos" para corrigir automaticamente.
              </span>
            ) : (
              <span className="block mt-2 text-sm opacity-80">
                Adicione ou ajuste as condições de pagamento.
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Condições de Pagamento</h3>
          <p className="text-sm text-muted-foreground">
            Edite diretamente na tabela ou use o botão de configurações avançadas
          </p>
        </div>
        {!readonly && (
          <div className="flex items-center gap-2">
            {/* Botão de ajustar centavos */}
            {isCentsDifference && !hasChanges && condicoes.length > 0 && (
              <Button 
                onClick={handleAjustarCentavos} 
                size="sm" 
                variant="outline"
                disabled={isAdjusting}
                className="text-blue-600 border-blue-300 hover:bg-blue-50"
              >
                {isAdjusting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Wand2 className="h-4 w-4 mr-2" />
                )}
                Ajustar {formatCurrency(Math.abs(diferenca))}
              </Button>
            )}
            {diferenca > 100 && (
              <Button 
                onClick={handleAddNewCondition} 
                size="sm" 
                variant="outline"
                className="text-amber-600 border-amber-300 hover:bg-amber-50"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Completar {formatCurrency(diferenca)}
              </Button>
            )}
            <Button onClick={handleAddNewCondition} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>
        )}
      </div>

      {/* Inline Editable Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px] text-center">#</TableHead>
                <TableHead className="w-[160px]">Tipo</TableHead>
                <TableHead className="w-[80px]">Qtd</TableHead>
                <TableHead className="w-[150px]">Valor/Parcela</TableHead>
                <TableHead className="w-[130px] text-right">Total</TableHead>
                <TableHead className="w-[130px]">Forma</TableHead>
                <TableHead className="w-[100px] text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {condicoes.length === 0 && newConditions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Nenhuma condição de pagamento configurada
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {/* Existing conditions */}
                  {condicoes.map((condicao, index) => {
                    const qtd = (getDisplayValue(condicao, 'quantidade') as number) ?? 0;
                    const valor = (getDisplayValue(condicao, 'valor') as number) ?? 0;
                    const totalCents = toCents(qtd * valor);
                    const total = fromCents(totalCents);
                    const tipoParcela = (getDisplayValue(condicao, 'tipo_parcela_codigo') as TipoParcelaCodigo) || 'entrada';
                    
                    return (
                      <TableRow 
                        key={condicao.id}
                        className={cn(isModified(condicao.id) && 'bg-amber-50 dark:bg-amber-950/20')}
                      >
                        <TableCell className="text-center font-mono text-muted-foreground">
                          {index + 1}
                        </TableCell>
                        <TableCell>
                          {readonly ? (
                            <Badge variant="secondary">
                              {TIPO_PARCELA_LABELS[tipoParcela] || tipoParcela}
                            </Badge>
                          ) : (
                            <Select 
                              value={tipoParcela}
                              onValueChange={(v) => handleFieldChange(condicao.id, 'tipo_parcela_codigo', v as TipoParcelaCodigo)}
                            >
                              <SelectTrigger className="h-8 border-transparent bg-transparent focus:border-input hover:bg-muted/50">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {TIPOS_PARCELA.map(t => (
                                  <SelectItem key={t} value={t}>{TIPO_PARCELA_LABELS[t]}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </TableCell>
                        <TableCell>
                          {readonly ? (
                            <span>{qtd}</span>
                          ) : (
                            <Input
                              type="number"
                              min={0}
                              value={qtd || ''}
                              onChange={(e) => handleQuantidadeChange(condicao.id, e.target.value)}
                              className="h-8 w-16 border-transparent bg-transparent focus:border-input hover:bg-muted/50"
                              placeholder="0"
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          {readonly ? (
                            <span>{formatCurrency(valor)}</span>
                          ) : (
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">R$</span>
                              <Input
                                type="text"
                                value={valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                onChange={(e) => handleValorChange(condicao.id, e.target.value)}
                                className="h-8 pl-7 border-transparent bg-transparent focus:border-input hover:bg-muted/50"
                              />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(total)}
                        </TableCell>
                        <TableCell>
                          {readonly ? (
                            <Badge variant="outline" className="text-xs">
                              {FORMA_PAGAMENTO_LABELS[(condicao.forma_pagamento as FormaPagamento) || 'boleto']}
                            </Badge>
                          ) : (
                            <Select 
                              value={(getDisplayValue(condicao, 'forma_pagamento') as string) || 'boleto'}
                              onValueChange={(v) => handleFieldChange(condicao.id, 'forma_pagamento', v)}
                            >
                              <SelectTrigger className="h-8 border-transparent bg-transparent focus:border-input hover:bg-muted/50">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {FORMAS_PAGAMENTO.map(f => (
                                  <SelectItem key={f} value={f}>{FORMA_PAGAMENTO_LABELS[f]}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </TableCell>
                        <TableCell>
                          {!readonly && (
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => openAdvancedForm(condicao)}
                                title="Configurações avançadas"
                              >
                                <Settings2 className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={() => handleDelete(condicao.id)}
                                title="Excluir"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}

                  {/* New conditions (pending save) */}
                  {newConditions.map((newCond, index) => {
                    const totalCents = toCents((newCond.quantidade || 0) * (newCond.valor || 0));
                    const total = fromCents(totalCents);
                    const displayIndex = condicoes.length + index + 1;
                    
                    return (
                      <TableRow 
                        key={`new-${index}`}
                        className="bg-green-50 dark:bg-green-950/20"
                      >
                        <TableCell className="text-center font-mono text-green-600">
                          {displayIndex}
                          <Badge variant="outline" className="ml-1 text-[10px] px-1">novo</Badge>
                        </TableCell>
                        <TableCell>
                          <Select 
                            value={newCond.tipo_parcela_codigo}
                            onValueChange={(v) => handleNewConditionChange(index, 'tipo_parcela_codigo', v as TipoParcelaCodigo)}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {TIPOS_PARCELA.map(t => (
                                <SelectItem key={t} value={t}>{TIPO_PARCELA_LABELS[t]}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            value={newCond.quantidade || ''}
                            onChange={(e) => handleNewConditionChange(index, 'quantidade', parseInt(e.target.value) || 0)}
                            className="h-8 w-16"
                            placeholder="0"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">R$</span>
                            <Input
                              type="text"
                              value={(newCond.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              onChange={(e) => handleNewConditionChange(index, 'valor', parseCurrencyInput(e.target.value))}
                              className="h-8 pl-7"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium text-green-600">
                          {formatCurrency(total)}
                        </TableCell>
                        <TableCell>
                          <Select 
                            value={newCond.forma_pagamento}
                            onValueChange={(v) => handleNewConditionChange(index, 'forma_pagamento', v as FormaPagamento)}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {FORMAS_PAGAMENTO.map(f => (
                                <SelectItem key={f} value={f}>{FORMA_PAGAMENTO_LABELS[f]}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => handleRemoveNewCondition(index)}
                            title="Remover"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Summary and Save */}
      {(condicoes.length > 0 || newConditions.length > 0) && (
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6 text-sm">
                <div>
                  <span className="text-muted-foreground">Total Configurado: </span>
                  <span className="font-semibold">{formatCurrency(totalConfigurado)}</span>
                </div>
                {valorReferencia > 0 && (
                  <div>
                    <span className="text-muted-foreground">Diferença: </span>
                    <span className={cn(
                      "font-semibold",
                      diferencaCents === 0 ? "text-green-600" : "text-destructive"
                    )}>
                      {formatCurrency(diferenca)}
                    </span>
                  </div>
                )}
                {hasChanges && (
                  <Badge variant="outline" className="text-amber-600 border-amber-300">
                    {Object.keys(editedConditions).length + newConditions.length} alteração(ões) pendente(s)
                  </Badge>
                )}
              </div>
              
              {!readonly && hasChanges && (
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setEditedConditions({});
                      setNewConditions([]);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    size="sm"
                    onClick={handleSaveAll}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Salvar Alterações
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Advanced Form Modal */}
      {!readonly && (
        <CondicaoPagamentoForm
          open={advancedFormOpen}
          onOpenChange={setAdvancedFormOpen}
          onSave={handleAdvancedSave}
          valorReferencia={valorReferencia}
          valorConfigurado={totalConfigurado}
          initialData={editingForAdvanced ? {
            tipo_parcela_codigo: editingForAdvanced.tipo_parcela_codigo,
            descricao: editingForAdvanced.descricao || undefined,
            quantidade: editingForAdvanced.quantidade || 0,
            valor: editingForAdvanced.valor || undefined,
            valor_tipo: (editingForAdvanced.valor_tipo as any) || 'fixo',
            data_vencimento: editingForAdvanced.data_vencimento || undefined,
            intervalo_dias: editingForAdvanced.intervalo_dias || 30,
            evento_vencimento: editingForAdvanced.evento_vencimento as any,
            com_correcao: editingForAdvanced.com_correcao || false,
            indice_correcao: editingForAdvanced.indice_correcao || 'INCC',
            parcelas_sem_correcao: editingForAdvanced.parcelas_sem_correcao || 0,
            forma_quitacao: (editingForAdvanced.forma_quitacao as any) || 'dinheiro',
            forma_pagamento: (editingForAdvanced.forma_pagamento as any) || 'boleto',
            bem_descricao: editingForAdvanced.bem_descricao || undefined,
            bem_marca: editingForAdvanced.bem_marca || undefined,
            bem_modelo: editingForAdvanced.bem_modelo || undefined,
            bem_ano: editingForAdvanced.bem_ano || undefined,
            bem_placa: editingForAdvanced.bem_placa || undefined,
            bem_cor: editingForAdvanced.bem_cor || undefined,
            bem_renavam: editingForAdvanced.bem_renavam || undefined,
            bem_matricula: editingForAdvanced.bem_matricula || undefined,
            bem_cartorio: editingForAdvanced.bem_cartorio || undefined,
            bem_endereco: editingForAdvanced.bem_endereco || undefined,
            bem_area_m2: editingForAdvanced.bem_area_m2 || undefined,
            bem_valor_avaliado: editingForAdvanced.bem_valor_avaliado || undefined,
            bem_observacoes: editingForAdvanced.bem_observacoes || undefined,
            beneficiario_tipo: editingForAdvanced.beneficiario_tipo as any,
            beneficiario_id: editingForAdvanced.beneficiario_id || undefined,
            observacao_texto: editingForAdvanced.observacao_texto || undefined,
          } : undefined}
          isSaving={createCondicao.isPending || updateCondicao.isPending}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta condição de pagamento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
