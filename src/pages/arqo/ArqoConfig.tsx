import { MainLayout } from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useArqoEtapas, useArqoTemperaturas, useArqoSources, useArqoGrupos, useArqoSlaRegras, useArqoRegua, useArqoAtendimentoOpcoes, useArqoMetasAtendimento, useArqoPerformanceConfigs } from '@/hooks/useArqo';
import { ArqoConfigCrud, type ConfigField } from '@/components/arqo/ArqoConfigCrud';
import { ArqoGrupoMembros } from '@/components/arqo/ArqoGrupoMembros';
import { ArqoMetasManager } from '@/components/arqo/ArqoMetasManager';
import { useProfilesByRoles } from '@/hooks/useFuncionariosSeven';

export default function ArqoConfig() {
  const { data: etapas = [] } = useArqoEtapas();
  const { data: temps = [] } = useArqoTemperaturas();
  const { data: sources = [] } = useArqoSources();
  const { data: grupos = [] } = useArqoGrupos();
  const { data: sla = [] } = useArqoSlaRegras();
  const { data: regua = [] } = useArqoRegua();
  const { data: atendimentoOpcoes = [] } = useArqoAtendimentoOpcoes(true);
  const { data: metas = [] } = useArqoMetasAtendimento();
  const { data: performanceConfigs = [] } = useArqoPerformanceConfigs();
  const { data: profiles = [] } = useProfilesByRoles(['arqo_admin', 'arqo_gestor', 'arqo_consultor', 'arqo_closer', 'super_admin']);
  const { data: closerProfiles = [] } = useProfilesByRoles(['arqo_closer', 'super_admin']);

  const etapaOptions = etapas.map(e => ({ value: e.id, label: e.nome }));
  const tempOptions = [{ value: '__none__', label: '— Todas —' }, ...temps.map(t => ({ value: t.id, label: t.nome }))];

  const sourceFields: ConfigField[] = [
    { name: 'nome', label: 'Nome', type: 'text', required: true },
    { name: 'descricao', label: 'Descrição', type: 'textarea' },
    { name: 'ordem', label: 'Ordem', type: 'number', default: 0 },
    { name: 'is_active', label: 'Ativo', type: 'switch', default: true },
  ];

  const tempFields: ConfigField[] = [
    { name: 'nome', label: 'Nome', type: 'text', required: true },
    { name: 'peso', label: 'Peso (0-1)', type: 'number', default: 0.5 },
    { name: 'cor', label: 'Cor', type: 'color', default: '#3b82f6' },
    { name: 'ordem', label: 'Ordem', type: 'number', default: 0 },
    { name: 'is_active', label: 'Ativo', type: 'switch', default: true },
  ];

  const etapaFields: ConfigField[] = [
    { name: 'nome', label: 'Nome', type: 'text', required: true },
    { name: 'descricao', label: 'Descrição', type: 'textarea' },
    { name: 'categoria', label: 'Categoria', type: 'select', required: true, default: 'ativa',
      options: [
        { value: 'ativa', label: 'Ativa' },
        { value: 'ganho', label: 'Ganho' },
        { value: 'perda', label: 'Perda' },
        { value: 'descartado', label: 'Descartado' },
      ] },
    { name: 'peso', label: 'Peso (0-1)', type: 'number', default: 0.5 },
    { name: 'ordem', label: 'Ordem', type: 'number', default: 0 },
    { name: 'cor', label: 'Cor', type: 'color', default: '#6b7280' },
    { name: 'is_encerramento', label: 'É encerramento?', type: 'switch', default: false },
    { name: 'bloqueia_roleta', label: 'Bloqueia roleta (impede puxar novo lead enquanto ativo aqui)', type: 'switch', default: true },
    { name: 'is_active', label: 'Ativo', type: 'switch', default: true },
  ];

  const grupoFields: ConfigField[] = [
    { name: 'nome', label: 'Nome', type: 'text', required: true },
    { name: 'descricao', label: 'Descrição', type: 'textarea' },
    { name: 'tipo', label: 'Tipo', type: 'select', default: 'consultor',
      options: [
        { value: 'consultor', label: 'Consultor' },
        { value: 'closer', label: 'Closer' },
        { value: 'misto', label: 'Misto' },
      ] },
    {
      name: 'closer_id',
      label: 'Closer responsável',
      type: 'select',
      required: true,
      options: closerProfiles.map((profile) => ({ value: profile.id, label: profile.full_name || profile.email })),
    },
    { name: 'is_active', label: 'Ativo', type: 'switch', default: true },
  ];

  const slaFields: ConfigField[] = [
    { name: 'etapa_id', label: 'Etapa', type: 'select', required: true, options: etapaOptions },
    { name: 'temperatura_id', label: 'Temperatura (opcional)', type: 'select', options: tempOptions },
    { name: 'horas_max', label: 'Horas máx', type: 'number', default: 24 },
    { name: 'acao_expiracao', label: 'Ação na expiração', type: 'select', default: 'notificar',
      options: [
        { value: 'notificar', label: 'Notificar' },
        { value: 'reatribuir', label: 'Reatribuir' },
        { value: 'encerrar', label: 'Encerrar' },
      ] },
    { name: 'is_active', label: 'Ativo', type: 'switch', default: true },
  ];

  const reguaFields: ConfigField[] = [
    { name: 'nome', label: 'Nome', type: 'text', required: true },
    { name: 'dias_apos_ultimo_contato', label: 'Dias após último contato', type: 'number', default: 7 },
    { name: 'canal', label: 'Canal', type: 'select', default: 'whatsapp',
      options: [
        { value: 'whatsapp', label: 'WhatsApp' },
        { value: 'email', label: 'Email' },
        { value: 'sms', label: 'SMS' },
        { value: 'ligacao', label: 'Ligação' },
      ] },
    { name: 'mensagem_template', label: 'Mensagem', type: 'textarea' },
    { name: 'ordem', label: 'Ordem', type: 'number', default: 0 },
    { name: 'is_active', label: 'Ativo', type: 'switch', default: true },
  ];

  const atendimentoFields: ConfigField[] = [
    { name: 'grupo', label: 'Bloco', type: 'select', required: true, options: [
      { value: 'status_ligacao', label: 'Status da ligação' },
      { value: 'qualificacao', label: 'Qualificação' },
      { value: 'interesse', label: 'Interesse' },
      { value: 'perfil', label: 'Perfil' },
      { value: 'proxima_acao', label: 'Próxima ação' },
    ] },
    { name: 'codigo', label: 'Código', type: 'text', required: true, immutable: true },
    { name: 'rotulo', label: 'Rótulo', type: 'text', required: true },
    { name: 'ordem', label: 'Ordem', type: 'number', default: 0 },
    { name: 'acao_sistema', label: 'Comportamento', type: 'select', options: [
      { value: '__none__', label: 'Sem ação automática' },
      { value: 'sem_resposta', label: 'Sem resposta' },
      { value: 'atendido', label: 'Atendido' },
      { value: 'encerrar', label: 'Encerrar' },
      { value: 'agendar_visita', label: 'Agendar visita' },
      { value: 'agendar_retorno', label: 'Agendar retorno' },
      { value: 'enviar_whatsapp', label: 'Enviar WhatsApp' },
      { value: 'acionar_gestor', label: 'Acionar gestor' },
      { value: 'acionar_closer', label: 'Acionar closer' },
    ] },
    { name: 'temperatura_sugerida_id', label: 'Temperatura sugerida', type: 'select', options: tempOptions },
    { name: 'encerra_atendimento', label: 'Encerra o atendimento?', type: 'switch', default: false },
    { name: 'libera_proximo_bloco', label: 'Libera o próximo bloco?', type: 'switch', default: true },
    { name: 'exige_data', label: 'Exige data?', type: 'switch', default: false },
    { name: 'is_active', label: 'Ativo', type: 'switch', default: true },
  ];

  const performanceFields: ConfigField[] = [
    { name: 'nome', label: 'Nome', type: 'text', required: true },
    { name: 'limite_bom', label: 'Bom a partir de (%)', type: 'number', default: 100 },
    { name: 'limite_atencao', label: 'Atenção a partir de (%)', type: 'number', default: 70 },
    { name: 'peso_ligacoes', label: 'Peso de ligações', type: 'number', default: 1 },
    { name: 'peso_conversas', label: 'Peso de conversas efetivadas', type: 'number', default: 1 },
    { name: 'peso_agendamentos', label: 'Peso de agendamentos', type: 'number', default: 1 },
    { name: 'peso_visitas_realizadas', label: 'Peso de visitas realizadas', type: 'number', default: 1 },
    { name: 'is_default', label: 'Configuração padrão', type: 'switch', default: false },
    { name: 'is_active', label: 'Ativa', type: 'switch', default: true },
  ];

  return (
    <MainLayout title="Configurações Arqo" subtitle="Funil, temperaturas, fontes, grupos, SLA e reengajamento">
      <Tabs defaultValue="etapas">
        <TabsList className="mb-5 max-w-full justify-start overflow-x-auto">
          <TabsTrigger value="etapas">Etapas</TabsTrigger>
          <TabsTrigger value="temperaturas">Temperaturas</TabsTrigger>
          <TabsTrigger value="sources">Fontes</TabsTrigger>
          <TabsTrigger value="grupos">Grupos</TabsTrigger>
          <TabsTrigger value="sla">SLA</TabsTrigger>
          <TabsTrigger value="regua">Reengajamento</TabsTrigger>
          <TabsTrigger value="atendimento">Atendimento</TabsTrigger>
          <TabsTrigger value="metas">Metas</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="etapas">
          <Card className="p-4">
            <ArqoConfigCrud
              table="arqo_funil_etapas"
              items={etapas}
              fields={etapaFields}
              title="Etapas do funil"
              renderRow={(e) => (
                <div className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: e.cor }} />
                  <span className="font-medium">{e.nome}</span>
                  <Badge variant="outline">{e.categoria}</Badge>
                  <Badge variant="secondary">peso {e.peso}</Badge>
                  {!e.bloqueia_roleta && <Badge variant="outline" className="text-amber-600 border-amber-300">não bloqueia roleta</Badge>}
                  <span className="text-xs text-muted-foreground ml-auto">#{e.ordem}</span>
                </div>
              )}
            />
          </Card>
        </TabsContent>

        <TabsContent value="temperaturas">
          <Card className="p-4">
            <ArqoConfigCrud
              table="arqo_temperaturas"
              items={temps}
              fields={tempFields}
              title="Temperaturas"
              renderRow={(t) => (
                <div className="flex items-center gap-3">
                  <span className="h-4 w-4 rounded" style={{ backgroundColor: t.cor }} />
                  <span className="font-medium">{t.nome}</span>
                  <Badge>peso {t.peso}</Badge>
                </div>
              )}
            />
          </Card>
        </TabsContent>

        <TabsContent value="sources">
          <Card className="p-4">
            <ArqoConfigCrud
              table="arqo_lead_sources"
              items={sources}
              fields={sourceFields}
              title="Fontes de leads"
              renderRow={(s) => (
                <div>
                  <span className="font-medium">{s.nome}</span>
                  {s.descricao && <p className="text-xs text-muted-foreground">{s.descricao}</p>}
                </div>
              )}
            />
          </Card>
        </TabsContent>

        <TabsContent value="grupos">
          <Card className="p-4">
            <ArqoConfigCrud
              table="arqo_grupos_atendimento"
              items={grupos}
              fields={grupoFields}
              title="Grupos de atendimento"
              renderRow={(g) => (
                <div className="flex items-center gap-3">
                  <span className="font-medium">{g.nome}</span>
                  <Badge variant="outline">{g.tipo}</Badge>
                  <Badge variant={g.closer_id ? 'secondary' : 'destructive'}>
                    Closer: {closerProfiles.find((profile) => profile.id === g.closer_id)?.full_name || 'não configurado'}
                  </Badge>
                  <Badge variant={g.is_active ? 'default' : 'secondary'}>{g.is_active ? 'Ativo' : 'Inativo'}</Badge>
                </div>
              )}
            />
          </Card>
          <ArqoGrupoMembros />
        </TabsContent>

        <TabsContent value="sla">
          <Card className="p-4">
            <ArqoConfigCrud
              table="arqo_sla_regras"
              items={sla}
              fields={slaFields}
              title="Regras de SLA"
              renderRow={(r) => (
                <div className="flex items-center gap-3">
                  <span className="text-sm">Etapa: {etapas.find(e => e.id === r.etapa_id)?.nome ?? '—'}</span>
                  {r.temperatura_id && <span className="text-xs text-muted-foreground">Temp: {temps.find(t => t.id === r.temperatura_id)?.nome}</span>}
                  <Badge variant="outline">{r.horas_max}h</Badge>
                  <Badge>{r.acao_expiracao}</Badge>
                </div>
              )}
            />
          </Card>
        </TabsContent>

        <TabsContent value="regua">
          <Card className="p-4">
            <ArqoConfigCrud
              table="arqo_regua_reengajamento"
              items={regua}
              fields={reguaFields}
              title="Régua de reengajamento"
              renderRow={(r) => (
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{r.nome}</span>
                    <Badge variant="outline">{r.canal}</Badge>
                    <Badge>D+{r.dias_apos_ultimo_contato}</Badge>
                  </div>
                  {r.mensagem_template && <p className="mt-1 text-xs text-muted-foreground truncate max-w-xl">{r.mensagem_template}</p>}
                </div>
              )}
            />
          </Card>
        </TabsContent>

        <TabsContent value="atendimento">
          <Card className="p-4">
            <ArqoConfigCrud
              table="arqo_atendimento_opcoes"
              items={atendimentoOpcoes}
              fields={atendimentoFields}
              title="Roteiro de atendimento"
              allowDelete={false}
              renderRow={(option) => (
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{option.codigo}</Badge>
                  <span className="font-medium">{option.rotulo}</span>
                  <Badge variant="outline">{option.grupo}</Badge>
                  {option.exige_data && <Badge variant="secondary">exige data</Badge>}
                  {!option.is_active && <Badge variant="secondary">inativo</Badge>}
                  <span className="ml-auto text-xs text-muted-foreground">#{option.ordem}</span>
                </div>
              )}
            />
          </Card>
        </TabsContent>

        <TabsContent value="metas">
          <Card className="p-4">
            <ArqoMetasManager metas={metas} profiles={profiles} />
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <Card className="p-4">
            <ArqoConfigCrud
              table="arqo_performance_config"
              items={performanceConfigs}
              fields={performanceFields}
              title="Regras de performance"
              renderRow={(config) => (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{config.nome}</span>
                  {config.is_default && <Badge>Padrão</Badge>}
                  <Badge variant="outline">Bom ≥ {config.limite_bom}%</Badge>
                  <Badge variant="outline">Atenção ≥ {config.limite_atencao}%</Badge>
                </div>
              )}
            />
          </Card>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}
