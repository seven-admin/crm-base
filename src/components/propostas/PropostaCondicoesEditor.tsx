import { useState, useMemo, useEffect, useRef } from 'react';
import { Plus, Trash2, Settings2, Loader2, AlertTriangle, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { CondicaoPagamentoForm } from '@/components/contratos/CondicaoPagamentoForm';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  TIPO_PARCELA_LABELS,
  FORMA_PAGAMENTO_LABELS,
  type CondicaoPagamentoFormData,
  type TipoParcelaCodigo,
  type FormaPagamento,
} from '@/types/condicoesPagamento.types';
import { PropostaCondicaoPagamento } from '@/types/propostas.types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface PropostaCondicoesEditorProps {
  propostaId: string;
  valorReferencia?: number;
  readonly?: boolean;
  onValidationChange?: (isValid: boolean, diferenca: number) => void;
}

// Hooks for proposta_condicoes_pagamento
function usePropostaCondicoes(propostaId: string) {
  return useQuery({
    queryKey: ['proposta-condicoes', propostaId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('proposta_condicoes_pagamento')
        .select('*')
        .eq('proposta_id', propostaId)
        .eq('is_active', true)
        .order('ordem');

      if (error) throw error;
      return data as PropostaCondicaoPagamento[];
    },
    enabled: !!propostaId,
  });
}

function useCreatePropostaCondicao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<PropostaCondicaoPagamento> & { proposta_id: string }) => {
      const { data: result, error } = await (supabase as any)
        .from('proposta_condicoes_pagamento')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['proposta-condicoes', variables.proposta_id] });
    },
  });
}

function useUpdatePropostaCondicao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, propostaId, ...data }: { id: string; propostaId: string } & Partial<PropostaCondicaoPagamento>) => {
      const { data: result, error } = await (supabase as any)
        .from('proposta_condicoes_pagamento')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['proposta-condicoes', variables.propostaId] });
    },
  });
}

function useDeletePropostaCondicao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, propostaId }: { id: string; propostaId: string }) => {
      const { error } = await (supabase as any)
        .from('proposta_condicoes_pagamento')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['proposta-condicoes', variables.propostaId] });
    },
  });
}

