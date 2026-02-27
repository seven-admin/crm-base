import { useState } from 'react';
import { useNegociacoes, useAprovarPropostaIncorporador, useNegarPropostaIncorporador } from '@/hooks/useNegociacoes';
import { useIncorporadorEmpreendimentos } from '@/hooks/useIncorporadorEmpreendimentos';
import { useNegociacaoComentarios, useAddNegociacaoComentario } from '@/hooks/useNegociacaoComentarios';
import { useNegociacaoCondicoesPagamento } from '@/hooks/useNegociacaoCondicoesPagamento';
import { Negociacao } from '@/types/negociacoes.types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Check, Loader2, DollarSign, AlertCircle, MessageSquare, Send, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import PropostaCard from '@/components/portal-incorporador/PropostaCard';
import { formatarMoeda } from '@/lib/formatters';
import { STATUS_PROPOSTA_LABELS } from '@/types/negociacoes.types';

// ─── Comentários ────────────────────────────────────────────────
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
      <div className="flex gap-2">
        <Textarea value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Adicionar comentário..." rows={2} className="text-xs min-h-[48px]" />
        <Button size="sm" variant="outline" onClick={handleSubmit} disabled={addComentario.isPending || !texto.trim()} className="self-end">
          {addComentario.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
        </Button>
      </div>
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

// ─── Wrapper que busca condições e renderiza o card ─────────────
function PropostaCardWithCondicoes({
  neg,
  showActions,
  onAprovar,
  onContraProposta,
}: {
  neg: Negociacao;
  showActions: boolean;
  onAprovar: (n: Negociacao) => void;
  onContraProposta: (n: Negociacao) => void;
}) {
  const { data: condicoes = [] } = useNegociacaoCondicoesPagamento(neg.id);

  return (
    <PropostaCard
      negociacao={neg}
      condicoes={condicoes}
      showActions={showActions}
      onAprovar={onAprovar}
      onContraProposta={onContraProposta}
    >
      <ComentariosSection negociacaoId={neg.id} />
    </PropostaCard>
  );
}

// ─── Página principal ───────────────────────────────────────────
export default function PortalIncorporadorPropostas() {
  const { empreendimentoIds, isLoading: loadingEmps } = useIncorporadorEmpreendimentos();
  const { data: todasNegociacoes = [], isLoading: loadingNegs } = useNegociacoes(undefined, { enabled: empreendimentoIds.length > 0, refetchInterval: 30000 });

  const aprovarMutation = useAprovarPropostaIncorporador();
  const negarMutation = useNegarPropostaIncorporador();

  const [aprovarDialog, setAprovarDialog] = useState<Negociacao | null>(null);
  const [negarDialog, setNegarDialog] = useState<Negociacao | null>(null);
  const [motivoContra, setMotivoContra] = useState('');

  const ETAPA_ANALISE_PROPOSTA = 'ed1b1eb4-2cf1-4cf3-ac62-2a8897a52f35';

  const propostasEmAnalise = todasNegociacoes.filter(
    (n) =>
      empreendimentoIds.includes(n.empreendimento_id) &&
      (n.status_proposta === 'em_analise' ||
        (n.funil_etapa_id === ETAPA_ANALISE_PROPOSTA && !n.status_proposta))
  );

  const propostasEmPreparacao = todasNegociacoes.filter(
    (n) =>
      empreendimentoIds.includes(n.empreendimento_id) &&
      ['rascunho', 'enviada'].includes(n.status_proposta || '') &&
      !!n.numero_proposta
  );

  const propostasResolvidas = todasNegociacoes.filter(
    (n) =>
      ['aprovada_incorporador', 'contra_proposta'].includes(n.status_proposta || '') &&
      empreendimentoIds.includes(n.empreendimento_id)
  );

  const isLoading = loadingEmps || loadingNegs;

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

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Em Análise */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Propostas Aguardando Aprovação
          {propostasEmAnalise.length > 0 && <Badge variant="secondary">{propostasEmAnalise.length}</Badge>}
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
            {propostasEmAnalise.map((neg) => (
              <PropostaCardWithCondicoes
                key={neg.id}
                neg={neg}
                showActions
                onAprovar={setAprovarDialog}
                onContraProposta={(n) => {
                  setNegarDialog(n);
                  setMotivoContra('');
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Em Preparação */}
      {propostasEmPreparacao.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Em Preparação
            <Badge variant="outline">{propostasEmPreparacao.length}</Badge>
          </h2>
          <div className="grid gap-4">
            {propostasEmPreparacao.map((neg) => (
              <PropostaCardWithCondicoes
                key={neg.id}
                neg={neg}
                showActions={false}
                onAprovar={setAprovarDialog}
                onContraProposta={(n) => {
                  setNegarDialog(n);
                  setMotivoContra('');
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Resolvidas */}
      {propostasResolvidas.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Propostas Recentes</h2>
          <div className="grid gap-4">
            {propostasResolvidas.map((neg) => (
              <PropostaCardWithCondicoes
                key={neg.id}
                neg={neg}
                showActions={false}
                onAprovar={setAprovarDialog}
                onContraProposta={(n) => {
                  setNegarDialog(n);
                  setMotivoContra('');
                }}
              />
            ))}
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
            Valor: <strong>{aprovarDialog?.valor_proposta ? formatarMoeda(aprovarDialog.valor_proposta) : '-'}</strong>
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
            <Button variant="destructive" onClick={handleNegar} disabled={negarMutation.isPending || !motivoContra.trim()}>
              {negarMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Enviar Contra Proposta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
