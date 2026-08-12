import { useMemo, useState } from 'react';
import { addMonths, endOfMonth, endOfWeek, format, startOfMonth, startOfWeek, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarPlus, ChevronLeft, ChevronRight } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { EventCalendar, type CalendarEvent } from '@/components/shared/EventCalendar';
import { AgendamentoDetalheDialog } from '@/components/arqo/AgendamentoDetalheDialog';
import { AtividadeDetalheDialog } from '@/components/nexa/AtividadeDetalheDialog';
import { SevenAtividadeFormDialog } from '@/components/seven/SevenAtividadeFormDialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useArqoAgendamentosCalendario, useArqoAtividadeTipos } from '@/hooks/useArqo';
import { useNexaAtividadesCalendario } from '@/hooks/useNexaMetas';
import { useSevenAtividadesCalendario } from '@/hooks/useSevenAgenda';
import { AGENDAMENTO_STATUS_LABELS, type ArqoAgendamentoWithRelations } from '@/types/arqo.types';
import { STATUS_LABELS, TIPO_ATIVIDADE_LABELS, type NexaAtividadeWithRelations } from '@/types/nexa.types';

const SEVEN_COLOR = 'bg-blue-100 text-blue-800';
const ARQO_COLOR = 'bg-amber-100 text-amber-800';
const NEXA_COLOR = 'bg-violet-100 text-violet-800';

const SEVEN_DOT = 'bg-blue-500';
const NEXA_DOT = 'bg-violet-500';
const ARQO_DOT = 'bg-amber-500';

function ColunaTitulo({ nome, dotClass }: { nome: string; dotClass: string }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className={`h-2.5 w-2.5 rounded-full ${dotClass}`} />
      <h2 className="text-sm font-bold uppercase tracking-[.14em] text-[#181613]">{nome}</h2>
    </div>
  );
}

