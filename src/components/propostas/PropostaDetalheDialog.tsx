import { useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  FileText, 
  Loader2, 
  Send, 
  Check, 
  X, 
  Handshake, 
  Trash2,
  User,
  Building,
  Home,
  Calendar,
  DollarSign,
  Edit,
} from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Proposta, STATUS_PROPOSTA_LABELS, STATUS_PROPOSTA_COLORS, StatusProposta } from '@/types/propostas.types';
import { PropostaCondicoesEditor } from './PropostaCondicoesEditor';
import { ConverterPropostaDialog } from './ConverterPropostaDialog';
import {
  useEnviarProposta,
  useAceitarPropostaNew,
  useRecusarPropostaNew,
  useDeleteProposta,
} from '@/hooks/usePropostas';
import { toast } from 'sonner';

interface PropostaDetalheDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proposta: Proposta | null;
  onEdit?: () => void;
}

export function PropostaDetalheDialog({
  open,
  onOpenChange,
  proposta,
  onEdit,
}: PropostaDetalheDialogProps) {
  const [activeTab, setActiveTab] = useState('dados');
  const [motivoRecusa, setMotivoRecusa] = useState('');
  const [showRecusaForm, setShowRecusaForm] = useState(false);
  const [converterDialogOpen, setConverterDialogOpen] = useState(false);
  const [condicoesValidas, setCondicoesValidas] = useState(false);
  
  // Estado local para rastrear status após aceite (enquanto cache não atualiza)
  const [localStatus, setLocalStatus] = useState<StatusProposta | null>(null);
  
  // Reset do estado local quando abre/fecha dialog ou muda proposta
  useEffect(() => {
    if (open) {
      setLocalStatus(null);
    }
  }, [open, proposta?.id]);
  
  // Callback estável para evitar loops de render infinito
  const handleValidationChange = useCallback((isValid: boolean) => {
    setCondicoesValidas(isValid);
  }, []);

  const enviarProposta = useEnviarProposta();
  const aceitarProposta = useAceitarPropostaNew();
  const recusarProposta = useRecusarPropostaNew();
  const deleteProposta = useDeleteProposta();

  const isLoading = enviarProposta.isPending || aceitarProposta.isPending || 
    recusarProposta.isPending || deleteProposta.isPending;

  const handleClose = () => {
    setMotivoRecusa('');
    setShowRecusaForm(false);
    setActiveTab('dados');
    setLocalStatus(null);
    onOpenChange(false);
  };

  const handleEnviar = async () => {
    if (!proposta) return;
    try {
      await enviarProposta.mutateAsync(proposta.id);
      setLocalStatus('enviada');
      toast.success('Proposta enviada ao cliente');
    } catch (error) {
      console.error('Erro ao enviar proposta:', error);
    }
  };

  const handleAceitar = async () => {
    if (!proposta) return;
    try {
      await aceitarProposta.mutateAsync(proposta.id);
      setLocalStatus('aceita');
      toast.success('Proposta aceita! Agora você pode converter em negociação.');
    } catch (error) {
      console.error('Erro ao aceitar proposta:', error);
    }
  };

  const handleRecusar = async () => {
    if (!proposta || !motivoRecusa.trim()) return;
    try {
      await recusarProposta.mutateAsync({ propostaId: proposta.id, motivo: motivoRecusa });
      toast.success('Proposta recusada');
      handleClose();
    } catch (error) {
      console.error('Erro ao recusar proposta:', error);
    }
  };

  const handleExcluir = async () => {
    if (!proposta) return;
    if (!window.confirm('Tem certeza que deseja excluir esta proposta?')) return;
    try {
      await deleteProposta.mutateAsync(proposta.id);
      toast.success('Proposta excluída');
      handleClose();
    } catch (error) {
      console.error('Erro ao excluir proposta:', error);
    }
  };

  const formatCurrency = (value?: number | null) => {
    if (!value) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '-';
    return format(parseISO(dateStr), "dd/MM/yyyy", { locale: ptBR });
  };

  const getValidadeBadge = () => {
    if (!proposta?.data_validade || !['rascunho', 'enviada'].includes(proposta.status)) {
      return null;
    }
    
    const dias = differenceInDays(parseISO(proposta.data_validade), new Date());
    
    if (dias < 0) {
      return <Badge variant="destructive">Expirada</Badge>;
    } else if (dias <= 3) {
      return <Badge variant="destructive">{dias}d para expirar</Badge>;
    } else if (dias <= 7) {
      return <Badge variant="outline" className="text-amber-600 border-amber-600">{dias}d restantes</Badge>;
    }
    return <Badge variant="outline">{dias}d restantes</Badge>;
  };

  // Usa status local se disponível, senão usa da proposta
  const effectiveStatus = (localStatus || proposta?.status) as StatusProposta | undefined;
  const isRascunho = effectiveStatus === 'rascunho';
  const isEnviada = effectiveStatus === 'enviada';
  const isAceita = effectiveStatus === 'aceita';
  const isReadonly = !isRascunho && !isEnviada;

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Proposta {proposta?.numero || ''}
            </DialogTitle>
            <DialogDescription className="flex items-center gap-2 flex-wrap">
              {proposta?.cliente?.nome || 'Cliente não definido'}
              {effectiveStatus && (
                <Badge className={STATUS_PROPOSTA_COLORS[effectiveStatus]}>
                  {STATUS_PROPOSTA_LABELS[effectiveStatus]}
                </Badge>
              )}
              {getValidadeBadge()}
            </DialogDescription>
          </DialogHeader>

          {showRecusaForm ? (
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
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowRecusaForm(false)}>
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleRecusar}
                  disabled={isLoading || !motivoRecusa.trim()}
                >
                  {recusarProposta.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Confirmar Recusa
                </Button>
              </div>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="dados">Dados da Proposta</TabsTrigger>
                <TabsTrigger value="condicoes">Condições de Pagamento</TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto mt-4">
                <TabsContent value="dados" className="m-0 space-y-4">
                  {/* Cliente */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Cliente
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Nome:</span>
                          <p className="font-medium">{proposta?.cliente?.nome || '-'}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">CPF:</span>
                          <p className="font-medium">{proposta?.cliente?.cpf || '-'}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Email:</span>
                          <p className="font-medium">{proposta?.cliente?.email || '-'}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Telefone:</span>
                          <p className="font-medium">{proposta?.cliente?.telefone || '-'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Empreendimento e Unidades */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        Empreendimento
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-3">
                      <p className="font-medium">{proposta?.empreendimento?.nome || '-'}</p>
                      
                      {proposta?.unidades && proposta.unidades.length > 0 && (
                        <div>
                          <span className="text-sm text-muted-foreground">Unidades:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {proposta.unidades.map((u) => (
                              <Badge key={u.id} variant="outline">
                                <Home className="h-3 w-3 mr-1" />
                                {u.unidade?.bloco?.nome ? `${u.unidade.bloco.nome}-` : ''}
                                {u.unidade?.codigo}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Valores */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Valores
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <span className="text-sm text-muted-foreground">Valor de Tabela</span>
                          <p className="text-lg font-semibold">{formatCurrency(proposta?.valor_tabela)}</p>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Valor da Proposta</span>
                          <p className="text-lg font-semibold text-primary">{formatCurrency(proposta?.valor_proposta)}</p>
                        </div>
                        {proposta?.desconto_percentual && proposta.desconto_percentual > 0 && (
                          <div>
                            <span className="text-sm text-muted-foreground">Desconto</span>
                            <p className="text-lg font-semibold text-green-600">
                              {proposta.desconto_percentual.toFixed(1)}%
                            </p>
                          </div>
                        )}
                        {proposta?.desconto_valor && proposta.desconto_valor > 0 && (
                          <div>
                            <span className="text-sm text-muted-foreground">Economia</span>
                            <p className="text-lg font-semibold text-green-600">
                              {formatCurrency(proposta.desconto_valor)}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Datas e Responsáveis */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Datas
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Emissão:</span>
                          <span>{formatDate(proposta?.data_emissao)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Validade:</span>
                          <span>{formatDate(proposta?.data_validade)}</span>
                        </div>
                        {proposta?.data_aceite && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Aceite:</span>
                            <span>{formatDate(proposta.data_aceite)}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Responsáveis</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-2 text-sm">
                        {proposta?.corretor && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Corretor:</span>
                            <span>{proposta.corretor.nome_completo}</span>
                          </div>
                        )}
                        {proposta?.imobiliaria && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Imobiliária:</span>
                            <span>{proposta.imobiliaria.nome}</span>
                          </div>
                        )}
                        {proposta?.gestor && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Gestor:</span>
                            <span>{proposta.gestor.full_name}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Observações */}
                  {proposta?.observacoes && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Observações</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-sm whitespace-pre-wrap">{proposta.observacoes}</p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Motivo Recusa */}
                  {proposta?.motivo_recusa && (
                    <Card className="border-destructive/50 bg-destructive/5">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-destructive">Motivo da Recusa</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-sm whitespace-pre-wrap">{proposta.motivo_recusa}</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="condicoes" className="m-0">
                  {proposta && (
                    <PropostaCondicoesEditor
                      propostaId={proposta.id}
                      valorReferencia={proposta.valor_proposta || proposta.valor_tabela || 0}
                      readonly={isReadonly}
                      onValidationChange={handleValidationChange}
                    />
                  )}
                </TabsContent>
              </div>
            </Tabs>
          )}

          {!showRecusaForm && (
            <DialogFooter className="flex-wrap gap-2 mt-4">
              {/* Excluir - apenas rascunho */}
              {isRascunho && (
                <Button variant="destructive" onClick={handleExcluir} disabled={isLoading} className="mr-auto">
                  {deleteProposta.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </Button>
              )}
              
              <Button variant="outline" onClick={handleClose}>
                Fechar
              </Button>

              {/* Editar - apenas rascunho ou enviada */}
              {(isRascunho || isEnviada) && onEdit && (
                <Button variant="outline" onClick={onEdit} disabled={isLoading}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              )}

              {/* Enviar - apenas rascunho */}
              {isRascunho && (
                <Button onClick={handleEnviar} disabled={isLoading}>
                  {enviarProposta.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  <Send className="h-4 w-4 mr-2" />
                  Enviar ao Cliente
                </Button>
              )}

              {/* Aceitar/Recusar - rascunho ou enviada */}
              {(isRascunho || isEnviada) && (
                <>
                  <Button variant="outline" onClick={() => setShowRecusaForm(true)} disabled={isLoading}>
                    <X className="h-4 w-4 mr-2" />
                    Recusar
                  </Button>
                  <Button onClick={handleAceitar} disabled={isLoading}>
                    {aceitarProposta.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    <Check className="h-4 w-4 mr-2" />
                    Aceitar
                  </Button>
                </>
              )}

              {/* Converter em Negociação - apenas aceita */}
              {isAceita && (
                <Button onClick={() => setConverterDialogOpen(true)} disabled={isLoading}>
                  <Handshake className="h-4 w-4 mr-2" />
                  Converter em Negociação
                </Button>
              )}
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de conversão */}
      <ConverterPropostaDialog
        open={converterDialogOpen}
        onOpenChange={setConverterDialogOpen}
        proposta={proposta}
      />
    </>
  );
}
