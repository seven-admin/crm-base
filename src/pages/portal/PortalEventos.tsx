import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEventoInscricoes } from '@/hooks/useEventoInscricoes';
import { format } from 'date-fns';
import { parseDateLocal } from '@/lib/utils';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, MapPin, Users, Building2, Loader2 } from 'lucide-react';

interface EventoPortal {
  id: string;
  nome: string;
  descricao: string | null;
  data_evento: string;
  local: string | null;
  inscricoes_abertas: boolean;
  limite_inscricoes: number | null;
  empreendimento: { id: string; nome: string } | null;
}

export default function PortalEventos() {
  const { user, profile } = useAuth();

  const { data: corretor } = useQuery({
    queryKey: ['portal-corretor-dados', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('corretores')
        .select('id, imobiliaria:imobiliaria_id(nome)')
        .eq('user_id', user!.id)
        .maybeSingle();
      return data as { id: string; imobiliaria: { nome: string } | null } | null;
    },
    enabled: !!user?.id,
  });

  const { data: eventos, isLoading } = useQuery({
    queryKey: ['portal-eventos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('eventos')
        .select(`
          id, nome, descricao, data_evento, local,
          inscricoes_abertas, limite_inscricoes,
          empreendimento:empreendimento_id(id, nome)
        `)
        .eq('is_active', true)
        .order('data_evento', { ascending: true });

      if (error) throw error;
      return data as unknown as EventoPortal[];
    },
  });

  const { minhasInscricoes, contagemInscricoes, inscrever, cancelar } =
    useEventoInscricoes(user?.id);

  const isInscrito = (eventoId: string) =>
    minhasInscricoes?.some((i) => i.evento_id === eventoId) ?? false;

  const vagasRestantes = (evento: EventoPortal) => {
    if (!evento.limite_inscricoes) return null;
    const inscritos = contagemInscricoes?.[evento.id] || 0;
    return Math.max(0, evento.limite_inscricoes - inscritos);
  };

  const handleInscrever = (evento: EventoPortal) => {
    if (!user || !profile) return;
    inscrever.mutate({
      evento_id: evento.id,
      corretor_id: corretor?.id,
      user_id: user.id,
      nome_corretor: profile.full_name || 'Corretor',
      telefone: profile.phone || undefined,
      email: profile.email || undefined,
      imobiliaria_nome: corretor?.imobiliaria?.nome || undefined,
      evento_nome: evento.nome,
      evento_data: evento.data_evento,
    });
  };

  const handleCancelar = (eventoId: string) => {
    if (!user) return;
    cancelar.mutate({ evento_id: eventoId, user_id: user.id });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!eventos?.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Nenhum evento disponível no momento.
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {eventos.map((evento) => {
        const inscrito = isInscrito(evento.id);
        const vagas = vagasRestantes(evento);
        const lotado = vagas !== null && vagas <= 0;
        const aberto = evento.inscricoes_abertas;
        const podeInscrever = aberto && !lotado && !inscrito;

        return (
          <Card key={evento.id} className="flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-lg leading-tight">{evento.nome}</CardTitle>
                <Badge variant={aberto ? 'default' : 'secondary'} className="shrink-0">
                  {aberto ? 'Aberto' : 'Fechado'}
                </Badge>
              </div>
              {evento.descricao && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {evento.descricao}
                </p>
              )}
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-3">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarDays className="h-4 w-4 shrink-0" />
                  <span>
                    {format(parseDateLocal(evento.data_evento), "dd 'de' MMMM 'de' yyyy", {
                      locale: ptBR,
                    })}
                  </span>
                </div>
                {evento.local && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span>{evento.local}</span>
                  </div>
                )}
                {evento.empreendimento && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building2 className="h-4 w-4 shrink-0" />
                    <span>{evento.empreendimento.nome}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4 shrink-0" />
                  <span>
                    {evento.limite_inscricoes
                      ? `${contagemInscricoes?.[evento.id] || 0}/${evento.limite_inscricoes} inscritos`
                      : `${contagemInscricoes?.[evento.id] || 0} inscritos`}
                  </span>
                  {lotado && (
                    <Badge variant="destructive" className="text-xs">
                      Lotado
                    </Badge>
                  )}
                </div>
              </div>

              <div className="mt-auto pt-3">
                {inscrito ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleCancelar(evento.id)}
                    disabled={cancelar.isPending}
                  >
                    {cancelar.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Cancelar inscrição
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    disabled={!podeInscrever || inscrever.isPending}
                    onClick={() => handleInscrever(evento)}
                  >
                    {inscrever.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    {lotado ? 'Lotado' : !aberto ? 'Inscrições fechadas' : 'Inscrever-se'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