export default function SevenCalendarios() {
  const [month, setMonth] = useState(new Date());
  const [usuarioFilter, setUsuarioFilter] = useState('todos');
  const [selectedArqo, setSelectedArqo] = useState<ArqoAgendamentoWithRelations | null>(null);
  const [selectedNexa, setSelectedNexa] = useState<NexaAtividadeWithRelations | null>(null);
  const [novaOpen, setNovaOpen] = useState(false);

  const from = startOfWeek(startOfMonth(month), { weekStartsOn: 0 }).toISOString();
  const to = endOfWeek(endOfMonth(month), { weekStartsOn: 0 }).toISOString();

  // Super admin: sem filtro por dono no servidor (vê tudo).
  const { data: agendamentos = [], isLoading: loadingArqo } = useArqoAgendamentosCalendario({ from, to, mineUserId: null });
  const { data: atividades = [], isLoading: loadingNexa } = useNexaAtividadesCalendario({ from, to, mineUserId: null });
  const { data: sevenAtivs = [], isLoading: loadingSeven } = useSevenAtividadesCalendario({ from, to });
  const { data: tipos } = useArqoAtividadeTipos(true);
  const tipoLabels = useMemo(
    () => Object.fromEntries((tipos ?? []).map((t) => [t.codigo, t.rotulo])),
    [tipos],
  );

  // Dono de cada evento: Arqo = responsável (ou closer); Nexa = criador; Seven = responsável (ou criador).
  const arqoOwner = (a: ArqoAgendamentoWithRelations) => a.responsavel_id ?? a.closer_id ?? null;
  const arqoOwnerName = (a: ArqoAgendamentoWithRelations) => a.responsavel?.full_name ?? a.closer?.full_name ?? null;

  // Lista de usuários (dono) presente nos eventos, para o filtro.
  const usuarios = useMemo(() => {
    const map = new Map<string, string>();
    sevenAtivs.forEach((a) => { const id = a.responsavel_id ?? a.created_by; const n = a.responsavel?.full_name ?? a.criador?.full_name; if (id && n) map.set(id, n); });
    agendamentos.forEach((a) => { const id = arqoOwner(a); const n = arqoOwnerName(a); if (id && n) map.set(id, n); });
    atividades.forEach((a) => { if (a.created_by && a.criador?.full_name) map.set(a.created_by, a.criador.full_name); });
    return [...map.entries()].sort((x, y) => x[1].localeCompare(y[1], 'pt-BR'));
  }, [sevenAtivs, agendamentos, atividades]);

  const sevenEvents: CalendarEvent[] = useMemo(() => (
    sevenAtivs
      .filter((a) => usuarioFilter === 'todos' || (a.responsavel_id ?? a.created_by) === usuarioFilter)
      .map((a) => ({
        id: `seven-${a.id}`,
        date: new Date(a.data_hora),
        title: a.titulo,
        subtitle: ['Seven', a.local, a.responsavel?.full_name ?? a.criador?.full_name].filter(Boolean).join(' · '),
        colorClass: SEVEN_COLOR,
      }))
  ), [sevenAtivs, usuarioFilter]);

  const arqoEvents: CalendarEvent[] = useMemo(() => (
    agendamentos
      .filter((a) => usuarioFilter === 'todos' || arqoOwner(a) === usuarioFilter)
      .map((a) => ({
        id: `arqo-${a.id}`,
        date: new Date(a.data_hora),
        title: a.lead?.cliente?.nome ?? tipoLabels[a.tipo] ?? 'Agendamento',
        subtitle: ['Arqo', tipoLabels[a.tipo] ?? a.tipo, AGENDAMENTO_STATUS_LABELS[a.status], arqoOwnerName(a)].filter(Boolean).join(' · '),
        colorClass: ARQO_COLOR,
        onClick: () => setSelectedArqo(a),
      }))
  ), [agendamentos, usuarioFilter, tipoLabels]);

  const nexaEvents: CalendarEvent[] = useMemo(() => (
    atividades
      .filter((a) => usuarioFilter === 'todos' || a.created_by === usuarioFilter)
      .map((a) => ({
        id: `nexa-${a.id}`,
        date: new Date(a.data_hora),
        title: a.cliente?.nome ?? a.visitante_nome ?? TIPO_ATIVIDADE_LABELS[a.tipo] ?? 'Atividade',
        subtitle: ['Nexa', TIPO_ATIVIDADE_LABELS[a.tipo], a.status ? STATUS_LABELS[a.status] : null, a.criador?.full_name].filter(Boolean).join(' · '),
        colorClass: NEXA_COLOR,
        onClick: () => setSelectedNexa(a),
      }))
  ), [atividades, usuarioFilter]);

  return (
    <MainLayout
      title="Calendários"
      subtitle="Seven, Nexa e Arqo — três agendas na mesma tela"
      actions={(
        <div className="flex flex-wrap items-center gap-2">
          <Select value={usuarioFilter} onValueChange={setUsuarioFilter}>
            <SelectTrigger className="w-[220px]"><SelectValue placeholder="Usuário" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os usuários</SelectItem>
              {usuarios.map(([id, nome]) => <SelectItem key={id} value={id}>{nome}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={() => setNovaOpen(true)}>
            <CalendarPlus className="mr-2 h-4 w-4" /> Nova atividade Seven
          </Button>
        </div>
      )}
    >
      {/* Navegador de mês único, compartilhado pelos três calendários. */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold capitalize tracking-[-0.02em]">
          {format(month, "MMMM 'de' yyyy", { locale: ptBR })}
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setMonth(new Date())}>Hoje</Button>
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setMonth(subMonths(month, 1))} aria-label="Mês anterior">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setMonth(addMonths(month, 1))} aria-label="Próximo mês">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div>
          <ColunaTitulo nome="Seven" dotClass={SEVEN_DOT} />
          <EventCalendar events={sevenEvents} month={month} onMonthChange={setMonth} loading={loadingSeven} hideHeader compact markerClass={SEVEN_DOT} />
        </div>
        <div>
          <ColunaTitulo nome="Nexa" dotClass={NEXA_DOT} />
          <EventCalendar events={nexaEvents} month={month} onMonthChange={setMonth} loading={loadingNexa} hideHeader compact markerClass={NEXA_DOT} />
        </div>
        <div>
          <ColunaTitulo nome="Arqo" dotClass={ARQO_DOT} />
          <EventCalendar events={arqoEvents} month={month} onMonthChange={setMonth} loading={loadingArqo} hideHeader compact markerClass={ARQO_DOT} />
        </div>
      </div>

      <AgendamentoDetalheDialog
        agendamento={selectedArqo}
        tipoLabels={tipoLabels}
        onOpenChange={(open) => { if (!open) setSelectedArqo(null); }}
      />
      <AtividadeDetalheDialog
        atividade={selectedNexa}
        onOpenChange={(open) => { if (!open) setSelectedNexa(null); }}
      />
      <SevenAtividadeFormDialog open={novaOpen} onOpenChange={setNovaOpen} />
    </MainLayout>
  );
}
