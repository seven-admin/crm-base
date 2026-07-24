import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, CalendarClock, Check, ChevronDown, PhoneOff, RotateCcw, UserPlus } from 'lucide-react';
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
import { ArqoCallDialog } from '@/components/arqo/ArqoCallDialog';
import { arqoLeadPhoneOptions } from '@/lib/arqoPhones';

interface ArqoAtendimentoFlowProps {
  lead: ArqoLeadWithRelations;
  etapas: ArqoFunilEtapa[];
}

type WizardStepId = ArqoAtendimentoGrupo | 'temperatura' | 'conclusao';

const GROUP_LABELS: Record<ArqoAtendimentoGrupo, string> = {
  status_ligacao: 'Status da ligação',
  qualificacao: 'Qualificação do contato',
  interesse: 'Interesse',
  perfil: 'Perfil identificado',
  proxima_acao: 'Próxima ação',
};

const WIZARD_STEPS: Array<{ id: WizardStepId; shortLabel: string }> = [
  { id: 'status_ligacao', shortLabel: 'Ligação' },
  { id: 'qualificacao', shortLabel: 'Qualificação' },
  { id: 'interesse', shortLabel: 'Interesse' },
  { id: 'perfil', shortLabel: 'Perfil' },
  { id: 'proxima_acao', shortLabel: 'Próxima ação' },
  { id: 'temperatura', shortLabel: 'Temperatura' },
  { id: 'conclusao', shortLabel: 'Conclusão' },
];

