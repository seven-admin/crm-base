import { useState, useEffect } from 'react';
import { Info, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useEmpreendimentos } from '@/hooks/useEmpreendimentos';
import { useActiveContratoVariaveis } from '@/hooks/useContratoVariaveis';

import type { ContratoTemplate } from '@/types/contratos.types';

interface TemplateFormProps {
  template?: ContratoTemplate | null;
  onSave: (data: {
    nome: string;
    descricao?: string;
    empreendimento_id?: string;
    conteudo_html: string;
    is_active: boolean;
  }) => void;
  onCancel: () => void;
  isSaving?: boolean;
  open?: boolean;
}

export function TemplateForm({ template, onSave, onCancel, isSaving, open = true }: TemplateFormProps) {
  const { data: empreendimentos } = useEmpreendimentos();
  const { data: variaveis = [] } = useActiveContratoVariaveis();
  
  const [nome, setNome] = useState(template?.nome || '');
  const [descricao, setDescricao] = useState(template?.descricao || '');
  const [empreendimentoId, setEmpreendimentoId] = useState(template?.empreendimento_id || '');
  const [conteudoHtml, setConteudoHtml] = useState(template?.conteudo_html || '');
  const [isActive, setIsActive] = useState(template?.is_active ?? true);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (template) {
      setNome(template.nome);
      setDescricao(template.descricao || '');
      setEmpreendimentoId(template.empreendimento_id || '');
      setConteudoHtml(template.conteudo_html);
      setIsActive(template.is_active);
    }
  }, [template]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nome.trim()) {
      return;
    }
    
    if (!conteudoHtml.trim()) {
      return;
    }

    onSave({
      nome: nome.trim(),
      descricao: descricao.trim() || undefined,
      empreendimento_id: empreendimentoId || undefined,
      conteudo_html: conteudoHtml,
      is_active: isActive,
    });
  };

  const insertVariable = (variableKey: string) => {
    const variable = `{{${variableKey}}}`;
    setConteudoHtml(conteudoHtml + variable);
  };

  // Transform variables for the RichTextEditor
  const editorVariables = variaveis.map(v => ({
    key: v.chave,
    label: v.label,
    example: v.exemplo || undefined,
  }));

  const getPreviewContent = () => {
    let preview = conteudoHtml;
    variaveis.forEach((v) => {
      const regex = new RegExp(`\\{\\{${v.chave}\\}\\}`, 'g');
      preview = preview.replace(regex, `<span class="bg-primary/20 px-1 rounded">${v.exemplo || v.label}</span>`);
    });
    return preview;
  };

  // Group variables by category
  const variaveisByCategory = variaveis.reduce((acc, v) => {
    const cat = v.categoria || 'geral';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(v);
    return acc;
  }, {} as Record<string, typeof variaveis>);

  const categoryLabels: Record<string, string> = {
    cliente: 'Cliente',
    empreendimento: 'Empreendimento',
    unidade: 'Unidade',
    contrato: 'Contrato',
    pagamento: 'Pagamento',
    sistema: 'Sistema',
    geral: 'Geral',
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="w-[95vw] max-w-[95vw] h-[95vh] max-h-[95vh] flex flex-col p-0 gap-0">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 p-6 pb-4 border-b">
          <DialogTitle>
            {template ? 'Editar Template' : 'Novo Template de Contrato'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <Tabs defaultValue="dados" className="flex-1 flex flex-col min-h-0">
            <div className="border-b px-4">
              <TabsList className="h-10">
                <TabsTrigger value="dados">Dados Básicos</TabsTrigger>
                <TabsTrigger value="conteudo">Conteúdo</TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 flex min-h-0">
              {/* Tabs Content */}
              <div className="flex-1 flex flex-col min-h-0 border-r">
                <TabsContent value="dados" className="flex-1 m-0 p-4 overflow-auto">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="nome">Nome do Template *</Label>
                        <Input
                          id="nome"
                          value={nome}
                          onChange={(e) => setNome(e.target.value)}
                          placeholder="Ex: Contrato Padrão de Compra e Venda"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="empreendimento">Empreendimento</Label>
                        <Select value={empreendimentoId || '__global__'} onValueChange={(val) => setEmpreendimentoId(val === '__global__' ? '' : val)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Global - Todos" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__global__">Global - Todos</SelectItem>
                            {empreendimentos?.map((emp) => (
                              <SelectItem key={emp.id} value={emp.id}>
                                {emp.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="descricao">Descrição</Label>
                      <Input
                        id="descricao"
                        value={descricao}
                        onChange={(e) => setDescricao(e.target.value)}
                        placeholder="Breve descrição do uso deste template"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        id="is-active"
                        checked={isActive}
                        onCheckedChange={setIsActive}
                      />
                      <Label htmlFor="is-active">Template ativo</Label>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="conteudo" className="flex-1 m-0 flex flex-col min-h-0">
                  <div className="flex-1 flex flex-col min-h-0 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="conteudo-html">Conteúdo do Contrato (HTML) *</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowPreview(!showPreview)}
                      >
                        {showPreview ? (
                          <>
                            <EyeOff className="h-4 w-4 mr-1" />
                            Editor
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-1" />
                            Preview
                          </>
                        )}
                      </Button>
                    </div>
                    
                    {showPreview ? (
                      <ScrollArea className="flex-1 border rounded-md p-4 bg-card">
                        <div 
                          className="prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: getPreviewContent() }}
                        />
                      </ScrollArea>
                    ) : (
                      <RichTextEditor
                        value={conteudoHtml}
                        onChange={setConteudoHtml}
                        variables={editorVariables}
                        placeholder="Digite o conteúdo do contrato..."
                        minHeight="300px"
                        className="flex-1"
                      />
                    )}
                  </div>
                </TabsContent>

              </div>

              {/* Right side - Variables panel */}
              <div className="w-96 flex flex-col min-h-0">
                <div className="p-4 border-b">
                  <h3 className="font-medium flex items-center gap-2">
                    Variáveis Disponíveis
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Clique em uma variável para inseri-la no editor</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </h3>
                </div>
                
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {Object.entries(variaveisByCategory).map(([cat, vars]) => (
                      <div key={cat}>
                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                          {categoryLabels[cat] || cat}
                        </p>
                        <div className="space-y-1">
                          {vars.map((v) => (
                            <button
                              key={v.id}
                              type="button"
                              onClick={() => insertVariable(v.chave)}
                              className="w-full text-left p-2 rounded-lg border hover:bg-accent transition-colors"
                            >
                              <Badge variant="secondary" className="font-mono text-xs mb-1">
                                {`{{${v.chave}}}`}
                              </Badge>
                              <p className="text-sm">{v.label}</p>
                              {v.exemplo && (
                                <p className="text-xs text-muted-foreground">Ex: {v.exemplo}</p>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </Tabs>

          <CardContent className="border-t py-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving || !nome.trim() || !conteudoHtml.trim()}>
              {isSaving ? 'Salvando...' : template ? 'Salvar Alterações' : 'Criar Template'}
            </Button>
          </CardContent>
        </form>
      </DialogContent>
    </Dialog>
  );
}
