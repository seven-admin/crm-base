import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  useArqoLeads, useArqoLead, useAtribuirRoleta, useArqoEtapas, useMeusArqoGrupos, useArqoFilaGrupos,
} from '@/hooks/useArqo';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { Loader2, Phone, Upload, Users, Clock } from 'lucide-react';
import { ArqoImportarLeadsDialog } from '@/components/arqo/ArqoImportarLeadsDialog';
import { ArqoAtendimentoFlow } from '@/components/arqo/ArqoAtendimentoFlow';
import { formatarTelefone } from '@/lib/documentUtils';
import { toast } from 'sonner';

export default function ArqoRoleta() {
  const { user } = useAuth();
  const { isSuperAdmin } = usePermissions();
  const podeImportar = isSuperAdmin();
  const [searchParams] = useSearchParams();
  const requestedLeadId = searchParams.get('lead');
  const [importOpen, setImportOpen] = useState(false);
  const [grupoPuxandoId, setGrupoPuxandoId] = useState<string | null>(null);
  const [leadEmTratamentoId, setLeadEmTratamentoId] = useState<string | null>(null);

  const { data: meusGrupos = [], isLoading: loadingGrupos } = useMeusArqoGrupos(user?.id);
  // Só os leads do próprio consultor (leve e sempre completo) + contagem da fila por RPC —
  // evita carregar a tabela inteira de leads, que travava com filas de milhares.
  const { data: meusLeads = [], isLoading } = useArqoLeads(user?.id ? { consultorId: user.id } : undefined);
  const { data: filaPorGrupo = {} } = useArqoFilaGrupos(user?.id);
  const { data: leadEmTratamento, isLoading: loadingLeadEmTratamento } = useArqoLead(leadEmTratamentoId ?? undefined);
  const { data: etapas = [] } = useArqoEtapas();

  const atribuir = useAtribuirRoleta();

  // Leads em etapas com bloqueia_roleta=false (ex: Aguardando Followup, Reagendar) ficam
  // vinculados ao consultor como pendência, mas não impedem puxar um novo lead.
  const meuLeadAtivo = useMemo(() => {
    const meus = meusLeads.filter(l => !l.fechado_em && l.etapa?.bloqueia_roleta !== false);

    // Deep link vindo do histórico/agenda: prioriza o lead pedido na URL.
    if (requestedLeadId) {
      const pedido = meus.find(l => l.id === requestedLeadId);
      if (pedido) return pedido;
    }

    const leadPuxadoValido = leadEmTratamento
      && leadEmTratamento.consultor_id === user?.id
      && !leadEmTratamento.fechado_em
      && leadEmTratamento.etapa?.bloqueia_roleta !== false;

    if (leadPuxadoValido) return leadEmTratamento;

    return meus[0];
  }, [meusLeads, leadEmTratamento, user, requestedLeadId]);

  const minhasPendencias = useMemo(
    () => meusLeads.filter(l => !l.fechado_em && l.etapa?.bloqueia_roleta === false),
    [meusLeads],
  );

  // Puxar próximo lead: a RPC escolhe e bloqueia o próximo lead disponível do grupo.
  const puxarProximo = (grupoId: string) => {
    if ((filaPorGrupo[grupoId] ?? 0) <= 0) {
      toast.info('Nenhum lead disponível neste grupo no momento.');
      return;
    }
    setGrupoPuxandoId(grupoId);
    atribuir.mutate(
      { grupoId },
      {
        onSuccess: (leadId) => setLeadEmTratamentoId(leadId),
        onSettled: () => setGrupoPuxandoId(null),
      },
    );
  };

  // Mini dash de grupos + botão de puxar. Fica sempre no topo da página.
  const gruposSection = (
    <section>
      <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
        Meus grupos de atendimento
      </h2>
      {loadingGrupos ? (
        <Card className="p-6 flex justify-center"><Loader2 className="h-5 w-5 animate-spin" /></Card>
      ) : meusGrupos.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          Você não está vinculado a nenhum grupo de atendimento. Solicite ao gestor Arqo para incluí-lo.
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {meusGrupos.map(g => {
            const qtd = filaPorGrupo[g.id] ?? 0;
            return (
              <Card key={g.id} className="p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" /> {g.papel === 'closer' ? 'Closer' : 'Consultor'}
                    </div>
                    <h3 className="font-semibold text-sm truncate">{g.nome}</h3>
                  </div>
                  <Badge variant="secondary" className="text-lg font-bold px-3">
                    {qtd}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  {qtd === 0 ? 'Nenhum lead aguardando' : `${qtd} lead${qtd > 1 ? 's' : ''} aguardando atendimento`}
                </p>
                <Button
                  className="w-full"
                  size="sm"
                  disabled={qtd === 0 || grupoPuxandoId === g.id}
                  onClick={() => puxarProximo(g.id)}
                >
                  {grupoPuxandoId === g.id && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Puxar próximo lead
                </Button>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );

  const carregando = isLoading || loadingLeadEmTratamento;

  const atendimentoSection = carregando ? (
    <Card className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></Card>
  ) : meuLeadAtivo ? (
    <ArqoAtendimentoFlow lead={meuLeadAtivo} etapas={etapas} />
  ) : (
    <Card className="p-8 text-center text-muted-foreground">
      Nenhum lead ativo. Puxe o próximo lead de um dos seus grupos acima.
    </Card>
  );

  return (
    <MainLayout
      title="Arqo — Meu Atendimento"
      subtitle="Puxe o próximo lead do seu grupo e registre cada interação"
      actions={podeImportar ? (
        <Button variant="outline" onClick={() => setImportOpen(true)}>
          <Upload className="h-4 w-4 mr-2" /> Importar leads
        </Button>
      ) : undefined}
    >
      {podeImportar && <ArqoImportarLeadsDialog open={importOpen} onOpenChange={setImportOpen} />}

      {/* Grupos sempre no topo (puxar próximo lead); o atendimento em andamento logo abaixo. */}
      <div className="space-y-6">
        {gruposSection}
        {atendimentoSection}
      </div>

      {/* Pendências: leads em followup/reagendamento — não bloqueiam novos leads */}
      {minhasPendencias.length > 0 && (
        <section className="mt-6">
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide flex items-center gap-2">
            <Clock className="h-4 w-4" /> Pendências ({minhasPendencias.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {minhasPendencias.map(l => (
              <Link key={l.id} to={`/arqo/leads/${l.id}`}>
                <Card className="p-4 hover:shadow-md transition-shadow h-full">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-medium text-sm truncate">{l.cliente?.nome ?? '—'}</span>
                    <Badge style={{ backgroundColor: l.etapa?.cor, color: '#fff' }} className="text-xs shrink-0">
                      {l.etapa?.nome}
                    </Badge>
                  </div>
                  {l.cliente?.telefone && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3" /> {formatarTelefone(l.cliente.telefone)}
                    </div>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
    </MainLayout>
  );
}