export function PropostaCondicoesEditor({
  propostaId,
  valorReferencia = 0,
  readonly = false,
  onValidationChange,
}: PropostaCondicoesEditorProps) {
  const { data: condicoes = [], isLoading } = usePropostaCondicoes(propostaId);
  const createCondicao = useCreatePropostaCondicao();
  const updateCondicao = useUpdatePropostaCondicao();
  const deleteCondicao = useDeletePropostaCondicao();

  const [formOpen, setFormOpen] = useState(false);
  const [editingCondicao, setEditingCondicao] = useState<PropostaCondicaoPagamento | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [condicaoToDelete, setCondicaoToDelete] = useState<string | null>(null);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Calculate totals
  const { totalConfigurado, percentualConfigurado, diferenca } = useMemo(() => {
    const total = condicoes.reduce((sum, c) => sum + (c.quantidade || 0) * (c.valor || 0), 0);
    const percentual = valorReferencia > 0 ? Math.min((total / valorReferencia) * 100, 100) : 0;
    const diff = valorReferencia - total;
    return { totalConfigurado: total, percentualConfigurado: percentual, diferenca: diff };
  }, [condicoes, valorReferencia]);

  // Use ref to avoid infinite loop when calling onValidationChange
  const onValidationChangeRef = useRef(onValidationChange);
  onValidationChangeRef.current = onValidationChange;

  // Notify parent of validation state
  useEffect(() => {
    if (onValidationChangeRef.current && valorReferencia > 0) {
      const isValid = Math.abs(diferenca) < 0.01;
      onValidationChangeRef.current(isValid, diferenca);
    }
  }, [diferenca, valorReferencia]);

  const handleAddNew = () => {
    setEditingCondicao(null);
    setFormOpen(true);
  };

  const handleEdit = (condicao: PropostaCondicaoPagamento) => {
    setEditingCondicao(condicao);
    setFormOpen(true);
  };

  const handleDelete = (id: string) => {
    setCondicaoToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (condicaoToDelete) {
      await deleteCondicao.mutateAsync({ id: condicaoToDelete, propostaId });
      setCondicaoToDelete(null);
      setDeleteDialogOpen(false);
      toast.success('Condição removida');
    }
  };

  const handleSave = async (data: CondicaoPagamentoFormData) => {
    try {
      if (editingCondicao) {
        await updateCondicao.mutateAsync({
          id: editingCondicao.id,
          propostaId,
          ...data,
        });
        toast.success('Condição atualizada');
      } else {
        const maxOrdem = condicoes.reduce((max, c) => Math.max(max, c.ordem || 0), 0);
        await createCondicao.mutateAsync({
          proposta_id: propostaId,
          ordem: maxOrdem + 1,
          ...data,
        });
        toast.success('Condição adicionada');
      }
      setFormOpen(false);
      setEditingCondicao(null);
    } catch (error) {
      console.error('Erro ao salvar condição:', error);
      toast.error('Erro ao salvar condição');
    }
  };

  const handleAddWithRemainder = () => {
    if (diferenca <= 0) return;
    
    setEditingCondicao(null);
    setFormOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      {valorReferencia > 0 && (
        <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Valor da Proposta: {formatCurrency(valorReferencia)}</span>
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

      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Condições de Pagamento</h3>
        {!readonly && (
          <div className="flex gap-2">
            {diferenca > 0 && (
              <Button variant="outline" size="sm" onClick={handleAddWithRemainder}>
                <Plus className="h-4 w-4 mr-1" />
                Completar ({formatCurrency(diferenca)})
              </Button>
            )}
            <Button size="sm" onClick={handleAddNew}>
              <Plus className="h-4 w-4 mr-1" />
              Adicionar
            </Button>
          </div>
        )}
      </div>

      {/* Lista de condições */}
      {condicoes.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Settings2 className="h-8 w-8 mb-2" />
            <p>Nenhuma condição de pagamento configurada</p>
            {!readonly && (
              <Button variant="link" onClick={handleAddNew} className="mt-2">
                Adicionar primeira condição
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="max-h-[400px]">
          <div className="space-y-2">
            {condicoes.map((condicao) => (
              <Card key={condicao.id} className="group">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {TIPO_PARCELA_LABELS[condicao.tipo_parcela_codigo as TipoParcelaCodigo] || condicao.tipo_parcela_codigo}
                        </Badge>
                        {condicao.forma_pagamento && (
                          <Badge variant="outline">
                            {FORMA_PAGAMENTO_LABELS[condicao.forma_pagamento as FormaPagamento] || condicao.forma_pagamento}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">{condicao.quantidade}x</span>
                        <span className="mx-1">de</span>
                        <span className="font-medium">{formatCurrency(condicao.valor)}</span>
                        <span className="text-muted-foreground ml-2">
                          = {formatCurrency((condicao.quantidade || 0) * (condicao.valor || 0))}
                        </span>
                      </div>
                      {condicao.descricao && (
                        <p className="text-sm text-muted-foreground">{condicao.descricao}</p>
                      )}
                    </div>
                    
                    {!readonly && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(condicao)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(condicao.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Totais */}
      {condicoes.length > 0 && (
        <Card className={cn(
          "border-2",
          Math.abs(diferenca) < 0.01 ? "border-green-500/50 bg-green-50/50 dark:bg-green-950/20" : "border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20"
        )}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Configurado</p>
                <p className="text-xl font-bold">{formatCurrency(totalConfigurado)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Referência</p>
                <p className="text-xl font-medium">{formatCurrency(valorReferencia)}</p>
              </div>
            </div>
            {Math.abs(diferenca) >= 0.01 && (
              <div className="mt-2 pt-2 border-t">
                <p className={cn(
                  "text-sm font-medium",
                  diferenca > 0 ? "text-amber-600" : "text-red-600"
                )}>
                  {diferenca > 0 
                    ? `Faltam ${formatCurrency(diferenca)}`
                    : `Excesso de ${formatCurrency(Math.abs(diferenca))}`
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Alert de diferença */}
      {valorReferencia > 0 && Math.abs(diferenca) >= 0.01 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Condições inconsistentes</AlertTitle>
          <AlertDescription>
            O total das condições de pagamento deve ser igual ao valor da proposta.
          </AlertDescription>
        </Alert>
      )}

      {/* Form Dialog */}
      <CondicaoPagamentoForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSave={handleSave}
        initialData={editingCondicao ? {
          tipo_parcela_codigo: editingCondicao.tipo_parcela_codigo as TipoParcelaCodigo,
          quantidade: editingCondicao.quantidade,
          valor: editingCondicao.valor,
          valor_tipo: (editingCondicao.valor_tipo || 'fixo') as 'fixo' | 'percentual',
          forma_quitacao: 'dinheiro',
          forma_pagamento: (editingCondicao.forma_pagamento || 'boleto') as FormaPagamento,
          intervalo_dias: editingCondicao.intervalo_dias || 30,
          com_correcao: editingCondicao.com_correcao || false,
          indice_correcao: (editingCondicao.indice_correcao || 'INCC') as 'INCC' | 'IGPM' | 'IPCA',
          parcelas_sem_correcao: 0,
          descricao: editingCondicao.descricao || '',
        } : diferenca > 0 ? {
          tipo_parcela_codigo: 'mensal_serie' as TipoParcelaCodigo,
          quantidade: 1,
          valor: diferenca,
          valor_tipo: 'fixo',
          forma_quitacao: 'dinheiro',
          forma_pagamento: 'boleto',
          intervalo_dias: 30,
          com_correcao: false,
          indice_correcao: 'INCC',
          parcelas_sem_correcao: 0,
          descricao: '',
        } : undefined}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover condição?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