function ChoicePanel({
  group,
  value,
  onChange,
  options,
}: {
  group: ArqoAtendimentoGrupo;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ codigo: string; rotulo: string }>;
}) {
  return (
    <section>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">Selecione uma resposta</p>
          <h3 className="mt-1 text-2xl font-semibold tracking-[-0.04em]">{GROUP_LABELS[group]}</h3>
        </div>
        {value && <Badge variant="outline">Resposta {value}</Badge>}
      </div>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {options.map((option) => (
          <button
            key={option.codigo}
            type="button"
            onClick={() => onChange(option.codigo)}
            className={cn(
              'flex min-h-14 items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition-all',
              value === option.codigo
                ? 'border-primary bg-primary-soft text-foreground shadow-sm'
                : 'border-black/[.07] bg-[#f6f1eb] text-black/65 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary-soft/40',
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

function localDateTimeMinimum() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

export function ArqoAtendimentoFlow({ lead, etapas }: ArqoAtendimentoFlowProps) {
  const { data: options = [], isLoading } = useArqoAtendimentoOpcoes();
  const { data: temperatures = [] } = useArqoTemperaturas();
  const complete = useConcluirArqoAtendimento();
  const submittingRef = useRef(false);
  const [currentStep, setCurrentStep] = useState<WizardStepId>('status_ligacao');
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
  const selectedNextAction = options.find((option) => option.codigo === nextAction && option.grupo === 'proxima_acao');
  const answered = status === 'C07';
  const terminalStatus = !!status && !answered && !!selectedStatus?.encerra_atendimento;
  const requiresActionDate = !!selectedNextAction?.exige_data;
  const validFutureActionDate = !!actionDate && new Date(actionDate).getTime() > Date.now();
  const temperatureOptions = temperatures.filter((item) => ['Quente', 'Morno', 'Frio', 'Morto'].includes(item.nome));

  useEffect(() => {
    const suggestion = options.find((option) => option.codigo === interest)?.temperatura_sugerida_id;
    if (suggestion) setTemperatureId(suggestion);
  }, [interest, options]);

  const reset = () => {
    setCurrentStep('status_ligacao');
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
    const statusOption = options.find((option) => option.codigo === value);
    setStatus(value);
    setQualification('');
    setInterest('');
    setProfile('');
    setNextAction('');
    setActionDate('');
    setTemperatureId('');
    setCurrentStep(value === 'C07' ? 'qualificacao' : statusOption?.encerra_atendimento ? 'conclusao' : 'status_ligacao');
  };

  const changeNextAction = (value: string) => {
    const actionOption = options.find((option) => option.codigo === value && option.grupo === 'proxima_acao');
    setNextAction(value);
    setActionDate('');
    if (!actionOption?.exige_data) setCurrentStep('temperatura');
  };

  const submit = async (finalAction: ArqoAtendimentoAcaoFinal) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      await complete.mutateAsync({
        leadId: lead.id,
        statusCodigo: status,
        qualificacaoCodigo: qualification || null,
        interesseCodigo: interest || null,
        perfilCodigo: profile || null,
        acaoCodigo: nextAction || null,
        acaoData: requiresActionDate && actionDate ? new Date(actionDate).toISOString() : null,
        temperaturaId: temperatureId || null,
        observacao: observation,
        acaoFinal: finalAction,
        etapaDestinoId: finalAction === 'mover_etapa' ? targetStage : null,
      });
      reset();
    } finally {
      submittingRef.current = false;
    }
  };

  const fullFlowComplete = answered && !!qualification && !!interest && !!profile && !!nextAction
    && (!requiresActionDate || validFutureActionDate) && !!temperatureId;
  const canFinish = !!observation.trim() && (terminalStatus || fullFlowComplete);
  const availableStages = etapas.filter((stage) => stage.categoria === 'ativa' && stage.id !== lead.etapa_id);

  const completedSteps = useMemo(() => new Set<WizardStepId>([
    ...(status ? ['status_ligacao' as const] : []),
    ...(qualification ? ['qualificacao' as const] : []),
    ...(interest ? ['interesse' as const] : []),
    ...(profile ? ['perfil' as const] : []),
    ...(nextAction && (!requiresActionDate || validFutureActionDate) ? ['proxima_acao' as const] : []),
    ...(temperatureId ? ['temperatura' as const] : []),
  ]), [interest, nextAction, profile, qualification, requiresActionDate, status, temperatureId, validFutureActionDate]);

  const unlockedSteps = useMemo(() => new Set<WizardStepId>([
    'status_ligacao',
    ...(answered ? ['qualificacao' as const] : []),
    ...(answered && qualification ? ['interesse' as const] : []),
    ...(answered && interest ? ['perfil' as const] : []),
    ...(answered && profile ? ['proxima_acao' as const] : []),
    ...(answered && nextAction && (!requiresActionDate || validFutureActionDate) ? ['temperatura' as const] : []),
    ...(terminalStatus || fullFlowComplete ? ['conclusao' as const] : []),
  ]), [answered, fullFlowComplete, interest, nextAction, profile, qualification, requiresActionDate, terminalStatus, validFutureActionDate]);

  const visibleSteps = terminalStatus
    ? WIZARD_STEPS.filter((step) => step.id === 'status_ligacao' || step.id === 'conclusao')
    : WIZARD_STEPS;

  if (isLoading) return <Card className="p-8 text-center text-sm text-muted-foreground">Carregando roteiro de atendimento...</Card>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-[1.75rem] bg-[#201a17] p-5 text-white sm:p-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#ff8a39]">Atendimento em andamento</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">{lead.cliente?.nome ?? 'Lead'}</h2>
          <p className="mt-1 text-sm text-white/50">
            {arqoLeadPhoneOptions(lead).map((phone) => phone.value).join(' · ') || 'Telefone não informado'}
          </p>
          <p className="mt-1 text-xs text-white/35">{lead.etapa?.nome ?? 'Sem etapa'}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ArqoCallDialog lead={lead} />
          <Button variant="outline" size="sm" className="border-white/15 bg-white/[.06] text-white hover:bg-white/[.12] hover:text-white" onClick={reset}>
            <RotateCcw className="mr-2 h-4 w-4" /> Reiniciar respostas
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden rounded-[1.75rem] border-black/[.07] bg-[#fffdfa] shadow-none">
        <div className="overflow-x-auto border-b border-black/[.07] bg-[#f6f1eb]/70 px-4 py-4 sm:px-6">
          <ol className="flex min-w-max items-start" aria-label="Etapas do atendimento">
            {visibleSteps.map((step, index) => {
              const completed = completedSteps.has(step.id);
              const active = currentStep === step.id;
              const unlocked = unlockedSteps.has(step.id);
              return (
                <li key={step.id} className="flex items-start">
                  <button
                    type="button"
                    disabled={!unlocked}
                    onClick={() => setCurrentStep(step.id)}
                    className={cn('group flex w-24 flex-col items-center gap-2 text-center sm:w-28', !unlocked && 'cursor-not-allowed opacity-35')}
                    aria-current={active ? 'step' : undefined}
                  >
                    <span className={cn(
                      'grid h-9 w-9 place-items-center rounded-full border text-xs font-bold transition-colors',
                      active && 'border-primary bg-primary text-primary-foreground ring-4 ring-primary/10',
                      completed && !active && 'border-primary bg-primary-soft text-primary',
                      !completed && !active && 'border-black/10 bg-white text-black/40',
                    )}>
                      {completed ? <Check className="h-4 w-4" /> : index + 1}
                    </span>
                    <span className={cn('text-[11px] font-semibold', active ? 'text-foreground' : 'text-muted-foreground')}>{step.shortLabel}</span>
                  </button>
                  {index < visibleSteps.length - 1 && (
                    <span className={cn('mt-4 h-px w-5 sm:w-8', completed ? 'bg-primary/50' : 'bg-black/10')} />
                  )}
                </li>
              );
            })}
          </ol>
        </div>

        <div className="min-h-[360px] p-5 sm:p-7">
          {currentStep === 'status_ligacao' && (
            <ChoicePanel group="status_ligacao" value={status} onChange={changeStatus} options={byGroup.get('status_ligacao') ?? []} />
          )}
          {currentStep === 'qualificacao' && (
            <ChoicePanel group="qualificacao" value={qualification} onChange={(value) => { setQualification(value); setInterest(''); setProfile(''); setNextAction(''); setActionDate(''); setTemperatureId(''); setCurrentStep('interesse'); }} options={byGroup.get('qualificacao') ?? []} />
          )}
          {currentStep === 'interesse' && (
            <ChoicePanel group="interesse" value={interest} onChange={(value) => { setInterest(value); setProfile(''); setNextAction(''); setActionDate(''); setCurrentStep('perfil'); }} options={byGroup.get('interesse') ?? []} />
          )}
          {currentStep === 'perfil' && (
            <ChoicePanel group="perfil" value={profile} onChange={(value) => { setProfile(value); setNextAction(''); setActionDate(''); setCurrentStep('proxima_acao'); }} options={byGroup.get('perfil') ?? []} />
          )}
          {currentStep === 'proxima_acao' && (
            <div className="space-y-6">
              <ChoicePanel group="proxima_acao" value={nextAction} onChange={changeNextAction} options={byGroup.get('proxima_acao') ?? []} />
              {nextAction && requiresActionDate && (
                <div className="flex flex-col gap-4 rounded-2xl border border-primary/15 bg-primary-soft/45 p-4 sm:flex-row sm:items-end">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="acao-data" className="flex items-center gap-2"><CalendarClock className="h-4 w-4 text-primary" /> Data e hora do agendamento *</Label>
                    <Input id="acao-data" type="datetime-local" min={localDateTimeMinimum()} value={actionDate} onChange={(event) => setActionDate(event.target.value)} />
                    {actionDate && !validFutureActionDate && <p className="text-xs text-destructive">Escolha uma data e hora futuras.</p>}
                  </div>
                  <Button type="button" disabled={!validFutureActionDate} onClick={() => setCurrentStep('temperatura')}>
                    Continuar <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
          {currentStep === 'temperatura' && (
            <section className="mx-auto max-w-xl">
              <p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">Classificação do atendimento</p>
              <h3 className="mt-1 text-2xl font-semibold tracking-[-0.04em]">Temperatura do lead</h3>
              <p className="mt-2 text-sm text-muted-foreground">A sugestão vem do interesse informado, mas você pode ajustá-la.</p>
              <div className="mt-6 space-y-2">
                <Label>Temperatura *</Label>
                <Select value={temperatureId} onValueChange={(value) => { setTemperatureId(value); setCurrentStep('conclusao'); }}>
                  <SelectTrigger className="h-12"><SelectValue placeholder="Selecione a temperatura" /></SelectTrigger>
                  <SelectContent>
                    {temperatureOptions.map((temperature) => <SelectItem key={temperature.id} value={temperature.id}>{temperature.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </section>
          )}
          {currentStep === 'conclusao' && (terminalStatus || fullFlowComplete) && (
            <section>
              <div className="mb-5">
                <p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">Última etapa</p>
                <h3 className="mt-1 text-2xl font-semibold tracking-[-0.04em]">Concluir atendimento</h3>
                <p className="mt-2 text-sm text-muted-foreground">A data e a hora da gravação serão registradas automaticamente.</p>
              </div>
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

              {(answered || status === 'C02') && (
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-black/[.07] pt-4">
                  <Button variant="outline" onClick={() => setReferralOpen(true)}>
                    <UserPlus className="mr-2 h-4 w-4" /> Gerar lead indicado
                  </Button>
                  <span className="text-xs text-muted-foreground">A indicação é criada sem apagar as respostas atuais.</span>
                </div>
              )}

              <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-black/[.07] pt-5">
                <p className="w-full text-xs text-muted-foreground">
                  Escolha somente uma ação final. Não é necessário salvar antes de mover ou liberar o lead.
                </p>
                {terminalStatus ? (
                  <Button onClick={() => submit('sem_resposta')} disabled={!canFinish || complete.isPending}>
                    <PhoneOff className="mr-2 h-4 w-4" /> Salvar sem resposta e liberar
                  </Button>
                ) : (
                  <>
                    <Button onClick={() => submit('aplicar')} disabled={!canFinish || complete.isPending}>
                      <Check className="mr-2 h-4 w-4" /> Salvar e manter comigo
                    </Button>
                    <div className="flex min-w-[280px] flex-1 items-center gap-2 sm:flex-none">
                      <Select value={targetStage} onValueChange={setTargetStage}>
                        <SelectTrigger className="min-w-[210px]"><SelectValue placeholder="Mover para etapa..." /></SelectTrigger>
                        <SelectContent>{availableStages.map((stage) => <SelectItem key={stage.id} value={stage.id}>{stage.nome}</SelectItem>)}</SelectContent>
                      </Select>
                      <Button variant="outline" onClick={() => submit('mover_etapa')} disabled={!canFinish || !targetStage || complete.isPending}>
                        <ArrowRight className="mr-2 h-4 w-4" /> Salvar e mover
                      </Button>
                    </div>
                    <Button variant="ghost" onClick={() => submit('liberar')} disabled={!canFinish || complete.isPending}>
                      Salvar e liberar para fila <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </section>
          )}
        </div>
      </Card>

      <LeadIndicadoDialog
        open={referralOpen}
        onOpenChange={setReferralOpen}
        leadOrigemId={lead.id}
        empreendimentoId={lead.empreendimento_id}
      />
    </div>
  );
}
