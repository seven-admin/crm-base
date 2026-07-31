import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, ChevronDown } from 'lucide-react';
import { TipTapEditor, insertIntoTipTap, insertHtmlIntoTipTap } from '@/components/nexa/contratos/TipTapEditor';
import { useContratoTemplate, useSaveContratoTemplate, useContratoVariaveis } from '@/hooks/useNexaContratos';
import { useContratoBlocos } from '@/hooks/useNexaContratoBlocos';
import { useEmpreendimentosAtivos } from '@/hooks/useNexa';
import { extrairVariaveis, resolveVariaveis, normalizarQuebras } from '@/lib/contratoVariaveis';
import { renumerarClausulas, wrapBloco } from '@/lib/contratoNumeracao';
import { FachadaImageUpload } from '@/components/empreendimentos/FachadaImageUpload';
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
  const [marcaDaguaUrl, setMarcaDaguaUrl] = useState('');
  const [marcaDaguaOpacidade, setMarcaDaguaOpacidade] = useState(0.08);
  const [margemTopo, setMargemTopo] = useState(20);
  const [margemDireita, setMargemDireita] = useState(20);
  const [margemBaixo, setMargemBaixo] = useState(20);
  const [margemEsquerda, setMargemEsquerda] = useState(20);
  const [cabecalho, setCabecalho] = useState('');
  const [rodape, setRodape] = useState('');
  const [numerarPaginas, setNumerarPaginas] = useState(false);
  const [configOpen, setConfigOpen] = useState(isNew);

  useEffect(() => {
    if (template) {
      setNome(template.nome);
      setDescricao(template.descricao || '');
      setEmpId(template.empreendimento_id || '');
      setConteudo(template.conteudo_html || '');
      setIsActive(template.is_active);
      setMarcaDaguaUrl(template.marca_dagua_url || '');
      setMarcaDaguaOpacidade(template.marca_dagua_opacidade ?? 0.08);
      setMargemTopo(template.margem_topo ?? 20);
      setMargemDireita(template.margem_direita ?? 20);
      setMargemBaixo(template.margem_baixo ?? 20);
      setMargemEsquerda(template.margem_esquerda ?? 20);
      setCabecalho(template.cabecalho_texto || '');
      setRodape(template.rodape_texto || '');
      setNumerarPaginas(template.numerar_paginas ?? false);
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

  const previewHtml = useMemo(() => normalizarQuebras(resolveVariaveis(renumerarClausulas(conteudo), exemploValores)), [conteudo, exemploValores]);

  const handleSave = async () => {
    if (!nome.trim()) { toast.error('Informe o nome do modelo.'); return; }
    const savedId = await save.mutateAsync({
      id: isNew ? undefined : id,
      nome,
      descricao,
      empreendimento_id: empId || null,
      conteudo_html: conteudo,
      variaveis: varsUsadas,
      marca_dagua_url: marcaDaguaUrl || null,
      marca_dagua_opacidade: marcaDaguaOpacidade,
      margem_topo: margemTopo,
      margem_direita: margemDireita,
      margem_baixo: margemBaixo,
      margem_esquerda: margemEsquerda,
      cabecalho_texto: cabecalho || null,
      rodape_texto: rodape || null,
      numerar_paginas: numerarPaginas,
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
            <Collapsible open={configOpen} onOpenChange={setConfigOpen}>
              <CollapsibleTrigger asChild>
                <button type="button" className="flex w-full items-center justify-between px-6 py-4 text-left">
                  <span className="font-medium">Configurações do modelo{nome ? ` — ${nome}` : ''}</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${configOpen ? 'rotate-180' : ''}`} />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
            <CardContent className="pt-0 space-y-3">
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

              <div className="border-t pt-3 space-y-2">
                <Label>Marca d'água (todas as páginas)</Label>
                <p className="text-xs text-muted-foreground">
                  Imagem sobreposta e centralizada em cada página do PDF gerado.
                </p>
                <FachadaImageUpload
                  empreendimentoId={empId || 'contratos-marca'}
                  currentImageUrl={marcaDaguaUrl || undefined}
                  onUploadComplete={setMarcaDaguaUrl}
                  onRemove={() => setMarcaDaguaUrl('')}
                />
                {marcaDaguaUrl && (
                  <div className="flex items-center gap-2">
                    <Label className="text-xs">Opacidade</Label>
                    <Input
                      type="number"
                      min={0.02}
                      max={1}
                      step={0.01}
                      value={marcaDaguaOpacidade}
                      onChange={(e) => setMarcaDaguaOpacidade(Number(e.target.value) || 0.08)}
                      className="w-24"
                    />
                  </div>
                )}
              </div>

              <div className="border-t pt-3 space-y-3">
                <Label>Formatação da página (PDF)</Label>
                <div>
                  <Label className="text-xs text-muted-foreground">Margens (mm)</Label>
                  <div className="grid grid-cols-4 gap-2 mt-1">
                    <div><Label className="text-[10px]">Topo</Label><Input type="number" min={0} value={margemTopo} onChange={(e) => setMargemTopo(Number(e.target.value) || 0)} /></div>
                    <div><Label className="text-[10px]">Direita</Label><Input type="number" min={0} value={margemDireita} onChange={(e) => setMargemDireita(Number(e.target.value) || 0)} /></div>
                    <div><Label className="text-[10px]">Baixo</Label><Input type="number" min={0} value={margemBaixo} onChange={(e) => setMargemBaixo(Number(e.target.value) || 0)} /></div>
                    <div><Label className="text-[10px]">Esquerda</Label><Input type="number" min={0} value={margemEsquerda} onChange={(e) => setMargemEsquerda(Number(e.target.value) || 0)} /></div>
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Cabeçalho (opcional)</Label>
                  <Input value={cabecalho} onChange={(e) => setCabecalho(e.target.value)} placeholder="Ex.: {{empreendimento}} — Contrato" />
                  <p className="text-[10px] text-muted-foreground mt-0.5">Impresso na margem superior. Aceita variáveis {'{{...}}'}.</p>
                </div>
                <div>
                  <Label className="text-xs">Rodapé (opcional)</Label>
                  <Input value={rodape} onChange={(e) => setRodape(e.target.value)} placeholder="Ex.: Documento gerado em {{data_atual}}" />
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={numerarPaginas} onCheckedChange={setNumerarPaginas} />
                  <Label>Numerar páginas (Página X de Y)</Label>
                </div>
              </div>
            </CardContent>
              </CollapsibleContent>
            </Collapsible>
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
              <div className="prose max-w-none rounded-[1.25rem] border border-border/70 bg-white p-6" dangerouslySetInnerHTML={{ __html: previewHtml }} />
            </TabsContent>
          </Tabs>
        </div>

        <Card className="sticky top-20 h-fit overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Inserir no contrato</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs defaultValue="vars" className="w-full">
              <TabsList className="mx-3 grid w-[calc(100%-1.5rem)] grid-cols-2">
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
                        className="w-full rounded-xl border border-border/70 p-2 text-left text-sm transition-colors hover:bg-primary-soft/50"
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
                        onClick={() => insertHtmlIntoTipTap(wrapBloco(b.nome, b.conteudo_html))}
                        className="w-full rounded-xl border border-border/70 p-2 text-left text-sm transition-colors hover:bg-primary-soft/50"
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
