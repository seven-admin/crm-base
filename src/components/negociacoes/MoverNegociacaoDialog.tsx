import { useState, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Negociacao } from '@/types/negociacoes.types';
import { FunilEtapa } from '@/types/funis.types';
import { useMoverNegociacao } from '@/hooks/useNegociacoes';

export interface ContratoSolicitadoData {
  cliente_id: string;
  empreendimento_id: string;
  corretor_id?: string;
  imobiliaria_id?: string;
  unidade_ids: string[];
  valor_contrato?: number;
}

interface MoverNegociacaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  negociacao: Negociacao | null;
  targetEtapa?: FunilEtapa;
  etapas: FunilEtapa[];
  onContratoSolicitado?: (data: ContratoSolicitadoData) => void;
}

export function MoverNegociacaoDialog({
  open,
  onOpenChange,
  negociacao,
  targetEtapa,
  etapas,
  onContratoSolicitado
}: MoverNegociacaoDialogProps) {
  const [etapaNovaId, setEtapaNovaId] = useState<string>('');
  const [observacao, setObservacao] = useState('');
  const [motivoPerda, setMotivoPerda] = useState('');
  const [dataFechamento, setDataFechamento] = useState(new Date().toISOString().split('T')[0]);
  const [criarContrato, setCriarContrato] = useState(false);

  const moverMutation = useMoverNegociacao();

  // Get the selected stage details
  const selectedEtapa = etapas.find(e => e.id === etapaNovaId);
  const currentEtapa = negociacao?.funil_etapa || etapas.find(e => e.id === negociacao?.funil_etapa_id);

  useEffect(() => {
    if (open && targetEtapa) {
      setEtapaNovaId(targetEtapa.id);
    }
  }, [open, targetEtapa]);

  const handleOpen = (isOpen: boolean) => {
    if (!isOpen) {
      setEtapaNovaId('');
      setObservacao('');
      setMotivoPerda('');
      setDataFechamento(new Date().toISOString().split('T')[0]);
      setCriarContrato(false);
    }
    onOpenChange(isOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!negociacao || !etapaNovaId) return;

    const etapaDestino = etapas.find(e => e.id === etapaNovaId);

    await moverMutation.mutateAsync({
      id: negociacao.id,
      etapa_anterior_id: negociacao.funil_etapa_id,
      targetEtapa: etapaDestino ? {
        is_final_sucesso: etapaDestino.is_final_sucesso,
        is_final_perda: etapaDestino.is_final_perda
      } : undefined,
      data: {
        funil_etapa_id: etapaNovaId,
        observacao,
        motivo_perda: selectedEtapa?.is_final_perda ? motivoPerda : undefined,
        data_fechamento: selectedEtapa?.is_final_sucesso ? dataFechamento : undefined
      }
    });

    // If user requested contract creation
    if (criarContrato && selectedEtapa?.is_final_sucesso && onContratoSolicitado) {
      onContratoSolicitado({
        cliente_id: negociacao.cliente_id!,
        empreendimento_id: negociacao.empreendimento_id!,
        corretor_id: negociacao.corretor_id || undefined,
        imobiliaria_id: negociacao.imobiliaria_id || undefined,
        unidade_ids: negociacao.unidades?.map(u => u.unidade_id) || [],
        valor_contrato: negociacao.valor_negociacao || undefined
      });
    }

    handleOpen(false);
  };

  const etapasDisponiveis = etapas.filter(e => e.id !== negociacao?.funil_etapa_id);

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mover Negociação</DialogTitle>
          <DialogDescription>
            {negociacao?.codigo} - {negociacao?.cliente?.nome}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>De: <span className="font-medium">{currentEtapa?.nome || 'N/A'}</span></Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="etapa_nova">Mover para *</Label>
            <Select value={etapaNovaId} onValueChange={setEtapaNovaId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a etapa" />
              </SelectTrigger>
              <SelectContent>
                {etapasDisponiveis.map((etapa) => (
                  <SelectItem key={etapa.id} value={etapa.id}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: etapa.cor }}
                      />
                      {etapa.nome}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacao">Observação *</Label>
            <Textarea
              id="observacao"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Descreva o motivo da movimentação..."
              required
            />
          </div>

          {selectedEtapa?.is_final_perda && (
            <div className="space-y-2">
              <Label htmlFor="motivo_perda">Motivo da Perda *</Label>
              <Textarea
                id="motivo_perda"
                value={motivoPerda}
                onChange={(e) => setMotivoPerda(e.target.value)}
                placeholder="Por que a negociação foi perdida?"
                required
              />
            </div>
          )}

          {selectedEtapa?.is_final_sucesso && (
            <>
              <div className="space-y-2">
                <Label htmlFor="data_fechamento">Data do Fechamento</Label>
                <Input
                  id="data_fechamento"
                  type="date"
                  value={dataFechamento}
                  onChange={(e) => setDataFechamento(e.target.value)}
                />
              </div>
              
              <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
                <Checkbox
                  id="criar_contrato"
                  checked={criarContrato}
                  onCheckedChange={(checked) => setCriarContrato(checked === true)}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor="criar_contrato"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Criar contrato automaticamente
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Um contrato será criado com os dados desta negociação
                  </p>
                </div>
              </div>
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpen(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={!etapaNovaId || !observacao || moverMutation.isPending}
            >
              {moverMutation.isPending ? 'Movendo...' : 'Mover'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}