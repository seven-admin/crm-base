import { useMemo, useState } from 'react';
import { endOfMonth, endOfWeek, startOfMonth, startOfWeek } from 'date-fns';
import { MainLayout } from '@/components/layout/MainLayout';
import { EventCalendar, type CalendarEvent } from '@/components/shared/EventCalendar';
import { AgendamentoDetalheDialog } from '@/components/arqo/AgendamentoDetalheDialog';
import { AtividadeDetalheDialog } from '@/components/nexa/AtividadeDetalheDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useArqoAgendamentosCalendario, useArqoAtividadeTipos } from '@/hooks/useArqo';
import { useNexaAtividadesCalendario } from '@/hooks/useNexaMetas';
import { AGENDAMENTO_STATUS_LABELS, type ArqoAgendamentoWithRelations } from '@/types/arqo.types';
import { STATUS_LABELS, TIPO_ATIVIDADE_LABELS, type NexaAtividadeWithRelations } from '@/types/nexa.types';

type Modulo = 'todos' | 'arqo' | 'nexa';

const ARQO_COLOR = 'bg-amber-100 text-amber-800';
const NEXA_COLOR = 'bg-violet-100 text-violet-800';

export default function SevenCalendarios() {
  const [month, setMonth] = useState(new Date());
  const [modulo, setModulo] = useState<Modulo>('todos');
  const [usuarioFilter, setUsuarioFilter] = useState('todos');
  const [selectedArqo, setSelectedArqo] = useState<ArqoAgendamentoWithRelations | null>(null);
  const [selectedNexa, setSelectedNexa] = useState<NexaAtividadeWithRelations | null>(null);

  const from = startOfWeek(startOfMonth(month), { weekStartsOn: 0 }).toISOString();
  const to = endOfWeek(endOfMonth(month), { weekStartsOn: 0 }).toISOString();

  // Super admin: sem filtro por dono no servidor (vê tudo).
  const { data: agendamentos = [], isLoading: loadingArqo } = useArqoAgendamentosCalendario({ from, to, mineUserId: null });
  const { data: atividades = [], isLoading: loadingNexa } = useNexaAtividadesCalendario({ from, to, mineUserId: null });
  const { data: tipos } = useArqoAtividadeTipos(true);
  const tipoLabels = useMemo(
    () => Object.fromEntries((tipos ?? []).map((t) => [t.codigo, t.rotulo])),
    [tipos],
  );

  // Dono de cada evento: Arqo = responsável (ou closer); Nexa = criador.
  const arqoOwner = (a: ArqoAgendamentoWithRelations) => a.responsavel_id ?? a.closer_id ?? null;
  const arqoOwnerName = (a: ArqoAgendamentoWithRelations) => a.responsavel?.full_name ?? a.closer?.full_name ?? null;

  // Lista de usuários (dono) presente nos eventos, para o filtro.
  const usuarios = useMemo(() => {
    const map = new Map<string, string>();
    agendamentos.forEach((a) => { const id = arqoOwner(a); const n = arqoOwnerName(a); if (id && n) map.set(id, n); });
    atividades.forEach((a) => { if (a.created_by && a.criador?.full_name) map.set(a.created_by, a.criador.full_name); });
    return [...map.entries()].sort((x, y) => x[1].localeCompare(y[1], 'pt-BR'));
  }, [agendamentos, atividades]);

  const events: CalendarEvent[] = useMemo(() => {
    const list: CalendarEvent[] = [];

    if (modulo !== 'nexa') {
      agendamentos
        .filter((a) => usuarioFilter === 'todos' || arqoOwner(a) === usuarioFilter)
        .forEach((a) => list.push({
          id: `arqo-${a.id}`,
          date: new Date(a.data_hora),
          title: a.lead?.cliente?.nome ?? tipoLabels[a.tipo] ?? 'Agendamento',
          subtitle: ['Arqo', tipoLabels[a.tipo] ?? a.tipo, AGENDAMENTO_STATUS_LABELS[a.status], arqoOwnerName(a)].filter(Boolean).join(' · '),
          colorClass: ARQO_COLOR,
          onClick: () => setSelectedArqo(a),
        }));
    }

    if (modulo !== 'arqo') {
      atividades
        .filter((a) => usuarioFilter === 'todos' || a.created_by === usuarioFilter)
        .forEach((a) => list.push({
          id: `nexa-${a.id}`,
          date: new Date(a.data_hora),
          title: a.cliente?.nome ?? a.visitante_nome ?? TIPO_ATIVIDADE_LABELS[a.tipo] ?? 'Atividade',
          subtitle: ['Nexa', TIPO_ATIVIDADE_LABELS[a.tipo], a.status ? STATUS_LABELS[a.status] : null, a.criador?.full_name].filter(Boolean).join(' · '),
          colorClass: NEXA_COLOR,
          onClick: () => setSelectedNexa(a),
        }));
    }

    return list;
  }, [agendamentos, atividades, modulo, usuarioFilter, tipoLabels]);

  return (
    <MainLayout
      title="Calendários"
      subtitle="Agenda consolidada Arqo + Nexa, por usuário"
      actions={(
        <div className="flex flex-wrap items-center gap-2">
          <Select value={modulo} onValueChange={(v) => setModulo(v as Modulo)}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Arqo + Nexa</SelectItem>
              <SelectItem value="arqo">Somente Arqo</SelectItem>
              <SelectItem value="nexa">Somente Nexa</SelectItem>
            </SelectContent>
          </Select>
          <Select value={usuarioFilter} onValueChange={setUsuarioFilter}>
            <SelectTrigger className="w-[220px]"><SelectValue placeholder="Usuário" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os usuários</SelectItem>
              {usuarios.map(([id, nome]) => <SelectItem key={id} value={id}>{nome}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}
    >
      <div className="mb-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className={`h-3 w-3 rounded ${ARQO_COLOR}`} /> Arqo</span>
        <span className="flex items-center gap-1.5"><span className={`h-3 w-3 rounded ${NEXA_COLOR}`} /> Nexa</span>
      </div>

      <EventCalendar events={events} month={month} onMonthChange={setMonth} loading={loadingArqo || loadingNexa} />

      <AgendamentoDetalheDialog
        agendamento={selectedArqo}
        tipoLabels={tipoLabels}
        onOpenChange={(open) => { if (!open) setSelectedArqo(null); }}
      />
      <AtividadeDetalheDialog
        atividade={selectedNexa}
        onOpenChange={(open) => { if (!open) setSelectedNexa(null); }}
      />
    </MainLayout>
  );
}
