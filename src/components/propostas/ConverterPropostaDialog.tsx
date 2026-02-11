import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, ArrowRight, FileText, Handshake } from 'lucide-react';
import { useEtapasPadraoAtivas } from '@/hooks/useFunis';
import { useConverterPropostaEmNegociacao } from '@/hooks/usePropostas';
import { Proposta } from '@/types/propostas.types';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface ConverterPropostaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proposta: Proposta | null;
}

export function ConverterPropostaDialog({
  open,
  onOpenChange,
  proposta,
}: ConverterPropostaDialogProps) {
  const navigate = useNavigate();
  const [etapaId, setEtapaId] = useState<string>('');
  
  const { data: etapas = [] } = useEtapasPadraoAtivas();
  const converterMutation = useConverterPropostaEmNegociacao();

  const etapasDisponiveis = etapas.filter(e => !e.is_final_sucesso && !e.is_final_perda);
  const etapaInicial = etapas.find(e => e.is_inicial) || etapas[0];

  const handleConverter = async () => {
    if (!proposta) return;

    try {
      await converterMutation.mutateAsync({
        propostaId: proposta.id,
        etapaInicialId: etapaId || etapaInicial?.id,
      });
      
      toast.success('Proposta convertida em negociação com sucesso!');
      onOpenChange(false);
      navigate('/negociacoes');
    } catch (error) {
      console.error('Erro ao converter proposta:', error);
    }
  };

  const formatCurrency = (value?: number | null) => {
    if (!value) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Handshake className="h-5 w-5 text-primary" />
            Converter em Negociação
          </AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação criará uma nova negociação com os dados da proposta.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {proposta && (
          <div className="space-y-4 py-4">
            {/* Resumo da proposta */}
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Proposta {proposta.numero}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>Cliente: {proposta.cliente?.nome}</p>
                <p>Empreendimento: {proposta.empreendimento?.nome}</p>
                <p>Valor: {formatCurrency(proposta.valor_proposta)}</p>
              </div>
            </div>

            {/* Fluxo visual */}
            <div className="flex items-center justify-center gap-4 py-2">
              <div className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <span className="text-xs text-muted-foreground">Proposta</span>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
              <div className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Handshake className="h-6 w-6 text-green-600" />
                </div>
                <span className="text-xs text-muted-foreground">Negociação</span>
              </div>
            </div>

            {/* Seleção de etapa */}
            <div className="space-y-2">
              <Label htmlFor="etapa">Etapa inicial da negociação</Label>
              <Select value={etapaId} onValueChange={setEtapaId}>
                <SelectTrigger>
                  <SelectValue placeholder={etapaInicial?.nome || 'Selecione a etapa'} />
                </SelectTrigger>
                <SelectContent>
                  {etapasDisponiveis.map((etapa) => (
                    <SelectItem key={etapa.id} value={etapa.id}>
                      {etapa.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Se não selecionada, usará a etapa inicial padrão.
              </p>
            </div>

            {/* O que será copiado */}
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-1">Serão copiados:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Dados do cliente</li>
                <li>Unidades selecionadas</li>
                <li>Valores e descontos</li>
                <li>Condições de pagamento</li>
                <li>Responsáveis (corretor, imobiliária, gestor)</li>
              </ul>
            </div>
          </div>
        )}

        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={converterMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConverter}
            disabled={converterMutation.isPending}
          >
            {converterMutation.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Converter
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
