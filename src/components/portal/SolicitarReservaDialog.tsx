import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send } from 'lucide-react';
import { useCriarSolicitacao } from '@/hooks/useSolicitacoes';
import { useEtapasPadraoAtivas } from '@/hooks/useFunis';
import { useMeuCorretor } from '@/hooks/useMeuCorretor';
import { formatarMoeda } from '@/lib/formatters';
import { toast } from 'sonner';
import { ordenarUnidadesPorBlocoENumero } from '@/lib/unidadeUtils';

interface UnidadeSimples {
  id: string;
  numero: string;
  valor: number;
  bloco?: { nome: string } | null;
}

interface SolicitarReservaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empreendimentoId: string;
  unidades: UnidadeSimples[];
  onSuccess?: () => void;
}

export function SolicitarReservaDialog({
  open,
  onOpenChange,
  empreendimentoId,
  unidades,
  onSuccess
}: SolicitarReservaDialogProps) {
  const { data: meuCorretor } = useMeuCorretor();
  const { mutate: criarSolicitacao, isPending } = useCriarSolicitacao();
  const { data: etapasPadrao } = useEtapasPadraoAtivas();

  const [clienteNome, setClienteNome] = useState('');
  const [clienteTelefone, setClienteTelefone] = useState('');
  const [clienteEmail, setClienteEmail] = useState('');
  const [observacoes, setObservacoes] = useState('');

  const valorTotal = unidades.reduce((sum, u) => sum + (u.valor || 0), 0);
  
  // Ordenar unidades por bloco e número
  const unidadesOrdenadas = useMemo(() => ordenarUnidadesPorBlocoENumero(unidades), [unidades]);

  const resetForm = () => {
    setClienteNome('');
    setClienteTelefone('');
    setClienteEmail('');
    setObservacoes('');
  };

  const handleEnviar = () => {
    if (!clienteNome.trim()) {
      toast.error('Nome do cliente é obrigatório');
      return;
    }

    const etapaInicial = etapasPadrao?.find(e => e.ordem === 1) || etapasPadrao?.[0];
    
    if (!etapaInicial?.id) {
      toast.error('Não foi possível encontrar uma etapa inicial do funil');
      return;
    }

    criarSolicitacao({
      empreendimentoId,
      corretorId: meuCorretor?.id,
      imobiliariaId: meuCorretor?.imobiliaria_id || undefined,
      unidadeIds: unidades.map(u => u.id),
      clienteNome: clienteNome.trim(),
      clienteTelefone: clienteTelefone.trim() || undefined,
      clienteEmail: clienteEmail.trim() || undefined,
      funilEtapaId: etapaInicial.id,
      observacoes: observacoes.trim() || undefined,
    }, {
      onSuccess: () => {
        resetForm();
        onOpenChange(false);
        onSuccess?.();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Solicitar Reserva</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Resumo das unidades */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <p className="text-sm font-medium">Unidades Selecionadas:</p>
            <div className="space-y-1">
              {unidadesOrdenadas.map((unidade) => (
                <div key={unidade.id} className="flex justify-between text-sm">
                  <span>
                    {unidade.bloco?.nome && `${unidade.bloco.nome} - `}
                    Unidade {unidade.numero}
                  </span>
                  <span className="font-medium">{formatarMoeda(unidade.valor)}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-2 flex justify-between font-semibold">
              <span>Total</span>
              <span>{formatarMoeda(valorTotal)}</span>
            </div>
          </div>

          {/* Formulário do cliente */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="clienteNome">Nome do Cliente *</Label>
              <Input
                id="clienteNome"
                placeholder="Nome completo"
                value={clienteNome}
                onChange={(e) => setClienteNome(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="clienteTelefone">Telefone</Label>
              <Input
                id="clienteTelefone"
                placeholder="(00) 00000-0000"
                value={clienteTelefone}
                onChange={(e) => setClienteTelefone(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="clienteEmail">E-mail</Label>
              <Input
                id="clienteEmail"
                type="email"
                placeholder="email@exemplo.com"
                value={clienteEmail}
                onChange={(e) => setClienteEmail(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                placeholder="Informações adicionais sobre a reserva..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={handleEnviar} disabled={isPending || !clienteNome.trim()}>
            {isPending ? (
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
