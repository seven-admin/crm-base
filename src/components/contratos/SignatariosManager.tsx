import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  User, 
  Mail, 
  Phone, 
  Send, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  Eye, 
  XCircle,
  Trash2,
  Copy,
  ExternalLink
} from 'lucide-react';
import { 
  useContratoSignatarios, 
  useUpdateSignatarioStatus,
  useDeleteSignatario 
} from '@/hooks/useContratoSignatarios';
import { 
  SIGNATARIO_TIPO_LABELS, 
  SIGNATARIO_STATUS_LABELS,
  SIGNATARIO_STATUS_COLORS,
  type ContratoSignatario 
} from '@/types/assinaturas.types';
import { SignatarioForm } from './SignatarioForm';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SignatariosManagerProps {
  contratoId: string;
  contratoNumero?: string;
  empreendimentoNome?: string;
  clienteNome?: string;
  clienteEmail?: string;
  clienteCpf?: string;
  readOnly?: boolean;
}

export function SignatariosManager({ 
  contratoId, 
  contratoNumero,
  empreendimentoNome,
  clienteNome, 
  clienteEmail, 
  clienteCpf,
  readOnly = false 
}: SignatariosManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const { data: signatarios, isLoading } = useContratoSignatarios(contratoId);
  const updateStatus = useUpdateSignatarioStatus();
  const deleteSignatario = useDeleteSignatario();

  // Dispara webhook para n8n com dados do signatário
  const dispararWebhook = async (signatario: ContratoSignatario) => {
    const linkAssinatura = `${window.location.origin}/assinar/${signatario.token_assinatura}`;
    
    try {
      const { data, error } = await supabase.functions.invoke('webhook-assinatura', {
        body: {
          signatario_id: signatario.id,
          contrato_id: contratoId,
          link_assinatura: linkAssinatura,
          signatario_nome: signatario.nome,
          signatario_email: signatario.email,
          signatario_telefone: signatario.telefone,
          signatario_tipo: signatario.tipo,
          contrato_numero: contratoNumero || '',
          cliente_nome: clienteNome || '',
          empreendimento_nome: empreendimentoNome || '',
        },
      });

      if (error) {
        console.error('Erro ao disparar webhook:', error);
      } else {
        console.log('Webhook disparado:', data);
      }
    } catch (error) {
      console.error('Erro ao chamar edge function:', error);
    }
  };

  const handleEnviarConvite = async (signatario: ContratoSignatario) => {
    if (!signatario.email && !signatario.telefone) {
      toast.error('Signatário não possui email nem telefone cadastrado');
      return;
    }
    
    await updateStatus.mutateAsync({
      id: signatario.id,
      contratoId,
      status: 'enviado'
    });
    
    // Dispara webhook para n8n (que pode enviar via WhatsApp, email, etc)
    await dispararWebhook(signatario);
    
    toast.success(`Convite enviado! Link disponível para ${signatario.nome}`);
  };

  const handleMarcarAssinado = async (signatario: ContratoSignatario) => {
    await updateStatus.mutateAsync({
      id: signatario.id,
      contratoId,
      status: 'assinado',
      extras: {
        ip_assinatura: 'manual',
        user_agent: 'Assinatura presencial'
      }
    });
  };

  const handleCopyLink = (signatario: ContratoSignatario) => {
    if (!signatario.token_assinatura) return;
    
    const link = `${window.location.origin}/assinar/${signatario.token_assinatura}`;
    navigator.clipboard.writeText(link);
    toast.success('Link copiado para a área de transferência');
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    await deleteSignatario.mutateAsync({ id: deleteId, contratoId });
    setDeleteId(null);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'assinado':
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'visualizado':
        return <Eye className="h-4 w-4 text-amber-500" />;
      case 'enviado':
        return <Mail className="h-4 w-4 text-blue-500" />;
      case 'recusado':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-slate-500" />;
    }
  };

  if (isLoading) {
    return <div className="animate-pulse h-48 bg-muted rounded-lg" />;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">Signatários</CardTitle>
          <CardDescription>Gerenciar signatários do contrato</CardDescription>
        </div>
        {!readOnly && (
          <Button onClick={() => setShowForm(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {signatarios?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum signatário cadastrado</p>
            {!readOnly && (
              <Button 
                variant="link" 
                onClick={() => setShowForm(true)}
                className="mt-2"
              >
                Adicionar primeiro signatário
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {signatarios?.map((signatario, index) => (
              <div 
                key={signatario.id}
                className="border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-medium text-sm">
                      {signatario.ordem}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{signatario.nome}</span>
                        <Badge variant="outline" className="text-xs">
                          {SIGNATARIO_TIPO_LABELS[signatario.tipo]}
                        </Badge>
                        {signatario.obrigatorio && (
                          <Badge variant="secondary" className="text-xs">
                            Obrigatório
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        {signatario.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {signatario.email}
                          </span>
                        )}
                        {signatario.cpf && (
                          <span>CPF: {signatario.cpf}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge className={`${SIGNATARIO_STATUS_COLORS[signatario.status]} text-white`}>
                      {getStatusIcon(signatario.status)}
                      <span className="ml-1">{SIGNATARIO_STATUS_LABELS[signatario.status]}</span>
                    </Badge>
                  </div>
                </div>

                {/* Status details */}
                {signatario.status !== 'pendente' && (
                  <div className="text-xs text-muted-foreground pl-11 space-y-1">
                    {signatario.data_envio && (
                      <p>Enviado em: {format(new Date(signatario.data_envio), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                    )}
                    {signatario.data_visualizacao && (
                      <p>Visualizado em: {format(new Date(signatario.data_visualizacao), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                    )}
                    {signatario.data_assinatura && (
                      <p>Assinado em: {format(new Date(signatario.data_assinatura), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                    )}
                    {signatario.motivo_recusa && (
                      <p className="text-red-500">Motivo da recusa: {signatario.motivo_recusa}</p>
                    )}
                  </div>
                )}

                {/* Actions */}
                {!readOnly && signatario.status !== 'assinado' && (
                  <div className="flex items-center gap-2 pl-11">
                    {signatario.status === 'pendente' && signatario.email && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleEnviarConvite(signatario)}
                        disabled={updateStatus.isPending}
                      >
                        <Send className="h-3 w-3 mr-1" />
                        Enviar Convite
                      </Button>
                    )}
                    {(signatario.status === 'enviado' || signatario.status === 'visualizado') && (
                      <>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleEnviarConvite(signatario)}
                          disabled={updateStatus.isPending}
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Reenviar
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleCopyLink(signatario)}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copiar Link
                        </Button>
                      </>
                    )}
                    <Button 
                      size="sm" 
                      variant="secondary"
                      onClick={() => handleMarcarAssinado(signatario)}
                      disabled={updateStatus.isPending}
                    >
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Marcar Assinado
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(signatario.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        {signatarios && signatarios.length > 0 && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {signatarios.filter(s => s.status === 'assinado').length} de {signatarios.length} assinaturas coletadas
              </span>
              {signatarios.every(s => s.status === 'assinado') && (
                <Badge className="bg-emerald-500 text-white">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Todas assinaturas coletadas
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>

      {/* Add Form Dialog */}
      <SignatarioForm
        open={showForm}
        onClose={() => setShowForm(false)}
        contratoId={contratoId}
        clienteNome={clienteNome}
        clienteEmail={clienteEmail}
        clienteCpf={clienteCpf}
        nextOrder={(signatarios?.length || 0) + 1}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover signatário?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O signatário será removido do contrato.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
