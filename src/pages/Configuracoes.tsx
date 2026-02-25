import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useConfiguracoesSistema, useUpdateConfiguracoes } from '@/hooks/useConfiguracoesSistema';
import { useSidebarColors, DEFAULT_SIDEBAR_COLORS, LABEL_TO_CHAVE } from '@/hooks/useSidebarColors';
import { useWebhooks, useCreateWebhook, useUpdateWebhook, useDeleteWebhook, useTestarWebhook, WEBHOOK_EVENTS, type Webhook as WebhookType } from '@/hooks/useWebhooks';
import { usePermissions } from '@/hooks/usePermissions';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, MoreHorizontal, Webhook, Shield, FileText, Play, Pencil } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { RolesManager } from '@/components/configuracoes/RolesManager';
import { SidebarColorsConfig } from '@/components/configuracoes/SidebarColorsConfig';
import { WebhookLogsSection } from '@/components/configuracoes/WebhookLogsSection';
import { TermosEditor } from '@/components/configuracoes/TermosEditor';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const webhookFormSchema = z.object({
  evento: z.string().min(1, 'Selecione um evento'),
  url: z.string().url('URL inválida').min(1, 'URL é obrigatória'),
  descricao: z.string().optional(),
});

type WebhookFormData = z.infer<typeof webhookFormSchema>;

