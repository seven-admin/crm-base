import { useMemo, useState } from 'react';
import { endOfMonth, endOfWeek, startOfMonth, startOfWeek } from 'date-fns';
import { MainLayout } from '@/components/layout/MainLayout';
import { EventCalendar, type CalendarEvent } from '@/components/shared/EventCalendar';
import { AtividadeDetalheDialog } from '@/components/nexa/AtividadeDetalheDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNexaAtividadesCalendario } from '@/hooks/useNexaMetas';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { STATUS_COLORS, STATUS_LABELS, TIPO_ATIVIDADE_LABELS, type NexaAtividadeWithRelations } from '@/types/nexa.types';

export default function NexaCalendario() {
  const { user } = useAuth();
  const { getModuleScope } = usePermissions();
  const veTodos = getModuleScope('nexa_agenda') !== 'proprio';

  const [month, setMonth] = useState(new Date());
  const [criadorFilter, setCriadorFilter] = useState('todos');
  const [selected, setSelected] = useState<NexaAtividadeWithRelations | null>(null);

  const from = startOfWeek(startOfMonth(month), { weekStartsOn: 0 }).toISOString();
  const to = endOfWeek(endOfMonth(month), { weekStartsOn: 0 }).toISOString();

  const { data: atividades = [], isLoading } = useNexaAtividadesCalendario({
    from, to, mineUserId: veTodos ? null : user?.id,
  });

  const criadores = useMemo(() => {
    const map = new Map<string, string>();
    atividades.forEach((a) => { if (a.criador) map.set(a.criador.id, a.criador.full_name); });
    return [...map.entries()];
  }, [atividades]);

  const events: CalendarEvent[] = useMemo(
    () => atividades
      .filter((a) => criadorFilter === 'todos' || a.created_by === criadorFilter)
      .map((a) => ({
        id: a.id,
        date: new Date(a.data_hora),
        title: a.cliente?.nome ?? a.visitante_nome ?? TIPO_ATIVIDADE_LABELS[a.tipo] ?? 'Atividade',
        subtitle: [TIPO_ATIVIDADE_LABELS[a.tipo], a.status ? STATUS_LABELS[a.status] : null, a.criador?.full_name]
          .filter(Boolean).join(' · '),
        colorClass: a.status ? STATUS_COLORS[a.status] : 'bg-slate-100 text-slate-800',
        onClick: () => setSelected(a),
      })),
    [atividades, criadorFilter],
  );

  return (
    <MainLayout
      title="Calendário Nexa"
      subtitle="Atividades e atendimentos agendados"
      actions={veTodos && criadores.length > 0 ? (
        <Select value={criadorFilter} onValueChange={setCriadorFilter}>
          <SelectTrigger className="w-[220px]"><SelectValue placeholder="Responsável" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os responsáveis</SelectItem>
            {criadores.map(([id, nome]) => <SelectItem key={id} value={id}>{nome}</SelectItem>)}
          </SelectContent>
        </Select>
      ) : undefined}
    >
      <EventCalendar events={events} month={month} onMonthChange={setMonth} loading={isLoading} />
      <AtividadeDetalheDialog
        atividade={selected}
        returnTo="/nexa/calendario"
        onOpenChange={(open) => { if (!open) setSelected(null); }}
      />
    </MainLayout>
  );
}
