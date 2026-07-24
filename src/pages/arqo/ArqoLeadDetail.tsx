import { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useArqoLead, useArqoLeadEvents, useArqoEtapas, useArqoTemperaturas, useAtualizarArqoTemperatura, useTransicionarEtapa, useQualificarIA, useRegistrarTentativa } from '@/hooks/useArqo';
import { ArrowLeft, ArrowRight, Phone, Mail, Sparkles, PhoneOff, Building, Loader2, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { arqoLeadPhoneOptions } from '@/lib/arqoPhones';
import { ArqoEditarLeadDialog } from '@/components/arqo/ArqoEditarLeadDialog';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ARQO_ADMIN_ROLES = new Set(['super_admin', 'admin', 'arqo_admin', 'arqo_gestor']);
const NO_TEMPERATURE = '__none__';

const EVENTO_LABELS: Record<string, string> = {
  transicao_etapa: 'Mudança de etapa',
  atribuicao: 'Atribuição via roleta',
  tentativa_sem_resposta: 'Sem resposta',
  liberacao_consultor: 'Liberado para fila',
  atendimento_registrado: 'Atendimento registrado',
  temperatura_alterada: 'Temperatura alterada',
  agendamento_duplicado_removido: 'Agendamento duplicado corrigido',
  lead_indicado_gerado: 'Lead indicado gerado',
  indicacao_recebida: 'Lead recebido por indicação',
};

export default function ArqoLeadDetail() {
  const { user, role } = useAuth();
  const { isAdmin } = usePermissions();
  const { id } = useParams<{ id: string }>();
  const { data: lead, isLoading } = useArqoLead(id);
  const { data: events = [] } = useArqoLeadEvents(id);
  const { data: etapas = [] } = useArqoEtapas();
  const { data: temperaturas = [] } = useArqoTemperaturas();
  const transicionar = useTransicionarEtapa();
  const atualizarTemperatura = useAtualizarArqoTemperatura();
  const qualificar = useQualificarIA();
  const tentar = useRegistrarTentativa();
  const [etapaDestinoId, setEtapaDestinoId] = useState('');
  const [motivoPerda, setMotivoPerda] = useState('');
  const [editOpen, setEditOpen] = useState(false);

  const nomePorEtapaId = useMemo(() => new Map(etapas.map(e => [e.id, e.nome])), [etapas]);
  const etapasDestino = useMemo(() => etapas.filter(e => e.id !== lead?.etapa_id), [etapas, lead?.etapa_id]);
  const etapaDestino = etapasDestino.find(e => e.id === etapaDestinoId);
  const podeGerenciarAtribuicao = isAdmin() || (role ? ARQO_ADMIN_ROLES.has(role) : false);
  const podeEditar = podeGerenciarAtribuicao || lead?.consultor_id === user?.id;

  if (isLoading || !lead) {
    return (
      <MainLayout title="Lead">
        <Skeleton className="h-96" />
      </MainLayout>
    );
  }
  const phoneOptions = arqoLeadPhoneOptions(lead);

  return (
    <MainLayout
      title={lead.cliente?.nome ?? 'Lead'}
      subtitle={`Etapa: ${lead.etapa?.nome ?? '—'}`}
      actions={
        <div className="flex items-center gap-2">
          {podeEditar && (
            <Button size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" /> Editar lead
            </Button>
          )}
          <Button variant="outline" asChild size="sm">
            <Link to="/arqo/leads"><ArrowLeft className="h-4 w-4 mr-2" /> Voltar</Link>
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card className="overflow-hidden border-0 bg-[#201a17] p-6 text-white shadow-popover sm:p-7">
            <div className="mb-5 flex items-center justify-between gap-3">
              <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#ff8a39]">Dados da oportunidade</p>
              {podeEditar ? (
                <div className="flex items-center gap-2">
                  <span className="hidden text-xs font-medium text-white/55 sm:inline">Temperatura</span>
                  <Select
                    value={lead.temperatura_id ?? NO_TEMPERATURE}
                    disabled={atualizarTemperatura.isPending}
                    onValueChange={(value) => atualizarTemperatura.mutate({
                      leadId: lead.id,
                      temperaturaId: value === NO_TEMPERATURE ? null : value,
                    })}
                  >
                    <SelectTrigger className="h-9 w-[170px] rounded-full border-white/15 bg-white/10 text-xs font-semibold text-white hover:bg-white/15 [&>svg]:text-white/60">
                      {atualizarTemperatura.isPending
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <SelectValue placeholder="Não definida" />}
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_TEMPERATURE}>Não definida</SelectItem>
                      {temperaturas.map((temperatura) => (
                        <SelectItem key={temperatura.id} value={temperatura.id}>
                          <span className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: temperatura.cor }} />
                            {temperatura.nome}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : lead.temperatura ? (
                <Badge className="border-0 px-3 py-1 text-xs font-semibold" style={{ backgroundColor: lead.temperatura.cor, color: '#fff' }}>
                  {lead.temperatura.nome}
                </Badge>
              ) : null}
            </div>
            <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              {phoneOptions.map((phone) => (
                <div key={phone.value} className="flex items-center gap-2 rounded-xl bg-white/[.07] px-3 py-2.5">
                  <Phone className="h-4 w-4 text-[#ff8a39]" />
                  <span><span className="text-white/45">{phone.label}: </span>{phone.value}</span>
                </div>
              ))}
              {lead.cliente?.email && <div className="flex items-center gap-2 rounded-xl bg-white/[.07] px-3 py-2.5"><Mail className="h-4 w-4 text-[#ff8a39]" /> {lead.cliente.email}</div>}
              {lead.empreendimento && <div className="flex items-center gap-2 rounded-xl bg-white/[.07] px-3 py-2.5"><Building className="h-4 w-4 text-[#ff8a39]" /> {lead.empreendimento.nome}</div>}
              {lead.valor_estimado != null && <div className="rounded-xl bg-white/[.07] px-3 py-2.5">💰 R$ {Number(lead.valor_estimado).toLocaleString('pt-BR')}</div>}
              {lead.consultor && <div className="rounded-xl bg-white/[.07] px-3 py-2.5">👤 {lead.consultor.full_name}</div>}
              <div className="rounded-xl bg-white/[.07] px-3 py-2.5">Tentativas: <Badge variant="outline" className="border-white/20 text-white">{lead.tentativas_contato}</Badge></div>
            </div>
            {lead.observacoes && (
              <div className="mt-4 rounded-xl bg-white/[.07] p-3 text-sm text-white/65 whitespace-pre-wrap">{lead.observacoes}</div>
            )}
          </Card>

          {lead.qualificacao_resumo && (
            <Card className="border-primary/25 bg-primary-soft/60 p-5 shadow-none">
              <div className="flex items-center gap-2 font-medium mb-2">
                <Sparkles className="h-4 w-4 text-primary" /> Qualificação IA — score {lead.qualificacao_score}
              </div>
              <p className="text-sm text-muted-foreground">{lead.qualificacao_resumo}</p>
            </Card>
          )}

          <Card className="overflow-hidden border-black/[.07] bg-[#fffdfa] shadow-none">
            <div className="border-b border-black/[.07] p-5 sm:p-6">
              <p className="text-[10px] font-bold uppercase tracking-[.16em] text-primary">Ações rápidas</p>
              <h3 className="mt-1 text-lg font-semibold tracking-[-0.03em]">O que deseja fazer agora?</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Button
                  variant="outline"
                  className="h-auto justify-start rounded-xl border-black/10 bg-white px-4 py-3 text-left shadow-sm hover:border-primary/35 hover:bg-primary-soft/35"
                  disabled={tentar.isPending}
                  onClick={() => tentar.mutate({ leadId: lead.id })}
                >
                  {tentar.isPending ? <Loader2 className="mr-3 h-5 w-5 animate-spin" /> : <PhoneOff className="mr-3 h-5 w-5 text-primary" />}
                  <span>
                    <span className="block font-semibold">Registrar sem resposta</span>
                    <span className="block text-xs font-normal text-muted-foreground">Adiciona uma tentativa ao histórico</span>
                  </span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto justify-start rounded-xl border-black/10 bg-white px-4 py-3 text-left shadow-sm hover:border-primary/35 hover:bg-primary-soft/35"
                  disabled={qualificar.isPending}
                  onClick={() => qualificar.mutate(lead.id)}
                >
                  {qualificar.isPending ? <Loader2 className="mr-3 h-5 w-5 animate-spin" /> : <Sparkles className="mr-3 h-5 w-5 text-primary" />}
                  <span>
                    <span className="block font-semibold">Qualificar com IA</span>
                    <span className="block text-xs font-normal text-muted-foreground">Atualiza score e resumo da oportunidade</span>
                  </span>
                </Button>
              </div>
            </div>

            <div className="p-5 sm:p-6">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[.16em] text-muted-foreground">Alterar etapa</p>
                  <h3 className="mt-1 text-lg font-semibold tracking-[-0.03em]">Mover oportunidade</h3>
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground sm:mt-0">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: lead.etapa?.cor ?? '#a8a29e' }} />
                  Atualmente em <strong className="font-semibold text-foreground">{lead.etapa?.nome ?? '—'}</strong>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <Label>Escolha a etapa de destino</Label>
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {etapasDestino.map((etapa) => {
                    const selected = etapa.id === etapaDestinoId;
                    const discarded = etapa.categoria === 'descartado' || etapa.nome.toLowerCase().includes('descart');
                    return (
                      <Button
                        key={etapa.id}
                        type="button"
                        variant="outline"
                        aria-pressed={selected}
                        className={`h-auto min-h-11 justify-start rounded-xl px-3 py-2.5 text-left shadow-none ${
                          selected
                            ? 'border-primary bg-primary-soft/70 ring-2 ring-primary/15'
                            : discarded
                              ? 'border-black/15 bg-black/[.035] hover:border-black/30 hover:bg-black/[.07]'
                              : 'border-black/10 bg-white hover:border-primary/30 hover:bg-primary-soft/30'
                        }`}
                        onClick={() => {
                          setEtapaDestinoId(etapa.id);
                          setMotivoPerda('');
                        }}
                      >
                        <span className="mr-2.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: etapa.cor }} />
                        <span className="min-w-0">
                          <span className="block truncate font-semibold">{etapa.nome}</span>
                          <span className="block text-[11px] font-normal text-muted-foreground">
                            {discarded ? 'Retira da operação ativa' : 'Mover para esta etapa'}
                          </span>
                        </span>
                      </Button>
                    );
                  })}
                </div>
              </div>

              {etapaDestino?.categoria === 'perda' && (
                <div className="mt-4 space-y-2 rounded-xl border border-destructive/15 bg-destructive/[.04] p-4">
                  <Label htmlFor="motivo-perda">Motivo da perda</Label>
                  <Textarea
                    id="motivo-perda"
                    value={motivoPerda}
                    onChange={(event) => setMotivoPerda(event.target.value)}
                    placeholder="Descreva por que esta oportunidade foi perdida"
                    className="min-h-24 bg-white"
                  />
                  <p className="text-xs text-muted-foreground">Obrigatório para mover para uma etapa de perda.</p>
                </div>
              )}

              <div className="mt-4 flex justify-end">
                <Button
                  className="h-11 rounded-xl px-5"
                  disabled={!etapaDestino || transicionar.isPending || (etapaDestino.categoria === 'perda' && !motivoPerda.trim())}
                  onClick={() => {
                    if (!etapaDestino) return;
                    transicionar.mutate(
                      {
                        leadId: lead.id,
                        etapaPara: etapaDestino.id,
                        motivoPerda: etapaDestino.categoria === 'perda' ? motivoPerda.trim() : undefined,
                      },
                      {
                        onSuccess: () => {
                          setEtapaDestinoId('');
                          setMotivoPerda('');
                        },
                      },
                    );
                  }}
                >
                  {transicionar.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                  {etapaDestino ? `Mover para ${etapaDestino.nome}` : 'Selecione uma etapa'}
                </Button>
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-5">
          <p className="text-[10px] font-bold uppercase tracking-[.16em] text-primary">Histórico</p>
          <h3 className="mb-4 mt-2 text-xl font-semibold tracking-[-0.035em]">Linha do tempo</h3>
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {events.length === 0 && <p className="text-xs text-muted-foreground">Sem eventos registrados</p>}
            {events.map((ev) => (
              <div key={ev.id} className="border-l-2 border-primary pl-3 pb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{EVENTO_LABELS[ev.tipo] ?? ev.tipo}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(ev.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                  </span>
                </div>
                {ev.tipo === 'transicao_etapa' && (
                  <p className="text-xs mt-1 font-medium">
                    {nomePorEtapaId.get(ev.etapa_de) ?? '—'} → {nomePorEtapaId.get(ev.etapa_para) ?? '—'}
                  </p>
                )}
                {ev.tipo === 'atendimento_registrado' && ev.payload && (
                  <p className="mt-1 text-xs font-medium">
                    {[ev.payload.status_codigo, ev.payload.qualificacao_codigo, ev.payload.interesse_codigo, ev.payload.perfil_codigo, ev.payload.acao_codigo]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                )}
                {ev.tipo === 'temperatura_alterada' && (
                  <p className="mt-1 text-xs font-medium">
                    {temperaturas.find((item) => item.id === ev.temperatura_de)?.nome ?? 'Não definida'} →{' '}
                    {temperaturas.find((item) => item.id === ev.temperatura_para)?.nome ?? 'Não definida'}
                  </p>
                )}
                {ev.comentario && <p className="text-xs mt-1 text-muted-foreground">{ev.comentario}</p>}
              </div>
            ))}
          </div>
        </Card>
      </div>
      <ArqoEditarLeadDialog
        leadId={lead.id}
        open={editOpen}
        onOpenChange={setEditOpen}
        canManageAssignment={podeGerenciarAtribuicao}
      />
    </MainLayout>
  );
}
