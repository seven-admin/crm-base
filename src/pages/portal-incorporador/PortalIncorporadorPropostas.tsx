import { useState } from 'react';
import { useNegociacoes, useAprovarPropostaIncorporador, useNegarPropostaIncorporador } from '@/hooks/useNegociacoes';
import { useIncorporadorEmpreendimentos } from '@/hooks/useIncorporadorEmpreendimentos';
import { useNegociacaoComentarios, useAddNegociacaoComentario } from '@/hooks/useNegociacaoComentarios';
import { Negociacao, STATUS_PROPOSTA_LABELS, STATUS_PROPOSTA_COLORS } from '@/types/negociacoes.types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Check, X, FileText, Loader2, Building2, User, DollarSign, AlertCircle, MessageSquare, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function ComentariosSection({ negociacaoId }: { negociacaoId: string }) {
  const { data: comentarios = [], isLoading } = useNegociacaoComentarios(negociacaoId);
  const addComentario = useAddNegociacaoComentario();
  const [texto, setTexto] = useState('');

  const handleSubmit = async () => {
    if (!texto.trim()) return;
    await addComentario.mutateAsync({ negociacaoId, comentario: texto.trim() });
    setTexto('');
  };

  return (
    <div className="mt-3 pt-3 border-t space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <MessageSquare className="h-3.5 w-3.5" />
        Comentários
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <Textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Adicionar comentário..."
          rows={2}
          className="text-xs min-h-[48px]"
        />
        <Button
          size="sm"
          variant="outline"
          onClick={handleSubmit}
          disabled={addComentario.isPending || !texto.trim()}
          className="self-end"
        >
          {addComentario.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
        </Button>
      </div>

      {/* Lista */}
      {isLoading ? (
        <Skeleton className="h-8 w-full" />
      ) : comentarios.length > 0 ? (
        <div className="space-y-1.5 max-h-40 overflow-y-auto">
          {comentarios.map((c) => (
            <div key={c.id} className="bg-muted/50 rounded px-2.5 py-1.5 text-xs">
              <div className="flex justify-between items-center mb-0.5">
                <span className="font-medium">{c.user?.full_name || 'Usuário'}</span>
                <span className="text-muted-foreground text-[10px]">
                  {formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: ptBR })}
                </span>
              </div>
              <p className="text-muted-foreground">{c.comentario}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function PortalIncorporadorPropostas() {
  const { empreendimentoIds, isLoading: loadingEmps } = useIncorporadorEmpreendimentos();
  const { data: todasNegociacoes = [], isLoading: loadingNegs } = useNegociacoes(undefined, { enabled: empreendimentoIds.length > 0 });
  
  const aprovarMutation = useAprovarPropostaIncorporador();
  const negarMutation = useNegarPropostaIncorporador();

  const [aprovarDialog, setAprovarDialog] = useState<Negociacao | null>(null);
  const [negarDialog, setNegarDialog] = useState<Negociacao | null>(null);
  const [motivoContra, setMotivoContra] = useState('');

  const ETAPA_ANALISE_PROPOSTA = 'ed1b1eb4-2cf1-4cf3-ac62-2a8897a52f35';

  const propostasEmAnalise = todasNegociacoes.filter(
    n => empreendimentoIds.includes(n.empreendimento_id) && (
      n.status_proposta === 'em_analise' || 
      (n.funil_etapa_id === ETAPA_ANALISE_PROPOSTA && !n.status_proposta)
    )
  );

  const propostasResolvidas = todasNegociacoes.filter(
    n => ['aprovada_incorporador', 'contra_proposta'].includes(n.status_proposta || '') 
      && empreendimentoIds.includes(n.empreendimento_id)
  );

  const isLoading = loadingEmps || loadingNegs;

  const formatCurrency = (value?: number) => {
    if (!value) return '-';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const handleAprovar = async () => {
    if (!aprovarDialog) return;
    await aprovarMutation.mutateAsync(aprovarDialog);
    setAprovarDialog(null);
  };

  const handleNegar = async () => {
    if (!negarDialog || !motivoContra.trim()) return;
    await negarMutation.mutateAsync({ negociacao: negarDialog, motivo: motivoContra });
    setNegarDialog(null);
    setMotivoContra('');
  };

  const renderPropostaCard = (neg: Negociacao, showActions: boolean) => {
    const desconto = neg.valor_tabela && neg.valor_proposta && neg.valor_proposta < neg.valor_tabela
      ? ((1 - neg.valor_proposta / neg.valor_tabela) * 100).toFixed(1)
      : null;

    return (
      <Card key={neg.id} className="hover:shadow-md transition-shadow">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold text-sm">{neg.numero_proposta || neg.codigo}</span>
                {neg.status_proposta && (
                  <Badge className={`text-[10px] text-white ${STATUS_PROPOSTA_COLORS[neg.status_proposta]}`}>
                    {STATUS_PROPOSTA_LABELS[neg.status_proposta]}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{neg.codigo}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4">
            <div className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="truncate">{neg.cliente?.nome || '-'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="truncate">{neg.empreendimento?.nome || '-'}</span>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Tabela:</span>{' '}
              <span className="font-medium">{formatCurrency(neg.valor_tabela)}</span>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Proposta:</span>{' '}
              <span className="font-medium text-primary">{formatCurrency(neg.valor_proposta)}</span>
              {desconto && (
                <Badge variant="outline" className="ml-1.5 text-[10px] text-orange-600 border-orange-300">
                  -{desconto}%
                </Badge>
              )}
            </div>
          </div>

          {neg.corretor && (
            <p className="text-xs text-muted-foreground mb-3">
              Corretor: {neg.corretor.nome_completo}
            </p>
          )}

          {showActions && (
            <div className="flex gap-2 justify-end pt-3 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setNegarDialog(neg);
                  setMotivoContra('');
                }}
              >
                <X className="h-4 w-4 mr-1.5" />
                Contra Proposta
              </Button>
              <Button
                size="sm"
                onClick={() => setAprovarDialog(neg)}
              >
                <Check className="h-4 w-4 mr-1.5" />
                Aprovar
              </Button>
            </div>
          )}

          {neg.status_proposta === 'contra_proposta' && neg.motivo_contra_proposta && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-xs text-orange-600 font-medium">Motivo da contra proposta:</p>
              <p className="text-xs text-muted-foreground mt-0.5">{neg.motivo_contra_proposta}</p>
            </div>
          )}

          {/* Seção de comentários */}
          <ComentariosSection negociacaoId={neg.id} />
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 w-full" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Propostas Aguardando Aprovação
          {propostasEmAnalise.length > 0 && (
            <Badge variant="secondary">{propostasEmAnalise.length}</Badge>
          )}
        </h2>

        {propostasEmAnalise.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">Nenhuma proposta aguardando aprovação</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {propostasEmAnalise.map(neg => renderPropostaCard(neg, true))}
          </div>
        )}
      </div>

      {propostasResolvidas.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Propostas Recentes</h2>
          <div className="grid gap-4">
            {propostasResolvidas.map(neg => renderPropostaCard(neg, false))}
          </div>
        </div>
      )}

      {/* Dialog Aprovar */}
      <Dialog open={!!aprovarDialog} onOpenChange={(o) => !o && setAprovarDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprovar Proposta</DialogTitle>
            <DialogDescription>
              Confirma a aprovação da proposta {aprovarDialog?.numero_proposta} para {aprovarDialog?.cliente?.nome}?
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm">
            Valor: <strong>{formatCurrency(aprovarDialog?.valor_proposta)}</strong>
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAprovarDialog(null)}>Cancelar</Button>
            <Button onClick={handleAprovar} disabled={aprovarMutation.isPending}>
              {aprovarMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Check className="h-4 w-4 mr-2" />
              Confirmar Aprovação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Contra Proposta */}
      <Dialog open={!!negarDialog} onOpenChange={(o) => !o && setNegarDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contra Proposta</DialogTitle>
            <DialogDescription>
              Informe o motivo e as orientações para ajuste da proposta {negarDialog?.numero_proposta}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="motivo_contra">Justificativa *</Label>
            <Textarea
              id="motivo_contra"
              value={motivoContra}
              onChange={(e) => setMotivoContra(e.target.value)}
              placeholder="Ex: Desconto acima do permitido. Máximo 5% para este empreendimento..."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNegarDialog(null)}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={handleNegar}
              disabled={negarMutation.isPending || !motivoContra.trim()}
            >
              {negarMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Enviar Contra Proposta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
