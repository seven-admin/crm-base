import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEmpreendimentos } from '@/hooks/useEmpreendimentos';
import { useCreateBriefing, useUpdateBriefing } from '@/hooks/useBriefings';
import { 
  FORMATO_PECA_OPTIONS, 
  TOM_COMUNICACAO_OPTIONS, 
  ESTILO_VISUAL_OPTIONS,
  type Briefing,
} from '@/types/briefings.types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BriefingReferencias } from './BriefingReferencias';

const formSchema = z.object({
  cliente: z.string().min(1, 'Cliente é obrigatório'),
  tema: z.string().min(1, 'Tema é obrigatório'),
  objetivo: z.string().optional(),
  empreendimento_id: z.string().optional(),
  formato_peca: z.string().optional(),
  composicao: z.string().optional(),
  head_titulo: z.string().optional(),
  sub_complemento: z.string().optional(),
  mensagem_chave: z.string().optional(),
  tom_comunicacao: z.string().optional(),
  estilo_visual: z.string().optional(),
  diretrizes_visuais: z.string().optional(),
  referencia: z.string().optional(),
  importante: z.string().optional(),
  observacoes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface BriefingFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  briefing?: Briefing | null;
}

export function BriefingForm({ open, onOpenChange, briefing }: BriefingFormProps) {
  const { data: empreendimentos = [] } = useEmpreendimentos();
  const { mutate: createBriefing, isPending: isCreating } = useCreateBriefing();
  const { mutate: updateBriefing, isPending: isUpdating } = useUpdateBriefing();

  const isEditing = !!briefing;
  const isPending = isCreating || isUpdating;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cliente: briefing?.cliente || '',
      tema: briefing?.tema || '',
      objetivo: briefing?.objetivo || '',
      empreendimento_id: briefing?.empreendimento_id || '',
      formato_peca: briefing?.formato_peca || '',
      composicao: briefing?.composicao || '',
      head_titulo: briefing?.head_titulo || '',
      sub_complemento: briefing?.sub_complemento || '',
      mensagem_chave: briefing?.mensagem_chave || '',
      tom_comunicacao: briefing?.tom_comunicacao || '',
      estilo_visual: briefing?.estilo_visual || '',
      diretrizes_visuais: briefing?.diretrizes_visuais || '',
      referencia: briefing?.referencia || '',
      importante: briefing?.importante || '',
      observacoes: briefing?.observacoes || '',
    },
  });

  const onSubmit = (values: FormValues) => {
    if (isEditing && briefing) {
      updateBriefing({ id: briefing.id, data: values }, {
        onSuccess: () => onOpenChange(false),
      });
    } else {
      createBriefing({
        cliente: values.cliente,
        tema: values.tema,
        objetivo: values.objetivo,
        empreendimento_id: values.empreendimento_id || undefined,
        formato_peca: values.formato_peca,
        composicao: values.composicao,
        head_titulo: values.head_titulo,
        sub_complemento: values.sub_complemento,
        mensagem_chave: values.mensagem_chave,
        tom_comunicacao: values.tom_comunicacao,
        estilo_visual: values.estilo_visual,
        diretrizes_visuais: values.diretrizes_visuais,
        referencia: values.referencia,
        importante: values.importante,
        observacoes: values.observacoes,
      }, {
        onSuccess: () => {
          form.reset();
          onOpenChange(false);
        },
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Briefing' : 'Novo Briefing'}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Seção: Informações Básicas */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">Informações Básicas</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="cliente"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cliente *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome do cliente" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="empreendimento_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Empreendimento</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {empreendimentos.map((emp) => (
                              <SelectItem key={emp.id} value={emp.id}>
                                {emp.nome}
                              </SelectItem>
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
                  name="tema"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tema *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Campanha de lançamento, Post promocional..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="objetivo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Objetivo</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Qual o objetivo desta peça?" 
                          className="min-h-[80px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Seção: Formato e Composição */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">Formato e Composição</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="formato_peca"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Formato da Peça</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {FORMATO_PECA_OPTIONS.map((formato) => (
                              <SelectItem key={formato} value={formato}>
                                {formato}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="composicao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Composição</FormLabel>
                        <FormControl>
                          <Input placeholder="Dimensões, quantidade, etc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Seção: Conteúdo */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">Conteúdo</h3>
                <FormField
                  control={form.control}
                  name="head_titulo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Head / Título</FormLabel>
                      <FormControl>
                        <Input placeholder="Título principal da peça" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sub_complemento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sub / Complemento</FormLabel>
                      <FormControl>
                        <Input placeholder="Subtítulo ou texto complementar" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="mensagem_chave"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mensagem Chave</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Qual a mensagem principal que deve ser transmitida?"
                          className="min-h-[80px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Seção: Estilo e Tom */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">Estilo e Tom</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="tom_comunicacao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tom de Comunicação</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {TOM_COMUNICACAO_OPTIONS.map((tom) => (
                              <SelectItem key={tom} value={tom}>
                                {tom}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="estilo_visual"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estilo Visual</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {ESTILO_VISUAL_OPTIONS.map((estilo) => (
                              <SelectItem key={estilo} value={estilo}>
                                {estilo}
                              </SelectItem>
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
                  name="diretrizes_visuais"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Diretrizes Visuais</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Cores, elementos visuais, logotipos, etc."
                          className="min-h-[80px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Seção: Informações Adicionais */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">Informações Adicionais</h3>
                <FormField
                  control={form.control}
                  name="referencia"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Referência (texto)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Descrição de referências visuais"
                          className="min-h-[80px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Referências (imagens e links) - only for existing briefings */}
                {isEditing && briefing && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Imagens e Links de Referência</p>
                    <BriefingReferencias briefingId={briefing.id} />
                  </div>
                )}
                {!isEditing && (
                  <p className="text-xs text-muted-foreground">
                    Após salvar o briefing, você poderá adicionar imagens e links de referência.
                  </p>
                )}
                <FormField
                  control={form.control}
                  name="importante"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Importante</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Informações cruciais que não podem ser esquecidas"
                          className="min-h-[80px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="observacoes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Outras observações relevantes"
                          className="min-h-[80px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Criar Briefing'}
                </Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
