import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Loader2, FileText, Printer, Check, X, FileCheck, Trash2, RefreshCw, AlertTriangle, Home, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Negociacao, STATUS_PROPOSTA_LABELS, STATUS_PROPOSTA_COLORS } from '@/types/negociacoes.types';
import { NegociacaoCondicoesPagamentoInlineEditor } from './NegociacaoCondicoesPagamentoInlineEditor';
import { ComentariosTab } from './ComentariosTab';
import { DacaoAnexosCard } from './DacaoAnexosCard';
import { MessageSquare } from 'lucide-react';
import {
  useNegociacao,
  useGerarProposta,
  useAceitarProposta,
  useRecusarProposta,
  useConverterPropostaEmContrato,
  useExcluirProposta,
  useReenviarParaAnalise,
} from '@/hooks/useNegociacoes';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface UnidadeDisponivel {
  id: string;
  numero: string;
  valor: number;
  andar: number | null;
  empreendimento_id: string;
  bloco: { id: string; nome: string } | null;
}

interface PropostaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  negociacao: Negociacao | null;
  mode?: 'gerar' | 'enviar' | 'aceitar' | 'recusar' | 'view';
}

export function PropostaDialog({
  open,
  onOpenChange,
  negociacao,
  mode = 'view',
}: PropostaDialogProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('dados');
  const [dataValidade, setDataValidade] = useState('');
  const [valorTabela, setValorTabela] = useState(0);
  const [valorProposta, setValorProposta] = useState(0);
  const [internalMode, setInternalMode] = useState(mode);
  const [selectedUnidadeIds, setSelectedUnidadeIds] = useState<string[]>([]);
  
  const [motivoRecusa, setMotivoRecusa] = useState('');
  const [condicoesValidas, setCondicoesValidas] = useState(false);

  // Fetch full negotiation data when dialog opens
  const { data: negociacaoCompleta } = useNegociacao(
    open && negociacao?.id ? negociacao.id : undefined
  );
  const neg = negociacaoCompleta || negociacao;
  
  const hasUnidades = neg?.unidades && neg.unidades.length > 0;

  // Fetch available units when negotiation has no units
  const { data: unidadesDisponiveis = [] } = useQuery({
    queryKey: ['unidades-disponiveis-proposta', neg?.empreendimento_id],
    enabled: !!neg?.empreendimento_id && open && !hasUnidades,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('unidades')
        .select('id, numero, valor, andar, empreendimento_id, bloco:blocos(id, nome)')
        .eq('empreendimento_id', neg!.empreendimento_id)
        .in('status', ['disponivel', 'reservada'])
        .order('numero');
      if (error) throw error;
      return (data || []) as UnidadeDisponivel[];
    },
  });
  // Group available units by block
  const unidadesAgrupadas = useMemo(() => {
    if (!unidadesDisponiveis.length) return new Map<string, UnidadeDisponivel[]>();
    const groups = new Map<string, UnidadeDisponivel[]>();
    unidadesDisponiveis.forEach((u) => {
      const key = u.bloco?.nome || 'Sem Bloco';
      const existing = groups.get(key) || [];
      existing.push(u);
      groups.set(key, existing);
    });
    // Sort units within each group
    groups.forEach((units) => {
      units.sort((a, b) => {
        const andarA = a.andar ?? -Infinity;
        const andarB = b.andar ?? -Infinity;
        if (andarA !== andarB) return andarA - andarB;
        return a.numero.localeCompare(b.numero, 'pt-BR', { numeric: true });
      });
    });
    // Sort keys naturally
    const sortedKeys = Array.from(groups.keys()).sort((a, b) =>
      a.localeCompare(b, 'pt-BR', { numeric: true })
    );
    const sorted = new Map<string, UnidadeDisponivel[]>();
    sortedKeys.filter(k => k !== 'Sem Bloco').forEach(k => sorted.set(k, groups.get(k)!));
    if (groups.has('Sem Bloco')) sorted.set('Sem Bloco', groups.get('Sem Bloco')!);
    return sorted;
  }, [unidadesDisponiveis]);


  const linkUnidadesMutation = useMutation({
    mutationFn: async ({ negociacaoId, unidadeIds }: { negociacaoId: string; unidadeIds: string[] }) => {
      const records = unidadeIds.map(unidade_id => {
        const unidade = unidadesDisponiveis.find(u => u.id === unidade_id);
        return {
          negociacao_id: negociacaoId,
          unidade_id,
          valor_tabela: unidade?.valor || 0,
        };
      });
      const { error } = await supabase.from('negociacao_unidades').insert(records);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['negociacao'] });
      toast.success('Unidades vinculadas com sucesso!');
    },
  });
  
  // Callback estável para evitar loops de render infinito
  const handleValidationChange = useCallback((isValid: boolean) => {
    setCondicoesValidas(isValid);
  }, []);

  const gerarProposta = useGerarProposta();
  const aceitarProposta = useAceitarProposta();
  const recusarProposta = useRecusarProposta();
  const converterContrato = useConverterPropostaEmContrato();
  const excluirProposta = useExcluirProposta();
  const reenviarParaAnalise = useReenviarParaAnalise();

  // Sync internal mode with prop
  useEffect(() => {
    setInternalMode(mode);
  }, [mode]);

  // Calculate default validity (30 days)
  useEffect(() => {
    if (open && neg) {
      const hoje = new Date();
      hoje.setDate(hoje.getDate() + 30);
      setDataValidade(neg.data_validade_proposta || hoje.toISOString().split('T')[0]);
      
      // Calculate valor tabela from units
      const valorUnidades = neg.unidades?.reduce(
        (acc, u) => acc + (u.valor_tabela || u.unidade?.valor || 0),
        0
      ) || neg.valor_negociacao || 0;
      
      setValorTabela(neg.valor_tabela || valorUnidades);
      setValorProposta(neg.valor_proposta || valorUnidades);
      setSelectedUnidadeIds([]);
    }
  }, [open, neg]);

  const handleClose = () => {
    setMotivoRecusa('');
    setInternalMode(mode);
    onOpenChange(false);
  };

  const handleGerarProposta = async () => {
    if (!neg) return;

    try {
      await gerarProposta.mutateAsync({
        id: neg.id,
        data: {
          data_validade: dataValidade,
          valor_tabela: valorTabela,
          valor_proposta: valorProposta,
        },
      });
      handleClose();
    } catch (error) {
      console.error('Erro ao gerar proposta:', error);
    }
  };

  const handleImprimir = () => {
    window.print();
  };

  const handleAceitarProposta = async () => {
    if (!neg) return;

    try {
      await aceitarProposta.mutateAsync(neg.id);
      handleClose();
    } catch (error) {
      console.error('Erro ao aceitar proposta:', error);
    }
  };

  const handleRecusarProposta = async () => {
    if (!neg || !motivoRecusa.trim()) return;

    try {
      await recusarProposta.mutateAsync({
        id: neg.id,
        data: { motivo_recusa: motivoRecusa },
      });
      handleClose();
    } catch (error) {
      console.error('Erro ao recusar proposta:', error);
    }
  };

  const handleGerarContrato = async () => {
    if (!neg) return;

    try {
      const result = await converterContrato.mutateAsync(neg.id);
      handleClose();
      navigate('/contratos');
    } catch (error) {
      console.error('Erro ao gerar contrato:', error);
    }
  };

  const handleExcluir = async () => {
    if (!neg) return;
    
    if (!window.confirm('Tem certeza que deseja excluir esta proposta?')) return;

    try {
      await excluirProposta.mutateAsync(neg.id);
      handleClose();
    } catch (error) {
      console.error('Erro ao excluir proposta:', error);
    }
  };

  const formatCurrency = (value?: number) => {
    if (!value) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const isLoading =
    gerarProposta.isPending ||
    aceitarProposta.isPending ||
    recusarProposta.isPending ||
    converterContrato.isPending ||
    excluirProposta.isPending ||
    reenviarParaAnalise.isPending;

  const statusProposta = neg?.status_proposta;
  const isRascunho = statusProposta === 'rascunho';
  const isContraProposta = statusProposta === 'contra_proposta';
  const isAceita = statusProposta === 'aceita' || statusProposta === 'aprovada_incorporador';
  const temProposta = !!neg?.numero_proposta;

  const handleReenviarParaAnalise = async () => {
    if (!neg) return;
    try {
      await reenviarParaAnalise.mutateAsync(neg as Negociacao);
      handleClose();
    } catch (error) {
      console.error('Erro ao reenviar para análise:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-[95vw] h-[90vh] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {temProposta ? `Proposta ${neg?.numero_proposta}` : 'Nova Proposta'}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            {neg?.codigo} - {neg?.cliente?.nome}
            {statusProposta && (
              <Badge
                variant="secondary"
                style={{ backgroundColor: STATUS_PROPOSTA_COLORS[statusProposta] }}
                className="text-white"
              >
                {STATUS_PROPOSTA_LABELS[statusProposta]}
              </Badge>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Alerta de Contra Proposta */}
        {isContraProposta && neg?.motivo_contra_proposta && (
          <div className="flex items-start gap-3 p-4 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-orange-800 dark:text-orange-200">Contra Proposta do Incorporador</p>
              <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">{neg.motivo_contra_proposta}</p>
            </div>
          </div>
        )}

        {internalMode === 'recusar' ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="motivo_recusa">Motivo da Recusa *</Label>
              <Textarea
                id="motivo_recusa"
                value={motivoRecusa}
                onChange={(e) => setMotivoRecusa(e.target.value)}
                placeholder="Descreva o motivo da recusa..."
                rows={4}
              />
            </div>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="dados">Dados da Proposta</TabsTrigger>
              <TabsTrigger value="condicoes">Condições de Pagamento</TabsTrigger>
              <TabsTrigger value="dacao" className="gap-1.5">
                <ImageIcon className="h-3.5 w-3.5" />
                Dação
              </TabsTrigger>
              <TabsTrigger value="comentarios" className="gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" />
                Comentários
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dados" className="space-y-4 mt-4">
              <Card>
                <CardContent className="pt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Empreendimento</Label>
                      <p className="text-sm font-medium">{neg?.empreendimento?.nome}</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Unidades</Label>
                      {hasUnidades ? (
                        <div className="flex flex-wrap gap-1">
                          {neg?.unidades?.map((u) => (
                            <Badge key={u.id} variant="outline">
                              {u.unidade?.bloco?.nome ? `${u.unidade.bloco.nome}-` : ''}
                              {u.unidade?.numero}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-amber-600 text-sm">
                            <AlertTriangle className="h-4 w-4" />
                            Nenhuma unidade vinculada. Selecione abaixo:
                          </div>
                          <div className="max-h-[300px] overflow-y-auto space-y-2">
                            {unidadesAgrupadas.size === 0 ? (
                              <div className="p-8 text-center border rounded-lg bg-muted/20">
                                <Home className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">
                                  Nenhuma unidade disponível
                                </p>
                              </div>
                            ) : (
                              Array.from(unidadesAgrupadas.entries()).map(([blocoNome, unidadesDoBloco]) => (
                                <Collapsible key={blocoNome} defaultOpen className="border rounded-lg">
                                  <CollapsibleTrigger className="w-full p-3 flex items-center justify-between hover:bg-muted/50 transition-colors rounded-t-lg">
                                    <span className="font-medium text-sm">{blocoNome}</span>
                                    <Badge variant="outline" className="text-xs">
                                      {unidadesDoBloco.length} {unidadesDoBloco.length === 1 ? 'unidade' : 'unidades'}
                                    </Badge>
                                  </CollapsibleTrigger>
                                  <CollapsibleContent className="p-3 pt-0">
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                      {unidadesDoBloco.map(unidade => {
                                        const isSelected = selectedUnidadeIds.includes(unidade.id);
                                        return (
                                          <button
                                            key={unidade.id}
                                            type="button"
                                            onClick={() => {
                                              const newIds = isSelected
                                                ? selectedUnidadeIds.filter(id => id !== unidade.id)
                                                : [...selectedUnidadeIds, unidade.id];
                                              setSelectedUnidadeIds(newIds);
                                              const total = newIds.reduce((sum, id) => {
                                                const u = unidadesDisponiveis.find(x => x.id === id);
                                                return sum + (u?.valor || 0);
                                              }, 0);
                                              setValorTabela(total);
                                              setValorProposta(total);
                                            }}
                                            className={cn(
                                              "p-2 rounded-lg border text-left transition-all",
                                              "hover:border-primary/50 hover:bg-primary/5",
                                              isSelected && "border-primary bg-primary/10 ring-1 ring-primary"
                                            )}
                                          >
                                            <div className="font-medium text-sm">{unidade.numero}</div>
                                            {unidade.andar != null && (
                                              <div className="text-xs text-muted-foreground">{unidade.andar}º andar</div>
                                            )}
                                            <div className="text-xs font-mono mt-1">
                                              {unidade.valor?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </div>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </CollapsibleContent>
                                </Collapsible>
                              ))
                            )}
                          </div>
                          {selectedUnidadeIds.length > 0 && (
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => {
                                if (neg) {
                                  linkUnidadesMutation.mutate({
                                    negociacaoId: neg.id,
                                    unidadeIds: selectedUnidadeIds,
                                  });
                                }
                              }}
                              disabled={linkUnidadesMutation.isPending}
                            >
                              {linkUnidadesMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                              Vincular {selectedUnidadeIds.length} unidade(s)
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="valor_tabela">Valor de Tabela</Label>
                      <Input
                        id="valor_tabela"
                        type="number"
                        value={valorTabela}
                        onChange={(e) => setValorTabela(Number(e.target.value))}
                        disabled={temProposta}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="valor_proposta">Valor da Proposta</Label>
                      <Input
                        id="valor_proposta"
                        type="number"
                        value={valorProposta}
                        onChange={(e) => setValorProposta(Number(e.target.value))}
                        disabled={temProposta}
                      />
                    </div>
                  </div>

                  {valorTabela > 0 && valorProposta > 0 && valorProposta < valorTabela && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm">
                        <span className="text-muted-foreground">Desconto: </span>
                        <span className="font-medium text-primary">
                          {formatCurrency(valorTabela - valorProposta)} ({((1 - valorProposta / valorTabela) * 100).toFixed(1)}%)
                        </span>
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="data_validade">Validade da Proposta</Label>
                    <Input
                      id="data_validade"
                      type="date"
                      value={dataValidade}
                      onChange={(e) => setDataValidade(e.target.value)}
                      disabled={temProposta}
                    />
                  </div>

                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="condicoes" className="mt-4">
              {neg && (
                <NegociacaoCondicoesPagamentoInlineEditor
                  negociacaoId={neg.id}
                  empreendimentoId={neg.empreendimento_id}
                  valorReferencia={valorProposta || valorTabela}
                  readonly={isAceita || statusProposta === 'recusada' || statusProposta === 'convertida' || statusProposta === 'em_analise'}
                  onValidationChange={handleValidationChange}
                />
              )}
            </TabsContent>

            <TabsContent value="comentarios" className="mt-4">
              {neg && <ComentariosTab negociacaoId={neg.id} />}
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter className="flex-wrap gap-2">
          {/* Excluir Proposta - apenas rascunho ou recusada */}
          {(isRascunho || statusProposta === 'recusada') && (
            <Button variant="destructive" onClick={handleExcluir} disabled={isLoading} className="mr-auto">
              {excluirProposta.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
          )}
          
          <Button variant="outline" onClick={handleClose}>
            Fechar
          </Button>

          {/* Gerar Proposta */}
          {!temProposta && (
            <Button onClick={handleGerarProposta} disabled={isLoading}>
              {gerarProposta.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <FileText className="h-4 w-4 mr-2" />
              Gerar Proposta
            </Button>
          )}

          {/* Imprimir Proposta */}
          {temProposta && (
            <Button variant="outline" onClick={handleImprimir}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
          )}

          {/* Aceitar/Recusar Proposta */}
          {isRascunho && internalMode !== 'recusar' && (
            <>
              <Button variant="destructive" onClick={() => setInternalMode('recusar')}>
                <X className="h-4 w-4 mr-2" />
                Recusar
              </Button>
              <Button onClick={handleAceitarProposta} disabled={isLoading}>
                {aceitarProposta.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Check className="h-4 w-4 mr-2" />
                Aceitar
              </Button>
            </>
          )}

          {internalMode === 'recusar' && (
            <Button
              variant="destructive"
              onClick={handleRecusarProposta}
              disabled={isLoading || !motivoRecusa.trim()}
            >
              {recusarProposta.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmar Recusa
            </Button>
          )}

          {/* Reenviar para Análise (contra proposta) */}
          {isContraProposta && (
            <Button onClick={handleReenviarParaAnalise} disabled={isLoading}>
              {reenviarParaAnalise.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <RefreshCw className="h-4 w-4 mr-2" />
              Reenviar para Análise
            </Button>
          )}

          {/* Gerar Contrato */}
          {isAceita && (
            <Button onClick={handleGerarContrato} disabled={isLoading}>
              {converterContrato.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <FileCheck className="h-4 w-4 mr-2" />
              Gerar Contrato
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
