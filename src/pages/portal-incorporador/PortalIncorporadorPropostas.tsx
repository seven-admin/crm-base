import { useState } from 'react';
import { useNegociacoes, useAprovarPropostaIncorporador, useNegarPropostaIncorporador } from '@/hooks/useNegociacoes';
import { useFilteredEmpreendimentoIds } from '@/hooks/useFilteredEmpreendimentoIds';
import { useNegociacaoComentarios, useAddNegociacaoComentario } from '@/hooks/useNegociacaoComentarios';
import { useNegociacaoCondicoesPagamento } from '@/hooks/useNegociacaoCondicoesPagamento';
import { Negociacao } from '@/types/negociacoes.types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Check, Loader2, DollarSign, AlertCircle, MessageSquare, Send, Clock, Handshake, ChevronDown, Headphones } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import PropostaCard from '@/components/portal-incorporador/PropostaCard';
import { formatarMoeda } from '@/lib/formatters';
import { STATUS_PROPOSTA_LABELS } from '@/types/negociacoes.types';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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

// ─── Seção colapsável reutilizável ──────────────────────────────
function CollapsibleSection({
  title,
  icon: Icon,
  count,
  children,
  badgeVariant = 'secondary',
  defaultOpen = true,
}: {
  title: string;
  icon: React.ElementType;
  count: number;
  children: React.ReactNode;
  badgeVariant?: 'secondary' | 'outline' | 'default';
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="flex items-center gap-2 w-full text-left mb-3 group">
          <Icon className="h-5 w-5" />
          <h2 className="text-lg font-semibold">{title}</h2>
          {count > 0 && <Badge variant={badgeVariant}>{count}</Badge>}
          <ChevronDown className={`h-4 w-4 ml-auto text-muted-foreground transition-transform ${open ? '' : '-rotate-90'}`} />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>{children}</CollapsibleContent>
    </Collapsible>
  );
}

// ─── Página principal ───────────────────────────────────────────
export default function PortalIncorporadorPropostas() {
  const { empreendimentoIds, isLoading: loadingEmps } = useFilteredEmpreendimentoIds();
  const { data: todasNegociacoes = [], isLoading: loadingNegs } = useNegociacoes(undefined, { enabled: empreendimentoIds.length > 0, refetchInterval: 30000 });

  const aprovarMutation = useAprovarPropostaIncorporador();
  const negarMutation = useNegarPropostaIncorporador();

  const [aprovarDialog, setAprovarDialog] = useState<Negociacao | null>(null);
  const [negarDialog, setNegarDialog] = useState<Negociacao | null>(null);
  const [motivoContra, setMotivoContra] = useState('');

  // Buscar etapas marcadas como visíveis para incorporador
  const { data: etapasVisiveis = [] } = useQuery({
    queryKey: ['funil-etapas-visiveis-incorporador'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('funil_etapas')
        .select('id')
        .eq('visivel_incorporador', true)
        .eq('is_active', true);
      if (error) throw error;
      return data.map((e: { id: string }) => e.id);
    },
  });

  const etapasVisiveisIds = etapasVisiveis as string[];
  const temEtapasConfiguradas = etapasVisiveisIds.length > 0;

  const negociacoesEmAndamento = todasNegociacoes.filter(
    (n) =>
      empreendimentoIds.includes(n.empreendimento_id) &&
      (temEtapasConfiguradas
        ? etapasVisiveisIds.includes(n.funil_etapa_id || '')
        : true) &&
      !['aprovada_incorporador', 'contra_proposta'].includes(n.status_proposta || '')
  );

  const atendimentosEmAndamento = negociacoesEmAndamento.filter(
    (n) => n.funil_etapa?.is_inicial === true
  );

  const negociacoesEfetivas = negociacoesEmAndamento.filter(
    (n) => n.funil_etapa?.is_inicial !== true
  );

  const propostasEmAnalise = todasNegociacoes.filter(
    (n) =>
      empreendimentoIds.includes(n.empreendimento_id) &&
      n.status_proposta === 'em_analise'
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
      <CollapsibleSection title="Propostas Aguardando Aprovação" icon={DollarSign} count={propostasEmAnalise.length}>
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
              <PropostaCardWithCondicoes key={neg.id} neg={neg} showActions onAprovar={setAprovarDialog} onContraProposta={(n) => { setNegarDialog(n); setMotivoContra(''); }} />
            ))}
          </div>
        )}
      </CollapsibleSection>

      {/* Em Preparação */}
      {propostasEmPreparacao.length > 0 && (
        <CollapsibleSection title="Em Preparação" icon={Clock} count={propostasEmPreparacao.length} badgeVariant="outline">
          <div className="grid gap-4">
            {propostasEmPreparacao.map((neg) => (
              <PropostaCardWithCondicoes key={neg.id} neg={neg} showActions={false} onAprovar={setAprovarDialog} onContraProposta={(n) => { setNegarDialog(n); setMotivoContra(''); }} />
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Resolvidas */}
      {propostasResolvidas.length > 0 && (
        <CollapsibleSection title="Propostas Recentes" icon={Check} count={propostasResolvidas.length} badgeVariant="outline" defaultOpen={false}>
          <div className="grid gap-4">
            {propostasResolvidas.map((neg) => (
              <PropostaCardWithCondicoes key={neg.id} neg={neg} showActions={false} onAprovar={setAprovarDialog} onContraProposta={(n) => { setNegarDialog(n); setMotivoContra(''); }} />
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Atendimentos em Andamento */}
      <CollapsibleSection title="Atendimentos em Andamento" icon={Headphones} count={atendimentosEmAndamento.length}>
        {atendimentosEmAndamento.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Headphones className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">Nenhum atendimento em andamento no momento</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {atendimentosEmAndamento.map((neg) => (
              <PropostaCardWithCondicoes key={neg.id} neg={neg} showActions={false} onAprovar={setAprovarDialog} onContraProposta={(n) => { setNegarDialog(n); setMotivoContra(''); }} />
            ))}
          </div>
        )}
      </CollapsibleSection>

      {/* Negociações em Andamento */}
      <CollapsibleSection title="Negociações em Andamento" icon={Handshake} count={negociacoesEfetivas.length}>
        {negociacoesEfetivas.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Handshake className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">Nenhuma negociação em andamento no momento</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {negociacoesEfetivas.map((neg) => (
              <PropostaCardWithCondicoes key={neg.id} neg={neg} showActions={false} onAprovar={setAprovarDialog} onContraProposta={(n) => { setNegarDialog(n); setMotivoContra(''); }} />
            ))}
          </div>
        )}
      </CollapsibleSection>

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
