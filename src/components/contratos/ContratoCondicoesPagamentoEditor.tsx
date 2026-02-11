import { useState, useMemo } from 'react';
import { Plus, GripVertical, Pencil, Trash2, Car, Home, Banknote, Package, AlertCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
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
  useContratoCondicoesPagamento,
  useCreateContratoCondicao,
  useUpdateContratoCondicao,
  useDeleteContratoCondicao,
} from '@/hooks/useCondicoesPagamento';
import {
  TIPO_PARCELA_LABELS,
  FORMA_QUITACAO_LABELS,
  type ContratoCondicaoPagamento,
  type CondicaoPagamentoFormData,
  type FormaQuitacao,
} from '@/types/condicoesPagamento.types';
import { calcularTotalCondicoes } from '@/lib/gerarTextoCondicoes';
import { cn } from '@/lib/utils';

interface ContratoCondicoesPagamentoEditorProps {
  contratoId: string;
  valorReferencia?: number;
  readonly?: boolean;
}

export function ContratoCondicoesPagamentoEditor({ 
  contratoId, 
  valorReferencia,
  readonly = false 
}: ContratoCondicoesPagamentoEditorProps) {
  const { data: condicoes = [], isLoading } = useContratoCondicoesPagamento(contratoId);
  const createCondicao = useCreateContratoCondicao();
  const updateCondicao = useUpdateContratoCondicao();
  const deleteCondicao = useDeleteContratoCondicao();

  const [formOpen, setFormOpen] = useState(false);
  const [editingCondicao, setEditingCondicao] = useState<ContratoCondicaoPagamento | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [condicaoToDelete, setCondicaoToDelete] = useState<string | null>(null);

  // Calcular totais primeiro (usado por outros cálculos)
  const totais = calcularTotalCondicoes(condicoes, valorReferencia);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const getFormaQuitacaoIcon = (forma: FormaQuitacao) => {
    switch (forma) {
      case 'veiculo': return <Car className="h-4 w-4" />;
      case 'imovel': return <Home className="h-4 w-4" />;
      case 'outro_bem': return <Package className="h-4 w-4" />;
      default: return <Banknote className="h-4 w-4" />;
    }
  };

  // Calcular percentual configurado
  const percentualConfigurado = useMemo(() => {
    if (!valorReferencia || valorReferencia === 0) return 0;
    return Math.min((totais.totalGeral / valorReferencia) * 100, 100);
  }, [totais.totalGeral, valorReferencia]);

  const handleAddNew = () => {
    setEditingCondicao(null);
    setFormOpen(true);
  };

  const handleEdit = (condicao: ContratoCondicaoPagamento) => {
    setEditingCondicao(condicao);
    setFormOpen(true);
  };

  const handleDelete = (id: string) => {
    setCondicaoToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (condicaoToDelete) {
      deleteCondicao.mutate({ id: condicaoToDelete, contratoId });
      setCondicaoToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const handleSave = (data: CondicaoPagamentoFormData) => {
    if (editingCondicao) {
      updateCondicao.mutate({
        id: editingCondicao.id,
        contratoId,
        ...data,
      }, {
        onSuccess: () => setFormOpen(false),
      });
    } else {
      const maxOrdem = condicoes.reduce((max, c) => Math.max(max, c.ordem || 0), 0);
      createCondicao.mutate({
        contrato_id: contratoId,
        ordem: maxOrdem + 1,
        ...data,
      }, {
        onSuccess: () => setFormOpen(false),
      });
    }
  };

  const handleAddWithRemainder = () => {
    if (!valorReferencia || totais.diferenca <= 0) return;
    
    setEditingCondicao(null);
    setFormOpen(true);
  };

  if (isLoading) {
    return <div className="p-4 text-center text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      {valorReferencia && valorReferencia > 0 && (
        <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Progresso de configuração</span>
            <span className={cn(
              "font-semibold",
              percentualConfigurado >= 100 ? "text-green-600" : 
              percentualConfigurado >= 50 ? "text-amber-600" : "text-muted-foreground"
            )}>
              {percentualConfigurado.toFixed(1)}%
            </span>
          </div>
          <Progress 
            value={percentualConfigurado} 
            className={cn(
              "h-3",
              percentualConfigurado >= 100 && "[&>div]:bg-green-600"
            )} 
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>R$ 0,00</span>
            <span>Configurado: {formatCurrency(totais.totalGeral)}</span>
            <span>{formatCurrency(valorReferencia)}</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Condições de Pagamento</h3>
          <p className="text-sm text-muted-foreground">
            Configure as formas de pagamento deste contrato
          </p>
        </div>
        {!readonly && (
          <div className="flex items-center gap-2">
            {valorReferencia && totais.diferenca > 0 && (
              <Button 
                onClick={handleAddWithRemainder} 
                size="sm" 
                variant="outline"
                className="text-amber-600 border-amber-300 hover:bg-amber-50"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Completar {formatCurrency(totais.diferenca)}
              </Button>
            )}
            <Button onClick={handleAddNew} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>
        )}
      </div>

      {condicoes.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <Banknote className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">Nenhuma condição de pagamento configurada</p>
            {!readonly && (
              <Button variant="link" onClick={handleAddNew} className="mt-2">
                Adicionar primeira condição
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-2">
            {condicoes.map((condicao, index) => (
              <Card key={condicao.id} className="group">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Ordem */}
                    <div className="flex flex-col items-center gap-1 pt-1">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs font-mono text-muted-foreground">{index + 1}</span>
                    </div>

                    {/* Conteúdo */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs">
                          {TIPO_PARCELA_LABELS[condicao.tipo_parcela_codigo] || condicao.tipo_parcela_codigo}
                        </Badge>
                        <Badge variant="outline" className="text-xs flex items-center gap-1">
                          {getFormaQuitacaoIcon(condicao.forma_quitacao as FormaQuitacao)}
                          {FORMA_QUITACAO_LABELS[condicao.forma_quitacao as FormaQuitacao] || condicao.forma_quitacao}
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
                    </div>

                    {/* Ações */}
                    {!readonly && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(condicao)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(condicao.id)}
                        >
                          <Trash2 className="h-4 w-4" />
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
                    <p className="text-muted-foreground">Valor do Contrato</p>
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
                  A soma das condições não corresponde ao valor do contrato. 
                  {totais.diferenca > 0 ? ' Falta configurar ' : ' Excede em '}
                  {formatCurrency(Math.abs(totais.diferenca))}.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Form Modal */}
      {!readonly && (
        <CondicaoPagamentoForm
          open={formOpen}
          onOpenChange={setFormOpen}
          onSave={handleSave}
          valorReferencia={valorReferencia}
          valorConfigurado={totais.totalGeral - (editingCondicao ? ((editingCondicao.quantidade || 1) * (editingCondicao.valor || 0)) : 0)}
          initialData={editingCondicao ? {
            tipo_parcela_codigo: editingCondicao.tipo_parcela_codigo as any,
            descricao: editingCondicao.descricao || undefined,
            quantidade: editingCondicao.quantidade || 1,
            valor: editingCondicao.valor || undefined,
            valor_tipo: (editingCondicao.valor_tipo as any) || 'fixo',
            data_vencimento: editingCondicao.data_vencimento || undefined,
            intervalo_dias: editingCondicao.intervalo_dias || 30,
            evento_vencimento: editingCondicao.evento_vencimento as any,
            com_correcao: editingCondicao.com_correcao || false,
            indice_correcao: editingCondicao.indice_correcao || 'INCC',
            parcelas_sem_correcao: editingCondicao.parcelas_sem_correcao || 0,
            forma_quitacao: (editingCondicao.forma_quitacao as any) || 'dinheiro',
            forma_pagamento: (editingCondicao.forma_pagamento as any) || 'boleto',
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
