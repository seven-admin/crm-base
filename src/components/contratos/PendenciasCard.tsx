import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Check, AlertTriangle, Clock } from 'lucide-react';
import { useCreateContratoPendencia, useUpdateContratoPendencia } from '@/hooks/useContratos';
import type { ContratoPendencia, PendenciaStatus } from '@/types/contratos.types';

const STATUS_COLORS: Record<PendenciaStatus, string> = {
  aberta: 'bg-amber-500',
  resolvida: 'bg-green-500',
  cancelada: 'bg-gray-500',
};

const STATUS_LABELS: Record<PendenciaStatus, string> = {
  aberta: 'Aberta',
  resolvida: 'Resolvida',
  cancelada: 'Cancelada',
};

interface PendenciasCardProps {
  contratoId: string;
  pendencias: ContratoPendencia[];
}

export function PendenciasCard({ contratoId, pendencias }: PendenciasCardProps) {
  const [isAddingPendencia, setIsAddingPendencia] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolucaoText, setResolucaoText] = useState('');
  const [newPendencia, setNewPendencia] = useState({
    descricao: '',
    prazo: '',
  });

  const { mutate: createPendencia } = useCreateContratoPendencia();
  const { mutate: updatePendencia } = useUpdateContratoPendencia();

  const handleAddPendencia = () => {
    if (!newPendencia.descricao) return;

    createPendencia({
      contrato_id: contratoId,
      descricao: newPendencia.descricao,
      prazo: newPendencia.prazo || undefined,
      status: 'aberta',
    }, {
      onSuccess: () => {
        setIsAddingPendencia(false);
        setNewPendencia({ descricao: '', prazo: '' });
      },
    });
  };

  const handleResolver = (pendenciaId: string) => {
    updatePendencia({
      id: pendenciaId,
      data: { 
        status: 'resolvida' as PendenciaStatus, 
        resolucao: resolucaoText || 'Resolvido' 
      },
    }, {
      onSuccess: () => {
        setResolvingId(null);
        setResolucaoText('');
      },
    });
  };

  const handleCancelar = (pendenciaId: string) => {
    updatePendencia({
      id: pendenciaId,
      data: { status: 'cancelada' as PendenciaStatus },
    });
  };

  const abertas = pendencias.filter(p => p.status === 'aberta');
  const resolvidas = pendencias.filter(p => p.status === 'resolvida');
  const canceladas = pendencias.filter(p => p.status === 'cancelada');

  const isOverdue = (prazo: string | undefined) => {
    if (!prazo) return false;
    return new Date(prazo) < new Date();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Pendências</CardTitle>
        <Dialog open={isAddingPendencia} onOpenChange={setIsAddingPendencia}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Nova Pendência
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Pendência</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Descrição *</Label>
                <Textarea
                  value={newPendencia.descricao}
                  onChange={(e) => setNewPendencia(prev => ({ ...prev, descricao: e.target.value }))}
                  placeholder="Descreva a pendência..."
                />
              </div>
              <div className="space-y-2">
                <Label>Prazo</Label>
                <Input
                  type="date"
                  value={newPendencia.prazo}
                  onChange={(e) => setNewPendencia(prev => ({ ...prev, prazo: e.target.value }))}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddingPendencia(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddPendencia} disabled={!newPendencia.descricao}>
                  Criar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Pendências Abertas */}
        {abertas.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Abertas ({abertas.length})
            </h4>
            <div className="space-y-2">
              {abertas.map((pendencia) => (
                <div key={pendencia.id} className="p-3 border rounded-lg space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm">{pendencia.descricao}</p>
                      {pendencia.prazo && (
                        <p className={`text-xs mt-1 flex items-center gap-1 ${isOverdue(pendencia.prazo) ? 'text-red-600' : 'text-muted-foreground'}`}>
                          <Clock className="h-3 w-3" />
                          Prazo: {format(new Date(pendencia.prazo), 'dd/MM/yyyy', { locale: ptBR })}
                          {isOverdue(pendencia.prazo) && ' (Atrasado)'}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-green-600"
                        onClick={() => setResolvingId(pendencia.id)}
                      >
                        <Check className="mr-1 h-3 w-3" />
                        Resolver
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground"
                        onClick={() => handleCancelar(pendencia.id)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                  
                  {resolvingId === pendencia.id && (
                    <div className="pt-2 border-t space-y-2">
                      <Textarea
                        placeholder="Descreva como foi resolvido..."
                        value={resolucaoText}
                        onChange={(e) => setResolucaoText(e.target.value)}
                        rows={2}
                      />
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => setResolvingId(null)}>
                          Cancelar
                        </Button>
                        <Button size="sm" onClick={() => handleResolver(pendencia.id)}>
                          Confirmar Resolução
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pendências Resolvidas */}
        {resolvidas.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2 text-green-600">
              <Check className="h-4 w-4" />
              Resolvidas ({resolvidas.length})
            </h4>
            <div className="space-y-2">
              {resolvidas.map((pendencia) => (
                <div key={pendencia.id} className="p-3 border rounded-lg bg-green-50/50">
                  <p className="text-sm line-through text-muted-foreground">{pendencia.descricao}</p>
                  {pendencia.resolucao && (
                    <p className="text-xs text-green-700 mt-1">✓ {pendencia.resolucao}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {pendencias.length === 0 && (
          <p className="text-center text-muted-foreground py-4">
            Nenhuma pendência registrada
          </p>
        )}
      </CardContent>
    </Card>
  );
}
