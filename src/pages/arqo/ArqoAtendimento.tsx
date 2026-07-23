import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2, PhoneCall } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { ArqoAtendimentoFlow } from '@/components/arqo/ArqoAtendimentoFlow';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useArqoEtapas, useArqoLeads } from '@/hooks/useArqo';

export default function ArqoAtendimento() {
  const { user } = useAuth();
  const { data: leads = [], isLoading, refetch } = useArqoLeads(
    user?.id ? { consultorId: user.id } : undefined,
  );
  const { data: etapas = [] } = useArqoEtapas();

  useEffect(() => {
    if (user?.id) void refetch();
  }, [refetch, user?.id]);

  const activeLead = useMemo(
    () => leads.find((lead) => (
      lead.consultor_id === user?.id
      && !lead.fechado_em
      && !lead.optout_em
      && lead.etapa?.bloqueia_roleta !== false
    )),
    [leads, user?.id],
  );

  return (
    <MainLayout
      title="Atendimento"
      subtitle="Registre a interação atual antes de retornar à roleta"
      actions={
        <Button asChild variant="outline" className="bg-card">
          <Link to="/arqo/roleta"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar à roleta</Link>
        </Button>
      }
      contentClassName="pt-4 md:pt-6"
    >
      {isLoading ? (
        <Card className="flex min-h-72 items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </Card>
      ) : activeLead ? (
        <ArqoAtendimentoFlow lead={activeLead} etapas={etapas} />
      ) : (
        <Card className="border-dashed bg-[#fffdfa] p-10 text-center shadow-none">
          <PhoneCall className="mx-auto mb-4 h-9 w-9 text-primary/60" />
          <h2 className="text-xl font-semibold tracking-[-0.03em]">Nenhum atendimento bloqueado</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Você não possui um lead ativo que bloqueie a roleta neste momento.
          </p>
          <Button asChild className="mt-5">
            <Link to="/arqo/roleta">Ir para a roleta</Link>
          </Button>
        </Card>
      )}
    </MainLayout>
  );
}
