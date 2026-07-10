import { useMemo, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useArqoGrupos, useArqoLeads, useAtribuirRoleta, useLiberarConsultor, useRegistrarTentativa, useTransicionarEtapa, useArqoEtapas } from '@/hooks/useArqo';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Phone, Mail, UserCheck, PhoneOff, ArrowRight, Upload } from 'lucide-react';
import { ArqoImportarLeadsDialog } from '@/components/arqo/ArqoImportarLeadsDialog';

export default function ArqoRoleta() {
  const { user } = useAuth();
  const { data: grupos = [] } = useArqoGrupos();
  const [grupoId, setGrupoId] = useState<string>('');
  const [importOpen, setImportOpen] = useState(false);
  const { data: allLeads = [], isLoading } = useArqoLeads();
  const { data: etapas = [] } = useArqoEtapas();
  const atribuir = useAtribuirRoleta();
  const liberar = useLiberarConsultor();
  const tentar = useRegistrarTentativa();
  const transicionar = useTransicionarEtapa();

  // Lead atual do consultor (bloqueio 1:1)
  const meuLeadAtivo = useMemo(() => allLeads.find(l => l.consultor_id === user?.id && !l.fechado_em), [allLeads, user]);
  // Fila do grupo: leads sem consultor no grupo selecionado
  const fila = useMemo(() => allLeads.filter(l => l.grupo_id === grupoId && !l.consultor_id).slice(0, 20), [allLeads, grupoId]);

  const proximoLead = fila[0];

  const etapaPerdido = etapas.find(e => e.categoria === 'perda');
  const etapaGanho = etapas.find(e => e.categoria === 'ganho');

  return (
    <MainLayout title="Arqo — Roleta de Leads" subtitle="Distribuição bloqueante 1:1 por grupo de atendimento">
      <div className="mb-6 flex items-center gap-3">
        <div className="w-64">
          <Select value={grupoId} onValueChange={setGrupoId}>
            <SelectTrigger><SelectValue placeholder="Selecione um grupo" /></SelectTrigger>
            <SelectContent>
              {grupos.map(g => <SelectItem key={g.id} value={g.id}>{g.nome}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {grupoId && proximoLead && !meuLeadAtivo && (
          <Button
            onClick={() => atribuir.mutate({ grupoId, leadId: proximoLead.id })}
            disabled={atribuir.isPending}
          >
            {atribuir.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Puxar próximo lead
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Meu lead ativo */}
        <div className="lg:col-span-2">
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Meu lead ativo</h2>
          {isLoading ? (
            <Card className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></Card>
          ) : !meuLeadAtivo ? (
            <Card className="p-8 text-center text-muted-foreground">
              Nenhum lead ativo. Selecione um grupo e puxe o próximo lead da fila.
            </Card>
          ) : (
            <Card className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold">{meuLeadAtivo.cliente?.nome ?? '—'}</h3>
                  <p className="text-sm text-muted-foreground">Etapa atual: {meuLeadAtivo.etapa?.nome}</p>
                </div>
                {meuLeadAtivo.temperatura && (
                  <Badge style={{ backgroundColor: meuLeadAtivo.temperatura.cor, color: '#fff' }}>
                    {meuLeadAtivo.temperatura.nome}
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                {meuLeadAtivo.cliente?.telefone && (
                  <div className="flex items-center gap-2"><Phone className="h-4 w-4" /> {meuLeadAtivo.cliente.telefone}</div>
                )}
                {meuLeadAtivo.cliente?.email && (
                  <div className="flex items-center gap-2"><Mail className="h-4 w-4" /> {meuLeadAtivo.cliente.email}</div>
                )}
                {meuLeadAtivo.empreendimento && <div>🏢 {meuLeadAtivo.empreendimento.nome}</div>}
                {meuLeadAtivo.valor_estimado != null && <div>💰 R$ {Number(meuLeadAtivo.valor_estimado).toLocaleString('pt-BR')}</div>}
              </div>

              <div className="text-sm">
                <span className="text-muted-foreground">Tentativas de contato:</span>{' '}
                <Badge variant="outline">{meuLeadAtivo.tentativas_contato}</Badge>
              </div>

              {meuLeadAtivo.qualificacao_resumo && (
                <div className="p-3 bg-muted rounded-lg text-sm">
                  <div className="font-medium mb-1">Qualificação IA (score {meuLeadAtivo.qualificacao_score})</div>
                  {meuLeadAtivo.qualificacao_resumo}
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-4 border-t">
                <Button variant="outline" size="sm" onClick={() => tentar.mutate({ leadId: meuLeadAtivo.id })}>
                  <PhoneOff className="h-4 w-4 mr-2" /> Sem resposta
                </Button>
                {etapas.filter(e => e.categoria === 'ativa' && e.id !== meuLeadAtivo.etapa_id).slice(0, 3).map(e => (
                  <Button key={e.id} variant="outline" size="sm"
                    onClick={() => transicionar.mutate({ leadId: meuLeadAtivo.id, etapaPara: e.id })}>
                    <ArrowRight className="h-4 w-4 mr-1" /> {e.nome}
                  </Button>
                ))}
                {etapaGanho && (
                  <Button size="sm" onClick={() => transicionar.mutate({ leadId: meuLeadAtivo.id, etapaPara: etapaGanho.id })}>
                    <UserCheck className="h-4 w-4 mr-2" /> Ganho
                  </Button>
                )}
                {etapaPerdido && (
                  <Button variant="destructive" size="sm"
                    onClick={() => {
                      const motivo = prompt('Motivo da perda:');
                      if (motivo) transicionar.mutate({ leadId: meuLeadAtivo.id, etapaPara: etapaPerdido.id, motivoPerda: motivo });
                    }}>
                    Perder
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => liberar.mutate(meuLeadAtivo.id)}>
                  Liberar
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Fila do grupo */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
            Fila do grupo {grupoId ? `(${fila.length})` : ''}
          </h2>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {!grupoId && <Card className="p-4 text-sm text-muted-foreground text-center">Selecione um grupo</Card>}
            {grupoId && fila.length === 0 && <Card className="p-4 text-sm text-muted-foreground text-center">Fila vazia</Card>}
            {fila.map((l, idx) => (
              <Card key={l.id} className={`p-3 text-sm ${idx === 0 ? 'border-primary border-2' : ''}`}>
                <div className="font-medium truncate">{l.cliente?.nome ?? '—'}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {l.cliente?.telefone ?? l.cliente?.email ?? 'sem contato'}
                </div>
                {l.temperatura && (
                  <Badge className="mt-1 text-xs" style={{ backgroundColor: l.temperatura.cor, color: '#fff' }}>
                    {l.temperatura.nome}
                  </Badge>
                )}
              </Card>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
