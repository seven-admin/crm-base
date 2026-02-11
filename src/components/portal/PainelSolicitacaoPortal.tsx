import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { X, Send, Loader2, ShoppingCart, User, Phone, Mail } from 'lucide-react';
import { useCriarSolicitacao } from '@/hooks/useSolicitacoes';
import { useEtapasPadraoAtivas } from '@/hooks/useFunis';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface UnidadeSimples {
  id: string;
  numero: string;
  valor: number | null;
  bloco?: { nome: string } | null;
}

interface PainelSolicitacaoPortalProps {
  empreendimentoId: string;
  unidades: UnidadeSimples[];
  onRemover: (id: string) => void;
  onLimpar: () => void;
  onSuccess?: () => void;
}

export function PainelSolicitacaoPortal({ 
  empreendimentoId,
  unidades, 
  onRemover, 
  onLimpar,
  onSuccess
}: PainelSolicitacaoPortalProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [clienteNome, setClienteNome] = useState('');
  const [clienteEmail, setClienteEmail] = useState('');
  const [clienteTelefone, setClienteTelefone] = useState('');
  const [observacoes, setObservacoes] = useState('');

  const { user, profile } = useAuth();
  const criarSolicitacao = useCriarSolicitacao();
  const { data: etapas = [] } = useEtapasPadraoAtivas();

  const valorTotal = unidades.reduce((sum, u) => sum + (u.valor || 0), 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0
    }).format(value);
  };

  const handleEnviar = async () => {
    if (!clienteNome.trim()) {
      return;
    }

    // Get initial stage
    const etapaInicial = etapas.find(e => e.is_inicial) || etapas[0];
    if (!etapaInicial) {
      return;
    }

    try {
      await criarSolicitacao.mutateAsync({
        empreendimentoId,
        clienteNome,
        clienteEmail: clienteEmail || undefined,
        clienteTelefone: clienteTelefone || undefined,
        unidadeIds: unidades.map(u => u.id),
        funilEtapaId: etapaInicial.id,
        observacoes: observacoes || undefined,
      });

      setDialogOpen(false);
      setClienteNome('');
      setClienteEmail('');
      setClienteTelefone('');
      setObservacoes('');
      onLimpar();
      onSuccess?.();
    } catch {
      // Error handled by mutation
    }
  };

  if (unidades.length === 0) {
    return null;
  }

  return (
    <>
      {/* Floating Panel */}
      <Card className="fixed bottom-4 right-4 z-50 w-80 shadow-2xl border-primary/20 animate-in slide-in-from-bottom-4">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <ShoppingCart className="h-4 w-4" />
            Solicitação de Reserva
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Selected units */}
          <div className="max-h-32 overflow-y-auto space-y-1">
            {unidades.map(unidade => (
              <div 
                key={unidade.id} 
                className="flex items-center justify-between text-sm bg-muted/50 rounded px-2 py-1"
              >
                <span className="font-medium">
                  {unidade.bloco?.nome ? `${unidade.bloco.nome} - ` : ''}
                  {unidade.numero}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">
                    {formatCurrency(unidade.valor || 0)}
                  </span>
                  <button 
                    onClick={() => onRemover(unidade.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="flex items-center justify-between border-t pt-2">
            <span className="text-sm text-muted-foreground">
              {unidades.length} unidade(s)
            </span>
            <Badge variant="secondary" className="font-semibold">
              {formatCurrency(valorTotal)}
            </Badge>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={onLimpar}
            >
              Limpar
            </Button>
            <Button 
              size="sm" 
              className="flex-1"
              onClick={() => setDialogOpen(true)}
            >
              <Send className="h-4 w-4 mr-1" />
              Enviar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Solicitar Reserva</DialogTitle>
            <DialogDescription>
              Preencha os dados do cliente para enviar a solicitação. 
              Um gestor irá analisar e aprovar ou rejeitar.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Units summary */}
            <div className="bg-muted/50 rounded-lg p-3 space-y-2">
              <p className="text-sm font-medium">Unidades selecionadas:</p>
              <div className="flex flex-wrap gap-1">
                {unidades.map(u => (
                  <Badge key={u.id} variant="secondary" className="text-xs">
                    {u.bloco?.nome && `${u.bloco.nome} - `}{u.numero}
                  </Badge>
                ))}
              </div>
              <p className="text-sm font-semibold text-right">
                Total: {formatCurrency(valorTotal)}
              </p>
            </div>

            {/* Cliente info */}
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="clienteNome" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Nome do Cliente *
                </Label>
                <Input
                  id="clienteNome"
                  value={clienteNome}
                  onChange={(e) => setClienteNome(e.target.value)}
                  placeholder="Nome completo do cliente"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clienteTelefone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Telefone
                </Label>
                <Input
                  id="clienteTelefone"
                  value={clienteTelefone}
                  onChange={(e) => setClienteTelefone(e.target.value)}
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clienteEmail" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  E-mail
                </Label>
                <Input
                  id="clienteEmail"
                  type="email"
                  value={clienteEmail}
                  onChange={(e) => setClienteEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Informações adicionais..."
                  rows={2}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleEnviar}
                disabled={!clienteNome.trim() || criarSolicitacao.isPending}
              >
                {criarSolicitacao.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Enviar Solicitação
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