const Configuracoes = () => {
  const { data: configs, isLoading } = useConfiguracoesSistema();
  const updateConfigs = useUpdateConfiguracoes();
  const { colors: sidebarColors } = useSidebarColors();
  const [localSidebarColors, setLocalSidebarColors] = useState<Record<string, string>>({});
  const { data: webhooks, isLoading: webhooksLoading } = useWebhooks();
  const createWebhook = useCreateWebhook();
  const updateWebhook = useUpdateWebhook();
  const deleteWebhook = useDeleteWebhook();
  const testarWebhook = useTestarWebhook();
  const { isSuperAdmin } = usePermissions();

  const [searchParams, setSearchParams] = useSearchParams();
  const defaultTab = isSuperAdmin() ? 'webhooks' : 'seguranca';
  const currentTab = searchParams.get('tab') || defaultTab;

  const [feature1, setFeature1] = useState('');
  const [feature2, setFeature2] = useState('');
  const [feature3, setFeature3] = useState('');
  const [copyright, setCopyright] = useState('');
  const [loginSubtitulo, setLoginSubtitulo] = useState('');
  const [loginDescricao, setLoginDescricao] = useState('');
  const [showWebhookForm, setShowWebhookForm] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<WebhookType | null>(null);

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  const webhookForm = useForm<WebhookFormData>({
    resolver: zodResolver(webhookFormSchema),
    defaultValues: {
      evento: '',
      url: '',
      descricao: '',
    },
  });

  useEffect(() => {
    if (configs) {
      setFeature1(configs.find(c => c.chave === 'login_feature_1')?.valor || '');
      setFeature2(configs.find(c => c.chave === 'login_feature_2')?.valor || '');
      setFeature3(configs.find(c => c.chave === 'login_feature_3')?.valor || '');
      setCopyright(configs.find(c => c.chave === 'copyright_texto')?.valor || '');
      setLoginSubtitulo(configs.find(c => c.chave === 'login_subtitulo')?.valor || 'CRM Imobiliário');
      setLoginDescricao(configs.find(c => c.chave === 'login_descricao')?.valor || 'Plataforma completa para gestão de empreendimentos imobiliários');
    }
  }, [configs]);

  useEffect(() => {
    setLocalSidebarColors(sidebarColors);
  }, [sidebarColors]);

  const handleSidebarColorChange = (label: string, color: string) => {
    setLocalSidebarColors(prev => ({ ...prev, [label]: color }));
  };

  const handleSavePersonalizacao = async () => {
    try {
      const sidebarColorConfigs = Object.entries(localSidebarColors)
        .filter(([label]) => LABEL_TO_CHAVE[label])
        .map(([label, valor]) => ({ chave: LABEL_TO_CHAVE[label], valor }));

      await updateConfigs.mutateAsync([
        { chave: 'login_feature_1', valor: feature1 },
        { chave: 'login_feature_2', valor: feature2 },
        { chave: 'login_feature_3', valor: feature3 },
        { chave: 'copyright_texto', valor: copyright },
        { chave: 'login_subtitulo', valor: loginSubtitulo },
        { chave: 'login_descricao', valor: loginDescricao },
        ...sidebarColorConfigs,
      ]);
      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar configurações');
    }
  };


  const onSubmitWebhook = async (data: WebhookFormData) => {
    if (editingWebhook) {
      await updateWebhook.mutateAsync({
        id: editingWebhook.id,
        data: {
          evento: data.evento,
          url: data.url,
          descricao: data.descricao,
        },
      });
    } else {
      await createWebhook.mutateAsync({
        evento: data.evento,
        url: data.url,
        descricao: data.descricao,
      });
    }
    handleCloseWebhookForm();
  };

  const handleEditWebhook = (webhook: WebhookType) => {
    setEditingWebhook(webhook);
    webhookForm.reset({
      evento: webhook.evento,
      url: webhook.url,
      descricao: webhook.descricao || '',
    });
    setShowWebhookForm(true);
  };

  const handleCloseWebhookForm = () => {
    setShowWebhookForm(false);
    setEditingWebhook(null);
    webhookForm.reset({ evento: '', url: '', descricao: '' });
  };

  const handleToggleWebhook = async (id: string, isActive: boolean) => {
    await updateWebhook.mutateAsync({
      id,
      data: { is_active: isActive },
    });
  };

  const handleDeleteWebhook = async (id: string) => {
    await deleteWebhook.mutateAsync(id);
  };

  const getEventLabel = (evento: string) => {
    return WEBHOOK_EVENTS.find(e => e.value === evento)?.label || evento;
  };

  return (
    <MainLayout
      title="Configurações"
      subtitle="Gerencie as configurações do sistema"
    >
      <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-6">
        <div className="border-b border-border overflow-x-auto">
          <TabsList className="inline-flex w-full md:w-auto justify-start bg-transparent rounded-none h-auto p-0 gap-0 min-w-max">
            {isSuperAdmin() && (
              <TabsTrigger 
                value="webhooks"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-muted-foreground data-[state=active]:text-foreground"
              >
                Webhooks
              </TabsTrigger>
            )}
            <TabsTrigger 
              value="seguranca"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-muted-foreground data-[state=active]:text-foreground"
            >
              Segurança
            </TabsTrigger>
            {isSuperAdmin() && (
              <TabsTrigger 
                value="personalizacao"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-muted-foreground data-[state=active]:text-foreground"
              >
                Personalização
              </TabsTrigger>
            )}
            {isSuperAdmin() && (
              <TabsTrigger 
                value="perfis"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-muted-foreground data-[state=active]:text-foreground"
              >
                <Shield className="h-4 w-4 mr-2" />
                Perfis de Acesso
              </TabsTrigger>
            )}
            {isSuperAdmin() && (
              <TabsTrigger 
                value="termos"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-muted-foreground data-[state=active]:text-foreground"
              >
                <FileText className="h-4 w-4 mr-2" />
                Termos Legais
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        <TabsContent value="webhooks">
          <div className="card-elevated p-4 md:p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Webhooks de Integração
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Cadastre URLs para receber notificações de eventos do sistema (n8n, Zapier, etc.)
                </p>
              </div>
              <Button onClick={() => setShowWebhookForm(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Webhook
              </Button>
            </div>

            {webhooksLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : webhooks && webhooks.length > 0 ? (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Evento</TableHead>
                      <TableHead>URL</TableHead>
                      <TableHead className="hidden md:table-cell">Descrição</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {webhooks.map((webhook) => (
                      <TableRow key={webhook.id}>
                        <TableCell>
                          <span className="font-medium">
                            {getEventLabel(webhook.evento)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            <span className="hidden md:inline">
                              {webhook.url.length > 50 
                                ? `${webhook.url.substring(0, 50)}...` 
                                : webhook.url}
                            </span>
                            <span className="md:hidden">
                              {webhook.url.length > 25 
                                ? `${webhook.url.substring(0, 25)}...` 
                                : webhook.url}
                            </span>
                          </code>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <span className="text-muted-foreground">
                            {webhook.descricao || '-'}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={webhook.is_active}
                            onCheckedChange={(checked) => handleToggleWebhook(webhook.id, checked)}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                             <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditWebhook(webhook)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => testarWebhook.mutate({ id: webhook.id, evento: webhook.evento, url: webhook.url })}
                                disabled={testarWebhook.isPending}
                              >
                                <Play className="h-4 w-4 mr-2" />
                                {testarWebhook.isPending ? 'Testando...' : 'Testar'}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteWebhook(webhook.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed rounded-lg">
                <Webhook className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">Nenhum webhook cadastrado</h3>
                <p className="text-muted-foreground text-sm mb-4 max-w-md">
                  Adicione webhooks para enviar notificações automáticas para suas ferramentas de automação.
                </p>
                <Button onClick={() => setShowWebhookForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Webhook
                </Button>
              </div>
            )}

            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">Eventos Disponíveis</h4>
              <div className="flex flex-wrap gap-2">
                {WEBHOOK_EVENTS.map((event) => (
                  <Badge key={event.value} variant="outline">
                    {event.label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Webhook Logs */}
            {webhooks && webhooks.length > 0 && (
              <WebhookLogsSection webhooks={webhooks.map(w => ({ id: w.id, evento: w.evento, url: w.url }))} />
            )}
          </div>
        </TabsContent>

        <TabsContent value="seguranca">
          <div className="card-elevated p-4 md:p-6 animate-fade-in">
            <h3 className="text-lg font-semibold text-foreground mb-6">
              Segurança da Conta
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="senha-atual">Senha atual</Label>
                <Input id="senha-atual" type="password" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nova-senha">Nova senha</Label>
                  <Input id="nova-senha" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmar-senha">Confirmar nova senha</Label>
                  <Input id="confirmar-senha" type="password" />
                </div>
              </div>
              <Button>Alterar senha</Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="personalizacao">
          <div className="card-elevated p-4 md:p-6 animate-fade-in">
            <h3 className="text-lg font-semibold text-foreground mb-6">
              Personalização da Tela de Login
            </h3>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Configure os textos que aparecem na tela de login do sistema.
                  </p>

                  <div className="border border-border rounded-lg p-4 space-y-4 bg-muted/30">
                    <h4 className="text-sm font-medium text-foreground">Títulos do Login</h4>
                    
                    <div className="space-y-2">
                      <Label htmlFor="loginSubtitulo">Subtítulo (acima de "Seven Group 360")</Label>
                      <Input 
                        id="loginSubtitulo" 
                        value={loginSubtitulo}
                        onChange={(e) => setLoginSubtitulo(e.target.value)}
                        placeholder="Ex: CRM Imobiliário"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="loginDescricao">Descrição (abaixo de "Seven Group 360")</Label>
                      <Input 
                        id="loginDescricao" 
                        value={loginDescricao}
                        onChange={(e) => setLoginDescricao(e.target.value)}
                        placeholder="Ex: Plataforma completa para gestão de empreendimentos imobiliários"
                      />
                    </div>
                  </div>

                  <div className="border border-border rounded-lg p-4 space-y-4 bg-muted/30">
                    <h4 className="text-sm font-medium text-foreground">Features do Login</h4>
                    
                    <div className="space-y-2">
                      <Label htmlFor="feature1">Feature 1</Label>
                      <Input 
                        id="feature1" 
                        value={feature1}
                        onChange={(e) => setFeature1(e.target.value)}
                        placeholder="Ex: Gestão de Empreendimentos"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="feature2">Feature 2</Label>
                      <Input 
                        id="feature2" 
                        value={feature2}
                        onChange={(e) => setFeature2(e.target.value)}
                        placeholder="Ex: Controle de Vendas e Propostas"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="feature3">Feature 3</Label>
                      <Input 
                        id="feature3" 
                        value={feature3}
                        onChange={(e) => setFeature3(e.target.value)}
                        placeholder="Ex: Funil de Negociações"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-border pt-6">
                  <h4 className="text-md font-medium text-foreground mb-4">
                    Textos Gerais
                  </h4>
                  
                  <div className="space-y-2">
                    <Label htmlFor="copyright">Texto de Copyright</Label>
                    <Input 
                      id="copyright" 
                      value={copyright}
                      onChange={(e) => setCopyright(e.target.value)}
                      placeholder="Ex: 2024 Seven Group. Todos os direitos reservados."
                    />
                  </div>
                </div>

                <SidebarColorsConfig
                  colors={localSidebarColors}
                  onChange={handleSidebarColorChange}
                />

                <Button 
                  onClick={handleSavePersonalizacao}
                  disabled={updateConfigs.isPending}
                >
                  {updateConfigs.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar Alterações'
                  )}
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="perfis">
          <div className="card-elevated p-4 md:p-6 animate-fade-in">
            <RolesManager />
          </div>
        </TabsContent>

        <TabsContent value="termos">
          <div className="card-elevated p-4 md:p-6 animate-fade-in">
            <TermosEditor />
          </div>
        </TabsContent>

      </Tabs>

      {/* Webhook Form Dialog */}
      <Dialog open={showWebhookForm} onOpenChange={(open) => { if (!open) handleCloseWebhookForm(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingWebhook ? 'Editar Webhook' : 'Adicionar Webhook'}</DialogTitle>
          </DialogHeader>
          <Form {...webhookForm}>
            <form onSubmit={webhookForm.handleSubmit(onSubmitWebhook)} className="space-y-4">
              <FormField
                control={webhookForm.control}
                name="evento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Evento *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o evento" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {WEBHOOK_EVENTS.map((event) => (
                          <SelectItem key={event.value} value={event.value}>
                            {event.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={webhookForm.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL do Webhook *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://n8n.example.com/webhook/..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={webhookForm.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição (opcional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ex: Notificação para CRM"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={handleCloseWebhookForm}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createWebhook.isPending || updateWebhook.isPending}>
                  {(createWebhook.isPending || updateWebhook.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingWebhook ? 'Salvar Alterações' : 'Adicionar'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Configuracoes;
