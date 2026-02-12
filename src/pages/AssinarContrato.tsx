import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CheckCircle2, 
  FileText, 
  User, 
  Building2, 
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useSignatarioByToken, useUpdateSignatarioStatus } from '@/hooks/useContratoSignatarios';
import { SIGNATARIO_TIPO_LABELS, SIGNATARIO_STATUS_LABELS } from '@/types/assinaturas.types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import logo from '@/assets/logo.png';

export default function AssinarContrato() {
  const { token } = useParams<{ token: string }>();
  const [aceito, setAceito] = useState(false);
  const [assinado, setAssinado] = useState(false);

  const { data: signatario, isLoading, error } = useSignatarioByToken(token);
  const updateStatus = useUpdateSignatarioStatus();

  // Mark as visualized when page loads
  useEffect(() => {
    if (signatario && signatario.status === 'enviado') {
      updateStatus.mutate({
        id: signatario.id,
        contratoId: signatario.contrato_id,
        status: 'visualizado'
      });
    }
  }, [signatario?.id]);

  const handleAssinar = async () => {
    if (!signatario || !aceito) return;

    try {
      await updateStatus.mutateAsync({
        id: signatario.id,
        contratoId: signatario.contrato_id,
        status: 'assinado',
        extras: {
          ip_assinatura: 'captured-by-server',
          user_agent: navigator.userAgent
        }
      });
      setAssinado(true);
      toast.success('Contrato assinado com sucesso!');
    } catch (error) {
      toast.error('Erro ao assinar contrato');
    }
  };

  const handleRecusar = async () => {
    if (!signatario) return;

    const motivo = window.prompt('Por favor, informe o motivo da recusa:');
    if (!motivo) return;

    try {
      await updateStatus.mutateAsync({
        id: signatario.id,
        contratoId: signatario.contrato_id,
        status: 'recusado',
        extras: { motivo_recusa: motivo }
      });
      toast.info('Assinatura recusada');
    } catch (error) {
      toast.error('Erro ao recusar assinatura');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !signatario) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h2 className="text-xl font-semibold mb-2">Link inválido</h2>
            <p className="text-muted-foreground">
              Este link de assinatura é inválido ou já foi utilizado.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const contrato = signatario.contrato as any;
  const jaAssinado = signatario.status === 'assinado' || assinado;
  const recusado = signatario.status === 'recusado';

  if (recusado) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-amber-500" />
            <h2 className="text-xl font-semibold mb-2">Assinatura Recusada</h2>
            <p className="text-muted-foreground">
              Você recusou a assinatura deste contrato.
            </p>
            {signatario.motivo_recusa && (
              <p className="mt-4 text-sm italic">
                Motivo: {signatario.motivo_recusa}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (jaAssinado) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-emerald-500" />
            <h2 className="text-xl font-semibold mb-2">Contrato Assinado!</h2>
            <p className="text-muted-foreground">
              Sua assinatura foi registrada com sucesso.
            </p>
            {signatario.data_assinatura && (
              <p className="mt-4 text-sm text-muted-foreground">
                Assinado em: {format(new Date(signatario.data_assinatura), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <img src={logo} alt="Logo" className="h-10 opacity-90" />
          <Badge variant="secondary">Assinatura Digital</Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Info cards */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Signatário
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{signatario.nome}</p>
                <p className="text-sm text-muted-foreground">
                  {SIGNATARIO_TIPO_LABELS[signatario.tipo]}
                </p>
                {signatario.cpf && (
                  <p className="text-sm text-muted-foreground">CPF: {signatario.cpf}</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Contrato
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{contrato?.numero}</p>
                <p className="text-sm text-muted-foreground">
                  {contrato?.empreendimento?.nome}
                </p>
                {contrato?.valor_contrato && (
                  <p className="text-sm text-muted-foreground">
                    Valor: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(contrato.valor_contrato)}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Contract content */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Conteúdo do Contrato
              </CardTitle>
              <CardDescription>
                Leia atentamente antes de assinar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] border rounded-lg p-4">
                {contrato?.conteudo_html ? (
                  <div 
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: contrato.conteudo_html }}
                  />
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Conteúdo do contrato não disponível
                  </p>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Signature area */}
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="flex items-start gap-3">
                <Checkbox 
                  id="aceito" 
                  checked={aceito} 
                  onCheckedChange={(checked) => setAceito(checked as boolean)}
                />
                <Label htmlFor="aceito" className="text-sm leading-relaxed cursor-pointer">
                  Declaro que li e concordo com todos os termos e condições deste contrato. 
                  Estou ciente de que esta assinatura digital tem validade jurídica conforme 
                  previsto na legislação brasileira.
                </Label>
              </div>

              <div className="flex gap-4">
                <Button 
                  className="flex-1" 
                  size="lg"
                  onClick={handleAssinar}
                  disabled={!aceito || updateStatus.isPending}
                >
                  {updateStatus.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Assinando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Assinar Contrato
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={handleRecusar}
                  disabled={updateStatus.isPending}
                >
                  Recusar
                </Button>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                Ao assinar, serão registrados: data/hora, endereço IP e informações do navegador.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
