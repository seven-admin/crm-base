import { useState, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ArrowLeft, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Send,
  Building2,
  Edit,
  FileDown,
  Banknote,
  Users,
  Sparkles,
  Eye,
  Info,
  Package,
  RefreshCw,
  XCircle
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import { useContrato, useContratoVersoes, useContratoDocumentos, useContratoPendencias, useUpdateContratoStatus, useUpdateContrato, substituirVariaveisContrato, useFinalizarContrato } from '@/hooks/useContratos';
import { useContratoSignatarios } from '@/hooks/useContratoSignatarios';
import { ChecklistDocumentos } from './ChecklistDocumentos';
import { PendenciasCard } from './PendenciasCard';
import { HistoricoVersoes } from './HistoricoVersoes';
import { ContratoEditor } from './ContratoEditor';
import { ExportarPdfDialog } from './ExportarPdfDialog';
import { CondicoesPagamentoInlineEditor } from './CondicoesPagamentoInlineEditor';
import { SignatariosManager } from './SignatariosManager';
import { validarContratoCompleto, type PendenciaValidacao } from '@/lib/validarContrato';
import type { ContratoStatus } from '@/types/contratos.types';
import { toast } from 'sonner';

const STATUS_LABELS: Record<ContratoStatus, string> = {
  em_geracao: 'Em Geração',
  enviado_assinatura: 'Enviado p/ Assinatura',
  assinado: 'Assinado',
  enviado_incorporador: 'Enviado ao Incorporador',
  aprovado: 'Aprovado',
  reprovado: 'Reprovado',
  cancelado: 'Cancelado'
};

const STATUS_COLORS: Record<ContratoStatus, string> = {
  em_geracao: 'bg-slate-500',
  enviado_assinatura: 'bg-blue-500',
  assinado: 'bg-green-500',
  enviado_incorporador: 'bg-amber-500',
  aprovado: 'bg-emerald-600',
  reprovado: 'bg-red-500',
  cancelado: 'bg-gray-500'
};

interface ContratoDetalheProps {
  contratoId: string;
  onBack: () => void;
}

const formatCurrency = (value: number | undefined | null) => {
  if (value === undefined || value === null) return '-';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export function ContratoDetalhe({ contratoId, onBack }: ContratoDetalheProps) {
  const { data: contrato, isLoading, refetch } = useContrato(contratoId);
  const { data: versoes = [] } = useContratoVersoes(contratoId);
  const { data: documentos = [] } = useContratoDocumentos(contratoId);
  const { data: pendencias = [] } = useContratoPendencias(contratoId);
  const { data: signatarios = [] } = useContratoSignatarios(contratoId);
  const { mutate: updateStatus } = useUpdateContratoStatus();
  const { mutateAsync: updateContrato } = useUpdateContrato();
  const { mutate: finalizarContrato, isPending: isFinalizando } = useFinalizarContrato();
  
  const [activeTab, setActiveTab] = useState('pagamento');
  const [isEditing, setIsEditing] = useState(false);
  const [exportPdfOpen, setExportPdfOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [pagamentoValido, setPagamentoValido] = useState(true);
  const [diferencaPagamento, setDiferencaPagamento] = useState(0);
  const [reloadTemplateOpen, setReloadTemplateOpen] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  
  const signatariosPendentes = signatarios.filter(s => s.status !== 'assinado').length;

  // Callback estável para evitar loops de render infinito - ANTES dos early returns
  const handlePagamentoValidation = useCallback((isValid: boolean, diferenca: number) => {
    setPagamentoValido(isValid);
    setDiferencaPagamento(diferenca);
  }, []);

  // Validação completa do contrato
  const validacaoContrato = useMemo(() => {
    if (!contrato) return { valido: true, pendencias: [] };
    return validarContratoCompleto(contrato);
  }, [contrato]);

  const errosValidacao = validacaoContrato.pendencias.filter(p => p.tipo === 'erro');
  const avisosValidacao = validacaoContrato.pendencias.filter(p => p.tipo === 'aviso');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!contrato) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Contrato não encontrado</p>
        <Button variant="link" onClick={onBack}>Voltar</Button>
      </div>
    );
  }

  const pendenciasAbertas = pendencias.filter(p => p.status === 'aberta').length;
  const documentosPendentes = documentos.filter(d => d.status === 'pendente' && d.obrigatorio).length;
  
  // Contrato só pode ser enviado para assinatura se não houver pendências, pagamento estiver correto E validação OK
  const podeEnviarAssinatura = pendenciasAbertas === 0 && documentosPendentes === 0 && pagamentoValido && errosValidacao.length === 0;

  const unidades = contrato.unidades?.map(u => u.unidade?.numero).filter(Boolean).join(', ') || '-';
  const blocos = [...new Set(contrato.unidades?.map(u => u.unidade?.bloco?.nome).filter(Boolean))].join(', ');

  // Handler para recarregar template
  const handleReloadTemplate = async () => {
    if (!contrato?.template?.conteudo_html) {
      toast.error('Template não encontrado');
      return;
    }
    
    setIsReloading(true);
    try {
      await updateContrato({
        id: contratoId,
        data: { conteudo_html: contrato.template.conteudo_html }
      });
      await refetch();
      toast.success('Conteúdo do contrato atualizado com o template');
      setReloadTemplateOpen(false);
    } catch (error) {
      toast.error('Erro ao recarregar template');
    } finally {
      setIsReloading(false);
    }
  };

  const handleStatusChange = (newStatus: ContratoStatus) => {
    updateStatus({ id: contratoId, status: newStatus });
  };

  const handleFinalizarContrato = () => {
    if (!contrato?.gestor_id) {
      return;
    }
    finalizarContrato({ contratoId, percentualComissao: 5 });
  };

  // Get contract content (with variables replaced)
  const conteudoPreenchido = contrato.conteudo_html 
    ? substituirVariaveisContrato(contrato.conteudo_html, contrato)
    : contrato.template?.conteudo_html 
      ? substituirVariaveisContrato(contrato.template.conteudo_html, contrato)
      : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{contrato.numero}</h1>
            <p className="text-muted-foreground">{contrato.cliente?.nome}</p>
          </div>
          <Badge className={`${STATUS_COLORS[contrato.status]} text-white`}>
            {STATUS_LABELS[contrato.status]}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          {conteudoPreenchido && (
            <>
              <Button variant="outline" onClick={() => setPreviewOpen(true)}>
                <Eye className="mr-2 h-4 w-4" />
                Pré-visualizar
              </Button>
              <Button variant="outline" onClick={() => setExportPdfOpen(true)}>
                <FileDown className="mr-2 h-4 w-4" />
                Exportar PDF
              </Button>
            </>
          )}
          {contrato.status === 'em_geracao' && (
            <>
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Button>
              <Button 
                onClick={() => handleStatusChange('enviado_assinatura')}
                disabled={!podeEnviarAssinatura}
                title={
                  !pagamentoValido 
                    ? `Ajuste as condições de pagamento (diferença: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(diferencaPagamento)})`
                    : !podeEnviarAssinatura 
                      ? 'Resolva todas as pendências e documentos obrigatórios antes de enviar' 
                      : undefined
                }
              >
                <Send className="mr-2 h-4 w-4" />
                Enviar p/ Assinatura
              </Button>
            </>
          )}
          {contrato.status === 'enviado_assinatura' && (
            <Button variant="outline" onClick={() => handleStatusChange('assinado')}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Marcar como Assinado
            </Button>
          )}
          {contrato.status === 'assinado' && (
            <>
              <Button 
                onClick={handleFinalizarContrato}
                disabled={isFinalizando || !contrato.gestor_id}
                title={!contrato.gestor_id ? 'Defina um Gestor do Produto no contrato' : 'Finalizar contrato e gerar comissão'}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {isFinalizando ? 'Finalizando...' : 'Finalizar e Gerar Comissão'}
              </Button>
              <Button variant="outline" onClick={() => handleStatusChange('enviado_incorporador')}>
                <Building2 className="mr-2 h-4 w-4" />
                Enviar ao Incorporador
              </Button>
            </>
          )}
          {contrato.status === 'enviado_incorporador' && (
            <>
              <Button variant="outline" onClick={() => handleStatusChange('reprovado')}>
                Reprovar
              </Button>
              <Button onClick={() => handleStatusChange('aprovado')}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Aprovar
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Alertas */}
      {(pendenciasAbertas > 0 || documentosPendentes > 0 || !pagamentoValido || errosValidacao.length > 0) && (
        <div className="flex flex-wrap gap-4">
          {/* Erros de validação do contrato */}
          {errosValidacao.length > 0 && (
            <div className="w-full">
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Dados obrigatórios pendentes</AlertTitle>
                <AlertDescription>
                  <ul className="mt-2 list-disc list-inside space-y-1">
                    {errosValidacao.map((p, i) => (
                      <li key={i}>{p.mensagem}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            </div>
          )}
          {/* Avisos de validação */}
          {avisosValidacao.length > 0 && errosValidacao.length === 0 && (
            <div className="w-full">
              <Alert className="bg-amber-50 border-amber-200">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-800">Dados recomendados</AlertTitle>
                <AlertDescription className="text-amber-700">
                  <ul className="mt-2 list-disc list-inside space-y-1">
                    {avisosValidacao.slice(0, 3).map((p, i) => (
                      <li key={i}>{p.mensagem}</li>
                    ))}
                    {avisosValidacao.length > 3 && (
                      <li className="text-muted-foreground">E mais {avisosValidacao.length - 3} item(s)...</li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            </div>
          )}
          {!pagamentoValido && (
            <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-red-800">
              <AlertTriangle className="h-4 w-4" />
              <span>Condições de pagamento com diferença de {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(diferencaPagamento)}</span>
            </div>
          )}
          {pendenciasAbertas > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
              <AlertTriangle className="h-4 w-4" />
              <span>{pendenciasAbertas} pendência(s) aberta(s)</span>
            </div>
          )}
          {documentosPendentes > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-red-800">
              <AlertTriangle className="h-4 w-4" />
              <span>{documentosPendentes} documento(s) obrigatório(s) pendente(s)</span>
            </div>
          )}
        </div>
      )}

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Empreendimento</p>
            <p className="font-medium">{contrato.empreendimento?.nome}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Unidade(s)</p>
            <p className="font-medium">{blocos ? `${blocos} - ` : ''}{unidades}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Valor</p>
            <p className="font-medium">{formatCurrency(contrato.valor_contrato)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Versão</p>
            <p className="font-medium">v{contrato.versao}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs - Nova ordem: Pagamento, Contrato, Documentos, Pendências, Signatários, Histórico */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pagamento">
            <Banknote className="mr-2 h-4 w-4" />
            Pagamento
          </TabsTrigger>
          <TabsTrigger value="conteudo">
            <FileText className="mr-2 h-4 w-4" />
            Contrato
          </TabsTrigger>
          <TabsTrigger value="documentos">
            Documentos
            {documentosPendentes > 0 && (
              <Badge variant="destructive" className="ml-2">{documentosPendentes}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="pendencias">
            Pendências
            {pendenciasAbertas > 0 && (
              <Badge variant="secondary" className="ml-2">{pendenciasAbertas}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="signatarios">
            <Users className="mr-2 h-4 w-4" />
            Signatários
            {signatariosPendentes > 0 && (
              <Badge variant="secondary" className="ml-2">{signatariosPendentes}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="historico">
            <Clock className="mr-2 h-4 w-4" />
            Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pagamento" className="mt-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              {/* Indicador de modalidade */}
              {contrato.modalidade_id && (
                <Alert className="bg-blue-50 border-blue-200">
                  <Package className="h-4 w-4 text-blue-600" />
                  <AlertTitle className="text-blue-800">Condições geradas automaticamente</AlertTitle>
                  <AlertDescription className="text-blue-700">
                    Este contrato foi criado com base em uma modalidade de pagamento configurada.
                    As condições abaixo foram copiadas automaticamente.
                  </AlertDescription>
                </Alert>
              )}
              
              <CondicoesPagamentoInlineEditor 
                contratoId={contratoId} 
                valorReferencia={contrato.valor_contrato || undefined}
                readonly={contrato.status !== 'em_geracao'}
                onValidationChange={handlePagamentoValidation}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conteudo" className="mt-4">
          {isEditing ? (
            <ContratoEditor 
              contrato={contrato} 
              onClose={() => setIsEditing(false)} 
            />
          ) : conteudoPreenchido ? (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Conteúdo do Contrato</CardTitle>
                  {contrato.status === 'em_geracao' && contrato.template_id && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setReloadTemplateOpen(true)}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Recarregar do Template
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <div 
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: conteudoPreenchido }}
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum conteúdo de contrato definido</p>
                {contrato.status === 'em_geracao' && (
                  <Button variant="link" onClick={() => setIsEditing(true)}>
                    Adicionar conteúdo
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="documentos" className="mt-4">
          <ChecklistDocumentos contratoId={contratoId} documentos={documentos} />
        </TabsContent>

        <TabsContent value="pendencias" className="mt-4">
          <PendenciasCard contratoId={contratoId} pendencias={pendencias} />
        </TabsContent>

        <TabsContent value="signatarios" className="mt-4">
          <SignatariosManager 
            contratoId={contratoId}
            contratoNumero={contrato.numero}
            empreendimentoNome={contrato.empreendimento?.nome}
            clienteNome={contrato.cliente?.nome}
            clienteEmail={contrato.cliente?.email || undefined}
            clienteCpf={contrato.cliente?.cpf || undefined}
            readOnly={contrato.status === 'cancelado'}
          />
        </TabsContent>

        <TabsContent value="historico" className="mt-4">
          <HistoricoVersoes versoes={versoes} />
        </TabsContent>
      </Tabs>

      {/* Timeline de datas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-xs text-muted-foreground">Geração</p>
              <p className="font-medium">
                {format(new Date(contrato.data_geracao), 'dd/MM/yyyy', { locale: ptBR })}
              </p>
            </div>
            {contrato.data_envio_assinatura && (
              <div>
                <p className="text-xs text-muted-foreground">Envio Assinatura</p>
                <p className="font-medium">
                  {format(new Date(contrato.data_envio_assinatura), 'dd/MM/yyyy', { locale: ptBR })}
                </p>
              </div>
            )}
            {contrato.data_assinatura && (
              <div>
                <p className="text-xs text-muted-foreground">Assinatura</p>
                <p className="font-medium">
                  {format(new Date(contrato.data_assinatura), 'dd/MM/yyyy', { locale: ptBR })}
                </p>
              </div>
            )}
            {contrato.data_envio_incorporador && (
              <div>
                <p className="text-xs text-muted-foreground">Envio Incorporador</p>
                <p className="font-medium">
                  {format(new Date(contrato.data_envio_incorporador), 'dd/MM/yyyy', { locale: ptBR })}
                </p>
              </div>
            )}
            {contrato.data_aprovacao && (
              <div>
                <p className="text-xs text-muted-foreground">Aprovação</p>
                <p className="font-medium">
                  {format(new Date(contrato.data_aprovacao), 'dd/MM/yyyy', { locale: ptBR })}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Pré-visualização */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Pré-visualização do Contrato</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[70vh]">
            <div className="p-6 bg-white rounded-lg border">
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: conteudoPreenchido || '' }}
              />
              {signatarios.length > 0 && (
                <div className="mt-8 pt-6 border-t">
                  <h3 className="text-lg font-semibold mb-4">Signatários</h3>
                  <div className="grid grid-cols-2 gap-6">
                    {signatarios.map((s) => (
                      <div key={s.id} className="border-t pt-4">
                        <p className="font-medium">{s.nome}</p>
                        {s.cpf && <p className="text-sm text-muted-foreground">CPF: {s.cpf}</p>}
                        <p className="text-sm text-muted-foreground">
                          Status: {s.status === 'assinado' ? 'Assinado' : 'Pendente'}
                        </p>
                        {s.data_assinatura && (
                          <p className="text-xs text-muted-foreground">
                            Assinado em: {format(new Date(s.data_assinatura), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Dialog de Exportar PDF */}
      <ExportarPdfDialog
        open={exportPdfOpen}
        onOpenChange={setExportPdfOpen}
        conteudoHtml={conteudoPreenchido || ''}
        nomeArquivo={`${contrato.numero}_${contrato.cliente?.nome?.replace(/\s+/g, '_') || 'contrato'}`}
        signatarios={signatarios.map(s => ({
          nome: s.nome,
          cpf: s.cpf || undefined,
          data_assinatura: s.data_assinatura || undefined,
          ip_assinatura: s.ip_assinatura || undefined,
        }))}
      />

      {/* Dialog de Recarregar Template */}
      <AlertDialog open={reloadTemplateOpen} onOpenChange={setReloadTemplateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Recarregar conteúdo do template?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá substituir todo o conteúdo atual do contrato pelo conteúdo do template original.
              Todas as edições manuais serão perdidas. Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isReloading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleReloadTemplate}
              disabled={isReloading}
            >
              {isReloading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Recarregando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sim, recarregar
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
