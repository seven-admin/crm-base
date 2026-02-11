import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Phone, Users, MapPin, MessageSquare, CalendarIcon, ChevronDown, Video, Handshake, PenTool, PackageCheck, GraduationCap, Briefcase } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useClientes } from '@/hooks/useClientes';
import { useCorretores } from '@/hooks/useCorretores';
import { useImobiliarias } from '@/hooks/useImobiliarias';
import { useEmpreendimentos } from '@/hooks/useEmpreendimentos';
import { useGestorEmpreendimentos } from '@/hooks/useGestorEmpreendimentos';
import { useGestoresProduto } from '@/hooks/useGestores';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/AuthContext';
import type { Atividade, AtividadeFormData, AtividadeTipo, AtividadeCategoria } from '@/types/atividades.types';
import { ATIVIDADE_TIPO_LABELS, ATIVIDADE_CATEGORIA_LABELS } from '@/types/atividades.types';
import { CLIENTE_TEMPERATURA_LABELS, type ClienteTemperatura } from '@/types/clientes.types';

const TIPO_ICONS: Record<AtividadeTipo, typeof Phone> = {
  ligacao: Phone,
  meeting: Video,
  reuniao: Users,
  visita: MapPin,
  atendimento: MessageSquare,
  fechamento: Handshake,
  assinatura: PenTool,
  acompanhamento: PackageCheck,
  treinamento: GraduationCap,
  administrativa: Briefcase,
};

const formSchema = z
  .object({
    tipo: z.enum(['ligacao', 'meeting', 'reuniao', 'visita', 'atendimento', 'fechamento', 'assinatura', 'acompanhamento', 'treinamento', 'administrativa']),
    categoria: z.enum(['seven', 'incorporadora', 'imobiliaria', 'cliente']),
    titulo: z.string().min(1, 'Título é obrigatório'),
    cliente_id: z.string().optional(),
    corretor_id: z.string().optional(),
    imobiliaria_id: z.string().optional(),
    empreendimento_id: z.string().optional(),
    data_inicio: z.date({ required_error: 'Data de início é obrigatória' }),
    data_fim: z.date({ required_error: 'Data de fim é obrigatória' }),
    hora_inicio: z.string().optional(),
    hora_fim: z.string().optional(),
    observacoes: z.string().optional(),
    temperatura_cliente: z.enum(['frio', 'morno', 'quente']).optional(),
    requer_followup: z.boolean().default(false),
    data_followup: z.date().optional(),
    deadline_date: z.date().optional(),
  })
  .superRefine((values, ctx) => {
    // Validar que data_fim >= data_inicio
    if (values.data_inicio && values.data_fim && values.data_fim < values.data_inicio) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['data_fim'],
        message: 'Data de fim deve ser igual ou posterior à data de início',
      });
    }
  });

type FormValues = z.infer<typeof formSchema>;

export interface AtividadeFormSubmitData {
  formData: AtividadeFormData;
  gestorIds?: string[]; // Se presente, criar para múltiplos gestores
}

export interface AtividadeFormProps {
  initialData?: Atividade;
  onSubmit: (data: AtividadeFormSubmitData) => void;
  isLoading?: boolean;
  defaultClienteId?: string;
  lockCliente?: boolean;
}

