import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Phone, Users, MapPin, MessageSquare, CalendarIcon, ChevronDown, ChevronRight, ChevronLeft, Video, Handshake, PenTool, PackageCheck, GraduationCap, Briefcase } from 'lucide-react';
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
import { useClientes, useUpdateCliente } from '@/hooks/useClientes';
import { useCorretores } from '@/hooks/useCorretores';
import { useImobiliarias } from '@/hooks/useImobiliarias';
import { useEmpreendimentos } from '@/hooks/useEmpreendimentos';
import { useGestorEmpreendimentos } from '@/hooks/useGestorEmpreendimentos';
import { useGestoresProduto } from '@/hooks/useGestores';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/AuthContext';
import type { Atividade, AtividadeFormData, AtividadeTipo, AtividadeCategoria, AtividadeSubtipo } from '@/types/atividades.types';
import { ATIVIDADE_TIPO_LABELS, ATIVIDADE_CATEGORIA_LABELS, TIPOS_COM_SUBTIPO, ATIVIDADE_SUBTIPO_LABELS } from '@/types/atividades.types';
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
    subtipo: z.enum(['primeiro_atendimento', 'retorno']).optional(),
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
  gestorIds?: string[];
}

export interface AtividadeFormProps {
  initialData?: Atividade;
  onSubmit: (data: AtividadeFormSubmitData) => void;
  isLoading?: boolean;
  defaultClienteId?: string;
  lockCliente?: boolean;
  tiposPermitidos?: AtividadeTipo[];
}

