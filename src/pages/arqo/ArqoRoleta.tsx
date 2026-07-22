import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  useArqoLeads, useArqoLead, useAtribuirRoleta, useLiberarConsultor,
  useRegistrarTentativa, useTransicionarEtapa, useArqoEtapas, useMeusArqoGrupos,
} from '@/hooks/useArqo';
import { useAuth } from '@/contexts/AuthContext';
import {
  Loader2, Phone, Mail, PhoneOff, ArrowRight, Upload, Users, Clock,
} from 'lucide-react';
import { ArqoImportarLeadsDialog } from '@/components/arqo/ArqoImportarLeadsDialog';
import { toast } from 'sonner';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

export default function ArqoRoleta() {
  const { user } = useAuth();
  const [importOpen, setImportOpen] = useState(false);
  const [observacao, setObservacao] = useState('');
  const [novaEtapaId, setNovaEtapaId] = useState<string>('');
  const [grupoPuxandoId, setGrupoPuxandoId] = useState<string | null>(null);
  const [leadEmTratamentoId, setLeadEmTratamentoId] = useState<string | null>(null);

  const { data: meusGrupos = [], isLoading: loadingGrupos } = useMeusArqoGrupos(user?.id);
  const { data: allLeads = [], isLoading } = useArqoLeads();
  const { data: leadEmTratamento, isLoading: loadingLeadEmTratamento } = useArqoLead(leadEmTratamentoId ?? undefined);
  const { data: etapas = [] } = useArqoEtapas();

  const atribuir = useAtribuirRoleta();
  const liberar = useLiberarConsultor();
  const tentar = useRegistrarTentativa();
  const transicionar = useTransicionarEtapa();

  // Leads em etapas com bloqueia_roleta=false (ex: Aguardando Followup, Reagendar) ficam
  // vinculados ao consultor como pendência, mas não impedem puxar um novo lead.
  const meuLeadAtivo = useMemo(() => {
    const leadPuxadoValido = leadEmTratamento
      && leadEmTratamento.consultor_id === user?.id
      && !leadEmTratamento.fechado_em
      && leadEmTratamento.etapa?.bloqueia_roleta !== false;

    if (leadPuxadoValido) return leadEmTratamento;

    return allLeads.find(l => l.consultor_id === user?.id && !l.fechado_em && l.etapa?.bloqueia_roleta !== false);
  }, [allLeads, leadEmTratamento, user]);

  const minhasPendencias = useMemo(
    () => allLeads.filter(l => l.consultor_id === user?.id && !l.fechado_em && l.etapa?.bloqueia_roleta === false),
    [allLeads, user],
  );

  // Contagem de leads aguardando por grupo do usuário
  const contagemPorGrupo = useMemo(() => {
    const map = new Map<string, number>();
    meusGrupos.forEach(g => map.set(g.id, 0));
    allLeads.forEach(l => {
      if (l.grupo_id && !l.consultor_id && map.has(l.grupo_id)) {
        map.set(l.grupo_id, (map.get(l.grupo_id) ?? 0) + 1);
      }
    });
    return map;
  }, [allLeads, meusGrupos]);

  const etapasAtivasDisponiveis = etapas.filter(
    e => e.categoria === 'ativa' && e.id !== meuLeadAtivo?.etapa_id,
  );

  const exigeObservacao = (): boolean => {
    if (!observacao.trim()) {
      toast.error('Adicione uma observação sobre o atendimento antes de registrar a ação.');
      return false;
    }
    return true;
  };

  const limparObs = () => {
    setObservacao('');
    setNovaEtapaId('');
  };

  const handleSemResposta = () => {
    if (!meuLeadAtivo || !exigeObservacao()) return;
    tentar.mutate(
      { leadId: meuLeadAtivo.id, comentario: observacao },
      { onSuccess: limparObs },
    );
  };

  const handleTransicao = (etapaPara: string) => {
    if (!meuLeadAtivo || !exigeObservacao()) return;
    transicionar.mutate(
      { leadId: meuLeadAtivo.id, etapaPara, comentario: observacao },
      { onSuccess: limparObs },
    );
  };

  const handleLiberar = () => {
    if (!meuLeadAtivo || !exigeObservacao()) return;
    liberar.mutate(
      { leadId: meuLeadAtivo.id, comentario: observacao },
      { onSuccess: limparObs },
    );
  };

  // Puxar próximo lead: a RPC escolhe e bloqueia o próximo lead disponível do grupo.
  const puxarProximo = (grupoId: string) => {
    const temLeadNaFila = allLeads.some(l => l.grupo_id === grupoId && !l.consultor_id);
    if (!temLeadNaFila) {
      toast.info('Nenhum lead disponível neste grupo no momento.');
      return;
    }
    setGrupoPuxandoId(grupoId);
    atribuir.mutate(
      { grupoId },
      {
        onSuccess: (leadId) => setLeadEmTratamentoId(leadId),
        onSettled: () => setGrupoPuxandoId(null),
      },
    );
  };

  return (
    <MainLayout
      title="Arqo — Meu Atendimento"
      subtitle="Puxe o próximo lead do seu grupo e registre cada interação"
      actions={
        <Button variant="outline" onClick={() => setImportOpen(true)}>
          <Upload className="h-4 w-4 mr-2" /> Importar leads
        </Button>
      }
    >
      <ArqoImportarLeadsDialog open={importOpen} onOpenChange={setImportOpen} />

      {/* Mini dash — grupos do usuário */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
          Meus grupos de atendimento
        </h2>
        {loadingGrupos ? (
          <Card className="p-6 flex justify-center"><Loader2 className="h-5 w-5 animate-spin" /></Card>
        ) : meusGrupos.length === 0 ? (
          <Card className="p-6 text-center text-sm text-muted-foreground">
            Você não está vinculado a nenhum grupo de atendimento. Solicite ao gestor Arqo para incluí-lo.
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {meusGrupos.map(g => {
              const qtd = contagemPorGrupo.get(g.id) ?? 0;
              return (
                <Card key={g.id} className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" /> {g.papel === 'closer' ? 'Closer' : 'Consultor'}
                      </div>
                      <h3 className="font-semibold text-sm truncate">{g.nome}</h3>
                    </div>
                    <Badge variant="secondary" className="text-lg font-bold px-3">
                      {qtd}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    {qtd === 0 ? 'Nenhum lead aguardando' : `${qtd} lead${qtd > 1 ? 's' : ''} aguardando atendimento`}
                  </p>
                  <Button
                    className="w-full"
                    size="sm"
                    disabled={qtd === 0 || grupoPuxandoId === g.id}
                    onClick={() => puxarProximo(g.id)}
                  >
                    {grupoPuxandoId === g.id && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Puxar próximo lead
                  </Button>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Painel de atendimento */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
          Atendimento em andamento
        </h2>
        {isLoading ? (
          <Card className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></Card>
        ) : !meuLeadAtivo ? (
          <Card className="p-8 text-center text-muted-foreground">
            Nenhum lead ativo. Puxe o próximo lead de um dos seus grupos acima.
          </Card>
        ) : (
          <Card className="p-6 space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold">{meuLeadAtivo.cliente?.nome ?? '—'}</h3>
                <p className="text-sm text-muted-foreground">
                  Etapa atual: <span className="font-medium">{meuLeadAtivo.etapa?.nome}</span>
                </p>
              </div>
              {meuLeadAtivo.temperatura && (
                <Badge style={{ backgroundColor: meuLeadAtivo.temperatura.cor, color: '#fff' }}>
                  {meuLeadAtivo.temperatura.nome}
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              {meuLeadAtivo.cliente?.telefone && (
                <div className="flex items-center gap-2"><Phone className="h-4 w-4" /> {meuLeadAtivo.cliente.telefone}</div>
              )}
              {meuLeadAtivo.cliente?.email && (
                <div className="flex items-center gap-2"><Mail className="h-4 w-4" /> {meuLeadAtivo.cliente.email}</div>
              )}
              {meuLeadAtivo.empreendimento && <div>🏢 {meuLeadAtivo.empreendimento.nome}</div>}
              {meuLeadAtivo.valor_estimado != null && (
                <div>💰 R$ {Number(meuLeadAtivo.valor_estimado).toLocaleString('pt-BR')}</div>
              )}
              <div>
                <span className="text-muted-foreground">Tentativas de contato:</span>{' '}
                <Badge variant="outline">{meuLeadAtivo.tentativas_contato}</Badge>
              </div>
            </div>

            {meuLeadAtivo.qualificacao_resumo && (
              <div className="p-3 bg-muted rounded-lg text-sm">
                <div className="font-medium mb-1">Qualificação IA (score {meuLeadAtivo.qualificacao_score})</div>
                {meuLeadAtivo.qualificacao_resumo}
              </div>
            )}

            {/* Observação obrigatória */}
            <div className="space-y-2 pt-2 border-t">
              <Label htmlFor="obs-atendimento">
                Observação do atendimento <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="obs-atendimento"
                placeholder="Descreva o que foi tratado com o cliente, próximos passos combinados, motivos, etc."
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Obrigatório em toda ação (sem resposta, transição de etapa, ganho, perda ou liberação).
              </p>
            </div>

            {/* Ações */}
            <div className="flex flex-wrap gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={handleSemResposta} disabled={tentar.isPending}>
                <PhoneOff className="h-4 w-4 mr-2" /> Sem resposta
              </Button>

              <div className="flex items-center gap-2">
                <Select value={novaEtapaId} onValueChange={setNovaEtapaId}>
                  <SelectTrigger className="w-56 h-9">
                    <SelectValue placeholder="Mover para etapa..." />
                  </SelectTrigger>
                  <SelectContent>
                    {etapasAtivasDisponiveis.map(e => (
                      <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!novaEtapaId || transicionar.isPending}
                  onClick={() => handleTransicao(novaEtapaId)}
                >
                  <ArrowRight className="h-4 w-4 mr-1" /> Aplicar
                </Button>
              </div>

              <Button variant="ghost" size="sm" onClick={handleLiberar} disabled={liberar.isPending}>
                Liberar lead
              </Button>
            </div>

            <p className="text-xs text-muted-foreground pt-2 border-t">
              <strong>Liberar</strong> devolve este lead à fila do grupo para que outro consultor possa puxá-lo.
              O lead permanece na mesma etapa e não é encerrado.
            </p>
          </Card>
        )}
      </section>

      {/* Pendências: leads em followup/reagendamento — não bloqueiam novos leads */}
      {minhasPendencias.length > 0 && (
        <section className="mt-6">
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide flex items-center gap-2">
            <Clock className="h-4 w-4" /> Pendências ({minhasPendencias.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {minhasPendencias.map(l => (
              <Link key={l.id} to={`/arqo/leads/${l.id}`}>
                <Card className="p-4 hover:shadow-md transition-shadow h-full">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-medium text-sm truncate">{l.cliente?.nome ?? '—'}</span>
                    <Badge style={{ backgroundColor: l.etapa?.cor, color: '#fff' }} className="text-xs shrink-0">
                      {l.etapa?.nome}
                    </Badge>
                  </div>
                  {l.cliente?.telefone && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3" /> {l.cliente.telefone}
                    </div>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
    </MainLayout>
  );
}
