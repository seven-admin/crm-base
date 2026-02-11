import { useState } from 'react';
import { Plus, GripVertical, Pencil, Trash2, Car, Home, Banknote, Package, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { CondicaoPagamentoForm } from './CondicaoPagamentoForm';
import {
  useTemplateCondicoesPagamento,
  useCreateTemplateCondicao,
  useUpdateTemplateCondicao,
  useDeleteTemplateCondicao,
  useReorderTemplateCondicoes,
} from '@/hooks/useCondicoesPagamento';
import {
  TIPO_PARCELA_LABELS,
  FORMA_QUITACAO_LABELS,
  type TemplateCondicaoPagamento,
  type CondicaoPagamentoFormData,
  type FormaQuitacao,
} from '@/types/condicoesPagamento.types';
import { calcularTotalCondicoes } from '@/lib/gerarTextoCondicoes';

interface CondicoesPagamentoEditorProps {
  templateId: string;
  valorReferencia?: number;
}

export function CondicoesPagamentoEditor({ templateId, valorReferencia }: CondicoesPagamentoEditorProps) {
  const { data: condicoes = [], isLoading } = useTemplateCondicoesPagamento(templateId);
  const createCondicao = useCreateTemplateCondicao();
  const updateCondicao = useUpdateTemplateCondicao();
  const deleteCondicao = useDeleteTemplateCondicao();
  const reorderCondicoes = useReorderTemplateCondicoes();

  const [formOpen, setFormOpen] = useState(false);
  const [editingCondicao, setEditingCondicao] = useState<TemplateCondicaoPagamento | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [condicaoToDelete, setCondicaoToDelete] = useState<string | null>(null);

  const handleAddNew = () => {
    setEditingCondicao(null);
    setFormOpen(true);
  };

  const handleEdit = (condicao: TemplateCondicaoPagamento) => {
    setEditingCondicao(condicao);
    setFormOpen(true);
  };

  const handleDelete = (id: string) => {
    setCondicaoToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (condicaoToDelete) {
      deleteCondicao.mutate({ id: condicaoToDelete, templateId });
      setCondicaoToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const handleSave = (data: CondicaoPagamentoFormData) => {
    if (editingCondicao) {
      updateCondicao.mutate({
        id: editingCondicao.id,
        templateId,
        ...data,
      }, {
        onSuccess: () => setFormOpen(false),
      });
    } else {
      const maxOrdem = condicoes.reduce((max, c) => Math.max(max, c.ordem), 0);
      createCondicao.mutate({
        template_id: templateId,
        ordem: maxOrdem + 1,
        ...data,
      }, {
        onSuccess: () => setFormOpen(false),
      });
    }
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newItems = [...condicoes];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newItems.length) return;
    
    [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
    
    const updates = newItems.map((item, idx) => ({
      id: item.id,
      ordem: idx,
    }));
    
    reorderCondicoes.mutate({ templateId, items: updates });
  };

  const getFormaQuitacaoIcon = (forma: FormaQuitacao) => {
    switch (forma) {
      case 'veiculo': return <Car className="h-4 w-4" />;
      case 'imovel': return <Home className="h-4 w-4" />;
      case 'outro_bem': return <Package className="h-4 w-4" />;
      default: return <Banknote className="h-4 w-4" />;
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const totais = calcularTotalCondicoes(condicoes, valorReferencia);

  if (isLoading) {
    return <div className="p-4 text-center text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Condições de Pagamento</h3>
          <p className="text-sm text-muted-foreground">
            Configure as formas de pagamento para este template
          </p>
        </div>
        <Button type="button" onClick={handleAddNew} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar
        </Button>
      </div>

      {condicoes.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <Banknote className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">Nenhuma condição de pagamento configurada</p>
            <Button type="button" variant="link" onClick={handleAddNew} className="mt-2">
              Adicionar primeira condição
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-2">
            {condicoes.map((condicao, index) => (
              <Card key={condicao.id} className="group">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Drag handle e ordem */}
                    <div className="flex flex-col items-center gap-1 pt-1">
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                      <span className="text-xs font-mono text-muted-foreground">{index + 1}</span>
                    </div>

                    {/* Conteúdo */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs">
                          {TIPO_PARCELA_LABELS[condicao.tipo_parcela_codigo]}
                        </Badge>
                        <Badge variant="outline" className="text-xs flex items-center gap-1">
                          {getFormaQuitacaoIcon(condicao.forma_quitacao as FormaQuitacao)}
                          {FORMA_QUITACAO_LABELS[condicao.forma_quitacao as FormaQuitacao]}
                        </Badge>
                        {condicao.com_correcao && (
                          <Badge variant="outline" className="text-xs">
                            {condicao.indice_correcao}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-baseline gap-2">
                        <span className="font-semibold">
                          {condicao.quantidade}x {condicao.valor ? formatCurrency(condicao.valor) : '-'}
                        </span>
                        {condicao.valor_tipo === 'percentual' && (
                          <span className="text-sm text-muted-foreground">({condicao.valor}%)</span>
                        )}
                      </div>

                      {condicao.descricao && (
                        <p className="text-sm text-muted-foreground mt-1 truncate">
                          {condicao.descricao}
                        </p>
                      )}

                      {/* Dados do bem se aplicável */}
                      {condicao.forma_quitacao === 'veiculo' && condicao.bem_marca && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {condicao.bem_marca} {condicao.bem_modelo} {condicao.bem_ano}
                          {condicao.bem_placa && ` - ${condicao.bem_placa}`}
                        </p>
                      )}

                      {condicao.forma_quitacao === 'imovel' && condicao.bem_endereco && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {condicao.bem_endereco}
                        </p>
                      )}
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => moveItem(index, 'up')}
                        disabled={index === 0}
                      >
                        <span className="sr-only">Mover para cima</span>
                        ↑
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => moveItem(index, 'down')}
                        disabled={index === condicoes.length - 1}
                      >
                        <span className="sr-only">Mover para baixo</span>
                        ↓
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEdit(condicao)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(condicao.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Resumo dos totais */}
      {condicoes.length > 0 && (
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Total Configurado</p>
                <p className="font-semibold">{formatCurrency(totais.totalGeral)}</p>
              </div>
              {valorReferencia && (
                <>
                  <div>
                    <p className="text-muted-foreground">Valor de Referência</p>
                    <p className="font-semibold">{formatCurrency(valorReferencia)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Diferença</p>
                    <p className={`font-semibold ${totais.diferenca !== 0 ? 'text-destructive' : 'text-green-600'}`}>
                      {formatCurrency(totais.diferenca)}
                    </p>
                  </div>
                </>
              )}
            </div>
            {valorReferencia && totais.diferenca !== 0 && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  A soma das condições não corresponde ao valor de referência. 
                  {totais.diferenca > 0 ? ' Falta configurar ' : ' Excede em '}
                  {formatCurrency(Math.abs(totais.diferenca))}.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Form Modal */}
      <CondicaoPagamentoForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSave={handleSave}
        valorReferencia={valorReferencia}
        valorConfigurado={totais.totalGeral - (editingCondicao ? (editingCondicao.quantidade * (editingCondicao.valor || 0)) : 0)}
        initialData={editingCondicao ? {
          tipo_parcela_codigo: editingCondicao.tipo_parcela_codigo as any,
          descricao: editingCondicao.descricao || undefined,
          quantidade: editingCondicao.quantidade,
          valor: editingCondicao.valor || undefined,
          valor_tipo: editingCondicao.valor_tipo as any,
          data_vencimento: editingCondicao.data_vencimento || undefined,
          intervalo_dias: editingCondicao.intervalo_dias,
          evento_vencimento: editingCondicao.evento_vencimento as any,
          com_correcao: editingCondicao.com_correcao,
          indice_correcao: editingCondicao.indice_correcao,
          parcelas_sem_correcao: editingCondicao.parcelas_sem_correcao,
          forma_quitacao: editingCondicao.forma_quitacao as any,
          forma_pagamento: editingCondicao.forma_pagamento as any,
          bem_descricao: editingCondicao.bem_descricao || undefined,
          bem_marca: editingCondicao.bem_marca || undefined,
          bem_modelo: editingCondicao.bem_modelo || undefined,
          bem_ano: editingCondicao.bem_ano || undefined,
          bem_placa: editingCondicao.bem_placa || undefined,
          bem_cor: editingCondicao.bem_cor || undefined,
          bem_renavam: editingCondicao.bem_renavam || undefined,
          bem_matricula: editingCondicao.bem_matricula || undefined,
          bem_cartorio: editingCondicao.bem_cartorio || undefined,
          bem_endereco: editingCondicao.bem_endereco || undefined,
          bem_area_m2: editingCondicao.bem_area_m2 || undefined,
          bem_valor_avaliado: editingCondicao.bem_valor_avaliado || undefined,
          bem_observacoes: editingCondicao.bem_observacoes || undefined,
          beneficiario_tipo: editingCondicao.beneficiario_tipo as any,
          beneficiario_id: editingCondicao.beneficiario_id || undefined,
          observacao_texto: editingCondicao.observacao_texto || undefined,
        } : undefined}
        isSaving={createCondicao.isPending || updateCondicao.isPending}
      />

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
