import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { X, Send, Loader2, ShoppingCart, User, Phone, Mail } from 'lucide-react';
import { Unidade } from '@/types/empreendimentos.types';
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

interface PainelSolicitacaoProps {
  empreendimentoId: string;
  unidades: Unidade[];
  onRemover: (id: string) => void;
  onLimpar: () => void;
  onSuccess?: () => void;
}

export function PainelSolicitacao({ 
  empreendimentoId,
  unidades, 
  onRemover, 
  onLimpar,
  onSuccess
}: PainelSolicitacaoProps) {
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
        // corretorId and imobiliariaId would come from user context if they are corretor
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
            <DialogTitle>Enviar Solicitação de Reserva</DialogTitle>
            <DialogDescription>
              Preencha os dados do cliente para solicitar a reserva de {unidades.length} unidade(s).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Summary */}
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="text-sm text-muted-foreground mb-2">Unidades selecionadas:</div>
              <div className="flex flex-wrap gap-1">
                {unidades.map(u => (
                  <Badge key={u.id} variant="outline" className="text-xs">
                    {u.bloco?.nome ? `${u.bloco.nome}-` : ''}{u.numero}
                  </Badge>
                ))}
              </div>
              <div className="text-right mt-2 font-semibold">
                Total: {formatCurrency(valorTotal)}
              </div>
            </div>

            {/* Client form */}
            <div className="space-y-3">
              <div>
                <Label htmlFor="clienteNome" className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Nome do Cliente *
                </Label>
                <Input
                  id="clienteNome"
                  value={clienteNome}
                  onChange={(e) => setClienteNome(e.target.value)}
                  placeholder="Nome completo"
                />
              </div>

              <div>
                <Label htmlFor="clienteEmail" className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
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

              <div>
                <Label htmlFor="clienteTelefone" className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  Telefone
                </Label>
                <Input
                  id="clienteTelefone"
                  value={clienteTelefone}
                  onChange={(e) => setClienteTelefone(e.target.value)}
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div>
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
            <div className="flex gap-2 pt-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                className="flex-1"
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
