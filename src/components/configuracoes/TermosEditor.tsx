import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { useConfiguracao, useUpdateConfiguracoes } from '@/hooks/useConfiguracoesSistema';
import { useSalvarVersaoTermos, useVersoesTermos, useHistoricoAceites } from '@/hooks/useTermosAceite';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Save, Eye, FileText, Shield, History, Users, Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function TermosEditor() {
  const [activeTab, setActiveTab] = useState<'termos' | 'politica' | 'historico' | 'aceites'>('termos');
  const [termosUso, setTermosUso] = useState('');
  const [politicaPrivacidade, setPoliticaPrivacidade] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  
  const { data: configTermos, isLoading: loadingTermos } = useConfiguracao('termos_uso');
  const { data: configPolitica, isLoading: loadingPolitica } = useConfiguracao('politica_privacidade');
  const { data: versoes } = useVersoesTermos();
  const { data: aceites } = useHistoricoAceites();
  
  const updateConfigs = useUpdateConfiguracoes();
  const salvarVersao = useSalvarVersaoTermos();
  
  useEffect(() => {
    if (configTermos?.valor) {
      setTermosUso(configTermos.valor);
    }
  }, [configTermos?.valor]);
  
  useEffect(() => {
    if (configPolitica?.valor) {
      setPoliticaPrivacidade(configPolitica.valor);
    }
  }, [configPolitica?.valor]);
  
  const handleSave = async () => {
    try {
      // Salvar versões se houve alteração
      if (termosUso !== configTermos?.valor) {
        await salvarVersao.mutateAsync({ tipo: 'termos_uso', conteudo: termosUso });
      }
      if (politicaPrivacidade !== configPolitica?.valor) {
        await salvarVersao.mutateAsync({ tipo: 'politica_privacidade', conteudo: politicaPrivacidade });
      }
      
      // Salvar configurações
      await updateConfigs.mutateAsync([
        { chave: 'termos_uso', valor: termosUso },
        { chave: 'politica_privacidade', valor: politicaPrivacidade },
      ]);
      
      toast.success('Termos salvos com sucesso! Usuários precisarão aceitar novamente.');
    } catch (error) {
      console.error('Erro ao salvar termos:', error);
      toast.error('Erro ao salvar termos');
    }
  };
  
  const isLoading = loadingTermos || loadingPolitica;
  const isSaving = updateConfigs.isPending || salvarVersao.isPending;
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Termos Legais</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie os termos de uso e política de privacidade
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreviewMode(!previewMode)}
          >
            <Eye className="h-4 w-4 mr-2" />
            {previewMode ? 'Editar' : 'Preview'}
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar Alterações
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="termos" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Termos de Uso</span>
            <span className="sm:hidden">Termos</span>
          </TabsTrigger>
          <TabsTrigger value="politica" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Política</span>
            <span className="sm:hidden">Política</span>
          </TabsTrigger>
          <TabsTrigger value="historico" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">Versões</span>
            <span className="sm:hidden">Versões</span>
          </TabsTrigger>
          <TabsTrigger value="aceites" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Aceites</span>
            <span className="sm:hidden">Aceites</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="termos" className="mt-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Termos de Uso</CardTitle>
              <CardDescription>
                Defina os termos de uso do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {previewMode ? (
                <ScrollArea className="h-[500px] border rounded-md p-4 bg-muted/30">
                  <div 
                    className="prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: termosUso || '<p>Nenhum conteúdo</p>' }}
                  />
                </ScrollArea>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Editor</Label>
                    <RichTextEditor
                      value={termosUso}
                      onChange={setTermosUso}
                      placeholder="Digite os termos de uso..."
                      minHeight="450px"
                    />
                  </div>
                  <div className="space-y-2 hidden lg:block">
                    <Label>Preview em tempo real</Label>
                    <ScrollArea className="h-[450px] border rounded-md p-4 bg-muted/30">
                      <div 
                        className="prose prose-sm max-w-none dark:prose-invert"
                        dangerouslySetInnerHTML={{ __html: termosUso || '<p>Nenhum conteúdo</p>' }}
                      />
                    </ScrollArea>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="politica" className="mt-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Política de Privacidade</CardTitle>
              <CardDescription>
                Defina a política de privacidade (LGPD)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {previewMode ? (
                <ScrollArea className="h-[500px] border rounded-md p-4 bg-muted/30">
                  <div 
                    className="prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: politicaPrivacidade || '<p>Nenhum conteúdo</p>' }}
                  />
                </ScrollArea>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Editor</Label>
                    <RichTextEditor
                      value={politicaPrivacidade}
                      onChange={setPoliticaPrivacidade}
                      placeholder="Digite a política de privacidade..."
                      minHeight="450px"
                    />
                  </div>
                  <div className="space-y-2 hidden lg:block">
                    <Label>Preview em tempo real</Label>
                    <ScrollArea className="h-[450px] border rounded-md p-4 bg-muted/30">
                      <div 
                        className="prose prose-sm max-w-none dark:prose-invert"
                        dangerouslySetInnerHTML={{ __html: politicaPrivacidade || '<p>Nenhum conteúdo</p>' }}
                      />
                    </ScrollArea>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="historico" className="mt-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Histórico de Versões</CardTitle>
              <CardDescription>
                Versões anteriores dos termos salvos
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Hash da Versão</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {versoes?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                        Nenhuma versão salva ainda
                      </TableCell>
                    </TableRow>
                  )}
                  {versoes?.map((versao) => (
                    <TableRow key={versao.id}>
                      <TableCell>
                        <Badge variant={versao.tipo === 'termos_uso' ? 'default' : 'secondary'}>
                          {versao.tipo === 'termos_uso' ? 'Termos de Uso' : 'Política de Privacidade'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(versao.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {versao.versao_hash.substring(0, 12)}...
                        </code>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="aceites" className="mt-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Registro de Aceites</CardTitle>
              <CardDescription>
                Histórico de usuários que aceitaram os termos (auditoria LGPD)
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Versão</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {aceites?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        Nenhum aceite registrado ainda
                      </TableCell>
                    </TableRow>
                  )}
                  {aceites?.map((aceite) => (
                    <TableRow key={aceite.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {aceite.profiles?.full_name || 'Usuário'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {aceite.profiles?.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={aceite.tipo === 'termos_uso' ? 'default' : 'secondary'}>
                          {aceite.tipo === 'termos_uso' ? 'Termos' : 'Política'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(aceite.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {aceite.versao_hash.substring(0, 8)}...
                        </code>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
