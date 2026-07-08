import { useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MainLayout } from '@/components/layout/MainLayout';
import { useNexaVisitas } from '@/hooks/useNexa';
import { NovaVisitaDialog } from '@/components/nexa/NovaVisitaDialog';
import { STATUS_LABELS, STATUS_COLORS } from '@/types/nexa.types';

export default function NexaAgenda() {
  const [novoOpen, setNovoOpen] = useState(false);
  const { data: visitas, isLoading } = useNexaVisitas();

  return (
    <MainLayout
      title="Agenda Nexa"
      subtitle="Gestão de visitas a empreendimentos"
      actions={<Button onClick={() => setNovoOpen(true)}><Plus className="h-4 w-4 mr-2" /> Nova visita</Button>}
    >
      <div className="space-y-6">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}
          </div>
        ) : !visitas?.length ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Nenhuma visita agendada ainda. Clique em "Nova visita" para começar.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {visitas.map((v) => (
              <Link key={v.id} to={`/nexa/visitas/${v.id}`}>
                <Card className="hover:border-primary transition-colors cursor-pointer">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <CardTitle className="text-base">
                          {v.cliente?.nome || v.visitante_nome || 'Visitante'}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {v.empreendimento?.nome} · {format(new Date(v.data_hora), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      <Badge className={STATUS_COLORS[v.status]}>{STATUS_LABELS[v.status]}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 text-sm text-muted-foreground">
                    {v.imobiliaria?.nome && <span>Imobiliária: {v.imobiliaria.nome} · </span>}
                    {v.corretor?.nome_completo && <span>Corretor: {v.corretor.nome_completo}</span>}
                    {(!v.imobiliaria?.nome && !v.corretor?.nome_completo) && (
                      <span>{v.visitante_telefone || v.cliente?.telefone || '—'}</span>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        <NovaVisitaDialog open={novoOpen} onOpenChange={setNovoOpen} />
      </div>
    </MainLayout>
  );
}

