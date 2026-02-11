import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useProjetosMarketing } from '@/hooks/useProjetosMarketing';
import { useEmpreendimentos } from '@/hooks/useEmpreendimentos';
import { useCreateBriefing } from '@/hooks/useBriefings';
import { useAddBriefingReferencia } from '@/hooks/useBriefingReferencias';
import { useFuncionariosSeven } from '@/hooks/useFuncionariosSeven';
import { CATEGORIA_LABELS, PRIORIDADE_LABELS, type CategoriaProjeto, type PrioridadeProjeto } from '@/types/marketing.types';
import { Loader2, ChevronLeft, ChevronRight, FileEdit, FileText, Check, Building2, User, Upload, X, Link2, Plus, ExternalLink } from 'lucide-react';

const STEPS = [
  { id: 1, title: 'Dados do Ticket', icon: FileEdit },
  { id: 2, title: 'Briefing', icon: FileText },
];

const formSchema = z.object({
  is_interno: z.boolean().default(false),
  titulo: z.string().min(3, 'Título deve ter pelo menos 3 caracteres'),
  descricao: z.string().optional(),
  categoria: z.enum(['render_3d', 'design_grafico', 'video_animacao', 'evento', 'pedido_orcamento']),
  prioridade: z.enum(['baixa', 'media', 'alta', 'urgente']),
  empreendimento_id: z.string().optional(),
  data_previsao: z.string().optional(),
  supervisor_id: z.string().optional(),
  briefing_cliente: z.string().min(1, 'Cliente é obrigatório'),
  briefing_tema: z.string().min(1, 'Tema é obrigatório'),
  briefing_objetivo: z.string().optional(),
  briefing_formato_peca: z.string().optional(),
  briefing_tom_comunicacao: z.string().optional(),
  briefing_estilo_visual: z.string().optional(),
  briefing_referencia: z.string().optional(),
  briefing_observacoes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface PendingLink {
  url: string;
  titulo?: string;
}

interface TicketFormProps {
  onSuccess: () => void;
}

export function TicketForm({ onSuccess }: TicketFormProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [pendingLinks, setPendingLinks] = useState<PendingLink[]>([]);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitulo, setLinkTitulo] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const { createProjeto } = useProjetosMarketing();
  const { data: empreendimentos } = useEmpreendimentos();
  const { data: funcionarios } = useFuncionariosSeven();
  const createBriefing = useCreateBriefing();
  const addReferencia = useAddBriefingReferencia();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      is_interno: false,
      titulo: '',
      descricao: '',
      categoria: 'design_grafico',
      prioridade: 'media',
      briefing_cliente: '',
      briefing_tema: '',
      briefing_objetivo: '',
      briefing_formato_peca: '',
      briefing_tom_comunicacao: '',
      briefing_estilo_visual: '',
      briefing_referencia: '',
      briefing_observacoes: '',
    }
  });

  const isInterno = form.watch('is_interno');

  useEffect(() => {
    if (isInterno) {
      form.setValue('briefing_cliente', 'SEVEN (Interno)');
    } else {
      const currentValue = form.getValues('briefing_cliente');
      if (currentValue === 'SEVEN (Interno)') {
        form.setValue('briefing_cliente', '');
      }
    }
  }, [isInterno, form]);

  const validateStep1 = async () => {
    const result = await form.trigger(['titulo', 'categoria', 'prioridade']);
    if (result) {
      setStep(2);
    }
  };

  const handleFiles = useCallback((files: FileList | File[]) => {
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (imageFiles.length) {
      setPendingFiles(prev => [...prev, ...imageFiles]);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const removeFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddLink = () => {
    if (!linkUrl.trim()) return;
    setPendingLinks(prev => [...prev, { url: linkUrl.trim(), titulo: linkTitulo.trim() || undefined }]);
    setLinkUrl('');
    setLinkTitulo('');
  };

  const removeLink = (index: number) => {
    setPendingLinks(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: FormData) => {
    // Create briefing
    const newBriefing = await createBriefing.mutateAsync({
      cliente: data.briefing_cliente,
      tema: data.briefing_tema,
      objetivo: data.briefing_objetivo,
      empreendimento_id: data.empreendimento_id,
      formato_peca: data.briefing_formato_peca,
      tom_comunicacao: data.briefing_tom_comunicacao,
      estilo_visual: data.briefing_estilo_visual,
      referencia: data.briefing_referencia,
      observacoes: data.briefing_observacoes,
    });

    // Upload pending files and links
    const uploadPromises: Promise<unknown>[] = [];
    for (const file of pendingFiles) {
      uploadPromises.push(
        addReferencia.mutateAsync({ briefingId: newBriefing.id, tipo: 'imagem', file })
      );
    }
    for (const link of pendingLinks) {
      uploadPromises.push(
        addReferencia.mutateAsync({ briefingId: newBriefing.id, tipo: 'link', url: link.url, titulo: link.titulo })
      );
    }
    await Promise.all(uploadPromises);

    // Create ticket with briefing
    await createProjeto.mutateAsync({
      titulo: data.titulo,
      descricao: data.descricao,
      categoria: data.categoria as CategoriaProjeto,
      prioridade: data.prioridade as PrioridadeProjeto,
      empreendimento_id: data.empreendimento_id || undefined,
      data_previsao: data.data_previsao || undefined,
      supervisor_id: data.supervisor_id || undefined,
      briefing_id: newBriefing.id,
      is_interno: data.is_interno,
    });
    
    onSuccess();
  };

  const isSubmitting = createProjeto.isPending || createBriefing.isPending || addReferencia.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
        {/* Step indicator */}
        <div className="flex items-center justify-center pb-6 border-b">
          {STEPS.map((stepInfo, index) => {
            const StepIcon = stepInfo.icon;
            const isCompleted = step > stepInfo.id;
            const isActive = step === stepInfo.id;
            
            return (
              <div key={stepInfo.id} className="flex items-center">
                {index > 0 && (
                  <div className={`h-0.5 w-16 mx-2 ${isCompleted || isActive ? 'bg-primary' : 'bg-muted'}`} />
                )}
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    isCompleted 
                      ? 'bg-primary text-primary-foreground' 
                      : isActive 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground'
                  }`}>
                    {isCompleted ? <Check className="h-5 w-5" /> : <StepIcon className="h-5 w-5" />}
                  </div>
                  <span className={`text-xs mt-2 font-medium ${
                    isActive || isCompleted ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {stepInfo.title}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Etapa 1: Dados do Ticket</h3>
            
            <FormField
              control={form.control}
              name="is_interno"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-muted/50">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <FormLabel className="text-base font-medium">Ticket Interno</FormLabel>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Marque se este ticket é para uso interno da empresa SEVEN
                    </p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="titulo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título do Ticket *</FormLabel>
                  <FormControl><Input placeholder="Ex: Render Fachada Bloco A" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="categoria"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {Object.entries(CATEGORIA_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="prioridade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioridade *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {Object.entries(PRIORIDADE_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="empreendimento_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Empreendimento (opcional)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Vincular a um empreendimento" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {empreendimentos?.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>{emp.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="data_previsao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Previsão (Deadline)</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="supervisor_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1"><User className="h-3.5 w-3.5" />Responsável</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Atribuir responsável" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {funcionarios?.map((func) => (
                          <SelectItem key={func.id} value={func.id}>{func.full_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl><Textarea placeholder="Breve descrição do ticket..." className="resize-none" rows={2} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end pt-4">
              <Button type="button" onClick={validateStep1}>
                Próximo: Briefing
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Etapa 2: Briefing</h3>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="briefing_cliente"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do cliente" {...field} disabled={isInterno} className={isInterno ? 'bg-muted' : ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="briefing_tema"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tema *</FormLabel>
                    <FormControl><Input placeholder="Tema principal" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="briefing_objetivo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Objetivo</FormLabel>
                  <FormControl><Input placeholder="Objetivo da peça" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="briefing_formato_peca"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Formato da Peça</FormLabel>
                    <FormControl><Input placeholder="Ex: Post Instagram, Banner" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="briefing_tom_comunicacao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tom de Comunicação</FormLabel>
                    <FormControl><Input placeholder="Ex: Formal, Descontraído" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="briefing_estilo_visual"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estilo Visual</FormLabel>
                  <FormControl><Input placeholder="Ex: Minimalista, Colorido" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="briefing_referencia"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Referências (texto)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Descrição de referências visuais..." className="resize-none" rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Upload de imagens de referência */}
            <div className="space-y-3">
              <p className="text-sm font-medium">Imagens de Referência</p>
              <div
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}`}
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.multiple = true;
                  input.accept = 'image/*';
                  input.onchange = () => input.files && handleFiles(input.files);
                  input.click();
                }}
              >
                <Upload className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Arraste imagens ou clique para selecionar</p>
              </div>

              {pendingFiles.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {pendingFiles.map((file, index) => (
                    <div key={index} className="relative group rounded-lg overflow-hidden border">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="w-full h-20 object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Links de referência */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Links de Referência</p>
              <div className="flex gap-2">
                <Input
                  placeholder="https://..."
                  value={linkUrl}
                  onChange={e => setLinkUrl(e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="Título (opcional)"
                  value={linkTitulo}
                  onChange={e => setLinkTitulo(e.target.value)}
                  className="w-32"
                />
                <Button type="button" size="icon" variant="outline" onClick={handleAddLink} disabled={!linkUrl.trim()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {pendingLinks.length > 0 && (
                <div className="space-y-1">
                  {pendingLinks.map((link, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 rounded-md border bg-muted/30">
                      <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm truncate flex-1">{link.titulo || link.url}</span>
                      <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => removeLink(index)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <FormField
              control={form.control}
              name="briefing_observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Informações adicionais..." className="resize-none" rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-between pt-4">
              <Button type="button" variant="outline" onClick={() => setStep(1)}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar Ticket
              </Button>
            </div>
          </div>
        )}
      </form>
    </Form>
  );
}
