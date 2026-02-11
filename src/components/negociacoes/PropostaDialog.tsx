import { useState, useEffect, useCallback } from 'react';
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
import { Loader2, FileText, Printer, Check, X, FileCheck, Trash2 } from 'lucide-react';
import { Negociacao, STATUS_PROPOSTA_LABELS, STATUS_PROPOSTA_COLORS } from '@/types/negociacoes.types';
import { NegociacaoCondicoesPagamentoInlineEditor } from './NegociacaoCondicoesPagamentoInlineEditor';
import {
  useGerarProposta,
  useAceitarProposta,
  useRecusarProposta,
  useConverterPropostaEmContrato,
  useExcluirProposta,
} from '@/hooks/useNegociacoes';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

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
  const [activeTab, setActiveTab] = useState('dados');
  const [dataValidade, setDataValidade] = useState('');
  const [valorTabela, setValorTabela] = useState(0);
  const [valorProposta, setValorProposta] = useState(0);
  
  const [motivoRecusa, setMotivoRecusa] = useState('');
  const [condicoesValidas, setCondicoesValidas] = useState(false);
  
  // Callback estável para evitar loops de render infinito
  const handleValidationChange = useCallback((isValid: boolean) => {
    setCondicoesValidas(isValid);
  }, []);

  const gerarProposta = useGerarProposta();
  const aceitarProposta = useAceitarProposta();
  const recusarProposta = useRecusarProposta();
  const converterContrato = useConverterPropostaEmContrato();
  const excluirProposta = useExcluirProposta();

  // Calculate default validity (30 days)
  useEffect(() => {
    if (open && negociacao) {
      const hoje = new Date();
      hoje.setDate(hoje.getDate() + 30);
      setDataValidade(negociacao.data_validade_proposta || hoje.toISOString().split('T')[0]);
      
      // Calculate valor tabela from units
      const valorUnidades = negociacao.unidades?.reduce(
        (acc, u) => acc + (u.valor_tabela || u.unidade?.valor || 0),
        0
      ) || negociacao.valor_negociacao || 0;
      
      setValorTabela(negociacao.valor_tabela || valorUnidades);
      setValorProposta(negociacao.valor_proposta || valorUnidades);
      
    }
  }, [open, negociacao]);

  const handleClose = () => {
    setMotivoRecusa('');
    onOpenChange(false);
  };

  const handleGerarProposta = async () => {
    if (!negociacao) return;

    try {
      await gerarProposta.mutateAsync({
        id: negociacao.id,
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
    if (!negociacao) return;

    try {
      await aceitarProposta.mutateAsync(negociacao.id);
      handleClose();
    } catch (error) {
      console.error('Erro ao aceitar proposta:', error);
    }
  };

  const handleRecusarProposta = async () => {
    if (!negociacao || !motivoRecusa.trim()) return;

    try {
      await recusarProposta.mutateAsync({
        id: negociacao.id,
        data: { motivo_recusa: motivoRecusa },
      });
      handleClose();
    } catch (error) {
      console.error('Erro ao recusar proposta:', error);
    }
  };

  const handleGerarContrato = async () => {
    if (!negociacao) return;

    try {
      const result = await converterContrato.mutateAsync(negociacao.id);
      handleClose();
      navigate('/contratos');
    } catch (error) {
      console.error('Erro ao gerar contrato:', error);
    }
  };

  const handleExcluir = async () => {
    if (!negociacao) return;
    
    if (!window.confirm('Tem certeza que deseja excluir esta proposta?')) return;

    try {
      await excluirProposta.mutateAsync(negociacao.id);
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
    excluirProposta.isPending;

  const statusProposta = negociacao?.status_proposta;
  const isRascunho = statusProposta === 'rascunho';
  
  const isAceita = statusProposta === 'aceita';
  const temProposta = !!negociacao?.numero_proposta;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-[95vw] h-[90vh] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {temProposta ? `Proposta ${negociacao?.numero_proposta}` : 'Nova Proposta'}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            {negociacao?.codigo} - {negociacao?.cliente?.nome}
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

        {mode === 'recusar' ? (
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
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="dados">Dados da Proposta</TabsTrigger>
              <TabsTrigger value="condicoes">Condições de Pagamento</TabsTrigger>
            </TabsList>

            <TabsContent value="dados" className="space-y-4 mt-4">
              <Card>
                <CardContent className="pt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Empreendimento</Label>
                      <p className="text-sm font-medium">{negociacao?.empreendimento?.nome}</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Unidades</Label>
                      <div className="flex flex-wrap gap-1">
                        {negociacao?.unidades?.map((u) => (
                          <Badge key={u.id} variant="outline">
                            {u.unidade?.bloco?.nome ? `${u.unidade.bloco.nome}-` : ''}
                            {u.unidade?.numero}
                          </Badge>
                        ))}
                      </div>
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
              {negociacao && (
                <NegociacaoCondicoesPagamentoInlineEditor
                  negociacaoId={negociacao.id}
                  empreendimentoId={negociacao.empreendimento_id}
                  valorReferencia={valorProposta || valorTabela}
                  readonly={isAceita || statusProposta === 'recusada' || statusProposta === 'convertida'}
                  onValidationChange={handleValidationChange}
                />
              )}
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
          {isRascunho && mode !== 'recusar' && (
            <>
              <Button variant="destructive" onClick={() => onOpenChange(true)}>
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

          {mode === 'recusar' && (
            <Button
              variant="destructive"
              onClick={handleRecusarProposta}
              disabled={isLoading || !motivoRecusa.trim()}
            >
              {recusarProposta.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmar Recusa
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