export function AtividadeForm(props: AtividadeFormProps) {
  const { initialData, onSubmit, isLoading, defaultClienteId, lockCliente } = props;
  const { user } = useAuth();
  const { isSuperAdmin } = usePermissions();
  const { data: clientes = [] } = useClientes();
  const { corretores } = useCorretores();
  const { imobiliarias } = useImobiliarias();
  const { data: todosEmpreendimentos = [] } = useEmpreendimentos();
  const { data: gestorData } = useGestorEmpreendimentos();
  const { data: gestores = [] } = useGestoresProduto();

  const [atribuirParaGestores, setAtribuirParaGestores] = useState(false);
  const [todosGestores, setTodosGestores] = useState(false);
  const [gestoresSelecionados, setGestoresSelecionados] = useState<string[]>([]);

  // Determinar lista de empreendimentos a exibir
  const hasGestorEmpreendimentos = gestorData?.empreendimentos && gestorData.empreendimentos.length > 0;
  const empreendimentos = hasGestorEmpreendimentos 
    ? gestorData.empreendimentos 
    : todosEmpreendimentos;

  // Filtrar apenas clientes em fase de prospecção/qualificação
  const clientesProspecto = clientes?.filter(c => 
    c.fase === 'prospecto' || c.fase === 'qualificado' || c.fase === 'negociando'
  ) || [];

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tipo: initialData?.tipo || 'ligacao',
      categoria: (initialData?.categoria as AtividadeCategoria) || 'seven',
      titulo: initialData?.titulo || '',
      cliente_id: initialData?.cliente_id || defaultClienteId || undefined,
      corretor_id: initialData?.corretor_id || undefined,
      imobiliaria_id: initialData?.imobiliaria_id || undefined,
      empreendimento_id: initialData?.empreendimento_id || undefined,
      data_inicio: initialData ? new Date(`${initialData.data_inicio}T00:00:00`) : new Date(),
      data_fim: initialData ? new Date(`${initialData.data_fim}T00:00:00`) : new Date(),
      hora_inicio: initialData?.hora_inicio?.substring(0, 5) || '',
      hora_fim: initialData?.hora_fim?.substring(0, 5) || '',
      observacoes: initialData?.observacoes || '',
      temperatura_cliente: initialData?.temperatura_cliente || undefined,
      requer_followup: initialData?.requer_followup || false,
      data_followup: initialData?.data_followup ? new Date(initialData.data_followup) : undefined,
      deadline_date: initialData?.deadline_date ? new Date(initialData.deadline_date) : undefined,
    },
  });

  // Se abriu o formulário já vinculado a um cliente (ex.: histórico do cliente),
  // garantir que o valor fique fixo mesmo se o form re-renderizar.
  useEffect(() => {
    if (!initialData && defaultClienteId) {
      form.setValue('cliente_id', defaultClienteId);
    }
  }, [defaultClienteId, form, initialData]);

  const requerFollowup = form.watch('requer_followup');
  const clienteId = form.watch('cliente_id');

  const tipoAtual = form.watch('tipo');

  // Se remover o cliente, limpa temperatura; se mudar tipo != reuniao, limpa categoria
  useEffect(() => {
    if (!clienteId) {
      form.setValue('temperatura_cliente', undefined);
    }
  }, [clienteId, form]);


  // Auto-selecionar empreendimento quando gestor tem apenas 1 vinculado
  useEffect(() => {
    if (!initialData && gestorData?.autoSelectedId) {
      form.setValue('empreendimento_id', gestorData.autoSelectedId);
    }
  }, [gestorData?.autoSelectedId, form, initialData]);

  const handleFormSubmit = (values: FormValues) => {
    const formData: AtividadeFormData = {
      tipo: values.tipo,
      categoria: values.categoria as AtividadeCategoria,
      titulo: values.titulo,
      cliente_id: values.cliente_id || undefined,
      corretor_id: values.corretor_id || undefined,
      imobiliaria_id: values.imobiliaria_id || undefined,
      empreendimento_id: values.empreendimento_id || undefined,
      // gestor_id só é definido na CRIAÇÃO - nunca no update (imutável)
      ...(initialData ? {} : { gestor_id: user?.id }),
      data_inicio: format(values.data_inicio, 'yyyy-MM-dd'),
      data_fim: format(values.data_fim, 'yyyy-MM-dd'),
      hora_inicio: values.hora_inicio || undefined,
      hora_fim: values.hora_fim || undefined,
      observacoes: values.observacoes || undefined,
      temperatura_cliente: values.temperatura_cliente as ClienteTemperatura | undefined,
      requer_followup: values.requer_followup,
      data_followup: values.data_followup?.toISOString(),
      deadline_date: values.deadline_date ? format(values.deadline_date, 'yyyy-MM-dd') : undefined,
    };

    // Se super-admin ativou atribuição para gestores
    if (isSuperAdmin() && atribuirParaGestores && !initialData) {
      const gestorIds = todosGestores 
        ? gestores.map(g => g.id) 
        : gestoresSelecionados;
      
      // Validar que pelo menos um gestor foi selecionado
      if (gestorIds.length === 0) {
        toast.error('Selecione pelo menos um gestor para atribuir a atividade');
        return;
      }
      
      onSubmit({ formData, gestorIds });
    } else {
      onSubmit({ formData });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* Tipo de Atividade */}
        <FormField
          control={form.control}
          name="tipo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Atividade</FormLabel>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                {(Object.keys(ATIVIDADE_TIPO_LABELS) as AtividadeTipo[]).map((tipo) => {
                  const Icon = TIPO_ICONS[tipo];
                  return (
                    <button
                      key={tipo}
                      type="button"
                      onClick={() => field.onChange(tipo)}
                      className={cn(
                        'flex flex-col items-center gap-1 p-3 rounded-lg border transition-colors',
                        field.value === tipo
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-input hover:bg-accent'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-xs">{ATIVIDADE_TIPO_LABELS[tipo]}</span>
                    </button>
                  );
                })}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Categoria */}
        <FormField
          control={form.control}
          name="categoria"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria</FormLabel>
              <div className="grid grid-cols-4 gap-2">
                {(Object.keys(ATIVIDADE_CATEGORIA_LABELS) as AtividadeCategoria[]).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => field.onChange(cat)}
                    className={cn(
                      'flex items-center justify-center gap-2 p-3 rounded-lg border transition-colors text-sm',
                      field.value === cat
                        ? 'border-primary bg-primary/10 text-primary font-medium'
                        : 'border-input hover:bg-accent'
                    )}
                  >
                    {ATIVIDADE_CATEGORIA_LABELS[cat]}
                  </button>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Título */}
        <FormField
          control={form.control}
          name="titulo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título</FormLabel>
              <FormControl>
                <Input placeholder="Descreva a atividade..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Seção Atribuir para Gestores - Apenas Super Admin em modo criação */}
        {isSuperAdmin() && !initialData && gestores.length > 0 && (
          <Card className="p-4 bg-muted/30 border-primary/20">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-semibold">Atribuir para Gestores de Produto</Label>
                  <p className="text-sm text-muted-foreground">
                    Criar esta atividade para um ou mais gestores
                  </p>
                </div>
                <Switch
                  checked={atribuirParaGestores}
                  onCheckedChange={setAtribuirParaGestores}
                />
              </div>

              {atribuirParaGestores && (
                <div className="space-y-3 pt-2 border-t">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="todos-gestores"
                      checked={todosGestores}
                      onCheckedChange={(checked) => {
                        setTodosGestores(checked === true);
                        if (checked) {
                          setGestoresSelecionados([]);
                        }
                      }}
                    />
                    <Label htmlFor="todos-gestores" className="cursor-pointer font-medium">
                      Todos os Gestores ({gestores.length})
                    </Label>
                  </div>

                  {!todosGestores && (
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">
                        Selecione os gestores individualmente:
                      </Label>
                      <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto p-2 border rounded-md bg-background">
                        {gestores.map((gestor) => (
                          <div key={gestor.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`gestor-${gestor.id}`}
                              checked={gestoresSelecionados.includes(gestor.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setGestoresSelecionados([...gestoresSelecionados, gestor.id]);
                                } else {
                                  setGestoresSelecionados(
                                    gestoresSelecionados.filter((id) => id !== gestor.id)
                                  );
                                }
                              }}
                            />
                            <Label
                              htmlFor={`gestor-${gestor.id}`}
                              className="cursor-pointer text-sm flex-1"
                            >
                              {gestor.full_name}
                              <span className="text-xs text-muted-foreground ml-2">
                                ({gestor.email})
                              </span>
                            </Label>
                          </div>
                        ))}
                      </div>
                      {!todosGestores && gestoresSelecionados.length === 0 && (
                        <p className="text-xs text-destructive">
                          Selecione pelo menos um gestor
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Datas e Horários: Início e Fim */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="data_inicio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de Início</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(field.value, 'dd/MM/yyyy') : 'Selecione'}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => {
                        field.onChange(date);
                        // Se data_fim é anterior, ajusta para mesma data
                        const dataFim = form.getValues('data_fim');
                        if (date && dataFim && date > dataFim) {
                          form.setValue('data_fim', date);
                        }
                      }}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="data_fim"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de Fim</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(field.value, 'dd/MM/yyyy') : 'Selecione'}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => {
                        const dataInicio = form.getValues('data_inicio');
                        return dataInicio ? date < dataInicio : false;
                      }}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Horários (opcionais) */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="hora_inicio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hora de Início (opcional)</FormLabel>
                <FormControl>
                  <Input type="time" placeholder="--:--" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="hora_fim"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hora de Fim (opcional)</FormLabel>
                <FormControl>
                  <Input type="time" placeholder="--:--" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Prazo (deadline) */}
        <FormField
          control={form.control}
          name="deadline_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prazo (opcional)</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !field.value && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? format(field.value, 'dd/MM/yyyy') : 'Definir prazo'}
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Cliente */}
        <FormField
          control={form.control}
          name="cliente_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cliente (opcional)</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={!!lockCliente}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {clientesProspecto.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Empreendimento */}
        <FormField
          control={form.control}
          name="empreendimento_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Empreendimento
                {hasGestorEmpreendimentos && empreendimentos.length === 1 && (
                  <span className="ml-2 text-xs text-muted-foreground">(auto-selecionado)</span>
                )}
              </FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um empreendimento" />
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

        {/* Temperatura do Cliente - Só mostrar quando cliente selecionado */}
        {clienteId && (
          <FormField
            control={form.control}
            name="temperatura_cliente"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Temperatura do Cliente</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a temperatura" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(Object.keys(CLIENTE_TEMPERATURA_LABELS) as ClienteTemperatura[]).map((temp) => (
                      <SelectItem key={temp} value={temp}>
                        {CLIENTE_TEMPERATURA_LABELS[temp]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Seção Colapsável - Mais opções */}
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button type="button" variant="ghost" className="w-full justify-between text-muted-foreground">
              <span>Mais opções</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-2">
            {/* Corretor e Imobiliária */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="corretor_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Corretor</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {corretores.map((corretor) => (
                          <SelectItem key={corretor.id} value={corretor.id}>
                            {corretor.nome_completo}
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
                name="imobiliaria_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Imobiliária</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {imobiliarias.map((imob) => (
                          <SelectItem key={imob.id} value={imob.id}>
                            {imob.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Observações */}
            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Adicione observações sobre a atividade..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CollapsibleContent>
        </Collapsible>

        {/* Follow-up */}
        <div className="space-y-3">
          <FormField
            control={form.control}
            name="requer_followup"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <FormLabel className="text-base">Requer Follow-up</FormLabel>
                  <p className="text-sm text-muted-foreground">
                    Agendar lembrete para acompanhamento
                  </p>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          {requerFollowup && (
            <FormField
              control={form.control}
              name="data_followup"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data do Follow-up</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full justify-start text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, 'dd/MM/yyyy') : 'Selecione'}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Salvando...' : initialData ? 'Atualizar Atividade' : 'Criar Atividade'}
        </Button>
      </form>
    </Form>
  );
}