export function AtividadeForm(props: AtividadeFormProps) {
  const { initialData, onSubmit, isLoading, defaultClienteId, lockCliente, tiposPermitidos } = props;
  const tiposVisiveis = tiposPermitidos || (Object.keys(ATIVIDADE_TIPO_LABELS) as AtividadeTipo[]);
  const { user } = useAuth();
  const { isSuperAdmin } = usePermissions();
  const { data: clientes = [] } = useClientes();
  const updateClienteMutation = useUpdateCliente();
  const { corretores } = useCorretores();
  const { imobiliarias } = useImobiliarias();
  const { data: todosEmpreendimentos = [] } = useEmpreendimentos();
  const { data: gestorData } = useGestorEmpreendimentos();
  const { data: gestores = [] } = useGestoresProduto();

  const [step, setStep] = useState<1 | 2>(1);
  const [atribuirParaGestores, setAtribuirParaGestores] = useState(false);
  const [todosGestores, setTodosGestores] = useState(false);
  const [gestoresSelecionados, setGestoresSelecionados] = useState<string[]>([]);

  const hasGestorEmpreendimentos = gestorData?.empreendimentos && gestorData.empreendimentos.length > 0;
  const empreendimentos = hasGestorEmpreendimentos 
    ? gestorData.empreendimentos 
    : todosEmpreendimentos;

  const clientesProspecto = clientes?.filter(c => 
    c.fase === 'prospecto' || c.fase === 'qualificado' || c.fase === 'negociando'
  ) || [];

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tipo: initialData?.tipo || (tiposPermitidos ? tiposPermitidos[0] : 'ligacao'),
      subtipo: (initialData?.subtipo as AtividadeSubtipo) || undefined,
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

  useEffect(() => {
    if (!initialData && defaultClienteId) {
      form.setValue('cliente_id', defaultClienteId);
    }
  }, [defaultClienteId, form, initialData]);

  const requerFollowup = form.watch('requer_followup');
  const clienteId = form.watch('cliente_id');
  const tipoAtual = form.watch('tipo');

  useEffect(() => {
    if (!clienteId) {
      form.setValue('temperatura_cliente', undefined);
    }
  }, [clienteId, form]);

  useEffect(() => {
    if (!TIPOS_COM_SUBTIPO.includes(tipoAtual)) {
      form.setValue('subtipo', undefined);
    }
  }, [tipoAtual, form]);

  useEffect(() => {
    if (!initialData && gestorData?.autoSelectedId) {
      form.setValue('empreendimento_id', gestorData.autoSelectedId);
    }
  }, [gestorData?.autoSelectedId, form, initialData]);

  const [stepErrors, setStepErrors] = useState<Record<string, boolean>>({});

  const handleNextStep = () => {
    const tipo = form.getValues('tipo');
    const categoria = form.getValues('categoria');
    const subtipo = form.getValues('subtipo');
    const errors: Record<string, boolean> = {};

    if (!tipo) errors.tipo = true;
    if (!categoria) errors.categoria = true;
    if (TIPOS_COM_SUBTIPO.includes(tipo) && !subtipo) errors.subtipo = true;

    if (Object.keys(errors).length > 0) {
      setStepErrors(errors);
      const missing: string[] = [];
      if (errors.tipo) missing.push('tipo');
      if (errors.subtipo) missing.push('classificação');
      if (errors.categoria) missing.push('categoria');
      toast.error(`Preencha: ${missing.join(', ')}`);
      return;
    }

    setStepErrors({});
    setStep(2);
  };

  const handleFormSubmit = (values: FormValues) => {
    const formData: AtividadeFormData = {
      tipo: values.tipo,
      subtipo: TIPOS_COM_SUBTIPO.includes(values.tipo) ? values.subtipo as AtividadeSubtipo : undefined,
      categoria: values.categoria as AtividadeCategoria,
      titulo: values.titulo,
      cliente_id: values.cliente_id || undefined,
      corretor_id: values.corretor_id || undefined,
      imobiliaria_id: values.imobiliaria_id || undefined,
      empreendimento_id: values.empreendimento_id || undefined,
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

    // Propagar temperatura para o cliente vinculado
    if (values.temperatura_cliente && values.cliente_id) {
      updateClienteMutation.mutate({
        id: values.cliente_id,
        data: { temperatura: values.temperatura_cliente as ClienteTemperatura },
      });
    }

    if (isSuperAdmin() && atribuirParaGestores && !initialData) {
      const gestorIds = todosGestores 
        ? gestores.map(g => g.id) 
        : gestoresSelecionados;
      
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
        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center gap-2 flex-1">
            <div className={cn(
              'flex items-center justify-center h-7 w-7 rounded-full text-xs font-semibold transition-colors',
              step === 1 ? 'bg-primary text-primary-foreground' : 'bg-primary/20 text-primary'
            )}>
              1
            </div>
            <span className={cn('text-sm', step === 1 ? 'font-medium text-foreground' : 'text-muted-foreground')}>
              Configuração
            </span>
          </div>
          <div className="h-px flex-1 bg-border" />
          <div className="flex items-center gap-2 flex-1">
            <div className={cn(
              'flex items-center justify-center h-7 w-7 rounded-full text-xs font-semibold transition-colors',
              step === 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            )}>
              2
            </div>
            <span className={cn('text-sm', step === 2 ? 'font-medium text-foreground' : 'text-muted-foreground')}>
              Detalhes
            </span>
          </div>
        </div>

        {/* ========== STEP 1 - Configuração ========== */}
        {step === 1 && (
          <div className="space-y-4">
            {/* Tipo de Atividade */}
            <FormField
              control={form.control}
              name="tipo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Atividade</FormLabel>
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                    {tiposVisiveis.map((tipo) => {
                      const Icon = TIPO_ICONS[tipo];
                      return (
                        <button
                          key={tipo}
                          type="button"
                          onClick={() => {
                            field.onChange(tipo);
                            setStepErrors(prev => ({ ...prev, tipo: false }));
                          }}
                          className={cn(
                            'flex flex-col items-center gap-1 p-3 rounded-lg border transition-colors',
                            field.value === tipo
                              ? 'border-primary bg-primary/10 text-primary'
                              : stepErrors.tipo
                                ? 'border-destructive hover:bg-accent'
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

            {/* Subtipo / Classificação - botões inline */}
            {TIPOS_COM_SUBTIPO.includes(tipoAtual) && (
              <FormField
                control={form.control}
                name="subtipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Classificação</FormLabel>
                    <div className="grid grid-cols-2 gap-2">
                      {(Object.entries(ATIVIDADE_SUBTIPO_LABELS) as [AtividadeSubtipo, string][]).map(([key, label]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            field.onChange(field.value === key ? undefined : key);
                            setStepErrors(prev => ({ ...prev, subtipo: false }));
                          }}
                          className={cn(
                            'flex items-center justify-center gap-2 p-3 rounded-lg border transition-colors text-sm',
                            field.value === key
                              ? 'border-primary bg-primary/10 text-primary font-medium'
                              : stepErrors.subtipo
                                ? 'border-destructive hover:bg-accent'
                                : 'border-input hover:bg-accent'
                          )}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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
                        onClick={() => {
                          field.onChange(cat);
                          setStepErrors(prev => ({ ...prev, categoria: false }));
                        }}
                        className={cn(
                          'flex items-center justify-center gap-2 p-3 rounded-lg border transition-colors text-sm',
                          field.value === cat
                            ? 'border-primary bg-primary/10 text-primary font-medium'
                            : stepErrors.categoria
                              ? 'border-destructive hover:bg-accent'
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

            {/* Atribuir para Gestores - Apenas Super Admin em modo criação */}
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

            {/* Botão Próximo */}
            <Button type="button" className="w-full" onClick={handleNextStep}>
              Próximo
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {/* ========== STEP 2 - Detalhes ========== */}
        {step === 2 && (
          <div className="space-y-4">
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

            {/* Datas e Horários */}
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

            {/* Horários */}
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

            {/* Prazo */}
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

            {/* Temperatura do Cliente */}
            {clienteId && (
              <FormField
                control={form.control}
                name="temperatura_cliente"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Temperatura do Cliente</FormLabel>
                    <div className="grid grid-cols-3 gap-2">
                      {([
                        { value: 'frio' as const, label: 'Frio', colors: 'border-blue-400 bg-blue-50 text-blue-700' },
                        { value: 'morno' as const, label: 'Morno', colors: 'border-orange-400 bg-orange-50 text-orange-700' },
                        { value: 'quente' as const, label: 'Quente', colors: 'border-red-400 bg-red-50 text-red-700' },
                      ]).map((temp) => (
                        <button
                          key={temp.value}
                          type="button"
                          onClick={() => field.onChange(field.value === temp.value ? undefined : temp.value)}
                          className={cn(
                            'flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-colors text-sm font-medium',
                            field.value === temp.value
                              ? temp.colors
                              : 'border-input hover:bg-accent'
                          )}
                        >
                          {temp.label}
                        </button>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Mais opções */}
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button type="button" variant="ghost" className="w-full justify-between text-muted-foreground">
                  <span>Mais opções</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-2">
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

            {/* Botões Voltar + Submit */}
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(1)}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading ? 'Salvando...' : initialData ? 'Atualizar Atividade' : 'Criar Atividade'}
              </Button>
            </div>
          </div>
        )}
      </form>
    </Form>
  );
}
