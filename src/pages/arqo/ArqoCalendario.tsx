import { useMemo, useState } from 'react';
import { endOfMonth, endOfWeek, startOfMonth, startOfWeek } from 'date-fns';
import { MainLayout } from '@/components/layout/MainLayout';
import { EventCalendar, type CalendarEvent } from '@/components/shared/EventCalendar';
import { AgendamentoDetalheDialog } from '@/components/arqo/AgendamentoDetalheDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useArqoAgendamentosCalendario, useArqoAtividadeTipos } from '@/hooks/useArqo';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { AGENDAMENTO_STATUS_COLORS, AGENDAMENTO_STATUS_LABELS, type ArqoAgendamentoWithRelations } from '@/types/arqo.types';

export default function ArqoCalendario() {
  const { user } = useAuth();
  const { getModuleScope } = usePermissions();
  const veTodos = getModuleScope('arqo_atividades') !== 'proprio';

  const [month, setMonth] = useState(new Date());
  const [responsavelFilter, setResponsavelFilter] = useState('todos');
  const [selected, setSelected] = useState<ArqoAgendamentoWithRelations | null>(null);

  const from = startOfWeek(startOfMonth(month), { weekStartsOn: 0 }).toISOString();
  const to = endOfWeek(endOfMonth(month), { weekStartsOn: 0 }).toISOString();

  const { data: agendamentos = [], isLoading } = useArqoAgendamentosCalendario({
    from, to, mineUserId: veTodos ? null : user?.id,
  });
  const { data: tipos } = useArqoAtividadeTipos(true);
  const tipoLabels = useMemo(
    () => Object.fromEntries((tipos ?? []).map((t) => [t.codigo, t.rotulo])),
    [tipos],
  );

  const responsaveis = useMemo(() => {
    const map = new Map<string, string>();
    agendamentos.forEach((a) => { if (a.responsavel) map.set(a.responsavel.id, a.responsavel.full_name); });
    return [...map.entries()];
  }, [agendamentos]);

  const events: CalendarEvent[] = useMemo(
    () => agendamentos
      .filter((a) => responsavelFilter === 'todos' || a.responsavel_id === responsavelFilter)
      .map((a) => ({
        id: a.id,
        date: new Date(a.data_hora),
        title: a.lead?.cliente?.nome ?? tipoLabels[a.tipo] ?? 'Agendamento',
        subtitle: [tipoLabels[a.tipo] ?? a.tipo, AGENDAMENTO_STATUS_LABELS[a.status], a.responsavel?.full_name]
          .filter(Boolean).join(' · '),
        colorClass: AGENDAMENTO_STATUS_COLORS[a.status],
        onClick: () => setSelected(a),
      })),
    [agendamentos, responsavelFilter, tipoLabels],
  );

  return (
    <MainLayout
      title="Calendário Arqo"
      subtitle="Agendamentos e próximas ações de atendimento"
      actions={veTodos && responsaveis.length > 0 ? (
        <Select value={responsavelFilter} onValueChange={setResponsavelFilter}>
          <SelectTrigger className="w-[220px]"><SelectValue placeholder="Responsável" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os responsáveis</SelectItem>
            {responsaveis.map(([id, nome]) => <SelectItem key={id} value={id}>{nome}</SelectItem>)}
          </SelectContent>
        </Select>
      ) : undefined}
    >
      <EventCalendar events={events} month={month} onMonthChange={setMonth} loading={isLoading} />
      <AgendamentoDetalheDialog
        agendamento={selected}
        tipoLabels={tipoLabels}
        onOpenChange={(open) => { if (!open) setSelected(null); }}
      />
    </MainLayout>
  );
}
