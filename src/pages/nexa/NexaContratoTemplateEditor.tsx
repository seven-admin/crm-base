import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save } from 'lucide-react';
import { TipTapEditor, insertIntoTipTap, insertHtmlIntoTipTap } from '@/components/nexa/contratos/TipTapEditor';
import { useContratoTemplate, useSaveContratoTemplate, useContratoVariaveis } from '@/hooks/useNexaContratos';
import { useContratoBlocos } from '@/hooks/useNexaContratoBlocos';
import { useEmpreendimentosAtivos } from '@/hooks/useNexa';
import { extrairVariaveis, resolveVariaveis } from '@/lib/contratoVariaveis';
import { toast } from 'sonner';

export default function NexaContratoTemplateEditor() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const isNew = id === 'novo';
  const { data: template } = useContratoTemplate(isNew ? undefined : id);
  const { data: variaveis } = useContratoVariaveis();
  const { data: blocos } = useContratoBlocos();
  const { data: emps } = useEmpreendimentosAtivos();
  const save = useSaveContratoTemplate();

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [empId, setEmpId] = useState<string>('');
  const [conteudo, setConteudo] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (template) {
      setNome(template.nome);
      setDescricao(template.descricao || '');
      setEmpId(template.empreendimento_id || '');
      setConteudo(template.conteudo_html || '');
      setIsActive(template.is_active);
    }
  }, [template]);

  const varsUsadas = useMemo(() => extrairVariaveis(conteudo), [conteudo]);

  const exemploValores = useMemo(() => {
    const out: Record<string, string> = {};
    variaveis?.forEach((v) => {
      out[v.chave] = `[${v.label}]`;
    });
    return out;
  }, [variaveis]);

  const previewHtml = useMemo(() => resolveVariaveis(conteudo, exemploValores), [conteudo, exemploValores]);

  const handleSave = async () => {
    if (!nome.trim()) { toast.error('Informe o nome do modelo.'); return; }
    const savedId = await save.mutateAsync({
      id: isNew ? undefined : id,
      nome,
      descricao,
      empreendimento_id: empId || null,
      conteudo_html: conteudo,
      variaveis: varsUsadas,
      is_active: isActive,
    });
    if (isNew && savedId) nav(`/nexa/contratos/modelos/${savedId}`);
  };

  return (
    <MainLayout
      title={isNew ? 'Novo modelo de contrato' : 'Editar modelo'}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => nav('/nexa/contratos/modelos')}><ArrowLeft className="h-4 w-4 mr-2" /> Voltar</Button>
          <Button onClick={handleSave} disabled={save.isPending}><Save className="h-4 w-4 mr-2" /> Salvar</Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Nome *</Label>
                  <Input value={nome} onChange={(e) => setNome(e.target.value)} />
                </div>
                <div>
                  <Label>Empreendimento (opcional)</Label>
                  <Select value={empId || 'none'} onValueChange={(v) => setEmpId(v === 'none' ? '' : v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Global (todos)</SelectItem>
                      {emps?.map((e) => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea rows={2} value={descricao} onChange={(e) => setDescricao(e.target.value)} />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={isActive} onCheckedChange={setIsActive} />
                <Label>Ativo</Label>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="editor">
            <TabsList>
              <TabsTrigger value="editor">Editor</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
            <TabsContent value="editor">
              <TipTapEditor value={conteudo} onChange={setConteudo} />
            </TabsContent>
            <TabsContent value="preview">
              <div className="border rounded-md bg-white p-6 prose max-w-none" dangerouslySetInnerHTML={{ __html: previewHtml }} />
            </TabsContent>
          </Tabs>
        </div>

        <Card className="h-fit sticky top-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Inserir no contrato</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs defaultValue="vars" className="w-full">
              <TabsList className="w-full grid grid-cols-2 rounded-none">
                <TabsTrigger value="vars">Variáveis</TabsTrigger>
                <TabsTrigger value="blocos">Blocos</TabsTrigger>
              </TabsList>
              <TabsContent value="vars" className="m-0">
                <ScrollArea className="h-[440px] p-3">
                  <p className="text-xs text-muted-foreground mb-2">Clique para inserir no cursor.</p>
                  <div className="space-y-1">
                    {variaveis?.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => insertIntoTipTap(`{{${v.chave}}}`)}
                        className="w-full text-left p-2 rounded hover:bg-muted text-sm border"
                      >
                        <div className="font-mono text-xs text-primary">{`{{${v.chave}}}`}</div>
                        <div className="text-xs text-muted-foreground">{v.label}</div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
              <TabsContent value="blocos" className="m-0">
                <ScrollArea className="h-[440px] p-3">
                  <p className="text-xs text-muted-foreground mb-2">Clique para inserir o bloco.</p>
                  {(!blocos || blocos.length === 0) && (
                    <p className="text-xs text-muted-foreground italic">Nenhum bloco cadastrado.</p>
                  )}
                  <div className="space-y-1">
                    {blocos?.filter((b) => b.is_active).map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => insertHtmlIntoTipTap(b.conteudo_html)}
                        className="w-full text-left p-2 rounded hover:bg-muted text-sm border"
                      >
                        <div className="text-xs font-medium">{b.nome}</div>
                        <div className="text-[10px] uppercase text-muted-foreground">{b.categoria}</div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
          {varsUsadas.length > 0 && (
            <CardContent className="border-t pt-3">
              <div className="text-xs font-medium mb-2">Variáveis usadas ({varsUsadas.length})</div>
              <div className="flex flex-wrap gap-1">
                {varsUsadas.map((v) => <Badge key={v} variant="outline" className="font-mono text-xs">{v}</Badge>)}
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </MainLayout>
  );
}
