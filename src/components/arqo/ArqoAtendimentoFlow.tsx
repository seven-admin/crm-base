import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Check, ChevronDown, PhoneOff, RotateCcw, UserPlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useArqoAtendimentoOpcoes, useArqoTemperaturas, useConcluirArqoAtendimento } from '@/hooks/useArqo';
import type { ArqoAtendimentoAcaoFinal, ArqoAtendimentoGrupo, ArqoFunilEtapa, ArqoLeadWithRelations } from '@/types/arqo.types';
import { LeadIndicadoDialog } from '@/components/arqo/LeadIndicadoDialog';

interface ArqoAtendimentoFlowProps {
  lead: ArqoLeadWithRelations;
  etapas: ArqoFunilEtapa[];
}

const GROUP_LABELS: Record<ArqoAtendimentoGrupo, string> = {
  status_ligacao: 'Status da ligação',
  qualificacao: 'Qualificação do contato',
  interesse: 'Interesse',
  perfil: 'Perfil identificado',
  proxima_acao: 'Próxima ação',
};

function ChoiceBlock({
  group,
  value,
  onChange,
  options,
  step,
}: {
  group: ArqoAtendimentoGrupo;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ codigo: string; rotulo: string }>;
  step: number;
}) {
  return (
    <section className="rounded-[1.5rem] border border-black/[.07] bg-[#fffdfa] p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className={cn('grid h-8 w-8 place-items-center rounded-full text-xs font-bold', value ? 'bg-primary text-primary-foreground' : 'bg-[#eee8e1] text-black/45')}>
            {value ? <Check className="h-4 w-4" /> : step}
          </span>
          <h3 className="text-lg font-semibold tracking-[-0.035em]">{GROUP_LABELS[group]}</h3>
        </div>
        {value && <Badge variant="outline">{value}</Badge>}
      </div>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {options.map((option) => (
          <button
            key={option.codigo}
            type="button"
            onClick={() => onChange(option.codigo)}
            className={cn(
              'flex min-h-12 items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition-colors',
              value === option.codigo
                ? 'border-primary bg-primary-soft text-foreground'
                : 'border-black/[.07] bg-[#f6f1eb] text-black/65 hover:border-primary/30 hover:bg-primary-soft/40',
            )}
          >
            <span className="font-bold text-primary">{option.codigo}</span>
            <span>{option.rotulo}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

export function ArqoAtendimentoFlow({ lead, etapas }: ArqoAtendimentoFlowProps) {
  const { data: options = [], isLoading } = useArqoAtendimentoOpcoes();
  const { data: temperatures = [] } = useArqoTemperaturas();
  const complete = useConcluirArqoAtendimento();
  const [status, setStatus] = useState('');
  const [qualification, setQualification] = useState('');
  const [interest, setInterest] = useState('');
  const [profile, setProfile] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [actionDate, setActionDate] = useState('');
  const [temperatureId, setTemperatureId] = useState('');
  const [observation, setObservation] = useState('');
  const [targetStage, setTargetStage] = useState('');
  const [referralOpen, setReferralOpen] = useState(false);

  const byGroup = useMemo(() => {
    const map = new Map<ArqoAtendimentoGrupo, typeof options>();
    options.forEach((option) => map.set(option.grupo, [...(map.get(option.grupo) ?? []), option]));
    return map;
  }, [options]);

  const selectedStatus = options.find((option) => option.codigo === status);
  const answered = status === 'C07';
  const terminalStatus = !!status && !answered && selectedStatus?.encerra_atendimento;
  const temperatureOptions = temperatures.filter((item) => ['Quente', 'Morno', 'Frio', 'Morto'].includes(item.nome));

  useEffect(() => {
    const suggestion = options.find((option) => option.codigo === interest)?.temperatura_sugerida_id;
    if (suggestion) setTemperatureId(suggestion);
  }, [interest, options]);

  const reset = () => {
    setStatus('');
    setQualification('');
    setInterest('');
    setProfile('');
    setNextAction('');
    setActionDate('');
    setTemperatureId('');
    setObservation('');
    setTargetStage('');
  };

  const changeStatus = (value: string) => {
    setStatus(value);
    setQualification('');
    setInterest('');
    setProfile('');
    setNextAction('');
    setActionDate('');
    setTemperatureId('');
  };

  const submit = async (finalAction: ArqoAtendimentoAcaoFinal) => {
    await complete.mutateAsync({
      leadId: lead.id,
      statusCodigo: status,
      qualificacaoCodigo: qualification || null,
      interesseCodigo: interest || null,
      perfilCodigo: profile || null,
      acaoCodigo: nextAction || null,
      acaoData: actionDate ? new Date(actionDate).toISOString() : null,
      temperaturaId: temperatureId || null,
      observacao: observation,
      acaoFinal: finalAction,
      etapaDestinoId: finalAction === 'mover_etapa' ? targetStage : null,
    });
    reset();
  };

  const fullFlowComplete = answered && qualification && interest && profile && nextAction && actionDate && temperatureId;
  const canFinish = !!observation.trim() && (terminalStatus || fullFlowComplete);
  const availableStages = etapas.filter((stage) => stage.categoria === 'ativa' && stage.id !== lead.etapa_id);

  if (isLoading) return <Card className="p-8 text-center text-sm text-muted-foreground">Carregando roteiro de atendimento...</Card>;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-[1.75rem] bg-[#201a17] p-5 text-white sm:p-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#ff8a39]">Atendimento em andamento</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">{lead.cliente?.nome ?? 'Lead'}</h2>
          <p className="mt-1 text-sm text-white/50">{lead.cliente?.telefone ?? 'Telefone não informado'} · {lead.etapa?.nome ?? 'Sem etapa'}</p>
        </div>
        <Button variant="outline" size="sm" className="border-white/15 bg-white/[.06] text-white hover:bg-white/[.12] hover:text-white" onClick={reset}>
          <RotateCcw className="mr-2 h-4 w-4" /> Reiniciar respostas
        </Button>
      </div>

      <ChoiceBlock group="status_ligacao" step={1} value={status} onChange={changeStatus} options={byGroup.get('status_ligacao') ?? []} />
      {answered && (
        <ChoiceBlock group="qualificacao" step={2} value={qualification} onChange={(value) => { setQualification(value); setInterest(''); setProfile(''); setNextAction(''); }} options={byGroup.get('qualificacao') ?? []} />
      )}
      {answered && qualification && (
        <ChoiceBlock group="interesse" step={3} value={interest} onChange={(value) => { setInterest(value); setProfile(''); setNextAction(''); }} options={byGroup.get('interesse') ?? []} />
      )}
      {answered && interest && (
        <ChoiceBlock group="perfil" step={4} value={profile} onChange={(value) => { setProfile(value); setNextAction(''); }} options={byGroup.get('perfil') ?? []} />
      )}
      {answered && profile && (
        <ChoiceBlock group="proxima_acao" step={5} value={nextAction} onChange={(value) => { setNextAction(value); setActionDate(''); }} options={byGroup.get('proxima_acao') ?? []} />
      )}
      {answered && nextAction && (
        <section className="grid gap-4 rounded-[1.5rem] border border-black/[.07] bg-[#fffdfa] p-5 sm:grid-cols-2 sm:p-6">
          <div className="space-y-2">
            <Label htmlFor="acao-data">6. Data e hora da ação *</Label>
            <Input id="acao-data" type="datetime-local" value={actionDate} onChange={(event) => setActionDate(event.target.value)} />
          </div>
          {actionDate && (
            <div className="space-y-2">
              <Label>7. Temperatura</Label>
              <Select value={temperatureId} onValueChange={setTemperatureId}>
                <SelectTrigger><SelectValue placeholder="Selecione a temperatura" /></SelectTrigger>
                <SelectContent>
                  {temperatureOptions.map((temperature) => <SelectItem key={temperature.id} value={temperature.id}>{temperature.nome}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Sugerida pelo interesse e livre para ajuste.</p>
            </div>
          )}
        </section>
      )}

      {(terminalStatus || fullFlowComplete) && (
        <section className="rounded-[1.5rem] border border-black/[.07] bg-[#fffdfa] p-5 sm:p-6">
          <div className="mb-2 flex items-center justify-between gap-3">
            <Label htmlFor="atendimento-observacao">Observação do atendimento *</Label>
            <span className="text-xs text-muted-foreground">Obrigatória para concluir</span>
          </div>
          <Textarea
            id="atendimento-observacao"
            value={observation}
            onChange={(event) => setObservation(event.target.value)}
            placeholder="Registre o contexto, o combinado e qualquer informação relevante."
            rows={4}
          />

          {answered && (
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-black/[.07] pt-4">
              <Button variant="outline" onClick={() => setReferralOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" /> Gerar lead indicado
              </Button>
              <span className="text-xs text-muted-foreground">A indicação é criada sem apagar as respostas atuais.</span>
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-black/[.07] pt-5">
            {terminalStatus ? (
              <Button onClick={() => submit('sem_resposta')} disabled={!canFinish || complete.isPending}>
                <PhoneOff className="mr-2 h-4 w-4" /> Sem resposta e encerrar atendimento
              </Button>
            ) : (
              <>
                <Button onClick={() => submit('aplicar')} disabled={!canFinish || complete.isPending}>
                  <Check className="mr-2 h-4 w-4" /> Aplicar
                </Button>
                <div className="flex min-w-[280px] flex-1 items-center gap-2 sm:flex-none">
                  <Select value={targetStage} onValueChange={setTargetStage}>
                    <SelectTrigger className="min-w-[210px]"><SelectValue placeholder="Mover para etapa..." /></SelectTrigger>
                    <SelectContent>{availableStages.map((stage) => <SelectItem key={stage.id} value={stage.id}>{stage.nome}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button variant="outline" size="icon" title="Mover para etapa" onClick={() => submit('mover_etapa')} disabled={!canFinish || !targetStage || complete.isPending}>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
                <Button variant="ghost" onClick={() => submit('liberar')} disabled={!canFinish || complete.isPending}>
                  Liberar lead <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </section>
      )}

      <LeadIndicadoDialog
        open={referralOpen}
        onOpenChange={setReferralOpen}
        leadOrigemId={lead.id}
        empreendimentoId={lead.empreendimento_id}
      />
    </div>
  );
}
